const SerialScanner = require('./serial/scanner');
const HidScanner = require('./hid/scanner');

class ScannerManager {
    #scanners = {};
    constructor(router) {
        this.#scanners.serial = new SerialScanner(router);
        this.#scanners.hid = new HidScanner(router);
    }

    getScanner(type) {
        switch (type) {
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
