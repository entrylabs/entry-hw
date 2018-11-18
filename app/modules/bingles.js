function Module() {
	this.sensory = {
		ir0: 0,
		ir1: 0,
		ir2: 0,
		ir3: 0,

		light: 0,
		mic: 0,
		remocon: 0,
		battery: 0,

		temp: 0,
	};
	
	this.motoring = {
		rightWheel: 0,
		leftWheel: 0,
		head: 90,
		armR: 90,
		armL: 90,
		led: 0,
		ledR: 0,
		ledG: 0,
		ledB: 0,
		lcdTxt0: ' ',
		lcdTxt1: ' ',
		note: 'C4',
		duration: 0,
		motor_direction: 'Forward',
		motor_duration: 0,
		oledImage: 0,		
	};

	this.flagCmdSend = {
		wheelCmd: false,
		motorgoCmd: false,
		servoCmd: false,
		digitalCmd: false,
		rgbCmd: false,
		oledCmd: false,		
		toneCmd: false,		
		lcdCmd: false,
		lcdCmd1: false

	};

	this.rxHeader = [0x52,0x58, 0x3D];

	this.sendBuffer = [];
	this.tmpBuffer = new Array(9);

	this.lcdState = 0;
	this.lcdState1 = 0;				
}

var BINGLES = {
	RIGHT_WHEEL: 'RIGHT_WHEEL',
	LEFT_WHEEL: 'LEFT_WHEEL',
	HEAD: 'HEAD',
	ARMR: 'ARMR',
	ARML: 'ARML',
	HEAD_LED: 'HEAD_LED',
	LED_R: 'ledR',
	LED_G: 'ledG',
	LED_B: 'ledB',
	LCD_NUM: 'lcdNum',
	LCD_TXT: 'lcdTxt',	
	NOTE: 'note',
	DURATION: 'duration',
	MOTOR_DIRECTION: 'motor_direction',
	MOTOR_DURATION: 'motor_duration',	
	OLEDIMAGE: 'OLEDImage',
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

	if(fSize >= 15) 
	{
		var index = this.ByteIndexOf(buff, this.rxHeader, 0, fSize);
		if (index != -1)
		{
		    //var imageSize = this.makeWord(buff[index+3], buff[index+4]);
		    var imageBase = index + 5;
			//console.log('fSize' + fSize + ' imageBase ' + imageBase +' index ' + index +' imageSize ' + imageSize);			    

			if(buff[index+3] == 0x31 && buff[index+4] == 0x30 && buff[imageBase+9] == 0x30) {
				sensory.ir0 = buff[imageBase];
				sensory.ir1 = buff[imageBase+1];
				sensory.ir2 = buff[imageBase+2];
				sensory.ir3 = buff[imageBase+3];
				sensory.light = buff[imageBase+4];
			    sensory.mic = buff[imageBase+5];

			    //console.log('Got ir data ! ' + sensory.ir0 + ' ' + sensory.ir1 + ' ' + sensory.ir2 + ' ' + sensory.ir3 + ' ' + sensory.light + ' ' + sensory.mic);

			    sensory.remocon = buff[imageBase+6];
			    sensory.battery = buff[imageBase+7];
			    //sensory.temp = buff[imageBase+8];
			    //console.log('Got RX serial data ! ' + sensory.remocon + ' ' + sensory.battery + ' ' + sensory.temp);
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

	if(handler.e(BINGLES.RIGHT_WHEEL)) {
		newValue = handler.read(BINGLES.RIGHT_WHEEL);
		if(newValue < -255) newValue = -255;
		else if(newValue > 255) newValue = 255;
		if(motoring.rightWheel != newValue)
		{
			motoring.rightWheel = newValue;
			flagCmdSend.wheelCmd = true;
		}
	}

	if(handler.e(BINGLES.LEFT_WHEEL)) {
		newValue = handler.read(BINGLES.LEFT_WHEEL);
		if(newValue < -255) newValue = -255;
		else if(newValue > 255) newValue = 255;
		if(motoring.leftWheel != newValue)
		{
			motoring.leftWheel = newValue;
			flagCmdSend.wheelCmd = true;
		}
	}

	if(handler.e(BINGLES.HEAD)) {
		newValue = handler.read(BINGLES.HEAD);
		if(newValue < 10) newValue = 10;
		else if(newValue > 170) newValue = 170;
		if(motoring.head != newValue)
		{
			motoring.head = newValue;
			flagCmdSend.servoCmd = true;
		}
	}

	if(handler.e(BINGLES.ARMR)) {
		newValue = handler.read(BINGLES.ARMR);
		if(newValue < 10) newValue = 10;
		else if(newValue > 170) newValue = 170;
		if(motoring.armR != newValue)
		{
			motoring.armR = newValue;
			flagCmdSend.servoCmd = true;
		}
	}	

	if(handler.e(BINGLES.ARML)) {
		newValue = handler.read(BINGLES.ARML);
		if(newValue < 10) newValue = 10;
		else if(newValue > 170) newValue = 170;
		if(motoring.armL != newValue)
		{
			motoring.armL = newValue;
			flagCmdSend.servoCmd = true;
		}
	}


	if(handler.e(BINGLES.HEAD_LED)) {
		newValue = handler.read(BINGLES.HEAD_LED);
		//console.log('HEAD_LED' + newValue);
		if(newValue < 0) newValue = 0;
		else if(newValue > 1) newValue = 1;
		if(motoring.led != newValue)
		{
			motoring.led = newValue;
			flagCmdSend.digitalCmd = true;
		}
	}	


	if(handler.e(BINGLES.LED_R)) {
		newValue = handler.read(BINGLES.LED_R);
		if(newValue < 0) newValue = 0;
		else if(newValue > 255) newValue = 255;
		if(motoring.ledR != newValue)
		{
			motoring.ledR = newValue;
			flagCmdSend.rgbCmd = true;
		}
	}

	if(handler.e(BINGLES.LED_G)) {
		newValue = handler.read(BINGLES.LED_G);
		if(newValue < 0) newValue = 0;
		else if(newValue > 255) newValue = 255;
		if(motoring.ledG != newValue)
		{
			motoring.ledG = newValue;
			flagCmdSend.rgbCmd = true;
		}
	}

	if(handler.e(BINGLES.LED_B)) {
		newValue = handler.read(BINGLES.LED_B);
		if(newValue < 0) newValue = 0;
		else if(newValue > 255) newValue = 255;
		if(motoring.ledB != newValue)
		{
			motoring.ledB = newValue;
			flagCmdSend.rgbCmd = true;
		}
	}

	if(handler.e(BINGLES.LCD_NUM)&&handler.e(BINGLES.LCD_TXT)) {
		newValue = handler.read(BINGLES.LCD_NUM);
		if(newValue < 0) newValue = 0;		
		else if(newValue > 1)  newValue = 1;

		var lcdTxtValue = handler.read(BINGLES.LCD_TXT);

		if(newValue == 0 && motoring.lcdTxt0 != lcdTxtValue)
		{
			motoring.lcdTxt0 = lcdTxtValue;
			flagCmdSend.lcdCmd = true;
			this.lcdState = 0;
			console.log('LCD_TXT0 ' + motoring.lcdTxt0);			
		}
		else if(newValue == 1 && motoring.lcdTxt1 != lcdTxtValue)
		{
			motoring.lcdTxt1 = lcdTxtValue;
			flagCmdSend.lcdCmd1 = true;
			this.lcdState1 = 0;
			console.log('LCD_TXT1 ' + motoring.lcdTxt0);			
		}
	}	

	if(handler.e(BINGLES.OLEDIMAGE)) {
		newValue = handler.read(BINGLES.OLEDIMAGE);

		//console.log('OLEDIMAGE ' + newValue);
		if(newValue < 0) newValue = 0;
		else if(newValue > 29) newValue = 29;

		if(motoring.oledImage != newValue)
		{
			motoring.oledImage = newValue;
			flagCmdSend.oledCmd = true;
		}
	}

	if(handler.e(BINGLES.NOTE) && handler.e(BINGLES.DURATION)) {
		var noteValue = handler.read(BINGLES.NOTE);
		var durValue = handler.read(BINGLES.DURATION);
		//console.log('DURATION ' + motoring.note + ' ' + motoring.duration);
				
		if(motoring.note != noteValue || motoring.duration != durValue)
		{
			motoring.note = noteValue;
			motoring.duration = durValue;
			flagCmdSend.toneCmd = true;
		}
		//console.log('duration' + motoring.duration);	
	}
	
	if(handler.e(BINGLES.MOTOR_DIRECTION) && handler.e(BINGLES.MOTOR_DURATION)) {
		var dirValue = handler.read(BINGLES.MOTOR_DIRECTION);
		var durValue = handler.read(BINGLES.MOTOR_DURATION);
		//console.log('NOTE' + motoring.note);
		if(motoring.motor_direction != dirValue || motoring.motor_duration != durValue){
			motoring.motor_direction = dirValue;
			motoring.motor_duration = durValue;
			flagCmdSend.motorgoCmd = true;
			//console.log('NOTE' + motoring.note);
		}
		//console.log('motor_direction' + motoring.motor_direction);
	}

	//console.log('handleRemoteData');
};


// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {
	var MOTOR_SPEED = 0x30;
	var MOTOR_GO = 0x31;
	var SERVO_ANGLE = 0x32;
	var RGB_WRITE = 0x33;	
	var TONE_PLAY = 0x34;	
	var HEAD_LED = 0x35;
	var LCD_TEXT = 0x37;
	var OLED_IMAGE = 0x38;
	
	var motoring = this.motoring;
	var flagCmdSend = this.flagCmdSend;	
	
	var buffer;

	var tmpValue = 0;
	this.sendBuffer.length = 0;	

		if(flagCmdSend.wheelCmd)
		{
			this.sendBuffer.push(MOTOR_SPEED);
			
			tmpValue = motoring.leftWheel;

			if(tmpValue>=0)
				this.sendBuffer.push(0x2B);
			else
				this.sendBuffer.push(0x2D);
			
			tmpValue = Math.abs(tmpValue)
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));

			tmpValue = motoring.rightWheel;

			if(tmpValue>=0)
				this.sendBuffer.push(0x2B);
			else
				this.sendBuffer.push(0x2D);
			
			tmpValue = Math.abs(tmpValue)
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));

			this.sendBuffer.push(0x53);

			flagCmdSend.wheelCmd = false;

			if(this.sendBuffer.length!=0)
				return this.sendBuffer;
		}

		if(flagCmdSend.servoCmd)
		{
			this.sendBuffer.push(SERVO_ANGLE);
			
			tmpValue = motoring.head; 
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));

			tmpValue = motoring.armL; 
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));

			tmpValue = motoring.armR; 
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));

			this.sendBuffer.push(0x53);

			flagCmdSend.servoCmd = false;

			if(this.sendBuffer.length!=0)
				return this.sendBuffer;
		}


		if(flagCmdSend.digitalCmd)
		{
			this.sendBuffer.push(HEAD_LED);
			this.sendBuffer.push(motoring.led + 0x30);
			this.sendBuffer.push(0x53);

			flagCmdSend.digitalCmd = false;

			if(this.sendBuffer.length!=0)
				return this.sendBuffer;		
		}	

		if(flagCmdSend.rgbCmd)
		{
			this.sendBuffer.push(RGB_WRITE);
			this.sendBuffer.push(0x30); //index of RGB LED
			
			tmpValue = motoring.ledR; 
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));

			tmpValue = motoring.ledG; 
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));

			tmpValue = motoring.ledB; 
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));

			this.sendBuffer.push(0x53);

			flagCmdSend.rgbCmd = false;
			
			if(this.sendBuffer.length!=0)
				return this.sendBuffer;
		}

		if(flagCmdSend.toneCmd)
		{
			this.sendBuffer.push(TONE_PLAY);
			
			this.sendBuffer.push(motoring.note.charCodeAt(0));
			this.sendBuffer.push(motoring.note.charCodeAt(1));

			var duration = motoring.duration;
			if (duration > 99) duration = 99;

			buffer = this.leadingZeros(duration,2);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			//console.log('duration buf' + ' ' + buffer.charCodeAt(0) + ' ' + buffer.charCodeAt(1));
			this.sendBuffer.push(0x53);

			flagCmdSend.toneCmd = false;

			if(this.sendBuffer.length!=0)
				return this.sendBuffer;
		}

		if(flagCmdSend.oledCmd)
		{
			this.sendBuffer.push(OLED_IMAGE);
			
			tmpValue = motoring.oledImage;
			buffer = this.leadingZeros(tmpValue,3);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			this.sendBuffer.push(buffer.charCodeAt(2));
			this.sendBuffer.push(0x53);
			

			//console.log('OLED_IMAGE ' + buffer.charCodeAt(0));
			

			flagCmdSend.oledCmd = false;
		
			if(this.sendBuffer.length!=0)
				return this.sendBuffer;
		}

		//console.log('requestLocalData');

		//if(this.sendBuffer.length!=0)
		//{	
			//console.log('send this.sendBuffer');	
		//	return this.sendBuffer;
		//}
		if(flagCmdSend.motorgoCmd){
			//console.log('true');
			this.sendBuffer.push(MOTOR_GO);
			this.sendBuffer.push(motoring.motor_direction.charCodeAt(0));
			/*
			this.sendBuffer.push(0x32);
			this.sendBuffer.push(0x30);
			this.sendBuffer.push(0x30);	*/
			
			if(motoring.motor_direction == 'Forward' || motoring.motor_direction == 'Backward'){
				this.sendBuffer.push(0x32);
				this.sendBuffer.push(0x34);
				this.sendBuffer.push(0x30);
			}
			else if(motoring.motor_direction == 'Left Turn' || motoring.motor_direction == 'Right Turn'){
				this.sendBuffer.push(0x32);
				this.sendBuffer.push(0x30);
				this.sendBuffer.push(0x30);
			}

			var motor_duration = motoring.motor_duration;
			if (motor_duration > 99) motor_duration = 99;

			buffer = this.leadingZeros(motor_duration,2);

			this.sendBuffer.push(buffer.charCodeAt(0));
			this.sendBuffer.push(buffer.charCodeAt(1));
			//console.log('motor_duration' + ' ' + buffer.charCodeAt(0) + ' ' + buffer.charCodeAt(1));
			this.sendBuffer.push(0x53);

			flagCmdSend.motorgoCmd = false;
			
			if(this.sendBuffer.length!=0)
				return this.sendBuffer;
		}



	if(flagCmdSend.lcdCmd)
	{
		this.sendBuffer.length = 0;	
		this.sendBuffer.push(LCD_TEXT);
		this.sendBuffer.push(0x30);			
	
		var lcdString = motoring.lcdTxt0+ '                ';	

		this.sendBuffer.push(lcdString[0].charCodeAt(0));
		this.sendBuffer.push(lcdString[1].charCodeAt(0));
		this.sendBuffer.push(lcdString[2].charCodeAt(0));
		this.sendBuffer.push(lcdString[3].charCodeAt(0));
		this.sendBuffer.push(lcdString[4].charCodeAt(0));
		this.sendBuffer.push(lcdString[5].charCodeAt(0));
		this.sendBuffer.push(lcdString[6].charCodeAt(0));
		this.sendBuffer.push(lcdString[7].charCodeAt(0));
		this.sendBuffer.push(lcdString[8].charCodeAt(0));
		this.sendBuffer.push(lcdString[9].charCodeAt(0));

		this.sendBuffer.push(0x53);
		console.log('lcdTxt0'+lcdString);		


		//this.lcdState++;
		flagCmdSend.lcdCmd = false;

		if(this.sendBuffer.length!=0)
			return this.sendBuffer;
	}

	if(flagCmdSend.lcdCmd1)
	{

		this.sendBuffer.length = 0;	
		this.sendBuffer.push(LCD_TEXT);
		this.sendBuffer.push(0x31);			

		var lcdString = motoring.lcdTxt1+ '                ';	

		this.sendBuffer.push(lcdString[0].charCodeAt(0));
		this.sendBuffer.push(lcdString[1].charCodeAt(0));
		this.sendBuffer.push(lcdString[2].charCodeAt(0));
		this.sendBuffer.push(lcdString[3].charCodeAt(0));
		this.sendBuffer.push(lcdString[4].charCodeAt(0));
		this.sendBuffer.push(lcdString[5].charCodeAt(0));
		this.sendBuffer.push(lcdString[6].charCodeAt(0));
		this.sendBuffer.push(lcdString[7].charCodeAt(0));
		this.sendBuffer.push(lcdString[8].charCodeAt(0));
		this.sendBuffer.push(lcdString[9].charCodeAt(0));

		this.sendBuffer.push(0x53);
		console.log('lcdTxt1'+lcdString);	

		//this.lcdState1++;
		flagCmdSend.lcdCmd1 = false;
		if(this.sendBuffer.length!=0)
			return this.sendBuffer;

	}
	return null;
};

Module.prototype.leadingZeros = function(n, digits) {
  var zero = '';
  n = n.toString();

  if (n.length < digits) {
    for (var i = 0; i < digits - n.length; i++)
      zero += '0';
  }
  return zero + n;
}


Module.prototype.makeWord = function(hi, lo) {
	return (((hi & 0xff) << 8) | (lo & 0xff));
};

Module.prototype.getLowByte = function(a) {
	return (a & 0xff);
};

Module.prototype.getHighByte = function(a) {
	return ((a >> 8) & 0xff);
};

Module.prototype.delay = function(ms) {
   ms += new Date().getTime();
   while (new Date() < ms){}
}

Module.prototype.reset = function() {

	var motoring = this.motoring;
	motoring.rightWheel= 0;
	motoring.leftWheel= 0;
	motoring.head= 90;
	motoring.armR= 90;
	motoring.armL= 90;
	motoring.led= 0;
	motoring.ledR= 0;
	motoring.ledG= 0;
	motoring.ledB= 0;
	motoring.lcdTxt0 = ' ';
	motoring.lcdTxt1 = ' ';
	motoring.note= 'C4';
	motoring.duration= 0;
	motoring.motor_direction= 'F';
	motoring.motor_duration= 0;
	motoring.oledImage= 0;
};


module.exports = new Module();
