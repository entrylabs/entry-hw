const BaseModule = require('./baseModule');

class WhalebotsEagle1001 extends BaseModule {

    // Declare the fields to be used inside the class.
    constructor() {
        super();
        
        this.sp = null;
        this.isConnect = false;

        this.decoder = new TextDecoder();
        this.nowdwpack = 0;
        this.BT_INDEX_CMD_SEND = 2;
        this.BT_INDEX_DATA_SEND = 3;
        this.packlen = 128;
        this.DATASENDLEN = 154;
        this.BT_INDEX_SENDCHECKSUM = this.DATASENDLEN - 1;
        this.DATAREVLEN = 160;
        this.BT_INDEX_REVCHECKSUM = this.DATAREVLEN - 1;
        this.BT_INDEX_CMD_REV = 8;
        this.BT_INDEX_DATA_REV = 9
        this.BT_CMD_GETFLYSTATE1 = 0x50;
        this.isDroneConnection = false;
        this.countDroneConnectionAttempt = 0;
        this.IsPicocStop = false;
        this.revtmp = Buffer.alloc(this.DATAREVLEN);
        this.revtemplength = 0 ;
        this.revtmpdata = Buffer.alloc(this.DATAREVLEN);
        this.revdata = Buffer.alloc(this.DATAREVLEN);
        this.BT_CMD_DOWNLOAD = 0x62;
        this.BT_CMD_DOWNLOAD_END = 0x64;
        this.BT_CMD_PICOCSTOP = 0x68;
        this.isDownloadDone = false;
        this.isGetFlyState = false;
        this.cmdType = {
            'Download': 1,
            'Stop': 2,
        }
        this.runCode = [
            0x77,0x78,0x66,0x1,0x2,0x2,0x3,0x3,0x4,0x4,0x5,0x5, 
            0x6,0x6,0x7,0x7,0x8,0x8,0x9,0x9,0xa,0xa,0xb,0xb,0xc,0xc, 
            0xd,0xd,0xe,0xe,0xf,0xf,0x10,0x10,0x11,0x11,0x12,0x12,0x13,
            0x13,0x14,0x14,0x15,0x15,0x16,0x16,0x17,0x17,0x18,0x18, 
            0x19,0x19,0x1a,0x1a,0x1b,0x1b,0x1c,0x1c,0x1d,0x1d,0x1e,0x1e, 
            0x1f,0x1f,0x20,0x20,0x21,0x21,0x22,0x22,0x23,0x23,0x24,0x24, 
            0x25,0x25,0x26,0x26,0x27,0x27,0x28,0x28,0x29,0x29,0x2a,0x2a, 
            0x2b,0x2b,0x2c,0x2c,0x2d,0x2d,0x2e,0x2e,0x2f,0x2f,0x30,0x30, 
            0x31,0x31,0x32,0x32,0x33,0x33,0x34,0x34,0x35,0x35,0x36,0x36, 
            0x37,0x37,0x38,0x38,0x39,0x39,0x3a,0x3a,0x3b,0x3b,0x3c,0x3c, 
            0x3d,0x3d,0x3e,0x3e,0x3f,0x3f,0x40,0x40,0x41,0x41,0x42,0x42, 
            0x43,0x43,0x44,0x44,0x45,0x45,0x46,0x46,0x47,0x47,0x48,0x48, 
            0x49,0x49,0x4a,0x4a,0x4b,0x4b,0x0,0x56
        ];

        this.getStateCode = [
            0x77,0x78,0x50,0x1,0x2,0x2,0x3,0x3,0x4,0x4,0x5,0x5,0x6,0x6,0x7,0x7,0x8,0x8,0x9,0x9,
            0xa,0xa,0xb,0xb,0xc,0xc,0xd,0xd,0xe,0xe,0xf,0xf,0x10,0x10,0x11,0x11,0x12,0x12
            ,0x13,0x13,0x14,0x14,0x15,0x15,0x16,0x16,0x17,0x17,0x18,0x18,0x19,0x19,0x1a,0x1a
            ,0x1b,0x1b,0x1c,0x1c,0x1d,0x1d,0x1e,0x1e,0x1f,0x1f,0x20,0x20,0x21,0x21,0x22,0x22
            ,0x23,0x23,0x24,0x24,0x25,0x25,0x26,0x26,0x27,0x27,0x28,0x28,0x29,0x29,0x2a,0x2a
            ,0x2b,0x2b,0x2c,0x2c,0x2d,0x2d,0x2e,0x2e,0x2f,0x2f,0x30,0x30,0x31,0x31,0x32,0x32
            ,0x33,0x33,0x34,0x34,0x35,0x35,0x36,0x36,0x37,0x37,0x38,0x38,0x39,0x39,0x3a,0x3a
            ,0x3b,0x3b,0x3c,0x3c,0x3d,0x3d,0x3e,0x3e,0x3f,0x3f,0x40,0x40,0x41,0x41,0x42,0x42
            ,0x43,0x43,0x44,0x44,0x45,0x45,0x46,0x46,0x47,0x47,0x48,0x48,0x49,0x49,0x4a,0x4a
            ,0x4b,0x4b,0x0,0x6c
        ];

        this.stopCode = [
            0x77,0x78,0x68,0x1,0x2,0x2,0x3,0x3,0x4,0x4,0x5,0x5,
            0x6,0x6,0x7,0x7,0x8,0x8,0x9,0x9,0xa,0xa,0xb,0xb,0xc,
            0xc,0xd,0xd,0xe,0xe,0xf,0xf,0x10,0x10,0x11,0x11,0x12,
            0x12,0x13,0x13,0x14,0x14,0x15,0x15,0x16,0x16,0x17,0x17,
            0x18,0x18,0x19,0x19,0x1a,0x1a,0x1b,0x1b,0x1c,0x1c,0x1d,
            0x1d,0x1e,0x1e,0x1f,0x1f,0x20,0x20,0x21,0x21,0x22,0x22,
            0x23,0x23,0x24,0x24,0x25,0x25,0x26,0x26,0x27,0x27,0x28,
            0x28,0x29,0x29,0x2a,0x2a,0x2b,0x2b,0x2c,0x2c,0x2d,0x2d,
            0x2e,0x2e,0x2f,0x2f,0x30,0x30,0x31,0x31,0x32,0x32,0x33,
            0x33,0x34,0x34,0x35,0x35,0x36,0x36,0x37,0x37,0x38,0x38,
            0x39,0x39,0x3a,0x3a,0x3b,0x3b,0x3c,0x3c,0x3d,0x3d,0x3e,
            0x3e,0x3f,0x3f,0x40,0x40,0x41,0x41,0x42,0x42,0x43,0x43,
            0x44,0x44,0x45,0x45,0x46,0x46,0x47,0x47,0x48,0x48,0x49,
            0x49,0x4a,0x4a,0x4b,0x4b,0x0,0x54
        ];
        this.simulatorPopup = null;
        // this.setZero();
        this.unsupportBlockExist = false;
        this.getStateTimeSleep = 500;
        this.lock= false;
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
            TYPE: "TYPE_EG_DUMMY",
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
            btstick5: 0
        };
        this.BIT0 = 0x01;
        this.BIT1 = 0x02;
        this.BIT2 = 0x04;
        this.BIT3 = 0x08;
        this.BIT4 = 0x10;
        this.BIT5 = 0x20;
        this.BIT6 = 0x40;
        this.BIT7 = 0x80;

        this.errorMessages = {
            0: "No Error",
            1: "can't assign to this",
            2: "NULL pointer dereference",
            3: "first argument to '?' should be a number",
            4: "can't get the address of this",
            5: "invalid operation",
            6: "invalid use of a NULL pointer",
            7: "not supported",
            8: "invalid expression",
            9: "array index must be an integer",
            10: "this Target is not an array",
            11: "need an structure or union member",
            12: "struct or union error",
            13: "doesn't have a member",
            14: "operator not expected here",
            15: "brackets not closed",
            16: "identifier not expected here",
            17: "macro arguments missing",
            18: "expression expected",
            19: "a void value isn't much use here",
            20: "value not expected here",
            21: "type not expected here",
            22: "brackets not closed",
            23: "ExpressionParseMacroCall out of memory",
            24: "too many arguments",
            25: "comma expected",
            26: "bad argument",
            27: "not enough arguments",
            28: "Macro undefined",
            29: "function - can't call",
            30: "ExpressionParseFunctionCall out of memory",
            31: "too many arguments",
            32: "comma expected",
            33: "bad argument",
            34: "not enough arguments",
            35: "undefined Fun name",
            36: "function body expected",
            37: "no value returned from a function returning",
            38: "couldn't find goto label",
            39: "expression expected",
            40: "integer value expected instead",
            41: "identifier expected",
            42: "undefined Identifier",
            43: "value expected",
            44: "#else without #if",
            45: "#endif without #if",
            46: "nested function definitions are not allowed",
            47: "too many parameters",
            48: "comma expected",
            49: "bad parameter",
            50: "main() should return an int or void",
            51: "bad parameters to main()",
            52: "bad function definition",
            53: "function definition expected",
            54: "Identifier is already defined",
            55: "} expected",
            56: "can't define a void variable",
            57: "close bracket expected",
            58: "Macro is already defined",
            59: "'(' expected",
            60: "statement expected",
            61: "';' expected",
            62: "')' expected",
            63: "'while' expected",
            64: "'{' expected",
            65: "filename.h expected",
            66: "'' expected",
            67: "value required in return",
            68: "value in return from a void function",
            69: "PicocParse out of memory",
            70: "parse error",
            71: "AssignFail",
            72: "TableSetIdentifier out of memory",
            73: "data type is already defined",
            74: "structure isn't defined",
            75: "struct/union definitions can only be globals",
            76: "invalid type in struct",
            77: "member already defined",
            78: "semicolon expected",
            79: "enum isn't defined",
            80: "enum definitions can only be globals",
            81: "bad type declaration",
            82: "']' expected",
            83: "Variable out of memory",
            84: "stack underrun",
            85: "VariableStack out of memory",
            86: "stack is empty - can't go back"
        };
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
        return null;
    }
    
    // Data processing from hardware
    handleLocalData(data) {
        // console.log("data received: ",data);
        if(this.isDroneConnection == false){
            this.lockGetState(true);
            this.checkGetState(data)
            return;
        }
        
        this.waitRevData(data);
    }

    // data to be delivered to the entry
    requestRemoteData(handler) {
        // handler.write(key, value) ...
    }

    lockGetState(lock){
        this.lock = lock
    }

    isLockGetState(){
        return this.lock;
    }
    
    connectDrone(){
        this.getStateInterval = setInterval(()=>{
            if(this.countDroneConnectionAttempt == 0 || !this.isLockGetState()){
                // console.log("Connection Attempt",this.countDroneConnectionAttempt+1)
                this.countDroneConnectionAttempt = this.countDroneConnectionAttempt +1
                if(this.isDroneConnection == false){
                    if( this.countDroneConnectionAttempt == 4){
                        // console.log("Connection failed");
                        this.countDroneConnectionAttempt = 0 ;
                        clearInterval(this.getStateInterval);    
                        return
                    }
                }
                else{
                    // console.log("Connection succeed");
                    // console.log("Drone is connected")
                    this.isDroneConnection = true;
                    this.countDroneConnectionAttempt = 0 ;
                    clearInterval(this.getStateInterval);    
                }
            }
        },this.getStateTimeSleep)
        this.getStateInterval;
    }

    waitRevData(data){
        var prevrevtemplength= this.revtemplength;
        this.revtemplength += data.length;
        // console.log(data.length);
        // console.log("prevrevtemplength: ",prevrevtemplength);
        // console.log("revtemplength: ",this.revtemplength);
        if(this.revtemplength <= this.DATAREVLEN){
            for (let i = 0; i < data.length; i++) {
                this.revtmpdata[prevrevtemplength +i] = data[i];
            }
            if(this.revtemplength==this.DATAREVLEN){
                // console.log("revtempdata")
                // console.log(this.revtmpdata);
                // console.log(this.revtmpdata[this.BT_INDEX_REVCHECKSUM]+"=="+this.calChecksum(this.revtmpdata));
                // if(parseInt(this.revtmpdata[this.BT_INDEX_REVCHECKSUM]) === this.calChecksum(this.revtmpdata) ){
                    for (let i = 0; i <this.DATAREVLEN ; i++) {
                        this.revdata[i] = parseInt(this.revtmpdata[i])
                    }
                    // console.log("revdata: ",this.revdata);

                    this.getInjectStatus(this.revdata);
                    this.revtemplength = 0;
                    this.revtmpdata = [];
                // }
                // else{
                //     console.log("Checksum error");
                //     this.revtemplength = 0;
                //     this.revtmpdata = []
                // }
            }
        }
        else{
            // console.log("Download error")
            this.revtemplength = 0;
            this.revtmpdata = []
        }
    }
    checkGetState(data){
        var prevrevtemplength= this.revtemplength;
        this.revtemplength += data.length
        // console.log("prevrevtemplength: ",prevrevtemplength);
        // console.log("revtemplength: ",this.revtemplength);
        for (let i = 0; i < data.length; i++) {
            this.revtmpdata[prevrevtemplength +i] = data[i];
        }
        if (this.revtemplength <=20) {
            // console.log("conection checking");
            if(this.revtemplength ==20){
                clearInterval(this.getStateInterval);
                this.isDroneConnection = true;
                this.revtemplength = 0;
                this.revtmpdata = [];
                this.lockGetState(false);
                // console.log("Drone connect succeed")
                // console.log("Unlock senpacket GetState");
            }
        }
        else if(this.revtemplength>20){
            clearInterval(this.getStateInterval)
            this.isDroneConnection = true;
            // console.log("Drone is already connected")
            // this.waitRevData(data);
            this.lockGetState(false);
            // console.log("Unlock senpacket GetState");
        }
    }

    retHex(bytes) {
        const l = Array.from(bytes).map(byte => '0x' + byte.toString(16).padStart(1, '0'));
        return l;
    }

    convertToBufferArray(input) {
        const hexArray = input.split(',');
        const byteArray = hexArray.map(hex => parseInt(hex, 16));
        const buffer = Buffer.from(byteArray);
        return buffer;
    }

    monitorDownloadProgress(data) {
        if (data && data.search("user_main();")) {
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
        if(chunkData[this.BT_INDEX_CMD_SEND] == 0x64)
        {
            for(let i=0;i<=chunkData.length-1;i++)
            {
                if(chunkData[i] == 0xff 
                    && chunkData[i+1] == 0x42 
                    && chunkData[i+2] == 0x43
                    && chunkData[i+3] == 0x43
                    && chunkData[i+4] == 0x44
                    && chunkData[i+5] == 0x44
                ){
                    return true;
                }
            }
        }

        return false;
    }

    generateBytesCode(type, Picocode="", nowdwpack=0) {
        let ret = Buffer.alloc(this.DATASENDLEN);

        ret[0] = 0x77;
        ret[1] = 0x78;

        ret[this.BT_INDEX_CMD_SEND] = this.BT_CMD_GETFLYSTATE1;
        for (let i = this.BT_INDEX_DATA_SEND; i < this.BT_INDEX_SENDCHECKSUM - 1; i++) {
            ret[i] = (Math.floor(i / 2)) & 0x000000ff;
        }

        if (type == this.cmdType.Download) {
            ret[this.BT_INDEX_CMD_SEND] = this.BT_CMD_DOWNLOAD;
            ret[this.BT_INDEX_DATA_SEND] = nowdwpack & 0x000000ff;
            ret[this.BT_INDEX_DATA_SEND + 1] = ((nowdwpack & 0x0000ff00) / 256) | 0;
        
            if (nowdwpack * this.packlen > Picocode.length) {
                ret[this.BT_INDEX_CMD_SEND] = this.BT_CMD_DOWNLOAD_END;
            }

            for (let i = 0; i < this.packlen; i++) {
                if (i + nowdwpack * this.packlen >= Picocode.length) {
                    ret[this.BT_INDEX_DATA_SEND + 2 + i] = 0xff;
                } else {
                    ret[this.BT_INDEX_DATA_SEND + 2 + i] = Picocode.charCodeAt(i +  nowdwpack * this.packlen);
                }
            }
        } else if (type == this.cmdType.Stop) {
            ret[this.BT_INDEX_CMD_SEND] = this.BT_CMD_PICOCSTOP
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
        return (this.sensor.TYPE).toString() + "_" + parseInt(this.sensor.VER).toString()
    }

    Errcode2Msg(ErrorCode) {
        return this.errorMessages[ErrorCode] || ""
    }
        
    ErrFly2String(ErrFly) {
        let msg=""
        const ERR_NONE 		=0		
        const ERR_LOWBATT 	=this.BIT0	
        const ERR_CODE		=this.BIT1	
        const ERR_TEMP		=this.BIT3	
        const ERR_SENSORS   =this.BIT4	
        const ERR_LOADER	=this.BIT5	
        const ERR_ANGLE		=this.BIT6	
        if (ErrFly == ERR_NONE){
            msg=msg +"NO_Error"

        }
        if (ErrFly & ERR_LOWBATT == ERR_LOWBATT){
            msg= "Low_Battery" + " "
        }
        if (ErrFly & ERR_CODE == ERR_CODE){
            msg=msg + "Code_Error" + " "
        }
        if (ErrFly & ERR_TEMP == ERR_TEMP){
            msg=msg + "motherboard_temperature_is_too_high" + " "
        }
        if (ErrFly & ERR_SENSORS == ERR_SENSORS){
            msg=msg + "Sensor_Error" + " "
        }
        if (ErrFly & ERR_LOADER == ERR_LOADER){
            msg=msg + "Excessive_load" + " "
        }
        if (ErrFly & ERR_ANGLE == ERR_ANGLE){
            msg=msg + "Excessive_inclination_angle" + " "
        }
        return msg
    }

    Sensor2String() {
        let SPLIT_STRING = "------------------------------------\n"
        let msg =   "STATE_PITCH=    " + (Math.round(this.sensor.Pitch, 3)).toString() + "\n"     
        msg = msg + "STATE_ROLL=    " + (Math.round(this.sensor.Roll, 3)).toString() + "\n"   
        msg = msg + "STATE_YAW=    " + (Math.round(this.sensor.Yaw, 3)).toString() + "\n"     
        msg = msg + SPLIT_STRING
        
        msg = msg + "STATE_TEMP=    " + (Math.round(this.sensor.SPL06_temp, 3)).toString() + "\n"     
        
        msg = msg + "FusedHeight=    " + (Math.round(this.sensor.FusedHeight, 3)).toString() + "\n"   
        
        msg = msg + "BATTERY=    " + (Math.round(this.sensor.Battery, 3)).toString() + "\n"           
        
        msg = msg + "VER=    " + this.VERSTR() + "\n"                        
        msg = msg + SPLIT_STRING
        msg = msg + "FLY_ERR=    " + this.ErrFly2String(parseInt(this.sensor.ErrFly)) + "\n"       
        msg = msg + "LINE_NO=    " + (this.sensor.LineNo) + "\n"                      
        msg = msg + "ERROR_NO=    " + (this.sensor.LineError) + "\n"                  
        msg = msg + "ERROR_MSG=    " + this.Errcode2Msg(this.sensor.ErrorCode) + "\n"         
        
        msg = msg + "DEBUG1=    " + (Math.round(this.sensor.Debug_0, 6)).toString() + "\n"            
        msg = msg + "DEBUG2=    " + (Math.round(this.sensor.Debug_1, 6)).toString() + "\n"
        msg = msg + "DEBUG3=    " + (Math.round(this.sensor.Debug_2, 6)).toString() + "\n"
        msg = msg + "DEBUG4=    " + (Math.round(this.sensor.Debug_3, 6)).toString() + "\n"
        msg = msg + "DEBUG5=    " + (Math.round(this.sensor.Debug_4, 6)).toString() + "\n"
        msg = msg + "DEBUG6=    " + (Math.round(this.sensor.Debug_5, 6)).toString() + "\n"
        return msg
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

    getInjectStatus(revtmp) {
        let revdata = Buffer.alloc(this.DATAREVLEN);
        if (revtmp.byteLength == this.DATAREVLEN)
        {
            if(revtmp[0] == 0x77 && revtmp[1] == 0x78)
            {
                if (revtmp[this.BT_INDEX_REVCHECKSUM] == this.calChecksum(revtmp))
                {
                    for (let i = 0; i < revtmp.length; i++) {
                        revdata[i] = revtmp[i];
                    }
                }
            }
        } 

        if (revdata[this.BT_INDEX_CMD_REV] === this.BT_CMD_DOWNLOAD || revdata[this.BT_INDEX_CMD_REV] === this.BT_CMD_DOWNLOAD_END) {
            let isrevsame = true;
            for (let i = 0; i < this.packlen; i++) {
                if (revtmp !== revdata[i + this.BT_INDEX_CMD_REV]) {
                    isrevsame = false;
                    break;
                }
            }
            if (isrevsame === true) {
                this.nowdwpack = this.nowdwpack + 1;
            }
            if (revdata[this.BT_INDEX_CMD_REV] === this.BT_CMD_DOWNLOAD_END) {
                // IsDownload = false;
                // console.log("download success");
                return true
            }
        }
        else if(this.revdata[this.BT_INDEX_CMD_REV] == this.BT_CMD_GETFLYSTATE1){
            this.sensor.btkey = parseInt(revdata[2] + revdata[3] * 256)
            this.sensor.btstick1 = parseInt(revdata[4])
            this.sensor.btstick2 = parseInt(revdata[5])
            this.sensor.btstick3 = parseInt(revdata[6])
            this.sensor.btstick4 = parseInt(revdata[7])
            this.sensor.ACC_x = this.byte2float(this.BT_INDEX_DATA_REV + 0 * 4)
            this.sensor.ACC_y = this.byte2float(this.BT_INDEX_DATA_REV + 1 * 4)
            this.sensor.ACC_z = this.byte2float(this.BT_INDEX_DATA_REV + 2 * 4)
            this.sensor.Gypo_x = this.byte2float(this.BT_INDEX_DATA_REV + 3 * 4)
            this.sensor.Gypo_y = this.byte2float(this.BT_INDEX_DATA_REV + 4 * 4)
            this.sensor.Gypo_z = this.byte2float(this.BT_INDEX_DATA_REV + 5 * 4)
            this.sensor.SPL06_temp = this.byte2float(this.BT_INDEX_DATA_REV + 6 * 4)
            this.sensor.SPL06_Press = this.byte2float(this.BT_INDEX_DATA_REV + 7 * 4)
            this.sensor.SPL06_asl = this.byte2float(this.BT_INDEX_DATA_REV + 8 * 4)
            this.sensor.Pitch = this.byte2float(this.BT_INDEX_DATA_REV + 9 * 4)
            this.sensor.Roll = this.byte2float(this.BT_INDEX_DATA_REV + 10 * 4)
            this.sensor.Yaw = this.byte2float(this.BT_INDEX_DATA_REV + 11 * 4)
            this.sensor.Battery = this.byte2float(this.BT_INDEX_DATA_REV + 12 * 4)
            this.sensor.LaserTof = this.byte2float(this.BT_INDEX_DATA_REV + 13 * 4)
            this.sensor.GL_X = this.byte2float(this.BT_INDEX_DATA_REV + 14 * 4)
            this.sensor.GL_Y = this.byte2float(this.BT_INDEX_DATA_REV + 15 * 4)
            this.sensor.timertick = this.byte2float(this.BT_INDEX_DATA_REV + 16 * 4)
            this.sensor.M1 = parseInt(revdata[this.BT_INDEX_DATA_REV + 17 * 4 + 0])
            this.sensor.M2 = parseInt(revdata[this.BT_INDEX_DATA_REV + 17 * 4 + 1])
            this.sensor.M3 = parseInt(revdata[this.BT_INDEX_DATA_REV + 17 * 4 + 2])
            this.sensor.M4 = parseInt(revdata[this.BT_INDEX_DATA_REV + 17 * 4 + 3])
    
            this.sensor.state_velocity_x = this.byte2float(this.BT_INDEX_DATA_REV + 18 * 4)
            this.sensor.state_velocity_y = this.byte2float(this.BT_INDEX_DATA_REV + 19 * 4)
            this.sensor.state_velocity_z = this.byte2float(this.BT_INDEX_DATA_REV + 20 * 4)
    
            this.sensor.Debug_0 = this.byte2float(this.BT_INDEX_DATA_REV + 21 * 4)
            this.sensor.Debug_1 = this.byte2float(this.BT_INDEX_DATA_REV + 22 * 4)
            this.sensor.Debug_2 = this.byte2float(this.BT_INDEX_DATA_REV + 23 * 4)
            this.sensor.Debug_3 = this.byte2float(this.BT_INDEX_DATA_REV + 24 * 4)
            this.sensor.Debug_4 = this.byte2float(this.BT_INDEX_DATA_REV + 25 * 4)
            this.sensor.Debug_5 = this.byte2float(this.BT_INDEX_DATA_REV + 26 * 4)
            this.sensor.FusedHeight = this.byte2float(this.BT_INDEX_DATA_REV + 27 * 4)
    
            this.sensor.VER = parseInt(revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 0])
            this.sensor.ErrFly = parseInt(revdata[this.BT_INDEX_DATA_REV + 28 * 4 + 1])            
            let msg = this.Sensor2String();
            // console.log(msg);
        }

        return false;
    }

    async downloadCode(sourceCode) {
        // console.log("Send chunk 0");
        let byteCode = this.generateBytesCode(this.cmdType.Download, sourceCode, 0);
        await this.sp.write(byteCode);

        await this.sleep();
        await this.sp.write(Buffer.from(this.getStateCode));
        let i = 0;

        await this.sleep();

        while(true) {
            // console.log("Send chunk ", i);
            byteCode = this.generateBytesCode(this.cmdType.Download, sourceCode, i);
            await this.sp.write(byteCode);
            await this.sleep();
            if(this.isLatestChunk(byteCode))
            {
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

    async HandleRun() {
        await this.sp.write(Buffer.from(this.runCode));
        await this.sleep();
    }

    async handleClean() {
        let i = 0;
        while(i < 2) {
            await this.sp.write(Buffer.from(this.stopCode));
            await this.sleep();
            i++;
        }
    }

    async handleRestart() {
        await this.sp.write(Buffer.from(this.getStateCode));
        await this.sleep();
    }

    // processing of data received from the entry
    handleRemoteData(handler) {
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
                    this.HandleRun();
                    break;
                default:
                    this.downloadCode(cmd);
                    break;
            }
        } catch (error) {
            // console.log(error);
        }
    }

    lostController() {}

    disconnect(connect) {
        if (this.isConnect) {
            this.isConnect = false;

            this.sp = null;
            connect.close();
        }
    }
}

module.exports = new WhalebotsEagle1001();