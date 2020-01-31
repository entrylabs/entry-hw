import _ from 'lodash';
import rendererConsole from '../rendererConsole';
import IpcManager from '../ipcMainManager';
import BaseScanner from '../baseScanner';
import BleConnector from './connector';
import MainRouter from '../../mainRouter';
import { BrowserWindow } from 'electron';

class BleScanner extends BaseScanner<BleConnector> {
    private isScanning = false;
    private ipcManager = new IpcManager();
    private devices = [];
    private browser: BrowserWindow;

    constructor(router: MainRouter) {
        super(router);
        this.browser = router.browser;
        this.devices = [];
        this.selectBluetoothDevice = this.selectBluetoothDevice.bind(this);
    }

    async startScan(hwModule: IHardwareModule, config: IHardwareConfig) {
        this.stopScan();
        this.config = config;
        this.hwModule = hwModule;
        this.initScan();
        return await this.intervalScan();
    }

    async selectBluetoothDevice(event: Event, deviceList: any[], callback: (id: string) => void) {
        event.preventDefault();
        if (!this.isScanning || !this.config) {
            callback('');
            return;
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
                    // @ts-ignore
                    if (hardware[key] && device[key].indexOf(hardware[key]) === -1) {
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

            // @ts-ignore
            _.mergeWith(this.devices, scannedDevices, _.get('deviceId'));
            this.router.sendEventToMainWindow('portListScanned', this.devices);
            rendererConsole.log(this.devices);
        }
    }

    initScan() {
        if (!this.config || this.isScanning) {
            return;
        }
        this.isScanning = true;
        this.browser.webContents.on(
            'select-bluetooth-device',
            this.selectBluetoothDevice,
        );
    }

    async intervalScan() {
        if (!this.config || !this.hwModule) {
            return;
        }

        // TODO type 화
        let scanOption: {
            filters?: any[];
            optionalServices?: string[];
            acceptAllDevices?: boolean;
        } = { acceptAllDevices: true };
        if (this.hwModule.getScanOptions) {
            scanOption = this.hwModule.getScanOptions() || scanOption;
        }

        // scan 이 한번 실행되면 await navigator.bluetooth.requestDevice 가 계속 이벤트를 발생시킴
        // 디바이스 객체는 렌더러에서 다루며, 직접 메인으로 가져와서 다루지 않는다.
        await this.ipcManager.invoke('scanBleDevice', scanOption);
        if (this.isScanning) {
            return await this.prepareConnector();
        }
    }

    async prepareConnector() {
        if (!this.config || !this.hwModule) {
            throw new Error('config or hwModule is not found');
        }

        try {
            const { hardware } = this.config;
            const connector = new BleConnector(this.hwModule, hardware);
            this.router.setConnector(connector);
            this.router.sendState('before_connect');
            await connector.initialize();
            this.stopScan();
            return connector;
        } catch (e) {
            console.error(e);
        }
    }

    stopScan() {
        this.browser.webContents.removeListener(
            'select-bluetooth-device',
            this.selectBluetoothDevice,
        );

        this.config = undefined;
        this.devices = [];
        this.isScanning = false;
    }
}

module.exports = BleScanner;
