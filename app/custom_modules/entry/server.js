'use strict';
var util = require('util');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var client = require('socket.io-client');
const {ipcRenderer} = require('electron');

function Server() {
	EventEmitter.call(this);
	this.packet = new Buffer([0x01, 0x00, 0x00, 0x00]);
	this.connections = [];
	this.connectionSet = {};
	this.roomCnt = 0;
	this.childServerList = [];
}

util.inherits(Server, EventEmitter);

Server.prototype.open = function(logger) {
	// var WebSocketServer = require('../websocket').server;
	// var WebSocketClient = require('../websocket').client;
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
		console.log('%cI`M CLIENT', 'background:black;color:yellow;font-size: 30px');
		var socket = client('https://hardware.play-entry.org:23518', {query:{'childServer': true}});
		socket.on('message', function (data) {
			console.log(data);
		});
		socket.on('disconnect', function() {
			// ipcRenderer.send('reload');
			socket.close();
			socket = null;
			self.open();
		});
		// setInterval(function() {
		// 	socket.emit('message', {data: 'dasdasdasd'});
		// }, 1000);
	});
	httpServer.on('listening', function(e) {
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

		console.log('server');
		self.server = server;
		server.on('connection', function(socket) {
			var connection = socket;
			if(connection.handshake.query.childServer === 'true') {
				self.childServerList.push(connection.id);
				server.emit('message', 'multiModeChange');
			}
			self.connections.push(connection);
			if(logger) {
				logger.i('Entry connected.');
			}

			if(self.childServerList.length > 0) {
				connection.emit('message', 'multiMode');
			} else {
				connection.emit('message', 'singleMode');
			}
			connection.on('disconnect', function(socket) {
				self.childServerList = self.childServerList.filter(function(id) {
					return (id !== connection.id);
				});
				if(self.childServerList.length === 0) {
					server.emit('message', 'singleModeChange');
				}
				console.log(arguments, connection, self.childServerList);
			});
			connection.on('message', function(message) {
				console.log(message);
				if(message.type === 'utf8') {
					self.emit('data', message.utf8Data, message.type);
				} else if (message.type === 'binary') {
					self.emit('data', message.binaryData, message.type);
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
	if(this.connections.length !== 0) {
		this.connections.map(function(connection){
			// connection.send(data);
			connection.emit('message', data);
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

module.exports = new Server();