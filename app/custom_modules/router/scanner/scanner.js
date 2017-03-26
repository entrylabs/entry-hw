'use strict';
const path = require('path');

function Scanner() {
}

Scanner.prototype.startScan = function(router, extension, config) {
	var logger = require('../../logger').get();
	logger.i('scanning...');

	var type = config.hardware.type;

	var scanner = require('./serial');
	this.scanner = scanner;
	scanner.startScan(extension, config, function(error, connector) {
		if(error) {
			logger.e(error);
		} else if(connector) {
			router.connect(connector, config);
		}
	}, router);
};

Scanner.prototype.stopScan = function() {
	if(this.scanner) {
		this.scanner.stopScan();
		this.scanner = undefined;
	}
};

module.exports = new Scanner();
