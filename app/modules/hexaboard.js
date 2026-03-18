const BaseModule = require('./baseModule');
const { data } = require('./chocopi');

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
        this.weightSensorRequestPort = null; // 무게센서 요청 시 보낸 pin 값 추적

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
            '17' : 0,
            '18' : 0, //VEHICLE_RIGHT_LED
            '19' : 0, //VEHICLE_LEFT_LED
            'A0' : 0, //ANGLE_X
            'A1' : 0, //ANGLE_Y
            'A2' : 0, //ANGLE_Z
            'D0' : 0, //HUMI
            'D1' : 0, //TEMP
            'D0' : 0, //DHT_HUMI
            'D1' : 0, //DHT_TEMP
            'L0' : 0, //LINE 1번값
            'L1' : 0, //LINE 2번값
            'L2' : 0, //LINE 3번값
            'L3' : 0, //LINE 4번값
            'W1' : 0, //WEATHER_TMEP
            'W0' : 0, //WEATHER_HUMI
            'W2' : 0, //WEATHER_PRES
            'W3' : 0, //WEATHER_ALTI
            'U32' : 0, //ULTRASONIC
            'U33' : 0, //ULTRASONIC
            'U4' : 0, //ULTRASONIC
            'A' : 0, //MONOR_A
            'B' : 0, //MOTOR_B
            'DU0' : 0, //DUST_SENSOR
            'DU1' : 0, //DUST_SENSOR
            'DU2' : 0, //DUST_SENSOR
            'WA0' : 0, //WATER_TEMPERATURE_1PIN
            'WA1' : 0, //WATER_TEMPERATURE_2PIN
            'WA2' : 0, //WATER_TEMPERATURE_3PIN
            'WQ0' : 0, //WATER_QUALITY_1PIN
            'WQ1' : 0, //WATER_QUALITY_2PIN
            'WQ2' : 0, //WATER_QUALITY_3PIN
            'P0' : 0, //PRESSURE_SENSOR
            'P1' : 0, //PRESSURE_SENSOR
            'T32' : 0, //TOUCH_SENSOR_1pin
            'T33' : 0, //TOUCH_SENSOR_2pin
            'T4' : 0, //TOUCH_SENSOR_3pin
            'CO20' : 0, //CO2_SENSOR_이산화탄소
            'CO21' : 0, //CO2_SENSOR_온도
            'CO22' : 0, //CO2_SENSOR_습도
            'S32' : 0, //SOUND_SENSOR_1pin            
            'S33' : 0, //SOUND_SENSOR_2pin
            'S4' : 0, //SOUND_SENSOR_3pin
            'WD32' : 0, //WEIGHT_SENSOR_1pin
            'WD33' : 0, //WEIGHT_SENSOR_2pin
            'WD4' : 0, //WEIGHT_SENSOR_3pin
            'GI' : 0, //GYRO_INTENSITY
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
            UPDATE_NEOPIXEL: 0x08, // 네오픽셀 LED 상태 변경
            SLIDE_NEOPIXEL: 0x09, //네오픽셀 텍스트 출력
            DISPLAY_OLED: 0x10, // OLED 값 정의
            UPDATE_ALL_NEOPIXEL: 0x11, //모든 네오픽셀 켜기
            // DISPLAY_INIT_OLED: 0x12, // OLED 값 정의
            READ_DHT_SENSOR : 0x13, //DHT11 센서 값
            READ_GYRO_ANGLE_SENSOR: 0x17, // 자이로 센서 값 요청
            READ_ULTRASONIC_SENSOR: 0x18, //초음파 센서 값 요청
            READ_WEATHER_SENSOR: 0x19, //날씨 센서 값 요청
            READ_LINE_SENSOR: 0x20, //근접센서 값 요청           
            CLEAR_DISPLAY_OLED: 0x25, // OLED값 리셋
            READ_WEIGHT_SENSOR: 0x26, //무게센서 값 요청
            READ_WATERTEMPERATURE_SENSOR: 0x27, //수온센서 값요청
            READ_DUST_SENSOR: 0x28, //먼지센서 값요청
            READ_WATERQUALITY_SENSOR: 0x29, //수질센서 값요청
            HEXA_INIT: 0x30,
            READ_SOUND_SENSOR: 0x31, //소리센서 값요청
            READ_PRESSURE_SENSOR: 0x32, //압력센서 값요청
            READ_CO2_SENSOR: 0x33, //CO2센서 값요청
            READ_TOUCH_SENSOR: 0x34, //터치센서 값요청
            WRITE_MOTOR_SENSOR: 0x35, //모터값 요청
            WRITE_SERVOMOTOR_SENSOR: 0x36, //서보모터 값 요청
            OLED_HEXA: 0x37, //HEXA 앞의 OLED 값 정의
            WRITE_VEHICLE_LED: 0x38, //차량 LED 값 요청
            OLED_PRINT: 0x39, //OLED 출력 값 요청
            READ_GYRO_INTENSITY: 0x40, //자이로 센서 세기 값 요청
            CUSTOM_NEOPIXEL_LED: 0x41, //네오픽셀 LED 상태 변경

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
        const dummy = Buffer.from([10]);
        let messageBuffer = Buffer.alloc(0);
        let colorBuffer = Buffer.alloc(0);

        if (message) {
            messageBuffer = Buffer.from(message, 'ascii');
            // messageBuffer = Buffer.from(message, 'utf8');
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
        // pin이 문자열인 경우 처리
        
        let pinValue = pin;
        if (typeof pin === 'string') {
            // 숫자 문자열('2', '32' 등)은 숫자로 변환
            if (!isNaN(pin)) {
                pinValue = Number(pin);
            } else if (pin.length === 1) {
                // 단일 문자('A', 'B' 등)는 ASCII 코드로 변환
                pinValue = pin.charCodeAt(0);
            }
        }
        
        buffer = Buffer.from([
            255,
            85,
            dataLength,
            command,
            sensorType,
            pinValue,
            duration,
        ]);
        buffer = Buffer.concat([buffer, value, colorBuffer, messageBuffer, dummy]);
        // console.log('[Buffer] : ' + buffer);
            console.log('[Buffer ARRAY] :', [...buffer]);
            console.log('[Buffer structure] :', {
                header: [255, 85],
                dataLength: dataLength,
                command: command,
                sensorType: sensorType,
                pin: pin,
                duration: duration,
                value: [...value],
                colorBuffer: colorBuffer.length > 0 ? [...colorBuffer] : '없음',
            });

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
        const dummy = Buffer.from([10]);

        const ssidBuffer = ssid ? Buffer.from(ssid, 'utf8') : Buffer.alloc(0);
        const passwordBuffer = password ? Buffer.from(password, 'utf8') : Buffer.alloc(0);
        const authBuffer = auth ? Buffer.from(auth, 'utf8') : Buffer.alloc(0);

        const ssidLength = ssidBuffer.length;
        const passwordLength = passwordBuffer.length;
        const authLength = authBuffer.length;


        // console.log(`ssid : ${ssidBuffer}, password : ${passwordBuffer}, authtoken : ${authBuffer}`);


        let buffer = Buffer.from([
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
        console.log('init')
        this.handler = handler;
        this.config = config;
    }

    lostController() {}

    setSerialPort(sp) {
        this.sp = sp;
    }


    processParsedData(port, sensorType, value, duration) {
        // console.log(
        //     '[RESPONSE]',
        //     'sensorType:', sensorType,
        //     'port:', port,
        //     'value:', value,
        //     'duration:', duration,
        //     '→ 저장위치:', sensorType === this.sensorTypes.DIGITAL_READ ? `sensorDatas[${port}]` : `sensorDatas[${port}]`
        // );

            // 추출된 데이터에 따른 처리 로직
            let angle;
            let portName;
            let scaleName;
            let sck;
            switch (sensorType) {
            case this.sensorTypes.DIGITAL_READ:
                // console.log(`SEND TO ENTRY FOR DIGITAL_READ : ${port}`);
                this.sensorDatas[port] = value;
                break;
            case this.sensorTypes.ANALOG_READ:
                const p = Number(port);
                const aKey = `A${p}`;
                
                // 아날로그는 원래대로 저장 (A32/A33/A4)
                this.sensorDatas[aKey] = value;
                
                // PIN1/2/3(32/33/4)은 아날로그 값으로 디지털도 같이 만들어줌
                if (p === 32 || p === 33 || p === 4) {
                    // 임계값: 보드 ADC 해상도에 맞게 조정 (아래는 10-bit 기준 예시)
                    const TH = 2048;
                    this.sensorDatas[String(p)] = value > TH ? 1 : 0;
                }
                break;
            case this.sensorTypes.READ_GYRO_ANGLE_SENSOR:
                angle = value - 360;
                // port 값을 'A0', 'A1', 'A2' 형식으로 변환
                portName = `A${port}`;
                this.sensorDatas[portName] = angle;
                break;
            case this.sensorTypes.READ_GYRO_SENSOR:
                this.sensorDatas[port] = value;
                break;
            case this.sensorTypes.READ_GYRO_INTENSITY:
                this.sensorDatas[`GI`] = value;
                break;
            case this.sensorTypes.READ_COLOR_SENSOR:
                portName = `C${port}`;
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.READ_DUST_SENSOR:
                portName = `DU${port}`;
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.READ_DHT_SENSOR:
                portName = `D${port}`;
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.READ_ULTRASONIC_SENSOR:
                console.log('초음파 센서 값 : ', value);
                portName = port;
                this.sensorDatas[`U${portName}`] = value;
                break;
            
            case this.sensorTypes.READ_WEATHER_SENSOR:
                portName = `W${port}`;
                this.sensorDatas[portName] = value;
                break;
                
            case this.sensorTypes.READ_LINE_SENSOR:
                portName = `L${port}`;
                this.sensorDatas[portName] = value;
                break;

            case this.sensorTypes.READ_WATERQUALITY_SENSOR:
                portName = `WQ${port}`;
                // console.log(`SEND TO ENTRY FOR WATERQUALITY_SENSOR : ${portName}`);
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.READ_WATERTEMPERATURE_SENSOR:
                portName = `WA${port}`;
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.READ_SOUND_SENSOR:
                portName = `S${port}`;
                this.sensorDatas[portName] = value;
                break;

            case this.sensorTypes.READ_PRESSURE_SENSOR:
                portName = `P${port}`;
                this.sensorDatas[portName] = value;
                break;

            case this.sensorTypes.READ_CO2_SENSOR:
                portName = `CO2${port}`;
                this.sensorDatas[portName] = value;
                break;
    
            case this.sensorTypes.READ_TOUCH_SENSOR:
                portName = `T${port}`;
                
                this.sensorDatas[portName] = value;
                break;
            case this.sensorTypes.READ_WEIGHT_SENSOR:

                // 응답의 port가 0일 수 있으므로 요청 시 보낸 pin 값을 사용
                const requestPort = this.weightSensorRequestPort !== null ? this.weightSensorRequestPort : port;
                portName = `WD${requestPort}`;
                this.sensorDatas[portName] = value;
                // 사용 후 초기화
                this.weightSensorRequestPort = null;
                break;

            case this.sensorTypes.WRITE_VEHICLE_LED:
                portName = port;
                // console.log(`SEND TO ENTRY FOR VEHICLE_LED : ${portName}`);
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
                    
                    // Parsed response packet info
                    // console.log('========================================');
                    // console.log('[RESPONSE BUFFER PARSED] Protocol packet parsed');
                    // console.log('  - Packet start index:', i);
                    // console.log('  - Data length:', dataLength);
                    // console.log('  - Port:', port);
                    // console.log('  - SensorType:', sensorType, `(0x${sensorType.toString(16).toUpperCase()})`);
                    // console.log('  - Full packet bytes:', this.recvBuffers.slice(i, i + 2 + dataLength).join(' '));
                    
                    if (sensorType === this.sensorTypes.READ_GYRO_SENSOR) {
                        const left = this.recvBuffers[i + 5];
                        const right = this.recvBuffers[i + 6];
                        const front = this.recvBuffers[i + 7];
                        const back = this.recvBuffers[i + 8];
                        const up = this.recvBuffers[i + 9];
                        const down = this.recvBuffers[i + 10];
                        // sensorDatas는 문자열 키를 사용하므로 숫자를 문자열로 변환
                        this.sensorDatas[String(this.gyro_sensor.LEFT)] = left;
                        this.sensorDatas[String(this.gyro_sensor.RIGHT)] = right;
                        this.sensorDatas[String(this.gyro_sensor.FRONT)] = front;
                        this.sensorDatas[String(this.gyro_sensor.BACK)] = back;
                        this.sensorDatas[String(this.gyro_sensor.UP)] = up;
                        this.sensorDatas[String(this.gyro_sensor.DOWN)] = down;
                        // READ_GYRO_SENSOR는 이미 위에서 직접 저장했으므로 processParsedData 호출 불필요
                        console.log(`left : ${left} ,right : ${right} ,front : ${front} ,back : ${back} ,up : ${up} ,down : ${down}`);
                    } else {
                        // 무게센서인 경우 버퍼 구조가 다를 수 있음
                        if (sensorType === this.sensorTypes.READ_WEIGHT_SENSOR) {
                            // 무게센서 버퍼 구조 확인: 255 85 datalength command sensortype pin duration value
                            // console.log(`[WEIGHT_SENSOR BUFFER] Full packet: [${this.recvBuffers.slice(i, i + 2 + dataLength).join(', ')}]`);
                            // console.log(`  - i+0 (0xFF): ${this.recvBuffers[i]}`);
                            // console.log(`  - i+1 (0x55): ${this.recvBuffers[i + 1]}`);
                            // console.log(`  - i+2 (dataLength): ${this.recvBuffers[i + 2]}`);
                            // console.log(`  - i+3 (command/port?): ${this.recvBuffers[i + 3]}`);
                            // console.log(`  - i+4 (sensorType): ${this.recvBuffers[i + 4]}`);
                            if (i + 5 < this.recvBuffers.length) console.log(`  - i+5 (pin?): ${this.recvBuffers[i + 5]}`);
                            if (i + 6 < this.recvBuffers.length) console.log(`  - i+6 (duration?): ${this.recvBuffers[i + 6]}`);
                            if (i + 7 < this.recvBuffers.length) console.log(`  - i+7 (value low?): ${this.recvBuffers[i + 7]}`);
                            if (i + 8 < this.recvBuffers.length) console.log(`  - i+8 (value high?): ${this.recvBuffers[i + 8]}`);
                            
                            // 일반 센서 구조로 파싱 (i+3이 port로 사용됨)
                            const valueLowByte = this.recvBuffers[i + 5];
                            const valueHighByte = this.recvBuffers[i + 6];
                            const value = (valueHighByte << 8) | valueLowByte;
                            
                            // console.log(`[PARSED] Port: ${port} (from i+3), SensorType: 0x${sensorType.toString(16).toUpperCase()}, Value: ${value} (Low: ${valueLowByte}, High: ${valueHighByte})`);
                            
                            // Process extracted data
                            this.processParsedData(port, sensorType, value);
                        } else {
                            // 일반 센서: 255 85 datalength port sensortype value(low) value(high)
                            const valueLowByte = this.recvBuffers[i + 5];
                            const valueHighByte = this.recvBuffers[i + 6];
                            const value = (valueHighByte << 8) | valueLowByte;
                            
                            // 칼라센서일 때 로그 출력
                            // if (sensorType === this.sensorTypes.READ_COLOR_SENSOR) {
                            //     console.log('========================================');
                            //     console.log('[COLOR_SENSOR] Protocol packet parsed');
                            //     console.log('  - Packet start index:', i);
                            //     console.log('  - Data length:', dataLength);
                            //     console.log('  - Port:', port);
                            //     console.log('  - SensorType:', sensorType, `(0x${sensorType.toString(16).toUpperCase()})`);
                            //     console.log('  - Value Low Byte:', valueLowByte, 'High Byte:', valueHighByte);
                            //     console.log('  - Value (combined):', value);
                            //     console.log('  - Full packet bytes:', this.recvBuffers.slice(i, i + 2 + dataLength).join(', '));
                            // }
                            
                            // console.log(`[PARSED] Port: ${port}, SensorType: 0x${sensorType.toString(16).toUpperCase()}, Value: ${value} (Low: ${valueLowByte}, High: ${valueHighByte})`);
                            
                            // Process extracted data
                            this.processParsedData(port, sensorType, value);
                        }
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
        // Hardware response data
        // console.log('========================================');
        // console.log('[RESPONSE BUFFER] Raw data from hardware');
        // console.log('  - Buffer length:', data.length, 'bytes');
        // console.log('  - Byte array (decimal):', [...data]);
        // console.log('  - Byte array (hex):', [...data].map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
        
        //*************하드웨어에서 오는 데이터 확인************//
        // Check if it's a protocol packet (starts with 0xFF 0x55)
        // if (data.length >= 2 && data[0] === 0xFF && data[1] === 0x55) {
        //     console.log('[HW -> Entry] Protocol packet detected');
        //     if (data.length >= 3) {
        //         const dataLength = data[2];
        //         if (data.length >= 5) {
        //             const port = data[3];
        //             const sensorType = data[4];
        //             console.log(`  - Port: ${port}, SensorType: 0x${sensorType.toString(16).toUpperCase()}`);
        //             if (data.length >= 7) {
        //                 const valueLow = data[5];
        //                 const valueHigh = data[6];
        //                 const value = (valueHigh << 8) | valueLow;
        //                 console.log(`  - Value Low Byte: ${valueLow}, High Byte: ${valueHigh}`);
        //                 console.log(`  - Value (combined): ${value}`);
        //                 console.log(`  - Full buffer: [${[...data].join(', ')}]`);
        //             }
        //         }
        //     }
        // }

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

        // console.log('test');
        const readData = handler.read('SET');

            // console.log("handleRemoteData", readData);
            if (readData) {
            // console.log("[handleRemoteData]", readData);
            //Write
            if (readData.type === this.command.WRITE) {
                let buffer = Buffer.alloc(0);
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
                        console.log('digitalWrite', readData.data);
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
    
                                    duration : slideSpeed,  // slideSpeed를 data 위치(8번째 인덱스)에 저장
                                    message : printMessage,
                                    color : colorValue,
                                }),
                            ]);
                            console.log(`[speed] : ${slideSpeed}`);
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

                    case this.sensorTypes.CUSTOM_NEOPIXEL_LED:
                        console.log('[CUSTOM_NEOPIXEL_LED] Request from Entry');
                        const payload = readData.data.payload; // "255,0,0:0,255,0:0,0,255" 형식
                        colorValue = readData.data.color; // let으로 이미 선언된 변수에 할당
                        console.log(`  - Color Value: ${colorValue}`);
                        console.log(`  - Payload: ${payload}`);
                        console.log(`  - Payload length: ${payload ? payload.length : 0}`);
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.CUSTOM_NEOPIXEL_LED, // 0x41
                                    pin: 0, // payload에 모든 정보가 포함되어 있으므로 pin은 0 또는 사용하지 않음
                                    message : payload, // payload를 message로 전달 (모든 LED의 RGB 정보 포함)
                                    color : colorValue
                                    // color는 사용하지 않음 - payload에 모든 색상 정보가 포함되어 있음
                                }),
                            ]);

                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;

                    // OLED 초기화 명령어
                    // case this.sensorTypes.DISPLAY_INIT_OLED:
                    //     // console.log('DISPLAY_INIT_OLED');
                    //     port = readData.data.address;
                    //     buffer = Buffer.concat(
                    //         [buffer,
                    //             this.makeOutputBuffer({
                    //                 command : this.command.WRITE,
                    //                 sensorType : this.sensorTypes.DISPLAY_INIT_OLED,
                    //                 pin: port,
                    //             }),
                    //         ]);
                    //     if (buffer.length) {
                    //         //이곳에서 데이터를 SendBuffer에 저장하기
                    //         this.sendBuffers.push(buffer);
                    //     }
                    //     break;

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
                                }),
                            ]);
                        if (buffer.length) {
                            //이곳에서 데이터를 SendBuffer에 저장하기
                            this.sendBuffers.push(buffer);
                        }
                        break;

                    case this.sensorTypes.OLED_PRINT:
                        // console.log('OLED_DISPLAY');
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.WRITE,
                                    sensorType : this.sensorTypes.OLED_PRINT,
                                }),
                            ]);
                        if (buffer.length) {
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

                    case this.sensorTypes.OLED_HEXA:
                    // 실제 하드웨어로 디지털 쓰기 명령을 전송하는 코드
                    port = readData.data.pin;
                    value = readData.data.value;
                    buffer = Buffer.concat(
                        [buffer,
                            this.makeOutputBuffer({
                                command : this.command.WRITE,
                                sensorType : this.sensorTypes.OLED_HEXA,
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

                    case this.sensorTypes.WRITE_MOTOR_SENSOR:
                    // 실제 하드웨어로 모터 속도 명령을 전송하는 코드
                    port = readData.data.pin;
                    value = readData.data.speed;
                    buffer = Buffer.concat(
                        [buffer,
                            this.makeOutputBuffer({
                                command : this.command.WRITE,
                                sensorType : this.sensorTypes.WRITE_MOTOR_SENSOR,
                                pin : port,
                                data : value,  // speed 값을 data로 전달
                            }),
                        ]);
                    if (buffer.length) {
                        //이곳에서 데이터를 SendBuffer에 저장하기
                        this.sendBuffers.push(buffer);
                    }
                    break;

                    case this.sensorTypes.WRITE_SERVOMOTOR_SENSOR:
                    // 실제 하드웨어로 디지털 쓰기 명령을 전송하는 코드
                    port = readData.data.pin;
                    value = readData.data.angle;
                    buffer = Buffer.concat(
                        [buffer,
                            this.makeOutputBuffer({
                                command : this.command.WRITE,
                                sensorType : this.sensorTypes.WRITE_SERVOMOTOR_SENSOR,
                                pin : port,
                                data : value,
                            }),
                        ]);
                    if (buffer.length) {
                        //이곳에서 데이터를 SendBuffer에 저장하기
                        this.sendBuffers.push(buffer);
                    }
                    break;

                    case this.sensorTypes.WRITE_VEHICLE_LED:
                    // 실제 하드웨어로 디지털 쓰기 명령을 전송하는 코드
                    port = readData.data.pin;
                    value = readData.data.value;
                    buffer = Buffer.concat(
                        [buffer,
                            this.makeOutputBuffer({
                                command : this.command.WRITE,
                                sensorType : this.sensorTypes.WRITE_VEHICLE_LED,
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
                }
            }

            //****************** Read ******************
            if (readData.type === this.command.READ) {
                let buffer = Buffer.alloc(0);
                let port;
                let value;
                // console.log('this.command.READ');
                switch (readData.data.command) {
                    case this.sensorTypes.DIGITAL_READ:
                        port = readData.data.pin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    sensorType : this.sensorTypes.DIGITAL_READ,
                                    pin : port,
                                }),
                            ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;

                    case this.sensorTypes.ANALOG_READ:
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

                    case this.sensorTypes.READ_GYRO_INTENSITY:
                        port = readData.data.pin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    sensorType : this.sensorTypes.READ_GYRO_INTENSITY,
                                    pin : port,
                                }),
                            ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;

                    case this.sensorTypes.READ_DHT_SENSOR:
                        port = readData.data.pin;
                        value = readData.data.dht11;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    pin : port,
                                    sensorType : this.sensorTypes.READ_DHT_SENSOR,
                                    data : value,
                                }),
                            ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                        
                    case this.sensorTypes.READ_ULTRASONIC_SENSOR:
                        port = readData.data.pin;
                        value = readData.data.value;
                        buffer = Buffer.concat([
                            buffer,
                            this.makeOutputBuffer({
                            command: this.command.READ,
                            sensorType: this.sensorTypes.READ_ULTRASONIC_SENSOR, // 0x18
                            pin: port,
                            data: value,
                            }),
                        ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;

                    case this.sensorTypes.READ_WEIGHT_SENSOR:
                        console.log('READ_WEIGHT_SENSOR : ');
                        port = readData.data.pin;
                        value = readData.data.sck;
                        this.weightSensorRequestPort = port;
                        buffer = Buffer.concat([
                            buffer,
                            this.makeOutputBuffer({
                            command: this.command.READ,
                            sensorType: this.sensorTypes.READ_WEIGHT_SENSOR, // 0x26
                            pin: port,
                            duration : value,
                            }),
                        ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    
                    case this.sensorTypes.READ_WEATHER_SENSOR:
                        port = readData.data.pin;
                        value = readData.data.value;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                    command : this.command.READ,
                                    pin : port,
                                    sensorType : this.sensorTypes.READ_WEATHER_SENSOR, // 0x19
                                }),
                        ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                        
                    case this.sensorTypes.READ_LINE_SENSOR:
                        port = readData.data.pin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                command: this.command.READ,
                                pin: port,
                                sensorType: this.sensorTypes.READ_LINE_SENSOR, // 0x20
                            }),
                        ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;

                    case this.sensorTypes.READ_DUST_SENSOR:
                        port = readData.data.pin;
                        value = readData.data.pm;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                command: this.command.READ,
                                pin : Number(port),
                                sensorType: this.sensorTypes.READ_DUST_SENSOR, // 0x28
                                data: value,
                            }),
                        ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;

                    case this.sensorTypes.READ_WATERQUALITY_SENSOR:
                        port = readData.data.pin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                command: this.command.READ,
                                pin : port,
                                sensorType: this.sensorTypes.READ_WATERQUALITY_SENSOR, // 0x29
                            }),
                        ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    
                    case this.sensorTypes.READ_WATERTEMPERATURE_SENSOR:
                        port = readData.data.pin;
                        value = readData.data.value;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                command: this.command.READ,
                                pin : port,
                                sensorType: this.sensorTypes.READ_WATERTEMPERATURE_SENSOR, // 0x29
                                data : value,
                            }),
                        ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;
                    case this.sensorTypes.READ_SOUND_SENSOR:
                        port = readData.data.pin;
                        buffer = Buffer.concat(
                            [buffer,
                                this.makeOutputBuffer({
                                command: this.command.READ,
                                pin : port,
                                sensorType: this.sensorTypes.READ_SOUND_SENSOR, // 0x31
                            }),
                        ]);
                        if (buffer.length) {
                            this.sendBuffers.push(buffer);
                        }
                        break;

                    case this.sensorTypes.READ_PRESSURE_SENSOR:
                    port = readData.data.pin;
                    buffer = Buffer.concat(
                        [buffer,
                            this.makeOutputBuffer({
                            command: this.command.READ,
                            pin : Number(port),
                            sensorType: this.sensorTypes.READ_PRESSURE_SENSOR, // 0x32
                        }),
                    ]);
                    if (buffer.length) {
                        this.sendBuffers.push(buffer);
                    }
                    break;

                    case this.sensorTypes.READ_CO2_SENSOR:
                    port = readData.data.pin;
                    buffer = Buffer.concat(
                        [buffer,
                            this.makeOutputBuffer({
                            command: this.command.READ,
                            pin : Number(port),
                            sensorType: this.sensorTypes.READ_CO2_SENSOR, // 0x32
                        }),
                    ]);
                    if (buffer.length) {
                        this.sendBuffers.push(buffer);
                    }
                    break;

                    case this.sensorTypes.READ_COLOR_SENSOR:
                    port = readData.data.pin;
                    buffer = Buffer.concat(
                        [buffer,
                            this.makeOutputBuffer({
                            command : this.command.READ,
                            sensorType : this.sensorTypes.READ_COLOR_SENSOR, // 0x6
                            pin : port,
                            color : readData.data.color,
                        }),
                    ]);
                    if (buffer.length) {
                        this.sendBuffers.push(buffer);
                    }
                    break;

                    case this.sensorTypes.READ_TOUCH_SENSOR:
                    port = readData.data.pin;
                    buffer = Buffer.concat(
                        [buffer,
                            this.makeOutputBuffer({
                            command : this.command.READ,
                            sensorType : this.sensorTypes.READ_TOUCH_SENSOR, // 0x34
                            pin : port,
                        }),
                    ]);
                    if (buffer.length) {
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
        console.log("connected");
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
