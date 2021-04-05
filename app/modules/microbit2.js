const _ = global.$;
const BaseModule = require('./baseModule');

class Microbit2 extends BaseModule {
    constructor() {
        super();
        this.executeCheckList = [];
        this.serialport;
    }

    disconnect(connect) {
        connect.close();
    }

    requestInitialData(serialport) {
        return 'initial;\r\n';
    }

    checkInitialData(data, config) {
        return data == 'ok';
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    setSocket(socket) {
        this.socket = socket;
    }

    handleLocalData(data) {
        console.log(data);
    }
}

module.exports = new Microbit2();
