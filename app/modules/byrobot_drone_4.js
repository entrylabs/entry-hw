/* eslint-disable brace-style */
/*jshint esversion: 6 */

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

        this.log('BYROBOT_E-DRONE_DRONE - constructor()');

        this.targetDevice     = 0x10;
        this.targetDeviceID   = '0F0801';
        this.arrayRequestData = [0x40, 0x44]; // State, Motion
    }
}

module.exports = new byrobot_drone_4();
