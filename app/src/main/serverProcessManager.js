const spawn = require('cross-spawn');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ServerProcessManager {
    constructor(router) {
        try {
            // this.childProcess = new Server();
            const serverBinaryPath = this._getServerFilePath();
            fs.accessSync(serverBinaryPath);
            this.childProcess = spawn(serverBinaryPath, [], {
                stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
                detached: true,
            });
            this.router = router;
        } catch (e) {
            throw new Error(
                'Error occurred while spawn Server Process. make sure it exists same dir path',
            );
        }
    }

    setRouter(router) {
        this.router = router;
    }

    _getServerFilePath() {
        const asarIndex = app.getAppPath().indexOf(`${path.sep}app.asar`);
        if (asarIndex > -1) {
            return path.join(app.getAppPath().substr(0, asarIndex), 'server.exe');
        } else {
            const serverDirPath = [__dirname, '..', '..', 'server'];
            if (os.type().includes('Darwin')) {
                return path.resolve(...serverDirPath, 'mac', 'server.exe');
            } else {
                return path.resolve(...serverDirPath, 'win', 'server.exe');
            }
        }
    }

    open() {
        this._receiveFromChildEventRegister();
        this._sendToChild('open');
        // this.childProcess.open();
    }

    close() {
        this.childProcess && this.childProcess.kill();
    }

    addRoomIdsOnSecondInstance(roomId) {
        // this.childProcess.addRoomId(roomId);
        this._sendToChild('addRoomId', roomId);
    }

    disconnectHardware() {
        // this.childProcess.disconnectHardware();
        this._sendToChild('disconnectHardware');
    }

    send(data) {
        // this.childProcess.sendToClient(data);
        this._sendToChild('send', data);
    }

    /**
     * @param methodName{string}
     * @param message{Object?}
     * @private
     */
    _sendToChild(methodName, message) {
        this.childProcess && this.childProcess.send && this.childProcess.send({
            key: methodName,
            value: message,
        });
    }

    _receiveFromChildEventRegister() {
        // this.childProcess.on('cloudModeChanged', (mode) => {
        //     this.router.notifyCloudModeChanged(mode);
        // });
        // this.childProcess.on('runningModeChanged', (mode) => {
        //     this.router.notifyServerRunningModeChanged(mode);
        // });
        // this.childProcess.on('message', (message) => {
        //     this.router.handleServerData(message);
        // });
        // this.childProcess.on('close', () => {

        // });
        this.childProcess && this.childProcess.on('message', (message) => {
            const { key, value } = message;
            switch (key) {
                case 'cloudModeChanged': {
                    this.router.notifyCloudModeChanged(value);
                    break;
                }
                case 'runningModeChanged': {
                    this.router.notifyServerRunningModeChanged(value);
                    break;
                }
                case 'data': {
                    this.router.handleServerData(value);
                    break;
                }
                case 'connection': {
                    this.router.handleServerSocketConnected();
                    break;
                }
                case 'close': {
                    this.router.handleServerSocketClosed();
                    break;
                }
                default: {
                    console.error('unhandled pkg server message', key, value);
                }
            }
        });
    }
}

module.exports = ServerProcessManager;
