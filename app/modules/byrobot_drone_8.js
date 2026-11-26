/* eslint-disable brace-style */
/*jshint esversion: 6 */

const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT Coding Drone
 ***************************************************************************************/

class byrobot_drone_8 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.log('BYROBOT_CODING_DRONE - constructor()');

        this.targetDevice     = 0x10;
        this.targetDeviceID   = '0F0701';
        this.arrayRequestData = [0x40, 0x44, 0x45, 0x93]; // State, Motion, Range, CardColor
    }
}

module.exports = new byrobot_drone_8();
