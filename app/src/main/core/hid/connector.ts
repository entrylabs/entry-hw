import HID, { HID as HIDImpl } from 'node-hid';
import BaseConnector from '../baseConnector';

class HidConnector extends BaseConnector {
    private registeredIntervals: number[] = [];
    private requestInitialDataInterval?: number;
    private requestLocalDataInterval?: number;
    private device?: HIDImpl;

    open(path: string) {
        this.connected = false;
        this.registeredIntervals = [];
        this.device = new HID.HID(path);
        return Promise.resolve(this.device);
    }

    initialize() {
        return new Promise((resolve, reject) => {
            const hwModule = this.hwModule;
            if (this.device && hwModule.requestInitialData && hwModule.checkInitialData) {
                this.device.on('data', (data) => {
                    const result = hwModule.checkInitialData(data, this.options);
                    if (result === undefined) {
                        this.send(hwModule.requestInitialData());
                    } else {
                        this.device!.removeAllListeners('data');
                        this.requestInitialDataInterval &&
                            clearInterval(this.requestInitialDataInterval);
                        if (result) {
                            if (hwModule.registerIntervalSend) {
                                hwModule.registerIntervalSend(
                                    this._registerIntervalSend.bind(this)
                                );
                            }
                            resolve();
                        } else {
                            reject(new Error('Invalid hardware'));
                        }
                    }
                    console.log(result, data);
                });
                this.device.on('error', reject);
                // this.send(hwModule.requestInitialData());
                this.requestInitialDataInterval = setInterval(() => {
                    this.send(hwModule.requestInitialData());
                }, 1000);
            } else {
                resolve();
            }
        });
    }

    /**
     * 디바이스에 데이터를 보낸다. write 는 기본적으로 동기동작한다.
     * 따로 입력없이 write 하는 경우, buffer[0] 을 featureReport 라고 간주하므로 주의
     * @see https://github.com/node-hid/node-hid#devicewritedata
     */
    send(data: any) {
        if (this.device && data) {
            if (typeof data === 'boolean') {
                data = new Buffer([1]);
            }
            try {
                // TODO 현재는 EV3 만 쓰고 이는 featureReport 가 따로 없기 때문에 보류.
                // const writer =
                //     type === 'feature'
                //         ? this.device.sendFeatureReport
                //         : this.device.write;
                this.device.write(data);
            } catch (e) {
                console.error(e);
            }
        }
    }

    connect() {
        if (!this.router) {
            throw new Error('router must be set');
        }

        if (!this.device) {
            throw new Error('device must be set');
        }

        const router = this.router;
        const hwModule = this.hwModule;
        const { duration = BaseConnector.DEFAULT_SLAVE_DURATION } = this.options;

        if (hwModule.connect) {
            hwModule.connect();
        }
        this._sendState('connect');

        if (hwModule.afterConnect) {
            hwModule.afterConnect(this);
        }

        this.device.on('data', (data) => {
            if (!hwModule.validateLocalData || hwModule.validateLocalData(data)) {
                if (!this.connected) {
                    this.connected = true;
                    this._sendState('connected');
                }

                this.received = true;
                if (hwModule.handleLocalData) {
                    hwModule.handleLocalData(data);
                }

                // 서버로 데이터를 요청한다.
                router.setHandlerData();
                router.sendEncodedDataToServer();
            }
        });

        this.device.on('error', (e) => {
            console.log('ERROR', e);
            this.close();
            this._sendState('disconnected');
        });

        if (hwModule.requestLocalData) {
            this.requestLocalDataInterval = setInterval(() => {
                this.send(hwModule.requestLocalData());
            }, duration);
        }
    }

    close() {
        this.connected = false;
        this.registeredIntervals.forEach(clearInterval);
        this.requestLocalDataInterval && clearInterval(this.requestLocalDataInterval);
        this.requestInitialDataInterval && clearInterval(this.requestInitialDataInterval);
        if (this.device) {
            this.device.removeAllListeners();
            this.device.close();
        }
    }

    private _registerIntervalSend(sendDataFunction: () => any, interval: number) {
        this.registeredIntervals.push(
            setInterval(() => {
                const data = sendDataFunction();
                data && this.send(data);
            }, interval)
        );
    }
}

export default HidConnector;
