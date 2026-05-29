const _ = require('lodash');
const BaseModule = require('./baseModule');

class AiServo extends BaseModule {
    constructor() {
        super();
        this.sensorData = { POT1: 0, POT2: 0, POT3: 0, CDS1: 0, CDS2: 0 };
        this.controlValues = {
            mode: 1,
            s1: 90,
            s2: 90,
            s3: 90,
            pIdx: 3,
            r: 0,
            g: 0,
            b: 0,
            buzz: 0,
            blueLed: 0, // blue_led를 blueLed로 변경
        };
        this.isFirstDataReceived = false;
    }

    requestInitialData() {
        return [0xff, 0x55, 0x00, 0x5a, 0x5a, 0x5a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    }

    checkInitialData(data) {
        if (data && data.length >= 2) {
            const isHeaderMatch = (data[0] === 255 || data[0] === 0xff) && 
                              (data[1] === 85 || data[1] === 0x55);
        
            if (isHeaderMatch) {
                console.log('AI Robot Arm Connected Successfully!');
                return true; 
            }
        }
        return false;
    }

    handleLocalData(data) {
        if (data.length >= 7 && data[0] === 0xff && data[1] === 0x55) {
            this.sensorData.POT1 = data[2];
            this.sensorData.POT2 = data[3];
            this.sensorData.POT3 = data[4];
            this.sensorData.CDS1 = data[5];
            this.sensorData.CDS2 = data[6];
        }
    }

    handleRemoteData(handler) {
        const mode = handler.read('MODE');

        if (mode !== undefined && mode > 0) {
            this.isFirstDataReceived = true;
        }

        const keys = [
            'MODE',
            'SERVO1',
            'SERVO2',
            'SERVO3',
            'PIXEL_IDX',
            'RED',
            'GREEN',
            'BLUE',
            'BUZZER',
            'BLUE_LED',
        ];
        keys.forEach((key) => {
            const val = handler.read(key);
            if (val !== undefined && val !== null) {
                this.controlValues[this._mapToInternal(key)] = val;
            }
        });
    }

    _mapToInternal(key) {
        const map = {
            MODE: 'mode',
            SERVO1: 's1',
            SERVO2: 's2',
            SERVO3: 's3',
            PIXEL_IDX: 'pIdx',
            RED: 'r',
            GREEN: 'g',
            BLUE: 'b',
            BUZZER: 'buzz',
            BLUE_LED: 'blueLed', // 내부 매핑 값도 blueLed로 수정
        };
        return map[key];
    }

    requestLocalData() {
        // 재할당되지 않는 변수들은 const로, s1, s2, s3는 let으로 선언
        const { mode, pIdx, r, g, b, buzz, blueLed } = this.controlValues;
        let { s1, s2, s3 } = this.controlValues;

        if (!this.isFirstDataReceived) {
            s1 = 90;
            s2 = 90;
            s3 = 90;
        }

        return [0xff, 0x55, mode, s1, s2, s3, pIdx, r, g, b, buzz, blueLed];
    }

    requestRemoteData(handler) {
        Object.keys(this.sensorData).forEach((key) => {
            handler.write(key, this.sensorData[key]);
        });
    }
}

module.exports = new AiServo();