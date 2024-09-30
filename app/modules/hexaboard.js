const BaseModule = require('./baseModule');

class hexaboard extends BaseModule {
    constructor() {
        super();
        this.counter = 0;
        this.commandResponseSize = 8;
        this.wholeResponseSize = 0x32;
        this.isSendInitData = false;
        this.isSensorCheck = false;
        this.isConnect = false;

        this.sp = null;
        this.sendBuffers = [];
        this.recvBuffers = []; // 수신 데이터를 저장할 버퍼

        this.sensors = [];
        this.sensorDatas = {
            '35' : 0, //BUTTON_A
            '34' : 0, //BUTTON_B
            '32' : 0, //PIN_1
            '33' : 0, //PIN_2
            '4' : 0, //PIN_3
            'A32' : 0, //PIN_1
            'A33' : 0, //PIN_2
            'A4' : 0, //PIN_3
            'C0' : 0, //RED
            'C1' : 0, //GREEN
            'C2' : 0, //BLUE
            'C3' : 0, //WHITHE
            '11' : 0, //LEFT
            '12' : 0, //RIGHT
            '13' : 0, //FRONT
            '14' : 0, //BACK
            '15' : 0, //UP
            '16' : 0, //DOWN
            'A17' : 0, //ANGLE_X
            'A18' : 0, //ANGLE_Y
            'A19' : 0, //ANGLE_Z
            'D0' : 0, //HUMI
            'D1' : 0, //TEMP
            'BC' : 0, //BLYNK CONNECTED
            'V0' :0,
            'V1' :0,
            'V2' :0,
            'V3' :0,
            'V4' :0,
            'V5' :0,
            'V6' :0,
            'V7' :0,
            'V8' :0,
            'V9' :0,
            'V10' :0,
            'V11' :0,
            'V12' :0,
            'V13' :0,
            'V14' :0,
            'V15' :0,
            'V16' :0,
            'V17' :0,
            'V18' :0,
            'V19' :0,
            'V20' :0,
        };
        this.returnData = {

        };

        /**
         * HEXABOARD 관려 내용들 추후 아래 모두 삭제
         */
        this.sensorTypes = {
            DIGITAL_WRITE: 0x01, // 디지털 출력 변경
            ANALOG_WRITE: 0x02, // PWM을 이용한 아날로그 출력 변경
            DIGITAL_READ: 0x03, // 디지털 입력 상태 요청
            ANALOG_READ: 0x04, // 아날로그 입력 값 요청
            PLAY_TONE: 0x05, // 부저에 음 재생
            READ_COLOR_SENSOR: 0x06, // 색상 센서 값 요청 (R,G,B,W)
            READ_GYRO_SENSOR: 0x07, // 자이로 센서 값 요청
            READ_GYRO_ANGLE_SENSOR: 0x17, // 자이로 센서 값 요청
            READ_DHT_SENSOR : 0x13, //DHT11 센서 값
            UPDATE_NEOPIXEL: 0x08, // 네오픽셀 LED 상태 변경
            SLIDE_NEOPIXEL: 0x09, //네오픽셀 텍스트 출력
            DISPLAY_OLED: 0x10, // OLED 값 정의
            DISPLAY_INIT_OLED: 0x12, // OLED 값 정의
            UPDATE_ALL_NEOPIXEL: 0x11, //모든 네오픽셀 켜기
            CLEAR_DISPLAY_OLED: 0x25, // OLED값 리셋
            CONNECT_WIFI: 0x21, //WIFI 연결
            CONNECT_BLYNK: 0x21, //BLYNK서버 연결
            BLYNK_VIRTUAL_WRITE: 0x22, //BLYNK 가상의 핀 데이터 전송
            BLYNK_WRITE: 0x23, //BLYNK 상태값 바뀌었을때
            CONNECTED_BLYNK: 0x24, //BLYNK 연결 상태 확인
            HEXA_INIT: 0x30,
        };
        // 자이로 센서에 대한 추가적인 세부 명령 정의
        this.gyro_sensor = {
            LEFT: 0x11,
            RIGHT: 0x12,
            FRONT: 0x13,
            BACK: 0x14,
            UP: 0x15,
            DOWN: 0x16,
            ANGLE_X: 0x17,
            ANGLE_Y: 0x18,
            ANGLE_Z: 0x19,
        };
        this.command =  {
            READ: 1,
            WRITE: 0,
        };
    }

    hexColorToRgb(hexColor) {
        // '#FF0000' 형식의 색상 코드를 'FF0000'으로 변환
        // console.log(hexColor);
        const color = hexColor.replace('#', '');

        // R, G, B 값을 16진수에서 10진수로 변환
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);

        return [r, g, b];
    }

    // 이 아래로는 자유롭게 선언하여 사용한 함수입니다.
    makeOutputBuffer(options = {}) {
        const {
            command = 0x00,
            sensorType = 0x00,
            pin  = 0x00,
            duration = 0x00,
            data  = 0,
            message  = '',
            message2  = '',
            color = '',
        } = options;
        let buffer;
        const value = new Buffer(2);
        value.writeInt16LE(data);

        // 데이터 사이즈 : header 2 + length 1 + command 1 + type 1 + port 1 + duration 1 +data(2) + dummy
        let dataLength = 10;
        const dummy = new Buffer([10]);
        let messageBuffer = Buffer.alloc(0);
        let colorBuffer = Buffer.alloc(0);

        if (message) {
            messageBuffer = Buffer.from(message, 'utf8');
            dataLength += messageBuffer.length;
            // console.log(messageBuffer);
        }

        if (color) {
            const rgbValues = this.hexColorToRgb(color);
            colorBuffer = Buffer.from(rgbValues);
            dataLength += colorBuffer.length; // 컬러 데이터 길이 추가
            // console.log(`dataLength ${dataLength} 에 추가 + ${colorBuffer.length}`);
        }

        if (dataLength > 256) {
            // 에러 처리 또는 데이터 분할 필요
            throw new Error('Data length exceeds buffer limit');
        }
        // console.log(`딜레이 : ${duration}`);
        buffer = new Buffer([
            255,
            85,
            dataLength,
            command,
            sensorType,
            pin,
            duration,
        ]);
        buffer = Buffer.concat([buffer, value, colorBuffer, messageBuffer, dummy]);

        return buffer;
    };

    makeOutputWifiBuffer(options = {}) {
        const {
            command = 0x00,
            sensorType = 0x00,
            ssid = '',
            password = '',
            auth = '',
        } = options;
        const dummy = new Buffer([10]);

        const ssidBuffer = ssid ? Buffer.from(ssid, 'utf8') : Buffer.alloc(0);
        const passwordBuffer = password ? Buffer.from(password, 'utf8') : Buffer.alloc(0);
        const authBuffer = auth ? Buffer.from(auth, 'utf8') : Buffer.alloc(0);

        const ssidLength = ssidBuffer.length;
        const passwordLength = passwordBuffer.length;
        const authLength = authBuffer.length;


        // console.log(`ssid : ${ssidBuffer}, password : ${passwordBuffer}, authtoken : ${authBuffer}`);


        let buffer = new Buffer([
            255,
            85,
            0, //Dummy 값
            command,
            sensorType,
            ssidLength,
            passwordLength,
            authLength,
        ]);

        buffer = Buffer.concat([buffer, ssidBuffer, passwordBuffer, authBuffer, dummy]);
        return buffer;
    }



    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    lostController() {}

    setSerialPort(sp) {
        this.sp = sp;
    }


    processParsedData(port, sensorType, value) {
        // 추출된 데이터에 따른 처리 로직
        let angle;
        let portName;
        switch (sensorType) {
            case this.sensorTypes.DIGITAL_READ:
                // console.log(`SEND TO ENTRY FOR DIGITAL_READ : ${port}`);
                this.sensorDatas[port] = value;
                break;
            case this.sensorTypes.ANALOG_READ:
                // console.log('SEND TO ENTRY FOR ANALOG_READ');
                portName = `A${port}`;
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.READ_GYRO_ANGLE_SENSOR:
                // console.log('SEND TO ENTRY FOR READ_GYRO_ANGLE_SENSOR');
                angle = value - 360 ;
                // console.log(angle);
                this.sensorDatas[port] = angle;
                break;
            case this.sensorTypes.READ_GYRO_SENSOR:
                // console.log('SEND TO ENTRY FOR READ_GYRO_SENSOR');
                this.sensorDatas[port] = value;
                break;
            case this.sensorTypes.READ_COLOR_SENSOR:
                // console.log(`SEND TO ENTRY FOR READ_COLOR_SENSOR : ${port}`);
                portName = `C${port}`;
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.READ_DHT_SENSOR:
                portName = `D${port}`;
                // console.log(`SEND TO ENTRY FOR READ_DHT_SENSOR : ${portName}`);
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.CONNECTED_BLYNK:
                this.sensorDatas.BC = value;
                break;
            case this.sensorTypes.BLYNK_WRITE:
                portName = `V${port}`;
                // console.log(`SEND TO ENTRY FOR BLYNK_WRITE : ${portName}`);
                this.sensorDatas[portName] = value;
                break;
            // 기타 케이스 처리...
        }
    }

    processBuffer() {
        /***
         * 데이터 구조
         * 시작 2바이트 [0xFF, 0x55]
         * 시작 + [port || etc(1) , SensorType(1), value(2)]
         */
        let lastIdx = 0;
        // console.log(`received buffer Length : ${this.recvBuffers.length}`);

        for (let i = 0; i < this.recvBuffers.length - 1; i++) {
            if (this.recvBuffers[i] === 0xff && this.recvBuffers[i + 1] === 0x55) {
                const dataLength = this.recvBuffers[i + 2];

                if (i + 2 + dataLength <= this.recvBuffers.length) {
                    const port = this.recvBuffers[i + 3];
                    const sensorType = this.recvBuffers[i + 4];
                    // console.log(`recvBuffer [${i}]:`, this.recvBuffers.slice(i, i + dataLength).join(' '));
                    if (sensorType === this.sensorTypes.READ_GYRO_SENSOR) {
                        const left = this.recvBuffers[i + 5];
                        const right = this.recvBuffers[i + 6];
                        const front = this.recvBuffers[i + 7];
                        const back = this.recvBuffers[i + 8];
                        const up = this.recvBuffers[i + 9];
                        const down = this.recvBuffers[i + 10];
                        this.sensorDatas[this.gyro_sensor.LEFT] = left;
                        this.sensorDatas[this.gyro_sensor.RIGHT] = right;
                        this.sensorDatas[this.gyro_sensor.FRONT] = front;
                        this.sensorDatas[this.gyro_sensor.BACK] = back;
                        this.sensorDatas[this.gyro_sensor.UP] = up;
                        this.sensorDatas[this.gyro_sensor.DOWN] = down;
                        // console.log(`left : ${left} ,right : ${right} ,front : ${front} ,back : ${back} ,up : ${up} ,down : ${down}`);
                    } else {
                        const valueLowByte = this.recvBuffers[i + 5];
                        const valueHighByte = this.recvBuffers[i + 6];
                        const value = (valueHighByte << 8) | valueLowByte;
                        // 추출된 데이터 처리
                        this.processParsedData(port, sensorType, value);
                    }
                    lastIdx = i + dataLength; // 데이터 길이
                }
            }
        }
        // 처리된 데이터 제거
        this.recvBuffers.splice(0, lastIdx);
    }

    /**
     * 하드웨어에서 온 데이터 처리
     * @param {*} data
     */
    handleLocalData(data) {
        // console.log(data);
        this.recvBuffers.push(...data); // 수신된 데이터를 버퍼에 추가
        this.processBuffer();
    }


    // 엔트리로 전달할 데이터
    // Web Socket(엔트리)에 전달할 데이터
    requestRemoteData(handler) {
        //일정 시간마다 계속 데이터를 보내는 중
        Object.keys(this.sensorDatas).forEach((key) => {
            handler.write(key, this.sensorDatas[key]);
            // console.log(`key : ${key} , sensorData : ${this.sensorDatas[key]}`);
        });
    }


    // 엔트리에서 받은 데이터에 대한 처리
    // Web Socket 데이터 처리
    handleRemoteData(handler) {
        const readData = handler.read('SET');
        if (readData) {
            //Write
            if (readData.type === this.command.WRITE) {
                let buffer = new Buffer([]);
                let port;
                let value;
                let duration;
                let printMessage;
                let colorValue;
                let slideSpeed;
                let neoIndex;
                let neoNum;
                let textSize;
                let ssid;
                let password;
                let authToken;
                switch (readData.data.command) {
                    case this.sensorTypes.DIGITAL_WRITE:
                        // 실제 하드웨어로 디지털 쓰기 명령을 전송하는 코드
                        port = readData.data.pin;
                        value = readData.data.value;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.DIGITAL_WRITE,
                                    pin : port,
                                    data : value,
                                }),
                            ]);
                        // console.log(`pin : ${port}, value : ${value}`);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.ANALOG_WRITE:
                        port = readData.data.pin;
                        value = readData.data.value;
                        // console.log('ANALOG_WRITE');
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.ANALOG_WRITE,
                                    pin : port,
                                    data : value,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.PLAY_TONE:
                        port = readData.data.pin;
                        duration = readData.data.duration;
                        value = readData.data.value;
                        // console.log('PLAY_TONE');
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.PLAY_TONE,
                                    pin : port,
                                    duration : duration * 10,
                                    data : value, // 주파수값 ,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            console.log(`duration : ${duration}`);
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.SLIDE_NEOPIXEL:
                        // console.log('SLIDE_NEOPIXEL');
                        printMessage = readData.data.message;
                        colorValue = readData.data.color;
                        slideSpeed = readData.data.speed;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.SLIDE_NEOPIXEL,
                                    speed : slideSpeed,
                                    message : printMessage,
                                    color : colorValue,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.UPDATE_NEOPIXEL:
                        // console.log('UPDATE_NEOPIXEL');
                        port = readData.data.pin;
                        neoNum = readData.data.ledNum;
                        neoIndex = readData.data.ledIndex;
                        colorValue = readData.data.color;
                        // console.log('Individual control of a NeoPixel');
                        if (neoIndex < 1) {
                            neoIndex = 1;
                        }
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.UPDATE_NEOPIXEL,
                                    pin: port,
                                    duration : neoNum,
                                    data : neoIndex,
                                    color : colorValue,
                                }),
                            ]);


                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.UPDATE_ALL_NEOPIXEL:
                        // console.log('UPDATE_ALL_NEOPIXEL');
                        port = readData.data.pin;
                        neoNum = readData.data.ledNum;
                        colorValue = readData.data.color;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.UPDATE_ALL_NEOPIXEL,
                                    pin: port,
                                    duration : neoNum,
                                    color : colorValue,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.DISPLAY_INIT_OLED:
                        // console.log('DISPLAY_INIT_OLED');
                        port = readData.data.address;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.DISPLAY_INIT_OLED,
                                    pin: port,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.DISPLAY_OLED:
                        // console.log('DISPLAY_OLED');
                        port = readData.data.x;
                        value = readData.data.y;
                        printMessage = readData.data.message;
                        textSize = readData.data.fontsize;

                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.DISPLAY_OLED,
                                    pin: port,
                                    data: value,
                                    duration: textSize,
                                    message: printMessage,
                                    color : '#000000',
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.CLEAR_DISPLAY_OLED:
                        // console.log('DISPLAY_INIT_OLED');
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.CLEAR_DISPLAY_OLED,
                                }),
                            ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.CONNECT_WIFI:
                        // console.log('CONNECT_WIFI');
                        ssid = readData.data.ssid;
                        password = readData.data.password;
                        authToken = readData.data.authToken;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputWifiBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.CONNECT_WIFI,
                                    ssid,
                                    password,
                                    auth: authToken,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.BLYNK_VIRTUAL_WRITE:
                        // console.log('BLYNK_VIRTUAL_WRITE');
                        port = readData.data.virtualPin;
                        value = readData.data.value;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.BLYNK_VIRTUAL_WRITE,
                                    pin: port,
                                    message: value,
                                    color : '#000000',
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.BLYNK_WRITE:
                        // console.log('BLYNK_WRITE');
                        port = readData.data.virtualPin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.BLYNK_WRITE,
                                    pin: port,
                                    color : '#000000',
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.CONNECTED_BLYNK:
                        // console.log('CONNECTED_BLYNK');
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.CONNECTED_BLYNK,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.HEXA_INIT:
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.HEXA_INIT,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                }
            }

            //Read
            if (readData.type === this.command.READ) {
                let buffer = new Buffer([]);
                let port;
                let value;
                // console.log('this.command.READ');
                switch (readData.data.command) {
                    case this.sensorTypes.DIGITAL_READ:
                        port = readData.data.pin;
                        // console.log(`DIGITAL_READ_PORT : ${port}`);
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    sensorType : this.sensorTypes.DIGITAL_READ,
                                    pin : port,
                                }),
                            ]);
                        if (buffer.length) {
                            // console.log(`pin : ${port}, value : ${value}`);
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.ANALOG_READ:
                        // console.log('ANALOG_READ');
                        port = readData.data.pin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    sensorType : this.sensorTypes.ANALOG_READ,
                                    pin : port,
                                }),
                            ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.READ_GYRO_SENSOR:
                        // console.log('READ_GYRO_SENSOR');
                        port = readData.data.pin;
                        // console.log(port);
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    sensorType : this.sensorTypes.READ_GYRO_SENSOR,
                                    pin : port,
                                }),
                            ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.READ_GYRO_ANGLE_SENSOR:
                        port = readData.data.pin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    sensorType : this.sensorTypes.READ_GYRO_ANGLE_SENSOR,
                                    pin : port,
                                }),
                            ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.READ_DHT_SENSOR:
                        // console.log('readDHTSENSOR');
                        port = readData.data.pin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    pin : port,
                                    sensorType : this.sensorTypes.READ_DHT_SENSOR,
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;
                }
            }
        }
    }

    // 하드웨어에 전달할 데이터
    requestLocalData() {
        // 디바이스로 데이터를 보내는 로직. control: slave 인 경우 duration 주기에 맞춰 디바이스에 데이터를 보낸다.
        // return 값으로 버퍼를 반환하면 디바이스로 데이터를 보내나, 아두이노의 경우 레거시 코드를 따르고 있다.
        if (this.sendBuffers.length > 0) {
            // console.log(this.sendBuffers);
            this.sp.write(this.sendBuffers.shift(), () => {
                if (this.sp) {
                    this.sp.drain(() => {
                        this.isDraing = false;
                    });
                }
            });
        }

        return null;
    }

    connect() {
        // console.log("connected");
    }

    disconnect(connect) {
        if (this.isConnect) {
            // clearInterval(this.sensing);
            // this.counter = 0;
            // this.commandResponseSize = 11;
            // this.isSendInitData = false;
            // this.isSensorCheck = false;
            // this.isConnect = false;
            // this.CURRENT_STATUS_COLOR = {
            //     COLOR: this.STATUS_COLOR_MAP.GREEN,
            //     APPLIED: false,
            // };
        }
    }

    reset() {
        // console.log("reset");
    }
}

module.exports = new hexaboard();
