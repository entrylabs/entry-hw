const _ = require('lodash');
const HID = require('node-hid');
const rendererConsole = require('../utils/rendererConsole');
const BaseScanner = require('../BaseScanner');
const Connector = require('./Connector');

class Scanner extends BaseScanner {
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
                setTimeout(resolve, Scanner.SCAN_INTERVAL_MILLS)
            );
        }
        return scanResult;
    }

    async scan() {
        if (!this.config) {
            return;
        }
        const { hardware, this_com_port: selected } = this.config;
        const selectedPath = decodeURI(selected || '');
        const devices = HID.devices();
        rendererConsole.log(JSON.stringify(devices));
        if (selectedPath) {
            if (
                !_.some(
                    devices,
                    (device) => device.path.indexOf(selectedPath) > -1
                )
            ) {
                return;
            }
            if (!this.connectors[selectedPath]) {
                const connector = await this.prepareConnector(selectedPath);
                this.connectors[selectedPath] = connector;
            }
            return this.connectors[selectedPath];
        } else {
            this.router.sendState(
                'select_port',
                _.filter(devices, (device) => {
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
                    .map(({ path, product }) => ({
                        value: encodeURI(path),
                        text: product,
                    }))
            );
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
            delete this.connectors[path];
            throw e;
        }
        // const device = new HID.HID(path);
    }

    finalizeScan(path) {
        if (this.connectors) {
            this.connectors = {};
        }
        this.stopScan();
    }
}

module.exports = Scanner;
