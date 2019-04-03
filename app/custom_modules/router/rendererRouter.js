const EventEmitter = require('events').EventEmitter;
const { ipcRenderer } = require('electron');

class RendererRouter extends EventEmitter {

    startScan(config) {
        ipcRenderer.send('startScan', config);
    };

    stopScan() {
        ipcRenderer.send('stopScan');
    };

    close() {
        ipcRenderer.send('close');
    };

    requestFlash() {
        return new Promise((resolve, reject) => {
            ipcRenderer.send('requestFlash');
            ipcRenderer.once('requestFlash', (error) => {
                if (error instanceof Error) {
                    console.log(error.message);
                    reject(error);
                } else {
                    console.log('success?', error);
                    resolve();
                }
            });
        });
    }
}

module.exports = new RendererRouter();
