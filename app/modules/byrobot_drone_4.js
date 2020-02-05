const _ = require('lodash');
const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  기본 클래스
 ***************************************************************************************/

class byrobot_drone_4 extends byrobot_base
{
    /*
        초기 수신데이터 체크(필수)
        연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
     */
    checkInitialData(data, config)
    {
        return this.checkAck(data, config); 
    }


    /***************************************************************************************
     *  Communciation - 연결된 장치 확인
     ***************************************************************************************/

    // 수신 받은 Ack 처리
    checkAck(data, config)
    {
        super.receiverForDevice(data);

        let ack = this.ack;
        if( ack._updated == true )
        {
            config.id = '0F0A01';
            return true;
        }

        return false;
    }
}


module.exports = new byrobot_drone_4();

