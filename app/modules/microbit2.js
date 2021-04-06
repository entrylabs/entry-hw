const _ = global.$;
const BaseModule = require('./baseModule');

class Microbit2 extends BaseModule {
    constructor() {
        super();
        this.serialport;
        this.executeCheckList = [];
        this.recentlyWaitDone;
    }
    // entryjs 에서 오는 데이터 처리
    handleRemoteData(handler) {
        const command = handler.read('type');
        const payload = handler.read('payload');
        const codeId = handler.read('codeId') || null;
        if (codeId) {
            this.executeCheckList.push(codeId);
        }

        if (payload) {
            const microbitCommand = `${command};${payload}`;
            this.serialport.write(`${microbitCommand}\n`);
        } else {
            this.serialport.write(`${command}\n`);
        }
    }
    requestRemoteData(handler) {
        const payload = {
            recentlyWaitDone: this.recentlyWaitDone,
        };
        handler.write('payload', payload);
    }

    // 하드웨어 에서 오는 데이터 처리
    handleLocalData(data) {
        if (data !== 'localdata') {
            this.recentlyWaitDone = this.executeCheckList.shift();
        }
    }

    // setup 관련
    setSerialPort(serialport) {
        this.serialport = serialport;
    }

    setSocket(socket) {
        this.socket = socket;
    }

    disconnect(connect) {
        if (this.serialport) {
            this.serialport.write('reset;\r\n');
        }
        connect.close();
    }

    // initial connection 체크
    requestInitialData() {
        return 'localdata';
    }

    checkInitialData(data, config) {
        const command = data.split(';')[0];
        return command == 'localdata';
    }

    // connection consistency 체크
    requestLocalData() {
        return 'localdata';
    }
}

module.exports = new Microbit2();
