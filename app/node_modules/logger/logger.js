'use strict';
function Logger() {
	this.logger = {
		v: function(str) {
			console.log(str);
		},
		i: function(str) {
			console.info(str);
		},
		w: function(str) {
			console.warn(str);
		},
		e: function(str) {
			console.error(str);
		}
	};
}

Logger.prototype.set = function(logger) {
	if(logger.v) {
		this.logger.v = logger.v;
	}
	if(logger.i) {
		this.logger.i = logger.i;
	}
	if(logger.w) {
		this.logger.w = logger.w;
	}
	if(logger.e) {
		this.logger.e = logger.e;
	}
};

Logger.prototype.get = function() {
	return this.logger;
};

module.exports = new Logger();