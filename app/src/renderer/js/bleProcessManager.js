const IpcRendererManager = require('./ipcManager');

class BleProcessManager {
    constructor() {
        this.ipcManager = new IpcRendererManager();

        /**
         * @type {BluetoothDevice}
         */
        this.connectedDevice = undefined;

        /**
         * @type {BluetoothRemoteGATTService[]}
         */
        this.bleServices = undefined;

        /**
         * @type {{key: string, value: BluetoothRemoteGATTCharacteristic}[]}
         */
        this._readEvents = [];

        /**
         * @type {{key: string, value: BluetoothRemoteGATTCharacteristic}[]}
         */
        this._writeEvents = [];

        this._initialize();
    }

    _initialize() {
        this.ipcManager.handle('scanBleDevice', async (event, options) => {
            try {
                this.connectedDevice = await navigator.bluetooth.requestDevice(options);

                const device = this.connectedDevice;
                !device.gatt.connected && await device.gatt.connect();

                console.log(this.connectedDevice);

                return this.connectedDevice.id;
            } catch (e) {
                console.error(e);
                // TODO 에러핸들
            }
        });

        /**
         * {
         *     service: UUID;
         *     characteristics: {
         *         key: string
         *         uuid: string;
         *         type: 'read' | 'write' = 'read'
         *     }
         * }[]
         */
        this.ipcManager.handle('connectBleDevice', async (e, profiles) => {
            if (this.connectedDevice) {
                this.bleServices = await this.connectedDevice.gatt.getPrimaryServices();

                /**
                 * 등록된 key 목록 요약본. 결과로 제출된다.
                 * @type {{read: string[], write: string[]}}
                 */
                const summary = { write: [], read: [] };

                // 모든 서비스 등록
                await Promise.all(profiles.map(async ({ service, characteristics }) => {
                    const targetService = this.bleServices
                        .find((bleService) => bleService.uuid === service);

                    if (targetService) {
                        // 모든 특성 등록
                        await Promise.all(
                            characteristics.map(async ({ key, uuid, type = 'read' }) => {
                                const characteristic = await targetService.getCharacteristic(uuid);
                                if (type === 'read') {
                                    await this._registerReadCharacteristic(key, characteristic);
                                } else if (type === 'write') {
                                    this._registerWriteCharacteristic(key, characteristic);
                                }
                                summary[type].push(key);
                            }),
                        );
                    }
                }));

                return summary;
            } else {
                // TODO throw error
            }
        });

        /**
         * {
         *     key: string;
         *     value: any;
         * }
         */
        this.ipcManager.handle('writeBleDevice', async (e, { key, value }) => {
            if (!key) {
                return;
            }

            const characteristic = this._writeEvents.find((listener) => listener.key === key);

            if (characteristic) {
                await characteristic.value.writeValue(this._encodeString(value));
            } else {
                console.log(`characteristic not found. target: ${key}, value: ${value}`);
            }
        });
    }

    /**
     *
     * @param key {string}
     * @param characteristic {BluetoothRemoteGATTCharacteristic}
     * @private
     */
    async _registerReadCharacteristic(key, characteristic) {
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', ({ target }) => {
            this.ipcManager.invoke('readBleDevice', key, target.value);
        });

        this._readEvents.push({
            key, value: characteristic,
        });
    }

    /**
     *
     * @param key {string}
     * @param characteristic {BluetoothRemoteGATTCharacteristic}
     * @private
     */
    _registerWriteCharacteristic(key, characteristic) {
        this._writeEvents.push({ key, value: characteristic });
    }

    _encodeString(text) {
        const buffer = new ArrayBuffer(text.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < text.length; i++) {
            view[i] = text.charCodeAt(i);
        }
        return buffer;
    }
}

module.exports = BleProcessManager;

