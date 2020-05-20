const byrobot_base = require('./byrobot_base');


/***************************************************************************************
 *  BYROBOT Battle Drone
 ***************************************************************************************/

class byrobot_drone_3_10 extends byrobot_base
{
    /*
        생성자
    */
    constructor()
    {
        super();

        this.log('BYROBOT_BATTLE_DRONE - constructor()');

        this.targetDevice     = 0x10;
        this.targetDeviceID   = '0F0D01';
        this.arrayRequestData = [0x40, 0x44]; // State, Motion
    }
}

module.exports = new byrobot_drone_3_10();
