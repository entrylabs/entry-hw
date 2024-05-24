const BaseModule = require('./baseModule');
const { app } = require('electron');
const { dialog } = require('electron');

//1.9.19 이후 여러번 패킷 전송을 막기 위한 변수
var checkMultiroleAction = false;

class PingpongBase extends BaseModule {
    constructor(cubeCnt) {
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

        this.cubeCount = cubeCnt || 2;
        this.checkBuffer = null;

        console.log('PINGPONG construct : G%d', this.cubeCount);
    }

    makePackets(method, grpid = 0) {
        console.log('makePackets')
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
        } else if (method === 'setMultirole') {
            result = Buffer.from([
                0xff,
                0xff,
                0x00,
                0xff,
                this.cubeCount << 4,
                0x00,
                0xad,
                0x00,
                0x0b,
                0x0a,
                0x00,
            ]);
            if (grpid > 0) {
                result[2] = grpid;
                result[9] = 0x1a;
                result[10] = grpid;
            }
        } else if (method === 'getSensorData') {
            result = Buffer.from([
                0xff,
                0xff,
                0xff,
                0xff, // position
                0x00,
                0xc8, // continuous sampling
                0xb8,
                0x00,
                0x0b,
                10, // interval //YIM's 30->10
                0x01,
            ]);
        }
        return result;    
        
    }

    isPingpongConnected(packet) {
        console.log('isPingpongConnected')
    }

    setSerialPort(sp) {
        console.log('setSerialPort')
        this.sp = sp;
    }

    // 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData(sp, payload) {
        console.log('requestInitialData')
        const grpid = payload.match(/[0-7]{1,2}$/g);
        if (grpid == null) {
            console.warn('Wrong group id inputted', payload);
            return null;
        }
        const grpno = parseInt(grpid[0], 16);

        if(checkMultiroleAction==false){
            checkMultiroleAction=true;
            return this.makePackets('setMultirole', grpno);    
        } else {
            return null;
        }  

    }

    dbgHexstr(data) {
        console.log('dbgHexstr')
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
        console.log('P:checkInitialData: /  data(%d)', data.length);

        if (this.checkBuffer) {
            this.checkBuffer = Buffer.concat([this.checkBuffer, data]);
        } else {
            this.checkBuffer = Buffer.from(data);
        }

        const payload = this.checkBuffer;

        if (payload.length >= 9) {
            const packetSize = payload.readInt16BE(7);
            if (payload.length >= packetSize) {
                const packet = payload.slice(0, packetSize);
                console.log('PACKET: ', packetSize);

                if (this.isPingpongConnected(packet) == true) {
                    console.info('checkInitialData(): all cube connected!');

                    setTimeout(() => {
                        this.sp.write(this.makePackets('getSensorData'), (err) => {
                            console.log('send get Sensor Data.');
                        });
                    }, 500); 
					// YIM's getsensor 명령얼 보내야 할 곳으로 보임..
                    return true;
                } //YIM's G2~4 까지는 checkInitialData 리턴이 true 가 되지 않음 , 이 때 firmwarecheck 설정이 true이면 문제가 됨 ???

                // skip this packet
                this.checkBuffer = Buffer.from(payload.slice(packetSize));
                console.log('After skip: ', this.checkBuffer);
                return;
            }
        }
    }

    // optional. 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        console.log('validateLocalData')
        //console.log('P:validateLocalData: '+data.length);
        return true;
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        console.log('handleRemoteData')
        this.send_cmd = handler.read('COMMAND');
        if (this.send_cmd) {
            if (this.send_cmd.id == -1) {
                this.cmd_seq = 0;
                //console.log('P:handleRemoteData RD: CLEAR');
            } else if (this.send_cmd.id != this.cmd_seq) {
                this.cmd_seq = this.send_cmd.id;
                this.sendBuffer.push(Buffer.from(this.send_cmd.data));
                //const sendBuffer = Buffer.from(this.send_cmd.data);
            }
        }
    }

    // 하드웨어 기기에 전달할 데이터
    requestLocalData() {
        console.log('requestLocalData')
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
        console.log('handleLocalData')
        if (!this.isConnected) { 
        }

        if (data.length >= 9) {
            const packetSize = data.readInt16BE(7);
            const opcode = data[6];

            if(opcode == 0xb8 && this.cubeCount * 20 == data.length){
                    for(let x = 0; x < this.cubeCount; x++){

                        // 센서 패킷은 20개씩 들어옴
                        const cubeid = Number(data[0+(20*x)].toString(16).slice(1, 2));

                        console.log("handleLocalData x : ", x);
                        console.log("handleLocalData cubeid : ", data[0+(20*x)]);
                        console.log("handleLocalData cubeid : ", cubeid);

                        if (cubeid >= this.cubeCount) {
                            return;
                        }
                        
                        const sensor = this._sensorData[cubeid];

                        sensor.MOVE_X = data.readInt8(12+(20*x));
                        sensor.MOVE_Y = data.readInt8(13+(20*x));
                        sensor.MOVE_Z = data.readInt8(14+(20*x));
    
                        const xx = Math.max(Math.min(data.readInt8(15+(20*x)), 90), -90);
                        let yy = Math.max(Math.min(data.readInt8(16+(20*x)), 90), -90);
                        yy *= -1;
                        const zz = Math.max(Math.min(data.readInt8(17+(20*x)), 90), -90);
                        sensor.TILT_X = xx;
                        sensor.TILT_Y = yy;
                        sensor.TILT_Z = zz;
    
                        sensor.BUTTON = data[11+(20*x)];
    
                        sensor.PROXIMITY = data.readUInt8(18+(20*x));
    
                        // 기존 FW 70 버전 = data length 19 bytes (ANALOG IN 미지원)
                        if (packetSize > 19) {
                            sensor.AIN = data.readUInt8(19+(20*x)) * 4;
                        } else {
                            sensor.AIN = 0;
                        }
                    }
                console.log("handleLocalData : ", this._sensorData);
            }
        }
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        console.log('requestRemoteData')
        const self = this;
        Object.keys(this.readValue).forEach((key) => {
            if (self.readValue[key] !== undefined) {
                handler.write(key, self.readValue[key]);
            }
        });

        //XXX: entryjs의 monitorTemplate 사용하려면 트리상단에 PORT 정보 보내야함
        // wooms 첫번째 큐브만 정상적으로 들어옴
        for (let cubeid = 0; cubeid < this.cubeCount; cubeid++) {
            // console.log("requestRemoteData : ", cubeid);
            // console.log("requestRemoteData : ", this._sensorData[cubeid]);
            const sdata = this._sensorData[cubeid];
            Object.keys(sdata).forEach((key) => {
                if (sdata[key] !== undefined) {
                    // console.log(" --handler.write (%s) = %j ", key, self._sensorData[key]);
                    handler.write(`c${cubeid.toString()}_${key}`, sdata[key]);
                }
            });
        }
    }

    connect() {
        console.log('P: connect: ');

        setTimeout(() => {
            // this.sp.write(this.makePackets('getSensorData'), (err) => {
            //     console.log('done.........');
            // });
        }, 500); // YIM's 모든 큐브가 다 연결된 상태에서 STAR에게 보내지고 있는지... 500이면 좋은건지 오히려 모든 큐브 연결된 후 보내는게 맞지 않을지...
    }

    // 하드웨어 연결 해제 시 호출됩니다.
    disconnect(connect) {
        console.log('P:disconnect: ');
        
        dialog.showMessageBox({
            title: '핑퐁 로봇',
            message: '3초 후 재시작 됩니다.'
        });

        checkMultiroleAction = false;

        if (this.sp) {

            this.sp.write(this.makePackets('disconnect'), (err) => {
                console.log('disconnect error', err);
                if (this.sp.isOpen) {
                    console.log('Disconnect');
                    setTimeout(() => {
                        connect.close();
                    }, 1000);
                }
                this.sp = null;
            });
        } else {
            setTimeout(() => {
                connect.close();
            }, 1000);
        }    
        
        setTimeout(() => {
            app.relaunch();
            app.exit(0);    
        }, 3000);
        

    }

    // 엔트리와의 연결 종료 후 처리 코드입니다.
    reset() {
        console.log('P:reset: ');
    }
}

module.exports = PingpongBase;
