const _ = require('lodash');
const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT XTS-65 Controller
 ***************************************************************************************/

class byrobot_controller_3 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice   = 0x20;
        this.targetDeviceID = '0F0701';
    }
}

module.exports = new byrobot_controller_3();
