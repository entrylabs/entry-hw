const { ipcMain } = require('electron');

class IpcMainManager {
    static instance = undefined;
    constructor(mainWindow) {
        if (IpcMainManager.instance) {
            return IpcMainManager.instance;
        } else if (mainWindow) {
            this.mainWindow = mainWindow;
        }
        IpcMainManager.instance = this;
    }

    invoke(channel, ...args) {
        const key = `${channel}_${Date.now()}`;
        this.mainWindow.send(channel, key, ...args);
        return new Promise((resolve) => {
            ipcMain.handleOnce(key, (event, device) => {
                resolve(device);
            });
        });
    }

    handle = ipcMain.handle.bind(ipcMain);
    removeHandler = ipcMain.removeHandler.bind(ipcMain);
}

module.exports = IpcMainManager;
