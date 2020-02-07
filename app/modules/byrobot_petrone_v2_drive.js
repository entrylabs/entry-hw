const _ = require('lodash');
const byrobot_petrone_v2_base = require('./byrobot_petrone_v2_base');


/***************************************************************************************
 *  BYROBOT Drone Fighter Drive
 ***************************************************************************************/

class byrobot_petrone_v2_drive extends byrobot_petrone_v2_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice       = 0x30;         // DeviceType::Drone
        this.targetDeviceID     = '0F0501';     // BYROBOT PETRONE V2 Drive
        this.targetModeVehicle  = 0x20;         // Mode::Vehicle::Drive
    }
}

module.exports = new byrobot_petrone_v2_drive();
