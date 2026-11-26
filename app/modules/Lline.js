function Module() {
    this.sp = null;
    this.sensorTypes = {
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        PWM: 3,
        SERVO_PIN: 4,
        TONE: 5,
        PULSEIN: 6,
        ULTRASONIC: 7,
        TIMER: 8,
        METRIX: 9,
        // 10은 비어있음
        METRIXCLEAR: 11,
        METRIXROWCOLCLEAR: 12,
        METRIXDRAW: 13,
        NEOPIXEL: 14,
        NEOPIXELCLEAR: 15,
        NEOPIXELINIT: 16,
        NEOPIXELRAINBOW: 17,
        NEOPIXELEACH: 18,

        LCDINIT: 19,
        LCD_BACKLIGHT:20,
        LCD: 21,
        LCDCLEAR: 22,


        TEMPCHECK: 23,
        HUMICHECK: 24,
    
        // Stepper Motor 관련 추가
        STEPPER_INIT: 25,       // steps & pin 설정
        STEPPER_SPEED: 26,      // 속도 설정
        STEPPER_STEP: 27,       // 회전
        STEPPER_STOP: 28,        // 정지

        IR: 29,  // 적외선센서
        
        COLOR_SENSOR_INIT: 30,
        COLOR_SENSOR: 31,
        
        DC_MOTOR_INIT: 32,
        DC_MOTOR_CONTROL: 33,

        DC_MOTOR_INIT2: 40,
        DC_MOTOR_CONTROL2: 41,


        HC06_INIT: 34,
        HC06_SEND: 35,
        HC06_RECEIVE: 36,

        HM10_INIT: 37,
        HM10_SEND: 38,
        HM10_RECEIVE: 39,
    };

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3,
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
    };

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.sensorData = {
        ULTRASONIC: 0,
        DIGITAL: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 0,
            '12': 0,
            '13': 0,
        },
        ANALOG: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
        },
        PULSEIN: {},
        TIMER: 0,
        TEMPCHECK: 0,
        HUMICHECK: 0,
        IR: 0,
        HC06_RECEIVE:'',
        HM10_RECEIVE:'',

        COLOR: { R: 0, G: 0, B: 0 },
        
    };

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

var sensorIdx = 0;

Module.prototype.init = function(handler, config) {};

Module.prototype.setSerialPort = function(sp) {
    var self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    return true
    // return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
    // 이후에 체크 로직 개선되면 처리
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
};

Module.prototype.afterConnect = function(that, cb) {
    that.connected = true;
    if (cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

// 엔트리로 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
    var self = this;
    if (!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach(function(key) {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
};

//엔트리 -> 아두이노로 처리
Module.prototype.handleRemoteData = function(handler) {
    var self = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET') || this.defaultOutput;
    var time = handler.read('TIME');
    var buffer = new Buffer([]);
    var sensorTypes = this.sensorTypes;


    if (getDatas) {
        // console.log('[GET Raw 데이터 수신]', JSON.stringify(getDatas, null, 2));
        var keys = Object.keys(getDatas);
        keys.forEach(function(key) {
            var isSend = false;
            var dataObj = getDatas[key];
            if (
                typeof dataObj.port === 'string' ||
                typeof dataObj.port === 'number'
            ) {
                var time = self.digitalPortTimeList[dataObj.port];
                if (dataObj.time > time) {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } else if (Array.isArray(dataObj.port)) {
                isSend = dataObj.port.every(function(port) {
                    var time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if (isSend) {
                    dataObj.port.forEach(function(port) {
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if (isSend) {
                if (!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data,
                    };
                    buffer = Buffer.concat([
                        buffer,
                        self.makeSensorReadBuffer(
                            key,
                            dataObj.port,
                            dataObj.data
                        ),
                    ]);
                }
            }
        });
    }

    if (setDatas) {
        // 🔍 디버깅: setDatas 전체 출력
        // console.log('[SET Raw 데이터 수신]', JSON.stringify(setDatas, null, 2));

        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function(port) {
            var data = setDatas[port];
            if (data) {
                if ((data.type === sensorTypes.STEPPER_INIT || data.type === sensorTypes.STEPPER_SPEED || data.type === sensorTypes.STEPPER_STEP ||  data.type === sensorTypes.DC_MOTOR_INIT2 ||  data.type === sensorTypes.DC_MOTOR_CONTROL2 || data.STEPPER_STOP ||  data.type === sensorTypes.DC_MOTOR_INIT ||  data.type === sensorTypes.DC_MOTOR_CONTROL ||data.type === sensorTypes.COLOR_SENSOR_INIT ) && data.data === 0 ) {
                // console.warn('⛔ [PAUSE] ignore');
                return;
                }

                



                if (self.digitalPortTimeList[port] < data.time) {
                    self.digitalPortTimeList[port] = data.time;

                    if (!self.isRecentData(port, data.type, data.data)) {
                        self.recentCheckData[port] = {
                            type: data.type,
                            data: data.data,
                        };
                        buffer = Buffer.concat([
                            buffer,
                            self.makeOutputBuffer(data.type, port, data.data),
                        ]);
                    }
                }
            }
        });
    }


    if (buffer.length) {
        this.sendBuffers.push(buffer);
    }
};



Module.prototype.isRecentData = function(port, type, data) {
    var that = this;
    var isRecent = false;

    if(type == this.sensorTypes.ULTRASONIC) {
        var portString = port.toString();
        var isGarbageClear = false;
        Object.keys(this.recentCheckData).forEach(function (key) {
            var recent = that.recentCheckData[key];
            if(key === portString) {
                
            }
            if(key !== portString && recent.type == that.sensorTypes.ULTRASONIC) {
                delete that.recentCheckData[key];
                isGarbageClear = true;
            }
        });

        if((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
            isRecent = false;
        } else {
            isRecent = true;
        }


        
    }
    
    
    // TEMPCHECK 처리 (이전 포트와 같으면 중복 전송 방지)
    else if (type == this.sensorTypes.TEMPCHECK) {
        // console.log('port in this.recentCheckData',port in this.recentCheckData);
        // console.log('this.recentCheckData[port].type', this.recentCheckData[port]?.type);
        // console.log('type', type);
        // console.log('port.toString()', port.toString());

        var portStr = port.toString();

        if (
            port in this.recentCheckData &&
            this.recentCheckData[portStr]?.type === type
        ) {
            isRecent = true; // 이전에 보낸 것과 같으면 중복 전송 방지
        } else {
            isRecent = false; // 이전 포트와 다르면 전송 허용
            
            
        }
    }

    // TEMPCHECK 처리 (이전 포트와 같으면 중복 전송 방지)
    else if (type == this.sensorTypes.HUMICHECK) {
        // console.log('port in this.recentCheckData',port in this.recentCheckData);
        // console.log('this.recentCheckData[port].type', this.recentCheckData[port]?.type);
        // console.log('type', type);
        // console.log('port.toString()', port.toString());

        var portStr = port.toString();

        if (
            port in this.recentCheckData &&
            this.recentCheckData[portStr]?.type === type
        ) {
            isRecent = true; // 이전에 보낸 것과 같으면 중복 전송 방지
        } else {
            isRecent = false; // 이전 포트와 다르면 전송 허용
            
            
        }
    }





    else if (port in this.recentCheckData && type != this.sensorTypes.TONE) {
        if (
            this.recentCheckData[port].type === type &&
            this.recentCheckData[port].data === data
        ) {
            isRecent = true;
        }
    }




    return isRecent;
};

Module.prototype.requestLocalData = function() {
    var self = this;

    if (!this.isDraing && this.sendBuffers.length > 0) {
        this.isDraing = true;

        const bufferToSend = this.sendBuffers.shift();

        if (bufferToSend) {
            console.log('[Outgoing to Arduino] Send buffer:', bufferToSend);
            console.log('[Outgoing to Arduino HEX] ' + bufferToSend.toString('hex'));
            console.log('[Outgoing to Arduino Array]', [...bufferToSend]);

            this.sp.write(bufferToSend, function() {
                if (self.sp) {
                    self.sp.drain(function() {
                        self.isDraing = false;
                    });
                }
            });
        } else {
            self.isDraing = false;  // 예외 처리
        }
    }

    return null;
};


 // 하드웨어에서 온 데이터 처리 로직
/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    console.log('[Raw handleLocalData] Incoming data buffer:', data);
    var self = this;
    var datas = this.getDataByBuffer(data);
    
    
    datas.forEach(function(data) {
        if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
        var readData = data.subarray(2, data.length);
        var type = readData[readData.length - 1];
        var port = readData[readData.length - 2];
        

        if ((type === self.sensorTypes.COLOR_SENSOR)) {
            console.log('[Raw handleLocalData] Incoming data buffer:', data);
            console.log('[Raw handleLocalData] Incoming data buffer:', readData[1]);
        }


        if ((type === self.sensorTypes.HC06_RECEIVE)) {
            console.log('[data] :', data);
            console.log('[RreadData[1]] :', readData[1]);
        }


        // console.log('[Raw handleLocalData] Incoming data buffer:', data);
        var value;
        switch (readData[1]) { //길이
            case self.sensorValueSize.FLOAT: {
                value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                value = Math.round(value * 100) / 100;
                break;
            }
            case self.sensorValueSize.SHORT: {
                value = new Buffer(readData.subarray(2, 4)).readUInt16LE();  // 부호 없음

                if ((type === self.sensorTypes.COLOR_SENSOR))
                    console.log('[short_value] Incoming data buffer:', value);
                break;
            }

            case 9: { //hc06
                const strLen = readData[2];
                const strBytes = readData.subarray(3, 3 + strLen);
                value = Buffer.from(strBytes).toString('utf8');
                console.log('[bluetooth_string]:', value);
                console.log('[bluetooth_string_TYPE]:', type);
                break;
            }

        

            default: {
                value = 0;
                break;
            }
        }

        

        

        
        switch (type) {
            case self.sensorTypes.DIGITAL: {
                self.sensorData.DIGITAL[port] = value;
                break;
            }
            case self.sensorTypes.ANALOG: {
                self.sensorData.ANALOG[port] = value;
                break;
            }
            case self.sensorTypes.PULSEIN: {
                self.sensorData.PULSEIN[port] = value;
                break;
            }
            case self.sensorTypes.COLOR_SENSOR: {
                
                const colorIndex = port;  // 예: 0=R, 1=G, 2=B
                if (colorIndex === 0) self.sensorData.COLOR.R = value;
                else if (colorIndex === 1) self.sensorData.COLOR.G = value;
                else if (colorIndex === 2) self.sensorData.COLOR.B = value;
                console.log('[final value] Incoming data buffer:',self.sensorData.COLOR);
                
                break;
            }

            case self.sensorTypes.ULTRASONIC: {
                self.sensorData.ULTRASONIC = value;
                console.log('[final value] Incoming data buffer:',self.sensorData.ULTRASONIC);
                break;
            }
            case self.sensorTypes.TIMER: {
                self.sensorData.TIMER = value;
                break;
            }
            case self.sensorTypes.TEMPCHECK: {
                self.sensorData.TEMPCHECK = value;
                console.log('[TEMP]:',self.sensorData.TEMPCHECK );
                break;
            }

            case self.sensorTypes.HUMICHECK: {
                self.sensorData.HUMICHECK = value;
                console.log('[HUMI]:',self.sensorData.HUMICHECK );
                break;
            }

            case self.sensorTypes.IR: {
                self.sensorData.IR = value;
                console.log('[IR]:',self.sensorData.IR );
                break;
            }

            case self.sensorTypes.HC06_RECEIVE: {
                self.sensorData.HC06_RECEIVE = value;
                console.log('[HC06_RECEIVE]:',self.sensorData.HC06_RECEIVE );
                break;
            }

            case self.sensorTypes.HM10_RECEIVE: {
                self.sensorData.HM10_RECEIVE = value;
                console.log('[HM10_RECEIVE]:',self.sensorData.HM10_RECEIVE );
                break;
            }
            
            

            default: {
                break;
            }
        }
        
    });
};

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    var buffer;
    var dummy = new Buffer([10]);
    // console.log('[makesensor!]');

    if (device == this.sensorTypes.ULTRASONIC) {
        buffer = new Buffer([
            255,
            85,
            5,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port[0],
            port[1],
            10,
        ]);
    } else if (device == this.sensorTypes.TEMPCHECK)  {
        buffer = new Buffer([
            255,
            85,
            4,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);


    } 

    else if (device == this.sensorTypes.HUMICHECK)  {
        buffer = new Buffer([
            255,
            85,
            4,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);
    }

    else if (device == this.sensorTypes.IR)  {
        buffer = new Buffer([
            255,
            85,
            4,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);


    } 


    
    else if (device == this.sensorTypes.COLOR_SENSOR) {
        buffer = new Buffer([
            255,
            85,
            5,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            data, 
            10,
        ]);
    }
    
    
    
    else if (!data) {
        buffer = new Buffer([
            255,
            85,
            5,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);
    } else {
        value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([
            255,
            85,
            7,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);
        buffer = Buffer.concat([buffer, value, dummy]);
    }
    sensorIdx++;
    if (sensorIdx > 254) {
        sensorIdx = 0;
    }

    return buffer;
};

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function(device, port, data) {
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);

    // console.log('아웃풋버퍼는 실행되냐:', {
    //             device,
    //             port,
    //             data,
    //         });

    switch (device) {
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: 
        case this.sensorTypes.METRIXCLEAR:
        case this.sensorTypes.METRIXDRAW:
        case this.sensorTypes.NEOPIXELCLEAR:
        case this.sensorTypes.NEOPIXELRAINBOW:
        case this.sensorTypes.LCDCLEAR:
        {
            value.writeInt16LE(data);

            buffer = new Buffer([
                255,
                85,
                6,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.METRIX: 
        case this.sensorTypes.METRIXROWCOLCLEAR:
        {
            const value1 = new Buffer(2);
            const value2 = new Buffer(2);
            if ($.isPlainObject(data)) {
                value1.writeInt16LE(data.value1);
                value2.writeInt16LE(data.value2);
            } else {
                value1.writeInt16LE(0);
                value2.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                8,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value1, value2, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXELINIT:
        {
            const neoCount = new Buffer(2);
            var bright = new Buffer(2);
            
            if ($.isPlainObject(data)) {
                neoCount.writeInt16LE(data.value1);
                bright.writeInt16LE(data.value2);
            } else {
                neoCount.writeInt16LE(0);
                bright.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                8,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, neoCount, bright, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXEL:
        {
            //var count_value = new Buffer(2);
            const rValue = new Buffer(2);
            const gValue = new Buffer(2);
            const bValue = new Buffer(2);
            
            if ($.isPlainObject(data)) {
               // count_value.writeInt16LE(data.count);
                rValue.writeInt16LE(data.R_val);
                gValue.writeInt16LE(data.G_val);
                bValue.writeInt16LE(data.B_val);
            } else {
                //count_value.writeInt16LE(0);
                rValue.writeInt16LE(0);
                gValue.writeInt16LE(0);
                bValue.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                10,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, rValue, gValue, bValue, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXELEACH:
        {
            const cntValue = new Buffer(2);
            const rVal = new Buffer(2);
            const gVal = new Buffer(2);
            const bVal = new Buffer(2);
            
            if ($.isPlainObject(data)) {
                cntValue.writeInt16LE(data.CNT_val);
                rVal.writeInt16LE(data.R_val);
                gVal.writeInt16LE(data.G_val);
                bVal.writeInt16LE(data.B_val);
            } else {
                cntValue.writeInt16LE(0);
                rVal.writeInt16LE(0);
                gVal.writeInt16LE(0);
                bVal.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                12,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, cntValue, rVal, gVal, bVal, dummy]);
            break;
        }
        case this.sensorTypes.LCDINIT:
        {   
            const listVal = new Buffer(2);

            if ($.isPlainObject(data)) {
                listVal.writeInt16LE(data.list);
            } else {
                listVal.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                6,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);

            buffer = Buffer.concat([buffer, listVal, dummy]);
           
            break;
        }
        case this.sensorTypes.LCD:
        {
            const rowValue = new Buffer(2);
            const colValue = new Buffer(2);
            const val = new Buffer(2);
            let textLen = 0;
            let text;
            
            if ($.isPlainObject(data)) {
                textLen = ('' + `${data.value}`).length;
                text = Buffer.from('' + `${data.value}`, 'ascii');
                rowValue.writeInt16LE(data.row);
                colValue.writeInt16LE(data.col);
                val.writeInt16LE(textLen);
            } else {
                rowValue.writeInt16LE(0);
                colValue.writeInt16LE(0);

                textLen = 0;
                text = Buffer.from('', 'ascii');
                val.writeInt16LE(textLen);
            }

            buffer = new Buffer([
                255,
                85,
                10 + textLen,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            
            buffer = Buffer.concat([buffer, rowValue, colValue, val, text, dummy]);
            break;
        }
        case this.sensorTypes.LCD_BACKLIGHT: {
            // console.log('🟢 LCD_BACKLIGHT 수신:', {
            //     device,
            //     port,
            //     data,
            // });

            value.writeInt16LE(data);  // data는 0 또는 1
            buffer = new Buffer([
                255,
                85,
                6,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }






        case this.sensorTypes.NEOPIXELEACH:{
            var cnt_value = new Buffer(2);
            var r_value = new Buffer(2);
            var g_value = new Buffer(2);
            var b_value = new Buffer(2);
            
            if ($.isPlainObject(data)) {
                cnt_value.writeInt16LE(data.CNT_val);
                r_value.writeInt16LE(data.R_val);
                g_value.writeInt16LE(data.G_val);
                b_value.writeInt16LE(data.B_val);
            } else {
                cnt_value.writeInt16LE(0);
                r_value.writeInt16LE(0);
                g_value.writeInt16LE(0);
                b_value.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                10,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, cnt_value, r_value, g_value, b_value, dummy]);
            break;
        }
        case this.sensorTypes.TONE: {
            var time = new Buffer(2);
            if ($.isPlainObject(data)) {
                value.writeInt16LE(data.value);
                time.writeInt16LE(data.duration);
            } else {
                value.writeInt16LE(0);
                time.writeInt16LE(0);
            }
            buffer = new Buffer([
                255,
                85,
                8,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        }

        case this.sensorTypes.STEPPER_INIT: {
            // ✅ 잘못된 초기화 요청 필터링
            if (
                typeof data !== 'object' ||
                typeof data.steps !== 'number' ||
                !Array.isArray(data.pins) || data.pins.length !== 4
            ) {
                console.warn('⚠️ [STEPPER_INIT] 무효한 초기화 요청 무시됨:', data);
                break; // 아무 것도 하지 않음
            }

            const steps = data.steps;
            const pins = data.pins;

            // console.log('✅ [STEPPER_INIT] 초기화 전송:', { steps, pins, sensorIdx });

            const value = Buffer.alloc(2);
            value.writeInt16LE(steps);

            buffer = Buffer.from([
                255,
                85,
                10,
                sensorIdx,
                this.actionTypes.SET,
                this.sensorTypes.STEPPER_INIT,
                port,
                ...value,
                ...pins,
                10,
            ]);
            break;
        }


        case this.sensorTypes.STEPPER_SPEED: {
            if (typeof data !== 'object' || typeof data.speed !== 'number') {
                console.warn('⚠️ [STEPPER_SPEED] 무효한 속도 설정 요청 무시됨:', data);
                break;
            }

            const speed = data.speed;

            const value = Buffer.alloc(2);
            value.writeInt16LE(speed);

            buffer = Buffer.from([
                255, 85, 6, sensorIdx,
                this.actionTypes.SET,
                this.sensorTypes.STEPPER_SPEED,
                port,
                ...value,
                10,
            ]);
            break;
        }


        case this.sensorTypes.STEPPER_STEP: {
            if (typeof data !== 'object' || typeof data.step !== 'number') {
                console.warn('⚠️ [STEPPER_STEP] 무효한 스탭 설정 요청 무시됨:', data);
                break;
            }

            const step = data.step;

            const value = Buffer.alloc(2);
            value.writeInt16LE(step);

            buffer = Buffer.from([
                255, 85, 6, sensorIdx,
                this.actionTypes.SET,
                this.sensorTypes.STEPPER_STEP,
                port,
                ...value,
                10,
            ]);
            break;
        }

        case this.sensorTypes.STEPPER_STOP: {
        
            buffer = new Buffer([
                255,
                85,
                6,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
                0,
                0,
                10
            ]);
            
            break;
        }


        case this.sensorTypes.DC_MOTOR_INIT: {
            console.warn('11111111111111111');
            if (
                typeof data !== 'object' ||
                typeof data.ena !== 'number' ||
                typeof data.a1a !== 'number' ||
                typeof data.a1b !== 'number'
            ) {
                console.warn('⚠️ [DC_MOTOR_INIT] 무효한 초기화 요청 무시됨:', data);
                break;
            }

            const ena = data.ena;
            const a1a = data.a1a;
            const a1b = data.a1b;

            // console.log('✅ [DC_MOTOR_INIT] 초기화 전송:', { ena, a1a, a1b, sensorIdx });

            buffer = Buffer.from([
                255,
                85,
                7,           // 길이 (type 1 + data 3개 + end 1)
                sensorIdx,   // 포트 또는 ID
                this.actionTypes.SET,
                this.sensorTypes.DC_MOTOR_INIT,
                port,
                ena,
                a1a,
                a1b,
                10           // 종료 바이트
            ]);
            break;
        }

        case this.sensorTypes.DC_MOTOR_INIT2: {
            console.warn('11111111111111111');
            if (
                typeof data !== 'object' ||
                typeof data.enb !== 'number' ||
                typeof data.b1a !== 'number' ||
                typeof data.b1b !== 'number'
            ) {
                console.warn('⚠️ [DC_MOTOR_INIT] 무효한 초기화 요청 무시됨:', data);
                break;
            }

            const enb = data.enb;
            const b1a = data.b1a;
            const b1b = data.b1b;

            // console.log('✅ [DC_MOTOR_INIT] 초기화 전송:', { ena, a1a, a1b, sensorIdx });

            buffer = Buffer.from([
                255,
                85,
                7,           // 길이 (type 1 + data 3개 + end 1)
                sensorIdx,   // 포트 또는 ID
                this.actionTypes.SET,
                this.sensorTypes.DC_MOTOR_INIT2,
                port,
                enb,
                b1a,
                b1b,
                10           // 종료 바이트
            ]);
            break;
        }

        
        case this.sensorTypes.DC_MOTOR_CONTROL: {
            if (
                typeof data !== 'object' ||
                typeof data.speedA !== 'number' ||
                typeof data.dirA !== 'string'
            ) {
                console.warn('⚠️ [DC_MOTOR_CONTROL] 무효한 제어 요청 무시됨:', data);
                break;
            }

            const dirMap = {
                'FORWARD': 1,
                'BACKWARD': 2,
                'STOP': 0,
            };

            const direction = dirMap[data.dirA];
            const speed = Math.min(Math.max(data.speedA, 0), 255);  // Clamp speed to 0~255

            if (direction === undefined) {
                // console.warn('⚠️ [DC_MOTOR_CONTROL] 유효하지 않은 방향:', data.dirA);
                break;
            }

            // console.log('✅ [DC_MOTOR_CONTROL] 제어 전송:', { direction, speed, sensorIdx });

            buffer = Buffer.from([
                255,
                85,
                6,               // 길이: type(1) + dir(1) + speed(1) + end(1) = 4 + header(2)
                sensorIdx,
                this.actionTypes.SET,
                this.sensorTypes.DC_MOTOR_CONTROL,
                port,
                direction,
                speed,
                10
            ]);
            break;
        }


        case this.sensorTypes.DC_MOTOR_CONTROL2: {
            if (
                typeof data !== 'object' ||
                typeof data.speedB !== 'number' ||
                typeof data.dirB !== 'string'
            ) {
                console.warn('⚠️ [DC_MOTOR_CONTROL] 무효한 제어 요청 무시됨:', data);
                break;
            }

            const dirMap = {
                'FORWARD': 1,
                'BACKWARD': 2,
                'STOP': 0,
            };

            const direction = dirMap[data.dirB];
            const speed = Math.min(Math.max(data.speedB, 0), 255);  // Clamp speed to 0~255

            if (direction === undefined) {
                // console.warn('⚠️ [DC_MOTOR_CONTROL] 유효하지 않은 방향:', data.dirA);
                break;
            }

            // console.log('✅ [DC_MOTOR_CONTROL] 제어 전송:', { direction, speed, sensorIdx });

            buffer = Buffer.from([
                255,
                85,
                6,               // 길이: type(1) + dir(1) + speed(1) + end(1) = 4 + header(2)
                sensorIdx,
                this.actionTypes.SET,
                this.sensorTypes.DC_MOTOR_CONTROL2,
                port,
                direction,
                speed,
                10
            ]);
            break;
        }


        case this.sensorTypes.COLOR_SENSOR_INIT: {
            if (
                typeof data !== 'object' ||
                typeof data.s0 !== 'number' ||
                typeof data.s1 !== 'number' ||
                typeof data.s2 !== 'number' ||
                typeof data.s3 !== 'number' ||
                typeof data.out !== 'number' ||
                typeof data.led !== 'number'
            ) {
                console.warn('⚠️ [COLOR_SENSOR_INIT] 잘못된 포맷:', data);
                break;
            }

            const s0 = data.s0;
            const s1 = data.s1;
            const s2 = data.s2;
            const s3 = data.s3;
            const out = data.out;
            const led = data.led;

            buffer = Buffer.from([
                255,
                85,
                10,               // 길이: type(1) + data(6) + end(1) = 8 + 1
                sensorIdx,            // 포트 넘버 (보통 1)
                this.actionTypes.SET,
                this.sensorTypes.COLOR_SENSOR_INIT,
                port,
                s0,
                s1,
                s2,
                s3,
                out,
                led,
                10,              // 종료
            ]);
            break;
        }


        case this.sensorTypes.HC06_INIT: {
            
            const rx = data.rx;
            const tx = data.tx;
          

            buffer = Buffer.from([
                255,
                85,
                6,              
                sensorIdx,            
                this.actionTypes.SET,
                this.sensorTypes.HC06_INIT,
                port,
                tx,
                rx,
                10,              // 종료
            ]);
            break;
        }

        case this.sensorTypes.HM10_INIT: {
            
            const rx = data.rx;
            const tx = data.tx;
          

            buffer = Buffer.from([
                255,
                85,
                6,              
                sensorIdx,            
                this.actionTypes.SET,
                this.sensorTypes.HM10_INIT,
                port,
                tx,
                rx,
                10,              // 종료
            ]);
            break;
        }




        case this.sensorTypes.HC06_SEND:
        {
            const text = '' + data;  // 문자열로 변환 보장
            const strBuffer = Buffer.from(text, 'ascii');  // ascii 인코딩
            const textLen = strBuffer.length;  // 문자열 길이
            
            const lenBuffer = Buffer.alloc(2);
            lenBuffer.writeInt16LE(textLen);

            const dummy = Buffer.alloc(1);  // 필요에 따라 크기 조정
            dummy.writeInt8(0);  // 0으로 채움

            const header = Buffer.from([
                255,
                85,
                6 + strBuffer.length,  // 길이 동적으로 계산
                sensorIdx,
                this.actionTypes.SET,
                this.sensorTypes.HC06_SEND,
                port
            ]);

            lenBuffer.writeInt16LE(strBuffer.length);

            const endByte = Buffer.from([10]);

            buffer = Buffer.concat([header, lenBuffer, strBuffer, endByte]);


          
            break;
        }

        case this.sensorTypes.HM10_SEND:
        {
            const text = '' + data;  // 문자열로 변환 보장
            const strBuffer = Buffer.from(text, 'ascii');  // ascii 인코딩
            const textLen = strBuffer.length;  // 문자열 길이
            
            const lenBuffer = Buffer.alloc(2);
            lenBuffer.writeInt16LE(textLen);

            const dummy = Buffer.alloc(1);  // 필요에 따라 크기 조정
            dummy.writeInt8(0);  // 0으로 채움

            const header = Buffer.from([
                255,
                85,
                6 + strBuffer.length,  // 길이 동적으로 계산
                sensorIdx,
                this.actionTypes.SET,
                this.sensorTypes.HM10_SEND,
                port
            ]);

            lenBuffer.writeInt16LE(strBuffer.length);

            const endByte = Buffer.from([10]);

            buffer = Buffer.concat([header, lenBuffer, strBuffer, endByte]);


          
            break;
        }



        
        case this.sensorTypes.HC06_RECEIVE: {
            
            buffer = Buffer.from([
                255,
                85,
                4,              
                sensorIdx,            
                this.actionTypes.SET,
                this.sensorTypes.HC06_RECEIVE,
                port,
                0,
                10,              // 종료
            ]);
            break;
        }


        case this.sensorTypes.HM10_RECEIVE: {
            
            buffer = Buffer.from([
                255,
                85,
                4,              
                sensorIdx,            
                this.actionTypes.SET,
                this.sensorTypes.HM10_RECEIVE,
                port,
                0,
                10,              // 종료
            ]);
            break;
        }
        









    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    var datas = [];
    var lastIndex = 0;
    buffer.forEach(function(value, idx) {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};

// 하드웨어 연결 해제 시 호출
Module.prototype.disconnect = function(connect) {
    var self = this;
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

// 엔트라와의 연결 종료 후 처리 코드
Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

    this.sensorData.PULSEIN = {};
};

module.exports = new Module();
