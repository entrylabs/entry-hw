const PingpongBase = require('./pingpong_base');

class PingpongG1 extends PingpongBase {
    constructor() {
        super();

        this.readValue = {};
        this.send_cmd = {};
        this.cmd_seq = 0;

        this.isDraing = false;
        this.sendBuffer = [];

        this.sp = null;
        this.isCubeConnecting = false;
        this.isCheckConnecting = false;
        this.isConnected = false;
        this.useNotification = false;

        this._sensorData = {
            MOVE_X: 0,
            MOVE_Y: 0,
            MOVE_Z: 0,
            TILT_X: 0,
            TILT_Y: 0,
            TILT_Z: 0,
            BUTTON: 0,
            PROXIMITY: 0,
            AIN: 0,
        };

        this._buttons = {
            C1Button: 0,
        };

        console.log('PINGPONG: constructor');
    }

    makePackets(method, grpid = 0) {
        //console.log('..make_packet: ' + method);

        // CUBE_ID[0:3] / ASSIGNED_ID[4:5] / OPCODE[6] / SIZE[7:8] / OPT[9..11]
        // virtual

        let result = null;
        if (method === 'connect') {
            result = Buffer.from([
                0xdd,
                0xdd,
                grpid,
                0x00,
                0x00,
                0x00,
                0xda,
                0x00,
                0x0b,
                0x00,
                0x00,
            ]);
            //result[2] = this.groupId;
        } else if (method === 'disconnect') {
            result = Buffer.from([0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0xa8, 0x00, 0x0a, 0x01]);
            //result = Buffer.from('ffffffff0000a8000a01', 'hex');
        } else if (method === 'checkdongle') {
            result = Buffer.from([
                0xdd, 0xdd, 0xdd, 0xdd, 0x00, 0x01, 0xda, 0x00, 0x0b, 0x00, 0x0d,
            ]);
        } else if (method === 'setColorLed') {
            result = Buffer.from('ffff00070000ce000e0200000750', 'hex');
        } else if (method === 'getSensorData') {
            result = Buffer.from([
                0xff, 0xff, 0xff, 0xff, 0x00, 0xc8 /* continuous sampling*/, 0xb8, 0x00, 0x0b, 20,
                0x01,
            ]);
        } else if (method === 'dongleReset') {
            result = Buffer.from([
                0xDD,
                0xDD,
                0xDD,
                0xDD,
                0x00,
                0x00,
                0xDA,
                0x00,
                0x0B,
                0x00,
                0xCD,                
            ]);
        }
        return result;
        }

    /*
	sendRemoteRequest() {
		// discover
		const peripheralData = {
			name: "PINGPONGDONGLE",
			rssi: 120,
			peripheralId: 1234567890,
		};
	}
	*/

    checkPongConnect() {
        if (!this.isCheckConnecting) {
            this.checkConnecting = setInterval(() => {
                console.log('checkPongConnect');
                if (!this.isConnected) {
                    this.sp.write(this.makePackets('connect'));
                }
            }, 1000);
            this.isCheckConnecting = true;
        }
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    // 초기 설정
    init(handler, config) {
        console.log('P: init: ');
        this.handler = handler;
        this.config = config;
    }

    eventController(state) {
        //console.log('P: state: ' + state);
        /*
        if (state === 'connected') {
            clearInterval(this.sensing);
        }
		*/
    }

    // 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData(sp, payload) {
        //console.log('P:requestInitialData: ');
        const grpid = payload.match(/[0-7]{1,2}$/g);
        if (grpid == null) {
            console.warn('Wrong group id inputted', payload);
            return null;
        }
        const grpno = parseInt(grpid[0], 16);
        return this.makePackets('connect', grpno);
    }

    dbgHexstr(data) {
        let output = '';
        data.map((item) => {
            let number = item.toString(16);
            if (number.length < 2) {
                number = `0${number}`;
            }
            output += `${number},`;
        });
        return output;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        //console.log('P:checkInitialData: ');
        //console.log(' data(%d) = %s', data.length, this.dbgHexstr(data));

        return true;
    }

    // optional. 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        //console.log('P:validateLocalData: '+data.length);
        return true;
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        //console.log('P:handle RemoteData: ', handler);

        this.send_cmd = handler.read('COMMAND');
        if (this.send_cmd) {
            if (this.send_cmd.id == -1) {
                this.cmd_seq = 0;
                //console.log('P:handle RD: CLEAR');
            } else if (this.send_cmd.id != this.cmd_seq) {
                this.cmd_seq = this.send_cmd.id;
                this.sendBuffer.push(Buffer.from(this.send_cmd.data));
                //console.log('D:send PACKET: %s ', this.dbgHexstr(sendBuffer));
            }
        }
    }

    // 하드웨어 기기에 전달할 데이터
    requestLocalData() {
        const self = this;
        if (!this.isDraing && this.sendBuffer.length > 0) {
            this.isDraing = true;
            const msg = this.sendBuffer.shift();
            this.sp.write(msg, () => {
                if (self.sp) {
                    self.sp.drain(() => {
                        self.isDraing = false;
                    });
                }
            });
        }

        return null;
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        if (!this.isConnected) {
        }

        if (data.length >= 9) {
            const packetSize = data.readInt16BE(7);
            const opcode = data[6];

            if (data.length === packetSize && opcode === 0xb8) {
                const sensor = this._sensorData;

                sensor.MOVE_X = data.readInt8(12);
                sensor.MOVE_Y = data.readInt8(13);
                sensor.MOVE_Z = data.readInt8(14);

                const xx = Math.max(Math.min(data.readInt8(15), 90), -90);
                let yy = Math.max(Math.min(data.readInt8(16), 90), -90);
                yy *= -1;
                const zz = Math.max(Math.min(data.readInt8(17), 90), -90);
                sensor.TILT_X = xx;
                sensor.TILT_Y = yy;
                sensor.TILT_Z = zz;

                sensor.BUTTON = data[11];

                sensor.PROXIMITY = data.readUInt8(18);

                // 기존 FW 70 버전 = data length 19 bytes (ANALOG IN 미지원)
                if (packetSize > 19) {
                    sensor.AIN = data.readUInt8(19) * 4;
                } else {
                    sensor.AIN = 0;
                }

                //XXX: sensor data 묶어서 보낼 경우 사용
                //this.readValue.SENSOR = sensor;

                /*
				this._proximity.C1Prox = PingPongUtil.getUnsignedIntfromByteData(value[18]);
				this._proximity.C1ProxInterVal = this._proximity.C1Prox - this._proximity.C1ProxOld;
				this._proximity.C1ProxOld = this._proximity.C1Prox;
				*/
            } else {
                //TODO: 기타 응답 패킷 처리 필요부분 추가
                //console.log('P:Board Data: %s ', this.dbgHexstr(data));
            }
        }
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        const self = this;
        Object.keys(this.readValue).forEach((key) => {
            if (self.readValue[key] !== undefined) {
                handler.write(key, self.readValue[key]);
            }
        });

        //XXX: entryjs의 monitorTemplate 사용하려면 트리상단에 PORT 정보 보내야함
        Object.keys(this._sensorData).forEach((key) => {
            if (self._sensorData[key] !== undefined) {
                //console.log(" --handler.write (%s) = %j ", key, self._sensorData[key]);
                handler.write(key, self._sensorData[key]);
            }
        });
    }

    connect() {
        console.log('P: connect: ');

        setTimeout(() => {
            this.sp.write(this.makePackets('setColorLed'), (err) => {});
        }, 500);

        setTimeout(() => { //YIM's 모든 센서가 연결된 후에 보내야하는데 여기서 보내지는게 오류...
            this.sp.write(this.makePackets('getSensorData'), (err) => {
                console.log('done.........');
            });
        }, 1000);
    }

    // 하드웨어 연결 해제 시 호출됩니다.
    // disconnect(connect) {
    //     console.log('P:disconnect: ');

    //     //console.log('.. ', this.sp.isOpen);
    //     if (this.sp) {
    //         // set led
    //         //this.sp.write( Buffer.from('ffffffff0000ce000e0200000150', 'hex') );
    //         // getSensor disable
    //         //this.sp.write( Buffer.from('ffffffff00c8b8000b0001', 'hex') );

    //         this.sp.write(this.makePackets('disconnect'), (err) => {
    //             if (this.sp.isOpen) {
    //                 console.log('Disconnect');
    //                 connect.close();
    //             }
    //             this.sp = null;
    //         });
    //     } else {
    //         connect.close();
    //     }
    // }

    // 엔트리와의 연결 종료 후 처리 코드입니다.
    reset() {
        //console.log('P:reset: ');
    }
}

module.exports = new PingpongG1();
