'use strict';
const logger = require('../../logger').get();

class Scanner {
	startScan(router, extension, config) {
		if (!this.scanner) {
			this.scanner = require('./serial');
		}

		logger.i('scanning...');
		this.scanner.startScan(extension, config, function(error, connector) {
			if(error) {
				logger.e(error);
			} else if(connector) {
				router.connect(connector, config);
			}
		}, router);
	};

	stopScan() {
		if(this.scanner) {
			this.scanner.stopScan();
			this.scanner = undefined;
		}
	};
}

module.exports = new Scanner();
