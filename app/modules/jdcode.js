function Module() {
	this.cmdData = [0x26, 0xA8, 0x14, 0xB3, 0x22, 0x2F, 0x00, 0x00, 0x00, 0x00, 0x00, 
									0x00, 0x00, 0x2F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
									0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.ctlData = [0x26, 0xA8, 0x14, 0xB1, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,	
									0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
										 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.dongleData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
										 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.jdcode_head = [0x26, 0xA8, 0x14, 0xA2];	
	this.sensorRqtPkt	= [0x26, 0xA8, 0x14, 0xB2, 0x08, 0x0A, 0x09, 0x01];							 
	this.oldNoteCount = 0;
	this.oldPitchCnt = 0;
	this.oldRollCnt = 0;
	this.oldYawCnt = 0;
	this.emergency = 0;
	this.posX = 0;
	this.posY = 0;
	this.yawDegree = 0;
	this.throttle = 0;
	this.oldOption = 0;
	this.rk_cnt = 0;
	this.pktCnt = -1;
	this.pktLength = 6;
	this.deviceType = 0;
	this.txCnt = 0;
}

Module.prototype.init = function(handler, config) {
	console.log("init");
};

Module.prototype.requestInitialData = function() {
	this.deviceType = 0;
	this.pktLength = 6;
	this.sensorData[6] = false;
	console.log("requestInitialData");
	return null;
};

Module.prototype.checkInitialData = function(data, config) {
	console.log("checkInitialData");
	return true;
};

Module.prototype.validateLocalData = function(data) {
	return true;
};

Module.prototype.handleRemoteData = function(handler) {
		var cmd = handler.read('CMD');
		this.noteCount = handler.read('noteCount');
		var rollCnt = handler.read('rollCnt');
		var pitchCnt = handler.read('pitchCnt');
		var yawCnt = handler.read('yawCnt');
		var cmdData = this.cmdData;
		var ctlData = this.ctlData;
	
		if(typeof cmd != "object")
				return;

		if(rollCnt == 0)
				this.oldRollCnt = this.posX = 0;
		else if(rollCnt != this.oldRollCnt){
				var n = cmd[4] | cmd[5]*256;
		    if(n > 32767) n = -1*(65536-n);	
				this.posX += n;	
				this.oldRollCnt = rollCnt;
		}

		if(pitchCnt == 0)
				this.oldPitchCnt = this.posY = 0;
		else if(pitchCnt != this.oldPitchCnt){
				var n = cmd[6] | cmd[7]*256;
		    if(n > 32767) n = -1*(65536-n);	
				this.posY += n;
				this.oldPitchCnt = pitchCnt;
		}
		
		if(yawCnt == 0)
				this.oldYawCnt = this.yawDegree = 0;
		else if(yawCnt != this.oldYawCnt){
				var n = cmd[20] | cmd[21]*256;
		    if(n > 32767) n = -1*(65536-n);	
				this.yawDegree += n;
				this.oldYawCnt = yawCnt;
		}	
		
		this.throttle = cmd[22] | cmd[23]*256;
		
		if((cmd[8]&0x24) == 0x24){
				cmd[4] = this.posX&0xFF;
				cmd[5] = (this.posX>>8)&0xFF;
				cmd[6] = this.posY&0xFF;
				cmd[7] = (this.posY>>8)&0xFF;
				cmd[20] = this.yawDegree&0xFF;
				cmd[21] = (this.yawDegree>>8)&0xFF;
		}
		if((cmd[8]&0x01) == 0x01)
				this.oldOption = cmd[8];
		else{
				this.emergency = 20;
				this.posX = 0;
				this.posY = 0;
				this.yawDegree = 0;
		}
					
		if(this.deviceType == 1){
				cmd.forEach(function (value, idx) {
		        	cmdData[idx+5] = value;
		    });
			
				if(this.noteCount == this.oldNoteCount)
						cmdData[7] = 0;

				var sum = 0;
				cmdData.forEach(function (value, idx) {
						if(idx > 5)
		        	sum += value;
		    });
		    cmdData[5] = sum&0xFF;
  	}
  	else{
  		if((cmd[9]>0) || (cmd[10]>0) || (cmd[11]>0) || (cmd[12]>0)){
  					this.oldOption = 0x8000;
  					ctlData[6] = cmd[9];
  					ctlData[7] = 0x00;
  					ctlData[8] = cmd[10];
  					ctlData[9] = 0x00;
						ctlData[10] = cmd[11];
  					ctlData[11] = 0x00;
  					ctlData[12] = cmd[12];  					
  					ctlData[13] = 0x00;
  					ctlData[17] = 0x00;
		  			ctlData[16] = 0x03;
		  			ctlData[19] = 0x00;
		  			ctlData[18] = 0x00;
  				
  			}
  			else{
	  			ctlData[6] = cmd[4];
	  			ctlData[7] = cmd[5];
	  			ctlData[8] = cmd[6];
	  			ctlData[9] = cmd[7];
	  			ctlData[10] = cmd[20];
	  			ctlData[11] = cmd[21];
	  			ctlData[12] = cmd[22];
	  			ctlData[13] = cmd[23];
	  			ctlData[14] = cmd[8];
	  			ctlData[15] = cmd[19];
	  			ctlData[16] = cmd[24];
	  			ctlData[17] = cmd[25];
	  			ctlData[18] = cmd[26];
	  			ctlData[19] = cmd[27];
	  		}
  			var sum = 0;
				ctlData.forEach(function (value, idx) {
						if(idx > 5)
		        	sum += value;
		    });
		    ctlData[5] = sum&0xFF;
  	}
};

Module.prototype.requestLocalData = function() {
		this.oldNoteCount = this.noteCount;	
		var cmdData = this.cmdData;
		var ctlData = this.ctlData;
		var opt = this.oldOption | 0x01;
		var sum = 0;


		if((this.oldOption!=0x8000) && (this.emergency>0)){
				opt = this.oldOption & 0xFE;
				this.emergency -= 1;
		}

				
		if(this.deviceType==1){
				cmdData[13] = opt;
				cmdData.forEach(function (value, idx) {
						if(idx > 5)
		        	sum += value;
		    });
		    cmdData[5] = sum&0xFF;
				return this.cmdData;
		}
		else{
				ctlData[14] = opt&0xFF;
				ctlData[15] = (opt>>8)&0xFF;
				if(ctlData[18]==0){
						ctlData[18] = 0x12;
						ctlData[19] = 0x34;
				}
				ctlData.forEach(function (value, idx) {
						if(idx > 5)
		        	sum += value;
		    });
		    ctlData[5] = sum&0xFF;
		    
				if(this.pktLength==6)
						return this.sensorRqtPkt;
				else{
					if((++this.txCnt%5)==0)			
							return this.ctlData;
					else
							return null;
				}
		}		
};

Module.prototype.handleLocalData = function(data) { 
		var sensorData = this.sensorData;
		var dongleData = this.dongleData;
		var deviceType = this.deviceType
		var pktLength = this.pktLength;
		
		
		if((deviceType!=2) && (data.length==26) && (data[3]==0xA3)){
				deviceType = 1;
				data.forEach(function (value, idx) {
						if(idx>5)
        				sensorData[idx-5] = value;
    		});
		}
		else if(deviceType!=1){
			  var jdcode_head = this.jdcode_head;
				data.forEach(function (value, idx) {
        		this.rk_cnt = (value==jdcode_head[this.rk_cnt])? this.rk_cnt+1 : 0;
        		if(this.rk_cnt == 4){
        				deviceType = 2;
              	this.rk_cnt = 0;
              	this.pktCnt = 0;
        		}
        		else if(this.pktCnt >= 0){
        				if(this.pktCnt == 0)
        						pktLength = ((value>0) && (value<19))? value-4 : 14;
        				dongleData[this.pktCnt++] = value;
        		}
        		if(this.pktCnt == pktLength){
        				this.pktCnt = -1;
        				var sum = 0;
        				dongleData.forEach(function (value, idx) {
										if(idx > 1)
        						sum += value;
        				});
        				if(dongleData[1] == (sum&0xFF)){
        						deviceType = 2;
        						sensorData[6] = true;
        						sensorData[15] = dongleData[5];
        						sensorData[7] = dongleData[9];
        						sensorData[8] = dongleData[7];
        						sensorData[9] = dongleData[8];
        						sensorData[10] = (dongleData[3]&0x03)? false : true;
        						sensorData[16] = dongleData[10];
        						sensorData[17] = dongleData[11];
        						sensorData[18] = dongleData[12];
        						sensorData[19] = dongleData[13];	
        				}
        		}
        		
        });
		}
		if((this.throttle>0) && (sensorData[10]==false)){
				this.emergency = 20;
		}
		this.deviceType = deviceType;
		this.pktLength = pktLength;
};

Module.prototype.requestRemoteData = function(handler) {
		for (var i = 1; i < 11; i++) {
        var value = this.sensorData[i];
        if((i==1) || (i==3))
        		handler.write('A' + i, 100-value);
        else if(i==4)
        		handler.write('A' + i, value-100);
        else if(i==5)
        		handler.write('A' + i, (~value)&0xFF);
        else
        		handler.write('A' + i, value);
    }
    var n = this.sensorData[8];
    if(n > 127)	n = -1*(256-n);
    handler.write('A8', n);
    
    n = this.sensorData[9];
    if(n > 127)	n = -1*(256-n);
    handler.write('A9', n);
    
    handler.write('A15', this.sensorData[15]);
    
    n = this.sensorData[16] | this.sensorData[17]*256;
    if(n > 32767) n = -1*(65536-n);
    handler.write('A16', n);
    
    n = this.sensorData[18] | this.sensorData[19]*256;
    if(n > 32767) n = -1*(65536-n);
    handler.write('A18', n);
    
		handler.write("CMD", this.sensorData);     
};

Module.prototype.reset = function() {
		this.cmdData = [0x26, 0xA8, 0x14, 0xB3, 0x22, 0x2F, 0x00, 0x00, 0x00, 0x00, 0x00, 
										0x00, 0x00, 0x2F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
										0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
		this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
										 	 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
		this.oldNoteCount = 0;
		this.emergency = 0;
		this.posX = 0;
		this.posY = 0;
		console.log("reset");
};

module.exports = new Module();
