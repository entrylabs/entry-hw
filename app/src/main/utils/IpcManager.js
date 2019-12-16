const { ipcMain } = require('electron');
const cuid = require('cuid');

class IpcManager {
    constructor(mainWindow) {
        if (this.instance) {
            return this.instance;
        } else if (mainWindow) {
            this.mainWindow = mainWindow;
        }
        this.instance = this;
    }

    invoke(channel, ...args) {
        const key = `${channel}_${cuid()}`;
        this.mainWindow.send(channel, key, ...args);
        return new Promise((resolve) => {
            ipcMain.handleOnce(key, (event, device) => {
                resolve(device);
            });
        });
    }
}

module.exports = IpcManager;
