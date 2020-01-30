import {ipcMain, WebContents} from 'electron';

class IpcMainManager {
    static instance?: IpcMainManager = undefined;
    private readonly mainWindow?: WebContents;

    constructor(mainWindow: WebContents) {
        if (IpcMainManager.instance) {
            return IpcMainManager.instance;
        } else if (mainWindow) {
            this.mainWindow = mainWindow;
        }
        IpcMainManager.instance = this;
    }

    invoke(channel: string, ...args: any[]) {
        const key = `${channel}_${Date.now()}`;
        this.mainWindow && this.mainWindow.send(channel, key, ...args);
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
