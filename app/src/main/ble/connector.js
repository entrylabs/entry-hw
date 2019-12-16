const BaseConnector = require('../BaseConnector');

class BleConnector extends BaseConnector {
    constructor(hwModule, hardware, ipcManager) {
        super(hwModule, hardware);
        this.ipcManager = ipcManager;
    }

    async initialize() {}

    send(data) {
        if (this.connected) {
            try {
                return this.device.write(data);
            } catch (e) {
                console.error(e);
            }
        }
    }

    async connect() {
        if (!this.router) {
            throw new Error('router must be set');
        }
        this.device = await this.ipcManager.invoke('connectBleDevice');
        this._sendState('connect');
    }

    clear() {
        this.connected = false;
    }

    async close() {
        this.clear();
        await this.ipcManager.invoke('disconnectBleDevice');
    }
}

module.exports = BleConnector;
