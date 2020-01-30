import { assign } from 'lodash';

class DataHandler {
    private deviceData: {[key: string]: any};
    private serverData: {[key: string]: any};

    constructor(hardwareId: string) {
        this.deviceData = assign({}, this._makeIDProperties(hardwareId));
        this.serverData = assign({}, this._makeIDProperties(hardwareId));
    }

    encode() {
        return this.deviceData;
    }

    decode(data: any) {
        try {
            this.serverData = JSON.parse(data);
        } catch (e) {
            console.warn('server data parsing failed. raw data is: ', data);
        }
    }

    e(key: string) {
        return !!(this.serverData && this.serverData[key]);
    }

    read(key: string): any {
        return this.serverData[key] || 0;
    }

    write(key: string, value: any) {
        this.deviceData[key] = value;
    }

    _makeIDProperties(id: string) {
        return {
            company: parseInt(id.slice(0, 2), 16) & 0xff,
            model: parseInt(id.slice(2, 4), 16) & 0xff,
            variation: parseInt(id.slice(4, 6), 16) & 0xff,
        };
    }
}

module.exports = DataHandler;
