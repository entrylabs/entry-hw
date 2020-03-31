import SerialScanner from './serial/scanner';
import HidScanner from './hid/scanner';
import BleScanner from './ble/scanner';
import createLogger from '../electron/functions/createLogger';

const logger = createLogger('core/ScannerManager.ts');

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
        logger.verbose(`scanner ${type} type requested`);
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
