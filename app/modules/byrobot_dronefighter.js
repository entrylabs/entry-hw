'use strict';


/***************************************************************************************
 *	모듈 기본 함수
 ***************************************************************************************/

/*
	대상 장치로부터 수신 받는 데이터는 모두 _updated 변수를 최상단에 붙임.
	업데이트 된 경우 _updated를 1로 만들고 entry로 전송이 끝나면 다시 0으로 변경
 */

// 모듈 생성
function Module()
{
	// -- JSON Objects ----------------------------------------------------------------
    // LedModeColor
	this.ledModeColor =
	{
		mode: 0,
		r: 0,
		g: 0,
		b: 0,
		interval: 0
	}

	// LedEventColor
	this.ledEventColor =
	{
		event: 0,
		r: 0,
		g: 0,
		b: 0,
		interval: 0,
		repeat: 0,
	}

	// Control
	this.control =
	{
		roll: 0,
		pitch: 0,
		yaw: 0,
		throttle: 0
	}

	// Attitude
	this.attitude =
	{
		_updated: 0,
		roll: 0,
		pitch : 0,
		yaw: 0
	}

	// UpdateInformation
	this.updateInformation =
	{
		_updated: 0,
		modeUpdate: 0,		// u8
		deviceType: 0,		// u32
		imageType: 0,		// u8
		imageVersion: 0,	// u16
		year: 0,			// u8
		month: 0,			// u8
		day: 0				// u8
	}


	// -- Hardware ----------------------------------------------------------------
	this.bufferReceive		= [];		// 데이터 수신 버퍼
	this.bufferTransfer		= [];		// 데이터 송신 버퍼

	this.dataType			= 0;		// 수신 받은 데이터의 타입
	this.dataLength			= 0;		// 수신 받은 데이터의 길이
	this.indexSession		= 0;		// 수신 받는 데이터의 세션
	this.indexReceiver		= 0;		// 수신 받는 데이터의 세션 내 위치
	this.dataBlock			= [];		// 수신 받은 데이터 블럭
	this.crc16Calculated	= 0;		// CRC16 계산 된 결과
	this.crc16Received		= 0;		// CRC16 수신 받은 블럭

	this.countReqeustDevice	= 0;		// 장치에 데이터를 요청한 횟수 카운트 
}

// 초기설정
Module.prototype.init = function(handler, config)
{
	//this.resetData();
};

// 초기 송신데이터(필수)
Module.prototype.requestInitialData = function()
{
	this.reserveLookupTarget(0x09);
	return this.transferForDevice();
};

// 초기 수신데이터 체크(필수)
Module.prototype.checkInitialData = function(data, config)
{
	return this.checkUpdateInformation(data, config); 
};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler)
{
	this.tansferForEntry(handler);
};

// Web Socket(엔트리)에서 받은 데이터 처리
Module.prototype.handleRemoteData = function(handler)
{
	this.handlerForEntry(handler);
};

// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function()
{
	return this.transferForDevice();
};

// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data)
{
	this.receiverForDevice(data);
};

// Web Socket 종료후 처리
Module.prototype.reset = function()
{
	this.resetData();
}


module.exports = new Module();



/***************************************************************************************
 *	초기화
 ***************************************************************************************/

Module.prototype.resetData = function()
{
	// -- JSON Objects ----------------------------------------------------------------
	// Entry -> Device
	let ledModeColor		= this.ledModeColor;
	ledModeColor.mode		= 0;
	ledModeColor.r			= 0;
	ledModeColor.g			= 0;
	ledModeColor.b			= 0;
	ledModeColor.interval	= 0;
	
	let ledEventColor		= this.ledEventColor;
	ledEventColor.event		= 0;
	ledEventColor.r			= 0;
	ledEventColor.g			= 0;
	ledEventColor.b			= 0;
	ledEventColor.interval	= 0;
	ledEventColor.repeat	= 0;

	let control				= this.control;
	control.roll			= 0;
	control.pitch			= 0;
	control.yaw				= 0;
	control.throttle		= 0;
	
	// Device -> Entry 
	let attitude			= this.attitude;
	attitude._updated		= 0;
	attitude.roll			= 0;
	attitude.pitch			= 0;
	attitude.yaw			= 0;


	// -- Hardware ----------------------------------------------------------------
	this.bufferReceive		= [];		// 데이터 수신 버퍼
	this.bufferTransfer		= [];		// 데이터 송신 버퍼

	this.dataType			= 0;		// 수신 받은 데이터의 타입
	this.dataLength			= 0;		// 수신 받은 데이터의 길이
	this.indexSession		= 0;		// 수신 받은 데이터의 세션
	this.indexReceiver		= 0;		// 수신 받은 데이터의 세션 내 위치
	this.dataBlock			= [];		// 수신 받은 데이터 블럭
	this.crc16Calculated	= 0;		// CRC16 계산 된 결과
	this.crc16Received		= 0;		// CRC16 수신 받은 블럭
}

/***************************************************************************************
 *	정의
 ***************************************************************************************/

var DataType =
{
	// Led Mode
	LEDMODECOLOR_MODE:		'ledModeColor_mode',
	LEDMODECOLOR_R:			'ledModeColor_r',
	LEDMODECOLOR_G:			'ledModeColor_g',
	LEDMODECOLOR_B:			'ledModeColor_b',
	LEDMODECOLOR_INTERVAL:	'ledModeColor_interval',

	// Led Event
	LEDEVENTCOLOR_EVENT:	'ledEvent_event',
	LEDEVENTCOLOR_R:		'ledEvent_r',
	LEDEVENTCOLOR_G:		'ledEvent_g',
	LEDEVENTCOLOR_B:		'ledEvent_b',
	LEDEVENTCOLOR_INTERVAL:	'ledEvent_interval',
	LEDEVENTCOLOR_REPEAT:	'ledEvent_repeat',

	// Control
	CONTROL_ROLL:			'control_roll',
	CONTROL_PITCH:			'control_pitch',
	CONTROL_YAW:			'control_yaw',
	CONTROL_THROTTLE:		'control_throttle',

	// Attitude
	ATTITUDE_ROLL:			'attitude_roll',
	ATTITUDE_PITCH:			'attitude_pitch',
	ATTITUDE_YAW:			'attitude_yaw'
}
	
/***************************************************************************************
 *	Communciation - 연결된 장치 확인
 ***************************************************************************************/

// 수신 받은 UpdateInformation 처리
Module.prototype.checkUpdateInformation = function(data, config)
{
	this.receiverForDevice(data);

	let updateInformation = this.updateInformation;
	if( updateInformation._updated == true )
	{
		switch( updateInformation.deviceType )
		{
		case 0x08:	// 드론파이터와 연결된 경우(드론파이터와 직접 연결되거나 조종기와 연결한 상태에서 페어링 된 드론파이터가 켜진 경우)
			config.id = '0F0101';
			return true;

		case 0x09:	// 컨트롤러와 연결된 경우(페어링 된 드론파이터가 없더라도 조종기만 연결하여 사용 가능한 상태)
			config.id = '0F0101';
			return true;

		case 0x0A:	// LINK 모듈과 연결된 경우
			config.id = '0F0101';
			return true;

		default:
			return false;
		}
	}

	return false;
}

/***************************************************************************************
 *	Communciation - Entry.JS
 ***************************************************************************************/

// Entry에서 받은 데이터 블럭 처리
// Entry에서 수신 받은 데이터는 bufferTransfer에 바로 등록
Module.prototype.handlerForEntry = function(handler)
{
	// LedModeColor
	if( handler.e(DataType.LEDMODECOLOR_MODE) == true )
	{
		// Start Code
		this.addStartCode();
		
		let ledModeColor = this.ledModeColor;
		ledModeColor.mode		= handler.e(DataType.LEDMODECOLOR_MODE)			? handler.read(DataType.LEDMODECOLOR_MODE)		: 0;
		ledModeColor.r			= handler.e(DataType.LEDMODECOLOR_R)			? handler.read(DataType.LEDMODECOLOR_R)			: 0;
		ledModeColor.g			= handler.e(DataType.LEDMODECOLOR_G)			? handler.read(DataType.LEDMODECOLOR_G)			: 0;
		ledModeColor.b			= handler.e(DataType.LEDMODECOLOR_B)			? handler.read(DataType.LEDMODECOLOR_B)			: 0;
		ledModeColor.interval	= handler.e(DataType.LEDMODECOLOR_INTERVAL)		? handler.read(DataType.LEDMODECOLOR_INTERVAL)	: 0;

		let indexStart = this.bufferTransfer.length;		// 배열에서 데이터를 저장하기 시작하는 위치
		let dataLength = 5;									// 데이터의 길이

		// Header
		this.bufferTransfer.push(0x24);						// Data Type
		this.bufferTransfer.push(dataLength);				// Data Length

		// Data Array
		this.bufferTransfer.push(ledModeColor.mode);
		this.bufferTransfer.push(ledModeColor.r);
		this.bufferTransfer.push(ledModeColor.g);
		this.bufferTransfer.push(ledModeColor.b);
		this.bufferTransfer.push(ledModeColor.interval);

		// CRC16
		this.addCRC16(indexStart, dataLength);
	}
	
	// LedEventColor
	if( handler.e(DataType.LEDEVENTCOLOR_EVENT) == true )
	{
		// Start Code
		this.addStartCode();
		
		let ledEventColor = this.ledEventColor;
		ledEventColor.event		= handler.e(DataType.LEDEVENTCOLOR_EVENT)		? handler.read(DataType.LEDEVENTCOLOR_EVENT)	: 0;
		ledEventColor.r			= handler.e(DataType.LEDEVENTCOLOR_R)			? handler.read(DataType.LEDEVENTCOLOR_R)		: 0;
		ledEventColor.g			= handler.e(DataType.LEDEVENTCOLOR_G)			? handler.read(DataType.LEDEVENTCOLOR_G)		: 0;
		ledEventColor.b			= handler.e(DataType.LEDEVENTCOLOR_B)			? handler.read(DataType.LEDEVENTCOLOR_B)		: 0;
		ledEventColor.interval	= handler.e(DataType.LEDEVENTCOLOR_INTERVAL)	? handler.read(DataType.LEDEVENTCOLOR_INTERVAL)	: 0;
		ledEventColor.repeat	= handler.e(DataType.LEDEVENTCOLOR_REPEAT)		? handler.read(DataType.LEDEVENTCOLOR_REPEAT)	: 0;

		let indexStart = this.bufferTransfer.length;	// 배열에서 데이터를 저장하기 시작하는 위치
		let dataLength = 6;									// 데이터의 길이

		// Header
		this.bufferTransfer.push(0x2A);						// Data Type
		this.bufferTransfer.push(dataLength);				// Data Length

		// Data Array
		this.bufferTransfer.push(ledEventColor.event);
		this.bufferTransfer.push(ledEventColor.r);
		this.bufferTransfer.push(ledEventColor.g);
		this.bufferTransfer.push(ledEventColor.b);
		this.bufferTransfer.push(ledEventColor.interval);
		this.bufferTransfer.push(ledEventColor.repeat);

		// CRC16
		this.addCRC16(indexStart, dataLength);
	}
	
	// Control
	if( handler.e(DataType.CONTROL_ROLL) == true )
	{
		// Start Code
		this.addStartCode();
		
		let control = this.control;
		control.roll			= handler.e(DataType.CONTROL_ROLL)				? handler.read(DataType.CONTROL_ROLL)			: 0;
		control.pitch			= handler.e(DataType.CONTROL_PITCH)				? handler.read(DataType.CONTROL_PITCH)			: 0;
		control.yaw				= handler.e(DataType.CONTROL_YAW)				? handler.read(DataType.CONTROL_YAW)			: 0;
		control.throttle		= handler.e(DataType.CONTROL_THROTTLE)			? handler.read(DataType.CONTROL_THROTTLE)		: 0;

		let indexStart = this.bufferTransfer.length;	// 배열에서 데이터를 저장하기 시작하는 위치
		let dataLength = 4;									// 데이터의 길이

		// Header
		this.bufferTransfer.push(0x10);						// Data Type
		this.bufferTransfer.push(dataLength);				// Data Length

		// Data Array
		this.bufferTransfer.push(control.roll);
		this.bufferTransfer.push(control.pitch);
		this.bufferTransfer.push(control.yaw);
		this.bufferTransfer.push(control.throttle);

		// CRC16
		this.addCRC16(indexStart, dataLength);
	}

	this.log("Module.prototype.handlerForEntry()", this.bufferTransfer);
}

// 시작 코드 추가
Module.prototype.addStartCode = function()
{
	if( this.bufferTransfer == undefined )
		this.bufferTransfer = [];

	// Start Code
	this.bufferTransfer.push(0x0A);
	this.bufferTransfer.push(0x55);
}

// CRC16을 계산해서 추가
Module.prototype.addCRC16 = function(indexStart, dataLength)
{
	if( this.bufferTransfer.length < indexStart + 2 + dataLength )
		return;
	
	// CRC16
	let crc16 = 0;
	let totalLength = 2 + dataLength;
	for(let i=0; i<totalLength; i++)
	{
		crc16 = this.calcCRC16(this.bufferTransfer[indexStart + i], crc16);
	}
	this.bufferTransfer.push((crc16 & 0xff));
	this.bufferTransfer.push(((crc16 >> 8) & 0xff));
}

// Entry에 데이터 전송
Module.prototype.tansferForEntry = function(handler)
{
	// Attitude
	{
		let attitude = this.attitude;
		if( attitude._updated == true )
		{
			for(let key in attitude)
			{
				handler.write(key, attitude[key]);
			}

			attitude._updated == false;
			this.log("Module.prototype.tansferForEntry()", attitude);
		}
	}
}


/***************************************************************************************
 *	Communciation - Drone Fighter
 ***************************************************************************************/

// 장치로부터 받은 데이터 배열 처리
Module.prototype.receiverForDevice = function(data)
{
	if( this.receiveBuffer == undefined )
		this.receiveBuffer = [];

	// 수신 받은 데이터를 버퍼에 추가
	for(let i=0; i<data.length; i++)
	{
		this.receiveBuffer.push(data[i]);
	}

	this.log("Module.prototype.receiverForDevice()", this.receiveBuffer);

	// 버퍼로부터 데이터를 읽어 하나의 완성된 데이터 블럭으로 변환
	while(this.receiveBuffer.length > 0)
	{
		let data			= this.receiveBuffer.shift();
		let flagContinue	= true;
		let flagSessionNext	= false;
		let flagComplete	= false;
		
		switch(this.indexSession)
		{
		case 0:
			// Start Code
			{				
				switch( this.indexReceiver )
				{
				case 0:
					if( data != 0x0A )
						continue;
					break;
				
				case 1:
					if( data != 0x55 )
						flagContinue = false;
					else
						flagSessionNext = true;
					break;
				}
			}
			break;

		case 1:
			// Header
			{
				switch( this.indexReceiver )
				{
				case 0:
					this.dataType = data;
					this.crc16Calculated = this.calcCRC16(data, 0);
					break;
				
				case 1:
					this.dataLength = data;
					this.crc16Calculated = this.calcCRC16(data, this.crc16Calculated);
					this.dataBlock = [];		// 수신 받은 데이터 블럭
					flagSessionNext = true;
					break;
				}
			}
			break;

		case 2:
			// Data
			{
				this.dataBlock.push(data);
				this.crc16Calculated = this.calcCRC16(data, this.crc16Calculated);
				
				if( this.dataBlock.length == this.dataLength )
					flagSessionNext = true;
			}
			break;

		case 3:
			// CRC16
			{
				switch( this.indexReceiver )
				{
				case 0:
					this.crc16Received = data;
					break;
				
				case 1:
					this.crc16Received = this.crc16Received + (data << 8);
					flagComplete = true;
					break;
				}
			}
			break;

		default:
			flagContinue = false;
			break;
		}

		// 데이터 전송 완료 처리
		if( flagComplete == true )
		{
			if( this.crc16Calculated == this.crc16Received )
				this.handlerForDevice();

			flagContinue = false;
		}

		// 데이터 처리 결과에 따라 인덱스 변수 처리
		if( flagContinue == true )
		{
			if( flagSessionNext == true )
			{
				this.indexSession++;
				this.indexReceiver = 0;				
			}
			else
			{
				this.indexReceiver++;
			}
		}
		else
		{
			this.indexSession		= 0;		// 수신 받는 데이터의 세션
			this.indexReceiver		= 0;		// 수신 받는 데이터의 세션 내 위치
		}
	}
}

// 장치로부터 받은 데이터 블럭 처리
Module.prototype.handlerForDevice = function()
{
	this.log("Module.prototype.handlerForDevice()", this.dataBlock);

	switch( this.dataType )
	{
	case 0x32:	// Attitude
		if( this.dataBlock.length == 6 )
		{
			// Device -> Entry 
			let attitude			= this.attitude;
			attitude._updated		= true;
			attitude.roll			= ((this.dataBlock[1]) << 8) + this.dataBlock[0];
			attitude.pitch			= ((this.dataBlock[3]) << 8) + this.dataBlock[2];
			attitude.yaw			= ((this.dataBlock[5]) << 8) + this.dataBlock[4];
		}
		break;

	case 0x91:	// UpdateInformation
		if( this.dataBlock.length == 11 )
		{
			// Device -> Entry 
			let updateInformation			= this.updateInformation;
			updateInformation._updated		= true;
			updateInformation.modeUpdate	= this.dataBlock[0];		// u8
			updateInformation.deviceType	= ((this.dataBlock[4]) << 24) + ((this.dataBlock[3]) << 16) + ((this.dataBlock[2]) << 8) + this.dataBlock[1];		// u32
			updateInformation.imageType		= this.dataBlock[5];		// u8
			updateInformation.imageVersion	= ((this.dataBlock[7]) << 8) + this.dataBlock[6];	// u16
			updateInformation.year			= this.dataBlock[8];		// u8
			updateInformation.month			= this.dataBlock[9];		// u8
			updateInformation.day			= this.dataBlock[10];		// u8
		}
		break;

	default:
		break;
	}
}

// 장치에 데이터 전송
Module.prototype.transferForDevice = function()
{
	// 예약된 요청이 없는 경우 데이터 요청 등록(현재는 자세 데이터 요청)
	if( this.bufferTransfer == undefined || this.bufferTransfer.length == 0 )
	{
		switch( this.countReqeustDevice % 10 )
		{
		case 0:
			this.reserveRequest(0x32);
			break;

		default:
			this.reserveLookupTarget(0x09);
			break;
		}
	}

	let arrayTransfer = this.bufferTransfer.slice(0);	// 전송할 데이터 배열
	this.bufferTransfer = [];							// 기존 버퍼 비우기

	this.log("Module.prototype.transferForDevice()", arrayTransfer);

	this.countReqeustDevice++;

	return arrayTransfer;
}

// 데이터 요청
Module.prototype.reserveRequest = function(dataType)
{
	// Start Code
	this.addStartCode();
	
	let indexStart = this.bufferTransfer.length;		// 배열에서 데이터를 저장하기 시작하는 위치
	let dataLength = 1;		// 데이터의 길이

	// Header
	this.bufferTransfer.push(0x04);			// Data Type (Request)
	this.bufferTransfer.push(0x01);			// Data Length

	// Data Array
	this.bufferTransfer.push(dataType);		// Request DataType

	// CRC16
	this.addCRC16(indexStart, dataLength);

	this.log("Module.prototype.reserveRequest()", this.bufferTransfer);
}

// 장치 검색
// target (0x08:DroneFighter, 0x09:DroneFighter Controller, 0x0A:DroneFighter Link)
Module.prototype.reserveLookupTarget = function(target)
{
	// Start Code
	this.addStartCode();
	
	let indexStart = this.bufferTransfer.length;		// 배열에서 데이터를 저장하기 시작하는 위치
	let dataLength = 4;		// 데이터의 길이

	// Header
	this.bufferTransfer.push(0x90);		// Data Type (UpdateLookupTarget)
	this.bufferTransfer.push(0x04);		// Data Length

	// Data Array
	this.bufferTransfer.push(target);	// lookup Target
	this.bufferTransfer.push(0x00);
	this.bufferTransfer.push(0x00);
	this.bufferTransfer.push(0x00);

	// CRC16
	this.addCRC16(indexStart, dataLength);

	this.log("Module.prototype.reserveLookupTarget()", this.bufferTransfer);
}

/***************************************************************************************
 *	CRC16
 ***************************************************************************************/

/*
 * Copyright 2001-2010 Georges Menie (www.menie.org)
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the University of California, Berkeley nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var crc16table =
[
	0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
	0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
	0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
	0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
	0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
	0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
	0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
	0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
	0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
	0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
	0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
	0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
	0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
	0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
	0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
	0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
	0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
	0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
	0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
	0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
	0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
	0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
	0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
	0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
	0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
	0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
	0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
	0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
	0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
	0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
	0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
	0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
];

Module.prototype.calcCRC16 = function(data, crc)
{
	if( data > 255 )
	{
		throw new RangeError();
	}

	let index	= ((crc>>8) ^ data) & 0x00FF;
	let crcNext	= ((crc<<8) & 0xFFFF) ^ crc16table[index];

	return crcNext;
};


/***************************************************************************************
 *	로그 출력
 ***************************************************************************************/
Module.prototype.log = function(location, data)
{
	// 로그를 출력하지 않으려면 아래 주석을 활성화 할 것
	//*
	let strInfo = "";

	switch( typeof data )
	{
	case "object":
		{
			strInfo = " / [ " + this.convertByteArrayToHexString(data) + " ]";
		}
		break;

	default:
		break;
	}

	console.log(location + " / " + (typeof data) + strInfo);
	// */
}

// 바이트 배열을 16진수 문자열로 변경 
Module.prototype.convertByteArrayToHexString = function(data)
{
	let strHexArray = "";
	let strHex;

	if( typeof data == "object" && data.length > 1 )
	{
		for(let i=0; i<data.length; i++)
		{
			strHex = data[i].toString(16).toUpperCase();
			strHexArray += " ";
			if( strHex.length == 1 )
				strHexArray += "0";
			strHexArray += strHex;
		}
		strHexArray = strHexArray.substr(1, strHexArray.length - 1);
	}
	else
	{
		strHexArray = data.toString();
	}
	
	return strHexArray;
}

