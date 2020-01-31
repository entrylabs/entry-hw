import _ from 'lodash';
import HID, { Device } from 'node-hid';
import rendererConsole from '../rendererConsole';
import BaseScanner from '../baseScanner_ts';
import HidConnector from './connector';
import MainRouter from '../../mainRouter';

class HidScanner extends BaseScanner<HidConnector> {
    private isScanning = false;

    constructor(router: MainRouter) {
        super(router);
        HID.setDriverType('hidraw');
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
            if (!selectedDevice || !selectedDevice.path) {
                return;
            }
            return await this.prepareConnector(selectedDevice.path);
        } else {
            const pathList = _.filter<Device>(devices, (device) => {
                for (const key in device) {
                    // @ts-ignore hardware config 에서 해당 값을 왜 찾는지 알수없음
                    if (hardware[key] && hardware[key] !== device[key]) {
                        return false;
                    }
                }
                return true;
            })
                .sort((left, right) => {
                    // @ts-ignore 그럼에도 상관없음
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

    private async prepareConnector(path: string) {
        if (!this.config || !this.hwModule) {
            throw new Error('Hardware config is not found');
        }

        try {
            const { hardware } = this.config;
            const connector = new HidConnector(this.hwModule, hardware);
            connector.open(path);
            this.router.setConnector(connector);
            this.router.sendState('before_connect');
            await connector.initialize();
            this.stopScan();
            return connector;
        } catch (e) {
            throw e;
        }
    }
}

export default HidScanner;
