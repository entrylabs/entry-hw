const _ = global.$;
const BaseModule = require('./baseModule');

// -- Command Type
const COMMANDTYPE_WRITE = 0x01;
// const COMMANDTYPE_READ = 0x02;
// const COMMANDTYPE_RETURN = 0x03;

const HWTYPE_KAMIBOT = 0x01;

const commandTypes = {
    BLOCK_MOVE_FORWARD: 0x01,
    BLOCK_MOVE_BACKWARD: 0x21,
    BLOCK_TURN_LEFT: 0x02,
    BLOCK_TURN_RIGHT: 0x03,
    BLOCK_TURN_BACK: 0x04,
    /** */
    MOVE_FORWARD_LINE: 0x22,
    TURN_LEFT_LINE: 0x23,
    TURN_RIGHT_LINE: 0x24,
    TURN_BACK_LINE: 0x25,
    /** */
    TOGGLE_LINERRACER: 0x05,
    MOVE_FORWARD_SPEED: 0x06,
    MOVE_LEFT_SPEED: 0x07,
    MOVE_RIGHT_SPEED: 0x08,
    MOVE_BACKWARD_SPEED: 0x09,
    MOVE_FORWARD_LRSPEED: 0x0A,
    MOVE_BACKWARD_LRSPEED: 0x0B,
    MOVE_LRSPEED: 0x26,

    MOVE_UNIT: 0x27,
    SPIN_DEGREE: 0x28,

    TOPMOTOR_TURN: 0x29,
    TOPMOTOR_MOVE_ABSOLUTE: 0x2A,
    TOPMOTOR_MOVE_RELATIVE: 0x2B,
    TOPMOTOR_STOP: 0x2C,

    STOP_KAMIBOT: 0x0C,
    RESET_KAMIBOT: 0x0D,

    SET_LED_COLOR: 0x0E,
    LED_TURN: 0x2D,

    DRAW_SHAPE: 0x31,
    DRAW_CIRCLE: 0x32,
    MELODY_BEEP: 0x33,
    MELODY_MUTE: 0x34,

    EMERGENCY_STOP: 0x35,
    RESET_INITIALIZE: 0x36,

    KAMIBOT_CLEAR: 0x17,
    PING: 0x18,
    RESET: 0xFF,
};

const NULL_MODE_PACKET = [
    0x41,
    0x14,
    0x01,
    HWTYPE_KAMIBOT,
    COMMANDTYPE_WRITE,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x5a,
];

const IDX_START = 0;
const IDX_LENGTH = 1;
const IDX_HWID = 2;
const IDX_HWTYPE = 3;
const IDX_COMMANDTYPE = 4;
const IDX_MODETYPE = 5;
const IDX_MODECOMMAND = 6;
const IDX_DATA0 = 7;
const IDX_DATA1 = 8;
const IDX_DATA2 = 9;
const IDX_DATA3 = 10;
const IDX_DATA4 = 11;
const IDX_DATA5 = 12;
const IDX_DATA6 = 13;
const IDX_INDEX = 14;
const IDX_DATA7 = 15;
const IDX_DATA8 = 16;
const IDX_DATA9 = 17;
const IDX_DATA10 = 18;
const IDX_END = 19;

// -- Mode Type Bit --
const MODETYPE_MAPBOARD = 0x01;
const MODETYPE_CONTROL = 0x02;
const MODETYPE_PRECISION_CTR = 0X0c;
// const MODETYPE_LINE = 0x12;
const MODETYPE_RGB = 0x03;
// const MODETYPE_SERVOMOTOR = 0x04;
const MODETYPE_TOP_STEPPER = 0x04;
// const MODETYPE_ULTRA_DISTANCE = 0x05;
// const MODETYPE_ULTRA_REQ = 0x15;
// const MODETYPE_IR = 0x06;
// const MODETYPE_IR_REQ = 0x16;
// const MODETYPE_BATTERY = 0x07;
// const MODETYPE_BATTERY_REQ = 0x17;
// const MODETYPE_VERSION = 0x08;
// const MODETYPE_VERSION_REQ = 0x18;
// const MODETYPE_ALLSENSOR = 0x09;
// const MODETYPE_ALLSENSOR_REQ = 0x19;
// const MODETYPE_REALTIME = 0x0a;
// const MODETYPE_MOTOR_BALANCE = 0xaa;

const MODETYPE_LINEMAP = 0x0e;
const MODETYPE_DRAWSHAPE = 0x0b;
const MODETYPE_MELODY = 0x0d;
const MODETYPE_EMERGENCY_STOP = 0x11;
const MODETYPE_INITIALIZE = 0x22;

const RETURN_PACKET = {
    START: 0,
    LENGTH: 1,
    HWID: 2,
    HWTYPE: 3,
    CMDTYPE: 4,
    CMD: 5,
    RESULT: 6,
    BATTERY: 7,
    ULTRASONIC: 8,
    LEFTIR1: 9,
    LEFTIR2: 10,
    CENTERIR: 11,
    RIGHTIR1: 12,
    RIGHTIR2: 13,
    IDXBIT: 14,
    DATA7: 15,
    DATA8: 16,
    DATA9: 17,
    DATA10: 18,
    END: 19,
};

const ACK_RETURN_PACKET = {
    START: 0,
    LENGTH: 1,
    HWID: 2,
    HWTYPE: 3,
    COMMANDTYPE: 4,
    MODE: 5,
    ACK: 6,
    BATTERY: 7,
    LEFT_OBJECT: 8,
    RIGHT_OBJECT: 9,
    LEFT_LINE: 10,
    CENTER_LINE: 11,
    RIGHT_LINE: 12,
    COLOR: 13,
    INDEX: 14,
    DATA0: 15,
    DATA1: 16,
    DATA2: 17,
    DATA3: 18,
    END: 19,
};

// const CMDTYPE = {
//     COMPLETE: 0x04,
//     SENSORDATA: 0X05,
// };
// const RESULT = {
//     SUCCESS: 0x00,
//     FAIL: 0X01,
// };

const SEND_PACKET = {
    START: 0x41,
    END: 0x5A,
};

const LED_COLORS = {
    'RED': [0xFF, 0x00, 0x00],
    'PINK': [0xFF, 0x00, 0xFF],
    'BLUE': [0x00, 0x00, 0xFF],
    'SKY': [0x00, 0xFF, 0xFF],
    'GREEN': [0x00, 0xFF, 0x00],
    'YELLOW': [0xFF, 0xFF, 0x00],
    'WHITE': [0xFF, 0xFF, 0xFF],
};

class KamibotPi extends BaseModule {
    constructor() {
        super();
        this._hwid = 0x01;
        this.sendBuffers = [];
        this.rcvBuffers = [];
        this.cmdBuffers = [];
        this.runningMsgID = [];
        this.executeCheckList = [];
        this.executeCount = 0;
        // *********
        this.isSendInitData = false;
    }

    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData(serialport) {
        if (!this.isSendInitData) {
            const index = this.getExecuteCount();
            const cmdPing = this.makeData(index, {
                id: 0,
                type: commandTypes.PING,
                time: Date.now(),
            });
            // console.log("***", cmdPing);
            serialport.write(cmdPing, () => {
                serialport.drain(() => {
                    // console.log('**** >>>Send Data:');
                    console.log(cmdPing);
                    this.isSendInitData = true;
                });
            });
        }
        return null;
    };

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        // console.log("*** >>>checkInitialData");
        // console.log(data)
        return true;
    };

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    };

    /**
     * 엔트리에서 받은 데이터에 대한 처리
     * @param {*} handler 
     */
    handleRemoteData(handler) {
        const msgId = handler.serverData.msg_id;
        const msg = handler.serverData.msg;
        if (!msgId || this.executeCheckList.indexOf(msgId) >= 0) {
            return;
        }
        const index = this.getExecuteCount();
        this.executeCheckList[index] = msg.id;
        const sendData = this.makeData(index, msg);
        this.sendBuffers.push(sendData);
    }

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        if (this.sendBuffers.length > 0) {
            const cmd = this.sendBuffers.shift();
            if (cmd.length != 20) {
                return;
            }
            return cmd;
        }
        return;
    };

    /**
     * 하드웨어에서 온 데이터 처리
     * @param {*} data 
     */
    handleLocalData(data) {
        this.rcvBuffers.push(...data);
        if (this.rcvBuffers.length < 20) {
            return;
        }
        let idx = this.rcvBuffers.indexOf(SEND_PACKET.END);
        if (idx < 0) {
            return;
        }

        if (idx < 19 && this.rcvBuffers[0] != SEND_PACKET.START) {
            const trash = this.rcvBuffers.splice(0, idx + 1);
            return;
        } else if (idx < 19 && this.rcvBuffers.length < 20) {
            return;
        } else if (idx < 19 && this.rcvBuffers.length >= 20) {
            idx = this.rcvBuffers.indexOf(SEND_PACKET.END, idx + 1);
        }
        const rcvData = this.rcvBuffers.splice(0, idx + 1);
        this.cmdBuffers.push(rcvData);
    };

    /**
     * 엔트리로 전달할 데이터
     * @param {*} handler 
     */
    requestRemoteData(handler) {
        if (this.cmdBuffers.length > 0) {
            const data = this.cmdBuffers.shift();

            const index = data[RETURN_PACKET.IDXBIT];
            const type = data[RETURN_PACKET.CMDTYPE];

            if (data[RETURN_PACKET.CMDTYPE] == 0x04 || data[RETURN_PACKET.CMDTYPE] == 0x03) {
                this.sendResultData(handler, data);
            } else if (data[RETURN_PACKET.CMDTYPE] == 0x05) {
                // this.sendSensorData(handler, data);
                this.parseAckPacket(handler, data);
            }
        }
    };

    getExecuteCount() {
        if (this.executeCount < 255) {
            this.executeCount++;
        } else {
            this.executeCount = 0;
        }
        return this.executeCount;
    }

    parseAckPacket = (handler, packet) => {
        if (packet.length < 20) {
            return null;
        }
        // const sensor = new Object();
        // for lint error
        const sensor = {};
        sensor.hwid = packet[ACK_RETURN_PACKET.ACK_HWID];
        sensor.hwtype = packet[ACK_RETURN_PACKET.HWTYPE];
        sensor.retType = packet[ACK_RETURN_PACKET.COMMANDTYPE];
        sensor.mode = packet[ACK_RETURN_PACKET.MODE];
        sensor.ack = packet[ACK_RETURN_PACKET.ACK];
        sensor.battery = packet[ACK_RETURN_PACKET.BATTERY];
        sensor.leftObject = packet[ACK_RETURN_PACKET.LEFT_OBJECT];
        sensor.rigthObject = packet[ACK_RETURN_PACKET.RIGHT_OBJECT];
        sensor.leftLine = packet[ACK_RETURN_PACKET.LEFT_LINE];
        sensor.centerLine = packet[ACK_RETURN_PACKET.CENTER_LINE];
        sensor.rightLine = packet[ACK_RETURN_PACKET.RIGHT_LINE];
        sensor.color = packet[ACK_RETURN_PACKET.COLOR];
        sensor.index = packet[ACK_RETURN_PACKET.INDEX];
        sensor.r = packet[ACK_RETURN_PACKET.DATA0]; //r
        sensor.g = packet[ACK_RETURN_PACKET.DATA1]; //g
        sensor.b = packet[ACK_RETURN_PACKET.DATA2]; //b
        sensor.white = packet[ACK_RETURN_PACKET.DATA3]; //white
        sensor.time = Date.now();

        // console.log('### sensorData >>> ');
        // console.log(sensor);
        handler.write('sensorData', sensor);
    };

    /**
     * 엔트리로 보낼 실행 결과 처리 
     * @param {*} handler 
     * @param {*} data 카미봇에서 받은 데이터
     */
    sendResultData(handler, data) {
        const index = data[RETURN_PACKET.IDXBIT];
        const msgId = this.executeCheckList[index];
        if (msgId == undefined || msgId == '') {
            return;
        }
        handler.write('msg_id', msgId);
    };

    makeData(id, msg) {
        let command = [];
        const type = msg.type;
        const data = msg.data;

        switch (type) {
            case commandTypes.PING: {
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = 0x0A;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_INDEX] = id;
                break;
            }
            /* 블록: 앞으로 (1)칸 가기 */
            case commandTypes.BLOCK_MOVE_FORWARD: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
                command[IDX_MODECOMMAND] = 0x01; // 앞으로(맵보드)
                command[IDX_DATA0] = param1;
                command[IDX_INDEX] = id;
                break;
            }
            /* 블록: 뒤로 (1)칸 가기  BLOCK_MOVE_BACKWARD */
            case commandTypes.BLOCK_MOVE_BACKWARD: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
                command[IDX_MODECOMMAND] = 0x04; // 뒤(맵보드)
                command[IDX_DATA0] = param1;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.BLOCK_TURN_LEFT: {
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
                command[IDX_MODECOMMAND] = 0x03; // 왼쪽(맵보드)
                command[IDX_DATA0] = 1;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.BLOCK_TURN_RIGHT: {
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
                command[IDX_MODECOMMAND] = 0x02; // 오른쪽(맵보드)
                command[IDX_DATA0] = 1;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.BLOCK_TURN_BACK: {
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
                command[IDX_MODECOMMAND] = 0x05; // 뒤로 돌기(맵보드)
                command[IDX_DATA0] = 1;
                command[IDX_INDEX] = id;
                break;
            }
            // '----------------------------------------------------------------------'
            /* 라인: 앞으로 (1)칸 가기 */
            case commandTypes.MOVE_FORWARD_LINE: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_LINEMAP;
                command[IDX_MODECOMMAND] = 0x01; // 앞으로(맵보드)
                command[IDX_DATA0] = param1;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.TURN_LEFT_LINE: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_LINEMAP;
                command[IDX_MODECOMMAND] = 0x03;
                command[IDX_DATA0] = param1;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.TURN_RIGHT_LINE: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_LINEMAP;
                command[IDX_MODECOMMAND] = 0x02;
                command[IDX_DATA0] = param1;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.TURN_BACK_LINE: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_LINEMAP;
                command[IDX_MODECOMMAND] = 0x04;
                command[IDX_DATA0] = param1;
                command[IDX_INDEX] = id;
                break;
            }
            // '----------------------------------------------------------------------'
            case commandTypes.MOVE_FORWARD_SPEED: {
                const { param1, param2 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_CONTROL;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_DATA0] = 0x00;
                command[IDX_DATA1] = param1;
                command[IDX_DATA2] = 0x00;
                command[IDX_DATA3] = param2;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.MOVE_LEFT_SPEED: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_CONTROL;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_DATA0] = 0x00;
                command[IDX_DATA1] = 0x00;
                command[IDX_DATA2] = 0x00;
                command[IDX_DATA3] = param1;

                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.MOVE_RIGHT_SPEED: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_CONTROL;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_DATA0] = 0x00;
                command[IDX_DATA1] = param1;
                command[IDX_DATA2] = 0x00;
                command[IDX_DATA3] = 0x00;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.MOVE_BACKWARD_SPEED: {
                const { param1 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_CONTROL;
                command[IDX_MODECOMMAND] = 0x00;

                command[IDX_DATA0] = 0x01;
                command[IDX_DATA1] = param1;
                command[IDX_DATA2] = 0x01;
                command[IDX_DATA3] = param1;

                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.MOVE_LRSPEED: {
                const { param1, param2, param3, param4 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_CONTROL;
                command[IDX_MODECOMMAND] = 0x00;

                command[IDX_DATA0] = param4;  //right-dir
                command[IDX_DATA1] = param3;  // right-speed
                command[IDX_DATA2] = param2;  // left-dir
                command[IDX_DATA3] = param1;  //left-speed

                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.MOVE_UNIT: {
                const { param1, param2, param3 } = data; // 방향, 거리, 속도 
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_PRECISION_CTR;
                command[IDX_MODECOMMAND] = param1;    //0x01 앞으로, 0x04 뒤로

                command[IDX_DATA0] = param2 & 0x00ff;        // LOW BIT
                command[IDX_DATA1] = (param2 >> 8) & 0x00ff; // HIGH BIT
                command[IDX_DATA2] = param3;    // speed

                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.SPIN_DEGREE: {
                const { param1, param2, param3 } = data; // 왼쪽, 오른쪽, 각도 
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_PRECISION_CTR;
                command[IDX_MODECOMMAND] = 0x11; //스텝단위

                command[IDX_DATA0] = param2;
                command[IDX_DATA1] = param3 & 0x00ff; // LOW BIT
                command[IDX_DATA2] = (param3 >> 8) & 0x00ff; // HIGH BIT
                command[IDX_DATA3] = 100; // 속도
                command[IDX_DATA4] = param1;
                command[IDX_DATA5] = param3 & 0x00ff; // LOW BIT
                command[IDX_DATA6] = (param3 >> 8) & 0x00ff; // HIGH BIT
                command[IDX_DATA7] = 100; // 속도

                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.TOPMOTOR_TURN: {
                const { param1, param2, param3 } = data; // 방향, 속도, 토크  
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_TOP_STEPPER;
                command[IDX_MODECOMMAND] = 0x00;    // 각도
                command[IDX_DATA0] = 0xff;    // LOW BIT
                command[IDX_DATA1] = 0xff;    // HIGH BIT
                command[IDX_DATA2] = param1;
                command[IDX_DATA3] = param2;
                command[IDX_DATA4] = param3;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.TOPMOTOR_MOVE_ABSOLUTE: {
                const { param1, param2, param3 } = data; // speed, degree, torgue 
                command = [...NULL_MODE_PACKET];
                const degree = param2;
                const dir = 0x03;    // 절대각도  
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_TOP_STEPPER;
                command[IDX_MODECOMMAND] = 0x00; // 각도, 조절
                command[IDX_DATA0] = degree & 0x00ff; // LOW BIT
                command[IDX_DATA1] = (degree >> 8) & 0x00ff; // HIGH BIT
                command[IDX_DATA2] = dir;
                command[IDX_DATA3] = param1;
                command[IDX_DATA4] = param3;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.TOPMOTOR_MOVE_RELATIVE: {
                const { param1, param2, param3 } = data; // speed, degree, torgue 
                command = [...NULL_MODE_PACKET];
                const degree = param2;
                const dir = 0x01;    // 상대각도  
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_TOP_STEPPER;
                command[IDX_MODECOMMAND] = 0x00; // 각도, 조절
                command[IDX_DATA0] = degree & 0x00ff; // LOW BIT
                command[IDX_DATA1] = (degree >> 8) & 0x00ff; // HIGH BIT
                command[IDX_DATA2] = dir;
                command[IDX_DATA3] = param1;
                command[IDX_DATA4] = param3;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.TOPMOTOR_STOP: {
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_TOP_STEPPER;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_DATA0] = 0x00;
                command[IDX_DATA1] = 0x00;
                command[IDX_DATA2] = 0x04;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.MOVE_FORWARD_LRSPEED: {
                const { param1, param2 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_CONTROL;
                command[IDX_MODECOMMAND] = 0x00;

                command[IDX_DATA0] = 0x00;
                command[IDX_DATA1] = param1;  // right
                command[IDX_DATA2] = 0x00;
                command[IDX_DATA3] = param2; //left

                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.MOVE_BACKWARD_LRSPEED: {
                const { param1, param2 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_CONTROL;
                command[IDX_MODECOMMAND] = 0x00;

                command[IDX_DATA0] = 0x01;
                command[IDX_DATA1] = param1;  // right
                command[IDX_DATA2] = 0x01;
                command[IDX_DATA3] = param2; // left

                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.STOP_KAMIBOT: {
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_CONTROL;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_DATA0] = 0x02;
                command[IDX_DATA2] = 0x02;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.SET_LED_COLOR: {
                const { param1 } = data;
                const color = LED_COLORS[param1.toUpperCase()];

                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_RGB;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_DATA0] = color[0]; // R
                command[IDX_DATA1] = color[1]; // G
                command[IDX_DATA2] = color[2]; // B
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.LED_TURN: {
                const { param1, param2, param3 } = data;
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_RGB;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_DATA0] = param1; // R
                command[IDX_DATA1] = param2; // G
                command[IDX_DATA2] = param3; // B
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.DRAW_SHAPE: {
                const { param1, param2 } = data;    // shape, value
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_DRAWSHAPE;
                command[IDX_MODECOMMAND] = param1;
                command[IDX_DATA0] = param2;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.MELODY_BEEP: {
                const { param1, param2 } = data;    // freq, sec
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
                command[IDX_MODETYPE] = MODETYPE_MELODY;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_DATA0] = param1;
                command[IDX_DATA1] = param2;
                command[IDX_DATA2] = 0x00;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.EMERGENCY_STOP: {
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_EMERGENCY_STOP;
                command[IDX_MODECOMMAND] = 0x00;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.RESET_INITIALIZE: {
                command = [...NULL_MODE_PACKET];
                command[IDX_HWID] = this._hwid;
                command[IDX_MODETYPE] = MODETYPE_INITIALIZE;
                command[IDX_MODECOMMAND] = 0x01;
                command[IDX_INDEX] = id;
                break;
            }
            case commandTypes.TOGGLE_LINERRACER: {
                break;
            }
            case commandTypes.RESET_KAMIBOT: {
                break;
            }
            case commandTypes.KAMIBOT_CLEAR: {
                break;
            }
            case commandTypes.RESET: {
                break;
            }
            default:
                break;
        } //switch
        return command;
    };
} // end of class

module.exports = new KamibotPi();
