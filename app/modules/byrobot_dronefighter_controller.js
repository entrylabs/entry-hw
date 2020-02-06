const _ = require('lodash');
const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT Drone Fighter Controller
 ***************************************************************************************/

class byrobot_dronefighter_controller extends byrobot_dronefighter_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice           = 0x11;
        this.targetDeviceID         = '0F0101';
        this.targetModeVehicle      = undefined;
    }
}

module.exports = new byrobot_dronefighter_controller();
