const { ipcRenderer, shell, remote } = require('electron');
const {
    HARDWARE_STATEMENT: Statement,
    RUNNING_MODE_TYPES: RunningMode,
    CLOUD_MODE_TYPES: CloudMode,
} = require('../../common/constants');

let selectPortConnectionTimeout;

/**
 * 렌더러 비즈니스로직을 담은 클래스.
 * 해당 클래스는 preload 페이즈에서 선언되므로 nodejs, electron 관련 import가 가능
 *
 */
class RendererRouter {

    constructor(ui) {
        this.ui = ui;
        this.priorHardwareList = JSON.parse(localStorage.getItem('hardwareList')) || [];
        this.currentState = Statement.disconnected;
        this.hardwareList = [];
        this.cloudMode = CloudMode.singleServer;
        const initialServerMode = ipcRenderer.sendSync('getCurrentServerModeSync') || RunningMode.server;
        const initialCloudMode = ipcRenderer.sendSync('getCurrentCloudModeSync') || CloudMode.singleServer;

        this._checkProgramUpdate();
        this._consoleWriteServerMode(initialServerMode);
        this._toggleCloudModeUI(initialCloudMode);

        //ipcEvent
        ipcRenderer.on('console', (event, ...args) => {
            console.log(...args);
        });
        ipcRenderer.on('onlineHardwareUpdated', this.refreshHardwareModules.bind(this));
        ipcRenderer.on('state', this._setHardwareState.bind(this));
        ipcRenderer.on('hardwareCloseConfirm', this._confirmHardwareClose.bind(this));
        ipcRenderer.on('serverMode', (event, mode) => {
            this._consoleWriteServerMode(mode);
        });
        ipcRenderer.on('cloudMode', (event, mode) => {
            this._toggleCloudModeUI(mode);
        });
    }

    startScan(config) {
        ipcRenderer.send('startScan', config);
    };

    stopScan() {
        ipcRenderer.send('stopScan');
    };

    close() {
        ipcRenderer.send('close');
    };

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

    getOpensourceContents() {
        return new Promise((resolve) => {
            ipcRenderer.send('getOpensourceText');
            ipcRenderer.once('getOpensourceText', (e, text) => {
                resolve(text);
            });
        });
    }

    getHardwareListSync() {
        return ipcRenderer.sendSync('requestHardwareListSync');
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
        const routerHardwareList = this.getHardwareListSync();
        this.priorHardwareList.reverse().forEach((target, index) => {
            const currentIndex = routerHardwareList.findIndex((item) => {
                const itemName = item.name && item.name.ko ? item.name.ko : item.name;
                return itemName === target;
            });
            if (currentIndex > -1) {
                const temp = routerHardwareList[currentIndex];
                routerHardwareList[currentIndex] = routerHardwareList[index];
                routerHardwareList[index] = temp;
            }
        });
        this.hardwareList = routerHardwareList;
        this.ui.clearRobot();
        this.hardwareList.forEach(this.ui.addRobot.bind(this.ui));
    }

    _checkProgramUpdate() {
        const { appName } = remote.getGlobal('sharedObject');
        const { translate, Modal } = window;
        const modal = new Modal.default();

        if (appName === 'hardware' && navigator.onLine) {
            ipcRenderer.send('checkUpdate');
            ipcRenderer.on(
                'checkUpdateResult',
                (e, { hasNewVersion, version: latestVersion } = {}) => {
                    const lastDontCheckedVersion = localStorage.getItem('lastDontCheckedVersion');
                    if (hasNewVersion && (!lastDontCheckedVersion || lastDontCheckedVersion < latestVersion)) {
                        modal.alert(
                            translate('You can use the latest Entry Hardware version(%1).')
                                .replace(/%1/gi, latestVersion),
                            translate('Alert'),
                            {
                                theme: 'LINE',
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
                },
            );
        }
    }

    _consoleWriteServerMode(mode) {
        if (this.serverMode === mode) {
            return;
        }

        if (mode === RunningMode.client) {
            console.log('%cI`M CLIENT', 'background:black;color:yellow;font-size: 30px');

        } else if (mode === RunningMode.server) {
            console.log('%cI`M SERVER', 'background:orange; font-size: 30px');
        }
        this.serverMode = mode;
    }

    _toggleCloudModeUI(mode) {
        if (mode === CloudMode.singleServer) {
            this.ui.setCloudMode(false);
        } else if (mode === CloudMode.cloud) {
            this.ui.setCloudMode(true);
        }
        this.cloudMode = mode;
    }

    _setHardwareState(event, state, data) {
        const { translate } = window;
        const ui = this.ui;
        const {
            showRobot,
            lost,
            disconnected,
            selectPort,
            flash,
            beforeConnect,
            connected,
        } = Statement;

        console.log(state);
        // select_port 는 기록해두어도 쓸모가 없으므로 표기하지 않는다
        if (state !== selectPort) {
            this.currentState = state;
        }
        switch (state) {
            case showRobot: {
                this.ui.showRobot(data);
                break;
            }
            case selectPort: {
                if (!window.currentConfig.this_com_port) {
                    this.ui.showPortSelectView(data);
                } else {
                    selectPortConnectionTimeout = setTimeout(() => {
                        this.startScan(window.currentConfig);
                    }, 1000);
                }

                return; // ui 변경 이루어지지 않음.
            }
            case flash: {
                ui.flashFirmware();
                break;
            }
            case beforeConnect: {
                ui.showAlert(`${
                    translate('Connecting to hardware device.')
                    } ${
                    translate('Please select the firmware.')
                    }`);
                break;
            }
            case lost:
                ui.showConnecting();
                break;
            case disconnected:
                ui.showDisconnected();
                break;
            case connected:
                ui.showConnected();
                break;
        }
    }

    _confirmHardwareClose() {
        const { translate } = window;
        let isQuit = true;
        if (this.currentState === 'connected') {
            isQuit = confirm(
                translate(
                    'Connection to the hardware will terminate once program is closed.',
                ),
            );
        }

        if (isQuit) {
            this.close();
            ipcRenderer.send('hardwareForceClose', true);
        }
    }
}

module.exports = RendererRouter;
