
const BaseModule = require('./baseModule');

class castarter_v2_nano extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
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
            NEOPIXELINIT: 11,
            NEOPIXELDIS: 12,
            LCDINIT: 14,
            LCD_DIS: 15,
            LCDCLEAR: 16,
            LCDOPTION: 17,
            DHTTEMP: 26,
            DHTHUMI: 27,
        };
        this.actionTypes = {
            GET: 1,
            SET: 2,
            RESET: 3,
        };
        this.sensorValueSize = {
            FLOAT: 2,
            SHORT: 3,
            STRING: 4,
        };
        this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.sensorData = {
            ULTRASONIC: 0,
            DHTTEMP: 0,
            DHTHUMI: 0,
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
                '14': 0,
                '15': 0,
                '16': 0,
                '17': 0,
                '18': 0,
                '19': 0,
                '20': 0,
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
        };
        this.defaultOutput = {};
        this.recentCheckData = {};
        this.sendBuffers = [];
        this.lastTime = 0;
        this.lastSendTime = 0;
        this.isDraing = false;
        this.sensorIdx = 0;
    };
    // 초기 설정
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }
    setSerialPort = function(sp) {
        const self = this;
        this.sp = sp;
    };
    // 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.(필수)
    requestInitialData = function() {
        return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
    };
    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.(필수)
    checkInitialData = function(data, config) {
        return true;
        // 이후에 체크 로직 개선되면 처리
        // var datas = this.getDataByBuffer(data);
        // var isValidData = datas.some(function (data) {
        //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
        // });
        // return isValidData;
    };
    afterConnect = function(that, cb) {
        that.connected = true;
        if (cb) {
            cb('connected');
        }
    };
    // optional. 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData = function(data) {
        return true;
    };
    /** 엔트리에 데이터 전송하기
     * Web Socket(엔트리)에 아날로그, 디지털등 데이터 전송
     * @param handler
     */
    requestRemoteData = function(handler) {
        const self = this;
        if (!self.sensorData) {
            return;
        }
        Object.keys(this.sensorData).forEach((key) => {
            if (self.sensorData[key] != undefined) {
                handler.write(key, self.sensorData[key]);
            }
        });
    };
    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData = function(handler) {
        const self = this;
        const getDatas = handler.read('GET');
        const setDatas = handler.read('SET') || this.defaultOutput;
        const time = handler.read('TIME');
        let buffer = new Buffer([]);
        if (getDatas) {
            const keys = Object.keys(getDatas);
            keys.forEach((key) => {
                let isSend = false;
                const dataObj = getDatas[key];
                if (typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                    const time = self.digitalPortTimeList[dataObj.port];
                    if (dataObj.time > time) {
                        isSend = true;
                        self.digitalPortTimeList[dataObj.port] = dataObj.time;
                    }
                } else if (Array.isArray(dataObj.port)) {
                    isSend = dataObj.port.every((port) => {
                        const time = self.digitalPortTimeList[port];
                        return dataObj.time > time;
                    });
                    if (isSend) {
                        dataObj.port.forEach((port) => {
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
                        buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                    }
                }
            });
        }
        if (setDatas) {
            const setKeys = Object.keys(setDatas);
            setKeys.forEach((port) => {
                const data = setDatas[port];
                if (data) {
                    if (self.digitalPortTimeList[port] < data.time) {
                        self.digitalPortTimeList[port] = data.time;

                        if (!self.isRecentData(port, data.type, data.data)) {
                            self.recentCheckData[port] = {
                                type: data.type,
                                data: data.data,
                            };
                            buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        }
                    }
                }
            });
        }
        if (buffer.length) {
            this.sendBuffers.push(buffer);
        }
    };
    /**
     * 기존에 수신했던 데이터인가
     * 기존에 수신했던 데이터인지 확인합니다. 예를들어 LED ON/OFF의 경우 무한루프에서 상태가 변하지 않을 경우 추가로 신호를 하드웨어에 보내서 불필요한 오버헤드를
     * 발생시킬 필요가 없으므로, 같은 신호에 대해서는 중복으로 보내지 않도록 만듭니다.
     * 하지만, Tone과 같이 같은 신호라도 출력데이터를 보내야하므로 별도의 예외처리가 필요합니다.
     * @param port
     * @param type
     * @param data
     * @returns {boolean}
     */
    isRecentData = function(port, type, data) {
        let isRecent = false;
        if (port in this.recentCheckData) {
            if (type != this.sensorTypes.TONE && this.recentCheckData[port].type === type &&
                this.recentCheckData[port].data === data) {
                isRecent = true;
            }
        }
        return isRecent;
    };
    /**
     * 송신(PC->하드웨어) 데이터
     * 시리얼통신으로 버퍼에 쌓아놓은 데이터를 전송합니다.
     * @returns {null}
     */
    requestLocalData = function() {
        const self = this;
        if (!this.isDraing && this.sendBuffers.length > 0) {
            this.isDraing = true;
            this.sp.write(this.sendBuffers.shift(), () => {
                if (self.sp) {
                    self.sp.drain(() => {
                        self.isDraing = false;
                    });
                }
            });
        }
        return null;
    };
    /** 수신(하드웨어->PC) 데이터 처리
     *ff 55 idx size data a
    */
    handleLocalData = function(data) {
        const self = this;
        const datas = this.getDataByBuffer(data);
        datas.forEach((data) => {
            if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
                return;
            }
            const readData = data.subarray(2, data.length);
            let value;
            switch (readData[0]) {
                case self.sensorValueSize.FLOAT: {
                    value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                    value = Math.round(value * 100) / 100;
                    break;
                }
                case self.sensorValueSize.SHORT: {
                    value = new Buffer(readData.subarray(1, 3)).readInt16LE();
                    break;
                }
                case self.sensorValueSize.STRING: {
                    value = new Buffer(readData[1] + 3);
                    value = readData.slice(2, readData[1] + 3);
                    value = value.toString('ascii', 0, value.length);
                    break;
                }
                default: {
                    value = 0;
                    break;
                }
            }
            const type = readData[readData.length - 1];
            const port = readData[readData.length - 2];
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
                case self.sensorTypes.ULTRASONIC: {
                    self.sensorData.ULTRASONIC = value;
                    break;
                }
                case self.sensorTypes.DHTTEMP: {
                    self.sensorData.DHTTEMP = value;
                    break;
                }
                case self.sensorTypes.DHTHUMI: {
                    self.sensorData.DHTHUMI = value;
                    break;
                }
                case self.sensorTypes.TIMER: {
                    self.sensorData.TIMER = value;
                    break;
                }
                default: {
                    break;
                }
            }
        });
    };
    makeSensorReadBuffer = function(device, port, data) {
        let buffer; 
        const dummy = new Buffer([10]);
        if (device == this.sensorTypes.ULTRASONIC) {
            buffer = new Buffer([
                255,
                85,
                6,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port[0],
                port[1],
                10,
            ]);
        } else if (device == this.sensorTypes.DHTTEMP || device == this.sensorTypes.DHTHUMI) {
            buffer = new Buffer([
                255,
                85,
                6, 
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
        }  else if (!data) {
            buffer = new Buffer([
                255,
                85,
                5,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
        } else {
            const value = new Buffer(2);
            value.writeInt16LE(data);
            buffer = new Buffer([
                255,
                85,
                7,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
            buffer = Buffer.concat([buffer, value, dummy]);
        }
        this.sensorIdx++;
        if (this.sensorIdx > 254) {
            this.sensorIdx = 0;
        }
        return buffer;
    };
    /** 전송(PC->하드웨어) 버퍼 만들기
     * 0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
     */
    makeOutputBuffer = function(device, port, data) {
        let buffer;
        const value = new Buffer(2);
        const dummy = new Buffer([10]);
        
        switch (device) {
            case this.sensorTypes.SERVO_PIN:
            case this.sensorTypes.DIGITAL:
            case this.sensorTypes.PWM: {
                value.writeInt16LE(data);
                buffer = new Buffer([
                    255,
                    85,
                    6,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, dummy]);           
                break;
            }
            case this.sensorTypes.TONE: {
                const time = new Buffer(2);
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
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, time, dummy]);
                break;
            }
            case this.sensorTypes.NEOPIXELINIT: {
                value.writeInt16LE(data);
                buffer = new Buffer([
                    255,
                    85,
                    6,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, dummy]);
                break;
            }
            case this.sensorTypes.NEOPIXELDIS: {
                const num = new Buffer(2);
                const r = new Buffer(2);
                const g = new Buffer(2);
                const b = new Buffer(2);
                
                if ($.isPlainObject(data)) {
                    num.writeInt16LE(data.num);
                    r.writeInt16LE(data.r);
                    g.writeInt16LE(data.g);
                    b.writeInt16LE(data.b);
                } else {
                    num.writeInt16LE(0);
                    r.writeInt16LE(0);
                    g.writeInt16LE(0);
                    b.writeInt16LE(0);
                }
                buffer = new Buffer([
                    255,
                    85,
                    12,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, num, r, g, b, dummy]);
                break;
            }
            case this.sensorTypes.ULTRASONIC:  {
                value.writeInt16LE(data);
                buffer = new Buffer([
                    255,
                    85,
                    6,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, dummy]);
                break;
            }
            case this.sensorTypes.LCDINIT:  {
                value.writeInt16LE(data);
                
                buffer = new Buffer([
                    255,
                    85,
                    6,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, dummy]);
                break;
            }
            case this.sensorTypes.LCD_DIS:  {  
                let text;
                const row = new Buffer(1);
                const column =  new Buffer(1);
                let textLen = 0;
                const textLenBuf =  new Buffer(1);
        
                if ($.isPlainObject(data)) {
                    textLen = (`${data.text}`).length;
                    text = Buffer.from(`${data.text}`, 'ascii');
                    row.writeInt8(data.row);
                    textLenBuf.writeInt8(textLen);
                    column.writeInt8(data.column);
                } else {
                    textLen = 0;
                    text = Buffer.from('', 'ascii');
                    row.writeInt8(0);
                    textLenBuf.writeInt8(textLen);
                    column.writeInt8(0);
                }
                buffer = new Buffer([
                    255,
                    85,
                    4 + 3 + textLen,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, row, column, textLenBuf, text, dummy]);
                break;
            }
            case this.sensorTypes.LCDOPTION: {  
                let text;
                const row = new Buffer(1);
                const column =  new Buffer(1);
                let textLen = 0;
                const textLenBuf =  new Buffer(1);
        
                if ($.isPlainObject(data)) {
                    textLen = (`${data.text}`).length;
                    text = Buffer.from(`${data.text}`, 'ascii');
                    row.writeInt8(data.row);
                    textLenBuf.writeInt8(textLen);
                    column.writeInt8(data.column);
                } else {
                    textLen = 0;
                    text = Buffer.from('', 'ascii');
                    row.writeInt8(0);
                    textLenBuf.writeInt8(textLen);
                    column.writeInt8(0);
                }
                buffer = new Buffer([
                    255,
                    85,
                    4 + 3 + textLen,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, row, column, textLenBuf, text, dummy]);
                break;
            }
            case this.sensorTypes.LCDCLEAR:  {
                value.writeInt16LE(data);	
                buffer = new Buffer([
                    255,
                    85,
                    6,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, dummy]);  
                break;
            }
        }
        return buffer;
    };
    getDataByBuffer = function(buffer) {
        const datas = [];
        let lastIndex = 0;
        buffer.forEach((value, idx) => {
            if (value == 13 && buffer[idx + 1] == 10) {
                datas.push(buffer.subarray(lastIndex, idx));
                lastIndex = idx + 2;
            }
        });
        return datas;
    };
    // 하드웨어 연결 해제 시 호출됩니다.
    disconnect = function(connect) {
        const self = this;
        connect.close();
        if (self.sp) {
            delete self.sp;
        }
    };
    // 엔트리와의 연결 종료 후 처리 코드입니다.
    reset = function() {
        this.lastTime = 0;
        this.lastSendTime = 0;
        this.sensorData.PULSEIN = {};
    };
}
module.exports = new castarter_v2_nano();
