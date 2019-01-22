function Module() {
    this.sp = null;
   
	this.MAX_PACKET_BUFFER = 1024;
	this.STX = 0x02;
	this.ETX = 0x03;
	this.ESC = 0x23;
	this.DLE = 0x40;
	this.DEFAULT_CRC = 0xff;

	this.CMD_DEVICE_OK = 0x00;
	this.CMD_EXECUTE = 0x01;
	this.CMD_STATUS = 0x02;
	this.CMD_ERROR = 0x03;
	this.CMD_SENSOR_CFG = 0xf0;
   
   
	this.DAT= 0x10;
	this.CMD= 0x20;
	this.UDP= 0x30;
   
	this.sensor_sonic = 0x01;
	this.sensor_line1 = 0x02;
	this.sensor_line2 = 0x04;
   
	this.configSend  = false;  
   
   
	this.ELIO =  {
		DC1: 0,
		DC2: 1,
		SV1: 2,
		SV2: 3,

		V3: 4,
		V5: 5,
		
		IO1: 6,
		IO2: 7,
		IO3: 8,
		IO4: 9,
	},
	
	
	this.StatusData =  {
		V3: 0,
		V5: 1,
		IO1: 2,
		IO2: 3,
		IO3: 4,
		IO4: 5,
		DC1: 6,
		DC2: 7,
		SV1: 8,
		SV2: 9,
		

		SONIC: 'SONIC',
		LINE1: 'LINE1',
		LINE2: 'LINE2',
	},
	
	
	
	
	this.localBuffer = new Array(14);

    this.PacketState = 
	{
		PS_STX : 0,
		PS_DATA : 1,
		PS_ESC : 2,
	};

	this.buffer = new Array(this.MAX_PACKET_BUFFER);
	this.pos = 0;
	this.packetState = this.PacketState.PS_STX;

	
    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

Module.prototype.initPacket = function()
{
	this.packetState = this.PacketState.PS_STX;
	this.pos = 0;
}


Module.prototype.addData = function(data, len)
{

	//var nonPacketStream = [];
	
	for (var i = 0; i < len; i++)
	{
		var ch = data[i];

		if (ch == this.STX)
		{
			this.initPacket();
			this.packetState = this.PacketState.PS_DATA;
			continue;
		}

		switch (this.packetState)
		{
			case this.PacketState.PS_STX:
				//nonPacketStream.push(ch);
				
				//if (this.nonPacketStream.Length == this.nonPacketStream.Capacity)
				//	this.fireNonPacketStream();
				//break;
			
			case this.PacketState.PS_DATA:
				if (ch == this.ETX)
				{
					if (this.verifyCRC())
					{
						console.log("CRC ok : "  +this.buffer + "len : "  + this.pos);

						 this.buffer[0] ; //48 (udp)
						 this.buffer[1];  //2   (status)
						 
						 this.StatusData.DC1 = this.buffer[2];
						 this.StatusData.DC2 = this.buffer[3];
						 
						 this.StatusData.SV1 = this.buffer[4];
						 this.StatusData.SV2 = this.buffer[5];
						 
						 this.StatusData.V3 = this.buffer[6];
						 this.StatusData.V5 = this.buffer[7];
						 
						 this.StatusData.IO1 = this.buffer[8];
						 this.StatusData.IO2 = this.buffer[9];
						 this.StatusData.IO3 = this.buffer[10];
						 this.StatusData.IO4 = this.buffer[11];
						 
						 
						 this.StatusData.SONIC = (this.buffer[12]  | this.buffer[13] << 8);
						 this.StatusData.LINE1 = (this.buffer[14]  | this.buffer[15] << 8) == 0 ? 1 : 0 ;
						 this.StatusData.LINE2 = (this.buffer[16]  | this.buffer[17] << 8) == 0 ? 1 : 0 ;
						
						
					}
					else
					{
						console.log("CRC error");
					}

					this.initPacket();
				}
				else if (ch == this.ESC)
				{
					this.packetState = this.PacketState.PS_ESC;
				}
				else
				{
					if (ch < this.ETX) 
						this.initPacket();
					else 
						this.appendChar(ch);
				}
				break;
			case this.PacketState.PS_ESC:
				if (ch ==this.ESC)
				{
					this.packetState = this.PacketState.PS_DATA;
					this.appendChar(ch);
				}
				else
				{
					this.packetState = this.PacketState.PS_DATA;
					this.appendChar(ch ^ this.DLE);
				}
				break;
			default:
				break;
		}
	}

	//this.fireNonPacketStream();
}

Module.prototype.appendChar = function(ch)
{
	if (this.pos >= this.MAX_PACKET_BUFFER)
	{
		this.initPacket();
		return;
	}

	this.buffer[this.pos++] = ch;
}


Module.prototype.verifyCRC=function()
{
	var crc = this.DEFAULT_CRC;
	for (var i = 0; i < this.pos; i++)
	{
		crc ^= this.buffer[i];
	}

	return crc == 0;
}



Module.prototype.encode=function(ch,stream)
{
	if (ch <= this.ETX)
	{
		stream.push(this.ESC);
		stream.push(ch ^ this.DLE);
	}
	else if (ch == this.ESC)
	{
		stream.push(ch);
		stream.push(ch);
	}
	else
	{
		stream.push(ch);
	}
};

Module.prototype.encodePacket=function(arr)
{
	var data = [];
	data.push(this.STX);
	
	var ch = 0xFF;
	var crc = this.DEFAULT_CRC;

	for (var i = 0; i < arr.length; i++) {
		ch = arr[i];
		this.encode(ch, data);
		crc ^= ch;
	}
	
	this.encode(crc, data);
	data.push(this.ETX);

	return data;
};


Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
    var self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
	
	configSend = false;
	var initialBuffer = new Array(5);
	
	initialBuffer[0] = 0x20; // header1
	initialBuffer[1] = 0x50; // header2
	initialBuffer[2] = 0x00; // command
	initialBuffer[3] = 0x00; // length
	initialBuffer[4] = 0x00; // tail1
	
    return initialBuffer;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.afterConnect = function(that, cb) {
    that.connected = true;
	this.configSend = false;
    if(cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};



Module.prototype.handleRemoteData = function(handler) {
	 var self = this;
	
		this.localBuffer = new Array(15);

		this.localBuffer[0] = this.UDP;
		this.localBuffer[1] = this.CMD_EXECUTE;

		for (var port in this.ELIO) {
			var idx = this.ELIO[port];
			var value = handler.read(port);

			if (value === undefined)continue;
			this.localBuffer[idx + 2] = value;
		}
		
		this.localBuffer[12] = handler.read("SONIC")  == undefined ? 0 : handler.read("SONIC");
		this.localBuffer[13] = handler.read("LINE1")  == undefined ? 0 : handler.read("LINE1");
		this.localBuffer[14] = handler.read("LINE2")  == undefined ? 0 : handler.read("LINE2");
	
		this.localBuffer = this.encodePacket(this.localBuffer);
		
};

Module.prototype.requestLocalData = function() {
	return this.localBuffer;
};


Module.prototype.isRecentData = function(port, type, data) {
    var isRecent = false;

    if(port in this.recentCheckData) {
        if(type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
            isRecent = true;
        }
    }

    return isRecent;
}

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {

	console.log(data);
    this.addData(data, data.length);
};

Module.prototype.requestRemoteData = function(handler) {
	for (var key in this.StatusData) {
        handler.write(key, this.StatusData[key]);
    }
};

Module.prototype.disconnect = function(connect) {
    var self = this;
    connect.close();
    if(self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
	this.initialize();
	configSend = false;
};



Module.prototype.initialize = function() {
	this.localBuffer = new Array(15);
		
	this.localBuffer[0] = this.UDP;
	this.localBuffer[1] = this.CMD_EXECUTE;

	for (var port in this.ELIO) {
		var idx = this.ELIO[port];
		var value = handler.read(port);

		if (value === undefined)continue;
		this.localBuffer[idx + 2] = 0;
	}

	this.localBuffer[12] =0;
	this.localBuffer[13] = 0;
	this.localBuffer[14] =0;
	
	this.localBuffer = this.encodePacket(this.localBuffer);
};



module.exports = new Module();