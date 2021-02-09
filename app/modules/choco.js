const _ = global.$;
const BaseModule = require('./baseModule');

class Choco extends BaseModule {
    /***************************************************************************************
     *  클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
     ***************************************************************************************/
    // #region Constructor
    constructor() {
        super();

        this.crctab16 = new Uint16Array([
            0X0000, 0X1189, 0X2312, 0X329B, 0X4624, 0X57AD, 0X6536, 0X74BF,
            0X8C48, 0X9DC1, 0XAF5A, 0XBED3, 0XCA6C, 0XDBE5, 0XE97E, 0XF8F7,
            0X1081, 0X0108, 0X3393, 0X221A, 0X56A5, 0X472C, 0X75B7, 0X643E,
            0X9CC9, 0X8D40, 0XBFDB, 0XAE52, 0XDAED, 0XCB64, 0XF9FF, 0XE876,
            0X2102, 0X308B, 0X0210, 0X1399, 0X6726, 0X76AF, 0X4434, 0X55BD,
            0XAD4A, 0XBCC3, 0X8E58, 0X9FD1, 0XEB6E, 0XFAE7, 0XC87C, 0XD9F5,
            0X3183, 0X200A, 0X1291, 0X0318, 0X77A7, 0X662E, 0X54B5, 0X453C,
            0XBDCB, 0XAC42, 0X9ED9, 0X8F50, 0XFBEF, 0XEA66, 0XD8FD, 0XC974,
            0X4204, 0X538D, 0X6116, 0X709F, 0X0420, 0X15A9, 0X2732, 0X36BB,
            0XCE4C, 0XDFC5, 0XED5E, 0XFCD7, 0X8868, 0X99E1, 0XAB7A, 0XBAF3,
            0X5285, 0X430C, 0X7197, 0X601E, 0X14A1, 0X0528, 0X37B3, 0X263A,
            0XDECD, 0XCF44, 0XFDDF, 0XEC56, 0X98E9, 0X8960, 0XBBFB, 0XAA72,
            0X6306, 0X728F, 0X4014, 0X519D, 0X2522, 0X34AB, 0X0630, 0X17B9,
            0XEF4E, 0XFEC7, 0XCC5C, 0XDDD5, 0XA96A, 0XB8E3, 0X8A78, 0X9BF1,
            0X7387, 0X620E, 0X5095, 0X411C, 0X35A3, 0X242A, 0X16B1, 0X0738,
            0XFFCF, 0XEE46, 0XDCDD, 0XCD54, 0XB9EB, 0XA862, 0X9AF9, 0X8B70,
            0X8408, 0X9581, 0XA71A, 0XB693, 0XC22C, 0XD3A5, 0XE13E, 0XF0B7,
            0X0840, 0X19C9, 0X2B52, 0X3ADB, 0X4E64, 0X5FED, 0X6D76, 0X7CFF,
            0X9489, 0X8500, 0XB79B, 0XA612, 0XD2AD, 0XC324, 0XF1BF, 0XE036,
            0X18C1, 0X0948, 0X3BD3, 0X2A5A, 0X5EE5, 0X4F6C, 0X7DF7, 0X6C7E,
            0XA50A, 0XB483, 0X8618, 0X9791, 0XE32E, 0XF2A7, 0XC03C, 0XD1B5,
            0X2942, 0X38CB, 0X0A50, 0X1BD9, 0X6F66, 0X7EEF, 0X4C74, 0X5DFD,
            0XB58B, 0XA402, 0X9699, 0X8710, 0XF3AF, 0XE226, 0XD0BD, 0XC134,
            0X39C3, 0X284A, 0X1AD1, 0X0B58, 0X7FE7, 0X6E6E, 0X5CF5, 0X4D7C,
            0XC60C, 0XD785, 0XE51E, 0XF497, 0X8028, 0X91A1, 0XA33A, 0XB2B3,
            0X4A44, 0X5BCD, 0X6956, 0X78DF, 0X0C60, 0X1DE9, 0X2F72, 0X3EFB,
            0XD68D, 0XC704, 0XF59F, 0XE416, 0X90A9, 0X8120, 0XB3BB, 0XA232,
            0X5AC5, 0X4B4C, 0X79D7, 0X685E, 0X1CE1, 0X0D68, 0X3FF3, 0X2E7A,
            0XE70E, 0XF687, 0XC41C, 0XD595, 0XA12A, 0XB0A3, 0X8238, 0X93B1,
            0X6B46, 0X7ACF, 0X4854, 0X59DD, 0X2D62, 0X3CEB, 0X0E70, 0X1FF9,
            0XF78F, 0XE606, 0XD49D, 0XC514, 0XB1AB, 0XA022, 0X92B9, 0X8330,
            0X7BC7, 0X6A4E, 0X58D5, 0X495C, 0X3DE3, 0X2C6A, 0X1EF1, 0X0F78,
        ]);

        this.SEND_PACKET = {
            START: 0x7C,
            END: 0x7E,
        };

        this.cmdSeq = 0;
        this.serialport = undefined;
        this.isConnect = false;
        this.isSendInitData = false;

        this.sendBuffers = [];
        this.executeCmd = {
            processing: 'none',
            id: '',
        };
        this.executeCheckList = [];
        this.executeCount = 0;

        this.sensorData = {
            is_front_sensor: false,
            is_bottom_sensor: false,
            is_light_sensor: false,
            front_sensor: 0,
            bottom_sensor: 0,
            light_sensor: 0,
        };

        this.sensorInit = {
            inited: 'none',
            sensor0: {
                min: 0,
                max: 0,
                threshold: 0,
            },
            sensor1: {
                min: 0,
                max: 0,
                threshold: 0,
            },
            sensor2: {
                min: 0,
                max: 0,
                threshold: 0,
            },
        };

        this.ledStatus = [0,0,0]; //right, left, rear
    }
    // #endregion Constructor

    /***************************************************************************************
     *  Entry 기본 함수
     ***************************************************************************************/
    // #region Base Functions for Entry
    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    setSerialPort(serialport) {
        this.serialport = serialport;
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData(serialport) {
        this.serialport = serialport;

        if (this.serialport) {
            if (!this.isSendInitData) {
                const cmdPing = this.makeData({
                    type: 'ping2',
                });
                this.serialport.write(cmdPing, () => {
                    this.serialport.drain(() => {
                        this.log('Send Data:');
                        this.log(cmdPing);
                        // this.isSendInitData = true; //연결이 될때까지 메시지를 보내줘야 함, 한번만 보내면 재연결 시도가 자주 발생..
                    });
                    //return cmdPing;
                });
                this.ledStatus = [0,0,0];
            }
        };

        return null;
    };

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        return true;
    };

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    };

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        //this.log('BASE - requestLocalData()');    
        if (!this.isConnect) {
            return;
        }

        if (this.sensorInit.inited === 'none') {
            const cmdReady = this.makeData({
                type: 'ready',
            });
            if (this.serialport) {
                this.sensorInit.inited = 'sent';
                this.log('Send Data:');
                this.log(cmdReady);
                this.serialport.write(cmdReady, () => {
                    this.serialport.drain();
                });
            };
        }

        if (this.sendBuffers.length > 0) {
            const cmd = this.sendBuffers.shift();
            if (this.serialport) {
                this.serialport.write(cmd.sendData, () => {
                    this.serialport.drain(() => {
                        this.log('Send Data:');
                        this.log(cmd.sendData);
                        this.executeCmd.id = cmd.id;
                        this.executeCmd.processing = 'started';
                    });
                });
            };
        }

        return;
    };

    /**
     * 하드웨어에서 온 데이터 처리
     * @param {*} data 
     */
    handleLocalData(data) {
        //this.log(`BASE - handleLocalData(): ${data.toString('hex')}`);
        if (data.length > 12 && data[0] === this.SEND_PACKET.START) {
            const idx = data.indexOf(this.SEND_PACKET.END);
            if (idx > 0) {
                const decodedData = this.escapeEecode(data.slice(1, idx));

                const command = decodedData.readUInt8();
                const seqNo = decodedData.readUInt8(1);
                const sensor0 = decodedData.readUInt16LE(2);
                const sensor1 = decodedData.readUInt16LE(4);
                const sensor2 = decodedData.readUInt16LE(6);

                this.sensorData.front_sensor = sensor0;
                this.sensorData.bottom_sensor = sensor1;
                this.sensorData.light_sensor = sensor2;

                if (decodedData.length === 29) {
                    this.sensorInit.inited = 'inited';
                    this.sensorInit.sensor0.min = decodedData.readUInt16LE(9);
                    this.sensorInit.sensor0.max = decodedData.readUInt16LE(11);
                    this.sensorInit.sensor0.threshold = decodedData.readUInt16LE(13);
                    this.sensorInit.sensor1.min = decodedData.readUInt16LE(15);
                    this.sensorInit.sensor1.max = decodedData.readUInt16LE(17);
                    this.sensorInit.sensor1.threshold = decodedData.readUInt16LE(19);
                    this.sensorInit.sensor2.min = decodedData.readUInt16LE(21);
                    this.sensorInit.sensor2.max = decodedData.readUInt16LE(23);
                    this.sensorInit.sensor2.threshold = decodedData.readUInt16LE(25);
                    //this.log(this.sensorInit);
                }
                if (this.sensorInit.inited === 'inited') {
                    if (this.sensorData.front_sensor < this.sensorInit.sensor0.min) {
                        this.sensorData.front_sensor = this.sensorInit.sensor0.min;
                    }
                    if (this.sensorData.front_sensor > this.sensorInit.sensor0.max) {
                        this.sensorData.front_sensor = this.sensorInit.sensor0.max;
                    }
                    if (this.sensorData.bottom_sensor < this.sensorInit.sensor1.min) {
                        this.sensorData.bottom_sensor = this.sensorInit.sensor1.min;
                    }
                    if (this.sensorData.bottom_sensor > this.sensorInit.sensor1.max) {
                        this.sensorData.bottom_sensor = this.sensorInit.sensor1.max;
                    }
                    if (this.sensorData.light_sensor < this.sensorInit.sensor2.min) {
                        this.sensorData.light_sensor = this.sensorInit.sensor2.min;
                    }
                    if (this.sensorData.light_sensor > this.sensorInit.sensor2.max) {
                        this.sensorData.light_sensor = this.sensorInit.sensor2.max;
                    }
                    this.sensorData.is_front_sensor = 
                        (this.sensorData.front_sensor < this.sensorInit.sensor0.threshold);
                    this.sensorData.is_bottom_sensor = 
                        (this.sensorData.bottom_sensor > this.sensorInit.sensor1.threshold);
                    this.sensorData.is_light_sensor = 
                        (this.sensorData.light_sensor < this.sensorInit.sensor2.threshold);
                }

                //  console.log(`command:${command}, len: ${decodedData.length}`, 
                //              `data:${data.toString('hex')}, seqNo:${seqNo}`,
                //              `${sensor0},${sensor1},${sensor2}`,
                //              `${this.sensorData.is_front_sensor},`,
                //              `${this.sensorData.is_bottom_sensor},`,
                //              `${this.sensorData.is_light_sensor}`,
                //              `${this.sensorData.front_sensor},`,
                //              `${this.sensorData.bottom_sensor},`,
                //              `${this.sensorData.light_sensor}`);
                if (command === 0x02 && this.executeCmd.processing === 'started') {
                    this.executeCmd.processing = 'done';
                }
            }
        }
    };

    /**
     * 엔트리로 전달할 데이터
     * @param {*} handler 
     */
    requestRemoteData(handler) {
        if (this.executeCmd.processing === 'done') {
            this.log('requestRemoteData done', this.executeCmd.id);

            handler.write('msg_id', this.executeCmd.id);
            handler.write('sensorData', this.sensorData);

            this.executeCmd.id = '';
            this.executeCmd.processing = 'none';
        }
    };

    /**
     * 엔트리에서 받은 데이터에 대한 처리
     * @param {*} handler 
     */
    handleRemoteData(handler) {
        if (!this.isConnect) {
            return;
        }

        const msgId = handler.serverData.msg_id;
        const msg = handler.serverData.msg;
        if (!msgId || this.executeCheckList.indexOf(msgId) >= 0) {
            return;
        }
        const index = this.getExecuteCount();
        this.executeCheckList[index] = msg.id;

        const sendData = this.makeData(msg);
        this.sendBuffers.push({
            id: msg.id,
            sendData,
            index,
        });
    }

    connect() {
        this.isConnect = true;
        this.sensorInit.inited = 'none';
        this.ledStatus = [0,0,0];
    }

    disconnect(connect) {
        const cmdPingEnd = this.makeData({
            type: 'ping2_end',
        });
        if (this.serialport) {
            this.serialport.write(cmdPingEnd, () => {
                this.serialport.drain(() => {
                    this.log(`Ping2 End, ${cmdPingEnd.toString('hex')}`);
                    connect.close();
                    this.isConnect = false;
                    this.serialport = undefined;
                    this.sensorInit.inited = 'none';
                });
            });
            this.isSendInitData = false;            
        }
        this.ledStatus = [0,0,0];
    }

    /*
        Web Socket 종료후 처리
    */
    reset() {
        this.executeCheckList = [];
    }
    // #endregion Base Functions for Entry



    /***************************************************************************************
     *  프로토롤 제어 함수
     ***************************************************************************************/
    sequenceNo() {
        if (this.cmdSeq > 254) {
            this.cmdSeq = 0;
        } else {
            this.cmdSeq++;
        }
        return this.cmdSeq;
    }

    getExecuteCount() {
        if (this.executeCount < 255) {
            this.executeCount++;
        } else {
            this.executeCount = 0;
        }
        return this.executeCount;
    }

    calMoveVal(args) {
        let retval = 0;
        if (args.param2 === 'cm') {
            retval = parseInt(args.param1 * 10 / 15, 10);
            if (args.param1 > 0 && retval === 0) {
                retval = 1;
            }
        } else {
            retval = args.param1 * 10;
        }
        retval = parseInt(retval, 10);
        if (retval < 0) {
            retval = 0;
        }
        if (retval > 990) {
            retval = 990;
        } 
        return retval;
    }

    calTurnVal(args) {
        let retval = 0;
        if (args.param2 === 'degree') {
            retval = parseInt(args.param1 * 10 / 90, 10);
            if (args.param1 > 0 && retval === 0) {
                retval = 1;
            }
        } else {
            retval = args.param1 * 10 * 4;
        }
        retval = parseInt(retval, 10);
        if (retval < 0) {
            retval = 0;
        }
        if (retval > 990) {
            retval = 990;
        }
        return retval;
    }

    calLedCol(args) {
        let rightLed = 0;
        let leftLed = 0;

        if (args.param1 === 'right') {
            rightLed = args.param2;
        } else if (args.param1 === 'left') {
            leftLed = args.param2;
        } else if (args.param1 === 'dual') {
            rightLed = args.param2;
            leftLed = args.param2;
        }

        return {
            rightLed,
            leftLed,
        };
    }

    /***************************************************************************************
     *  Protocol 데이터 생성
     ***************************************************************************************/
    makeData(msg) {
        const seqNo = this.sequenceNo();
        let data = null;
        let crc = 0;
        let encodedCmd = [];

        const type = msg.type;
        let args = {};
        if (msg.data) {
            args = msg.data;
        }

        switch (type) {
            case 'ping':
                data = Buffer.from([0x03, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'ping2':
                data = Buffer.from([0x13, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'ping3':
                data = Buffer.from([0x14, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'ping2_end':
                data = Buffer.from([0x17, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'ready':
                data = Buffer.from([0x04, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'move_forward':
                if (args.param2 === 'cm') {
                    data = Buffer.from([0x19, seqNo, 0, 0, 0, 0]);
                } else {
                    data = Buffer.from([0x05, seqNo, 0, 0, 0, 0]);
                }
                data.writeUInt32LE(this.calMoveVal(args), 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'move_backward':
                if (args.param2 === 'cm') {
                    data = Buffer.from([0x1A, seqNo, 0, 0, 0, 0]);
                } else {
                    data = Buffer.from([0x06, seqNo, 0, 0, 0, 0]);
                }
                data.writeUInt32LE(this.calMoveVal(args), 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'turn_left':
                data = Buffer.from([0x07, seqNo, 0, 0, 0, 0]);
                data.writeUInt32LE(this.calTurnVal(args), 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'turn_right':
                data = Buffer.from([0x08, seqNo, 0, 0, 0, 0]);
                data.writeUInt32LE(this.calTurnVal(args), 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;

            case 'move_right_left': {
                data = Buffer.from([0x0D, seqNo, 0, 0, 0, 0, 0, 0, 0, 0]);
                const args1 = {
                    param1: args.param1,
                    param2: args.param2,
                };
                const args2 = {
                    param1: args.param3,
                    param2: args.param4,
                };
                data.writeUInt32LE(this.calMoveVal(args1), 2);
                data.writeUInt32LE(this.calMoveVal(args2), 6);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;
            }
                

            case 'onoff_led_rear': {
                const rearLed = (args.param1 === 'On') ? 1 : 0;
                this.ledStatus[2] = rearLed;
                data = Buffer.from([0x0B, seqNo, this.ledStatus[0], this.ledStatus[1], this.ledStatus[2]]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;
            }
                

            case 'set_led_color': {
                const {
                    rightLed,
                    leftLed,
                } = this.calLedCol(args);
                if (args.param1 === 'right') {
                    this.ledStatus[0] = rightLed;
                } else if (args.param1 === 'left') {
                    this.ledStatus[1] = leftLed;
                } else if (args.param1 === 'dual') {
                    this.ledStatus[0] = rightLed;
                    this.ledStatus[1] = leftLed;
                }
                data = Buffer.from([0x0B, seqNo, this.ledStatus[0], this.ledStatus[1], this.ledStatus[2]]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data,
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;
            }
                

            case 'play_sound':
                data = Buffer.from([0x0F, seqNo, 0, 0, 0, 0]);
                data.writeUInt32LE(args.param1, 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(Buffer.concat([data, 
                    Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
                break;
        }

        const cmdData = Buffer.from([0x7C, ...encodedCmd, 0x7E]);
        //console.log(cmdData);
        return cmdData;
    }


    /***************************************************************************************
     *  데이터 encoding
     ***************************************************************************************/
    escapeEncode(data) {
        const buffer = Buffer.alloc(data.length * 2);
        let idx = 0;
        for (const d of data) {
            if (d === 0x7C) {
                buffer[idx] = 0x7D;
                buffer[idx + 1] = 0x5C;
                idx += 2;
            } else if (d === 0x7D) {
                buffer[idx] = 0x7D;
                buffer[idx + 1] = 0x5D;
                idx += 2;
            } else if (d === 0x7E) {
                buffer[idx] = 0x7D;
                buffer[idx + 1] = 0x5E;
                idx += 2;
            } else {
                buffer[idx] = d;
                idx++;
            }
        }
        return buffer.slice(0, idx);
    }

    /***************************************************************************************
     *  데이터 decoding
     ***************************************************************************************/
    escapeEecode(data) {
        const buffer = Buffer.alloc(data.length);
        let idx = 0;
        for (let i = 0; i < data.length;) {
            if (data[i] === 0x7D) {
                buffer[idx++] = data[i + 1] ^ 0x20;
                i += 2;
            } else {
                buffer[idx++] = data[i++];
            }
        }
        return buffer.slice(0, idx);
    }

    /***************************************************************************************
     *  CRC 생성
     ***************************************************************************************/
    calCrc16(data) {
        let res = 0x0ffff;

        for (const b of data) {
            res = ((res >> 8) & 0x0ff) ^ this.crctab16[(res ^ b) & 0xff];
        }

        return (~res) & 0x0ffff;
    }

    /***************************************************************************************
     *  로그 출력
     ***************************************************************************************/
    // #region Functions for log

    log(message, data = undefined) {
        // 로그를 출력하지 않으려면 아래 주석을 활성화 할 것
        /*
        let strInfo = '';

        switch (typeof data) {
          case 'object': {
            strInfo = ` - [ ${this.convertByteArrayToHexString(data)} ]`;
            console.log(`${message} - ${typeof data}${strInfo}`);
          }
          break;

        default: {
          console.log(message);
        }
        break;
        }
        // */
    }

    // 바이트 배열을 16진수 문자열로 변경
    convertByteArrayToHexString(data) {
        let strHexArray = '';
        let strHex;

        if (typeof data === 'object' && data.length > 1) {
            for (let i = 0; i < data.length; i++) {
                strHex = data[i].toString(16).toUpperCase();
                strHexArray += ' ';
                if (strHex.length === 1) {
                    strHexArray += '0';
                }
                strHexArray += strHex;
            }
            strHexArray = strHexArray.substr(1, strHexArray.length - 1);
        } else {
            strHexArray = data.toString();
        }

        return strHexArray;
    }
} // end of class

module.exports = new Choco();
