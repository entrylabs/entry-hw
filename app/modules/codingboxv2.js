const BaseModule = require('./baseModule');

class CodingBoxV2 extends BaseModule {
    constructor() {
        super();
        this.serialport = null;
        this.commands = [];
        this.sensorData = {};
        this.localDataCounter = 0;
    }

    handleRemoteData(handler) {
        const command = handler.read('type');
        const payload = handler.read('payload');

        if (!command) {
            return;
        }

        if (command === 'reset') {
            this.commands = [];

            if (this.serialport) {
                this.serialport.write('reset;\n');
            }

            return;
        }

        const data = `${command};${payload ?? ''}\n`;

        if (this.commands.indexOf(data) > -1) {
            return;
        }

        this.commands.push(data);
    }

    requestLocalData() {
        this.localDataCounter++;

        if (this.localDataCounter >= 3) {
            this.localDataCounter = 0;
            return 'localdata;\n';
        }

        if (this.commands.length > 0) {
            return this.commands.shift();
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
