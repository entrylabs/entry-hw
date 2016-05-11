'use strict';
var util = require('util');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

function Server() {
	EventEmitter.call(this);
	this.packet = new Buffer([0x01, 0x00, 0x00, 0x00]);
	this.connections = [];
}

util.inherits(Server, EventEmitter);

Server.prototype.open = function(logger) {
	var WebSocketServer = require('../websocket').server;
	// var http = require('https');
	var http;
	var PORT = 23518;
	var self = this;
	var httpServer;
	// var appPath = 'app';
	// if(NODE_ENV === 'production') {
	// 	appPath = 'resources/app.asar';
	// }
	
	if(fs.existsSync(path.resolve(global.__dirname, 'ssl', 'cert.pem'))) {
		http = require('https');
		httpServer = http.createServer({
		    key: fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'hardware.play-entry.key')),
		    cert: fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'cert.pem')),
		    ca: fs.readFileSync(path.resolve(global.__dirname, 'ssl', 'Symantec-Chain_sha2.pem'))
		});
	} else {
		http = require('http');
		httpServer = http.createServer(function(request, response) {
			response.writeHead(404);
			response.end();
		});
	}

	self.httpServer = httpServer;
	httpServer.listen(PORT, function() {
		if(logger) {
			logger.i('Listening on port ' + PORT);
		}
	});

	var server = new WebSocketServer({
		httpServer: httpServer,
		autoAcceptConnections: false
	});
	self.server = server;
	server.on('request', function(request) {
		var connection = request.accept();
		self.connections.push(connection);
		if(logger) {
			logger.i('Entry connected.');
		}
		
		connection.on('message', function(message) {
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
};

Server.prototype.closeSingleConnection = function(connection) {
	var connections = this.connections;
	var index = connections.indexOf(connection);
	if (index > -1) 
		this.connections.slice(index, 1);
};
	
Server.prototype.send = function(data) {
	if(this.connections.length !== 0) {
		this.connections.map(function(connection){
			connection.send(data);
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
		this.server.shutDown();
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