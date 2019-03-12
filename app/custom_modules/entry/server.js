'use strict';
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const client = require('socket.io-client');
const { ipcRenderer } = require('electron');
const loggerModule = require('../logger');
loggerModule.set({
    v: console.log,
    i(str) {
        console.info('%c' + str, 'color: dodgerblue');
    },
    w(str) {
        console.warn('%c' + str, 'color: orange');
    },
    e(str) {
        console.error('%c' + str, 'color: red');
    },
});
const logger = loggerModule.get();

class Server extends EventEmitter {
    get SERVER_MODE_TYPES() {
        return {
            single: 0,
            multi: 1,
            parent: 2,
            child: 3,
        }
    }

    constructor() {
        super();
        this.packet = new Buffer([0x01, 0x00, 0x00, 0x00]);
        this.connections = [];
        this.connectionSet = {};
        this.roomCnt = 0;
        this.childServerList = {};
        this.clientTargetList = {};
        this.version = ipcRenderer.sendSync('version');
        this.runningMode = this.SERVER_MODE_TYPES.parent;
        this.masterRoomIds = [];
        this.clientRoomId = '';
        this.socketClient;

        ipcRenderer.on('customArgs', (e, data) => {
            if (this.runningMode === this.SERVER_MODE_TYPES.parent) {
                if (this.masterRoomIds.indexOf(data) === -1) {
                    this.masterRoomIds.push(data);
                }
            } else {
                if (data) {
                    this.clientRoomId = data;
                    this.socketClient.emit('matchTarget', { roomId: this.clientRoomId });
                    if (this.masterRoomIds.indexOf(data) === -1) {
                        this.masterRoomIds.push(data);
                    }
                }
            }
        });
    }

    open() {
        const PORT = 23518;
        const { httpServer, address } = this._getHttpServer(PORT);

        /*
         * 에러가 발생하는 경우는 EADDRINUSE 로 상정한다.
         * 동일 IP + 클라우드 PC 환경이라고 가정하고,
         * 클라우드 내 최초 실행된 PC 가 서버, 그 뒤에 실행된 PC 에서는
         * EADDRINUSE 가 발생.
         * 그런 경우 직접 로컬호스트발 소켓 클라이언트를 연다.
         */
        httpServer.on('error', (e) => {
            ipcRenderer.send('serverMode', this.SERVER_MODE_TYPES.multi);
            this.runningMode = this.SERVER_MODE_TYPES.child;
            console.log(
                '%cI`M CLIENT',
                'background:black;color:yellow;font-size: 30px'
            );

            const socket = this._createSocketClient(address);
            this.connections.push(socket);
            this.socketClient = socket;
        });

        /*
         * 서버가 정상오픈된 경우. 서버로 동작한다.
         * 일반 모드인 경우는 상관없다.
         * 클라우드 모드인 경우, 클라이언트들의 데이터까지 처리하는 부하문제가 있다.
         * 정상 오픈이 된 경우 socketIO 서버를 오픈한다.
         */
        httpServer.on('listening', (e) => {
            const mRoomIds = ipcRenderer.sendSync('roomId');
            if (mRoomIds.length > 0) {
                mRoomIds.forEach((mRoomId) => {
                    if (this.masterRoomIds.indexOf(mRoomId) === -1 && mRoomId) {
                        this.masterRoomIds.push(mRoomId);
                    }
                });
            }
            this.runningMode = this.SERVER_MODE_TYPES.parent;
            console.log('%cI`M SERVER', 'background:orange; font-size: 30px');
            this.httpServer = httpServer;
            logger.i('Listening on port ' + PORT);

            this.server = this._createSocketServer(httpServer);
        });

        httpServer.listen(PORT);
    };

    /**
     * httpServer 오픈에 실패하여 (클라우드 등) 직접 socketIO 클라이언트를 만든다.
     * @param address
     * @return {SocketIOClientStatic.Socket}
     * @private
     */
    _createSocketClient(address) {
        const socket = client(address, {
            query: { childServer: true },
            reconnectionAttempts: 3,
        });

        socket.on('connect', () => {
            const roomIds = ipcRenderer.sendSync('roomId');
            if (roomIds.length > 0) {
                roomIds.forEach((roomId) => {
                    if (roomId) {
                        if (this.masterRoomIds.indexOf(roomId) === -1) {
                            this.masterRoomIds.push(roomId);
                        }
                        socket.emit('matchTarget', { roomId: roomId });
                    }
                });
            }
        });

        socket.on('message', (message) => {
            this.emit('data', message.data, message.type);
        });

        socket.on('mode', function(data) {
            socket.mode = data;
        });

        socket.on('reconnect_failed', () => {
            ipcRenderer.send('serverMode', this.SERVER_MODE_TYPES.single);
            socket.close();
            this.socketClient = null;
            this.open();
        });

        socket.on('disconnect', () => {
            socket.close();
            this.socketClient = null;
            this.open();
        });

        return socket;
    }

    /**
     * httpServer 오픈에 성공한 뒤, SocketIO 서버를 오픈한다.
     *
     * @param httpServer{Server}
     * @return {SocketIO.Server}
     * @private
     */
    _createSocketServer(httpServer) {
        const server = require('socket.io')(httpServer);
        server.set('transports', [
            'websocket',
            'flashsocket',
            'htmlfile',
            'xhr-polling',
            'jsonp-polling',
            'polling',
        ]);

        server.on('connection', (socket) => {
            this.connectionSet[socket.id] = socket;
            this.connections.push(socket);
            this.emit('connection');

            logger.i('Entry connected.');

            const roomId = socket.handshake.query.roomId;
            if (socket.handshake.query.childServer === 'true') {
                this.childServerList[socket.id] = true;
            } else {
                socket.join(roomId);
                socket.roomId = roomId;
            }

            const childServerListCnt = Object.keys(this.childServerList).length;
            if (childServerListCnt > 0) {
                ipcRenderer.send('serverMode', this.SERVER_MODE_TYPES.multi);
                server.emit('mode', this.SERVER_MODE_TYPES.multi);
            } else {
                ipcRenderer.send('serverMode', this.SERVER_MODE_TYPES.single);
                server.emit('mode', this.SERVER_MODE_TYPES.single);
            }

            socket.on('matchTarget', (data) => {
                if (
                    socket.handshake.query.childServer === 'true' &&
                    data.roomId
                ) {
                    if (!socket.roomIds) {
                        socket.roomIds = [];
                    }

                    if (socket.roomIds.indexOf(data.roomId) === -1) {
                        socket.roomIds.push(data.roomId);
                    }

                    this.clientTargetList[data.roomId] = socket.id;
                    server.to(data.roomId).emit('matched', socket.id);
                }
            });

            socket.on('disconnect', (socket) => {
                if (socket.handshake.query.childServer === 'true') {
                    if (socket.roomIds && socket.roomIds.length > 0) {
                        socket.roomIds.forEach(function(roomId) {
                            server.to(roomId).emit('matching');
                        });
                    }
                    delete this.connectionSet[socket.id];
                    delete this.childServerList[socket.id];

                    var childServerListCnt = Object.keys(this.childServerList)
                        .length;
                    if (childServerListCnt <= 0) {
                        server.emit('mode', this.SERVER_MODE_TYPES.single);
                        ipcRenderer.send('serverMode', this.SERVER_MODE_TYPES.single);
                    }
                } else {
                    delete this.connectionSet[socket.id];
                }
            });

            socket.on('message', (message, ack) => {
                if (
                    message.mode === this.SERVER_MODE_TYPES.single ||
                    this.masterRoomIds.indexOf(socket.roomId) >= 0
                ) {
                    this.emit('data', message.data, message.type);
                } else {
                    if (socket.handshake.query.childServer === 'true') {
                        if (
                            socket.roomIds &&
                            socket.roomIds.length > 0
                        ) {
                            socket.roomIds.forEach(function(roomId) {
                                server.to(roomId).emit('message', message);
                            });
                        }
                    } else if (this.clientTargetList[socket.roomId]) {
                        server.to(this.clientTargetList[socket.roomId]).emit('message', message);
                    }
                }
                if(ack) {
                    const { key = true } = message;
                    ack(key);
                }
            });

            socket.on('close', (reasonCode, description) => {
                logger.w('Entry disconnected.');
                this.emit('close');
                this.closeSingleConnection(this);
            });
            this.setState(this.state);
        });
        return server;
    }

    /**
     * SSL 인증서가 프로젝트에 포함되어있는 경우는 https,
     * 그렇지 않은 경우는 http 서버를 오픈한다.
     *
     * @param port{number} 오픈할 포트번호
     * @return {{address: string, httpServer: Server}}
     * @private
     */
    _getHttpServer(port) {
        let httpServer;
        let address;
        if (fs.existsSync(path.resolve(global.__dirname, 'ssl', 'cert.pem'))) {
            httpServer = require('https').createServer(
                {
                    key: fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'hardware.key')),
                    cert: fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'cert.pem')),
                    ca: [
                        fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'ChainCA1.crt')),
                        fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'ChainCA2.crt')),
                        fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'RootCA.crt')),
                    ],
                },
                function(req, res) {
                    res.writeHead(200);
                    res.end();
                }
            );
            address = `https://hardware.playentry.org:${port}`;
        } else {
            httpServer = require('http').createServer(function(request, response) {
                response.writeHead(200);
                response.end();
            });
            address = `http://127.0.0.1:${port}`;
        }

        return {
            httpServer,
            address,
        }
    }

    closeSingleConnection(connection) {
        const connections = this.connections;
        const index = connections.indexOf(connection);
        if (index > -1) {
            this.connections.slice(index, 1);
            connection.close();
        }
    };

    send(data) {
        const childServerListCnt = Object.keys(this.childServerList).length;
        if (
            (this.runningMode === this.SERVER_MODE_TYPES.parent && childServerListCnt === 0) ||
            this.runningMode === this.SERVER_MODE_TYPES.child
        ) {
            if (this.connections.length !== 0) {
                this.connections.map((connection) => {
                    connection.emit('message', { data: data, version: this.version });
                });
            }
        } else if (this.masterRoomIds.length > 0) {
            this.masterRoomIds.forEach((masterRoomId) => {
                this.server.to(masterRoomId).emit('message', { data: data, version: this.version });
            });
        }
    };

    setState(state) {
        this.state = state;
        if (this.connections.length) {
            const packet = this.packet;
            if (state === 'connecting') {
                packet[3] = 0x01;
                this.send(packet);
            } else if (state === 'connected') {
                packet[3] = 0x02;
                this.send(packet);
            } else if (state === 'lost') {
                packet[3] = 0x03;
                this.send(packet);
            } else if (state === 'disconnected') {
                packet[3] = 0x04;
                this.send(packet);
            }
        }
    };

    disconnectHardware() {
        this.send('disconnectHardware');
    };

    close() {
        if (this.server) {
            this.server.close();
            this.server = undefined;
        }
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = undefined;
        }
        this.connections = [];
        this.emit('closed');
    };
}

module.exports = new Server();
