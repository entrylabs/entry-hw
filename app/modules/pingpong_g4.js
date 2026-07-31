const PingpongBase = require('./pingpong_base');

class PingpongG4 extends PingpongBase {
    constructor() {
        super(4);

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

    isPingpongConnected(packet) {
        console.log('check packet: ', packet[6].toString(16), packet);

        if (packet.length >= 18) {
            const opcode = packet[6];
            if (opcode == 0xad || opcode == 0xae) {
                if (packet[11] == 0x01 && packet[12] == 0x02 && packet[13] == 0x03) {
                    return true;
                }
            }
        }
        return false;
    }
}

module.exports = new PingpongG4();
