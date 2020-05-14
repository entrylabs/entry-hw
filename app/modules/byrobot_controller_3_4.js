const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT Battle Drone Controller
 ***************************************************************************************/

class byrobot_controller_3_4 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.log('BYROBOT_BATTLE_DRONE_CCONTROLLER - constructor()');

        this.targetDevice     = 0x20;
        this.targetDeviceID   = '0F0C01';
        this.arrayRequestData = null;
    }
}

module.exports = new byrobot_controller_3_4();
