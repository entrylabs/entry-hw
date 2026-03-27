const BaseModule = require('./baseModule');
const {dialog} = require('electron');

/**
 * 원본코드: ProboConnect.js
 * Technic.js 적용 제품
 * - Technic normal
 * - Technic power
 **/

class AluxTechnicBase extends BaseModule {
    constructor() {
        super();
        this.firstMessageCount = 0;
        this.comparisonFwVer = 4; // 최신 버전
        this.moduleFwVer = 0;     // 테크닉에서 읽은 펌웨어 버전
        this.target_sApp = 0;     // s.App: 자식클레스에서 입력됨.
        this.EdgeBuff = {
            FEA1:0, FEA2:0, FEA3:0, FEA4:0,
            REA1:0, REA2:0, REA3:0, REA4:0,
            BEA1:0, BEA2:0, BEA3:0, BEA4:0
        };
        this.InputData = {
            Analog:{
                AA1: 0, AA2: 0, AA3: 0, AA4: 0
            },
            Digital:{
                A1: 0, A2: 0, A3: 0, A4: 0,
                FEA1:0, FEA2:0, FEA3:0, FEA4:0,
                REA1:0, REA2:0, REA3:0, REA4:0,
                BEA1:0, BEA2:0, BEA3:0, BEA4:0
            },
            Remote:{
                R_1:0, R_2:0, R_3:0, R_4:0, R_5:0, R_6:0, R_7:0, R_8:0,
                R_L1:0, R_L2:0, R_R1:0, R_R2:0
            },
            EEPROM:{
                EC:0,
                EEPR2:0, EEPR1:0 // 패킷 순서에 맞게 역순으로 배치
            },
            Infinite:{
                ROTATION_1:0, ROTATION_2:0, ROTATION_3:0, ROTATION_4:0
            },
            Acceler:{
                AXIS_X1:0, AXIS_X2:0, AXIS_X3:0, AXIS_X4:0,
                AXIS_Y1:0, AXIS_Y2:0, AXIS_Y3:0, AXIS_Y4:0,
                AXIS_Z1:0, AXIS_Z2:0, AXIS_Z3:0, AXIS_Z4:0,
            }

        };

        this.RemoteData = {
            B1:0, B2:0, B3:0, B4:0,
            Servo1:0, Servo2:0, Servo3:0, Servo4:0,
            DC1:0, DC2:0, DC3:0, DC4:0,
            MEL2:0, MEL1:0, // 패킷 순서에 맞게 역순으로 배치
            FND:100,
            EEPR4:0, EEPR3:0, EEPR2:0, EEPR1:0, // 패킷 순서에 맞게 역순으로 배치
            ASET2:0, ASET1:0  // 패킷 순서에 맞게 역순으로 배치
        };

        this.OutputData = new Buffer.alloc(22);
        this.OutputData[0] = 0xAD;
        this.OutputData[1] = 0xDA;
    }

    // 최초에 커넥션이 이루어진 후의 초기 설정.
    init(handler, config) {
        
    };

    // 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData(){
        const t = new Buffer.from([0x63, 0x36]);
        if (this.firstMessageCount++ === 5) {
            dialog.showMessageBox({
                type: 'info',
                title: `펌웨어 버전 확인`,
                message: `'Start' 버튼을 눌러주세요.\n(Please, Press the 'Start' button.)`
            });
        }
        return t;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        let connection = false;
        if (data[0] === this.target_sApp) {
            connection = true;
            this.moduleFwVer = data[1];
            if (this.comparisonFwVer !== this.moduleFwVer) {
                const massage = this.comparisonFwVer < this.moduleFwVer
                    ? `펌웨어 버전이 더 높습니다.\n(The firmware is higher than the latest version.)`
                    : `'드라이버 설치 2' 버튼을 눌러 펌웨어를 업데이트 해주세요.\n(Please, Click the 'Driver installation 2' button to update the firmware.)`;
                const version = `\n\n현재(now) : v${this.moduleFwVer}\n최신(latest) : v${this.comparisonFwVer}\n`;
                
                dialog.showMessageBox({
                    type: `info`,
                    title: `펌웨어 버전 확인`,
                    message: massage + version
                });
            }
        }
        return connection;
    }

    // optional. 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return (data[0]==0xCD && data[1] == 0xDA) 
            ? this.checkSumCk(data)
            : false;
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        handler.write("InputData", this.InputData);
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
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
    }

    checkSumMk(buff){
        buff[this.OutputData.length - 1] = 0;
        for(var i = 3 ; i < this.OutputData.length - 1 ; i++) {
            buff[this.OutputData.length - 1] +=  this.OutputData[i];
        }
    }

    // 하드웨어에 전달할 데이터
    requestLocalData() {
        this.OutputData[2] = this.OutputData.length - 3;
        this.checkSumMk(this.OutputData);
        return this.OutputData;
    }

    checkSumCk(buff){
        var ck = 0;
        for(var i = 3 ; i < (buff[2] + 2) ; i++ ) {
            ck += buff[i];
        }

        return buff[buff[2]+2] == (ck & 0xff)
            ? true
            : false;
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        this.InputData.Analog.AA1 = data[4];
        this.InputData.Analog.AA2 = data[5];
        this.InputData.Analog.AA3 = data[6];
        this.InputData.Analog.AA4 = data[7];

        this.InputData.Digital.A4 = (data[8] >> 7) & 0x01;
        this.InputData.Digital.A3 = (data[8] >> 6) & 0x01;
        this.InputData.Digital.A2 = (data[8] >> 5) & 0x01;
        this.InputData.Digital.A1 = (data[8] >> 4) & 0x01;
        this.InputData.Digital.FEA4 = (data[8] >> 3) & 0x01;
        this.InputData.Digital.FEA3 = (data[8] >> 2) & 0x01;
        this.InputData.Digital.FEA2 = (data[8] >> 1) & 0x01;
        this.InputData.Digital.FEA1 = data[8] & 0x01;

        this.InputData.Digital.REA4 = (data[9] >> 7) & 0x01;
        this.InputData.Digital.REA3 = (data[9] >> 6) & 0x01;
        this.InputData.Digital.REA2 = (data[9] >> 5) & 0x01;
        this.InputData.Digital.REA1 = (data[9] >> 4) & 0x01;
        this.InputData.Digital.BEA4 = (data[9] >> 3) & 0x01;
        this.InputData.Digital.BEA3 = (data[9] >> 2) & 0x01;
        this.InputData.Digital.BEA2 = (data[9] >> 1) & 0x01;
        this.InputData.Digital.BEA1 = data[9] & 0x01;

        this.InputData.Remote.R_3 = (data[10] >> 7) & 0x01;
        this.InputData.Remote.R_2 = (data[10] >> 6) & 0x01;
        this.InputData.Remote.R_4 = (data[10] >> 5) & 0x01;
        this.InputData.Remote.R_1 = (data[10] >> 4) & 0x01;

        this.InputData.Remote.R_7 = (data[11] >> 7) & 0x01;
        this.InputData.Remote.R_6 = (data[11] >> 6) & 0x01;
        this.InputData.Remote.R_8 = (data[11] >> 5) & 0x01;
        this.InputData.Remote.R_5 = (data[11] >> 4) & 0x01;
        this.InputData.Remote.R_R1 = (data[11] >> 3) & 0x01;
        this.InputData.Remote.R_L1 = (data[11] >> 2) & 0x01;
        this.InputData.Remote.R_R2 = (data[11] >> 1) & 0x01;
        this.InputData.Remote.R_L2 = data[11] & 0x01;

        this.InputData.EEPROM.EC = data[13];
        this.InputData.EEPROM.EEPR2 = data[14];
        this.InputData.EEPROM.EEPR1 = data[15];

        this.InputData.Infinite.ROTATION_1 = (data[16] >> 6) & 0xC;
        this.InputData.Infinite.ROTATION_2 = (data[16] >> 4) & 0xC;
        this.InputData.Infinite.ROTATION_3 = (data[16] >> 2) & 0xC;
        this.InputData.Infinite.ROTATION_4 = (data[16] >> 0) & 0xC;

        this.InputData.Acceler.AXIS_X1 = data[4];
        this.InputData.Acceler.AXIS_X2 = data[5];
        this.InputData.Acceler.AXIS_X3 = data[6];
        this.InputData.Acceler.AXIS_X4 = data[7];

        this.InputData.Acceler.AXIS_Y1 = data[17];
        this.InputData.Acceler.AXIS_Y2 = data[19];
        this.InputData.Acceler.AXIS_Y3 = data[21];
        this.InputData.Acceler.AXIS_Y4 = data[23];

        this.InputData.Acceler.AXIS_Z1 = data[18];
        this.InputData.Acceler.AXIS_Z2 = data[20];
        this.InputData.Acceler.AXIS_Z3 = data[22];
        this.InputData.Acceler.AXIS_Z4 = data[24];
    }

    // 하드웨어 연결 해제 시 호출
    disconnect(connect) {
        connect.close();
    };
    
    // 연결 종료 후 처리 코드
    reset() {
    };
}

module.exports = AluxTechnicBase;
