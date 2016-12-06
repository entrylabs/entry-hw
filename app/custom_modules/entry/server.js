'use strict';
var util = require('util');
var fs = require('fs');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var client = require('socket.io-client');
const {ipcRenderer} = require('electron');
var masterRoomIds = [];
var clientRoomId = '';
var socketClient;
var version = '';

var serverModeTypes = {
	single: 0,
	multi: 1,
	parent: 2,
	child: 3,
}
var runningMode = serverModeTypes.parent;

function Server() {
	EventEmitter.call(this);
	this.packet = new Buffer([0x01, 0x00, 0x00, 0x00]);
	this.connections = [];
	this.connectionSet = {};
	this.roomCnt = 0;
	this.childServerList = {};
	this.clientTargetList = {};
	version = ipcRenderer.sendSync('version');
}

util.inherits(Server, EventEmitter);

ipcRenderer.on('customArgs', function(e, data) {
	if(runningMode === serverModeTypes.parent) {
		if(masterRoomIds.indexOf(data) === -1) {
			masterRoomIds.push(data);
		}
	} else {
		if(data) {
			clientRoomId = data;
			socketClient.emit('matchTarget', { roomId : clientRoomId });
			if(masterRoomIds.indexOf(data) === -1) {
				masterRoomIds.push(data);
			}
		}
	}
});

Server.prototype.open = function(logger) {
	var http, httpServer, address;
	var PORT = 23518;
	var self = this;
	
	if(fs.existsSync(path.resolve(global.__dirname, 'ssl', 'cert.pem'))) {
		http = require('https');
		httpServer = http.createServer({
		    key: fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'hardware.play-entry.key')),
		    cert: fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'cert.pem')),
		    ca: fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'Symantec-Chain_sha2.pem'))
		}, function (req, res) {
		    res.writeHead(200);
		    res.end();
		});
		address = 'https://hardware.play-entry.org:23518';
	} else {
		http = require('http');
		httpServer = http.createServer(function(request, response) {
			response.writeHead(200);
			response.end();
		});
		address = 'http://127.0.0.1:23518';
	}
	
	httpServer.on('error', function(e) {
		ipcRenderer.send('serverMode', serverModeTypes.multi);
		runningMode = serverModeTypes.child;
		console.log('%cI`M CLIENT', 'background:black;color:yellow;font-size: 30px');
		var socket = client(address, {query:{'childServer': true}});
		socketClient = socket;
		self.connections.push(socket);
		socket.on('connect', function() {
			var roomIds = ipcRenderer.sendSync('roomId');
			if(roomIds.length > 0) {
				roomIds.forEach(function(roomId) {
					if(roomId) {
						if(masterRoomIds.indexOf(roomId) === -1) {
							masterRoomIds.push(roomId);
						}
						socket.emit('matchTarget', { roomId : roomId });				
					}
				});
			}
		});
		socket.on('message', function (message) {
			self.emit('data', message.data, message.type);
		});		
		socket.on('mode', function (data) {
			socket.mode = data;
		});
		socket.on('disconnect', function() {
			socket.close();
			socket = null;
			self.open();
		});
	});
	httpServer.on('listening', function(e) {
		var mRoomIds = ipcRenderer.sendSync('roomId');
		if(mRoomIds.length > 0) {
			mRoomIds.forEach(function(mRoomId) {
				if(masterRoomIds.indexOf(mRoomId) === -1 && mRoomId) {
					masterRoomIds.push(mRoomId);
				}
			});
		}
		runningMode = serverModeTypes.parent;
		console.log('%cI`M SERVER', 'background:orange; font-size: 30px');
		self.httpServer = httpServer;
		if(logger) {
			logger.i('Listening on port ' + PORT);
		}

		var server = require('socket.io')(httpServer);
		server.set('transports', ['websocket', 
		    'flashsocket', 
	      	'htmlfile', 
	      	'xhr-polling', 
	      	'jsonp-polling', 
	      	'polling']);

		self.server = server;
		server.on('connection', function(socket) {
			var connection = socket;			
			self.connectionSet[connection.id] = connection;
			self.connections.push(connection);
			if(logger) {
				logger.i('Entry connected.');
			}

			var roomId = connection.handshake.query.roomId;
			if(connection.handshake.query.childServer === 'true') {
				self.childServerList[connection.id] = true;
			} else {
				connection.join(roomId);
				connection.roomId = roomId;
			}

			var childServerListCnt = Object.keys(self.childServerList).length;
			if(childServerListCnt > 0) {
				ipcRenderer.send('serverMode', serverModeTypes.multi);
				server.emit('mode', serverModeTypes.multi);
			} else {
				ipcRenderer.send('serverMode', serverModeTypes.single);
				server.emit('mode', serverModeTypes.single);
			}

			connection.on('matchTarget', function(data) {
				if(connection.handshake.query.childServer === 'true' && data.roomId) {
					if(!connection.roomIds) {
						connection.roomIds = [];
					}

					if(connection.roomIds.indexOf(data.roomId) === -1) {
						connection.roomIds.push(data.roomId);
					}

					self.clientTargetList[data.roomId] = connection.id;
					server.to(data.roomId).emit('matched', connection.id);
				}
			});

			connection.on('disconnect', function(socket) {
				if(connection.handshake.query.childServer === 'true') {
					if(connection.roomIds && connection.roomIds.length > 0) {
						connection.roomIds.forEach(function (roomId) {
							server.to(roomId).emit('matching');
						});
					}
					delete self.connectionSet[connection.id];
					delete self.childServerList[connection.id];

					var childServerListCnt = Object.keys(self.childServerList).length;
					if(childServerListCnt <= 0) {
						server.emit('mode', serverModeTypes.single);
						ipcRenderer.send('serverMode', serverModeTypes.single);
					}
				} else {
					delete self.connectionSet[connection.id];
				}
			});

			connection.on('message', function(message) {
				if(message.mode === serverModeTypes.single || masterRoomIds.indexOf(connection.roomId) >= 0 ) {
					self.emit('data', message.data, message.type);
				} else {
					if(connection.handshake.query.childServer === 'true') {
						if(connection.roomIds && connection.roomIds.length > 0) {
							connection.roomIds.forEach(function(roomId) {
								server.to(roomId).emit('message', message);
							});
						}
					} else if(self.clientTargetList[connection.roomId]) {
						server.to(self.clientTargetList[connection.roomId]).emit('message', message);
					}
				}
			});

			connection.on('close', function(reasonCode, description) {
				if(logger) {
					logger.w('Entry disconnected.');
				}
				self.emit('close');
				self.closeSingleConnection(this);
			});
			self.setState(self.state);
		});
	});
	httpServer.listen(PORT);
};

Server.prototype.closeSingleConnection = function(connection) {
	var connections = this.connections;
	var index = connections.indexOf(connection);
	if (index > -1) {
		this.connections.slice(index, 1);
		connection.close();
	}
};
	
Server.prototype.send = function(data) {
	var self = this;
	var childServerListCnt = Object.keys(this.childServerList).length;
	if((runningMode === serverModeTypes.parent && childServerListCnt === 0) || runningMode === serverModeTypes.child) {
		if(this.connections.length !== 0) {
			this.connections.map(function(connection){
				connection.emit('message', {data : data, version: version});
			});
		}
	} else if(masterRoomIds.length > 0){
		masterRoomIds.forEach(function (masterRoomId) {
			self.server.to(masterRoomId).emit('message', {data : data, version: version});
		});
	}
};

Server.prototype.setState = function(state) {
	this.state = state;
	if(this.connections.length) {
		var packet = this.packet;
		if(state == 'connecting') {
			packet[3] = 0x01;
			this.send(packet);
		} else if(state == 'connected') {
			packet[3] = 0x02;
			this.send(packet);
		} else if(state == 'lost') {
			packet[3] = 0x03;
			this.send(packet);
		} else if(state == 'disconnected') {
			packet[3] = 0x04;
			this.send(packet);
		}
	}
};
	
Server.prototype.disconnectHardware = function() {
	this.send('disconnectHardware');
}

Server.prototype.close = function() {
	if(this.server) {
		this.server.close();
		this.server = undefined;
	}
	if(this.httpServer) {
		this.httpServer.close();
		this.httpServer = undefined;
	}
	this.connections = [];
	this.emit('closed');
};

module.exports = new Server();