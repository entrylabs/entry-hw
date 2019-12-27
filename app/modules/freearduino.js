const BaseModule = require('./baseModule');

class freearduino extends BaseModule {

    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
        
        this.readValue = {
            DIGITAL : {'0':0,'1':0,'2':0,'3':0,'4':0,'5':0,'6':0,'7':0,'8':0,'9':0,'10':0,'11':0,'12':0,'13':0,'14':0,'15':0,'16':0,'17':0,'18':0,'19':0,},
            DIGITAL_PULLUP : {'0':0,'1':0,'2':0,'3':0,'4':0,'5':0,'6':0,'7':0,'8':0,'9':0,'10':0,'11':0,'12':0,'13':0,'14':0,'15':0,'16':0,'17':0,'18':0,'19':0,},
            ANALOG : {'0':0,'1':0,'2':0,'3':0,'4':0,'5':0,},
            ANALOG_PULLUP : {'0':0,'1':0,'2':0,'3':0,'4':0,'5':0,},
            US_DISTANCE : 0,
            DHT_HUMI : 0,
            DHT_TEMP : 0,
        };
        this.writeValue = new Array(32).fill(0);
        this.lastValue = new Array(32).fill(0);
        this.readablePorts = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
        this.motorFlag = false;
        
    }
    
    // 초기 설정
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    setSerialPort(sp) {
        this.sp = sp;   
    }
    
    // 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData() {
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

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        this.readablePorts = handler.read('readablePorts');
        for (var port = 0; port < 32; port++) {
            this.writeValue[port] = handler.read(port);
        }
        if(this.writeValue[0] === 1 && !this.motorFlag) {
            this.motorFlag = true;
        }
        if(this.writeValue[0] === 0 && this.motorFlag) {
            this.motorFlag = false;
        }
    }

    // 하드웨어 기기에 전달할 데이터
    requestLocalData() {
        var queryString = [];

        var readablePorts = this.readablePorts;
        if (readablePorts) {
            var query = [130,0,130,64,131,64];
             for (var i in readablePorts) {
                var number = readablePorts[i];
                if(number < 2) continue;
                var offset = parseInt((number-2)/6);
                query[1+offset*2] |= 1 << (number-2-offset*6);
            }
            queryString = queryString.concat(query);
        }

        var readablePortsValues =
        (readablePorts && Object.values(readablePorts)) || [];
        for (var port = 2; port < 32; port++) {
            if ((port<20 && readablePortsValues.indexOf(port) > -1) ||
                (port==20 && readablePortsValues.indexOf(3) > -1) ||
                (port==21 && readablePortsValues.indexOf(5) > -1) ||
                (port==22 && readablePortsValues.indexOf(6) > -1) ||
                (port==23 && readablePortsValues.indexOf(9) > -1) ||
                (port==24 && readablePortsValues.indexOf(10) > -1) ||
                (port==25 && readablePortsValues.indexOf(11) > -1)) { 
               continue;
            }
            var value = this.writeValue[port];
            var query = [128,0];
            var sendFlag = true;

            if (port > 31) sendFlag = false;
            else if (value == 0 && this.lastValue[port] == 0) sendFlag = false;
            else if (port > 25 && !this.motorFlag) sendFlag = false;

            if (port >= 2 && port <= 25) {
                query[0] |= (port<<1) | ((value>>7)&1);
                query[1] |= value&127;
            }
            if (port == 26) {
                var number = parseInt(value/10);
                query[0] |= (26<<1) | (number>>1);
                query[1] |= ((number&1)<<6) | ((value%10)&63);
            }
            if (port >= 27 && port <= 30) {
                query[0] |= (port<<1) | ((value>>7)&1);
                query[1] |= value&127;
            }
            
            if (sendFlag) {
                this.lastValue[port] = value;
                queryString = queryString.concat(query);
            }
        }
        return queryString;
    }
    
    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        var self = this;
        var sprintf=require("sprintf-js").sprintf;

        data.forEach(function(value,idx){
            var first = data[idx];
            var second = data[idx+1];
            if(first >= 127 && second < 128) {
                var port = (first >> 3) & 15;
                if (port < 6) {
                    var value = ((first & 7) << 7) + (second & 127);
                    self.readValue.ANALOG[port] = value;
                    if (value >= 500) {
                        self.readValue.DIGITAL[port+14] = 1;
                    }
                    else {
                        self.readValue.DIGITAL[port+14] = 0;
                    }
                }
                else if (port < 12) {
                    var value = ((first & 7) << 7) + (second & 127);
                    self.readValue.ANALOG_PULLUP[port-6] = value;
                    if (value >= 500) {
                        self.readValue.DIGITAL_PULLUP[port-6+14] = 1;
                    }
                    else {
                        self.readValue.DIGITAL_PULLUP[port-6+14] = 0;
                    }
                }
                else if (port < 15) {
                    var value = ((first & 7) << 7) + (second & 127);
                    if(port === 12) {
                        self.readValue.US_DISTANCE = value;
                    }
                    //13
                    //14
                }
                else if (port === 15) {
                    var port2 = first & 7;
                    if (port2 === 0) {
                        var value = second & 127;
                        self.readValue.DHT_HUMI = value; 
                    }
                    else if (port2 === 1) {
                        var value = second & 127;
                        self.readValue.DHT_TEMP = value;
                    }
                    //2
                    //3
                    //4
                    //5
                    else if (port2 === 6) {
                        if (second >> 6 === 0) {
                            for(var i=0; i<6; i++) {
                                self.readValue.DIGITAL[2+i] = (second >> i) & 1;
                            }
                        }
                        if (second >> 6 === 1) {
                            for(var i=0; i<6; i++) {
                                self.readValue.DIGITAL_PULLUP[2+i] = (second >> i) & 1;
                            }
                        }
                    }
                    else if (port2 === 7) {
                        if (second >> 6 === 0) {
                            for(var i=0; i<6; i++) {
                                self.readValue.DIGITAL[8+i] = (second >> i) & 1;
                            }
                        }
                        if (second >> 6 === 1) {
                            for(var i=0; i<6; i++) {
                                self.readValue.DIGITAL_PULLUP[8+i] = (second >> i) & 1;
                            }
                        }   
                    }
                }
            }
        });
    }
    
    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        var self = this;
        if (!self.readValue) {
            return;
        }
        Object.keys(this.readValue).forEach(function(key) {
            if (self.readValue[key] != undefined) {
                handler.write(key, self.readValue[key]);
            }
        });
    }

    // 하드웨어 연결 해제 시 호출됩니다.
    disconnect(connect) {
        var self = this;
        connect.close();
        if (this.sp) {
            delete self.sp;
        }
    }
    
    // 엔트리와의 연결 종료 후 처리 코드입니다.
    reset() { };
}

module.exports = new freearduino();