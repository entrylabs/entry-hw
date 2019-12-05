const serialScanner = require('./serial/Scanner');
const hidScanner = require('./hid/Scanner');

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
