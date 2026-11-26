const BaseModule = require('./baseModule');

class magkinder extends BaseModule
{
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();

        this.sp = null;
        this.currentTime = null;
        this.lastTime = null;
        this.address = null;
        this.sendCounter = 0;
        this.leftWheelSpeed = 0;
        this.rightWheelSpeed = 0;

        this.transmitBuffer = new Array(10);
        this.Protocols = {
            Header: 0xEE,
            Dummy: 0xFF,
            Check1: 0xE0,
            Check2: 0xFD,
            Check3: 0xFE,
            Check4: 0xFE,

            DataLength: 0x07,
        };
        this.Index = {
            TransmitMotion: 0x05,
            TransmitWheelSpeed: 0x07,
            TransmitSoundFace: 0x0B,
            TransmitSensing: 0x0D,
            TransmitModeSetting: 0x0F,

            ReceivedSensing: 0x0E,
        };
        this.Array = {
            AutoSensing: 0,
            Stop: 1,
            Move: 2,
            Turn: 3,
            WheelSpeed: 4,
            LED: 5,
            Volume: 6,
            Speak: 7,
            Scale: 8,
            Mode: 9,
        };
        this.Motion = {
            MoveForwad: 0,
            MoveBackwards: 1,
            TurnLeft: 2,
            TurnRight: 3,
            Stop: 4,
        };
        this.Sensing = {
            Auto: 0,
            AllSensor: 1,
            BottmSensor: 2,
            CardSensor: 3,
            FrontSensor: 4,
            BettrySensor: 5,

            Stop: 0,
            Run: 1,
        };
        this.ModeSetting = {
            Coding: 0,
            Line: 1,
            GestureFollow: 2,
            HandFollow: 3,
            Avoid: 4,
            GestureCoding: 5,
            CardCoding: 6,
        };
        this.WheelType = {
            Left: 0,
            Right: 1,
            Both: 2,
        }
        this.sensorData = {
            bottom: {
                leftSide: null,
                left: null,
                right: null,
                rightSide: null
            },
            card: {
                front: null,
                left: null,
                right: null
            },
            front: {
                left: null,
                right: null
            },
            bettery: null,
        };
    }

    //최초에 커넥션이 이루어진 후의 초기 설정.
    //handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    //config 은 module.json 오브젝트입니다.
    init(handler, config) {
        this.transmitBuffer[this.Array.AutoSensing] = new Buffer(11);
        this.transmitBuffer[this.Array.Stop] = new Buffer(11);
        this.transmitBuffer[this.Array.Move] = new Buffer(11);
        this.transmitBuffer[this.Array.Turn] = new Buffer(11);
        this.transmitBuffer[this.Array.WheelSpeed] = new Buffer(11);
        this.transmitBuffer[this.Array.LED] = new Buffer(11);
        this.transmitBuffer[this.Array.Volume] = new Buffer(11);
        this.transmitBuffer[this.Array.Sound] = new Buffer(11);
        this.transmitBuffer[this.Array.Note] = new Buffer(11);
        this.transmitBuffer[this.Array.Mode] = new Buffer(11);
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    //연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    //requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    //이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    requestInitialData() {
        var buffer = this.MakePacket(this.Index.TransmitSensing, this.Sensing.Auto, this.Sensing.Run, this.Protocols.Dummy, this.Protocols.Dummy);

        return buffer;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        return true;
    }

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        if (data.length == this.Protocols.DataLength)
        {
            if (data[0] == this.Protocols.Header && data[6] == this.Protocols.Check1)
            {
                if (data[1] == this.Index.ReceivedSensing)
                {
                    this.sensorData.bottom.leftSide = data[2] & 0x03;
                    this.sensorData.bottom.left = (data[2] >> 2) & 0x03;
                    this.sensorData.bottom.right = (data[2] >> 4) & 0x03;
                    this.sensorData.bottom.rightSide = (data[2] >> 6) & 0x03;

                    this.sensorData.card.front = data[3] & 0x03;
                    this.sensorData.card.right = (data[3] >> 2) & 0x03;
                    this.sensorData.card.left = (data[3] >> 4) & 0x03;

                    this.sensorData.front.left = data[4] & 0x0F;
                    this.sensorData.front.right = (data[4] >> 4) & 0x0F;

                    this.sensorData.bettery = data[5] & 0xFF;
                }
            }
        }
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        for(var key in this.sensorData)
        {
            handler.write(key, this.sensorData[key]);
        }
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        var receivedData = handler.read('TRANSMIT');

        if(receivedData[this.Array.AutoSensing])
        {
            var toggle = receivedData[this.Array.AutoSensing].Toggle;

            this.currentTime = receivedData[this.Array.AutoSensing].Time;
            this.address = this.Array.AutoSensing;
            this.transmitBuffer[this.Array.AutoSensing] = this.MakePacket(this.Index.TransmitSensing, this.Sensing.Auto, toggle, this.Protocols.Dummy, this.Protocols.Dummy);
        }
        if(receivedData[this.Array.Stop])
        {
            this.currentTime = receivedData[this.Array.Stop].Time;
            this.address = this.Array.Stop;
            this.transmitBuffer[this.Array.Stop] = this.MakePacket(this.Index.TransmitMotion, this.Motion.Stop, 0, 0, 0);
        }
        if(receivedData[this.Array.Move])
        {
            var direction = receivedData[this.Array.Move].Direction;
            var distance = receivedData[this.Array.Move].Distance;

            this.currentTime = receivedData[this.Array.Move].Time;
            this.address = this.Array.Move;
            this.transmitBuffer[this.Array.Move] = this.MakePacket(this.Index.TransmitMotion, direction, distance & 0xFF, (distance >> 8) & 0xFF, 3);
        }
        if(receivedData[this.Array.Turn])
        {
            var direction = receivedData[this.Array.Turn].Direction;
            var angle = receivedData[this.Array.Turn].Angle;

            this.currentTime = receivedData[this.Array.Turn].Time;
            this.address = this.Array.Turn;
            this.transmitBuffer[this.Array.Turn] = this.MakePacket(this.Index.TransmitMotion, direction, angle & 0xFF, (angle >> 8) & 0xFF, 3);
        }
        if(receivedData[this.Array.WheelSpeed])
        {
            var wheel = receivedData[this.Array.WheelSpeed].Wheel;
            var speed = receivedData[this.Array.WheelSpeed].Speed;

            this.currentTime = receivedData[this.Array.WheelSpeed].Time;
            this.address = this.Array.WheelSpeed;

            if(wheel == this.WheelType.Left)
            {
                this.leftWheelSpeed = speed;
            }
            else if(wheel == this.WheelType.Right)
            {
                this.rightWheelSpeed = speed;
            }
            else if(wheel == this.WheelType.Both)
            {
                this.leftWheelSpeed = speed;
                this.rightWheelSpeed = speed;
            }

            this.transmitBuffer[this.Array.WheelSpeed] = this.MakePacket(this.Index.TransmitWheelSpeed, this.leftWheelSpeed & 0xFF, (this.leftWheelSpeed >> 8) & 0xFF, this.rightWheelSpeed & 0xFF, (this.rightWheelSpeed >> 8) & 0xFF);
        }
        if(receivedData[this.Array.LED])
        {
            var color = receivedData[this.Array.LED].Color;

            this.currentTime = receivedData[this.Array.LED].Time;
            this.address = this.Array.LED;
            this.transmitBuffer[this.Array.LED] = this.MakePacket(this.Index.TransmitSoundFace, this.Protocols.Dummy, this.Protocols.Dummy, color, this.Protocols.Dummy);
        }
        if(receivedData[this.Array.Volume])
        {
            var volume = receivedData[this.Array.Volume].Volume;

            this.currentTime = receivedData[this.Array.Volume].Time;
            this.address = this.Array.Volume;
            this.transmitBuffer[this.Array.Volume] = this.MakePacket(this.Index.TransmitSoundFace, this.Protocols.Dummy, this.Protocols.Dummy, this.Protocols.Dummy, volume);
        }
        if(receivedData[this.Array.Speak])
        {
            var speak = receivedData[this.Array.Speak].Speak;

            this.currentTime = receivedData[this.Array.Speak].Time;
            this.address = this.Array.Speak;
            this.transmitBuffer[this.Array.Speak] = this.MakePacket(this.Index.TransmitSoundFace, this.Protocols.Dummy, speak, this.Protocols.Dummy, this.Protocols.Dummy);
        }
        if(receivedData[this.Array.Scale])
        {
        	var scale = receivedData[this.Array.Scale].Scale;

            this.currentTime = receivedData[this.Array.Scale].Time;
            this.address = this.Array.Scale;
            this.transmitBuffer[this.Array.Scale] = this.MakePacket(this.Index.TransmitSoundFace, this.Protocols.Dummy, scale, this.Protocols.Dummy, this.Protocols.Dummy);
        }
        if(receivedData[this.Array.Mode])
        {
            var mode = receivedData[this.Array.Mode].Mode;

            this.currentTime = receivedData[this.Array.Mode].Time;
            this.address = this.Array.Mode;
            this.transmitBuffer[this.Array.Mode] = this.MakePacket(this.Index.TransmitModeSetting, mode, 0, 0, 0);
        }
    }

    // 하드웨어로 보낼 데이터 로직
    //slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냄
    requestLocalData() {
        var transmitPacket = new Buffer(11);

        if(this.lastTime != this.currentTime && this.transmitBuffer[this.address].length > 0)
        {
            transmitPacket = this.transmitBuffer[this.address];
            this.transmitBuffer[this.address] = [];
            this.lastTime = this.currentTime;

            return transmitPacket;
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

    // 엔트리와의 연결 종료 후 처리 코드
    reset() {

    }

    MakePacket(index, parameter1, parameter2, parameter3, parameter4) {
        var buffer = new Buffer(11);

        buffer[0] = this.Protocols.Header;
        buffer[1] = index;
        buffer[2] = parameter1;
        buffer[3] = parameter2;
        buffer[4] = parameter3;
        buffer[5] = parameter4;
        buffer[6] = this.Protocols.Check1;
        buffer[7] = this.Protocols.DataLength;
        buffer[8] = this.Protocols.Check2;
        buffer[9] = this.Protocols.Check3;
        buffer[10] = this.Protocols.Check4;

        return buffer;
    }
}

module.exports = new magkinder();
