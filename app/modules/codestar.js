function Module() {
//모듈의 constructor
	this.digitalValue = new Array(20);
	this.analogValue = new Array(8);

	this.remoteDigitalValue = new Array(20);
	this.readablePorts = null;
	this.remainValue = null;

	this.sensory = {
		temperature: 0,
		geomagnetic: 0,
		sonar: 0,
		leftwheel: 0,
		rightwheel: 0,
		tilt: 0
	};
}

//필요시 Handler Data 초기값 설정
Module.prototype.init = function(handler, config) {
};

//필요시 연결직후 Hardware에 보내는 초기값 설정
Module.prototype.requestInitialData = function() {
	return null;
};

//연결직후 Hardware에서보내는 Inital데이터의 Vaildation
Module.prototype.checkInitialData = function(data, config) {
	return true;
};

//Hardware에서 보내는 모든 데이터의 Vaildation
Module.prototype.validateLocalData = function(data) {
	return true;
};

// 서버에서 보내온 데이터 세팅
Module.prototype.handleRemoteData = function(handler) {
	this.readablePorts = handler.read('readablePorts');
	var digitalValue = this.remoteDigitalValue;
	for (var port = 0; port < 20; port++) {
		var value = handler.read(port);
		//console.log('port: '+port+', value: '+value)
		digitalValue[port] = value;
	}
};

// Hardware에서 보내온 데이터 세팅
Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	for (var i = 0; i < 32; i++) {
		var chunk;
		if(!this.remainValue) {
			chunk = data[i];
		} else {			
			chunk = this.remainValue;
			i--;
		}
		if (chunk >> 7) {
			if ((chunk >> 6) & 1) {
				var nextChunk = data[i + 1];
				if(!nextChunk && nextChunk !== 0) {
					this.remainValue = chunk;
				} else {
					this.remainValue = null;

					var port = (chunk >> 3) & 7;
					this.analogValue[port] = ((chunk & 7) << 7) +
						(nextChunk & 127);
					if(port == 5){ 
						var sensory = this.sensory;
						sensory.temperature = Math.round((500 * (((chunk & 7) << 7) +
						(nextChunk & 127))) / 1024);
					}
					else if(port == 1){
						var sensory = this.sensory;
						sensory.sonar = ((chunk & 7) << 7) +
						(nextChunk & 127);
					}
					else if(port == 4){
						var sensory = this.sensory;
						sensory.tilt = (((chunk & 7) << 7) +
						(nextChunk & 127)) == 0 ? 0 : 1;
					}
				}				
		    i++;
			} else {
				var port = (chunk >> 2) & 15;
				this.digitalValue[port] = chunk & 1;
			}
		}
	}
};

// 서버에 보낼 데이터 세팅
Module.prototype.requestRemoteData = function(handler) {
	for (var i = 0; i < this.analogValue.length; i++) {
		var value = this.analogValue[i];
		handler.write('a' + i, value);
	}
	for (var i = 0; i < this.digitalValue.length; i++) {
		var value = this.digitalValue[i];
		handler.write(i, value);
	}
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
};

// Hardware에 보낼 데이터 세팅
Module.prototype.requestLocalData = function() {
	var queryString = [];
	var query = (5 << 5) + (4 << 1); // remocon
	queryString.push(query);
	query = (5 << 5) + (12 << 1); // push button
	queryString.push(query);
	
	var digitalValue = this.remoteDigitalValue;
	var value = digitalValue[7];	// red led
	query = (7 << 5) + (7 << 1) + (value == 255 ? 1 : 0);	
	queryString.push(query);

	value = digitalValue[8];	// blue led
	query = (7 << 5) + (8 << 1) + (value == 255 ? 1 : 0);	
	queryString.push(query);

	value = digitalValue[13];	// vibration motor
	query = (7 << 5) + (13 << 1) + (value == 255 ? 1 : 0);	
	queryString.push(query);

	for(var i = 9; i < 12; i++){
		value = digitalValue[i];	// 3color r, g, b
		if( value > 0 && value < 255 ){
			query = (6 << 5) + (i << 1) + (value >> 7);
			queryString.push(query);
			query = value & 127;
			queryString.push(query);
		} else if(value == 0){	// returned by system	
			// digitalWrite(LOW);
			query = (7 << 5) + (i << 1) + (value == 255 ? 1 : 0);	
			queryString.push(query);
		}
	}

	value = digitalValue[14];	// drive
	if( value > 0 && value < 255 ){
		query = (6 << 5) + (14 << 1) + (value >> 7);	
		queryString.push(query);
		query = value & 127;
		queryString.push(query);
	} else if(value == 0){ // returned by system 
		// drive stop
		value = 1;
		query = (6 << 5) + (14 << 1) + (value >> 7);	
		queryString.push(query);
		query = value & 127;
		queryString.push(query);
	}

	value = digitalValue[15];	// buzzer
	if( value > 0 && value < 255 ){
		query = (6 << 5) + (15 << 1) + (value >> 7);
		queryString.push(query);
		query = value & 127;
		queryString.push(query);
	} else if(value == 0){ // returned by system 
		// buzzer stop
		value = 24;
		query = (6 << 5) + (15 << 1) + (value >> 7);	
		queryString.push(query);
		query = value & 127;
		queryString.push(query);
	}
	return queryString;
};

// 서버 Connect 종료시 값 세팅
Module.prototype.reset = function() {
};

module.exports = new Module();