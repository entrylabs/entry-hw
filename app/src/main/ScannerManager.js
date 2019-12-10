const SerialScanner = require('./serial/Scanner');
const HidScanner = require('./hid/Scanner');
const BleScanner = require('./ble/Scanner');

class ScannerManager {
    #scanners = {};
    constructor(router) {
        this.#scanners.serial = new SerialScanner(router);
        this.#scanners.hid = new HidScanner(router);
        this.#scanners.ble = new BleScanner(router);
    }

    getScanner(type) {
        switch (type) {
            case 'ble':
                return this.#scanners.ble;
            case 'hid':
                return this.#scanners.hid;
            case 'serial':
            case 'bluetooth':
            default:
                return this.#scanners.serial;
        }
    }
}

module.exports = ScannerManager;
