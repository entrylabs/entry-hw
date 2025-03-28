const _ = global.$;
const BaseModule = require('./baseModule');

class Microbit2 extends BaseModule {
    constructor() {
        super();
        this.serialport;
        this.handler;
        // codeID 와 명령어를 keep 하는 queue.
        this.executeCheckList = [];
        // 실제 마이크로비트에 전송될 명령어 queue.
        this.microbitCommands = [];
        this.currentCommand;
    }

    // entryjs 에서 오는 데이터 처리
    handleRemoteData(handler) {
        const command = handler.read('type');
        const payload = handler.read('payload');
        const codeId = handler.read('codeId') || null;
        if (command != 'reset') {
            this.executeCheckList.push({ codeId, command });
        }
        // 명령어 프로세스 후에 queue에 넣기
        const microbitCommand = `${command};${payload}`;
        if (this.microbitCommands.indexOf(microbitCommand) > -1) {
            return;
        }
        if (command === 'reset') {
            this.executeCheckList = [];
            this.microbitCommands = [];
            this.currentCommand = null;
            this.serialport.write(microbitCommand);
            return;
        }
        this.microbitCommands.push(microbitCommand);
    }

    // statusMap 사용 해야할까?
    requestRemoteData(handler) {}

    // 하드웨어 에서 오는 데이터 처리
    handleLocalData(data) {
        const parsedResponse = data.split(';');
        if (parsedResponse[0] !== 'localdata') {
            if (this.executeCheckList.length > 0) {
                const { codeId, command } = this.executeCheckList.shift();
                if (this.currentCommand == this.microbitCommands[0]) {
                    this.microbitCommands.shift();
                    this.currentCommand = null;
                }

                if (command.indexOf('reset') > -1) {
                    this.executeCheckList = [];
                    this.microbitCommands = [];
                    this.currentCommand = null;
                    return;
                }
                this.socket.send({
                    recentlyWaitDone: codeId,
                    result: data,
                });
            }
        } else {
            this.socket.send({
                result: data,
            });
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
        return 'localdata;';
    }

    checkInitialData(data, config) {
        const command = data.split(';')[0];
        return command == 'localdata';
    }

    // connection consistency 체크
    requestLocalData() {
        // 프로세스된 명령어가 있다면 전송하기 또는 handshake명령어 전달
        if (this.microbitCommands.length > 0) {
            const command = this.microbitCommands[0];
            if (this.currentCommand == command) {
                return 'localdata;';
            }
            this.currentCommand = command;
            return command;
        }
        return 'localdata;';
    }
}

module.exports = new Microbit2();
