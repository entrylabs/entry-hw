const BaseModule = require('./baseModule');

class Timbo extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
        this.digitalValue = new Array(14);
        this.analogValue = new Array(6);

        this.remoteDigitalValue = new Array(14);
        this.readablePorts = null;
        this.remainValue = null;
    }

    /*
    최초에 커넥션이 이루어진 후의 s초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData() {
        return true;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        return true;
    }

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    }

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        var queryString = [];

        var readablePorts = this.readablePorts;
        if (readablePorts) {
            for (var i in readablePorts) {
                var query = (5 << 5) + (readablePorts[i] << 1);
                queryString.push(query);
            }
        }

        var digitalValue = this.remoteDigitalValue;
        for (var port = 0; port < 14; port++) {
            var value = digitalValue[port];
            if (value === 255 || value === 0) {
                var query = (7 << 5) + (port << 1) + (value == 255 ? 1 : 0);
                queryString.push(query);
            } else if (value > 0 && value < 255) {
                var query = (6 << 5) + (port << 1) + (value >> 7);
                queryString.push(query);
                query = value & 127;
                queryString.push(query);
            }
        }
        return queryString;
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        // data: Native Buffer
        var pointer = 0;
        for (var i = 0; i < 32; i++) {
            var chunk;
            if (!this.remainValue) {
                chunk = data[i];
            } else {
                chunk = this.remainValue;
                i--;
            }
            if (chunk >> 7) {
                if ((chunk >> 6) & 1) {
                    var nextChunk = data[i + 1];
                    if (!nextChunk && nextChunk !== 0) {
                        this.remainValue = chunk;
                    } else {
                        this.remainValue = null;

                        var port = (chunk >> 3) & 7;
                        this.analogValue[port] = ((chunk & 7) << 7) + (nextChunk & 127);
                    }
                    i++;
                } else {
                    var port = (chunk >> 2) & 15;
                    this.digitalValue[port] = chunk & 1;
                }
            }
        }
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        for (var i = 0; i < this.analogValue.length; i++) {
            var value = this.analogValue[i];
            handler.write('a' + i, value);
        }
        for (var i = 0; i < this.digitalValue.length; i++) {
            var value = this.digitalValue[i];
            handler.write(i, value);
        }
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        this.readablePorts = handler.read('readablePorts');
        var digitalValue = this.remoteDigitalValue;
        for (var port = 0; port < 14; port++) {
            digitalValue[port] = handler.read(port);
        }
    }
}

module.exports = new Timbo();
