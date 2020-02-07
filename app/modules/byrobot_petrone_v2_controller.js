const _ = require('lodash');
const byrobot_petrone_v2_base = require('./byrobot_petrone_v2_base');


/***************************************************************************************
 *  BYROBOT Drone Fighter Drive
 ***************************************************************************************/

class byrobot_petrone_v2_controller extends byrobot_petrone_v2_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice       = 0x31;         // DeviceType::Controller
        this.targetDeviceID     = '0F0401';     // BYROBOT PETRONE V2 Controller
        this.targetModeVehicle  = undefined;    // undefined
    }
}

module.exports = new byrobot_petrone_v2_controller();
