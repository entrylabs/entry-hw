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
                const bluetoothOptions = options | { acceptAllDevices: true };
                this.connectedDevice = await navigator.bluetooth.requestDevice(bluetoothOptions);

                const device = this.connectedDevice;
                !device.gatt.connected && await device.gatt.connect();

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
         * }
         */
        this.ipcManager.handle('connectBleDevice', async ({ service, characteristics }) => {
            if (this.connectedDevice) {
                this.bleServices = await this.connectedDevice.gatt.getPrimaryServices();

                const targetService = this.bleServices
                    .find((bleService) => bleService.uuid === service);

                if (targetService) {
                    await Promise.all(
                        characteristics.map(async ({ key, uuid, type = 'read' }) => {
                            const characteristic = await targetService.getCharacteristic(uuid);
                            if (type === 'read') {
                                await this._registerReadCharacteristic(key, characteristic);
                            } else if (type === 'write') {
                                this._registerWriteCharacteristic(key, characteristic);
                            }
                        }),
                    );
                }
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
        this.ipcManager.handle('writeBleDevice', async ({ key, value }) => {
            const characteristic = this._writeEvents.find((listener) => listener.key === key);

            if (characteristic) {
                await characteristic.value.writeValue(value);
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
            console.log(target && target.value.getInt8(0));
            this.ipcManager.invoke('readBleDevice', target.value);
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
}
