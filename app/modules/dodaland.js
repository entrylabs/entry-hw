const BaseModule = require('./baseModule');

class DodalandModule extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    STX = '';
    ETX = '';
    constructor() {
        super();

        this.writeCommand = null;
        this.lastEntryCommand = null;
        this.timer = null;
        this.isConnected = false;
        this.receiveData = null;
        this.commandArray = [];
    }

    isRecentData() {
        return true;
    }

    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    afterConnect(that, cb) {
        that.connected = true;
        if (cb) {
            cb('connected');
        }
    }

    disconnect(connector) {
        console.log('disconnect', typeof connector);
        connector.close();
    }

    lostController(connector, stateCallback) {
        // 아무일도 안하지만, 해당 함수가 선언되면 lostTimer 가 선언되지 않음.
        this.timer = setInterval(() => {
            if (this.receiveData == null && this.timer != null) {
                stateCallback('lost');
                clearInterval(this.timer);
            } else {
                this.receiveData = null;
                const handshakeJson = {
                    ready: null,
                };
                this.connectionCheckMessage = `${this.STX}${JSON.stringify(handshakeJson)}${
                    this.ETX
                }\n`;
            }
        }, 3000);
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData() {
        const handshakeJson = {
            ready: null,
        };
        const handshakeMessage = `${this.STX}${JSON.stringify(handshakeJson)}${this.ETX}\n`;
        console.log('requestInitialData', handshakeMessage);
        return Buffer.from(this.stringToArraybuffer(handshakeMessage));
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        console.log('checkInitialData', this.arraybufferToString(data));
        this.isConnected = true;
        return true;
    }

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        // console.log('validateLocalData', this.arraybufferToString(data));
        // this.isHandshaking = true;
        return true;
    }

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        // 하드웨어로 보낼 데이터 로직
        if (this.connectionCheckMessage != null) {
            const temp = this.connectionCheckMessage;
            this.connectionCheckMessage = null;
            return Buffer.from(this.stringToArraybuffer(temp));
        } else if (this.commandArray.length > 0) {
            const temp = this.commandArray.shift();
            console.log('requestLocalData', temp);
            return Buffer.from(this.stringToArraybuffer(temp));
        }
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        // 데이터 처리 로직
        this.receiveData = this.arraybufferToString(data);
        console.log('handleLocalData', this.receiveData);
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        // handler.write(key, value) ...
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        const command = handler.read('command');
        // console.log('handleRemoteData', command);
        if (command == null || command == this.lastEntryCommand) {
            // do nothing
        } else {
            this.lastEntryCommand = command;
            const message = `${this.STX}${command}${this.ETX}\n`;
            this.commandArray.push(message);
        }
    }

    stringToArraybuffer(str) {
        const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }
 
    arraybufferToString(buf) {
        const arrayBuffer = new Uint8Array(buf);
        const s = String.fromCharCode.apply(null, arrayBuffer);
        return decodeURIComponent(s);
    }
}

module.exports = new DodalandModule();
