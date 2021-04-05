import Readline from '@serialport/parser-readline';
import Delimiter from '@serialport/parser-delimiter';
import SerialPort from 'serialport';
import Stream from 'stream';
import BaseConnector from '../baseConnector';
import { HardwareStatement } from '../../../common/constants';
import createLogger from '../../electron/functions/createLogger';

const logger = createLogger('core/SerialConnector.ts');

SerialPort.Binding = require('@serialport/bindings');

/**
 * 스캔이 끝난 후, 선택된 포트로 시리얼포트를 오픈하는 클래스
 * 스캐너에서 open, initialize 가 일어나고,
 * 라우터에서 setRouter, connect 를 거쳐 통신한다.
 */
class SerialConnector extends BaseConnector {
    public serialPort?: SerialPort; // TODO private 로 전환, mainRouter 에서 플래싱에 사용중
    private serialPortParser?: Stream.Duplex;
    // 현재상태 체크
    private isSending = false;
    private lostTimer: number;
    private flashFirmware?: number;
    private slaveInitRequestInterval?: number;
    private connectionLostTimer?: number;
    private requestLocalDataInterval?: number;
    private advertiseInterval?: number;

    constructor(hwModule: IHardwareModule, hardwareOptions: IHardwareModuleConfig) {
        super(hwModule, hardwareOptions);

        this.connected = false;
        this.received = false;

        this.lostTimer = hardwareOptions.lostTimer || SerialConnector.DEFAULT_CONNECT_LOST_MILLS;
        this.serialPort = undefined;
    }

    static get DEFAULT_CONNECT_LOST_MILLS() {
        return 1000;
    }

    static get DEFAULT_SLAVE_DURATION() {
        return 1000;
    }

    open(port: string) {
        return new Promise((resolve, reject) => {
            const hardwareOptions = this.options;
            this.lostTimer =
                hardwareOptions.lostTimer || SerialConnector.DEFAULT_CONNECT_LOST_MILLS;

            const serialPort = new SerialPort(port, this._makeSerialPortOptions(hardwareOptions));
            this.serialPort = serialPort;

            const { delimiter, byteDelimiter } = hardwareOptions;
            if (delimiter) {
                this.serialPortParser = serialPort.pipe(new Readline({ delimiter }));
            } else if (byteDelimiter) {
                this.serialPortParser = serialPort.pipe(
                    new Delimiter({
                        delimiter: byteDelimiter,
                        includeDelimiter: true,
                    })
                );
            }
            logger.info(`serialport try to open with ${delimiter || byteDelimiter || 'no parser'}`);

            serialPort.on('error', reject);
            serialPort.on('open', (error) => {
                logger.info('serialport opened');
                serialPort.removeAllListeners('open');
                if (error) {
                    reject(error);
                } else {
                    resolve(this.serialPort);
                }
            });
        });
    }

    /**
     * checkInitialData, requestInitialData 가 둘다 존재하는 경우 handShake 를 진행한다.
     * 둘 중 하나라도 없는 경우는 로직을 종료한다.
     * 만약 firmwareCheck 옵션이 활성화 된 경우면 executeFlash 를 세팅하고 종료한다.
     * 이 플래그는 라우터에서 flasher 를 바로 사용해야하는지 판단한다.
     *
     * @returns {Promise<void>} 준비완료 or 펌웨어체크 준비
     */
    initialize(handshakePayload?: () => string | undefined) {
        return new Promise((resolve, reject) => {
            if (!this.serialPort) {
                logger.error('serailport is not found but initialize() opened');
                return reject(new Error('serialport is not found'));
            }

            const {
                control,
                duration = SerialConnector.DEFAULT_SLAVE_DURATION,
                firmwarecheck,
            } = this.options;
            const hwModule = this.hwModule;
            const serialPortReadStream = this.serialPortParser
                ? this.serialPortParser
                : this.serialPort;

            const runAsMaster = () => {
                logger.verbose('hardware handShake as Master mode');
                serialPortReadStream.on('data', (data) => {
                    logger.verbose(`handShake data ${data.toString()}`);
                    const result = hwModule.checkInitialData(data, this.options);

                    if (result === undefined) {
                        this.send(hwModule.requestInitialData());
                    } else {
                        serialPortReadStream.removeAllListeners('data');
                        this.flashFirmware && clearTimeout(this.flashFirmware);

                        logger.verbose(`handShake: result is ${result}`);
                        if (result) {
                            if (hwModule.setSerialPort) {
                                hwModule.setSerialPort(this.serialPort);
                            }
                            this.connected = true;
                            logger.info('handShake:master completed');
                            resolve();
                        } else {
                            logger.error('handShake: Invalid hardware');
                            reject(new Error('Invalid hardware'));
                        }
                    }
                });
            };

            const runAsSlave = () => {
                logger.verbose('hardware handShake as Slave mode');

                // 최소 한번은 requestInitialData 전송을 강제
                const firstRequestData = hwModule.requestInitialData(
                    this.serialPort,
                    handshakePayload && handshakePayload()
                );
                this.send(firstRequestData);
                logger.verbose(`[repeat..]handShake request data ${firstRequestData}`);
                this.slaveInitRequestInterval = setInterval(() => {
                    const requestData = hwModule.requestInitialData(
                        this.serialPort,
                        handshakePayload && handshakePayload()
                    );
                    this.send(requestData);
                }, duration);

                // control type is slave
                serialPortReadStream.on('data', (data) => {
                    console.log('Received :', data);
                    logger.verbose(`handShake response data ${data}`);
                    const result = hwModule.checkInitialData(data, this.options);

                    if (result !== undefined) {
                        serialPortReadStream.removeAllListeners('data');
                        this.flashFirmware && clearTimeout(this.flashFirmware);
                        this.slaveInitRequestInterval &&
                            clearInterval(this.slaveInitRequestInterval);

                        logger.verbose(`handShake: result is ${result}`);
                        if (result) {
                            if (hwModule.setSerialPort) {
                                hwModule.setSerialPort(this.serialPort);
                            }
                            if (hwModule.resetProperty) {
                                this.send(hwModule.resetProperty());
                            }
                            this.connected = true;
                            logger.info('handShake:slave completed');
                            resolve();
                        } else {
                            logger.error('handShake: Invalid hardware');
                            reject(new Error('Invalid hardware'));
                        }
                    }
                });
            };

            if (firmwarecheck) {
                logger.info('firmwarcheck property set. will flash firmware soon..');
                this.flashFirmware = setTimeout(() => {
                    if (this.serialPort) {
                        this.serialPortParser?.removeAllListeners('data');
                        this.serialPort.removeAllListeners('data');
                        this.executeFlash = true;
                    }
                    resolve();
                }, 3000);
            }

            if (hwModule.checkInitialData && hwModule.requestInitialData) {
                if (control === 'master') {
                    runAsMaster();
                } else {
                    runAsSlave();
                }
            } else {
                resolve();
            }
        });
    }

    connect() {
        if (!this.router) {
            throw new Error('router must be set');
        }

        if (!this.serialPort) {
            throw new Error('serialPort must be open');
        }

        const router = this.router;
        const serialPort = this.serialPort;
        const hwModule = this.hwModule;
        const {
            control,
            duration = SerialConnector.DEFAULT_SLAVE_DURATION,
            advertise,
            softwareReset,
            commType,
        } = this.options;

        this.connected = false;
        this.received = true;

        // 연결 중 상태임을 알림.
        this._sendState('connect');
        if (hwModule.connect) {
            hwModule.connect();
        }

        if (softwareReset) {
            serialPort.set({ dtr: false });
            setTimeout(() => {
                serialPort.set({ dtr: true });
            }, 1000);
        }

        if (hwModule.afterConnect) {
            hwModule.afterConnect(this, (state: string) => {
                this.router?.sendState(state);
            });
        }

        const serialPortReadStream = this.serialPortParser
            ? this.serialPortParser
            : this.serialPort;

        logger.info('connected successfully. device start normal data exchange');
        // 기기와의 데이터 통신 수립
        serialPortReadStream.on('data', (data) => {
            if (!hwModule.validateLocalData || hwModule.validateLocalData(data)) {
                if (!this.connected) {
                    this._sendState('connected');
                }
                this.connected = true;
                this.received = true;

                if (hwModule.handleLocalData) {
                    hwModule.handleLocalData(data);
                }

                // 서버로 데이터를 요청한다.
                router.setHandlerData();
                router.sendEncodedDataToServer();

                // 마스터모드인 경우, 데이터를 받자마자 디바이스로 데이터를 보낸다.
                if (control === 'master' && hwModule.requestLocalData) {
                    const data = hwModule.requestLocalData();
                    data && this.send(data);
                }
            }
        });
        serialPort.on('disconnect', () => {
            logger.info('device serial disconnected');
            this.close();
            this._sendState('disconnected');
        });

        // 디바이스 연결 잃어버린 상태에 대한 관리를 모듈에 맡기거나, 직접 관리한다.
        if (hwModule.lostController) {
            logger.info('device lostController set. no lostTimer use');
            hwModule.lostController(this, router.sendState.bind(router));
        } else {
            /*
             * this.lostTimer 타임 안에 데이터를 수신해야한다. 그렇지 않으면 연결해제처리한다.
             */
            this.connectionLostTimer = setInterval(() => {
                if (this.connected) {
                    if (!this.received) {
                        this.connected = false;
                        this._sendState(HardwareStatement.lost);
                    }
                    this.received = false;
                }
            }, this.lostTimer);
        }
        if (duration && control !== 'master') {
            this.requestLocalDataInterval = setInterval(() => {
                if (hwModule.requestLocalData) {
                    const data = hwModule.requestLocalData();
                    data && this.send(data);
                }
                if (hwModule.getProperty) {
                    const data = hwModule.getProperty();
                    if (data) {
                        this.send(data);
                    }
                }
            }, duration);
        }

        if (advertise) {
            logger.info('advertise interval set');
            this.advertiseInterval = setInterval(() => {
                router.sendEncodedDataToServer();
            }, advertise);
        }
    }

    _clear() {
        this.connected = false;
        this.received = false;
        if (this.connectionLostTimer) {
            clearInterval(this.connectionLostTimer);
            this.connectionLostTimer = undefined;
        }
        if (this.requestLocalDataInterval) {
            clearInterval(this.requestLocalDataInterval);
            this.requestLocalDataInterval = undefined;
        }
        if (this.advertiseInterval) {
            clearInterval(this.advertiseInterval);
            this.advertiseInterval = undefined;
        }

        if (this.flashFirmware) {
            clearTimeout(this.flashFirmware);
            this.flashFirmware = undefined;
        }

        if (this.slaveInitRequestInterval) {
            clearInterval(this.slaveInitRequestInterval);
            this.slaveInitRequestInterval = undefined;
        }

        if (this.serialPort) {
            this.serialPort.removeAllListeners();
        }

        if (this.serialPortParser) {
            this.serialPortParser.removeAllListeners();
        }
    }

    close() {
        this._clear();
        if (this.serialPort && this.serialPort.isOpen) {
            this.serialPort.close((e) => {
                logger.info(`serialport closed, ${e?.name}`);
                this.serialPort = undefined;
            });
        }
    }

    /**
     * 시리얼포트로 연결된 디바이스에 데이터를 보낸다.
     * @param data
     * @param callback
     */
    send(data: any, callback?: () => void) {
        if (this.serialPort && this.serialPort.isOpen && data && !this.isSending) {
            this.isSending = true;
            let resultData = data;
            if (this.options.commType !== 'ascii') {
                if (this.options.stream === 'string') {
                    resultData = Buffer.from(data, 'utf8');
                }
            }

            this.serialPort.write(resultData, this.options.commType, () => {
                if (this.serialPort) {
                    this.serialPort.drain(() => {
                        this.received = true;
                        this.isSending = false;
                        callback && callback();
                    });
                }
            });
        }
    }

    private _makeSerialPortOptions(
        serialPortOptions: IHardwareModuleConfig
    ): SerialPort.OpenOptions {
        const _options: Partial<SerialPort.OpenOptions> = {
            autoOpen: true,
            baudRate: 9600,
            parity: 'none',
            dataBits: 8,
            stopBits: 1,
            highWaterMark: 65536, // size of read, write buffer
        };

        if (serialPortOptions.flowControl === 'hardware') {
            _options.rtscts = true;
        } else if (serialPortOptions.flowControl === 'software') {
            _options.xon = true;
            _options.xoff = true;
        }

        Object.assign(_options, serialPortOptions);
        return _options;
    }
}

export default SerialConnector;
