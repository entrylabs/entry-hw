const BaseModule = require('./baseModule');

class CodingBoxV2 extends BaseModule {
    constructor() {
        super();
        this.serialport = null;
        this.commands = [];
        this.sensorData = {};
        this.needLocalData = false;
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
            this.needLocalData = false;
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
        if (this.needLocalData || this.commands.length === 0) {
            this.needLocalData = false;
            return 'localdata;\n';
        }

        this.needLocalData = true;
        return this.commands.shift();
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
        return data.toString().indexOf('localdata;') === 0;
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
