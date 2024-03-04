const BaseModule = require('./baseModule');

class Wearable extends BaseModule {
    constructor() {
        super();

        this.foo = 0;
        this.sp = null;

        //data to Entry
        this.sensorValue = {
            button:{
                btnUp:0,
                btnDown:0,
                btnLeft:0,
                btnRight:0,
                btnJoyL:0,
                btnJoyR:0 
            },
            euler:{
                pitch:10,
                roll:20,
                yaw:30
            },
            stick:{
                leftX:0,
                leftY:0,
                rightX:0,
                rightY:0
            },
            ACC:{
                accX:0,
                accY:0,
                accZ:0
            },
            test:{
                VAL1:undefined,
                VAL2:undefined,
                VAL3:undefined  
            },
            battery:0,
            micInput:0            
        };
        
        //data from entry
        this.dataFromEntry = {
            mainLED0:[0,0,0],
            mainLED1:[0,0,0],
            mainLED2:[0,0,0],
            mainLED3:[0,0,0],
            mainLED4:[0,0,0],
            mainLED5:[0,0,0],
            mainLED6:[0,0,0],
            mainLED7:[0,0,0],
            mainLED8:[0,0,0],
            mainLED9:[0,0,0],
            mainLED10:[0,0,0],
            mainLED11:[0,0,0],
            leftLED0:[0,0,0],
            leftLED1:[0,0,0],
            leftLED2:[0,0,0],
            rightLED0:[0,0,0],
            rightLED1:[0,0,0],
            rightLED2:[0,0,0],
            octave:0,
            note:0,
            soundNumber:0          
        };
       
        this.serialPacket = new Buffer(65); //header(2) + Dtype(1) + Length of payload(1) + from(1) + to(1) + payload(57) + crcL(1)  + crcH(1)
        for(var j = 0; j < 65; j++) {
            this.serialPacket[j] = 0x00;
        }  
        
        this.serialPacket[0] = 0x0A;
        this.serialPacket[1] = 0x55;
        this.serialPacket[2] = 0x10;  // Dtype: control
        this.serialPacket[3] = 0x39;
        this.serialPacket[4] = 0x80;
        this.serialPacket[5] = 0x10;       

    }

    init(handler, config) {
        //this.handler = handler;
        //this.config = config;
        /*
        this.dataFromEntry.mainLED0[0] = 0;
        this.dataFromEntry.mainLED0[1] = 0;
        this.dataFromEntry.mainLED0[2] = 0;
        this.dataFromEntry.mainLED1[0] = 0;
        this.dataFromEntry.mainLED1[1] = 0;
        this.dataFromEntry.mainLED1[2] = 0;
        this.dataFromEntry.mainLED2[0] = 0;
        this.dataFromEntry.mainLED2[1] = 0; 
        this.dataFromEntry.mainLED2[2] = 0;
        this.dataFromEntry.mainLED3[0] = 0;
        this.dataFromEntry.mainLED3[1] = 0;
        this.dataFromEntry.mainLED3[2] = 0;
        this.dataFromEntry.mainLED4[0] = 0;
        this.dataFromEntry.mainLED4[1] = 0;
        this.dataFromEntry.mainLED4[2] = 0;
        this.dataFromEntry.mainLED5[0] = 0;
        this.dataFromEntry.mainLED5[1] = 0;
        this.dataFromEntry.mainLED5[2] = 0;
        this.dataFromEntry.mainLED6[0] = 0;
        this.dataFromEntry.mainLED6[1] = 0;
        this.dataFromEntry.mainLED6[2] = 0;
        this.dataFromEntry.mainLED7[0] = 0;
        this.dataFromEntry.mainLED7[1] = 0;
        this.dataFromEntry.mainLED7[2] = 0;
        this.dataFromEntry.mainLED8[0] = 0;
        this.dataFromEntry.mainLED8[1] = 0;
        this.dataFromEntry.mainLED8[2] = 0;
        this.dataFromEntry.mainLED9[0] = 0;
        this.dataFromEntry.mainLED9[1] = 0;
        this.dataFromEntry.mainLED9[2] = 0;
        this.dataFromEntry.mainLED10[0] = 0;
        this.dataFromEntry.mainLED10[1] = 0;
        this.dataFromEntry.mainLED10[2] = 0;
        this.dataFromEntry.mainLED11[0] = 0;
        this.dataFromEntry.mainLED11[1] = 0;
        this.dataFromEntry.mainLED11[2] = 0;

        this.dataFromEntry.leftLED0[0] = 0;
        this.dataFromEntry.leftLED0[1] = 0;
        this.dataFromEntry.leftLED0[2] = 0;
        this.dataFromEntry.leftLED1[0] = 0;
        this.dataFromEntry.leftLED1[1] = 0;
        this.dataFromEntry.leftLED1[2] = 0;
        this.dataFromEntry.leftLED2[0] = 0;
        this.dataFromEntry.leftLED2[1] = 0;
        this.dataFromEntry.leftLED2[2] = 0;

        this.dataFromEntry.rightLED0[0] = 0;
        this.dataFromEntry.rightLED0[1] = 0;
        this.dataFromEntry.rightLED0[2] = 0;
        this.dataFromEntry.rightLED1[0] = 0;
        this.dataFromEntry.rightLED1[1] = 0;
        this.dataFromEntry.rightLED1[2] = 0; 
        this.dataFromEntry.rightLED2[0] = 0;
        this.dataFromEntry.rightLED2[1] = 0;
        this.dataFromEntry.rightLED2[2] = 0;
        */
       
    }
   

    // 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    
    requestInitialData(sp){
           
        return null;       
    }
    

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
             

       return true;
    }
    

    // optional. 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        
        return true;
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        console.log('write soket');
        handler.write("sensorValue",this.sensorValue);

    }


    crc16_ccitt(buf) {
        var crcTable = [
            0x0000,0x1021,0x2042,0x3063,0x4084,0x50a5,0x60c6,0x70e7,
            0x8108,0x9129,0xa14a,0xb16b,0xc18c,0xd1ad,0xe1ce,0xf1ef,
            0x1231,0x0210,0x3273,0x2252,0x52b5,0x4294,0x72f7,0x62d6,
            0x9339,0x8318,0xb37b,0xa35a,0xd3bd,0xc39c,0xf3ff,0xe3de,
            0x2462,0x3443,0x0420,0x1401,0x64e6,0x74c7,0x44a4,0x5485,
            0xa56a,0xb54b,0x8528,0x9509,0xe5ee,0xf5cf,0xc5ac,0xd58d,
            0x3653,0x2672,0x1611,0x0630,0x76d7,0x66f6,0x5695,0x46b4,
            0xb75b,0xa77a,0x9719,0x8738,0xf7df,0xe7fe,0xd79d,0xc7bc,
            0x48c4,0x58e5,0x6886,0x78a7,0x0840,0x1861,0x2802,0x3823,
            0xc9cc,0xd9ed,0xe98e,0xf9af,0x8948,0x9969,0xa90a,0xb92b,
            0x5af5,0x4ad4,0x7ab7,0x6a96,0x1a71,0x0a50,0x3a33,0x2a12,
            0xdbfd,0xcbdc,0xfbbf,0xeb9e,0x9b79,0x8b58,0xbb3b,0xab1a,
            0x6ca6,0x7c87,0x4ce4,0x5cc5,0x2c22,0x3c03,0x0c60,0x1c41,
            0xedae,0xfd8f,0xcdec,0xddcd,0xad2a,0xbd0b,0x8d68,0x9d49,
            0x7e97,0x6eb6,0x5ed5,0x4ef4,0x3e13,0x2e32,0x1e51,0x0e70,
            0xff9f,0xefbe,0xdfdd,0xcffc,0xbf1b,0xaf3a,0x9f59,0x8f78,
            0x9188,0x81a9,0xb1ca,0xa1eb,0xd10c,0xc12d,0xf14e,0xe16f,
            0x1080,0x00a1,0x30c2,0x20e3,0x5004,0x4025,0x7046,0x6067,
            0x83b9,0x9398,0xa3fb,0xb3da,0xc33d,0xd31c,0xe37f,0xf35e,
            0x02b1,0x1290,0x22f3,0x32d2,0x4235,0x5214,0x6277,0x7256,
            0xb5ea,0xa5cb,0x95a8,0x8589,0xf56e,0xe54f,0xd52c,0xc50d,
            0x34e2,0x24c3,0x14a0,0x0481,0x7466,0x6447,0x5424,0x4405,
            0xa7db,0xb7fa,0x8799,0x97b8,0xe75f,0xf77e,0xc71d,0xd73c,
            0x26d3,0x36f2,0x0691,0x16b0,0x6657,0x7676,0x4615,0x5634,
            0xd94c,0xc96d,0xf90e,0xe92f,0x99c8,0x89e9,0xb98a,0xa9ab,
            0x5844,0x4865,0x7806,0x6827,0x18c0,0x08e1,0x3882,0x28a3,
            0xcb7d,0xdb5c,0xeb3f,0xfb1e,0x8bf9,0x9bd8,0xabbb,0xbb9a,
            0x4a75,0x5a54,0x6a37,0x7a16,0x0af1,0x1ad0,0x2ab3,0x3a92,
            0xfd2e,0xed0f,0xdd6c,0xcd4d,0xbdaa,0xad8b,0x9de8,0x8dc9,
            0x7c26,0x6c07,0x5c64,0x4c45,0x3ca2,0x2c83,0x1ce0,0x0cc1,
            0xef1f,0xff3e,0xcf5d,0xdf7c,0xaf9b,0xbfba,0x8fd9,0x9ff8,
            0x6e17,0x7e36,0x4e55,0x5e74,0x2e93,0x3eb2,0x0ed1,0x1ef0
        ];
        
        var crc = 0x0000;
        var j, i;
        for (i = 0; i < buf.length; i++) {
            let c = buf[i];
            if (c > 255) {
                throw new RangeError();
            }
            j = (c ^ (crc >> 8)) & 0xFF;
            crc = crcTable[j] ^ (crc << 8);
        }
        return ((crc ^ 0) & 0xFFFF);
    }


    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        console.log('read soket');

        //this.sensorValue.test.VAL2 = handler.read();
                  
        Object.keys(this.dataFromEntry).forEach((port) => {
            this.dataFromEntry[port] = handler.read(port);                 
        });

        //this.sensorValue.test.VAL1 = this.dataFromEntry.mainLED0[0];
        //this.sensorValue.test.VAL2 = this.dataFromEntry.mainLED0[1];
        //this.sensorValue.test.VAL3 = this.dataFromEntry.mainLED0[2];

        this.serialPacket[6] = this.dataFromEntry.mainLED0[0];
        this.serialPacket[7] = this.dataFromEntry.mainLED0[1];
        this.serialPacket[8] = this.dataFromEntry.mainLED0[2];
        this.serialPacket[9] = this.dataFromEntry.mainLED1[0];
        this.serialPacket[10] = this.dataFromEntry.mainLED1[1];
        this.serialPacket[11] = this.dataFromEntry.mainLED1[2];
        this.serialPacket[12] = this.dataFromEntry.mainLED2[0];
        this.serialPacket[13] = this.dataFromEntry.mainLED2[1]; 
        this.serialPacket[14] = this.dataFromEntry.mainLED2[2];
        this.serialPacket[15] = this.dataFromEntry.mainLED3[0];
        this.serialPacket[16] = this.dataFromEntry.mainLED3[1];
        this.serialPacket[17] = this.dataFromEntry.mainLED3[2];
        this.serialPacket[18] = this.dataFromEntry.mainLED4[0];
        this.serialPacket[19] = this.dataFromEntry.mainLED4[1];
        this.serialPacket[20] = this.dataFromEntry.mainLED4[2];
        this.serialPacket[21] = this.dataFromEntry.mainLED5[0];
        this.serialPacket[22] = this.dataFromEntry.mainLED5[1];
        this.serialPacket[23] = this.dataFromEntry.mainLED5[2];
        this.serialPacket[24] = this.dataFromEntry.mainLED6[0];
        this.serialPacket[25] = this.dataFromEntry.mainLED6[1];
        this.serialPacket[26] = this.dataFromEntry.mainLED6[2];
        this.serialPacket[27] = this.dataFromEntry.mainLED7[0];
        this.serialPacket[28] = this.dataFromEntry.mainLED7[1];
        this.serialPacket[29] = this.dataFromEntry.mainLED7[2];
        this.serialPacket[30] = this.dataFromEntry.mainLED8[0];
        this.serialPacket[31] = this.dataFromEntry.mainLED8[1];
        this.serialPacket[32] = this.dataFromEntry.mainLED8[2];
        this.serialPacket[33] = this.dataFromEntry.mainLED9[0];
        this.serialPacket[34] = this.dataFromEntry.mainLED9[1];
        this.serialPacket[35] = this.dataFromEntry.mainLED9[2];
        this.serialPacket[36] = this.dataFromEntry.mainLED10[0];
        this.serialPacket[37] = this.dataFromEntry.mainLED10[1];
        this.serialPacket[38] = this.dataFromEntry.mainLED10[2];
        this.serialPacket[39] = this.dataFromEntry.mainLED11[0];
        this.serialPacket[40] = this.dataFromEntry.mainLED11[1];
        this.serialPacket[41] = this.dataFromEntry.mainLED11[2];

        this.serialPacket[42] = this.dataFromEntry.leftLED0[0];
        this.serialPacket[43] = this.dataFromEntry.leftLED0[1];
        this.serialPacket[44] = this.dataFromEntry.leftLED0[2];
        this.serialPacket[45] = this.dataFromEntry.leftLED1[0];
        this.serialPacket[46] = this.dataFromEntry.leftLED1[1];
        this.serialPacket[47] = this.dataFromEntry.leftLED1[2];
        this.serialPacket[48] = this.dataFromEntry.leftLED2[0];
        this.serialPacket[49] = this.dataFromEntry.leftLED2[1];
        this.serialPacket[50] = this.dataFromEntry.leftLED2[2];

        this.serialPacket[51] = this.dataFromEntry.rightLED0[0];
        this.serialPacket[52] = this.dataFromEntry.rightLED0[1];
        this.serialPacket[53] = this.dataFromEntry.rightLED0[2];
        this.serialPacket[54] = this.dataFromEntry.rightLED1[0];
        this.serialPacket[55] = this.dataFromEntry.rightLED1[1];
        this.serialPacket[56] = this.dataFromEntry.rightLED1[2];
        this.serialPacket[57] = this.dataFromEntry.rightLED2[0];
        this.serialPacket[58] = this.dataFromEntry.rightLED2[1];
        this.serialPacket[59] = this.dataFromEntry.rightLED2[2];

        this.serialPacket[60] = this.dataFromEntry.octave;
        this.serialPacket[61] = this.dataFromEntry.note;
        this.serialPacket[62] = this.dataFromEntry.soundNumber;
        
        this.sensorValue.test.VAL1 = this.serialPacket[42];
        this.sensorValue.test.VAL2 = this.serialPacket[43];
        this.sensorValue.test.VAL3 = this.serialPacket[44];

        var crcBuff = this.serialPacket.slice(2, 63);
        var crc16 = this.crc16_ccitt(crcBuff);
        var crcL = crc16 & 0x00FF;
        var crcH = (crc16 & 0xFF00) >> 8;

        this.serialPacket[63] = crcL;
        this.serialPacket[64] = crcH;        
    }

    // 하드웨어에 전달할 데이터
    requestLocalData() {
        console.log('write hardware');
        //this.sensorValue.test.VAL1 = this.serialPacket[62];
        //this.sensorValue.test.VAL2 = this.serialPacket[61];
        return this.serialPacket;        
    }

    get_nth_bit(n, nth) {
        if (n & (1 << nth)) return 1; 
        else return 0; 
    }
    
    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        
        //if(data[0]==0x0A && data[1] == 0x55)
        if(data[0] == 0x0A)
        {
            console.log("Right DATA!");
            if(data.length < 13) return;
                      
            if(data[2] == 0x7E) {                
                                
                //this.sensorValue.euler.pitch = data.readInt16LE(6);
                //this.sensorValue.euler.roll = data.readInt16LE(8);
                //this.sensorValue.euler.yaw = data.readInt16LE(10);

                //this.sensorValue.ACC.accX = data[12];
                //this.sensorValue.ACC.accY = data[13];
                //this.sensorValue.ACC.accZ = data[14];

                this.sensorValue.stick.leftX = data[6];
                this.sensorValue.stick.leftY = data[7];
                this.sensorValue.stick.rightX = data[8];
                this.sensorValue.stick.rightY = data[9];
               
                this.sensorValue.button.btnUp = this.get_nth_bit(data[10], 0);
                this.sensorValue.button.btnDown = this.get_nth_bit(data[10], 1);
                this.sensorValue.button.btnLeft = this.get_nth_bit(data[10], 2);
                this.sensorValue.button.btnRight = this.get_nth_bit(data[10], 3);
                this.sensorValue.button.btnJoyL = this.get_nth_bit(data[10], 4);
                this.sensorValue.button.btnJoyR = this.get_nth_bit(data[10], 5); 
                
                this.sensorValue.micInput = data[11];
                this.sensorValue.battery = data[12];                
           }
           else if(data[2] == 0x7F) {

                this.sensorValue.euler.pitch = data.readInt16LE(6);
                this.sensorValue.euler.roll = data.readInt16LE(8);
                this.sensorValue.euler.yaw = data.readInt16LE(10);
           }
        }       
    }
}

module.exports = new Wearable();
