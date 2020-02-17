const _ = require('lodash');
const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT Battle Drone
 ***************************************************************************************/

class byrobot_drone_3_8 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice   = 0x10;
        this.targetDeviceID = '0F0C01';
    }
}

module.exports = new byrobot_drone_3_8();
