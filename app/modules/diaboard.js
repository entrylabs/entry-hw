/**
 * 
 * 개발참고 문서
 * https://entrylabs.github.io/docs/guide/entry-hw/2016-05-03-add_module.html#%EB%AA%A8%EB%93%88-%EC%B6%94%EA%B0%80%ED%95%98%EA%B8%B0
 * 
 * Author Kevin Ryu
 */

const BaseModule = require('./baseModule');

const SENSOR_TYPE = {
	NOT_CONNECTED:		0,	// 센서 not connect	0
	SENSOR_LIGHT:		1,	// 빛센서	1
	SENSOR_IR:			2,	// IR 센서	2
	SENSOR_BUTTON:		3,	// 버튼	3
	SENSOR_VAR_IMP:		4,	// 가변저항	4
	SENSOR_MIC:			5,	// 마이크	5
	SENSOR_ULTRA_SOUND:	6,	//	초음파센서	6
	SENSOR_TEMPERATUR:	7,	// 온도센서	7
	SENSOR_NOT_DEF:		8,	// 미정	8
	SENSOR_COLOR:		9,	// 컬러센서	9
	SENSOR_VIBRATION:	10,	// 진동	10
	SENSOR_USER:		11,	// USER sensor	11	
}


// 색상  0 : BLACK or 감지 안됨
// 색상  1 : RED
// 색상  2 : YELLOW
// 색상  3 : GREEN
// 색상  4 : CYAN
// 색상  5 : BLUE
// 색상  6 : MAGENTA
// 색상  7 : WHITE
const COLOR_MAP = {
	0: "없음",
	1: "빨강",
	2: "노랑",
	3: "녹색",
	4: "청록",
	5: "파랑",
	6: "보라",
	7: "하양"
}


const REQ_COMMAND = {
	SENSOR_VALUE:			"g\n",
	COLOR_SENSOR_RAW:		"c\n",
}

const PERIOD_FOR_COLOR_SENSOR_RAW	= 5;

class Diaboard extends BaseModule {
    
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
		this.remoteBuffer	= "";
		this.count			= 1;
		this.lastCommandSeq	= 0;
		this.messageQueue	= [];
    }
    
    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }
    
    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData() {
		return "g\n";		// 센서 요청
    }
    
    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
		const	cmdChar	= data.toString()[ 0 ];
		if( cmdChar == 'v' ) {
			return ( data.toString()[ 1 ].contains( "DIA-board" ) );
		} else if ( cmdChar == 'g' ) {
			return true;
		} else if ( cmdChar == 'c' ) {
			return true;
		} else {
			return false;
		}
    }
    
    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
		const	cmd			= data.toString()[ 0 ];
		const	delimeter	= data.toString()[ data.length - 1 ];
		if( ( cmd == 'v' || cmd == 'g' || cmd == 'c' ) ) {
			return true;
		} else {
			return false;
		}
    }
    
    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
		// 데이터 처리 로직
		if( data[ data.length - 1 ] == 10 ) {		// 10 => '\n'
			this.remoteBuffer	= data.toString();	// Buffer to string
		}
    }
    
    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
		let val		= this.remoteBuffer;								// remoteBuffer = "g:T:F:9:7:2:120:1:200\r"
		let items   = val.substr( 0, val.length - 1 ).split(':');		// 마지막 다음줄 캐릭터 자르고, :로 파싱
		let cmd		= items[ 0 ];
		if( cmd == 'g' ) {
			// g : L버튼상태 : R버튼상태 : 9컬러센서 : 색상 : 2 IR센서: IR값 : 1빛센서 : 조도값
			// items = ['g', 'T', 'F', '9', '7', '2', '120', '1', '200']
			handler.write( 0, items );			
			handler.write( 'S1', items[ 1 ] );	// L버튼상태
			handler.write( 'S2', items[ 2 ] );	// R버튼상태
			handler.write( 'S4', items[ 4 ] );	// 색상
			handler.write( 'S6', items[ 6 ] );	// IR값(적외선)
			handler.write( 'S7', items[ 7 ] );	// 1빛센서
			handler.write( 'S8', items[ 8 ] );	// 조도값(밝기센서)

			// 모니터링
			handler.write( 'DISP_L_BUTTON',  ( items[ 1 ] == "T" ? "누름" : "안누름" ) );	// L버튼상태
			handler.write( 'DISP_R_BUTTON',  ( items[ 2 ] == "T" ? "누름" : "안누름" ) );	// R버튼상태
			handler.write( 'DISP_COLOR',     COLOR_MAP[ items[ 4 ] ] );					   // 색상 이름

		} else if( cmd == 'c' ) {
			// c : hue값 : saturation값 : intensity 값
			// items = ['c', '165', '26', '50']
			handler.write( 1, items );			
			handler.write( 'C1', items[ 1 ] );	// hue 값 
			handler.write( 'C2', items[ 2 ] );	// saturation 값
			handler.write( 'C4', items[ 3 ] );	// intensity 값
		} else if( cmd == 'v' ) {
			// v:DIA-board v1.0
			// items = ['v', 'DIA-board v1.0']
			handler.write( 2, items );			
			handler.write( 'V', items[ 1 ] );	// 버전값
		} else {
			handler.write( 3, items );			// 다른 경우
		}
	}

	// 엔트리에서 받은 데이터에 대한 처리
	/**
	 * 이 함수는 20ms 마다 계속 호출된다.
	 * @param {*} handler 
	 */
    handleRemoteData(handler) {
		let	dataFromEntry	= handler.read( 'cmd' );
		let	commandSeq		= handler.read( 'seq' );
		let messageSize		= this.messageQueue.length;
		if( dataFromEntry == 0 ) {
			// 유효하지 않은 명령어는, 스킵
		} else if( commandSeq == this.lastCommandSeq ) {
			// 마지막 명령어가 같다면, 스킵			
		} else if( messageSize > 0 ) {
			// 마지막 명령어가 다르다면, 저장
			this.lastCommandSeq	= commandSeq;
			if( dataFromEntry == "stopNow" ) {
				this.messageQueue	= [];
				this.messageQueue.push( "b:x\n" );		// 부저 끄기
				this.messageQueue.push( "m:x\n" );		// 모터 끄기
				this.messageQueue.push( "l:x:0\n" );	// LED 끄기
			} else {
				this.messageQueue.push( dataFromEntry + "\n" );
			}
		} else {
			// 마지막 명령어도 같지 않고, 처리해야할 명령어 큐에도 없다면, 명령어를 큐에 넣는다.
			this.lastCommandSeq	= commandSeq;
			if( dataFromEntry == "stopNow" ) {
				this.messageQueue	= [];
				this.messageQueue.push( "b:x\n" );		// 부저 끄기
				this.messageQueue.push( "m:x\n" );		// 모터 끄기
				this.messageQueue.push( "l:x:0\n" );	// LED 끄기
			} else {
				this.messageQueue.push( dataFromEntry + "\n" );
			}
		}
    }	
	
    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
   requestLocalData() {
		let	messageSize	= this.messageQueue.length;
		if( messageSize > 0 ) {
			// 명령어 처리
			return this.messageQueue.shift();
		} else {
			// 처리해야할 메세지가 없으면, 센서값 또는 컬러센서값 요청
			let cmd	= null;
			if( ( this.count % PERIOD_FOR_COLOR_SENSOR_RAW ) == 0 ) {
				// 100ms 마다, 컬러센서값 요청
				this.count			= 0;
				cmd = REQ_COMMAND.COLOR_SENSOR_RAW;
			} else {
				// 20ms 마다, 센서값 요청
				cmd	= REQ_COMMAND.SENSOR_VALUE;
			}
			this.count	= this.count + 1;
			return cmd;
		}
	}

	reset() {
		this.remoteBuffer	= "";
		this.count			= 1;
		this.lastCommandSeq	= 0;
		this.messageQueue	= [];
	}

	disconnect( connector ) {
		this.remoteBuffer	= "";
		this.count			= 1;
		this.lastCommandSeq	= 0;
		this.messageQueue	= [];
		// super.disconnect( connector );
	}
}

module.exports = new Diaboard();