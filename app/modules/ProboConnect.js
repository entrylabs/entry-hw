const _ = require('lodash');
const BaseModule = require('./baseModule');

class ProboConnect extends BaseModule {
    constructor() {
        super();

        this.foo = 0;
        this.sp = null;
        this.EdgeBuff = {
            FEA1:0,
            FEA2:0,
            FEA3:0,
            FEA4:0,
            REA1:0,
            REA2:0,
            REA3:0,
            REA4:0,
            BEA1:0,
            BEA2:0,
            BEA3:0,
            BEA4:0
        };
        this.InputData = {
            Analog:{
                AA1: 0,
                AA2: 0,
                AA3: 0,
                AA4: 0 },
            Digital:{
                A1: 0,
                A2: 0,
                A3: 0,
                A4: 0,
                FEA1:0,
                FEA2:0,
                FEA3:0,
                FEA4:0,
                REA1:0,
                REA2:0,
                REA3:0,
                REA4:0,
                BEA1:0,
                BEA2:0,
                BEA3:0,
                BEA4:0 },
            Remote:{
                R_1:0,
                R_2:0,
                R_3:0,
                R_4:0,
                R_5:0,
                R_6:0,
                R_7:0,
                R_8:0,
                R_L1:0,
                R_L2:0,
                R_R1:0,
                R_R2:0 },
            EEPROM:{
                EC:0,
                EEPR2:0,
                EEPR1:0
            }
        };

        this.RemoteData = {
            B1:0,
            B2:0,
            B3:0,
            B4:0,
            Servo1:0,
            Servo2:0,
            Servo3:0,
            Servo4:0,
            DC1:0,
            DC2:0,
            DC3:0,
            DC4:0,
            MEL2:0,
            MEL1:0,
            FND:100,
            EEPR4:0,
            EEPR3:0,
            EEPR2:0,
            EEPR1:0,
            ASET2:0,
            ASET1:0
        };

        this.OutputData = new Buffer(22);

        this.OutputData[0] = 0xAD;
        this.OutputData[1] = 0xDA;
        this.OutputData[2] = 0x00;
        this.OutputData[3] = 0x00;
        this.OutputData[4] = 0x00;
        this.OutputData[5] = 0x00;
        this.OutputData[6] = 0x00;
        this.OutputData[7] = 0x00;
        this.OutputData[8] = 0x00;
        this.OutputData[9] = 0x00;
        this.OutputData[10] = 0x00;
        this.OutputData[11] = 0x00;
        this.OutputData[12] = 0x00;
        this.OutputData[13] = 0x00;
        this.OutputData[14] = 0x00;
        this.OutputData[15] = 0x00;
        this.OutputData[16] = 0x00;
        this.OutputData[17] = 0x00;
        this.OutputData[18] = 0x00;
        this.OutputData[19] = 0x00;
        this.OutputData[20] = 0x00;
        this.OutputData[21] = 0x00;


    }

    // init(handler, config) {}
    //
    // setSerialPort(sp) {
    //     this.sp = sp;
    // }

    // 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData(sp){
        console.count('InitialData');
        this.sp = sp;
        var initTxBuf = new Buffer([0x63, 0x36]);
        return initTxBuf;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        console.count('checkInit');
        //const TxBuf = new Buffer([0x1B, 0x00, 0x00, 0x00, 0x0E]);
        const TxBuf = new Buffer([0x24, 0x42]);
        var rt = false;

        if((data[0]&0x30) == 0x30){
            rt = true;
            if((data[0]&0x32) != 0x32) this.sp.write(TxBuf);
        }

        return rt;
    }

    // optional. 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        console.count('write soket');
        handler.write("InputData",this.InputData);
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        console.count('read soket');

        //handler.read('DC1');
        Object.keys(this.RemoteData).forEach((port) => {
            this.RemoteData[port] = handler.read(port);
        });

        this.OutputData[3] = 0xF0 | (this.RemoteData.B4 << 3) | (this.RemoteData.B3 << 2) | (this.RemoteData.B2 << 1) | this.RemoteData.B1;
        this.OutputData[4] = this.RemoteData.Servo1;
        this.OutputData[5] = this.RemoteData.Servo2;
        this.OutputData[6] = this.RemoteData.Servo3;
        this.OutputData[7] = this.RemoteData.Servo4;
        this.OutputData[8] = this.RemoteData.DC1;
        this.OutputData[9] = this.RemoteData.DC2;
        this.OutputData[10] = this.RemoteData.DC3;
        this.OutputData[11] = this.RemoteData.DC4;

        this.OutputData[12] = this.RemoteData.MEL2;
        this.OutputData[13] = this.RemoteData.MEL1;
        this.OutputData[14] = this.RemoteData.FND;
        this.OutputData[15] = this.RemoteData.EEPR4;
        this.OutputData[16] = this.RemoteData.EEPR3;
        this.OutputData[17] = this.RemoteData.EEPR2;
        this.OutputData[18] = this.RemoteData.EEPR1;
        this.OutputData[19] = this.RemoteData.ASET2;
        this.OutputData[20] = this.RemoteData.ASET1;


        // Object.keys(this.SENSOR_MAP).forEach((port) => {
        //     this.SENSOR_MAP[port] = handler.read(port);
        // });
        //
        // const receivedStatusColor = this.STATUS_COLOR_MAP[
        //     handler.read('STATUS_COLOR')
        //     ];
        // if (
        //     receivedStatusColor !== undefined &&
        //     this.CURRENT_STATUS_COLOR.COLOR !== receivedStatusColor
        // ) {
        //     this.CURRENT_STATUS_COLOR = {
        //         COLOR: receivedStatusColor,
        //         APPLIED: false,
        //     };
        // }
    }

    checkSumMk(buff){
        buff[this.OutputData.length - 1] = 0;
        for(var i = 3 ; i < this.OutputData.length - 1 ; i++)
            buff[this.OutputData.length - 1] +=  this.OutputData[i];
    }

    // 하드웨어에 전달할 데이터
    requestLocalData() {
        console.count('write hardware');
        // var OutputBuff = [0xAD,0xDA,0x00];
        // const TxBuf = new Buffer([0xAD, 0xDA, 0x00]);
        this.OutputData[2] = this.OutputData.length - 3;
        this.checkSumMk(this.OutputData);
        return this.OutputData;
    }

    checkSumCk(buff){
        var ck = 0;
        for(var i = 3 ; i < (buff[2] + 2) ; i++ )
            ck += buff[i];

        return buff[buff[2]+2] == (ck & 0xff) ? true : false;
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        console.count('read hardware');
        if(data[0]==0xCD && data[1] == 0xDA)
        {
            if(this.checkSumCk(data)) {
                this.InputData.Analog.AA1 = data[4];
                this.InputData.Analog.AA2 = data[5];
                this.InputData.Analog.AA3 = data[6];
                this.InputData.Analog.AA4 = data[7];

                this.InputData.Digital.A4 = (data[8] & 0x80) ? 1 : 0;
                this.InputData.Digital.A3 = (data[8] & 0x40) ? 1 : 0;
                this.InputData.Digital.A2 = (data[8] & 0x20) ? 1 : 0;
                this.InputData.Digital.A1 = (data[8] & 0x10) ? 1 : 0;
                this.InputData.Digital.FEA4 = (data[8] & 0x08) ? 1 : 0;
                this.InputData.Digital.FEA3 = (data[8] & 0x04) ? 1 : 0;
                this.InputData.Digital.FEA2 = (data[8] & 0x02) ? 1 : 0;
                this.InputData.Digital.FEA1 = (data[8] & 0x01) ? 1 : 0;

                this.InputData.Digital.REA4 = (data[9] & 0x80) ? 1 : 0;
                this.InputData.Digital.REA3 = (data[9] & 0x40) ? 1 : 0;
                this.InputData.Digital.REA2 = (data[9] & 0x20) ? 1 : 0;
                this.InputData.Digital.REA1 = (data[9] & 0x10) ? 1 : 0;
                this.InputData.Digital.BEA4 = (data[9] & 0x08) ? 1 : 0;
                this.InputData.Digital.BEA3 = (data[9] & 0x04) ? 1 : 0;
                this.InputData.Digital.BEA2 = (data[9] & 0x02) ? 1 : 0;
                this.InputData.Digital.BEA1 = (data[9] & 0x01) ? 1 : 0;

                this.InputData.Remote.R_3 = (data[10] & 0x80) ? 1 : 0;
                this.InputData.Remote.R_2 = (data[10] & 0x40) ? 1 : 0;
                this.InputData.Remote.R_4 = (data[10] & 0x20) ? 1 : 0;
                this.InputData.Remote.R_1 = (data[10] & 0x10) ? 1 : 0;

                this.InputData.Remote.R_7 = (data[11] & 0x80) ? 1 : 0;
                this.InputData.Remote.R_6 = (data[11] & 0x40) ? 1 : 0;
                this.InputData.Remote.R_8 = (data[11] & 0x20) ? 1 : 0;
                this.InputData.Remote.R_5 = (data[11] & 0x10) ? 1 : 0
                this.InputData.Remote.R_R1 = (data[11] & 0x08) ? 1 : 0;
                this.InputData.Remote.R_L1 = (data[11] & 0x04) ? 1 : 0;
                this.InputData.Remote.R_R2 = (data[11] & 0x02) ? 1 : 0;
                this.InputData.Remote.R_L2 = (data[11] & 0x01) ? 1 : 0;

                this.InputData.EEPROM.EC = data[13];
                this.InputData.EEPROM.EEPR2 = data[14];
                this.InputData.EEPROM.EEPR1 = data[15];
            }
            else
                console.count('CheckSum Err');
        }
        //this.sensors = data;
    }

}

module.exports = new ProboConnect();
