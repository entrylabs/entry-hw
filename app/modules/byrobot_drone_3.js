const _ = require('lodash');
const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT XTS-65
 ***************************************************************************************/

class byrobot_drone_3 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice   = 0x10;
        this.targetDeviceID = '0F0A01';
    }
}

module.exports = new byrobot_drone_3();
