const BaseModule = require('./baseModule');

class WhalebotsEagle1001 extends BaseModule {
    // Declare the fields to be used inside the class.
    constructor() {
        super();

        this.HARD_FLY1101 = 1101;

        this.PRINT_LEVEL = 20;

        this.codefilename = 'fly.c';

        this.FLYCTLBINFILE = 'flymainbroad.bin';

        this.UPDATEFILE = 'UPDATE.bin';

        this.TYPE_EG_DUMMY = 'UNKNOWN';
        this.TYPE_EG101 = 'EG101';
        this.TYPE_EG102 = 'EG102';
        this.TYPE_FPV101 = 'EG100';
        this.TYPE_EGXXX = 'EG';

        this.BUAD = 115200;
        this.TIMEOUT = 0.2;

        this.PID = 29987;
        this.VID = 6790;

        this.PING_TIME_DELAY = 0.050;

        this.TIME_DELAY = 0;

        this.BIT0 = 0x01;
        this.BIT1 = 0x02;
        this.BIT2 = 0x04;
        this.BIT3 = 0x08;
        this.BIT4 = 0x10;
        this.BIT5 = 0x20;
        this.BIT6 = 0x40;
        this.BIT7 = 0x80;

        this.CONNETC_DUMMY = 0;
        this.CONNETC_BUSY = 1;
        this.CONNECT_SUCCESS = 2;
        this.CONNECT_FAIL = 3;

        this.BT_CMD_GETFLYSTATE1 = 0x50;
        this.BT_CMD_GETFLYSTATE2 = 0x52;
        this.BT_CMD_GETFLYSTATE3 = 0x54;
        this.BT_CMD_SETPID = 0x56;
        this.BT_CMD_READPID = 0x58;
        this.BT_CMD_SETFLY = 0x60;
        this.BT_CMD_DOWNLOAD = 0x62;
        this.BT_CMD_DOWNLOAD_END = 0x64;
        this.BT_CMD_PICOCRUN = 0x66;
        this.BT_CMD_PICOCSTOP = 0x68;
        this.BT_CMD_AUTOLAND = 0x70;
        this.BT_CMD_GETFLYSTATE_SCRATCH = 0xA0;

        this.IsRevPID = false;
        this.IsSetPID = false;
        this.IsDownload = false;
        this.IsPicocRun = false;
        this.IsPicocStop = false;
        this.IsAutoDownload = false;
        this.IsNewDataRevForLog = false;

        this.BT_INDEX_CMD_SEND = 2;
        this.BT_INDEX_DATA_SEND = 3;

        this.UPDATE_LEN = 156 * 1024;
        this.Picocode = Buffer.alloc(this.UPDATE_LEN);
        this.nowdwpack = 0;
        this.packlen = 128;
        this.dwmsg = '下载状态';

        this.DATASENDLEN = 154;
        this.DATAREVLEN = 160;
        this.senddata = Buffer.alloc(this.DATASENDLEN);
        this.revdata = Buffer.alloc(this.DATAREVLEN);

        this.received_data = [];

        this.BT_INDEX_SENDCHECKSUM = this.DATASENDLEN - 1;
        this.BT_INDEX_REVCHECKSUM = this.DATAREVLEN - 1;
        this.BT_INDEX_CMD_REV = 8;
        this.BT_INDEX_DATA_REV = 9;

        this.revcount = 0;
        this.sendcount = 0;
        this.reverrcount = 0;

        this.sensor = {
            ACC_x: 0.0,
            ACC_y: 0.0,
            ACC_z: 0.0,
            Gypo_x: 0.0,
            Gypo_y: 0.0,
            Gypo_z: 0.0,
            SPL06_temp: 0.0,
            SPL06_Press: 0.0,
            SPL06_asl: 0.0,
            Pitch: 0.0,
            Roll: 0.0,
            Yaw: 0.0,
            Battery: 0.0,
            LaserTof: 0.0,
            GL_X: 0.0,
            GL_Y: 0.0,
            timertick: 0.0,
            M1: 0,
            M2: 0,
            M3: 0,
            M4: 0,
            Debug_0: 0.0,
            Debug_1: 0.0,
            Debug_2: 0.0,
            Debug_3: 0.0,
            Debug_4: 0.0,
            Debug_5: 0.0,
            FusedHeight: 0.0,
            VER: 100,
            TYPE: 'TYPE_EG_DUMMY',
            ErrFly: 0,
            asl_dis: 0.0,
            startBaroAsl: 0.0,
            LineNo: 0,
            LineError: 0,
            ErrorCode: 0,
            state_position_x: 0.0,
            state_position_y: 0.0,
            state_position_z: 0.0,
            state_velocity_x: 0.0,
            state_velocity_y: 0.0,
            state_velocity_z: 0.0,
            btkey: 0,
            btstick1: 0,
            btstick2: 0,
            btstick3: 0,
            btstick4: 0,
            btstick5: 0,
            BTname: 'unknown',
            FlyTime_h: 0,
            FlyTime_m: 0,
            FlyTime_s: 0,
        };

        this.errorMessages = {
            0: 'No Error',
            1: 'can\'t assign to this',
            2: 'NULL pointer dereference',
            3: 'first argument to \'?\' should be a number',
            4: 'can\'t get the address of this',
            5: 'invalid operation',
            6: 'invalid use of a NULL pointer',
            7: 'not supported',
            8: 'invalid expression',
            9: 'array index must be an integer',
            10: 'this Target is not an array',
            11: 'need an structure or union member',
            12: 'struct or union error',
            13: 'doesn\'t have a member',
            14: 'operator not expected here',
            15: 'brackets not closed',
            16: 'identifier not expected here',
            17: 'macro arguments missing',
            18: 'expression expected',
            19: 'a void value isn\'t much use here',
            20: 'value not expected here',
            21: 'type not expected here',
            22: 'brackets not closed',
            23: 'ExpressionParseMacroCall out of memory',
            24: 'too many arguments',
            25: 'comma expected',
            26: 'bad argument',
            27: 'not enough arguments',
            28: 'Macro undefined',
            29: 'function - can\'t call',
            30: 'ExpressionParseFunctionCall out of memory',
            31: 'too many arguments',
            32: 'comma expected',
            33: 'bad argument',
            34: 'not enough arguments',
            35: 'undefined Fun name',
            36: 'function body expected',
            37: 'no value returned from a function returning',
            38: 'couldn\'t find goto label',
            39: 'expression expected',
            40: 'integer value expected instead',
            41: 'identifier expected',
            42: 'undefined Identifier',
            43: 'value expected',
            44: '#else without #if',
            45: '#endif without #if',
            46: 'nested function definitions are not allowed',
            47: 'too many parameters',
            48: 'comma expected',
            49: 'bad parameter',
            50: 'main() should return an int or void',
            51: 'bad parameters to main()',
            52: 'bad function definition',
            53: 'function definition expected',
            54: 'Identifier is already defined',
            55: '} expected',
            56: 'can\'t define a void variable',
            57: 'close bracket expected',
            58: 'Macro is already defined',
            59: '\'(\' expected',
            60: 'statement expected',
            61: '\';\' expected',
            62: '\')\' expected',
            63: '\'while\' expected',
            64: '\'{\' expected',
            65: 'filename.h expected',
            66: '\'\' expected',
            67: 'value required in return',
            68: 'value in return from a void function',
            69: 'PicocParse out of memory',
            70: 'parse error',
            71: 'AssignFail',
            72: 'TableSetIdentifier out of memory',
            73: 'data type is already defined',
            74: 'structure isn\'t defined',
            75: 'struct/union definitions can only be globals',
            76: 'invalid type in struct',
            77: 'member already defined',
            78: 'semicolon expected',
            79: 'enum isn\'t defined',
            80: 'enum definitions can only be globals',
            81: 'bad type declaration',
            82: '\']\' expected',
            83: 'Variable out of memory',
            84: 'stack underrun',
            85: 'VariableStack out of memory',
            86: 'stack is empty - can\'t go back',
        };

        this.sp = null;
        this.isConnect = false;
        this.currentProcess = '';

        this.decoder = new TextDecoder();
        this.nowdwpack = 0;
        this.packlen = 128;
        this.reverrcount = 0;

        this.isDroneConnection = false;
        this.countDroneConnectionAttempt = 0;
        this.revtmp = Buffer.alloc(this.DATAREVLEN);
        this.revtemplength = 0;
        this.revtmpdata = Buffer.alloc(this.DATAREVLEN);
        this.isDownloadDone = false;
        this.isGetFlyState = false;
        this.cmdType = {
            'Download': 1,
            'Stop': 2,
        };
        this.runCode = [
            0x77, 0x78, 0x66, 0x1, 0x2, 0x2, 0x3, 0x3, 0x4, 0x4, 0x5, 0x5,
            0x6, 0x6, 0x7, 0x7, 0x8, 0x8, 0x9, 0x9, 0xa, 0xa, 0xb, 0xb, 0xc, 0xc,
            0xd, 0xd, 0xe, 0xe, 0xf, 0xf, 0x10, 0x10, 0x11, 0x11, 0x12, 0x12, 0x13,
            0x13, 0x14, 0x14, 0x15, 0x15, 0x16, 0x16, 0x17, 0x17, 0x18, 0x18,
            0x19, 0x19, 0x1a, 0x1a, 0x1b, 0x1b, 0x1c, 0x1c, 0x1d, 0x1d, 0x1e, 0x1e,
            0x1f, 0x1f, 0x20, 0x20, 0x21, 0x21, 0x22, 0x22, 0x23, 0x23, 0x24, 0x24,
            0x25, 0x25, 0x26, 0x26, 0x27, 0x27, 0x28, 0x28, 0x29, 0x29, 0x2a, 0x2a,
            0x2b, 0x2b, 0x2c, 0x2c, 0x2d, 0x2d, 0x2e, 0x2e, 0x2f, 0x2f, 0x30, 0x30,
            0x31, 0x31, 0x32, 0x32, 0x33, 0x33, 0x34, 0x34, 0x35, 0x35, 0x36, 0x36,
            0x37, 0x37, 0x38, 0x38, 0x39, 0x39, 0x3a, 0x3a, 0x3b, 0x3b, 0x3c, 0x3c,
            0x3d, 0x3d, 0x3e, 0x3e, 0x3f, 0x3f, 0x40, 0x40, 0x41, 0x41, 0x42, 0x42,
            0x43, 0x43, 0x44, 0x44, 0x45, 0x45, 0x46, 0x46, 0x47, 0x47, 0x48, 0x48,
            0x49, 0x49, 0x4a, 0x4a, 0x4b, 0x4b, 0x0, 0x56,
        ];

        this.getStateCode = [
            0x77, 0x78, 0x50, 0x1, 0x2, 0x2, 0x3, 0x3, 0x4, 0x4, 0x5, 0x5, 0x6, 0x6, 0x7, 0x7, 0x8, 0x8, 0x9, 0x9,
            0xa, 0xa, 0xb, 0xb, 0xc, 0xc, 0xd, 0xd, 0xe, 0xe, 0xf, 0xf, 0x10, 0x10, 0x11, 0x11, 0x12, 0x12,
            0x13, 0x13, 0x14, 0x14, 0x15, 0x15, 0x16, 0x16, 0x17, 0x17, 0x18, 0x18, 0x19, 0x19, 0x1a, 0x1a,
            0x1b, 0x1b, 0x1c, 0x1c, 0x1d, 0x1d, 0x1e, 0x1e, 0x1f, 0x1f, 0x20, 0x20, 0x21, 0x21, 0x22, 0x22,
            0x23, 0x23, 0x24, 0x24, 0x25, 0x25, 0x26, 0x26, 0x27, 0x27, 0x28, 0x28, 0x29, 0x29, 0x2a, 0x2a,
            0x2b, 0x2b, 0x2c, 0x2c, 0x2d, 0x2d, 0x2e, 0x2e, 0x2f, 0x2f, 0x30, 0x30, 0x31, 0x31, 0x32, 0x32,
            0x33, 0x33, 0x34, 0x34, 0x35, 0x35, 0x36, 0x36, 0x37, 0x37, 0x38, 0x38, 0x39, 0x39, 0x3a, 0x3a,
            0x3b, 0x3b, 0x3c, 0x3c, 0x3d, 0x3d, 0x3e, 0x3e, 0x3f, 0x3f, 0x40, 0x40, 0x41, 0x41, 0x42, 0x42,
            0x43, 0x43, 0x44, 0x44, 0x45, 0x45, 0x46, 0x46, 0x47, 0x47, 0x48, 0x48, 0x49, 0x49, 0x4a, 0x4a,
            0x4b, 0x4b, 0x0, 0x6c,
        ];

        this.stopCode = [
            0x77, 0x78, 0x68, 0x1, 0x2, 0x2, 0x3, 0x3, 0x4, 0x4, 0x5, 0x5,
            0x6, 0x6, 0x7, 0x7, 0x8, 0x8, 0x9, 0x9, 0xa, 0xa, 0xb, 0xb, 0xc,
            0xc, 0xd, 0xd, 0xe, 0xe, 0xf, 0xf, 0x10, 0x10, 0x11, 0x11, 0x12,
            0x12, 0x13, 0x13, 0x14, 0x14, 0x15, 0x15, 0x16, 0x16, 0x17, 0x17,
            0x18, 0x18, 0x19, 0x19, 0x1a, 0x1a, 0x1b, 0x1b, 0x1c, 0x1c, 0x1d,
            0x1d, 0x1e, 0x1e, 0x1f, 0x1f, 0x20, 0x20, 0x21, 0x21, 0x22, 0x22,
            0x23, 0x23, 0x24, 0x24, 0x25, 0x25, 0x26, 0x26, 0x27, 0x27, 0x28,
            0x28, 0x29, 0x29, 0x2a, 0x2a, 0x2b, 0x2b, 0x2c, 0x2c, 0x2d, 0x2d,
            0x2e, 0x2e, 0x2f, 0x2f, 0x30, 0x30, 0x31, 0x31, 0x32, 0x32, 0x33,
            0x33, 0x34, 0x34, 0x35, 0x35, 0x36, 0x36, 0x37, 0x37, 0x38, 0x38,
            0x39, 0x39, 0x3a, 0x3a, 0x3b, 0x3b, 0x3c, 0x3c, 0x3d, 0x3d, 0x3e,
            0x3e, 0x3f, 0x3f, 0x40, 0x40, 0x41, 0x41, 0x42, 0x42, 0x43, 0x43,
            0x44, 0x44, 0x45, 0x45, 0x46, 0x46, 0x47, 0x47, 0x48, 0x48, 0x49,
            0x49, 0x4a, 0x4a, 0x4b, 0x4b, 0x0, 0x54,
        ];
        this.simulatorPopup = null;
        // this.setZero();
        this.unsupportBlockExist = false;
        this.getStateTimeSleep = 500;
        this.lock = false;
        this.isRunningCode = false;
    }

    /*
    Initial setting after the first connection was made.
    Handler is an object that jsonized data with workspace.(See DataHandler/JSON)
    config is Module.json object.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    /*
    Use if you need data to be transmitted early after connection.
    If you use RequestinitialData, CheckinitialData is a must.
    Logic works only when these two functions are defined.If you don't need it, you don't have to write it.
    */
    requestInitialData(sp) {
        this.isConnect = true;
        if (!this.sp) {
            this.sp = sp;
        }

        // return this.pingControl();
        return this.getStateCode;
    }

    // If you need to be received early after connecting and check whether it is normal connection.
    checkInitialData(data, config) {
        return true;
    }

    // use it when you need to verify the data received from the hardware periodically.
    validateLocalData(data) {
        return true;
    }

    /*
    Returns the data to be delivered to the hardware device.
    In the case of slave mode, the device is constantly sent to the device at a duration attribute interval.
    */
    requestLocalData() {
        // if (this.isConnect && !this.isRunningCode) {
        //     this.currentProcess = 'requestLocalData';
        //     this.senddata[0] = 0x77;
        //     this.senddata[1] = 0x78;
        //     this.makesendcmd();
        //     this.senddata[this.BT_INDEX_SENDCHECKSUM] = this.btremotecalchecksum(this.senddata);
        //     this.sendcount = this.sendcount + 1;
        //     return this.senddata;
        // }
        return null;
    }

    // Data processing from hardware
    handleLocalData(data) {
        if (this.currentProcess == 'pingControl') {
            const CMD_PING_REV_SIZE = 3;
            const revtemp = Buffer.alloc(CMD_PING_REV_SIZE);
            for (let i = 0; i < data.length; i++) {
                revtemp[i] = data[i];
            }
            if (revtemp.length == CMD_PING_REV_SIZE) {
                if (revtemp[0] == 0x77 && revtemp[1] == 0x78 && revtemp[2] == 0x80) {
                    this.sp.close();
                    this.currentProcess = 'requestLocalData';
                }
            }
        }

        if (this.currentProcess == 'requestLocalData') {
            for (let i = 0; i < data.length; i++) {
                this.received_data.push(data[i]);
            }
            console.log('data.length: ', data.length);
            if (this.received_data.length >= this.DATAREVLEN) {
                let revtmp = Buffer.from(this.received_data.slice(0, this.DATAREVLEN));
                this.received_data = this.received_data.slice(this.DATAREVLEN);
                // const hexStringX = Array.from(revtmp)
                //     .map(byte => `0x${byte.toString(16).padStart(2, '0')}`)
                //     .join(',');
                // console.log(`revtmp (hex): ${hexStringX}`);
                // let revtmp = Buffer.alloc(this.DATAREVLEN);
                // for (let i = 0; i < this.received_data.length; i++) {
                //     revtmp[i] = this.received_data[i];
                // }
                // revtmp = [0x77,0x78,0x0,0x0,0x63,0x5e,0x62,0x62,0x50,0xc3,0xd,0x3d,0xbc,0x39,0x6b,0xe0,0x3c,0xa6,0xb8,0x7f,0x3f,0x12,0xf0,0xa1,0xbd,0xac,0xe5,0x56,0x3e,0x48,0x62,0x0,0xbf,0x7b,0x87,0x23,0x42,0xe6,0xa9,0x7b,0x44,0x70,0xb,0xac,0x45,0xe6,0x2b,0x8b,0x3f,0x4f,0x3f,0xc1,0x3f,0x26,0xab,0x5d,0xc2,0x7a,0xe9,0x66,0x40,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x71,0x3d,0x21,0x43,0x0,0x0,0x0,0x0,0xba,0x5d,0x4c,0x3f,0x22,0xc,0x8e,0x38,0x74,0xb7,0x8e,0x40,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x30,0xbf,0xa2,0xbc,0x6b,0x0,0x0,0x1,0x0,0x0,0x0,0x0,0x70,0xb,0xac,0x45,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x1f,0x49,0x5a,0x3f,0x1e,0x63,0x6,0x3e,0x4e,0x24,0x92,0x3c,0x4b,0x0,0xfd]
                if (revtmp[0] == 0x77 && revtmp[1] == 0x78) {
                    // console.log(revtmp[this.BT_INDEX_REVCHECKSUM], this.btremotecalchecksum(revtmp));
                    if (revtmp[this.BT_INDEX_REVCHECKSUM] == this.btremotecalchecksum(revtmp)) {
                        for (let i = 0; i < revtmp.length; i++) {
                            this.revdata[i] = revtmp[i];
                        }
                        this.makerevcmd();
                        this.revcount = this.revcount + 1;
                        if (this.isConnectEagle == false) {
                            this.isConnectEagle = true;
                            this.reverrcount = 0;
                        }
                    } else {
                        this.reverrcount = this.reverrcount + 1;
                        setTimeout(() => { }, 500);
                    }
                } else {
                    this.reverrcount = this.reverrcount + 1;
                }
                this.currentProcess = '';
            }
        }
    }

    // data to be delivered to the entry
    requestRemoteData(handler) {
        const self = this;
        if (!self.sensor) {
            return;
        }
        Object.keys(this.sensor).forEach((key) => {
            if (self.sensor[key] != undefined) {
                handler.write(key, self.sensor[key]);
            }
        });
    }

    lockGetState(lock) {
        this.lock = lock;
    }

    isLockGetState() {
        return this.lock;
    }

    makerevcmd() {
        this.IsRevPID = false; // 指示是否进行读取PID操作
        this.IsSetPID = false; // 指示是否进行设置PID操作
        this.IsDownload = false; // 指示是否进行下载操作
        this.IsPicocRun = false; // 指示飞飞控上的解释器是否开始运行脚本
        this.IsPicocStop = false; // 指示飞飞控上的解释器是否停止运行
        this.IsAutoDownload = false; // 指示飞飞控是否强制自动降落
        this.nowdwpack = 0;
        this.dwmsg = '';
        this.IsNewDataRevForLog = false;
        this.revcount = 0;
        this.sendcount = 0;
        this.sensor = {};
        this.TYPE_EG101 = 1;
        this.TYPE_EG102 = 2;
        if (this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_GETFLYSTATE1) {
            // const hexStringX = Array.from(this.revdata)
            //     .map(byte => `0x${byte.toString(16).padStart(2, '0')}`)
            //     .join(',');
            // console.log(`revtmp (hex): ${hexStringX}`);

            this.sensor.btkey = parseInt(this.revdata[2] + this.revdata[3] * 256, 10);
            this.sensor.btstick1 = parseInt(this.revdata[4], 10);
            this.sensor.btstick2 = parseInt(this.revdata[5], 10);
            this.sensor.btstick3 = parseInt(this.revdata[6], 10);
            this.sensor.btstick4 = parseInt(this.revdata[7], 10);

            this.sensor.ACC_x = this.byte2float(this.BT_INDEX_DATA_REV + 0 * 4);
            this.sensor.ACC_y = this.byte2float(this.BT_INDEX_DATA_REV + 1 * 4);
            this.sensor.ACC_z = this.byte2float(this.BT_INDEX_DATA_REV + 2 * 4);
            this.sensor.Gypo_x = this.byte2float(this.BT_INDEX_DATA_REV + 3 * 4);
            this.sensor.Gypo_y = this.byte2float(this.BT_INDEX_DATA_REV + 4 * 4);
            this.sensor.Gypo_z = this.byte2float(this.BT_INDEX_DATA_REV + 5 * 4);
            this.sensor.SPL06_temp = this.byte2float(this.BT_INDEX_DATA_REV + 6 * 4);
            this.sensor.SPL06_Press = this.byte2float(this.BT_INDEX_DATA_REV + 7 * 4);
            this.sensor.SPL06_asl = this.byte2float(this.BT_INDEX_DATA_REV + 8 * 4);
            this.sensor.Pitch = this.byte2float(this.BT_INDEX_DATA_REV + 9 * 4);
            this.sensor.Roll = this.byte2float(this.BT_INDEX_DATA_REV + 10 * 4);
            this.sensor.Yaw = this.byte2float(this.BT_INDEX_DATA_REV + 11 * 4);
            this.sensor.Battery = this.byte2float(this.BT_INDEX_DATA_REV + 12 * 4);

            this.sensor.LaserTof = this.byte2float(this.BT_INDEX_DATA_REV + 13 * 4);
            this.sensor.GL_X = this.byte2float(this.BT_INDEX_DATA_REV + 14 * 4);
            this.sensor.GL_Y = this.byte2float(this.BT_INDEX_DATA_REV + 15 * 4);
            this.sensor.timertick = this.byte2float(this.BT_INDEX_DATA_REV + 16 * 4);
            this.sensor.M1 = parseInt(this.revdata[this.BT_INDEX_DATA_REV + 17 * 4 + 0], 10);
            this.sensor.M2 = parseInt(this.revdata[this.BT_INDEX_DATA_REV + 17 * 4 + 1], 10);
            this.sensor.M3 = parseInt(this.revdata[this.BT_INDEX_DATA_REV + 17 * 4 + 2], 10);
            this.sensor.M4 = parseInt(this.revdata[this.BT_INDEX_DATA_REV + 17 * 4 + 3], 10);

            this.sensor.state_velocity_x = this.byte2float(this.BT_INDEX_DATA_REV + 18 * 4);
            this.sensor.state_velocity_y = this.byte2float(this.BT_INDEX_DATA_REV + 19 * 4);
            this.sensor.state_velocity_z = this.byte2float(this.BT_INDEX_DATA_REV + 20 * 4);

            this.sensor.Debug_0 = this.byte2float(this.BT_INDEX_DATA_REV + 21 * 4);
            this.sensor.Debug_1 = this.byte2float(this.BT_INDEX_DATA_REV + 22 * 4);
            this.sensor.Debug_2 = this.byte2float(this.BT_INDEX_DATA_REV + 23 * 4);
            this.sensor.Debug_3 = this.byte2float(this.BT_INDEX_DATA_REV + 24 * 4);
            this.sensor.Debug_4 = this.byte2float(this.BT_INDEX_DATA_REV + 25 * 4);
            this.sensor.Debug_5 = this.byte2float(this.BT_INDEX_DATA_REV + 26 * 4);
            this.sensor.FusedHeight = this.byte2float(this.BT_INDEX_DATA_REV + 27 * 4);

            this.sensor.VER = parseInt(this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 0], 10);
            this.sensor.ErrFly = parseInt(this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 1], 10);
            // 飞机种类
            if (this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 3] == 1) {
                this.sensor.TYPE = this.TYPE_EG101;
            } else if (this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 3] == 2) {
                this.sensor.TYPE = this.TYPE_EG102;
            } else if (this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 3] == 3) {
                this.sensor.TYPE = this.TYPE_FPV101;
            } else {
                this.sensor.TYPE = `${this.TYPE_EGXXX}${this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 3]}`;
            }

            this.sensor.asl_dis = this.byte2float(this.BT_INDEX_DATA_REV + 29 * 4);
            this.sensor.startBaroAsl = this.byte2float(this.BT_INDEX_DATA_REV + 30 * 4);
            this.sensor.LineNo = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 31 * 4), 10);
            this.sensor.LineError = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 32 * 4), 10);
            this.sensor.ErrorCode = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 33 * 4), 10);
            this.sensor.state_position_x = this.byte2float(this.BT_INDEX_DATA_REV + 34 * 4);
            this.sensor.state_position_y = this.byte2float(this.BT_INDEX_DATA_REV + 35 * 4);
            this.sensor.state_position_z = this.byte2float(this.BT_INDEX_DATA_REV + 36 * 4);

            console.log('this.sensor', this.sensor);
        } else if (this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_GETFLYSTATE_SCRATCH) {
            // const hexStringX = Array.from(this.revdata)
            //     .map(byte => `0x${byte.toString(16).padStart(2, '0')}`)
            //     .join(',');
            // console.log(`revtmp (hex): ${hexStringX}`);

            this.sensor.btkey = parseInt(this.revdata[2] + this.revdata[3] * 256, 10);
            this.sensor.btstick1 = parseInt(this.revdata[4], 10);
            this.sensor.btstick2 = parseInt(this.revdata[5], 10);
            this.sensor.btstick3 = parseInt(this.revdata[6], 10);
            this.sensor.btstick4 = parseInt(this.revdata[7], 10);

            if (this.revdata[this.BT_INDEX_DATA_REV + 0 * 4] == 0x77) { //蓝牙名称有效
                const bytename = new Uint8Array(14);
                for (let i = 0; i < 14; i++) {
                    if (this.revdata[this.BT_INDEX_DATA_REV + 0 * 4 + i] == '\0') { //避免\0干扰上位机解析
                        break;
                    }
                    bytename[i] = this.revdata[this.BT_INDEX_DATA_REV + 0 * 4 + i];
                }
                this.sensor.BTname = String.fromCharCode(...bytename);
            }
            this.sensor.FlyTime_h = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 4 * 4), 10);
            this.sensor.FlyTime_m = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 5 * 4), 10);
            this.sensor.SPL06_temp = this.byte2float(this.BT_INDEX_DATA_REV + 6 * 4);
            this.sensor.FlyTime_s = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 7 * 4), 10);
            this.sensor.SPL06_asl = this.byte2float(this.BT_INDEX_DATA_REV + 8 * 4);
            this.sensor.Pitch = this.byte2float(this.BT_INDEX_DATA_REV + 9 * 4);
            this.sensor.Roll = this.byte2float(this.BT_INDEX_DATA_REV + 10 * 4);
            this.sensor.Yaw = this.byte2float(this.BT_INDEX_DATA_REV + 11 * 4);
            this.sensor.Battery = this.byte2float(this.BT_INDEX_DATA_REV + 12 * 4);

            this.sensor.Debug_0 = this.byte2float(this.BT_INDEX_DATA_REV + 21 * 4);
            this.sensor.Debug_1 = this.byte2float(this.BT_INDEX_DATA_REV + 22 * 4);
            this.sensor.Debug_2 = this.byte2float(this.BT_INDEX_DATA_REV + 23 * 4);
            this.sensor.Debug_3 = this.byte2float(this.BT_INDEX_DATA_REV + 24 * 4);
            this.sensor.Debug_4 = this.byte2float(this.BT_INDEX_DATA_REV + 25 * 4);
            this.sensor.Debug_5 = this.byte2float(this.BT_INDEX_DATA_REV + 26 * 4);
            this.sensor.FusedHeight = this.byte2float(this.BT_INDEX_DATA_REV + 27 * 4);

            this.sensor.VER = parseInt(this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 0], 10);
            this.sensor.ErrFly = parseInt(this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 1], 10);
            //飞机种类
            if (this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 3] == 1) {
                this.sensor.TYPE = this.TYPE_EG101;
            } else if (this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 3] == 2) {
                this.sensor.TYPE = this.TYPE_EG102;
            } else if (this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 3] == 3) {
                this.sensor.TYPE = this.TYPE_FPV101;
            } else {
                this.sensor.TYPE = `${this.TYPE_EGXXX}${this.revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 3]}`;
            }

            this.sensor.LineNo = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 31 * 4), 10);
            this.sensor.LineError = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 32 * 4), 10);
            this.sensor.ErrorCode = parseInt(this.byte2float(this.BT_INDEX_DATA_REV + 33 * 4), 10);
            this.sensor.state_position_x = this.byte2float(this.BT_INDEX_DATA_REV + 34 * 4);
            this.sensor.state_position_y = this.byte2float(this.BT_INDEX_DATA_REV + 35 * 4);
            this.sensor.state_position_z = this.byte2float(this.BT_INDEX_DATA_REV + 36 * 4);
        } else if (this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_DOWNLOAD
            || this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_DOWNLOAD_END) {
            // const hexStringX = Array.from(this.revdata)
            //     .map(byte => `0x${byte.toString(16).padStart(2, '0')}`)
            //     .join(',');
            // console.log(`revtmp (hex): ${hexStringX}`);

            let isrevsame = true;
            for (let i = 0; i < this.packlen; i++) {  //(int i = 0; i < packlen; i++)
                if (this.senddata[i + this.BT_INDEX_CMD_SEND] != this.revdata[i + this.BT_INDEX_CMD_REV]) {
                    isrevsame = false;
                    break;
                }
            }
            if (isrevsame == true) {
                this.nowdwpack = this.nowdwpack + 1;
            }
            if (this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_DOWNLOAD_END) {
                // 已经超过下载文件长度，可以停止下载
                this.IsDownload = false;
                this.dwmsg = 'download success';
                this.IsPicocStop = true;
            } else if (this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_PICOCRUN) {
                this.IsPicocRun = false;
            } else if (this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_PICOCSTOP) {
                this.IsPicocStop = false;
            } else if (this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_AUTOLAND) {
                this.IsAutoDownload = false;
            }
            // 指示新的数据收到
            this.IsNewDataRevForLog = true;
        }
    }

    resetSensor() {
        this.sensor.Pitch = 0;
        this.sensor.Roll = 0;
        this.sensor.Yaw = 0;
        this.sensor.state_position_x = 0.0;
        this.sensor.state_position_y = 0.0;
        this.sensor.state_position_z = 0.0;
        this.sensor.state_velocity_x = 0.0;
        this.sensor.state_velocity_y = 0.0;
        this.sensor.state_velocity_z = 0.0;
    }

    makesendcmd() {
        this.IsRevPID = false;
        this.IsSetPID = false;
        this.IsDownload = false;
        this.IsPicocRun = false;
        this.IsPicocStop = false;
        this.IsAutoDownload = false;
        this.nowdwpack = 0;
        this.dwmsg = '';
        this.IsNewDataRevForLog = false;
        if (this.IsDownload == true) {
            this.resetSensor();
            this.senddata[this.BT_INDEX_CMD_SEND] = this.BT_CMD_DOWNLOAD;
            this.senddata[this.BT_INDEX_DATA_SEND] = this.nowdwpack & 0x000000ff;
            this.senddata[this.BT_INDEX_DATA_SEND + 1] = parseInt(((this.nowdwpack & 0x0000ff00) / 256), 10);
            if ((this.nowdwpack * this.packlen) > this.Picocode.length) {
                this.senddata[this.BT_INDEX_CMD_SEND] = this.BT_CMD_DOWNLOAD_END;
            }
            for (let i = 0; i < this.packlen; i++) {
                if (i + (this.nowdwpack * this.packlen) >= this.Picocode.length) {
                    this.senddata[this.BT_INDEX_DATA_SEND + 2 + i] = 0xff;
                } else {
                    this.senddata[this.BT_INDEX_DATA_SEND + 2 + i] = this.Picocode[i + (this.nowdwpack * this.packlen)];
                }
                this.dwmsg = `正在下载: ${this.nowdwpack * this.packlen} / ${this.Picocode.length}`;
                //PrintLog(5, dwmsg)
                console.log(this.dwmsg);
            }
        } else if (this.IsPicocRun == true) {
            this.senddata[this.BT_INDEX_CMD_SEND] = this.BT_CMD_PICOCRUN;
        } else if (this.IsPicocStop == true) {
            this.senddata[this.BT_INDEX_CMD_SEND] = this.BT_CMD_PICOCSTOP;
            this.IsPicocStop = false;
        } else if (this.IsAutoDownload == true) {
            this.senddata[this.BT_INDEX_CMD_SEND] = this.BT_CMD_AUTOLAND;
        } else {
            // if (this.sensor.VER >= 109 && this.sensor.VER <= 200) {
            //     this.senddata[this.BT_INDEX_CMD_SEND] = this.BT_CMD_GETFLYSTATE_SCRATCH;
            // } else {
            //     this.senddata[this.BT_INDEX_CMD_SEND] = this.BT_CMD_GETFLYSTATE1;
            // }
            this.senddata[this.BT_INDEX_CMD_SEND] = this.BT_CMD_GETFLYSTATE1;
            for (let i = this.BT_INDEX_DATA_SEND; i < this.BT_INDEX_SENDCHECKSUM - 1; i++) {
                // this.senddata[i] = parseInt((i / 2), 10) & 0x000000ff;
                this.senddata[i] = Math.floor(i / 2) & 0xFF;
            }
        }
    }

    btremotecalchecksum(data) {
        let sum = 0;
        const codelen = data.byteLength - 1;
        for (let i = 2; i < codelen; i++) {
            sum = sum + data[i];
        }
        sum = (sum & 0xff);
        sum = (~sum) & 0xff;
        return +sum;
        // let sum = 0;
        // const codelen = data.length - 1;
        // for (let i = 2; i < codelen; i++) {
        //     sum = sum + data[i];
        // }
        // sum = (sum & 0xff);
        // sum = (~sum) & 0xff;
        // return sum;
    }

    pingControl() {
        this.currentProcess = 'pingControl';
        const CMD_PING_SEND_SIZE = 154;
        const senddata = Buffer.alloc(CMD_PING_SEND_SIZE);
        senddata[0] = 0x77;
        senddata[1] = 0x78;
        senddata[2] = 0x79;
        senddata[CMD_PING_SEND_SIZE - 1] = this.btremotecalchecksum(senddata);
        return Buffer.from(senddata);
    }

    connectDrone() {
        this.getStateInterval = setInterval(() => {
            if (this.countDroneConnectionAttempt == 0 || !this.isLockGetState()) {
                // console.log("Connection Attempt",this.countDroneConnectionAttempt+1)
                this.countDroneConnectionAttempt = this.countDroneConnectionAttempt + 1;
                if (this.isDroneConnection == false) {
                    if (this.countDroneConnectionAttempt == 4) {
                        // console.log("Connection failed");
                        this.countDroneConnectionAttempt = 0;
                        clearInterval(this.getStateInterval);
                        return;
                    }
                } else {
                    // console.log("Connection succeed");
                    // console.log("Drone is connected")
                    this.isDroneConnection = true;
                    this.countDroneConnectionAttempt = 0;
                    clearInterval(this.getStateInterval);
                }
            }
        }, this.getStateTimeSleep);
        this.getStateInterval;
    }

    retHex(bytes) {
        const l = Array.from(bytes).map(byte => `0x${byte.toString(16).padStart(1, '0')}`);
        return l;
    }

    convertToBufferArray(input) {
        const hexArray = input.split(',');
        const byteArray = hexArray.map(hex => parseInt(hex, 16));
        const buffer = Buffer.from(byteArray);
        return buffer;
    }

    monitorDownloadProgress(data) {
        if (data && data.search('user_main();')) {
            // console.log("Call user_main();");
            this.setDownloadStatus(true);
        } else {
            this.setDownloadStatus(false);
        }
    }

    setDownloadStatus(status) {
        this.isDownloadDone = status;
    }

    isDownloadSuccess() {
        return this.isDownloadDone;
    }

    isLatestChunk(chunkData) {
        if (chunkData[this.BT_INDEX_CMD_SEND] == 0x64) {
            for (let i = 0; i <= chunkData.length - 1; i++) {
                if (chunkData[i] == 0xff
                    && chunkData[i + 1] == 0x42
                    && chunkData[i + 2] == 0x43
                    && chunkData[i + 3] == 0x43
                    && chunkData[i + 4] == 0x44
                    && chunkData[i + 5] == 0x44
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    generateBytesCode(type, Picocode = '', nowdwpack = 0) {
        const ret = Buffer.alloc(this.DATASENDLEN);

        ret[0] = 0x77;
        ret[1] = 0x78;

        ret[this.BT_INDEX_CMD_SEND] = this.BT_CMD_GETFLYSTATE1;
        for (let i = this.BT_INDEX_DATA_SEND; i < this.BT_INDEX_SENDCHECKSUM - 1; i++) {
            ret[i] = (Math.floor(i / 2)) & 0x000000ff;
        }

        if (type == this.cmdType.Download) {
            ret[this.BT_INDEX_CMD_SEND] = this.BT_CMD_DOWNLOAD;
            ret[this.BT_INDEX_DATA_SEND] = nowdwpack & 0x000000ff;
            ret[this.BT_INDEX_DATA_SEND + 1] = parseInt(((nowdwpack & 0x0000ff00) / 256), 10);

            if (nowdwpack * this.packlen > Picocode.length) {
                ret[this.BT_INDEX_CMD_SEND] = this.BT_CMD_DOWNLOAD_END;
            }

            for (let i = 0; i < this.packlen; i++) {
                if (i + nowdwpack * this.packlen >= Picocode.length) {
                    ret[this.BT_INDEX_DATA_SEND + 2 + i] = 0xff;
                } else {
                    ret[this.BT_INDEX_DATA_SEND + 2 + i] = Picocode.charCodeAt(i + nowdwpack * this.packlen);
                }
            }
        } else if (type == this.cmdType.Stop) {
            ret[this.BT_INDEX_CMD_SEND] = this.BT_CMD_PICOCSTOP;
        }

        ret[this.BT_INDEX_SENDCHECKSUM] = this.calChecksum(ret);
        // console.log(ret[this.BT_INDEX_SENDCHECKSUM]);
        return ret;
    }

    calChecksum(data) {
        let sum = 0;
        const codelen = data.byteLength - 1;
        for (let i = 2; i < codelen; i++) {
            sum = sum + data[i];
        }
        sum = (sum & 0xff);
        sum = (~sum) & 0xff;
        return +sum;
    }

    VERSTR() {
        return `${this.sensor.TYPE.toString()}_${parseInt(this.sensor.VER, 10).toString()}`;
    }

    Errcode2Msg(ErrorCode) {
        return this.errorMessages[ErrorCode] || '';
    }

    ErrFly2String(ErrFly) {
        let msg = '';
        const ERR_NONE = 0;
        const ERR_LOWBATT = this.BIT0;
        const ERR_CODE = this.BIT1;
        const ERR_TEMP = this.BIT3;
        const ERR_SENSORS = this.BIT4;
        const ERR_LOADER = this.BIT5;
        const ERR_ANGLE = this.BIT6;
        if (ErrFly == ERR_NONE) {
            msg = 'NO_Error';
        }
        if (ErrFly & ERR_LOWBATT == ERR_LOWBATT) {
            msg = `${msg}Low_Battery `;
        }
        if (ErrFly & ERR_CODE == ERR_CODE) {
            msg = `${msg}Code_Error `;
        }
        if (ErrFly & ERR_TEMP == ERR_TEMP) {
            msg = `${msg}motherboard_temperature_is_too_high `;
        }
        if (ErrFly & ERR_SENSORS == ERR_SENSORS) {
            msg = `${msg}Sensor_Error `;
        }
        if (ErrFly & ERR_LOADER == ERR_LOADER) {
            msg = `${msg}Excessive_load `;
        }
        if (ErrFly & ERR_ANGLE == ERR_ANGLE) {
            msg = `${msg}Excessive_inclination_angle `;
        }
        return msg;
    }

    byte2float(offset) {
        let buffer = new ArrayBuffer(4);
        let view = new DataView(buffer);

        view.setUint8(3, this.revdata[offset + 0]);
        view.setUint8(2, this.revdata[offset + 1]);
        view.setUint8(1, this.revdata[offset + 2]);
        view.setUint8(0, this.revdata[offset + 3]);

        return view.getFloat32(0, false);
    }

    async downloadCode(sourceCode) {
        // console.log("Send chunk 0");
        let byteCode = this.generateBytesCode(this.cmdType.Download, sourceCode, 0);
        await this.sp.write(byteCode);

        await this.sleep();
        await this.sp.write(Buffer.from(this.getStateCode));
        let i = 0;

        await this.sleep();

        while (true) {
            // console.log("Send chunk ", i);
            byteCode = this.generateBytesCode(this.cmdType.Download, sourceCode, i);
            await this.sp.write(byteCode);
            await this.sleep();
            if (this.isLatestChunk(byteCode)) {
                // console.log("Latest chunk sent!");
                this.revdata = [];
                break;
            }
            i++;
        }
    }

    sleep(time = 300) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    async handleRun() {
        await this.sp.write(Buffer.from(this.runCode));
        await this.sleep();
    }

    async handleClean() {
        let i = 0;
        while (i < 2) {
            await this.sp.write(Buffer.from(this.stopCode));
            await this.sleep();
            i++;
        }
    }

    async handleGetStatus() {
        this.currentProcess = 'requestLocalData';
        await this.sp.write(Buffer.from(this.getStateCode));
        await this.sleep();
    }

    async handleRestart() {
        await this.sp.write(Buffer.from(this.getStateCode));
        await this.sleep();
    }

    // processing of data received from the entry
    async handleRemoteData(handler) {
        const cmd = handler.serverData.cmd;

        if (!cmd) {
            return;
        }

        // console.log("cmd:");
        // console.log(cmd);

        try {
            switch (cmd) {
                case 'restartCode':
                    this.handleRestart();
                    break;
                case 'stopCode':
                    this.handleClean();
                    break;
                case 'runCode':
                    this.handleRun();
                    break;
                case 'get_status':
                    this.handleGetStatus();
                    break;
                default:
                    this.currentProcess = '';
                    this.isRunningCode = true;
                    await this.handleClean();
                    await this.sleep(3000);
                    await this.downloadCode(cmd);
                    await this.sleep(4000);
                    await this.handleRun();
                    await this.sleep(3000);
                    this.isRunningCode = false;
                    break;
            }
        } catch (error) {
            // console.log(error);
        }
    }

    lostController() { }

    disconnect(connect) {
        if (this.isConnect) {
            this.isConnect = false;

            this.sp = null;
            connect.close();
        }
    }
}

module.exports = new WhalebotsEagle1001();
