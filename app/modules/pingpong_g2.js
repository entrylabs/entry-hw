const PingpongBase = require('./pingpong_base');

class PingpongG2 extends PingpongBase {
    constructor() {
        super(2);

        this._sensorData = [
            {
                MOVE_X: 0,
                MOVE_Y: 0,
                MOVE_Z: 0,
                TILT_X: 0,
                TILT_Y: 0,
                TILT_Z: 0,
                BUTTON: 0,
                PROXIMITY: 0,
                AIN: 1,
            },
            {
                MOVE_X: 0,
                MOVE_Y: 0,
                MOVE_Z: 0,
                TILT_X: 0,
                TILT_Y: 0,
                TILT_Z: 0,
                BUTTON: 0,
                PROXIMITY: 0,
                AIN: 0,
            },
        ];
    }

    checkInitialData(data, config) {
        console.log('P:checkInitialData: /  data(%d)', data.length);

        if (data.length >= 18) {
            if (data[6] == 0xad || data[6] == 0xae) {
                if (data[11] == 0x01) {
                    console.log('checkinit: all cube connected!');
                    return true;
                }
            }
        }
    }
}

module.exports = new PingpongG2();
