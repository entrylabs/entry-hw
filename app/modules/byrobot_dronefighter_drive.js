const _ = require('lodash');
const byrobot_dronefighter_base = require('./byrobot_dronefighter_base');


/***************************************************************************************
 *  BYROBOT Drone Fighter Drive
 ***************************************************************************************/

class byrobot_dronefighter_drive extends byrobot_dronefighter_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.targetDevice           = 0x10;
        this.targetDeviceID         = '0F0201';
        this.targetModeVehicle      = 0x20;
    }
}

module.exports = new byrobot_dronefighter_drive();
