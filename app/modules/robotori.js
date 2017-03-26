
//Module Constructor
function Module() {
	this.InputData =
	{
		A0:0,
		A1:0,
		A2:0,
		A3:0,
		A4:0,
		A5:0,
		D2:0,
		D3:0
	};

	this.OutputData = {
		D10:0,
		D11:0,
		D12:0,
		D13:0,
		AOUT5:0,
		AOUT6:0,
		AOUT9:0,
		SERVO:90,
		LEFT_MOTOR:255,
		RIGHT_MOTOR:255
	};

	this.sendBuffer = [];
	this.tmpTxBuffer = new Array(20);
	this.tmpRxBuffer = [];	
}

var ROBOTORI = 
{
	A0: 'A0',
	A1: 'A1',
	A2: 'A2',
	A3: 'A3',
	A4: 'A4',
	A5: 'A5',
	D2: 'D2',
	D3: 'D3',
	D10: 'D10',
	D11: 'D11',
	D12: 'D12',
	D13: 'D13',
	AOUT5: 'AOUT5',
	AOUT6: 'AOUT6',
	AOUT9: 'AOUT9',
	SERVO: 'SERVO',
	RIGHT_MOTOR: 'RIGHT_MOTOR',
	LEFT_MOTOR: 'LEFT_MOTOR'
};

//init set
Module.prototype.init = function(handler, config) {
//console.log('init');
};

//init senddata
Module.prototype.requestInitialData = function() {
/*
    this.sendBuffer.length = 0;

	//motor 4 LEFT_MOTOR
	this.tmpTxBuffer[0] = 0xA0;
	this.tmpTxBuffer[1] = 0x00;

	//Analog 5
	this.tmpTxBuffer[2] = 0xA8 ;
	this.tmpTxBuffer[3] = 0x00;

	//Analog 6
	this.tmpTxBuffer[4] = 0xB0 ;
	this.tmpTxBuffer[5] = 0x00;

	//motor 7 RIGHT_MOTOR
	this.tmpTxBuffer[6] = 0xB8;
	this.tmpTxBuffer[7] = 0x00;

	//motor 8 SERVO
	this.tmpTxBuffer[8] = 0xC0;
	this.tmpTxBuffer[9] = 0x00;

	//Analog 9
	this.tmpTxBuffer[10] = 0xC8;
	this.tmpTxBuffer[11] = 0x00;


	//Digital 10
	this.tmpTxBuffer[12] = 0xD0;
	this.tmpTxBuffer[13] = 0x00;

	//Digital 11
	this.tmpTxBuffer[14] = 0xD8;
	this.tmpTxBuffer[15] = 0x00;

	//Digital 12
	this.tmpTxBuffer[16] = 0xE0;
	this.tmpTxBuffer[17] = 0x00;

	//Digital 13
	this.tmpTxBuffer[18] = 0xE8;
	this.tmpTxBuffer[19] = 0x00;
	
	for (var index = 0; index < 20; index++)
    {
        this.sendBuffer.push(this.tmpTxBuffer[index]);
    }

	//console.log('send this.sendBuffer');	
	return this.sendBuffer;
	*/
	//console.log('requestInitialData');
	return null;
};

//init recvdata
Module.prototype.checkInitialData = function(data, config) {
//console.log('checkInitialData');
	return true;
};

Module.prototype.validateLocalData = function(data) {
//console.log('validateLocalData');
	return true;
};

//send hw
Module.prototype.requestLocalData = function() {
	//var data = this.OutputData;
//console.log('requestLocalData');
	this.sendBuffer.length = 0;

	//motor 4 LEFT_MOTOR
	this.tmpTxBuffer[0] = 0xA0 | (this.OutputData.LEFT_MOTOR & 0x80)>>7;
	this.tmpTxBuffer[1] = 0x7F & this.OutputData.LEFT_MOTOR;

	//Analog 5
	this.tmpTxBuffer[2] = 0xA8 | (this.OutputData.AOUT5 & 0x80)>>7;
	this.tmpTxBuffer[3] = 0x7F & this.OutputData.AOUT5;

	//Analog 6
	this.tmpTxBuffer[4] = 0xB0 | (this.OutputData.AOUT6 & 0x80)>>7;
	this.tmpTxBuffer[5] = 0x7F & this.OutputData.AOUT6;

	//motor 7 RIGHT_MOTOR
	this.tmpTxBuffer[6] = 0xB8 | (this.OutputData.RIGHT_MOTOR & 0x80)>>7;
	this.tmpTxBuffer[7] = 0x7F & this.OutputData.RIGHT_MOTOR;

	//motor 8 SERVO
	this.tmpTxBuffer[8] = 0xC0 | (this.OutputData.SERVO & 0x80)>>7;
	this.tmpTxBuffer[9] = 0x7F & this.OutputData.SERVO;

	//Analog 9
	this.tmpTxBuffer[10] = 0xC8 | (this.OutputData.AOUT9 & 0x80)>>7;
	this.tmpTxBuffer[11] = 0x7F & this.OutputData.AOUT9;


	//Digital 10
	this.tmpTxBuffer[12] = 0xD0;
	this.tmpTxBuffer[13] = 0x01 & this.OutputData.D10;

	//Digital 11
	this.tmpTxBuffer[14] = 0xD8;
	this.tmpTxBuffer[15] = 0x01 & this.OutputData.D11;

	//Digital 12
	this.tmpTxBuffer[16] = 0xE0;
	this.tmpTxBuffer[17] = 0x01 & this.OutputData.D12;

	//Digital 13
	this.tmpTxBuffer[18] = 0xE8;
	this.tmpTxBuffer[19] = 0x01 & this.OutputData.D13;
	
	for (var index = 0; index < 20; index++)
    {
        this.sendBuffer.push(this.tmpTxBuffer[index]);
    }

	//console.log('send this.sendBuffer');	
	return this.sendBuffer;
};


//Recv H/W
Module.prototype.handleLocalData = function(data) 
{ 
	var buff = data;
	var fSize = data.length;
	var temp = 0;
	var rxData = 0;
	//console.log('handleLocalData');
	for (var i = 0; i < data.length; i++) 
	{
		this.tmpRxBuffer.push(data[i]);
	}

	if( this.tmpRxBuffer.length >= 16 )
	{
		while(this.tmpRxBuffer.length > 1)
		{
			rxData = this.tmpRxBuffer.shift();

			temp = rxData & 0xF8;
			
			switch(temp) 
			{
	            case 0x80: 
	            {
					this.InputData.A0 = ((rxData & 0x01) << 7) | (this.tmpRxBuffer.shift() & 0x7F); 
	                break;
	            }
	            case 0x88: 
	            {
					this.InputData.A1 = ((rxData & 0x01) << 7) | (this.tmpRxBuffer.shift() & 0x7F);
	                break;
	            }
	            case 0x90: 
	            {
					this.InputData.A2 = ((rxData & 0x01) << 7) | (this.tmpRxBuffer.shift() & 0x7F);
	                break;
	            }
	            case 0x98: 
	            {
					this.InputData.A3 = ((rxData & 0x01) << 7) | (this.tmpRxBuffer.shift() & 0x7F);
	                break;
	            }
	            case 0xA0: 
	            {
					this.InputData.A4 = ((rxData & 0x01) << 7) | (this.tmpRxBuffer.shift() & 0x7F);
	                break;
	            }
	            case 0xA8: 
	            {
					this.InputData.A5 = ((rxData & 0x01) << 7) | (this.tmpRxBuffer.shift() & 0x7F);
	                break;
	            }
	            case 0xB0: 
	            {
	            	if( this.tmpRxBuffer.shift() && 0x01 == 0x01)
					{
						this.InputData.D2 = 1;
	                }
	                else
	                {
	                	this.InputData.D2 = 0;
	                }
	                break;
	            }
	            case 0xB8: 
	            {
					if( this.tmpRxBuffer.shift() && 0x01 == 0x01)
					{
						this.InputData.D3 = 1;
	                }
	                else
	                {
	                	this.InputData.D3 = 0;
	                }
	                break;
	            }
	           
	            default: 
	            {
	                break;
            	}
            }
		}
	}
	/*
	console.log('A0[' +  this.InputData.A0 + ']');	
	console.log('A1[' +  this.InputData.A1 + ']');
	console.log('A2[' +  this.InputData.A2 + ']');
	console.log('A3[' +  this.InputData.A3 + ']');
	console.log('A4[' +  this.InputData.A4 + ']');
	console.log('A5[' +  this.InputData.A5 + ']');
	console.log('D2[' +  this.InputData.D2 + ']');
	console.log('D3[' +  this.InputData.D3 + ']');
	*/
};


//recv Entry
Module.prototype.handleRemoteData = function(handler) 
{
	var newValue;

//console.log('handleRemoteData');
	if(handler.e(ROBOTORI.LEFT_MOTOR))
	{
		newValue = handler.read(ROBOTORI.LEFT_MOTOR);
		this.OutputData.LEFT_MOTOR = newValue;
		//console.log('LEFT_MOTOR[' + newValue +','+ this.OutputData.LEFT_MOTOR + ']');
	}

	if(handler.e(ROBOTORI.RIGHT_MOTOR))
	{
		newValue = handler.read(ROBOTORI.RIGHT_MOTOR);
		this.OutputData.RIGHT_MOTOR = newValue;
		//console.log('RIGHT_MOTOR[' + newValue +','+ this.OutputData.RIGHT_MOTOR + ']');
	}

	if(handler.e(ROBOTORI.D10))
	{
		newValue = handler.read(ROBOTORI.D10);
		this.OutputData.D10 = newValue;
		//console.log('D10[' +  this.OutputData.D10 + ']');
	}
	
	if(handler.e(ROBOTORI.D11))
	{
		newValue = handler.read(ROBOTORI.D11);
		this.OutputData.D11 = newValue;
		//console.log('D11[' +  this.OutputData.D11 + ']');
	}
	
	if(handler.e(ROBOTORI.D12))
	{
		newValue = handler.read(ROBOTORI.D12);
		this.OutputData.D12 = newValue;
		//console.log('D12[' +  this.OutputData.D12 + ']');
	}
	
	if(handler.e(ROBOTORI.D13))
	{
		newValue = handler.read(ROBOTORI.D13);
		this.OutputData.D13 = newValue;
		//console.log('D13[' +  this.OutputData.D13 + ']');
	}

	if(handler.e(ROBOTORI.AOUT5))
	{
		newValue = handler.read(ROBOTORI.AOUT5);
		if(newValue < 0) newValue = 0;
		else if(newValue > 255) newValue = 255;
		
		this.OutputData.AOUT5 = newValue;
		//console.log('AOUT5[' +  this.OutputData.AOUT5 + ']');
	}

	if(handler.e(ROBOTORI.AOUT6))
	{
		newValue = handler.read(ROBOTORI.AOUT6);
		if(newValue < 0) newValue = 0;
		else if(newValue > 255) newValue = 255;
		
		this.OutputData.AOUT6 = newValue;
		//console.log('AOUT6[' +  this.OutputData.AOUT6 + ']');
	}

	if(handler.e(ROBOTORI.AOUT9))
	{
		newValue = handler.read(ROBOTORI.AOUT9);
		if(newValue < 0) newValue = 0;
		else if(newValue > 255) newValue = 255;
		
		this.OutputData.AOUT9 = newValue;
		//console.log('AOUT9[' +  this.OutputData.AOUT9 + ']');
	}

	if(handler.e(ROBOTORI.SERVO))
	{
		newValue = handler.read(ROBOTORI.SERVO);
		if(newValue <= 0) newValue = 0;
		else if(newValue >= 180) newValue = 180;
		
		this.OutputData.SERVO = newValue;
		//console.log('SERVO[' +  this.OutputData.SERVO + ']');
	}
	//console.log('handleRemoteData');
};



//Send Entry
Module.prototype.requestRemoteData = function(handler) {
	var Senddata = this.InputData;
//console.log('requestRemoteData');	
	for(var key in Senddata) {
		handler.write(key, Senddata[key]);
	}
};

// Entry Web Socket Close function
Module.prototype.reset = function() {
//console.log('reset');
};

module.exports = new Module();

