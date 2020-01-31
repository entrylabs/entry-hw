import SerialScanner from './serial/scanner';

const HidScanner = require('./hid/scanner');
const BleScanner = require('./ble/scanner');

type IScannerSelector = {
    serial: any;
    hid: any;
    ble: any;
}

type IScannerTypes = 'serial' | 'hid' | 'ble' | 'bluetooth';

class ScannerManager {
    private scanners: IScannerSelector;

    constructor(router: any) {
        this.scanners = {
            serial: new SerialScanner(router),
            hid: new HidScanner(router),
            ble: new BleScanner(router),
        };
    }

    getScanner(type: IScannerTypes) {
        switch (type) {
            case 'ble':
                return this.scanners.ble;
            case 'hid':
                return this.scanners.hid;
            case 'serial':
            case 'bluetooth':
            default:
                return this.scanners.serial;
        }
    }
}

export default ScannerManager;
