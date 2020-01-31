import IpcRendererManager from './ipcManager';

class BleProcessManager {
    private ipcManager = new IpcRendererManager();
    private connectedDevice?: BluetoothDevice;
    private bleServices?: BluetoothRemoteGATTService[];
    private _readEvents: { key: string; value: BluetoothRemoteGATTCharacteristic }[] = [];
    private _writeEvents: { key: string, value: BluetoothRemoteGATTCharacteristic }[] = [];
    private connected = false; // HW 모듈과 커뮤니케이션 준비가 되었는지 여부

    constructor() {
        this._initialize();
    }

    private _initialize() {
        this.ipcManager.handle('scanBleDevice', async (event, options) => {
            try {
                this.connectedDevice = await navigator.bluetooth.requestDevice(options);

                const device = this.connectedDevice;
                !(device?.gatt?.connected) && await device?.gatt?.connect();

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
        this.ipcManager.handle('connectBleDevice', async (e, profiles: IBleProfileInformation[]) => {
            if (this.connectedDevice && this.connectedDevice.gatt) {
                this.bleServices = await this.connectedDevice.gatt.getPrimaryServices() || [];

                /**
                 * 등록된 key 목록 요약본. 결과로 제출된다.
                 */
                const summary: { read: string[]; write: string[] } = { write: [], read: [] };

                // 모든 서비스 등록
                await Promise.all(profiles.map(async ({ service, characteristics }) => {
                    const targetService = this.bleServices!.find((bleService) => bleService.uuid === service);

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

        this.ipcManager.handle('writeBleDevice', async (e, { key, value }: { key: string; value: any; }) => {
            if (!key) {
                console.log('key is not present');
                return;
            }

            const characteristic = this._writeEvents.find((listener) => listener.key === key);

            if (characteristic) {
                await characteristic.value.writeValue(this._encodeString(value));
            } else {
                console.log(`characteristic not found. target: ${key}, value: ${value}`);
            }
        });

        this.ipcManager.handle('disconnectBleDevice', async (e) => {
            this._writeEvents = [];
            this.connectedDevice?.gatt?.disconnect();
            this.connectedDevice = undefined;
            this.bleServices = undefined;
            this.connected = false;
        });

        this.ipcManager.handle('startBleDevice', (e) => {
            this.connected = true;
        });
    }

    private async _registerReadCharacteristic(key: string, characteristic: BluetoothRemoteGATTCharacteristic) {
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', ({ target }: any) => {
            this.connected && this.ipcManager.invoke('readBleDevice', key, target.value);
        });

        // noinspection JSCheckFunctionSignatures
        this._readEvents.push({ key, value: characteristic });
    }

    private _registerWriteCharacteristic(key: string, characteristic: BluetoothRemoteGATTCharacteristic) {
        this._writeEvents.push({ key, value: characteristic });
    }

    private _encodeString(text: string) {
        const buffer = new ArrayBuffer(text.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < text.length; i++) {
            view[i] = text.charCodeAt(i);
        }
        return buffer;
    }
}

export default BleProcessManager;

