/* eslint-disable brace-style */
/*jshint esversion: 6 */

const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  ROBOLINK CODRONE DIY
 ***************************************************************************************/

class robolink_codrone_diy extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.log('ROBOLINK_CODRONE_DIY - constructor()');

        this.targetDevice     = 0x10;
        this.targetDeviceID   = '4A0101';
        this.arrayRequestData = [0x40, 0x42, 0x43, 0x44, 0x52]; // State, Position, Altitude, Motion(+ Attitude), Trim
    }
}

module.exports = new robolink_codrone_diy();
