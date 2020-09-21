function Module() {
	this.sensory = {
		adc0: 0,
		adc1: 0,
		adc2: 0,
		adc3: 0,		
		adc4: 0,

		remocon: 0,
		ultra: 0,

		gyroX: 0,
		gyroY: 0,
		gyroZ: 0,

		color: 0,
		key: 0
	};
	
	this.motoring = {
		rightWheel1: 0,
		leftWheel1: 0,
		rightWheel2: 0,
		leftWheel2: 0,

		OUT1: 90,
		OUT2: 90,
		OUT3: 90,

		OUT4: 0,
		OUT5: 0,
		LED: 0,
		BUZZER: 0,

		lcdNum: 0,
		lcdTxt: '                ',

		note: 262,
		duration: 0
	};

	this.flagCmdSend = {
		wheelCmd: false,
		servoCmd: false,
		analogCmd: false,
		digitalCmd: false,
		lcdCmd: false,
		toneCmd: false		
	};

	this.rxHeader = [0x52,0x58, 0x3D];

	this.sendBuffer = [];
	this.tmpBuffer = new Array(9);

	this.lcdState = 0;		
}

var MRT = {
	RIGHT_WHEEL1: 'RIGHT_WHEEL1',
	RIGHT_WHEEL2: 'RIGHT_WHEEL2',
	LEFT_WHEEL1: 'LEFT_WHEEL1',
	LEFT_WHEEL2: 'LEFT_WHEEL2',

	OUT1: 'OUT1',
	OUT2: 'OUT2',
	OUT3: 'OUT3',

	OUT4: 'OUT4',
	OUT5: 'OUT5',
	LED: 'LED',
	BUZZER: 'BUZZER',

	LCD_NUM: 'lcdNum',
	LCD_TXT: 'lcdTxt',

	NOTE: 'note',
	DURATION: 'duration',
	TEMP: 'temp'	
};

Module.prototype.init = function(handler, config) {
	//console.log(this.motoring.lcdTxt);
};

Module.prototype.requestInitialData = function() {
	return null;
};

Module.prototype.checkInitialData = function(data, config) {
	return true;
};

Module.prototype.ByteIndexOf = function(searched, find, start, end) {
	var matched = false;

	for (var index = start; index <= end - find.length; ++index)
    {
        // Assume the values matched.
        matched = true;

        // Search in the values to be found.
        for (var subIndex = 0; subIndex < find.length; ++subIndex)
        {
            // Check the value in the searched array vs the value
            // in the find array.
            if (find[subIndex] != searched[index + subIndex])
            {
                // The values did not match.
                matched = false;
                break;
            }
        }

        // If the values matched, return the index.
        if (matched)
        {
            // Return the index.
            return index;
        }
    }

    // None of the values matched, return -1.
    return -1;
};

// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	var buff = data;
	var fSize = data.length;

	var sensory = this.sensory;

	if(fSize >= 19) 
	{
		var index = this.ByteIndexOf(buff, this.rxHeader, 0, fSize);
		if (index != -1)
		{
		    var imageSize = this.makeWord(buff[index+3], buff[index+4]);
    
		    var imageBase = index + 5;
		    var num = 0;
			
			//console.log('fSize' + fSize + ' imageBase ' + imageBase +' index ' + index +' imageSize ' + imageSize);			    

			if(imageSize == 14 && buff[imageBase+13] == 0x30) {
				sensory.adc0 = buff[imageBase];
				sensory.adc1 = buff[imageBase+1];
				sensory.adc2 = buff[imageBase+2];
				sensory.adc3 = buff[imageBase+3];
				sensory.adc4 = buff[imageBase+4];

			    sensory.remocon = buff[imageBase+5];
			    sensory.ultra = this.makeWord(buff[imageBase+6], buff[imageBase+7]);
			    //sensory.ultra = ((buff[index+6] & 0xff) << 8) | (buff[index+7] & 0xff);
			    //sensory.ultra = buff[index+7];
			    //console.log('Got adc data ! ' + sensory.adc0 + ' ' + sensory.adc1 + ' ' + sensory.adc2 + ' ' + sensory.adc3 + ' ' + sensory.adc4 + ' ' + sensory.ultra);

       			num = buff[imageBase+8];
			    if(num >=128)
        		{
            		num=-256+num;
        		}
        		sensory.gyroX = num;

       			num = buff[imageBase+9];
			    if(num >=128)
        		{
            		num=-256+num;
        		}
        		sensory.gyroY = num;

       			num = buff[imageBase+10];
			    if(num >=128)
        		{
            		num=-256+num;
        		}
        		sensory.gyroZ = num;
			    
			    sensory.color = buff[imageBase+11];
			    sensory.key = buff[imageBase+12];
			    //console.log('Got RX serial data ! ' + sensory.ultra + ' ' + sensory.color + ' ' + sensory.key);
			}
		}		
	}

};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
};

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var flagCmdSend = this.flagCmdSend;	
	var newValue;

	if(handler.e(MRT.RIGHT_WHEEL1)) {
		newValue = handler.read(MRT.RIGHT_WHEEL1);
		if(newValue < -10) newValue = -10;
		else if(newValue > 10) newValue = 10;
		if(motoring.rightWheel1 != newValue)
		{
			motoring.rightWheel1 = newValue;
			flagCmdSend.wheelCmd = true;
		}
	}

	if(handler.e(MRT.LEFT_WHEEL1)) {
		newValue = handler.read(MRT.LEFT_WHEEL1);
		if(newValue < -10) newValue = -10;
		else if(newValue > 10) newValue = 10;
		if(motoring.leftWheel1 != newValue)
		{
			motoring.leftWheel1 = newValue;
			flagCmdSend.wheelCmd = true;
		}
	}

	if(handler.e(MRT.RIGHT_WHEEL2)) {
		newValue = handler.read(MRT.RIGHT_WHEEL2);
		if(newValue < -10) newValue = -10;
		else if(newValue > 10) newValue = 10;
		if(motoring.rightWheel2 != newValue)
		{
			motoring.rightWheel2 = newValue;
			flagCmdSend.wheelCmd = true;
		}
	}

	if(handler.e(MRT.LEFT_WHEEL2)) {
		newValue = handler.read(MRT.LEFT_WHEEL2);
		if(newValue < -10) newValue = -10;
		else if(newValue > 10) newValue = 10;
		if(motoring.leftWheel2 != newValue)
		{
			motoring.leftWheel2 = newValue;
			flagCmdSend.wheelCmd = true;
		}
	}

	if(handler.e(MRT.OUT1)) {
		newValue = handler.read(MRT.OUT1);
		if(newValue < 0) newValue = 0;
		else if(newValue > 180) newValue = 180;
		if(motoring.OUT1 != newValue)
		{
			motoring.OUT1 = newValue;
			flagCmdSend.servoCmd = true;
		}
	}

	if(handler.e(MRT.OUT2)) {
		newValue = handler.read(MRT.OUT2);
		if(newValue < 0) newValue = 0;
		else if(newValue > 180) newValue = 180;
		if(motoring.OUT2 != newValue)
		{
			motoring.OUT2 = newValue;
			flagCmdSend.servoCmd = true;
		}
	}

	if(handler.e(MRT.OUT3)) {
		newValue = handler.read(MRT.OUT3);
		if(newValue < 0) newValue = 0;
		else if(newValue > 180) newValue = 180;
		if(motoring.OUT3 != newValue)
		{
			motoring.OUT3 = newValue;
			flagCmdSend.servoCmd = true;
		}
	}

	if(handler.e(MRT.OUT4)) {
		newValue = handler.read(MRT.OUT4);
		if(newValue < 0) newValue = 0;
		else if(newValue > 1) newValue = 1;
		if(motoring.OUT4 != newValue)
		{
			motoring.OUT4 = newValue;
			flagCmdSend.digitalCmd = true;
		}
	}

	if(handler.e(MRT.OUT5)) {
		newValue = handler.read(MRT.OUT5);
		if(newValue < 0) newValue = 0;
		else if(newValue > 1) newValue = 1;
		if(motoring.OUT5 != newValue)
		{
			motoring.OUT5 = newValue;
			flagCmdSend.digitalCmd = true;
		}
	}

	if(handler.e(MRT.LED)) {
		newValue = handler.read(MRT.LED);
		if(newValue < 0) newValue = 0;
		else if(newValue > 1) newValue = 1;
		if(motoring.LED != newValue)
		{
			motoring.LED = newValue;
			flagCmdSend.digitalCmd = true;
		}
	}	

	if(handler.e(MRT.BUZZER)) {
		newValue = handler.read(MRT.BUZZER);
		if(newValue < 0) newValue = 0;
		else if(newValue > 1) newValue = 1;
		if(motoring.BUZZER != newValue)
		{
			motoring.BUZZER = newValue;
			flagCmdSend.digitalCmd = true;
		}
	}	


	if(handler.e(MRT.LCD_NUM)&&handler.e(MRT.LCD_TXT)) {
		newValue = handler.read(MRT.LCD_NUM);
		if(newValue < 0) newValue = 0;		
		else if(newValue > 1)  newValue = 1;

		var lcdTxtValue = handler.read(MRT.LCD_TXT)+ '                ';

		if(motoring.lcdNum != newValue || motoring.lcdTxt != lcdTxtValue)
		{
			motoring.lcdNum = newValue;	
			motoring.lcdTxt = lcdTxtValue;
			flagCmdSend.lcdCmd = true;
			this.lcdState = 0;
			//console.log('LCD_TXT ' + motoring.lcdTxt);			
		}
	}

	if(handler.e(MRT.NOTE) && handler.e(MRT.DURATION)) {
		var noteValue = handler.read(MRT.NOTE);
		var durValue = handler.read(MRT.DURATION);

		//if(newValue < 0) newValue = 0;
		//else if(newValue > 250)  newValue = 250;
		if(motoring.note != noteValue || motoring.duration != durValue)
		{
			motoring.note = noteValue;
			motoring.duration = durValue;
			flagCmdSend.toneCmd = true;
			console.log('DURATION ' + motoring.note + ' ' + motoring.duration);
		}		
	}

	//console.log('handleRemoteData');
};


// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {
	var MOTOR_SPEED = 0;
	var SERVO_ANGLE = 3;
	var ANALOG_WRITE = 4;
	var DIGITAL_WRITE = 5;
	var RGB_WRITE = 6;
	var LCD_WRITE = 7;
	var TONE_PLAY = 8;

	var motoring = this.motoring;
	var flagCmdSend = this.flagCmdSend;	
	var buffer = this.tmpBuffer;

	var gridNum = 0;

	this.sendBuffer.length = 0;

	if(flagCmdSend.wheelCmd)
	{
		this.MRTcmdBuild(MOTOR_SPEED, motoring.leftWheel1, motoring.rightWheel1, motoring.leftWheel2, motoring.rightWheel2, 0);
		for (var i = 0; i < buffer.length; i++) {
			this.sendBuffer.push(buffer[i]);
		}
		flagCmdSend.wheelCmd = false;

		if(this.sendBuffer.length!=0)
			return this.sendBuffer;
	}

	if(flagCmdSend.servoCmd)
	{
		this.MRTcmdBuild(SERVO_ANGLE, motoring.OUT1, motoring.OUT2, motoring.OUT3, 0, 0);
		for (var i = 0; i < buffer.length; i++) {
			this.sendBuffer.push(buffer[i]);
		}
		flagCmdSend.servoCmd = false;

		if(this.sendBuffer.length!=0)
			return this.sendBuffer;
	}

	if(flagCmdSend.digitalCmd)
	{
		this.MRTcmdBuild(DIGITAL_WRITE, motoring.OUT4, motoring.OUT5, motoring.LED, motoring.BUZZER, 0);
		for (var i = 0; i < buffer.length; i++) {
			this.sendBuffer.push(buffer[i]);
		}
		flagCmdSend.digitalCmd = false;

		if(this.sendBuffer.length!=0)
			return this.sendBuffer;		
	}	

	if(flagCmdSend.toneCmd)
	{
		var note = motoring.note;
		var duration =  motoring.duration;

		//console.log('toneCmd ' + note + ' ' + duration);
		this.MRTcmdBuild(TONE_PLAY, note >>8, note, duration, 0, 0);

		for (var i = 0; i < buffer.length; i++) {
			this.sendBuffer.push(buffer[i]);
		}

		flagCmdSend.toneCmd = false;

		if(this.sendBuffer.length!=0)
			return this.sendBuffer;
	}

	if(flagCmdSend.lcdCmd)
	{
		//console.log('lcdCmd ' + motoring.lcdTxt);			
		gridNum = motoring.lcdNum*4 + this.lcdState;

		if(this.lcdState == 0)
		{
			this.MRTcmdBuild(LCD_WRITE, gridNum, motoring.lcdTxt[0].charCodeAt(0), motoring.lcdTxt[1].charCodeAt(0), motoring.lcdTxt[2].charCodeAt(0),  motoring.lcdTxt[3].charCodeAt(0));
			this.lcdState++;
		}
		else if(this.lcdState == 1)
		{
			this.MRTcmdBuild(LCD_WRITE, gridNum, motoring.lcdTxt[4].charCodeAt(0), motoring.lcdTxt[5].charCodeAt(0), motoring.lcdTxt[6].charCodeAt(0),  motoring.lcdTxt[7].charCodeAt(0));
			this.lcdState++;
		}
		else if(this.lcdState == 2)
		{
			this.MRTcmdBuild(LCD_WRITE, gridNum, motoring.lcdTxt[8].charCodeAt(0), motoring.lcdTxt[9].charCodeAt(0), motoring.lcdTxt[10].charCodeAt(0),  motoring.lcdTxt[11].charCodeAt(0));
			this.lcdState++;
		}
		else if(this.lcdState == 3)
		{
			this.MRTcmdBuild(LCD_WRITE, gridNum, motoring.lcdTxt[12].charCodeAt(0), motoring.lcdTxt[13].charCodeAt(0), motoring.lcdTxt[14].charCodeAt(0),  motoring.lcdTxt[15].charCodeAt(0));
			this.lcdState++;
		}

		for (var i = 0; i < buffer.length; i++) {
			this.sendBuffer.push(buffer[i]);
		}
		
		flagCmdSend.lcdCmd = false;

		if(this.lcdState <= 3)
		{
			var timerId = setTimeout(function() {
				flagCmdSend.lcdCmd = true;
				//clearTimeout(timerId);
				//console.log('setTimeout');				
			}, 30);
		}
		
		if(this.sendBuffer.length!=0)
			return this.sendBuffer;
	}

	//return this.tmpBuffer;
	//console.log('requestLocalData');

	//if(this.sendBuffer.length!=0)
	//{	
		//console.log('send this.sendBuffer');	
	//	return this.sendBuffer;
	//}
	return null;
};

Module.prototype.MRTcmdBuild = function(cmd, d0, d1, d2, d3, d4) {
	this.tmpBuffer[0] = 0x58; // header1
	this.tmpBuffer[1] = 0x52; // header2
	this.tmpBuffer[2] = cmd & 0xff;
	this.tmpBuffer[3] = d0 & 0xff;
	this.tmpBuffer[4] = d1 & 0xff;
	this.tmpBuffer[5] = d2 & 0xff;
	this.tmpBuffer[6] = d3 & 0xff;
	this.tmpBuffer[7] = d4 & 0xff;	
	this.tmpBuffer[8] = 0x53; // tail
};

Module.prototype.makeWord = function(hi, lo) {
	return (((hi & 0xff) << 8) | (lo & 0xff));
};

Module.prototype.getLowByte = function(a) {
	return (a & 0xff);
};

Module.prototype.getHighByte = function(a) {
	return ((a >> 8) & 0xff);
};

Module.prototype.reset = function() {
};

module.exports = new Module();
