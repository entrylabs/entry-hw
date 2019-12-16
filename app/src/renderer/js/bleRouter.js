const { ipcRenderer, shell, remote } = require('electron');
const IpcManager = require('./IpcManager');

class BleRouter {
    constructor() {
        this.ipcManager = new IpcManager();
        this.device;
        this.module;
        this.setHandler();
    }

    setHandler() {
        this.ipcManager.handle(
            'scanBleDevice',
            async (event, hardware, rendererModule) => {
                try {
                    this.module = require(`../../../modules/${rendererModule}`);
                    let options;
                    if (this.module.getOptions) {
                        options = this.module.getOptions();
                    } else {
                        options = (hardware && hardware.options) || {
                            acceptAllDevices: true,
                        };
                    }
                    const device = await navigator.bluetooth.requestDevice(
                        options,
                    );
                    this.device = device;
                    this.module.device = device;
                    return device.id;
                } catch (e) {
                    console.error(e);
                    return false;
                }
            },
        );

        this.ipcManager.handle('connectBleDevice', async () => {
            if (this.module.connect) {
                await this.module.connect();
            }
            return true;
        });

        this.ipcManager.handle('disconnectBleDevice', async () => {
            try {
                if (this.module.connect) {
                    await this.module.disconnect();
                }
                return true;
            } catch (e) {
                console.error(e);
                return false;
            }
        });
    }
}
module.exports = BleRouter;
