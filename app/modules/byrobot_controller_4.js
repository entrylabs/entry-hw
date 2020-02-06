const _ = require('lodash');
const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  기본 클래스
 ***************************************************************************************/

class byrobot_controller_4 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice   = 0x20;
        this.targetDeviceID = '0F0801';
    }
}

module.exports = new byrobot_controller_4();
