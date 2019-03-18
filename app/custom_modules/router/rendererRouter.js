const EventEmitter = require('events').EventEmitter;
const { ipcRenderer } = require('electron');

class RendererRouter extends EventEmitter {
    constructor() {
        super();
    }

    // init(server) {
    //     this.scanner = require('./scanner/scanner');
    //     this.server = server;
    //     return this;
    // }

    startScan(config) {
        ipcRenderer.send('startScan', config);
    };

    stopScan() {
        ipcRenderer.send('stopScan');
    };

    // connect(connector, config) {
    //     const control = config.hardware.control;
    //     const duration = config.hardware.duration;
    //     const advertise = config.hardware.advertise;
    //     const extension = this.extension;
    //     const server = this.server;
    //
    //     this.connector = connector;
    //     if(this.connector['executeFlash']) {
    //         this.emit('state', 'flash');
    //     } else if(extension && server) {
    //         const handler = require('./datahandler/handler.js').create(config);
    //         if(extension.init) {
    //             extension.init(handler, config);
    //         }
    //         if(extension.setSocket) {
    //             extension.setSocket(server);
    //         }
    //         server.removeAllListeners();
    //         server.on('connection', function(data, type) {
    //             if(extension.socketReconnection) {
    //                 extension.socketReconnection();
    //             }
    //         });
    //         server.on('data', function(data, type) {
    //             handler.decode(data, type);
    //             if(extension.handleRemoteData) {
    //                 extension.handleRemoteData(handler);
    //             }
    //         });
    //         server.on('close', function() {
    //             if(extension.reset) {
    //                 extension.reset();
    //             }
    //         });
    //         connector.connect(extension, (state, data) => {
    //             if(state) {
    //                 this.emit('state', state);
    //                 if(extension.eventController) {
    //                     extension.eventController(state);
    //                 }
    //             } else {
    //                 if(extension.handleLocalData) {
    //                     extension.handleLocalData(data);
    //                 }
    //                 if(extension.requestRemoteData) {
    //                     extension.requestRemoteData(handler);
    //                     const data = handler.encode();
    //                     if(data) {
    //                         server.send(data);
    //                     }
    //                 }
    //                 if(control === 'master') {
    //                     if(extension.requestLocalData) {
    //                         const data = extension.requestLocalData();
    //                         if(data) {
    //                             connector.send(data);
    //                         }
    //                     }
    //                 }
    //             }
    //         });
    //
    //         if(duration && control !== 'master') {
    //             ipcRenderer.send('startRequestLocalData', duration);
    //             ipcRenderer.removeAllListeners('sendingRequestLocalData');
    //             ipcRenderer.on('sendingRequestLocalData', () => {
    //                 console.log('requestLocalData', Date.now());
    //                 if(extension.requestLocalData) {
    //                     const data = extension.requestLocalData();
    //                     if(data) {
    //                         connector.send(data);
    //                     }
    //                 }
    //                 if(extension.getProperty) {
    //                     const data = extension.getProperty();
    //                     if(data) {
    //                         connector.send(data);
    //                     }
    //                 }
    //             });
    //         }
    //
    //         if(advertise) {
    //             this.advertise = setInterval(function () {
    //                 const data = handler.encode();
    //                 if(data) {
    //                     server.send(data);
    //                 }
    //             }, advertise);
    //         }
    //     }
    // };

    close() {
        ipcRenderer.send('close')
    };
}

module.exports = new RendererRouter();
