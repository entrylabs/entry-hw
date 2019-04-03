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
        ipcRenderer.send('requestFlash');
        ipcRenderer.once('requestFlash', (error) => {
            if (error instanceof Error) {
                console.log(error.message);
            }
            console.log('success?', error);
        });
    }
}

module.exports = new RendererRouter();
