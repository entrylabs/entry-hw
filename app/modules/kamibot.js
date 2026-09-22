const _ = global.$;
const BaseModule = require('./baseModule');

// -- Command Type
const COMMANDTYPE_WRITE = 0x01;
const COMMANDTYPE_READ = 0x02;
const COMMANDTYPE_RETURN = 0x03;

const HWTYPE_KAMIBOT = 0x01;

const commandTypes =  {
    MOVE_FORWARD: 0x01,
    TURN_LEFT: 0x02,
    TURN_RIGHT: 0x03,
    TURN_BACK: 0x04,
    TOGGLE_LINERRACER: 0x05,
    MOVE_FORWARD_SPEED: 0x06,
    MOVE_LEFT_SPEED: 0x07,
    MOVE_RIGHT_SPEED: 0x08,
    MOVE_BACKWARD_SPEED: 0x09,
    MOVE_FORWARD_LRSPEED: 0x0A,
    MOVE_BACKWARD_LRSPEED: 0x0B,
    STOP_KAMIBOT: 0x0C,
    RESET_KAMIBOT: 0x0D,
    SET_LED_COLOR: 0x0E,
    SET_SERVER_MOTOR: 0x10,
    GET_ULTRASONIC: 0x11,
    GET_IR_1: 0x12,
    GET_IR_2: 0x13,
    GET_IR_3: 0x14,
    GET_IR_4: 0x15,
    GET_IR_5: 0x16,
    KAMIBOT_CLEAR: 0x17,
    RESET:0xFF,
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
const MODETYPE_LINE = 0x12;
const MODETYPE_RGB = 0x03;
const MODETYPE_SERVOMOTOR = 0x04;
const MODETYPE_ULTRA_DISTANCE = 0x05;
const MODETYPE_ULTRA_REQ = 0x15;
const MODETYPE_IR = 0x06;
const MODETYPE_IR_REQ = 0x16;
const MODETYPE_BATTERY = 0x07;
const MODETYPE_BATTERY_REQ = 0x17;
const MODETYPE_VERSION = 0x08;
const MODETYPE_VERSION_REQ = 0x18;
const MODETYPE_ALLSENSOR = 0x09;
const MODETYPE_ALLSENSOR_REQ = 0x19;
const MODETYPE_REALTIME = 0x0a;
const MODETYPE_EMERGENCY_STOP = 0x11;
const MODETYPE_MOTOR_BALANCE = 0xaa;

// const MODE = {
//     MAPBOARD: 0,
//     ROBOT: 1,
// };

const RETURN_PACKET = {
    START :0,
    LENGTH :1,
    HWID :2,
    HWTYPE :3,
    CMDTYPE :4,
    CMD :5,
    RESULT :6,
    BATTERY :7,
    ULTRASONIC :8,
    LEFTIR1 :9,
    LEFTIR2 :10,
    CENTERIR :11,
    RIGHTIR1 :12,
    RIGHTIR2 :13,
    IDXBIT :14,
    DATA7 :15,
    DATA8 :16,
    DATA9 :17,
    DATA10 :18,
    END :19,
};

const CMDTYPE = {
    COMPLETE: 0x04,
    SENSORDATA: 0X05,
};

const RESULT = {
    SUCCESS: 0x00,
    FAIL: 0X01,
};

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
    'YELLOW':[0xFF, 0xFF, 0x00],
    'WHITE':[0xFF, 0xFF, 0xFF],
};

class Kamibot extends BaseModule {
    constructor() {
        super();
        this._hwid = 0x01;
        this.sendBuffers = [];
        this.rcvBuffers = [];
        this.cmdBuffers = [];
        this.runningMsgID = [];
        this.executeCheckList = [];
        this.executeCount = 0;
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
    requestInitialData() {
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
        const sendData  = this.makeData(index, msg);
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
        if (idx < 0) { return; }

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

            if (data[RETURN_PACKET.CMDTYPE] == 0x04) {
                this.sendResultData(handler, data);
            } else if (data[RETURN_PACKET.CMDTYPE] == 0x05) {
                this.sendSensorData(handler, data);
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

    sendSensorData(handler, data) {
        const battery = data[RETURN_PACKET.BATTERY];
        const ultra = data[RETURN_PACKET.ULTRASONIC];
        const lir1 = data[RETURN_PACKET.LEFTIR1];
        const lir2 = data[RETURN_PACKET.LEFTIR2];
        const cir =  data[RETURN_PACKET.CENTERIR];
        const rir1 =  data[RETURN_PACKET.RIGHTIR1];
        const rir2 =  data[RETURN_PACKET.RIGHTIR2];
    
        const sensor = {
            battery,
            ultra,
            lir1,
            lir2,
            cir,
            rir1,
            rir2,
        };
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
        case commandTypes.MOVE_FORWARD: {
            const { param1 } = data;
            command = [...NULL_MODE_PACKET];
            command[IDX_HWID] = this._hwid;
            command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
            command[IDX_MODECOMMAND] = 0x01; // 앞으로(맵보드)
            command[IDX_DATA0] = param1;
            command[IDX_INDEX] = id;
            break;
        }
        case commandTypes.TURN_LEFT: {
            command = [...NULL_MODE_PACKET];
            command[IDX_HWID] = this._hwid;
            command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
            command[IDX_MODECOMMAND] = 0x03; // 왼쪽(맵보드)
            command[IDX_DATA0] = 1;
            command[IDX_INDEX] = id;
            break;
        }
        case commandTypes.TURN_RIGHT: {
            command = [...NULL_MODE_PACKET];
            command[IDX_HWID] = this._hwid;
            command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
            command[IDX_MODECOMMAND] = 0x02; // 오른쪽(맵보드)
            command[IDX_DATA0] = 1;
            command[IDX_INDEX] = id;
            break;
        }
        case commandTypes.TURN_BACK: {
            command = [...NULL_MODE_PACKET];
            command[IDX_HWID] = this._hwid;
            command[IDX_MODETYPE] = MODETYPE_MAPBOARD;
            command[IDX_MODECOMMAND] = 0x04; // 뒤로 돌기(맵보드)
            command[IDX_DATA0] = 1;
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
        case commandTypes.SET_SERVER_MOTOR: {
            const { param1 } = data;
            command = [...NULL_MODE_PACKET];
            command[IDX_HWID] = this._hwid;
            command[IDX_COMMANDTYPE] = COMMANDTYPE_WRITE;
            command[IDX_MODETYPE] = MODETYPE_SERVOMOTOR;
            command[IDX_MODECOMMAND] = 0x00;
            let val = param1 < 0 ? 0 : param1;
            val = val > 180 ? 180 : val;
            command[IDX_DATA0] = 180 - val;
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

module.exports = new Kamibot();
