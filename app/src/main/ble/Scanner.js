const { app, ipcMain, shell } = require('electron');
const _ = require('lodash');
const rendererConsole = require('../utils/rendererConsole');
const BaseScanner = require('../BaseScanner');
const Connector = require('./Connector');

class Scanner extends BaseScanner {
    constructor(router) {
        super(router);
        this.router = router;
        this.browser = router.browser;
        this.ipcManager = router.ipcManager;
        this.isScanning = false;
        this.devices;
        this.selectBluetoothDevice = this.selectBluetoothDevice.bind(this);
    }

    async startScan(hwModule, config) {
        this.stopScan();
        this.setConfig(config);
        this.initScan();
        this.hwModule = hwModule;
        this.connectors = {};
        return await this.scan();
    }

    updateConfig(config) {
        this.setConfig(config);
    }

    async selectBluetoothDevice(event, deviceList, callback) {
        event.preventDefault();
        if (!this.isScanning) {
            callback('');
        }
        const { hardware, this_com_port: selectedId } = this.config;
        const result = deviceList.find(
            (device) => device.deviceId === selectedId
        );
        rendererConsole.log(JSON.stringify(deviceList));
        if (!_.isEqual(deviceList, this.devices)) {
            this.router.sendState(
                'select_port',
                _.filter(deviceList, (device) => {
                    for (const key in device) {
                        if (
                            hardware[key] &&
                            device[key].indexOf(hardware[key]) === -1
                        ) {
                            return false;
                        }
                    }
                    return true;
                })
                    .sort((left, right) => {
                        if (left.deviceName > right.deviceName) {
                            return 1;
                        } else {
                            return -1;
                        }
                    })
                    .map(({ deviceName, deviceId }) => ({
                        value: deviceId,
                        text: deviceName,
                    }))
            );
        }
        this.devices = deviceList;
        if (!this.selectFunction) {
            this.selectFunction = callback;
        }
        if (result) {
            this.selectFunction = undefined;
            callback(result.deviceId);
        }
    }

    async initScan() {
        if (!this.config || this.isScanning) {
            return;
        }
        this.isScanning = true;
        this.browser.webContents.on(
            'select-bluetooth-device',
            this.selectBluetoothDevice
        );
    }

    async scan() {
        if (!this.config) {
            return;
        }
        const { hardware, rendererModule } = this.config;
        const device = await this.ipcManager.invoke(
            'scanBleDevice',
            hardware,
            rendererModule
        );
        this.connector = await this.prepareConnector(device);
        return this.connector;
    }

    async prepareConnector(id) {
        try {
            if (!this.config) {
                return;
            }
            const { hardware } = this.config;
            const connector = new Connector(
                this.hwModule,
                hardware,
                this.ipcManager
            );
            this.router.setConnector(connector);
            this.router.sendState('before_connect');
            await connector.initialize();
            this.finalizeScan(id);
            return connector;
        } catch (e) {
            console.error(e);
        }
    }

    finalizeScan(id) {
        this.stopScan();
    }

    stopScan() {
        if (this.selectFunction) {
            this.selectFunction('');
            this.selectFunction = undefined;
        }
        this.browser.webContents.removeListener(
            'select-bluetooth-device',
            this.selectBluetoothDevice
        );
        this.config = undefined;
        this.isScanning = false;
        this.devices = undefined;
        this.clearTimers();
    }
}

module.exports = Scanner;
