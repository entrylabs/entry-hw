const _ = require('lodash');
const byrobot_dronefighter_base = require('./byrobot_dronefighter_base');


/***************************************************************************************
 *  BYROBOT Drone Fighter Flight
 ***************************************************************************************/

class byrobot_dronefighter_flight extends byrobot_dronefighter_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice       = 0x10;         // DeviceType::Drone
        this.targetDeviceID     = '0F0301';     // BYROBOT DRONE FIGHTER Flight
        this.targetModeVehicle  = 0x10;         // Mode::Vehicle::Flight
    }
}

module.exports = new byrobot_dronefighter_flight();
