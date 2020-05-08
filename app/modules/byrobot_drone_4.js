const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT E-Drone
 ***************************************************************************************/

class byrobot_drone_4 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice   = 0x10;
        this.targetDeviceID = '0F0801';
    }
}

module.exports = new byrobot_drone_4();
