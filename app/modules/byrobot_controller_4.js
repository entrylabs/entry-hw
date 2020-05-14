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

        this.log('BYROBOT_E-DRONE_CCONTROLLER - constructor()');

        this.targetDevice     = 0x20;
        this.targetDeviceID   = '0F0901';
        this.arrayRequestData = null;
    }
}

module.exports = new byrobot_controller_4();
