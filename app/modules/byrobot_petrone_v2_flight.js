const _ = require('lodash');
const byrobot_petrone_v2_base = require('./byrobot_petrone_v2_base');


/***************************************************************************************
 *  BYROBOT Drone Fighter Flight
 ***************************************************************************************/

class byrobot_petrone_v2_flight extends byrobot_petrone_v2_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice       = 0x30;         // DeviceType::Drone
        this.targetDeviceID     = '0F0601';     // BYROBOT PETRONE V2 Flight
        this.targetModeVehicle  = 0x10;         // Mode::Vehicle::Flight
    }
}

module.exports = new byrobot_petrone_v2_flight();
