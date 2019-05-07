const _ = require('lodash');
const BaseModule = require('./baseModule');

class AsomeBot extends BaseModule {
    constructor() {
        super();

        this.msg_id = '';
        this.sendToEntry = {
            msg_id: "",
        };
    }

    connect() {
    }

    socketReconnection() {
        this.socket.send(this.handler.encode());
    }

    requestInitialData() {
        return Buffer.from("import asomebot; asomebot.ready(5, 6, 7,8); asomebot.home()\r", "ascii");
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    setSocket(socket) {
        this.socket = socket;
    }

    checkInitialData(data, config) {
        return true;
    }

    validateLocalData(data) {
        return true;
    }

    requestRemoteData(handler) {
        var sendToEntry = this.sendToEntry;
        console.log("to Entry: ", sendToEntry);

        for (var key in sendToEntry) {
            handler.write(key, sendToEntry[key]);
        }
        return;
    }

    handleRemoteData({ receiveHandler = {} }) {
        const { data: handlerData } = receiveHandler;
        if (_.isEmpty(handlerData)) {
            return;
        }

        if (handlerData.msg_id != this.msg_id) {
            console.log("from Entry: ", handlerData);

            this.msg_id = handlerData.msg_id;
            this.sp.write(Buffer.from(handlerData.msg + "\r", 'ascii'));
            this.sp.write(Buffer.from("# " + this.msg_id + "\r", 'ascii'));
        }
    }

    requestLocalData() {
    }

    handleLocalData(data) {
        const text = data.toString();
        console.log("from AsomeBot: ", text);

        if (text.indexOf('#') >= 0) this.sendToEntry.msg_id = text;
    }

    setSocketData({ socketData, data }) {
    }

    lostController() { }

    disconnect(connect) {
        connect.close();
        this.sp = null;
    }

    reset() {
        this.sp = null;
        this.isPlaying.set(0);
        this.sendBuffers = [];
    }
}

module.exports = new AsomeBot();
