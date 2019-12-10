const { ipcRenderer } = require('electron');
const cuid = require('cuid');

class IpcManager {
    constructor() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = this;
    }

    handle(channel, callback) {
        ipcRenderer.on(channel, async (event, key, ...args) => {
            const result = await callback(event, ...args);
            ipcRenderer.invoke(key, result);
        });
    }
}

module.exports = IpcManager;
