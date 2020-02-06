const _ = require('lodash');
const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT Drone Fighter Drive
 ***************************************************************************************/

class byrobot_dronefighter_flight extends byrobot_dronefighter_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice           = 0x10;
        this.targetDeviceID         = '0F0301';
        this.targetModeVehicle      = 0x10;
    }
}

module.exports = new byrobot_dronefighter_flight();
