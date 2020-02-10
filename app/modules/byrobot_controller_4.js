const _ = require('lodash');
const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT E-Drone Controller
 ***************************************************************************************/

class byrobot_controller_4 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.log("BYROBOT_E-DRONE_CCONTROLLER - constructor()");


        this.targetDevice   = 0x20;
        this.targetDeviceID = '0F0801';
    }

    
    /*
        초기설정

        최초에 커넥션이 이루어진 후의 초기 설정.
        handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
        config 은 module.json 오브젝트입니다.
    */
    init(handler, config)
    {
        this.log("BYROBOT_E-DRONE_CCONTROLLER - init()");

        super.init(handler, config);
        //this.resetData();
    }


    /*
        초기 송신데이터(필수)

        연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
        requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
        이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    /*
    requestInitialData(serialport)
    {
        this.log("BYROBOT_E-DRONE_CCONTROLLER - requestInitialData()");
        
        return super.requestInitialData(serialport);
    }
    // */


    /*
        초기 수신데이터 체크(필수)
        연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    */
    checkInitialData(data, config)
    {
        this.log("BYROBOT_E-DRONE_CCONTROLLER - checkInitialData()");
        
        return super.checkInitialData(data, config); 
    }


    /*
        주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    */
    validateLocalData(data)
    {
        this.log("BYROBOT_E-DRONE_CCONTROLLER - validateLocalData()");

        return super.validateLocalData(data);
    }


    /*
        하드웨어에 전달할 데이터
        
        하드웨어 기기에 전달할 데이터를 반환합니다.
        slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData()
    {
        this.log("BYROBOT_E-DRONE_CCONTROLLER - validateLocalData()");

        return super.requestLocalData();
    }


    /*
        하드웨어에서 온 데이터 처리
    */
    handleLocalData(data)
    {
        super.handleLocalData(data);
    }


    /*
        엔트리로 전달할 데이터
    */
    requestRemoteData(handler)
    {
        super.requestRemoteData(handler);
    }


    /*
        엔트리에서 받은 데이터에 대한 처리
    */
    handleRemoteData(handler)
    {
        super.handlerForEntry(handler);
    }


    connect()
    {
        super.connect();
    }


    disconnect(connect)
    {
        super.disconnect(connect);
    }


    /*
        Web Socket 종료후 처리
    */
    reset()
    {
        this.log("reset");
        this.resetData();
    }
}

module.exports = new byrobot_controller_4();
