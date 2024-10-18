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
            0x0000, 0x1189, 0x2312, 0x329b, 0x4624, 0x57ad, 0x6536, 0x74bf, 0x8c48, 0x9dc1, 0xaf5a,
            0xbed3, 0xca6c, 0xdbe5, 0xe97e, 0xf8f7, 0x1081, 0x0108, 0x3393, 0x221a, 0x56a5, 0x472c,
            0x75b7, 0x643e, 0x9cc9, 0x8d40, 0xbfdb, 0xae52, 0xdaed, 0xcb64, 0xf9ff, 0xe876, 0x2102,
            0x308b, 0x0210, 0x1399, 0x6726, 0x76af, 0x4434, 0x55bd, 0xad4a, 0xbcc3, 0x8e58, 0x9fd1,
            0xeb6e, 0xfae7, 0xc87c, 0xd9f5, 0x3183, 0x200a, 0x1291, 0x0318, 0x77a7, 0x662e, 0x54b5,
            0x453c, 0xbdcb, 0xac42, 0x9ed9, 0x8f50, 0xfbef, 0xea66, 0xd8fd, 0xc974, 0x4204, 0x538d,
            0x6116, 0x709f, 0x0420, 0x15a9, 0x2732, 0x36bb, 0xce4c, 0xdfc5, 0xed5e, 0xfcd7, 0x8868,
            0x99e1, 0xab7a, 0xbaf3, 0x5285, 0x430c, 0x7197, 0x601e, 0x14a1, 0x0528, 0x37b3, 0x263a,
            0xdecd, 0xcf44, 0xfddf, 0xec56, 0x98e9, 0x8960, 0xbbfb, 0xaa72, 0x6306, 0x728f, 0x4014,
            0x519d, 0x2522, 0x34ab, 0x0630, 0x17b9, 0xef4e, 0xfec7, 0xcc5c, 0xddd5, 0xa96a, 0xb8e3,
            0x8a78, 0x9bf1, 0x7387, 0x620e, 0x5095, 0x411c, 0x35a3, 0x242a, 0x16b1, 0x0738, 0xffcf,
            0xee46, 0xdcdd, 0xcd54, 0xb9eb, 0xa862, 0x9af9, 0x8b70, 0x8408, 0x9581, 0xa71a, 0xb693,
            0xc22c, 0xd3a5, 0xe13e, 0xf0b7, 0x0840, 0x19c9, 0x2b52, 0x3adb, 0x4e64, 0x5fed, 0x6d76,
            0x7cff, 0x9489, 0x8500, 0xb79b, 0xa612, 0xd2ad, 0xc324, 0xf1bf, 0xe036, 0x18c1, 0x0948,
            0x3bd3, 0x2a5a, 0x5ee5, 0x4f6c, 0x7df7, 0x6c7e, 0xa50a, 0xb483, 0x8618, 0x9791, 0xe32e,
            0xf2a7, 0xc03c, 0xd1b5, 0x2942, 0x38cb, 0x0a50, 0x1bd9, 0x6f66, 0x7eef, 0x4c74, 0x5dfd,
            0xb58b, 0xa402, 0x9699, 0x8710, 0xf3af, 0xe226, 0xd0bd, 0xc134, 0x39c3, 0x284a, 0x1ad1,
            0x0b58, 0x7fe7, 0x6e6e, 0x5cf5, 0x4d7c, 0xc60c, 0xd785, 0xe51e, 0xf497, 0x8028, 0x91a1,
            0xa33a, 0xb2b3, 0x4a44, 0x5bcd, 0x6956, 0x78df, 0x0c60, 0x1de9, 0x2f72, 0x3efb, 0xd68d,
            0xc704, 0xf59f, 0xe416, 0x90a9, 0x8120, 0xb3bb, 0xa232, 0x5ac5, 0x4b4c, 0x79d7, 0x685e,
            0x1ce1, 0x0d68, 0x3ff3, 0x2e7a, 0xe70e, 0xf687, 0xc41c, 0xd595, 0xa12a, 0xb0a3, 0x8238,
            0x93b1, 0x6b46, 0x7acf, 0x4854, 0x59dd, 0x2d62, 0x3ceb, 0x0e70, 0x1ff9, 0xf78f, 0xe606,
            0xd49d, 0xc514, 0xb1ab, 0xa022, 0x92b9, 0x8330, 0x7bc7, 0x6a4e, 0x58d5, 0x495c, 0x3de3,
            0x2c6a, 0x1ef1, 0x0f78,
        ]);

        this.SEND_PACKET = {
            START: 0x7c,
            END: 0x7e,
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

        // this.previousSensorData = {};
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

        this.ledStatus = [0, 0, 0]; //right, left, rear
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
                this.ledStatus = [0, 0, 0];
            }
        }

        return null;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        return true;
    }

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    }

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
            }
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
            }
        }

        return;
    }

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
                        this.sensorData.front_sensor < this.sensorInit.sensor0.threshold;
                    this.sensorData.is_bottom_sensor =
                        this.sensorData.bottom_sensor > this.sensorInit.sensor1.threshold;
                    this.sensorData.is_light_sensor =
                        this.sensorData.light_sensor < this.sensorInit.sensor2.threshold;

                    let fVal = this.sensorData.front_sensor;
                    const fMin = this.sensorInit.sensor0.min;
                    const fMmax = this.sensorInit.sensor0.max;
                    fVal = ((fVal - fMin) * 100) / (fMmax - fMin);

                    let bVal = this.sensorData.bottom_sensor;
                    const bMin = this.sensorInit.sensor1.min;
                    const bMmax = this.sensorInit.sensor1.max;
                    bVal = ((bVal - bMin) * 100) / (bMmax - bMin);

                    let lVal = this.sensorData.light_sensor;
                    const lMin = this.sensorInit.sensor2.min;
                    const lMmax = this.sensorInit.sensor2.max;
                    lVal = ((lVal - lMin) * 100) / (lMmax - lMin);

                    this.sensorData.front_sensor = parseInt(fVal, 10);
                    if (this.sensorData.front_sensor < 0) {
                        this.sensorData.front_sensor = 0;
                    } else if (this.sensorData.front_sensor > 100) {
                        this.sensorData.front_sensor = 100;
                    }
                    this.sensorData.bottom_sensor = parseInt(bVal, 10);
                    if (this.sensorData.bottom_sensor < 0) {
                        this.sensorData.bottom_sensor = 0;
                    } else if (this.sensorData.bottom_sensor > 100) {
                        this.sensorData.bottom_sensor = 100;
                    }
                    this.sensorData.light_sensor = parseInt(lVal, 10);
                    if (this.sensorData.light_sensor < 0) {
                        this.sensorData.light_sensor = 0;
                    } else if (this.sensorData.light_sensor > 100) {
                        this.sensorData.light_sensor = 100;
                    }
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
    }

    /**
     * 엔트리로 전달할 데이터
     * @param {*} handler
     */
    requestRemoteData(handler) {
        //sensor데이터는 상태가 바뀔때 전송한다.
        // if (
        //     _.isEmpty(this.previousSensorData) ||
        //     !_.isEqual(this.previousSensorData, this.sensorData)
        // ) {
        //     handler.write('sensorData', this.sensorData);
        //     this.previousSensorData = _.cloneDeep(this.sensorData);
        // }
        handler.write('sensorData', this.sensorData);

        if (this.executeCmd.processing === 'done') {
            this.log('requestRemoteData done', this.executeCmd.id);

            handler.write('msg_id', this.executeCmd.id);
            //handler.write('sensorData', this.sensorData);

            this.executeCmd.id = '';
            this.executeCmd.processing = 'none';
        }
    }

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
        this.ledStatus = [0, 0, 0];
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
        this.ledStatus = [0, 0, 0];
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
            retval = parseInt(args.param1 * 10, 10);
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
            retval = parseInt((args.param1 * 10) / 90, 10);
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
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'ping2':
                data = Buffer.from([0x13, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'ping3':
                data = Buffer.from([0x14, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'ping2_end':
                data = Buffer.from([0x17, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'ready':
                data = Buffer.from([0x04, seqNo]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'move_forward':
                if (args.param2 === 'cm') {
                    data = Buffer.from([0x19, seqNo, 0, 0, 0, 0]);
                } else {
                    data = Buffer.from([0x05, seqNo, 0, 0, 0, 0]);
                }
                data.writeUInt32LE(this.calMoveVal(args), 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'move_backward':
                if (args.param2 === 'cm') {
                    data = Buffer.from([0x1a, seqNo, 0, 0, 0, 0]);
                } else {
                    data = Buffer.from([0x06, seqNo, 0, 0, 0, 0]);
                }
                data.writeUInt32LE(this.calMoveVal(args), 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'turn_left':
                data = Buffer.from([0x07, seqNo, 0, 0, 0, 0]);
                data.writeUInt32LE(this.calTurnVal(args), 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'turn_right':
                data = Buffer.from([0x08, seqNo, 0, 0, 0, 0]);
                data.writeUInt32LE(this.calTurnVal(args), 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;

            case 'move_right_left': {
                if (args.param3 === 'cm') {
                    data = Buffer.from([0x1b, seqNo, 0, 0, 0, 0, 0, 0, 0, 0]);
                } else {
                    data = Buffer.from([0x0d, seqNo, 0, 0, 0, 0, 0, 0, 0, 0]);
                }
                const args1 = {
                    param1: args.param1,
                    param2: args.param3,
                };
                const args2 = {
                    param1: args.param2,
                    param2: args.param3,
                };
                data.writeUInt32LE(this.calMoveVal(args1), 2);
                data.writeUInt32LE(this.calMoveVal(args2), 6);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;
            }

            case 'onoff_led_rear': {
                const rearLed = args.param1 === 'On' ? 1 : 0;
                this.ledStatus[2] = rearLed;
                data = Buffer.from([
                    0x0b,
                    seqNo,
                    this.ledStatus[0],
                    this.ledStatus[1],
                    this.ledStatus[2],
                ]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;
            }

            case 'set_led_color': {
                const { rightLed, leftLed } = this.calLedCol(args);
                if (args.param1 === 'right') {
                    this.ledStatus[0] = rightLed;
                } else if (args.param1 === 'left') {
                    this.ledStatus[1] = leftLed;
                } else if (args.param1 === 'dual') {
                    this.ledStatus[0] = rightLed;
                    this.ledStatus[1] = leftLed;
                }
                data = Buffer.from([
                    0x0b,
                    seqNo,
                    this.ledStatus[0],
                    this.ledStatus[1],
                    this.ledStatus[2],
                ]);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;
            }

            case 'play_sound':
                data = Buffer.from([0x0f, seqNo, 0, 0, 0, 0]);
                data.writeUInt32LE(args.param1, 2);
                crc = this.calCrc16(data);
                encodedCmd = this.escapeEncode(
                    Buffer.concat([data, Buffer.from([crc & 0xff, (crc >> 8) & 0xff])])
                );
                break;
        }

        const cmdData = Buffer.from([0x7c, ...encodedCmd, 0x7e]);
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
            if (d === 0x7c) {
                buffer[idx] = 0x7d;
                buffer[idx + 1] = 0x5c;
                idx += 2;
            } else if (d === 0x7d) {
                buffer[idx] = 0x7d;
                buffer[idx + 1] = 0x5d;
                idx += 2;
            } else if (d === 0x7e) {
                buffer[idx] = 0x7d;
                buffer[idx + 1] = 0x5e;
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
        for (let i = 0; i < data.length; ) {
            if (data[i] === 0x7d) {
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

        return ~res & 0x0ffff;
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
