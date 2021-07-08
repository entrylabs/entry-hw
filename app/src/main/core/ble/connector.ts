import BaseConnector from '../baseConnector';
import IpcMainManager from '../ipcMainManager';

type IBLECommandMessage = { key: string; value: string; callback?: () => void | Promise<void> };

class BleConnector extends BaseConnector {
    get commandQueueCheckDuration() {
        return 100;
    }

    private ipcManager = new IpcMainManager();
    private _requestLocalDataInterval?: number;
    private _commandQueue: IBLECommandMessage[];

    constructor(hwModule: IHardwareModule, config: IHardwareModuleConfig) {
        super(hwModule, config);

        this._requestLocalDataInterval = undefined;
        this._commandQueue = [];
    }

    // noinspection JSCheckFunctionSignatures
    async open() {
        //NOTE ble 의 bluetooth.requestDevice 는 스캐닝과 오픈을 동시에 진행하므로,
        // 해당 함수는 특별히 하는 일은 없다.
    }

    async initialize() {
        const gattProfiles = this.hwModule.getProfiles && this.hwModule.getProfiles();
        await this.ipcManager.invoke('connectBleDevice', gattProfiles);
        //TODO 통신 수립을 위한 validation 이 필요한 경우 이곳에서 처리

        this.connected = true;
    }

    connect() {
        if (!this.router) {
            throw new Error('router must be set');
        }

        if (!this.options) {
            throw new Error('config file must be set');
        }

        const router = this.router;
        const { duration = BaseConnector.DEFAULT_SLAVE_DURATION } = this.options;

        //TODO 통신 수립 이후 지속적인 통신 및 이벤트리스닝 은 이쪽

        this.ipcManager.handle('readBleDevice', (e, key, value) => {
            if (!this.connected) {
                return;
            }

            if (this.hwModule.handleLocalData) {
                this.hwModule.handleLocalData({ key, value });
            }

            router.setHandlerData();
            router.sendEncodedDataToServer();
        });
        this.ipcManager.invoke('startBleDevice');

        this._requestLocalDataInterval = setInterval(() => {
            if (this.hwModule.requestLocalData) {
                this.hwModule.requestLocalData(this._commandQueue);
            }
        }, duration);

        // noinspection JSIgnoredPromiseFromCall
        this._checkCommandQueue();
        this._sendState('connected');
    }

    async send(data: any) {
        if (this.connected) {
            try {
                await this.ipcManager.invoke('writeBleDevice', data);
            } catch (e) {
                console.error(e);
            }
        }
    }

    async close() {
        this.connected = false;
        this._commandQueue = [];
        this._requestLocalDataInterval && clearInterval(this._requestLocalDataInterval);

        if (this.hwModule && this.hwModule.disconnect) {
            this.hwModule.disconnect(this);
        }
        this.ipcManager.removeHandler('readBleDevice');
        await this.ipcManager.invoke('disconnectBleDevice');
    }

    /**
     * 지속적으로 돌면서 requestLocalData 가 큐로 추가한
     * @returns {Promise<void>}
     * @private
     */
    async _checkCommandQueue() {
        while (true) {
            if (!this.connected) {
                break;
            }

            const command = this._commandQueue.shift();
            if (command) {
                const { key, value, callback } = command;

                await this.send({ key, value });
                if (callback && typeof callback === 'function') {
                    const result = callback.bind(this.hwModule)();
                    if (result instanceof Promise) {
                        await result;
                    }
                }
            }
            await new Promise((resolve) => setTimeout(resolve, this.commandQueueCheckDuration));
        }
    }
}

export default BleConnector;
