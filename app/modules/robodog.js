function Module() {
	this.cmdData = [0x26, 0xA8, 0x14, 0x81, 0x28, 0x00, 0x00, 0x00, 0x00, 0x00, 
					0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
					0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
					0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
					0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.dongleData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
					0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.robodog_head = [0x26, 0xA8, 0x14, 0x8A];	
	this.rk_cnt = 0;
	this.pktCnt = -1;
	this.pktLength = 6;
	this.ledPacket = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	this.txCnt = 0;
}

Module.prototype.init = function(handler, config) {
};

Module.prototype.requestInitialData = function() {
	return null;
};

Module.prototype.checkInitialData = function(data, config) {
	return true;
};

Module.prototype.validateLocalData = function(data) {
	return true;
};



function checksum(cmd){
    let sum = 0;

    cmd.forEach(function (value, idx) {
        if(idx > 5)
            sum += value;
    });
    return sum&0xFF;
}


 /////////////// 엔트리에서 받은 데이터에 대한 처리  /////////////////////
Module.prototype.handleRemoteData = function(handler) {   
	let cmd = handler.read('CMD');

	if(typeof cmd !== 'object')
		return;
		
	this.cmdData = cmd.slice();	
	if(this.cmdData[14] > 0){
		if(this.cmdData[14] == 2){
			this.ledPacket[0] = (this.cmdData[14]&0xC0) | 0x82;
			this.ledPacket[1] = this.ledPacket[1] | 0x80;
			for(let n=0; n<16; n++)
				this.ledPacket[2+n] = this.cmdData[24+n];
		}
		if(this.cmdData[14] == 3){
			this.ledPacket[0] = (this.cmdData[14]&0xC0) | 0x83;
			this.ledPacket[1] = this.ledPacket[1] | 0x80;
			for(let n=0; n<16; n++)
				this.ledPacket[2+n] = this.cmdData[24+n];
		}
		if(this.cmdData[14] == 4){
			this.ledPacket[1] = (this.cmdData[14]&0xC0) | 0x44;
			this.ledPacket[0] = this.ledPacket[0] | 0x40;
			for(let n=0; n<16; n++)
				this.ledPacket[18+n] = this.cmdData[24+n];
		}
	}
	else{
		this.ledPacket[0] = 0;
		this.ledPacket[1] = 0;
	}
};


 //////////////// 하드웨어로 보낼 데이터 로직  /////////////
Module.prototype.requestLocalData = function() {  
	if(((this.ledPacket[0]&0xC0) == 0xC0) || ((this.ledPacket[1]&0xC0) == 0xC0)){
		if((this.txCnt%2) == 0){
			this.cmdData[14]  = this.ledPacket[0];
			for(let n=0; n<16; n++)
				this.cmdData[24+n] = this.ledPacket[2+n];
		}
		else{
			this.cmdData[14]  = this.ledPacket[1];
			for(let n=0; n<16; n++)
				this.cmdData[24+n] = this.ledPacket[18+n];
		}
		this.cmdData[5] = checksum(this.cmdData);
		this.txCnt += 1;
	}
	return this.cmdData;
};

///////////// 하드웨어에서 온 데이터 처리 ///////////////////
Module.prototype.handleLocalData = function(data) { 
	let sensorData = this.sensorData;
	let dongleData = this.dongleData;
	let pktLength = this.pktLength;
	
	let robodog_head = this.robodog_head;
	data.forEach(function (value) {
		this.rk_cnt = (value==robodog_head[this.rk_cnt])? this.rk_cnt+1 : 0;
		if(this.rk_cnt == 4){
			this.rk_cnt = 0;
			this.pktCnt = 0;
		}
		else if(this.pktCnt >= 0){
			if(this.pktCnt == 0)
					pktLength = ((value>0) && (value<19))? value-4 : 16;
			dongleData[4+this.pktCnt++] = value;
		}
		
		if(this.pktCnt == pktLength){
			this.pktCnt = -1;
			var sum = 0;
			dongleData.forEach(function (value, idx) {
				if(idx > 5)
					sum += value;
			});
			if(dongleData[5] == (sum&0xFF)){
				dongleData.forEach(function (value, idx) {
					sensorData[idx] = value;	
				});
			}
		}
	});
	this.pktLength = pktLength;
};

function unsingToSign8(data)
{
	return data>127? data-256 : data;
}
function unsingToSign16(data)
{
	return data>32767? data-65536 : data;
}

///////////// 엔트리로 전달할 데이터 ///////////////////////////
Module.prototype.requestRemoteData = function(handler) { 
	handler.write("SENSORDATA", this.sensorData);  
	handler.write('BATTERY', this.sensorData[6]);   
	handler.write('TOF', this.sensorData[7]);
	handler.write('ROLL', unsingToSign8(this.sensorData[8])); 
	handler.write('PITCH', unsingToSign8(this.sensorData[9])); 
	handler.write('YAW', unsingToSign16(this.sensorData[10] + this.sensorData[11]*256)); 
	handler.write('RB0', this.sensorData[12]>127? this.sensorData[12]-256 : this.sensorData[12]); 
	handler.write('RB1', this.sensorData[13]>127? this.sensorData[13]-256 : this.sensorData[13]); 
	handler.write('RB2', this.sensorData[14]>127? this.sensorData[14]-256 : this.sensorData[14]); 
	handler.write('RB3', this.sensorData[15]>127? this.sensorData[15]-256 : this.sensorData[15]); 
	handler.write('BUTTON', this.sensorData[16]); 
	handler.write('RB_WATCHDOG', this.sensorData[17]); 
	handler.write('RB4', this.sensorData[18]>127? this.sensorData[18]-256 : this.sensorData[18]); 
	handler.write('RB5', this.sensorData[19]>127? this.sensorData[19]-256 : this.sensorData[19]); 
};

Module.prototype.reset = function() {
	this.cmdData = [0x26, 0xA8, 0x14, 0x81, 0x28, 0x00, 0x00, 0x00, 0x00, 0x00, 
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x64, 0x64, 0x64, 0x64, 0x64, 0x64, 0x64, 0x64];
	this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.ledPacket = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	console.log("reset");
};

module.exports = new Module();
