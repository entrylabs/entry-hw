const _ = require('lodash');
const BaseModule = require('./baseModule');

class hyact_xylobot extends BaseModule
{
    constructor() {
        super();

        this.sp = null;

        this.checkTime = null;
        this.lastTime = null;
        this.address = null;
        this.sendCounter = 0;

        this.sendBuffer = new Array(14);

        this.protocols = {
            HEADER_1:  0xFF,
            HEADER_2:  0xFF,

            IST_R_positionC: 0x0B,
            IST_R_positionD: 0x0D,
            IST_R_positionE: 0x0F,
            IST_R_positionF: 0x11,
            IST_R_positionG: 0x13,
            IST_R_positionA: 0x15,
            IST_R_positionB: 0x17,
            IST_R_positionHighC: 0x19,
            IST_R_OPERATION_MODE: 0x40,
            IST_W_OPERATION_MODE: 0x41,
            IST_W_LED_CONTROL_RGB: 0x43,
            IST_W_LED_CONTROL_COLOR: 0x45,
            IST_W_LED_CONTROL_MOVEMENT: 0x47,
            IST_W_PLAY_NOTE: 0x49,
            IST_W_PLAY_NOTE_READY_POSITION : 0x4B,
            IST_W_PLAY_NOTE_TARGET_POSITION: 0x4D,
            IST_W_DEVICE_ALL_TORQUE_ENABLE: 0xA5,
            IST_W_DEVICE_1_TORQUE_ENABLE: 0xA7,
            IST_W_DEVICE_2_TORQUE_ENABLE: 0xA9,
            IST_W_DEVICE_3_TORQUE_ENABLE: 0xAB,
            IST_W_DEVICE_ALL_TARGET_POSITION: 0xAD,
            IST_W_DEVICE_1_TARGET_POSITION: 0xAF,
            IST_W_DEVICE_2_TARGET_POSITION: 0xB1,
            IST_W_DEVICE_3_TARGET_POSITION: 0XB3,
            IST_W_DEVICE_ALL_MOVING_SPEEED: 0xB5,
            IST_W_DEVICE_1_MOVING_SPEED: 0xB7,
            IST_W_DEVICE_2_MOVING_SPEED: 0xB9,
            IST_W_DEVICE_3_MOVING_SPEED: 0xBB,
            IST_W_DEVICE_ALL_MOVING_TORQUE: 0xC5,
            IST_W_DEVICE_1_MOVING_TORQUE: 0xC7,
            IST_W_DEVICE_2_MOVING_TORQUE: 0xC9,
            IST_W_DEVICE_3_MOVING_TORQUE: 0xCB,
            IST_R_DEVICE_ALL_PRESENT_POSITION: 0xCC,
            IST_R_DEVICE_1_PRESENT_POSITION: 0xCD,
            IST_R_DEVICE_2_PRESENT_POSITION: 0xCE,
            IST_R_DEVICE_3_PRESENT_POSITION: 0xCF,
        };
        this.modes = {
            READY: 1,
            DEMO: 2,
            USB: 3,
            ENTRY: 5,
            BLE: 7,
        };
        this.xylobotDatas = {
            positionNow: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },
            positionC: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },
            positionD: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },
            positionE: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },
            positionF: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },
            positionG: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },
            positionA: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },
            positionB: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },
            positionHighC: {
                aixs1: null,
                aixs2: null,
                aixs3: null,
            },            
        };
        this.array = {
            SET_ZERO: 0,
            GET_NOW_AIXS: 1,
            GET_NOTE_AIXS: 2,
            SET_LED_MOVEMENT: 3,
            SET_LED_COLOR: 4,
            SET_LED_RGB: 5,
            SET_TORQUE_TOGGLE: 6,
            SET_POSITION_SINGLE: 7,
            SET_POSITION_MANY: 8,
            SET_SPEED: 9,
            SET_TORQUE: 10,
            SET_PLAY_NOTE: 11,
            SET_MOVE_NOTE: 12,
            SET_MOVE_DEFAULT: 13,
        };
    }

    // 초기 설정
    init(handler, config) {
        var array = this.array;

        this.sendBuffer[array.SET_ZERO] = new Buffer(10);
        this.sendBuffer[array.GET_NOW_AIXS] = new Buffer(10);
        this.sendBuffer[array.GET_NOTE_AIXS] = new Buffer(10);
        this.sendBuffer[array.SET_LED_MOVEMENT] = new Buffer(10);
        this.sendBuffer[array.SET_LED_COLOR] = new Buffer(10);
        this.sendBuffer[array.SET_LED_RGB] = new Buffer(10);
        this.sendBuffer[array.SET_TORQUE_TOGGLE] = new Buffer(10);
        this.sendBuffer[array.SET_POSITION_SINGLE] = new Buffer(10);
        this.sendBuffer[array.SET_POSITION_MANY] = new Buffer(10);
        this.sendBuffer[array.SET_SPEED] = new Buffer(10);
        this.sendBuffer[array.SET_TORQUE] = new Buffer(10);
        this.sendBuffer[array.SET_PLAY_NOTE] = new Buffer(10);
        this.sendBuffer[array.SET_MOVE_NOTE] = new Buffer(10);
        this.sendBuffer[array.SET_MOVE_DEFAULT] = new Buffer(10);
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    // 연결 후 초기에 송신할 데이터가 필요한 경우
    requestInitialData() {
        var buffer;

        var buffer_1 = this.Xy_Write_OperationMode(this.modes.ENTRY);        
        var buffer_2 = this.Xy_Write_DeviceAll_TorqueEnable(0, 0, 0);

        buffer = Buffer.concat([buffer_1, buffer_2]);

        return buffer;
    }

    // 연결 후 초기에 수신받아서 정상연결인지 확인해야 하는 경우
    checkInitialData(data, config) {
        return true;
    }

    // 하드웨어에서 받은 데이터의 검증이 필요한 경우
    validateLocalData(data) {
        return true;
    }

    // 하드웨어에서 온 데이터 처리 로직
    handleLocalData(data) {
        var protocols = this.protocols;
        var checkSum = 0;
        var data1 = 0;
        var data2 = 0;
        var data3 = 0;
        if(data.length == 10)
        {
            if (data[0] == protocols.HEADER_1 && data[1] == protocols.HEADER_2)
            {
                checkSum = (data[0] + data[1] + data[2] + data[3] + data[4] + data[5] + data[6] + data[7] + data[8]) & 0xFF;

                if(data[9] == checkSum)
                {
                	data1 = (data[3] << 8) | data[4];
                	data2 = (data[5] << 8) | data[6];
                	data3 = (data[7] << 8) | data[8];
                    switch(data[2])
                    {
                        // 통신 유지용이므로 사용 안함.
                        //case protocols.IST_R_OPERATION_MODE:
                        //    break;
                        case protocols.IST_R_positionC:
                            this.xylobotDatas.positionC.aixs1 = data1;
                            this.xylobotDatas.positionC.aixs2 = data2;
                            this.xylobotDatas.positionC.aixs3 = data3;
                            break;
                        case protocols.IST_R_positionD:
                            this.xylobotDatas.positionD.aixs1 = data1;
                            this.xylobotDatas.positionD.aixs2 = data2;
                            this.xylobotDatas.positionD.aixs3 = data3;
                            break;
                        case protocols.IST_R_positionE:
                            this.xylobotDatas.positionE.aixs1 = data1;
                            this.xylobotDatas.positionE.aixs2 = data2;
                            this.xylobotDatas.positionE.aixs3 = data3;
                            break;
                        case protocols.IST_R_positionF:
                            this.xylobotDatas.positionF.aixs1 = data1;
                            this.xylobotDatas.positionF.aixs2 = data2;
                            this.xylobotDatas.positionF.aixs3 = data3;
                            break;
                        case protocols.IST_R_positionG:
                            this.xylobotDatas.positionG.aixs1 = data1;
                            this.xylobotDatas.positionG.aixs2 = data2;
                            this.xylobotDatas.positionG.aixs3 = data3;
                            break;
                        case protocols.IST_R_positionA:
                            this.xylobotDatas.positionA.aixs1 = data1;
                            this.xylobotDatas.positionA.aixs2 = data2;
                            this.xylobotDatas.positionA.aixs3 = data3;
                            break;
                        case protocols.IST_R_positionB:
                            this.xylobotDatas.positionB.aixs1 = data1;
                            this.xylobotDatas.positionB.aixs2 = data2;
                            this.xylobotDatas.positionB.aixs3 = data3;
                            break;
                        case protocols.IST_R_positionHighC:
                            this.xylobotDatas.positionHighC.aixs1 = data1;
                            this.xylobotDatas.positionHighC.aixs2 = data2;
                            this.xylobotDatas.positionHighC.aixs3 = data3;
                            break;
                        case protocols.IST_R_DEVICE_ALL_PRESENT_POSITION:
                            if(data1 != 0xFFFE) this.xylobotDatas.positionNow.aixs1 = data1;
                            if(data2 != 0xFFFE) this.xylobotDatas.positionNow.aixs2 = data2;
                            if(data3 != 0xFFFE) this.xylobotDatas.positionNow.aixs3 = data3;
                            break;
                        case protocols.IST_R_DEVICE_1_PRESENT_POSITION:
                            this.xylobotDatas.positionNow.aixs1 = data1;
                            break;
                        case protocols.IST_R_DEVICE_2_PRESENT_POSITION:
                            this.xylobotDatas.positionNow.aixs2 = data1;
                            break;
                        case protocols.IST_R_DEVICE_3_PRESENT_POSITION:
                            this.xylobotDatas.positionNow.aixs3 = data1;
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        for(var key in this.xylobotDatas)
        {
            handler.write(key, this.xylobotDatas[key]); 
        }
    }

    // 엔트리에서 받은 데이터 처리
    handleRemoteData(handler) {
        var getData = new Array(14);
        var receiveHandler = handler.read('SEND');
        var array = this.array;
        var checkTime = this.checkTime;
        var address = this.address;

        getData[array.SET_ZERO] = receiveHandler[array.SET_ZERO];
        getData[array.GET_NOW_AIXS] = receiveHandler[array.GET_NOW_AIXS];
        getData[array.GET_NOTE_AIXS] = receiveHandler[array.GET_NOTE_AIXS];
        getData[array.SET_LED_MOVEMENT] = receiveHandler[array.SET_LED_MOVEMENT];
        getData[array.SET_LED_COLOR] = receiveHandler[array.SET_LED_COLOR];
        getData[array.SET_LED_RGB] = receiveHandler[array.SET_LED_RGB];
        getData[array.SET_TORQUE_TOGGLE] = receiveHandler[array.SET_TORQUE_TOGGLE];
        getData[array.SET_POSITION_SINGLE] = receiveHandler[array.SET_POSITION_SINGLE];
        getData[array.SET_POSITION_MANY] = receiveHandler[array.SET_POSITION_MANY];
        getData[array.SET_SPEED] = receiveHandler[array.SET_SPEED];            
        getData[array.SET_TORQUE] = receiveHandler[array.SET_TORQUE];
        getData[array.SET_PLAY_NOTE] = receiveHandler[array.SET_PLAY_NOTE];
        getData[array.SET_MOVE_NOTE] = receiveHandler[array.SET_MOVE_NOTE];
        getData[array.SET_MOVE_DEFAULT] = receiveHandler[array.SET_MOVE_DEFAULT];
        
        if(getData[array.SET_ZERO])
        {
            checkTime = getData[array.SET_ZERO].Time;
            address = array.SET_ZERO;
            this.reset();
        }
        if(getData[array.GET_NOW_AIXS])
        {
            var aixs = getData[array.GET_NOW_AIXS].Axis;
            checkTime = getData[array.GET_NOW_AIXS].Time;
            address = array.GET_NOW_AIXS;
            // 미리 저장된 값을 읽기 위해 패킷 생성을 주석 처리함 -> 하드웨어로 패킷을 전송하지 않음.
            //switch(aixs)
            //{
            //    case 0: this.sendBuffer[array.GET_NOW_AIXS] = this.Xy_Read_Device1_PresentPosition(); break;
            //    case 1: this.sendBuffer[array.GET_NOW_AIXS] = this.Xy_Read_Device2_PresentPosition(); break;
            //    case 2: this.sendBuffer[array.GET_NOW_AIXS] = this.Xy_Read_Device3_PresentPosition(); break;
            //    default: break;
            //}
        }
        if(getData[array.GET_NOTE_AIXS])
        {
            var note = getData[array.GET_NOTE_AIXS].Note;
            checkTime = getData[array.GET_NOTE_AIXS].Time;
            address = array.GET_NOTE_AIXS;
            // 미리 저장된 값을 읽기 위해 패킷 생성을 주석 처리함 -> 하드웨어로 패킷을 전송하지 않음.
            //switch(note)
            //{
            //    case 0: break;
            //    case 1: this.sendBuffer[array.GET_NOTE_AIXS] = this.Xy_Read_PositionC(); break;
            //    case 2: this.sendBuffer[array.GET_NOTE_AIXS] = this.Xy_Read_PositionD(); break;
            //    case 3: this.sendBuffer[array.GET_NOTE_AIXS] = this.Xy_Read_PositionE(); break;
            //    case 4: this.sendBuffer[array.GET_NOTE_AIXS] = this.Xy_Read_PositionF(); break;
            //    case 5: this.sendBuffer[array.GET_NOTE_AIXS] = this.Xy_Read_PositionG(); break;
            //    case 6: this.sendBuffer[array.GET_NOTE_AIXS] = this.Xy_Read_PositionA(); break;
            //    case 7: this.sendBuffer[array.GET_NOTE_AIXS] = this.Xy_Read_PositionB(); break;
            //    case 8: this.sendBuffer[array.GET_NOTE_AIXS] = this.Xy_Read_PositionHighC(); break;
            //    default: break;
            //}
        }
        if(getData[array.SET_LED_MOVEMENT])
        {
            var mode = getData[array.SET_LED_MOVEMENT].Movement;
            checkTime = getData[array.SET_LED_MOVEMENT].Time;
            address = array.SET_LED_MOVEMENT;
            this.sendBuffer[array.SET_LED_MOVEMENT] = this.xy_Write_LEDMovenet(mode);
        }
        if(getData[array.SET_LED_COLOR])
        {
            var color = getData[array.SET_LED_COLOR].Color;
            checkTime = getData[array.SET_LED_COLOR].Time;
            address = array.SET_LED_COLOR;
            this.sendBuffer[array.SET_LED_COLOR] = this.Xy_Write_LEDControlColor(color);
        }
        if(getData[array.SET_LED_RGB])
        {
            var red = getData[array.SET_LED_RGB].Red;
            var green = getData[array.SET_LED_RGB].Green;
            var blue = getData[array.SET_LED_RGB].Blue;
            checkTime = getData[array.SET_LED_RGB].Time;
            address = array.SET_LED_RGB;
            this.sendBuffer[array.SET_LED_RGB] = this.Xy_Write_LEDControlRGB(red, green, blue);
        }
        if(getData[array.SET_TORQUE_TOGGLE])
        {
            var aixs = getData[array.SET_TORQUE_TOGGLE].Axis
            var toggle = getData[array.SET_TORQUE_TOGGLE].Toggle;
            checkTime = getData[array.SET_TORQUE_TOGGLE].Time;
            address = array.SET_TORQUE_TOGGLE;
            switch(aixs)
            {
                case 0: this.sendBuffer[array.SET_TORQUE_TOGGLE] = this.Xy_Write_Device1_TorqueEnable(toggle); break;
                case 1: this.sendBuffer[array.SET_TORQUE_TOGGLE] = this.Xy_Write_Device2_TorqueEnable(toggle); break;
                case 2: this.sendBuffer[array.SET_TORQUE_TOGGLE] = this.Xy_Write_Device3_TorqueEnable(toggle); break;
                case 3: this.sendBuffer[array.SET_TORQUE_TOGGLE] = this.Xy_Write_DeviceAll_TorqueEnable(toggle); break;
                default: break;
            }
        }
        if(getData[array.SET_POSITION_SINGLE])
        {
            var aixs = getData[array.SET_POSITION_SINGLE].Axis;
            var position = getData[array.SET_POSITION_SINGLE].Position;
            checkTime = getData[array.SET_POSITION_SINGLE].Time;
            address = array.SET_POSITION_SINGLE;
            switch(aixs)
            {
                case 0: this.sendBuffer[array.SET_POSITION_SINGLE] = this.Xy_Write_Device1_TargetPosition(position); break;
                case 1: this.sendBuffer[array.SET_POSITION_SINGLE] = this.Xy_Write_Device2_TargetPosition(position); break;
                case 2: this.sendBuffer[array.SET_POSITION_SINGLE] = this.Xy_Write_Device3_TargetPosition(position); break;
                default: break;
            }
        }
        if(getData[array.SET_POSITION_MANY])
        {
            var position1 = getData[array.SET_POSITION_MANY].Position1;
            var position2 = getData[array.SET_POSITION_MANY].Position2;
            var position3 = getData[array.SET_POSITION_MANY].Position3;
            checkTime = getData[array.SET_POSITION_MANY].Time;
            address = array.SET_POSITION_MANY;
            this.sendBuffer[array.SET_POSITION_MANY] = this.Xy_Write_DeviceAll_TargetPosition(position1, position2, position3);
        }
        if(getData[array.SET_SPEED])
        {
            var axis = getData[array.SET_SPEED].Axis;
            var speed = getData[array.SET_SPEED].Speed;
            checkTime = getData[array.SET_SPEED].Time;
            address = array.SET_SPEED;
            switch(axis)
            {
                case 0: this.sendBuffer[array.SET_SPEED] = this.Xy_Write_Device1_MovingSpeed(speed); break;
                case 1: this.sendBuffer[array.SET_SPEED] = this.Xy_Write_Device2_MovingSpeed(speed); break;
                case 2: this.sendBuffer[array.SET_SPEED] = this.Xy_Write_Device3_MovingSpeed(speed); break;
                case 3: this.sendBuffer[array.SET_SPEED] = this.Xy_Write_DeviceAll_MovingSpeed(speed); break;
                default: break;
            }
        }
        if(getData[array.SET_TORQUE])
        {
        	var axis = getData[array.SET_TORQUE].Axis;
            var torque = getData[array.SET_TORQUE].Torque;
            checkTime = getData[array.SET_TORQUE].Time;
            address = array.SET_TORQUE;
            switch(axis)
            {
                case 0: this.sendBuffer[array.SET_TORQUE] = this.Xy_Write_Device1_MovingTorque(torque); break;
                case 1: this.sendBuffer[array.SET_TORQUE] = this.Xy_Write_Device2_MovingTorque(torque); break;
                case 2: this.sendBuffer[array.SET_TORQUE] = this.Xy_Write_Device3_MovingTorque(torque); break;
                case 3: this.sendBuffer[array.SET_TORQUE] = this.Xy_Write_DeviceAll_MovingTorque(torque); break;
                default: break;
            }
        }
        if(getData[array.SET_PLAY_NOTE])
        {
            var note = getData[array.SET_PLAY_NOTE].Note;
            checkTime = getData[array.SET_PLAY_NOTE].Time;
            address = array.SET_PLAY_NOTE;
            this.sendBuffer[array.SET_PLAY_NOTE] = this.Xy_Write_PlayNote(note);
        }
        if(getData[array.SET_MOVE_NOTE])
        {
            var note = getData[array.SET_MOVE_NOTE].Note;
            var location = getData[array.SET_MOVE_NOTE].Location;
            checkTime = getData[array.SET_MOVE_NOTE].Time;
            address = array.SET_MOVE_NOTE;
            switch(location)
            {
                case 0: this.sendBuffer[array.SET_MOVE_NOTE] = this.Xy_Write_PlayNoteReadyPosition(note); break;
                case 1: this.sendBuffer[array.SET_MOVE_NOTE] = this.Xy_Write_PlayNoteTargetPosition(note); break;
                default: break;
            }
        }
        if(getData[array.SET_MOVE_DEFAULT])
        {
            checkTime = getData[array.SET_MOVE_DEFAULT].Time;
            address = array.SET_MOVE_DEFAULT;
            this.sendBuffer[array.SET_MOVE_DEFAULT] = this.Xy_Write_DeviceAll_TargetPosition(512, 512, 512);
        }

        this.checkTime = checkTime;
        this.address = address;
    }

    // 하드웨어로 보낼 데이터 로직
    requestLocalData() {
        var sendToHardware = new Buffer(10);
        var lastTime = this.lastTime;
        var currentTime = this.checkTime;
        var address = this.address;

        if(address != this.array.GET_NOW_AIXS || address != this.array.GET_NOTE_AIXS || address != this.array.SET_ZERO)
        {            
            if(lastTime != currentTime && this.sendBuffer[address].length > 0)
            {               
                sendToHardware = this.sendBuffer[address];
                this.lastTime = currentTime;

                this.sendBuffer[address] = [];
                return sendToHardware;
            }
        }

        // 초기화 완료 전 데이터 요청
        this.sendCounter++;
        if(this.sendCounter > 90) this.sendCounter = 90;

        if(0 < this.sendCounter && this.sendCounter <= 10)
        {
        	if(this.xylobotDatas.positionC.aixs1 == null
        		|| this.xylobotDatas.positionC.aixs2 == null 
        		|| this.xylobotDatas.positionC.aixs3 == null)
        	{
        		return this.Xy_Read_PositionC();
        	}
        }
        else if(10 < this.sendCounter && this.sendCounter <= 20)
        {
        	if(this.xylobotDatas.positionD.aixs1 == null
        		|| this.xylobotDatas.positionD.aixs2 == null 
        		|| this.xylobotDatas.positionD.aixs3 == null)
        	{
        		return this.Xy_Read_PositionD();
        	}
        }        
        else if(20 < this.sendCounter && this.sendCounter <= 30)
        {
        	if(this.xylobotDatas.positionE.aixs1 == null
        		|| this.xylobotDatas.positionE.aixs2 == null 
        		|| this.xylobotDatas.positionE.aixs3 == null)
        	{
        		return this.Xy_Read_PositionE();
        	}
        }
        else if(30 < this.sendCounter && this.sendCounter <= 40)
        {
        	if(this.xylobotDatas.positionF.aixs1 == null
        		|| this.xylobotDatas.positionF.aixs2 == null 
        		|| this.xylobotDatas.positionF.aixs3 == null)
        	{
        		return this.Xy_Read_PositionF();
        	}
        }
        else if(40 < this.sendCounter && this.sendCounter <= 50)
        {
        	if(this.xylobotDatas.positionG.aixs1 == null
        		|| this.xylobotDatas.positionG.aixs2 == null 
        		|| this.xylobotDatas.positionG.aixs3 == null)
        	{
        		return this.Xy_Read_PositionG();
        	}
        }
        else if(50 < this.sendCounter && this.sendCounter <= 60)
        {
        	if(this.xylobotDatas.positionA.aixs1 == null
        		|| this.xylobotDatas.positionA.aixs2 == null 
        		|| this.xylobotDatas.positionA.aixs3 == null)
        	{
        		return this.Xy_Read_PositionA();
        	}
        }
        else if(60 < this.sendCounter && this.sendCounter <= 70)
        {
        	if(this.xylobotDatas.positionB.aixs1 == null
        		|| this.xylobotDatas.positionB.aixs2 == null 
        		|| this.xylobotDatas.positionB.aixs3 == null)
        	{
        		return this.Xy_Read_PositionB();
        	}
        }
        else if(70 < this.sendCounter && this.sendCounter <= 80)
        {
        	if(this.xylobotDatas.positionHighC.aixs1 == null
        		|| this.xylobotDatas.positionHighC.aixs2 == null 
        		|| this.xylobotDatas.positionHighC.aixs3 == null)
        	{
        		return this.Xy_Read_PositionHighC();
        	}
        }
        // 초기화 완료 후 데이터 요청
        else if(this.sendCounter == 90)
        {
            return this.Xy_Read_DeviceAll_PresentPosition();
        }
    }

    connect() {

    }

    // 하드웨어 연결 해제 시 호출
    disconnect(connect) {
        var self = this;

        connect.close();
        if(self.sp) 
        {
            delete self.sp;
        }
    }

    // 엔트라와의 연결 종료 후 처리 코드
    reset() {
        this.checkTime = null;
        this.lastTime = null;
        this.address = null;
        this.sendCounter = 90;

        for(var i = 0; i < 14; i++)
        {
            this.sendBuffer[i] = [];
        }        
    }

    Xy_MakePacket(instruction)
    {
        var packet = new Buffer(10);

        packet[0] = this.protocols.HEADER_1;
        packet[1] = this.protocols.HEADER_2;
        packet[2] = instruction;
        packet[3] = 0;
        packet[4] = 0;
        packet[5] = 0;
        packet[6] = 0;
        packet[7] = 0;
        packet[8] = 0;
        packet[9] = (packet[0] + packet[1] + packet[2] + packet[3]
            + packet[4] + packet[5] + packet[6] + packet[7] + packet[8]) & 0xFF;

        return packet;
    }


    Xy_MakePacket(instruction, data1)
    {
        var packet = new Buffer(10);

        packet[0] = this.protocols.HEADER_1;
        packet[1] = this.protocols.HEADER_2;
        packet[2] = instruction;
        packet[3] = (data1 >> 8) & 0xFF;
        packet[4] = data1 & 0xFF;
        packet[5] = 0;
        packet[6] = 0;
        packet[7] = 0;
        packet[8] = 0;
        packet[9] = (packet[0] + packet[1] + packet[2] + packet[3]
            + packet[4] + packet[5] + packet[6] + packet[7] + packet[8]) & 0xFF;

        return packet;
    }

    Xy_MakePacket(instruction, data1, data2, data3)
    {
        var packet = new Buffer(10);

        packet[0] = this.protocols.HEADER_1;
        packet[1] = this.protocols.HEADER_2;
        packet[2] = instruction;
        packet[3] = (data1 >> 8) & 0xFF;
        packet[4] = data1 & 0xFF;
        packet[5] = (data2 >> 8) & 0xFF;
        packet[6] = data2 & 0xFF;
        packet[7] = (data3 >> 8) & 0xFF;
        packet[8] = data3 & 0xFF;
        packet[9] = (packet[0] + packet[1] + packet[2] + packet[3]
            + packet[4] + packet[5] + packet[6] + packet[7] + packet[8]) & 0xFF;

        return packet;
    }

    Xy_Read_PositionC()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_positionC);
    }

    Xy_Read_PositionD()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_positionD);
    }

    Xy_Read_PositionE()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_positionE);
    }

    Xy_Read_PositionF()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_positionF);
    }

    Xy_Read_PositionG()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_positionG);
    }

    Xy_Read_PositionA()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_positionA);
    }

    Xy_Read_PositionB()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_positionB);
    }

    Xy_Read_PositionHighC()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_positionHighC);
    }

    Xy_Write_OperationMode(mode)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_OPERATION_MODE, mode);
    }

    Xy_Write_LEDControlRGB(red, green, blue)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_LED_CONTROL_RGB, red, green, blue);
    }

    Xy_Write_LEDControlColor(color)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_LED_CONTROL_COLOR, color);
    }

    xy_Write_LEDMovenet(movement)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_LED_CONTROL_MOVEMENT, movement);
    }

    Xy_Write_PlayNote(note)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_PLAY_NOTE, note);
    }

    Xy_Write_PlayNoteReadyPosition(note)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_PLAY_NOTE_READY_POSITION, note);
    }

    Xy_Write_PlayNoteTargetPosition(note)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_PLAY_NOTE_TARGET_POSITION, note);
    }

    Xy_Write_DeviceAll_TorqueEnable(enable)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_ALL_TORQUE_ENABLE, enable, enable, enable);
    }

    Xy_Write_Device1_TorqueEnable(enable)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_1_TORQUE_ENABLE, enable);
    }

    Xy_Write_Device2_TorqueEnable(enable)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_2_TORQUE_ENABLE, enable);
    }

    Xy_Write_Device3_TorqueEnable(enable)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_3_TORQUE_ENABLE, enable);
    }

    Xy_Write_DeviceAll_TargetPosition(position1, position2, position3)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_ALL_TARGET_POSITION, position1, position2, position3);
    }

    Xy_Write_Device1_TargetPosition(position)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_1_TARGET_POSITION, position);
    }

    Xy_Write_Device2_TargetPosition(position)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_2_TARGET_POSITION, position);
    }

    Xy_Write_Device3_TargetPosition(position)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_3_TARGET_POSITION, position);
    }

    Xy_Write_DeviceAll_MovingSpeed(speed)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_ALL_MOVING_SPEEED, speed, speed, speed);
    }

    Xy_Write_Device1_MovingSpeed(speed)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_1_MOVING_SPEED, speed);
    }

    Xy_Write_Device2_MovingSpeed(speed)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_2_MOVING_SPEED, speed);
    }

    Xy_Write_Device3_MovingSpeed(speed)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_3_MOVING_SPEED, speed);
    }

    Xy_Write_DeviceAll_MovingTorque(torque)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_ALL_MOVING_TORQUE, torque, torque, torque);
    }

    Xy_Write_Device1_MovingTorque(torque)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_1_MOVING_TORQUE, torque);
    }

    Xy_Write_Device2_MovingTorque(torque)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_2_MOVING_TORQUE, torque);
    }

    Xy_Write_Device3_MovingTorque(torque)
    {
        return this.Xy_MakePacket(this.protocols.IST_W_DEVICE_3_MOVING_TORQUE, torque);
    }

    Xy_Read_DeviceAll_PresentPosition()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_DEVICE_ALL_PRESENT_POSITION);
    }

    Xy_Read_Device1_PresentPosition()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_DEVICE_1_PRESENT_POSITION);
    }

    Xy_Read_Device2_PresentPosition()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_DEVICE_2_PRESENT_POSITION);
    }

    Xy_Read_Device3_PresentPosition()
    {
        return this.Xy_MakePacket(this.protocols.IST_R_DEVICE_3_PRESENT_POSITION);
    }
}

module.exports = new hyact_xylobot();
