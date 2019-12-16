const { ipcRenderer, shell, remote } = require('electron');
const {
    HARDWARE_STATEMENT: Statement,
    RUNNING_MODE_TYPES: RunningMode,
} = require('../../common/constants');

/**
 * 렌더러 비즈니스로직을 담은 클래스.
 * 해당 클래스는 preload 페이즈에서 선언되므로 nodejs, electron 관련 import가 가능
 */
class RendererRouter {
    get hardwareList() {
        this.refreshHardwareModules();
        return this._hardwareList;
    }

    get priorHardwareList() {
        return (JSON.parse(localStorage.getItem('hardwareList')) || []).reverse();
    }

    get sharedObject() {
        return remote.getGlobal('sharedObject');
    }

    get currentWindow() {
        return remote.getCurrentWindow();
    }

    constructor() {
        this.currentState = Statement.disconnected;
        this._hardwareList = [];
        const initialServerMode =
            ipcRenderer.sendSync('getCurrentServerModeSync') || RunningMode.server;

        this._consoleWriteServerMode(initialServerMode);

        ipcRenderer.on('hardwareListChanged', this.refreshHardwareModules.bind(this));
        ipcRenderer.on('hardwareCloseConfirm', this._confirmHardwareClose.bind(this));
        ipcRenderer.on('serverMode', (event, mode) => {
            this._consoleWriteServerMode(mode);
        });
    }

    startScan(hardware) {
        ipcRenderer.send('startScan', hardware);
    };

    stopScan() {
        ipcRenderer.send('stopScan');
    }

    close() {
        ipcRenderer.send('close');
    }

    sendSelectedPort(portName) {
        ipcRenderer.send('selectPort', portName);
    }

    requestOpenAboutWindow() {
        ipcRenderer.send('openAboutWindow');
    }

    requestFlash(firmwareName) {
        return new Promise((resolve, reject) => {
            ipcRenderer.send('requestFlash', firmwareName);
            ipcRenderer.once('requestFlash', (error) => {
                if (error instanceof Error) {
                    console.log(error.message);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    openExternalUrl(url) {
        shell.openExternal(url);
    }

    getOpenSourceContents() {
        return new Promise((resolve) => {
            ipcRenderer.send('getOpensourceText');
            ipcRenderer.once('getOpensourceText', (e, text) => {
                resolve(text);
            });
        });
    }

    executeDriverFile(driverPath) {
        ipcRenderer.send('executeDriver', driverPath);
    }

    requestDownloadModule(config) {
        ipcRenderer.send('requestHardwareModule', config);
    }

    reloadApplication() {
        ipcRenderer.send('reload');
    }

    refreshHardwareModules() {
        // configuration
        const routerHardwareList = this._getHardwareListSync();
        this.priorHardwareList.forEach((target, index) => {
            const currentIndex = routerHardwareList.findIndex((item) => {
                const itemName =
                    item.name && item.name.ko ? item.name.ko : item.name;
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

    checkProgramUpdate() {
        const { appName } = this.sharedObject;
        const { translator, Modal } = window;
        const translate = (str) => translator.translate(str);
        const modal = new Modal.default();

        if (appName === 'hardware' && navigator.onLine) {
            ipcRenderer.send('checkUpdate');
            ipcRenderer.on(
                'checkUpdateResult',
                (e, { hasNewVersion, version: latestVersion } = {}) => {
                    const lastDontCheckedVersion = localStorage.getItem('lastDontCheckedVersion');
                    if (
                        hasNewVersion &&
                        (!lastDontCheckedVersion || lastDontCheckedVersion < latestVersion)
                    ) {
                        modal.alert(
                            translate('You can use the latest Entry Hardware version(%1).')
                                .replace(/%1/gi, latestVersion),
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
                            }).one('click', (event, { dontShowChecked }) => {
                            if (event === 'ok') {
                                shell.openExternal(
                                    'https://playentry.org/#!/offlineEditor',
                                );
                            }
                            if (dontShowChecked) {
                                localStorage.setItem('lastDontCheckedVersion', latestVersion);
                            }
                        });
                    }
                }
            );
        }
    }

    _getHardwareListSync() {
        return ipcRenderer.sendSync('requestHardwareListSync');
    }

    _consoleWriteServerMode(mode) {
        if (this.serverMode === mode) {
            return;
        }

        if (mode === RunningMode.client) {
            console.log(
                '%cI`M CLIENT',
                'background:black;color:yellow;font-size: 30px'
            );
        } else if (mode === RunningMode.server) {
            console.log('%cI`M SERVER', 'background:orange; font-size: 30px');
        }
        this.serverMode = mode;
    }

    _confirmHardwareClose() {
        const { translator } = window;
        const translate = (str) => translator.translate(str);
        let isQuit = true;
        if (this.currentState === 'connected') {
            isQuit = confirm(
                translate(
                    'Connection to the hardware will terminate once program is closed.'
                )
            );
        }

        if (isQuit) {
            this.close();
            ipcRenderer.send('hardwareForceClose', true);
        }
    }
}

module.exports = RendererRouter;
