const serialScanner = require('./serial/scanner');
const hidScanner = require('./hid/scanner');

class ScannerManager {
    #scanners = {};
    constructor(router) {
        this.#scanners.serial = new serialScanner(router);
        this.#scanners.hid = new hidScanner(router);
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
