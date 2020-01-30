const _ = require('lodash');
const HID = require('node-hid');
const rendererConsole = require('../rendererConsole');
const BaseScanner = require('../baseScanner');
const Connector = require('./connector');

class HidScanner extends BaseScanner {
    constructor(router) {
        super(router);
        this.router = router;
        this.isScanning = false;
    }

    async startScan(hwModule, config) {
        this.stopScan();
        this.setConfig(config);
        this.hwModule = hwModule;
        this.connectors = {};
        return await this.intervalScan();
    }

    setConfig(config) {
        const { hardware } = config;
        const { driverType = 'hidraw' } = hardware;
        HID.setDriverType(driverType);
        this.config = config;
    }

    async intervalScan() {
        this.isScanning = true;
        let scanResult = undefined;
        while (this.isScanning) {
            scanResult = await this.scan();
            if (scanResult) {
                this.isScanning = false;
                break;
            }
            await new Promise((resolve) =>
                setTimeout(resolve, HidScanner.SCAN_INTERVAL_MILLS),
            );
        }
        return scanResult;
    }

    async scan() {
        if (!this.config) {
            console.warn('config is not present');
            return;
        }
        const { hardware } = this.config;
        const selectedPath = this.router.selectedPort;
        const devices = HID.devices();
        rendererConsole.log(devices);
        if (selectedPath) {
            const selectedDevice = _.find(devices, ['product', selectedPath]);
            if (!selectedDevice) {
                return;
            }
            return await this.prepareConnector(selectedDevice.path);
        } else {
            const pathList = _.filter(devices, (device) => {
                for (const key in device) {
                    if (hardware[key] && hardware[key] !== device[key]) {
                        return false;
                    }
                }
                return true;
            })
                .sort((left, right) => {
                    if (left.product > right.product) {
                        return 1;
                    } else {
                        return -1;
                    }
                })
                .map((element) => ({
                    ...element,
                    path: element.product,
                }));

            this.router.sendEventToMainWindow('portListScanned', pathList);
        }
    }

    async prepareConnector(path) {
        try {
            const { hardware } = this.config;
            const connector = new Connector(this.hwModule, hardware);
            connector.open(path);
            this.router.setConnector(connector);
            this.router.sendState('before_connect');
            await connector.initialize();
            this.finalizeScan(path);
            return connector;
        } catch (e) {
            throw e;
        }
        // const device = new HID.HID(path);
    }

    finalizeScan(path) {
        this.stopScan();
    }
}

module.exports = HidScanner;
