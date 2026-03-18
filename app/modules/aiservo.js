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
            blue_led: 0,
        };
        this.isFirstDataReceived = false;
    }

    checkInitialData(data) {
        return data && data.length > 0;
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
        // 엔트리 엔진으로부터 온 데이터가 실제 각도 데이터(유효값)인지 확인
        const s1 = handler.read('SERVO1');
        const mode = handler.read('MODE');

        // 엔트리 블록이 실행 중일 때만 데이터 수신 인정
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
            BLUE_LED: 'blue_led',
        };
        return map[key];
    }

    requestLocalData() {
        let { mode, s1, s2, s3, pIdx, r, g, b, buzz, blue_led } = this.controlValues;

        // 엔트리 시작 버튼을 누르기 전이나 연결 직후에는 무조건 90도 전송
        if (!this.isFirstDataReceived) {
            s1 = 90;
            s2 = 90;
            s3 = 90;
        }

        return [0xff, 0x55, mode, s1, s2, s3, pIdx, r, g, b, buzz, blue_led];
    }

    requestRemoteData(handler) {
        Object.keys(this.sensorData).forEach((key) => {
            handler.write(key, this.sensorData[key]);
        });
    }
}

module.exports = new AiServo();
