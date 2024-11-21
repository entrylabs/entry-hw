import spawn from 'cross-spawn';
import fs from 'fs';
import { ChildProcess } from 'child_process';
import createLogger from './functions/createLogger';
import directoryPaths from './electronDirectoryPaths';
import type MainRouter from '../mainRouter';

const logger = createLogger('electron/server');

class ServerProcessManager {
    private readonly childProcess: ChildProcess;
    private currentRoomId: string | undefined;
    private router: MainRouter;

    constructor(router?: any) {
        try {
            // this.childProcess = new Server();
            const serverBinaryPath = directoryPaths.server;
            logger.info(`EntryServer try to spawn.. ${serverBinaryPath}`);
            fs.accessSync(serverBinaryPath);
            this.childProcess = spawn(serverBinaryPath, [], {
                stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
                detached: true,
            });
            logger.info('EntryServer spawned successfully');
            this.router = router;
        } catch (e) {
            logger.error('Error occurred while spawn Server Process.', e);
            throw new Error(
                'Error occurred while spawn Server Process. make sure it exists same dir path'
            );
        }
    }

    setRouter(router: any) {
        this.router = router;
    }

    open() {
        this._receiveFromChildEventRegister();
        this._sendToChild('open', process.env.NODE_ENV);
        // this.childProcess.open();
    }

    close() {
        this.childProcess && this.childProcess.kill();
    }

    addRoomIdsOnSecondInstance(roomId: string) {
        // this.childProcess.addRoomId(roomId);
        this.currentRoomId = roomId;
        this._sendToChild('addRoomId', roomId);
    }

    connectHardwareSuccess() {
        this._sendToChild('connectHardwareSuccess');
    }

    connectHardwareFailed() {
        this._sendToChild('connectHardwareFailed');
    }

    disconnectHardware() {
        // this.childProcess.disconnectHardware();
        this._sendToChild('disconnectHardware');
    }

    send(data: any) {
        // this.childProcess.sendToClient(data);
        this._sendToChild('send', data);
    }

    /**
     * @param methodName{string}
     * @param message{Object?}
     * @private
     */
    _sendToChild(methodName: string, message?: any) {
        this._isProcessLive() &&
            this.childProcess.send({
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
        this.childProcess &&
            this.childProcess.on('message', (message: { key: string; value: any }) => {
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
                        if (!this.currentRoomId || this.currentRoomId === value) {
                            this.router.handleServerSocketClosed();
                        }
                        break;
                    }
                    default: {
                        console.error('unhandled pkg server message', key, value);
                    }
                }
            });
    }

    _isProcessLive() {
        return (
            this.childProcess &&
            !this.childProcess.killed &&
            this.childProcess.connected &&
            this.childProcess.channel
        );
    }
}

export default ServerProcessManager;
