class robotry {

    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        this.sp = null;
        this.socket = null;
        this.handler = null;
        this.config = null;
        this.isDraing = false;
        this.actionTypes = {
            GET: 1,
            SET: 2,
            RESET: 3,
        };
    
        this.sensorValueSize = {
            FLOAT: 2,
            SHORT: 3,
        };
    
        this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
        this.sensorData = {
            ULTRASONIC: 0,
            DIGITAL: {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0,
                '5': 0,
                '6': 0,
                '7': 0,
                '8': 0,
                '9': 0,
                '10': 0,
                '11': 0,
                '12': 0,
                '13': 0,
            },
            ANALOG: {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0,
                '5': 0,
                '6': 0,
                '7': 0,
            },
            PULSEIN: {},
            TIMER: 0,
        };
    
        this.defaultOutput = {};
    
        this.recentCheckData = {};
    
        this.sendBuffers = [];
    
        this.lastTime = 0;
        this.lastSendTime = 0;
        this.isDraing = false;
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
        // return true;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    // actual parameter is (data, config)
    checkInitialData() {
        return true;
    }

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    // actual parameter is (data)
    validateLocalData() {
        return true;
    }

    // 하드웨어 
    requestLocalData() {}

    handleLocalData() {}

    // 엔트리
    requestRemoteData() {}

    handleRemoteData() {}


}

module.exports = robotry;
