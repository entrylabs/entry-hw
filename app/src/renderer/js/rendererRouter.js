const { ipcRenderer } = require('electron');

class RendererRouter {
    constructor(ui) {
        this.ui = ui;
        this.priorHardwareList = JSON.parse(localStorage.getItem('hardwareList')) || [];
        this.hardwareList = [];
        //ipcEvent
        ipcRenderer.on('console', (event, ...args) => {
            console.log(...args);
        });
        ipcRenderer.on('onlineHardwareUpdated', this.refreshHardwareModules.bind(this));
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
        this.hardwareList.forEach(this.ui.addRobot.bind(this.ui));
    }
}

module.exports = RendererRouter;
