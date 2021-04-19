/* eslint-disable brace-style */
/*jshint esversion: 6 */

const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  ROBOLINK CODRONE MINI
 ***************************************************************************************/

class robolink_codrone_mini extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.log('ROBOLINK_CODRONE_MINI - constructor()');

        this.targetDevice     = 0x10;
        this.targetDeviceID   = '4A0201';
        this.arrayRequestData = [0x40, 0x41, 0x42, 0x44, 0x52]; // State, Altitude, Position, Motion, Trim
    }
}

module.exports = new robolink_codrone_mini();
