const _ = require('lodash');
const rendererConsole = require('../utils/rendererConsole');
const IpcManager = require('../utils/ipcMainManager');
const BaseScanner = require('../BaseScanner');
const Connector = require('./Connector');

class BleScanner extends BaseScanner {
    constructor(router) {
        super(router);
        this.router = router;
        this.browser = router.browser;
        this.ipcManager = new IpcManager();
        this.isScanning = false;
        this.devices = [];
        this.selectBluetoothDevice = this.selectBluetoothDevice.bind(this);
    }

    async startScan(hwModule, config) {
        this.stopScan();
        this.setConfig(config);
        this.initScan();
        this.hwModule = hwModule;
        return await this.scan();
    }

    async selectBluetoothDevice(event, deviceList, callback) {
        event.preventDefault();
        if (!this.isScanning) {
            callback('');
        }
        const { hardware } = this.config;
        const selectedId = this.router.selectedPort;
        const result = deviceList.find(
            (device) => selectedId && device.deviceName === selectedId,
        );

        if (result) {
            callback(result.deviceId);
        } else {
            const scannedDevices = _.filter(deviceList, (device) => {
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
                .map((device) => ({
                    ...device,
                    path: device.deviceName,
                }));

            if (this.devices) {
                this.devices = [];
            }
            _.mergeWith(this.devices, scannedDevices, _.get('deviceId'));
            this.router.sendEventToMainWindow('portListScanned', this.devices);
            rendererConsole.log(this.devices);
        }
    }

    async initScan() {
        if (!this.config || this.isScanning) {
            return;
        }
        this.isScanning = true;
        this.browser.webContents.on(
            'select-bluetooth-device',
            this.selectBluetoothDevice,
        );
    }

    async scan() {
        if (!this.config) {
            return;
        }

        let scanOption = { acceptAllDevices: true };
        if (this.hwModule.getScanOptions) {
            scanOption = this.hwModule.getScanOptions() || scanOption;
        }

        // scan 이 한번 실행되면 await navigator.bluetooth.requestDevice 가 계속 이벤트를 발생시킴
        // 디바이스 객체는 렌더러에서 다루며, 직접 메인으로 가져와서 다루지 않는다.
        await this.ipcManager.invoke('scanBleDevice', scanOption);
        this.connector = await this.prepareConnector();
        return this.connector;
    }

    async prepareConnector() {
        try {
            const { hardware } = this.config;
            const connector = new Connector(this.hwModule, hardware);
            this.router.setConnector(connector);
            this.router.sendState('before_connect');
            await connector.initialize();
            this.finalizeScan();
            return connector;
        } catch (e) {
            console.error(e);
        }
    }

    finalizeScan() {
        this.stopScan();
    }

    stopScan() {
        this.browser.webContents.removeListener(
            'select-bluetooth-device',
            this.selectBluetoothDevice,
        );
        this.config = undefined;
        this.devices = [];
        this.isScanning = false;
        this.clearTimers();
    }
}

module.exports = BleScanner;
