const _ = require('lodash');

class Microbit {
    constructor() {
        this.recentCheckData = [];
    }

    init(handler, config) {}

    requestInitialData() {}

    checkInitialData(data, config) {
        return true;
    }

    validateLocalData(data) {
        return true;
    }

    requestRemoteData(handler) {
        Object.keys(this.recentCheckData).forEach((id) => {
            this.recentCheckData[key];
        });

        if (!this.sensorData) {
            return;
        }
        Object.keys(this.sensorData).forEach((key) => {
            if (this.sensorData[key] != undefined) {
                handler.write(key, this.sensorData[key]);
            }
        });
    }

    handleRemoteData(handler) {
        this.output = handler.read('OUTPUT');
    }

    requestLocalData() {
        if (!this.output) {
            return;
        }

        let sendData = '';
        Object.keys(this.output).forEach((id) => {
            const { type, data } = this.output[id] || {};
            if (this.isRecentData(type, id)) {
                sendData += this.makeData(type, data);
                this.recentCheckData.push(id);
            }
        });

        sendData && console.log(sendData);
        return sendData;
    }

    handleLocalData(data) {
        try {
            this.sensorData = JSON.parse(data);
        } catch(e) {
            this.sensorData = {};
        }
    }

    makeData(key, data) {
        let returnData = '';
        switch (key) {
            case 'LED':
                const { x, y, value } = data;
                returnData = `LED:${x}:${y}:${value}:`;
                // returnData = `STR:A`;
                break;
            case 'STR':
                returnData = `STR:${data}`;
                break;
            case 'RST':
                returnData = `RST:OK`;
                break;
            default:
                break;
        }
        return returnData + '\n';
    }

    isRecentData(key, id) {
        return _.findIndex(this.recentCheckData, id) > -1;
    }
}

module.exports = new Microbit();
