//모듈생성
function Module() {
	this.digitalValue = new Array(18);
	this.analogValue = new Array(5);
	this.remoteDigitalValue = new Array(18);
	this.readablePorts = null;
	this.remainValue = null;
}

var high_2bit=[ 0xc0,0xc0,0xc0,0xc0, // 0..3: LED1~4
				0xc0,0xc0,0xc0, // 4..6: TriLED1
				0xc0,0xc0,0xc0, // 7..9: TriLED2
				0xc0,0xc0, // 10.11: vibrat1~2
				0x80,0x80, // 12.13: Motor1~2
				0x80,0x80,0x80,0x80]; // 14..17: Servo1~4
var port_idx=[2,3,0,1,7,4,12,5,6,11,9,10,0,1,2,3,4,5];

//초기설정
Module.prototype.init = function(handler, config) {
};

//초기 송신데이터
Module.prototype.requestInitialData = function() {return null;};

//초기 수신데이터
Module.prototype.checkInitialData = function(data, config) { return true;};

Module.prototype.validateLocalData = function(data) { return true; };

//웹소켓 데이터 처리
//웹소켓에서 들어온 데이터가 처리되는데... 
Module.prototype.handleRemoteData = function(handler) {
	this.readablePorts = handler.read('readablePorts');
	var digitalValue = this.remoteDigitalValue;
	var temp;

	// 포트번호와 블럭의 맵핑
	// 포트번호는 속이고 포트값 대신 하드웨어 특성을 연결함
	digitalValue[0] = handler.read('led1');
	digitalValue[1] = handler.read('led2');
	digitalValue[2] = handler.read('led3');
	digitalValue[3] = handler.read('led4');
	//console.log('LED1', digitalValue[1]);
	digitalValue[4] = handler.read('triLEDR1');
	digitalValue[5] = handler.read('triLEDG1');
	digitalValue[6] = handler.read('triLEDB1');
	//console.log('TriLED1', digitalValue[4],digitalValue[5],digitalValue[6]);
	digitalValue[7] = handler.read('triLEDR2');
	digitalValue[8] = handler.read('triLEDG2');
	digitalValue[9] = handler.read('triLEDB2');
	digitalValue[10] = handler.read('vibrat1');
	//console.log('Vibrat1', digitalValue[10]);
	digitalValue[11] = handler.read('vibrat2');	
	digitalValue[12] = handler.read('dcMotor1');
	//console.log('dcMotor1', digitalValue[12]);
	digitalValue[13] = handler.read('dcMotor2');
	digitalValue[14] = handler.read('servo1');
	//console.log('servo1', digitalValue[14]);
	digitalValue[15] = handler.read('servo2');
	digitalValue[16] = handler.read('servo3');
	digitalValue[17] = handler.read('servo4');
};

// 하드웨어에 전달하는 경우에는 리턴하는 스트링이 전송된다.
// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {
	var queryString = [];

	/*
	var readablePorts = this.readablePorts;
	if (readablePorts) {
		for (var i in readablePorts) {
			var query = (5 << 5) + (readablePorts[i] << 1);
			queryString.push(query);
		}
	}
	*/

	var digitalValue = this.remoteDigitalValue;
	//0~17번 포트를 순회한다.
	for (var port = 0; port < 18; port++) {
		var value = digitalValue[port];
        var query;
        if (value == undefined) continue;
        if (value == null) continue;
        //if (value == 0) continue;

        query = high_2bit[port] | (port_idx[port]<<1);
        if (port == 12 || port == 13) { // dcMotor1,2
        	if (value < 0) {
        		query |= 1;
        		value = -value;
        	}
        }
        else if (value & 0x80)
        	query |= 1;
        queryString.push(query);
        queryString.push(value & 0x7f);
        //console.log('RLD', port, query.toString(16), (value&0x7f).toString(16));
	}
	// 반환되는 값이 하드웨어에 전달된다.
	return queryString;
};

// 하드웨어 데이터 처리
// 하드웨어에서 전송받은 데이터는 data인수로 받아들여지며 이것을 쪼갠다.
Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	var pointer = 0;
	var start=0;
	//console.log('HLD: ',data.length);
	if (!(data[0]&80)) start=1;

	for (var i = start; i < 8; i++) {
		var chunk;
		if(!this.remainValue) {
			chunk = data[i];
		} else {			
			chunk = this.remainValue;
			i--;
		}
		if (chunk & 0x80) {
			if ((chunk >> 6) & 1) {
				var nextChunk = data[i + 1];
				if(!nextChunk && nextChunk !== 0) {
					this.remainValue = chunk;
				} else {
					this.remainValue = null;

					var port = (chunk >> 3) & 7;
					this.analogValue[port] = ((chunk & 7) << 7) +
						(nextChunk & 127);
					//console.log('HLD ', port, this.analogValue[port].toString(16));
				}				
		    	i++;
			}
			/* else {
				var port = (chunk >> 2) & 15;
				this.digitalValue[port] = chunk & 1;
			}
			*/
		}
	}
};


//센서값의 맵핑
Module.prototype.requestRemoteData = function(handler) {
	//console.log('RRD ', this.analogValue);
	handler.write('adc1',this.analogValue[0]);
	handler.write('adc2',this.analogValue[1]);
	handler.write('adc3',this.analogValue[2]);
	handler.write('adc4',this.analogValue[3]);
};

Module.prototype.reset = function() {
	/*
	var i;
	var queryString = [];
	for (i=0; i<14; i++) {
		queryString.push(high_2bit[i] | (port_idx[i] << 1));
		queryString.push(0);
	}
	return queryString;
	*/
};

module.exports = new Module();
