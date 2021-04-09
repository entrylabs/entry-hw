import { BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import ScannerManager from './core/scannerManager';
import Flasher from './core/serial/flasher';
import rendererConsole from './core/rendererConsole';
import IpcManager from './core/ipcMainManager';
import HardwareListManager from './core/hardwareListManager';
import DataHandler from './core/dataHandler';
import downloadModule from './core/functions/downloadModule';
import { EntryMessageAction, EntryStatePayload, HardwareStatement } from '../common/constants';
import createLogger from './electron/functions/createLogger';
import directoryPaths from './core/directoryPaths';
import BaseScanner from './core/baseScanner';
import BaseConnector from './core/baseConnector';
import SerialConnector from './core/serial/connector';

const nativeNodeRequire = require('./nativeNodeRequire.js');
const logger = createLogger('core/mainRouter.ts');

interface IEntryServer {
    setRouter: (router: MainRouter) => void;
    open: () => void;
    disconnectHardware: () => void;
    addRoomIdsOnSecondInstance: (roomId: string) => void;
    send: (data: any) => void;
}

/**
 * scanner, server, connector 를 총괄하는 중앙 클래스.
 * 해당 클래스는 renderer 의 router 와 통신한다.
 * 아래의 클래스들은 ipc 통신을 하지 않는다.
 *
 * scanner : 포트 검색 과 종료
 * server : entry workspace 와 통신하는 http/ws 서버
 * connector : 연결 성공 후의 실제 시리얼포트
 */
class MainRouter {
    private ipcManager: IpcManager;
    public browser: BrowserWindow; // TODO private
    private scannerManager: ScannerManager;
    private readonly server: IEntryServer;
    private hardwareListManager: HardwareListManager;
    private flasher: Flasher;

    public selectedPort?: string;
    public selectedPayload?: string;
    public currentCloudMode: number = 0;
    public currentServerRunningMode: number = 2;
    private connector?: BaseConnector;
    private config?: IHardwareConfig;
    private scanner?: BaseScanner<any>;
    private hwModule?: IHardwareModule;
    private handler?: DataHandler;

    private firmwareTryCount = 0;

    get roomIds() {
        return global.sharedObject.roomIds || [];
    }

    constructor(
        mainWindow: BrowserWindow,
        entryServer: IEntryServer,
        options: { rootAppPath?: string }
    ) {
        global.$ = require('lodash');
        if (options.rootAppPath) {
            directoryPaths.setRootAppPath(options.rootAppPath);
        }

        rendererConsole.initialize(mainWindow);
        this.ipcManager = new IpcManager(mainWindow.webContents);
        this.browser = mainWindow;
        this.server = entryServer;
        this.hardwareListManager = new HardwareListManager(this);
        this.scannerManager = new ScannerManager(this);
        this.flasher = new Flasher();

        entryServer.setRouter(this);
        entryServer.open();

        this.resetIpcEvents();
        this.registerIpcEvents();

        this.hardwareListManager.updateHardwareList();
        logger.verbose('mainRouter created');
    }

    /**
     * 펌웨어를 업로드한다.
     * 펌웨어는 커넥터가 닫힌 상태에서 작업되어야 한다. (COMPort 점유)
     * 실패시 tryFlasherNumber 만큼 반복한다. 기본값은 10번이다.
     * 로직 종료시 재스캔하여 연결을 수립한다.
     * @param firmwareName 다중 펌웨어 존재시 펌웨어명을 명시
     * @returns {Promise<void|Error>}
     */
    flashFirmware(firmwareName: IFirmwareInfo): Promise<IFirmwareInfo> {
        logger.info(`firmware flash requested. firmwareName: ${firmwareName}`);
        const connectorSerialPort =
            this.connector && (this.connector as SerialConnector).serialPort;
        // firmware type 이 copy 인 경우는 시리얼포트를 경유하지 않으므로 체크하지 않는다.
        // 그러나 config 은 필요하다.
        if (
            this.config &&
            (connectorSerialPort || (firmwareName as ICopyTypeFirmware).type === 'copy')
        ) {
            this.sendState(HardwareStatement.flash);
            const firmware = firmwareName;
            const {
                firmwareBaudRate: baudRate,
                firmwareMCUType: MCUType,
                tryFlasherNumber: maxFlashTryCount = 10,
            } = this.config;
            const lastSerialPortCOMPort = connectorSerialPort && connectorSerialPort.path;
            this.firmwareTryCount = 0;

            this.stopScan({ saveSelectedPort: true }); // 서버 통신 중지, 시리얼포트 연결 해제

            const flashFunction: () => Promise<IFirmwareInfo> = () =>
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (!lastSerialPortCOMPort) {
                            return reject(new Error('COM Port is not selected'));
                        }

                        //연결 해제 완료시간까지 잠시 대기 후 로직 수행한다.
                        this.flasher
                            .flash(firmware, lastSerialPortCOMPort, { baudRate, MCUType })
                            .then(([error, ...args]) => {
                                if (error) {
                                    rendererConsole.log('flashError', error);
                                    if (error === 'exit') {
                                        // 에러 메세지 없이 프로세스 종료
                                        reject(new Error());
                                    } else if (++this.firmwareTryCount <= maxFlashTryCount) {
                                        setTimeout(() => {
                                            flashFunction().then(resolve);
                                        }, 100);
                                    } else {
                                        console.log(error);
                                        reject(new Error('Failed Firmware Upload'));
                                    }
                                } else {
                                    logger.info('firmware flash success');
                                    resolve(firmware);
                                }
                            })
                            .catch(reject);
                    }, 500);
                });

            // 에러가 발생하거나, 정상종료가 되어도 일단 startScan 을 재시작한다.
            return flashFunction();
        } else {
            logger.warn(
                `[${firmwareName}] Hardware Device Is Not Connected. config: ${this.config}`
            );
            return Promise.reject(new Error('Hardware Device Is Not Connected'));
        }
    }

    /**
     * 연결을 끊고 새로 수립한다.
     * disconnect 혹은 lost state 상태이고, config 에 reconnect: true 인 경우 발생한다.
     * startScan 의 결과는 기다리지 않는다.
     */
    reconnect() {
        logger.info('try to hardware reconnection..');
        this.close({ saveConfig: true });

        if (this.config) {
            this.startScan(this.config);
        } else {
            logger.warn('hardware try to reconnect but hardwareConfig is undefined');
        }
    }

    /**
     * renderer 에 state 인자를 보낸다. 주로 ui 변경을 위해 사용된다.
     */
    sendState(state: string, ...args: any[]) {
        let resultState = state;
        logger.info(`hardware state changed ${state}`);
        if (this.config) {
            if (state === HardwareStatement.lost) {
                if (this.config.reconnect) {
                    this.reconnect();
                } else {
                    // 연결 잃은 후 재연결 속성 없으면 연결해제처리
                    resultState = HardwareStatement.disconnected;
                    this.close();
                }
            } else if (state === HardwareStatement.connected && this.config.moduleName) {
                this.sendActionDataToServer(EntryMessageAction.init, {
                    name: this.config.moduleName,
                });
            }
        }

        this.sendEventToMainWindow('state', resultState, ...args);
    }

    notifyCloudModeChanged(mode: number) {
        this.sendEventToMainWindow('cloudMode', mode);
        this.currentCloudMode = mode;
    }

    notifyServerRunningModeChanged(mode: number) {
        this.sendEventToMainWindow('serverMode', mode);
        this.currentServerRunningMode = mode;
    }

    sendEventToMainWindow(eventName: string, ...args: any[]) {
        if (!this.browser.isDestroyed()) {
            this.browser.webContents.send(eventName, ...args);
        }
    }

    /**
     * 현재 컴퓨터에 연결된 포트들을 검색한다.
     * 특정 시간(Scanner.SCAN_INTERVAL_MILLS) 마다 체크한다.
     * 연결성공시 'state' 이벤트가 발생된다.
     * @param config
     */
    async startScan(config: IHardwareConfig) {
        try {
            this.config = config;
            const { hardware } = config;
            const { type = 'serial' } = hardware;
            this.scanner = this.scannerManager.getScanner(type);
            if (this.scanner) {
                const moduleFilePath = directoryPaths.modules();
                this.hwModule = nativeNodeRequire(
                    path.join(moduleFilePath, config.module)
                ) as IHardwareModule;
                this.sendState(HardwareStatement.scan);
                this.scanner.stopScan();
                const connector = await this.scanner.startScan(this.hwModule, this.config);
                if (connector) {
                    logger.info(
                        `[Device Info] ${config.id} | ${
                            config?.name?.ko || config?.name?.en || 'noname'
                        }`
                    );
                    this.connector = connector;
                    connector.setRouter(this);
                    this._connect(connector);
                }
            }
        } catch (e) {
            logger.error(`startScan Error, ${e.name} ${e.message}`);
            this.sendState(HardwareStatement.scanFailed);
        }
    }

    /**
     * 클라우드 모드 동작용.
     * 신규 클라이언트 소켓생성되어 호스트에 연결되는 경우,
     * 호스트 서버에서 관리하기 위해 해당 클라이언트용 roomId 를 추가한다.
     * @param roomId
     */
    addRoomId(roomId: string) {
        logger.info(`roomId: ${roomId} is added`);
        this.server.addRoomIdsOnSecondInstance(roomId);
    }

    stopScan(option?: { saveSelectedPort?: boolean }) {
        const { saveSelectedPort = false } = option || {};
        logger.info(
            `scan stopped. selectedPort will be ${saveSelectedPort ? 'saved' : 'undefined'}`
        );

        this.server && this.server.disconnectHardware();
        this.scanner && this.scanner.stopScan();

        if (this.connector) {
            this.hwModule && this.hwModule.disconnect
                ? this.hwModule.disconnect(this.connector)
                : this.connector.close();

            this.sendState(HardwareStatement.disconnected);
        }

        !saveSelectedPort && (this.selectedPort = undefined);
    }

    /**
     * 연결이 정상적으로 된 경우 startScan 의 callback 에서 호출된다.
     * @param connector
     */
    _connect(connector: any) {
        this.connector = connector;

        /*
        해당 프로퍼티가 세팅된 경우는
        - flashfirmware 가 config 에 세팅되어있고,
        - 3000ms 동안 checkInitialData 가 정상적으로 이루어지지 않은 경우이다.
         */
        if (this.config?.firmware && this.connector?.executeFlash) {
            this.sendState(HardwareStatement.flash);
            delete (this.connector as SerialConnector).executeFlash;

            logger.info('firmware flash requested by executeFlash');
            this.flashFirmware(this.config.firmware)
                // @ts-ignore
                .finally(() => {
                    this.flasher.kill();
                    this.config && this.startScan(this.config);
                });

            return;
        }

        // 엔트리측, 하드웨어측이 정상적으로 준비된 경우
        if (this.hwModule && this.server && this.config && this.connector) {
            logger.verbose('entryServer, connector connection');
            this.handler = new DataHandler(this.config.id);
            this._connectToServer();
            this.connector.connect(); // router 설정 후 실제 기기와의 통신 시작
        }
    }

    /**
     * 엔트리 워크스페이스와의 연결 담당 로직
     *
     * @private
     */
    _connectToServer() {
        if (!this.hwModule || !this.server) {
            throw new Error('hardwareModule or Server is not found!');
        }

        const hwModule = this.hwModule;
        const server = this.server;

        if (hwModule.init) {
            hwModule.init(this.handler, this.config);
        }

        if (hwModule.setSocket) {
            hwModule.setSocket(server);
        }

        if (hwModule.setHandler) {
            hwModule.setHandler(this.handler);
        }

        this.handleServerSocketConnected();
    }

    /**
     * 엔트리와 연결된 경우 호출된다.
     * 이미 디바이스가 연결되어있는 경우 socketReconnection 함수를 호출한다.
     * 모듈화 디바이스가 연결되어 있는 경우 엔트리 서버에 블록모듈 로드를 요청한다.
     */
    handleServerSocketConnected() {
        logger.info('server socket connected');
        const hwModule = this.hwModule;
        const config = this.config;
        if (this.connector?.connected && hwModule?.socketReconnection) {
            hwModule.socketReconnection();
        }
        if (config?.moduleName) {
            this.sendActionDataToServer(EntryMessageAction.state, {
                statement: EntryStatePayload.connected,
                name: config.moduleName,
            });
        }

        this.sendEventToMainWindow('socketConnected', true);
    }

    /**
     * 엔트리와 연결이 해제된 경우 호출된다.
     * 디바이스의 reset 함수가 존재하는 경우 reset 을 호출한다.
     */
    handleServerSocketClosed() {
        logger.info('server socket closed');
        const hwModule = this.hwModule;
        const moduleConnected = this.connector?.connected;
        if (moduleConnected && hwModule?.reset) {
            hwModule.reset();
        }

        this.sendEventToMainWindow('socketConnected', false);
    }

    // 엔트리 측에서 데이터를 받아온 경우 전달
    handleServerData({ data }: { data: any }) {
        if (!this.hwModule || !this.handler || !this.config) {
            logger.warn('hardware is not connected but entry server data is received');
            return;
        }

        const hwModule = this.hwModule;
        const handler = this.handler;
        handler.decode(data);
        if (hwModule.handleRemoteData) {
            hwModule.handleRemoteData(handler);
        }
    }

    /**
     * 서버로 인코딩된 데이터를 보낸다.
     */
    sendEncodedDataToServer(data?: any) {
        if (data) {
            this.server.send(data);
        } else {
            const data = this.handler?.encode();
            if (this.server && data) {
                this.server.send(data);
            }
        }
    }

    /**
     * 단순 데이터가 아닌 통신규약을 잡기 위한 모듈화용 추가 송신용함수
     * 규약이 잘 잡히면 기존의 데이터 전송도 이쪽으로 편입할 것
     * @param action 'init', 'state' | 없으면 기존 레거시 로직으로 동작한
     * @param data
     * init 시에는 data: { name: string }
     */
    sendActionDataToServer(action: EntryMessageAction, data: any) {
        this.server.send({ action, data });
    }

    /**
     * 하드웨어 모듈의 requestRemoteData 를 통해 핸들러 내 데이터를 세팅한다.
     */
    setHandlerData() {
        this.hwModule?.requestRemoteData(this.handler);
    }

    setConnector(connector: any) {
        logger.verbose("mainRouter's connector is set");
        this.connector = connector;
    }

    /**
     *
     * @param option {Object=} true 인 경우, 포트선택했던 내역을 지우지 않는다.
     */
    close(option?: { saveSelectedPort?: boolean; saveConfig?: boolean }) {
        const { saveSelectedPort = false, saveConfig = false } = option || {};
        logger.info(
            `scan stopped. selectedPort will be ${saveSelectedPort ? 'saved' : 'undefined'}`
        );

        this.server?.disconnectHardware();
        this.stopScan(option);

        if (!saveConfig) {
            this.config = undefined;
        }
        this.hwModule = undefined;
        this.handler = undefined;

        if (!saveSelectedPort) {
            this.selectedPort = undefined;
        }
    }

    executeDriver(driverPath: string) {
        if (!this.config) {
            return;
        }

        const driverFullPath = path.join(directoryPaths.driver(), driverPath);
        logger.info(`execute driver requested. filePath : ${driverFullPath}`);
        shell.openItem(driverFullPath);
    }

    /**
     * 특정 ID 의 하드웨어를 직접 선택한다.
     * URL 커스텀 스키마의 파라미터에 의해 실행된다.
     */
    async selectHardware(id: string) {
        try {
            if (!id) {
                return;
            }
            const config = this.hardwareListManager.getHardwareById(id);
            if (config) {
                this.browser.webContents.send('selectHardware', config);
            }
        } catch (e) {
            rendererConsole.error('startScan err : ', e);
        }
    }

    private registerIpcEvents() {
        ipcMain.on('startScan', async (e, config) => {
            try {
                logger.info(`scan started. hardware config: ${JSON.stringify(config)}`);
                await this.startScan(config);
            } catch (e) {
                logger.warn(`scan error : ${e.title}, ${e.message}`);
                rendererConsole.error('startScan err : ', e);
            }
        });
        ipcMain.on('selectPort', (e, portName) => {
            logger.info(`port select from port selection window : ${portName}`);
            this.selectedPort = portName;
        });
        ipcMain.on('handshakePayload', (e, payload) => {
            this.selectedPayload = payload;
        });
        ipcMain.on('stopScan', () => {
            logger.info('scan stopped');
            this.stopScan();
        });
        ipcMain.on('close', () => {
            this.close();
            logger.verbose('mainRouter closed');
        });
        ipcMain.on('executeDriver', (e, driverPath) => {
            this.executeDriver(driverPath);
        });
        ipcMain.on('getCurrentServerModeSync', (e) => {
            e.returnValue = this.currentServerRunningMode;
        });
        ipcMain.on('getBaseModulePath', (e) => {
            e.returnValue = directoryPaths.modules();
        });
        ipcMain.on('getCurrentCloudModeSync', (e) => {
            e.returnValue = this.currentCloudMode;
        });
        ipcMain.on('requestHardwareListSync', (e) => {
            e.returnValue = this.hardwareListManager.allHardwareList;
        });
        ipcMain.handle('requestDownloadModule', async (e, moduleName) => {
            await this.requestHardwareModule(moduleName);
        });
        ipcMain.handle('requestFlash', async (e, firmwareName: IFirmwareInfo) => {
            await this.flashFirmware(firmwareName);
            this.flasher.kill();
            this.config && this.startScan(this.config);
        });

        logger.verbose('EntryHW ipc event registered');
    }

    async requestHardwareModule(moduleName: string) {
        logger.info(`hardware module requested from online, moduleName : ${moduleName}`);
        const moduleConfig = await downloadModule(moduleName);
        await this.hardwareListManager.updateHardwareList([moduleConfig]);
    }

    private resetIpcEvents() {
        ipcMain.removeAllListeners('startScan');
        ipcMain.removeAllListeners('selectPort');
        ipcMain.removeAllListeners('stopScan');
        ipcMain.removeAllListeners('close');
        ipcMain.removeAllListeners('executeDriver');
        ipcMain.removeAllListeners('getCurrentServerModeSync');
        ipcMain.removeAllListeners('getCurrentCloudModeSync');
        ipcMain.removeAllListeners('requestHardwareListSync');
        ipcMain.removeHandler('requestDownloadModule');
        ipcMain.removeHandler('requestFlash');
        logger.verbose('EntryHW ipc event all cleared');
    }
}

export default MainRouter;
module.exports = MainRouter;
