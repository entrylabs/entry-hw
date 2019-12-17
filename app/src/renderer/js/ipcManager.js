const { ipcRenderer } = require('electron');

class IpcRendererManager {
    constructor() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = this;
    }

    handle(channel, callback) {
        ipcRenderer.on(channel, async (event, key, ...args) => {
            const result = await callback(event, ...args);

            // noinspection ES6MissingAwait
            ipcRenderer.invoke(key, result);
        });
    }

    invoke = ipcRenderer.invoke.bind(ipcRenderer);
}

module.exports = IpcRendererManager;
