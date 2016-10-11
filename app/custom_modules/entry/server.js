'use strict';
var util = require('util');
var fs = require('fs');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var client = require('socket.io-client');
const {ipcRenderer} = require('electron');
var clientId = '';
var runningMode = 'parent';
var masterClient = '';
var socketServer;
var socketClient;
var server;

function Server() {
	EventEmitter.call(this);
	this.packet = new Buffer([0x01, 0x00, 0x00, 0x00]);
	this.connections = [];
	this.connectionSet = {};
	this.roomCnt = 0;
	this.childServerList = {};
}

util.inherits(Server, EventEmitter);

ipcRenderer.on('clientId', function(e, id) {
	clientId = id;
	if(runningMode === 'parent') {
		masterClient = id;
	} else {
		socketClient.emit('matchTarget', { id : clientId });
	}
});

Server.prototype.open = function(logger) {
	clientId = ipcRenderer.sendSync('clientId');
	var http;
	var PORT = 23518;
	var self = this;
	var httpServer;
	
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
	} else {
		http = require('http');
		httpServer = http.createServer(function(request, response) {
			response.writeHead(200);
			response.end();
		});
	}
	
	httpServer.on('error', function(e) {
		runningMode = 'child';
		console.log('%cI`M CLIENT', 'background:black;color:yellow;font-size: 30px');
		var socket = client('https://hardware.play-entry.org:23518', {query:{'childServer': true}});
		if(clientId) {
			socket.emit('matchTarget', { id : clientId });
		}
		socketClient = socket;
		self.connections.push(socket);
		socket.on('message', function (message) {
			if(message.type === 'utf8') {
				self.emit('data', message.utf8Data, message.type);
			} else if (message.type === 'binary') {
				self.emit('data', message.binaryData, message.type);
			}
		});		
		socket.on('mode', function (data) {
			socket.mode = data;
		});
		socket.on('disconnect', function() {
			socket.close();
			socket = null;
			self.open();
		});
		// setInterval(function() {
		// 	socket.emit('message', {type: 'utf8', mode: socket.mode, utf8Data: 'serverSend'});
		// }, 3000);
	});
	httpServer.on('listening', function(e) {
		runningMode = 'parent';
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
			
			self.connections.push(connection);
			if(logger) {
				logger.i('Entry connected.');
			}

			var childServerListCnt = Object.keys(self.childServerList).length;
			if(childServerListCnt > 0) {
				connection.emit('mode', 'multiMode');
			} else {
				connection.emit('mode', 'singleMode');
			}

			connection.on('matchTarget', function(target) {
				if(connection.handshake.query.childServer === 'true') {
					// Child 서버 접속 일때
					var clientId = target.id;
					self.childServerList[clientId] = connection.id;
					server.emit('mode', 'multiMode');
					server.to(connection.id).emit('matched', {client: clientId});
					server.to(clientId).emit('matched', {server: connection.id});
				} else {
					// Client 접속 일때
					if(self.childServerList[connection.id]) {
						server.to(self.childServerList[connection.id]).emit('matched', {client: connection.id});
						server.to(connection.id).emit('matched', {server: self.childServerList[connection.id]});
					}
				}
			});

			connection.on('disconnect', function(socket) {
				var clientId = '';
				if(connection.handshake.query.childServer === 'true') {
					clientId = _.findLastKey(self.childServerList, function (set) {
						return connection.id === id;
					});
					server.to(connection.id).emit('matching', {client: clientId});
					server.to(clientId).emit('matching', {server: connection.id});
				} else {
					clientId = connection.id;
					server.to(self.childServerList[connection.id]).emit('matching', {client: connection.id});
					server.to(connection.id).emit('matching', {server: self.childServerList[connection.id]});
				}

				delete self.childServerList[clientId];
				// TODO: 미아가 되는 Client 관리가 필요함. cloud pc 와야함..
				var childServerListCnt = Object.keys(self.childServerList).length;
				if(childServerListCnt === 0) {
					server.emit('mode', 'singleMode');
				}
			});

			connection.on('message', function(message) {
				if(message.mode === 'singleMode' || connection.id === masterClient) {
					if(message.type === 'utf8') {
						self.emit('data', message.utf8Data, message.type);
					} else if (message.type === 'binary') {
						self.emit('data', message.binaryData, message.type);
					}
				} else {
					if(connection.handshake.query.childServer === 'true') {
						var clientId = _.findLastKey(self.childServerList, function (id) {
							return connection.id === id;
						});
						server.to(clientId).emit('message', message);
					} else {
						server.to(self.childServerList[connection.id]).emit('message', message);
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
	}
};
	
Server.prototype.send = function(data) {
	var childServerListCnt = Object.keys(this.childServerList).length;
	if((runningMode === 'parent' && childServerListCnt === 0) || runningMode === 'child') {
		if(this.connections.length !== 0) {
			this.connections.map(function(connection){
				connection.emit('message', data);
			});
		}
	} else if(masterClient){
		this.server.to(masterClient).emit('message', data);
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
	
Server.prototype.close = function() {
	if(this.server) {
		// this.server.shutDown();
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

server = new Server();
module.exports = server;