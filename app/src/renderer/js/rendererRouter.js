const { ipcRenderer, shell, remote } = require('electron');

/**
 * 렌더러 비즈니스로직을 담은 클래스.
 * 해당 클래스는 preload 페이즈에서 선언되므로 nodejs, electron 관련 import가 가능
 *
 */
class RendererRouter {
    get serverMode() {
        return this._serverMode;
    }

    constructor(ui) {
        this.ui = ui;
        this.priorHardwareList = JSON.parse(localStorage.getItem('hardwareList')) || [];
        this._serverMode = ipcRenderer.sendSync('getCurrentServerModeSync') || 0;
        this.hardwareList = [];

        this._checkProgramUpdate();
        this._consoleWriteServerMode();
        //ipcEvent
        ipcRenderer.on('console', (event, ...args) => {
            console.log(...args);
        });
        ipcRenderer.on('onlineHardwareUpdated', this.refreshHardwareModules.bind(this));
        ipcRenderer.on('serverMode', (event, mode) => {
            this._serverMode = mode;
            this._consoleWriteServerMode();
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
        const lastCheckVersion = localStorage.getItem('lastCheckVersion');
        const hasNewVersion = localStorage.getItem('hasNewVersion');
        const { getLang } = window;
        const { appName } = remote.getGlobal('sharedObject');

        if (appName === 'hardware' && navigator.onLine) {
            if (hasNewVersion) {
                localStorage.removeItem('hasNewVersion');
                this.ui.showModal(
                    getLang('Msgs.version_update_msg2').replace(/%1/gi,lastCheckVersion),
                    getLang('General.update_title'),
                    {
                        positiveButtonText: getLang('General.recent_download'),
                        positiveButtonStyle: {
                            width: '180px',
                        },
                    },
                    (event) => {
                        if (event === 'ok') {
                            shell.openExternal(
                                'https://playentry.org/#!/offlineEditor',
                            );
                        }
                    }
                );
            } else {
                ipcRenderer.on(
                    'checkUpdateResult',
                    (e, { hasNewVersion, version } = {}) => {
                        if (hasNewVersion && version !== lastCheckVersion) {
                            localStorage.setItem('hasNewVersion', hasNewVersion);
                            localStorage.setItem('lastCheckVersion', version);
                        }
                    },
                );
                ipcRenderer.send('checkUpdate');
            }
        }
    }

    _consoleWriteServerMode() {
        if (this.serverMode === 1) {
            console.log('%cI`M CLIENT', 'background:black;color:yellow;font-size: 30px');
            this.ui.setCloudMode(true);
        } else {
            console.log('%cI`M SERVER', 'background:orange; font-size: 30px');
            this.ui.setCloudMode(false);
        }
    }
}

module.exports = RendererRouter;
