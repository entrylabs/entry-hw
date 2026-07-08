const BaseModule = require('./baseModule');

class CodingBoxV2 extends BaseModule {
    constructor() {
        super();
        this.serialport = null;
        this.commands = [];
        this.sensorData = {};
        this.lastSendTime = 0;
        this.sendInterval = 200;
    }

    handleRemoteData(handler) {
        const command = handler.read('type');
        const payload = handler.read('payload');

        if (!command) {
            return;
        }

        const data = `${command};${payload ?? ''}\n`;

        if (command === 'reset') {
            this.commands = ['reset;\n'];
            return;
        }

        if (this.commands.indexOf(data) > -1) {
            return;
        }

        this.commands.push(data);

        if (this.commands.length > 20) {
            this.commands.shift();
        }
    }

    requestLocalData() {
        const now = Date.now();

        if (
            this.commands.length > 0 &&
            now - this.lastSendTime >= this.sendInterval
        ) {
            this.lastSendTime = now;

            const batch = this.commands.splice(0, 5);

            return `batch;${batch.map((x) => x.trim()).join('@@')}\n`;
        }

        return 'localdata;\n';
    }

    handleLocalData(data) {
        const text = data.toString().trim();

        if (text.indexOf('localdata;') !== 0) {
            return;
        }

        const payload = text.replace('localdata;', '');

        try {
            this.sensorData = JSON.parse(payload);
        } catch (e) {}
    }

    requestRemoteData(handler) {
        Object.keys(this.sensorData).forEach((key) => {
            handler.write(key, this.sensorData[key]);
        });
    }

    requestInitialData() {
        return 'localdata;\n';
    }

    checkInitialData(data) {
        const text = data.toString().trim();

        if (text.indexOf('localdata;') === 0) {
            return true;
        }

        return undefined;
    }

    setSerialPort(serialport) {
        this.serialport = serialport;
    }

    disconnect(connect) {
        if (this.serialport) {
            this.serialport.write('reset;\n');
        }

        if (connect) {
            connect.close();
        }
    }
}

module.exports = new CodingBoxV2();
