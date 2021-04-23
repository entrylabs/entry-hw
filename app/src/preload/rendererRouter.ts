import { ipcRenderer, remote, ipcMain, webFrame, shell } from 'electron';
import { HardwareStatement, RunningModeTypes } from '../common/constants';

/**
 * 렌더러 비즈니스로직을 담은 클래스.
 * 해당 클래스는 preload 페이즈에서 선언되므로 nodejs, electron 관련 import가 가능
 */
class RendererRouter {
    private _hardwareList: IHardwareConfig[] = [];
    public currentState = HardwareStatement.disconnected;
    public serverMode = RunningModeTypes.server;

    get hardwareList() {
        this.refreshHardwareModules();
        return this._hardwareList;
    }

    get baseModulePath() {
        return ipcRenderer.sendSync('getBaseModulePath');
    }

    get priorHardwareList(): string[] {
        return (JSON.parse(localStorage.getItem('hardwareList') as string) || []).reverse();
    }

    get sharedObject(): ISharedObject {
        return ipcRenderer.sendSync('getSharedObject');
    }

    get currentWindow() {
        return remote.getCurrentWindow();
    }

    constructor() {
        const initialServerMode =
            ipcRenderer.sendSync('getCurrentServerModeSync') || RunningModeTypes.server;

        this.consoleWriteServerMode(initialServerMode);

        ipcRenderer.removeAllListeners('hardwareListChanged');
        ipcRenderer.removeAllListeners('hardwareCloseConfirm');
        ipcRenderer.removeAllListeners('serverMode');
        ipcRenderer.on('hardwareListChanged', this.refreshHardwareModules.bind(this));
        ipcRenderer.on('hardwareCloseConfirm', this.confirmHardwareClose.bind(this));
        ipcRenderer.on('serverMode', (event, mode) => {
            this.consoleWriteServerMode(mode);
        });
        webFrame.setZoomFactor(1.0);
    }

    startScan(hardware: IHardwareConfig) {
        ipcRenderer.send('startScan', hardware);
    }

    stopScan() {
        ipcRenderer.send('stopScan');
    }

    close() {
        ipcRenderer.send('close');
    }

    sendSelectedPort(portName: string) {
        ipcRenderer.send('selectPort', portName);
    }

    sendHandshakePayload(payload: string) {
        console.log('sendHandShakePayload', payload);
        ipcRenderer.send('handshakePayload', payload);
    }

    requestOpenAboutWindow() {
        ipcRenderer.send('openAboutWindow');
    }

    async requestFlash(firmwareName: IFirmwareInfo) {
        await ipcRenderer.invoke('requestFlash', firmwareName);
    }

    openExternalUrl(url: string) {
        shell.openExternal(url);
    }

    async getOpenSourceContents() {
        return await ipcRenderer.invoke('getOpenSourceText');
    }

    executeDriverFile(driverPath: string) {
        ipcRenderer.send('executeDriver', driverPath);
    }

    async requestDownloadModule(moduleName: string) {
        await ipcRenderer.invoke('requestDownloadModule', moduleName);
    }

    reloadApplication() {
        ipcRenderer.send('reload');
    }

    async checkProgramUpdate() {
        const { appName } = this.sharedObject;
        const { translator, Modal } = window;
        const translate = (str: string) => translator.translate(str);

        // eslint-disable-next-line new-cap
        const modal = new Modal.default();

        if (appName === 'hardware' && navigator.onLine) {
            await ipcRenderer
                .invoke('checkUpdate')
                .then(({ hasNewVersion, version: latestVersion }) => {
                    const lastDontCheckedVersion = localStorage.getItem('lastDontCheckedVersion');
                    if (
                        hasNewVersion &&
                        (!lastDontCheckedVersion || lastDontCheckedVersion < latestVersion)
                    ) {
                        modal
                            .alert(
                                translate(
                                    'You can use the latest Entry Hardware version(%1).'
                                ).replace(/%1/gi, latestVersion),
                                translate('Alert'),
                                {
                                    positiveButtonText: translate('Download'),
                                    positiveButtonStyle: {
                                        marginTop: '16px',
                                        marginBottom: '16px',
                                        width: '180px',
                                    },
                                    parentClassName: 'versionAlert',
                                    withDontShowAgain: true,
                                }
                            )
                            .one(
                                'click',
                                (event: any, { dontShowChecked }: { dontShowChecked: boolean }) => {
                                    if (event === 'ok') {
                                        shell.openExternal(
                                            'https://playentry.org/#!/offlineEditor'
                                        );
                                    }
                                    if (dontShowChecked) {
                                        localStorage.setItem(
                                            'lastDontCheckedVersion',
                                            latestVersion
                                        );
                                    }
                                }
                            );
                    }
                });
        }
    }

    private refreshHardwareModules() {
        // configuration
        const routerHardwareList = this.getHardwareListSync();
        this.priorHardwareList.forEach((target, index) => {
            const currentIndex = routerHardwareList.findIndex((item) => {
                const itemName = item.name?.ko || item.name;
                return itemName === target;
            });
            if (currentIndex > -1) {
                const temp = routerHardwareList[currentIndex];
                routerHardwareList[currentIndex] = routerHardwareList[index];
                routerHardwareList[index] = temp;
            }
        });
        this._hardwareList = routerHardwareList;
    }

    private getHardwareListSync(): IHardwareConfig[] {
        return ipcRenderer.sendSync('requestHardwareListSync');
    }

    private consoleWriteServerMode(mode: RunningModeTypes) {
        if (this.serverMode === mode) {
            return;
        }

        if (mode === RunningModeTypes.client) {
            console.log('%cI`M CLIENT', 'background:black;color:yellow;font-size: 30px');
        } else if (mode === RunningModeTypes.server) {
            console.log('%cI`M SERVER', 'background:orange; font-size: 30px');
        }
        this.serverMode = mode;
    }

    private confirmHardwareClose() {
        const { translator } = window;
        const translate = (str: string) => translator.translate(str);
        let isQuit = true;
        if (this.currentState === 'connected') {
            isQuit = confirm(
                translate('Connection to the hardware will terminate once program is closed.')
            );
        }

        if (isQuit) {
            this.close();
            ipcRenderer.send('hardwareForceClose', true);
        }
    }
}

export default RendererRouter;
