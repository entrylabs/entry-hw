const BaseConnector = require('../BaseConnector');
const _ipcManager = require('../utils/ipcMainManager');

class BleConnector extends BaseConnector {
    constructor(hwModule, hardware) {
        super(hwModule, hardware);
        this._ipcManager = new _ipcManager();

        this._requestLocalDataInterval = undefined;
        this._checkCommandQueueInterval = undefined;
        this._commandQueue = [];
    }

    // noinspection JSCheckFunctionSignatures
    async open() {
        //NOTE ble 의 bluetooth.requestDevice 는 스캐닝과 오픈을 동시에 진행하므로,
        // 해당 함수는 특별히 하는 일은 없다.
    }

    async initialize() {
        const gattProfiles = this.hwModule.getProfiles && this.hwModule.getProfiles();
        await this._ipcManager.invoke('connectBleDevice', gattProfiles);
        //TODO 통신 수립을 위한 validation 이 필요한 경우 이곳에서 처리

        this.connected = true;
    }

    connect() {
        if (!this.router) {
            throw new Error('router must be set');
        }

        const router = this.router;

        //TODO 통신 수립 이후 지속적인 통신 및 이벤트리스닝 은 이쪽

        this._ipcManager.handle('readBleDevice', (e, key, value) => {
            if (!this.connected) {
                this.connected = true;
                this._sendState('connected');
            }

            if (this.hwModule.handleLocalData) {
                this.hwModule.handleLocalData(key, value);
            }

            router.setHandlerData();
            router.sendEncodedDataToServer();
        });

        this._requestLocalDataInterval = setInterval(() => {
            if (this.hwModule.requestLocalData) {
                this.hwModule.requestLocalData(this._commandQueue);
            }
        }, 100);

        // noinspection JSIgnoredPromiseFromCall
        this._checkCommandQueue();
        this._sendState('connected');
    }


    send(data) {
        if (this.connected) {
            try {
                return this.device.write(data);
            } catch (e) {
                console.error(e);
            }
        }
    }

    async close() {
        this.connected = false;
        this._requestLocalDataInterval && clearInterval(this._requestLocalDataInterval);
        this._checkCommandQueueInterval && clearInterval(this._checkCommandQueueInterval);

        await this._ipcManager.invoke('disconnectBleDevice');
    }

    /**
     * 지속적으로 돌면서 requestLocalData 가 큐로 추가한
     * @returns {Promise<void>}
     * @private
     */
    async _checkCommandQueue() {
        if (!this.connected) {
            return;
        }

        const command = this._commandQueue.shift();
        if (command) {
            const { key, value, callback } = command;

            await this._ipcManager.invoke('writeBleDevice', { key, value });
            if (callback) {

            }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this._checkCommandQueue();
    }
}

module.exports = BleConnector;
