/**
 * Author Kevin Ryu
 */
function Module() {
    this.initialBuffer = new Array(20);
    this.localBuffer = new Array(20);
    this.remoteBuffer = new Array(17);

    for (let i = 0; i < 20; ++i) {
        this.initialBuffer[i] = 0;
        this.localBuffer[i] = 0;
    }
    for (let i = 0; i < 17; ++i) {
        this.remoteBuffer[i] = 0;
    }
    this.initialBuffer[0] = 0xFF;
    this.initialBuffer[1] = 0xFF;
    this.initialBuffer[18] = 0xFE;
    this.initialBuffer[19] = 0xFE;
    this.localBuffer[0] = 0xFF;
    this.localBuffer[1] = 0xFF;
    this.localBuffer[18] = 0xFE;
    this.localBuffer[19] = 0xFE;
}


Module.prototype.SENSOR_MAP = {
    1: 'light',
    2: 'IR',
    3: 'touch',
    4: 'potentiometer',
    5: 'MIC',
    6: 'ultrasonicSensor',
    7: 'temperature',
    10: 'vibrationSensor',
    21: 'UserSensor',
    11: 'UserInput',
    20: 'LED',
    19: 'SERVO',
    18: 'DC',
};

Module.prototype.PORT_MAP = {
    'buzzer': 2,
    '5': 4,
    '6': 6,
    '7': 8,
    '8': 10,
    'LEDR': 12,
    'LEDG': 14,
    'LEDB': 16,
};

const CoalaBoardType = {

    B16_START_1: 0xFF,
    B16_START_2: 0xFF,

    B16_END_1: 0xFE,
    B16_END_2: 0xFE,

    P_NO: 0x00,
    P_BRI: 0x01,
    P_IRS: 0x02,
    P_BUT: 0x03,
    P_POT: 0x04,
    P_MIC: 0x05,
    P_ULT: 0x06,
    P_TEM: 0x07,
    P_VIB: 0x0A,
    P_USR: 0x0B,

    P_M_SV: 0x13,
    P_M_DC: 0x12,
    P_LED: 0x14,

    RANGE_SNESOR_PORT: ['1', '2', '3', '4'],
    RANGE_MOTOR_PORT: ['A', 'B', 'C', 'D'],
    RANGE_LED_PORT: ['E'],

    DC_MOTOR_ADJUSTMENT: 128,
    SERVO_ADJUSTMENT: 1,
    BUZZER_ADJUSTMENT: 11,

};

Module.prototype.init = function(handler, config) {
};

Module.prototype.requestInitialData = function() {
    return this.initialBuffer;
};

Module.prototype.checkInitialData = function(data, config) {
    if (data && data.length == 17) {
        if (data[0] === 0xFF && data[1] === 0xFF && data[15] === 0xFE && data[16] === 0xFE) {
            return true;
        } else {
            return false;
        }
    }
};

Module.prototype.handleRemoteData = function(handler) {
    const buffer = this.localBuffer;
    for (const key in this.PORT_MAP) {
        const port = this.PORT_MAP[key];
        const value = handler.read(key);
        if (value === undefined) {
            continue;
        }
        buffer[port] = value >> 8;
        buffer[port + 1] = value & (Math.pow(2, 9) - 1);
    }
};

Module.prototype.requestLocalData = function() {
    return this.localBuffer;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    const buffer = this.remoteBuffer;
    if (data && data.length == 17) {
        if (data[0] === 0xFF && data[1] === 0xFF && data[15] === 0xFE && data[16] === 0xFE) {
            for (let i = 0; i < 17; ++i) {
                buffer[i] = data[i];
            }
        }
    }
};

Module.prototype.requestRemoteData = function(handler) {
    const buffer = this.remoteBuffer;
    for (let i = 2; i < 17; i += 1) {
        const value = buffer[i] * Math.pow(2, 8) + buffer[i + 1];
        let sensorType = this.SENSOR_MAP[buffer[i]];
        if (i < 10) {
            sensorType = this.SENSOR_MAP[buffer[i] >> 2];
        }
        const sensorValue = value & (Math.pow(2, 10) - 1);
        if (i < 10) {
            if (sensorType) {
                if (sensorType == 'temperature') {    // 7: 온도센서
                    // [온도센서] 
                    // 1. 코알라에서 PC로 전달하는 값의 범위 : 0 ~ 160
                    // 2. 실제로 엔트리에서 보여줘야 하는 실제 온도 : - 40 ~ 120
                    // 3. 정리 : 전달되는 값에서 -40을 하면 됨. 
                    handler.write(i / 2, { type: sensorType, value: sensorValue - 40 });
                } else {
                    handler.write(i / 2, { type: sensorType, value: sensorValue });
                }
            } else {
                handler.write(i / 2, null);
            }
            i += 1;
        } else {
            if (sensorType) {
                handler.write((i - 5), { type: sensorType });
            } else {
                handler.write((i - 5), null);
            }
        }
    }
    // 1: 'light',
    // 2: 'IR', 
    // 3: 'touch', 
    // 4: 'potentiometer',
    // 5: 'MIC',
    // 6: 'ultrasonicSensor',
    // 7: 'temperature',
    // 10: 'vibrationSensor',
    // 21: 'UserSensor',
    // 11: 'UserInput',
    // 20: 'LED',
    // 19: 'SERVO',
    // 18: 'DC'

    const p1 = this._decodeSensorPortNum(buffer[2], buffer[3]);  // port 1
    const p2 = this._decodeSensorPortNum(buffer[4], buffer[5]);  // port 2, temperature
    const p3 = this._decodeSensorPortNum(buffer[6], buffer[7]);  // port 3, light
    const p4 = this._decodeSensorPortNum(buffer[8], buffer[9]);  // port 4, touch

    let valueUserInput = ' ';
    let valuePotentiometer = ' ';
    let valueMic = ' ';
    let valueIr = ' ';

    if (p1.sensorType == CoalaBoardType.P_NO) {
    } else if (p1.sensorType == CoalaBoardType.P_IRS) {
        valueIr = p1.sensorValue;
    } else if (p1.sensorType == CoalaBoardType.P_POT) {
        valuePotentiometer = p1.sensorValue;
    } else if (p1.sensorType == CoalaBoardType.P_MIC) {
        valueMic = p1.sensorValue;
    } else if (p1.sensorType == CoalaBoardType.P_ULT) {
    } else if (p1.sensorType == CoalaBoardType.P_VIB) {
    } else if (p1.sensorType == CoalaBoardType.P_USR) {
        valueUserInput = p1.sensorValue;
    } else {
    }

    // UserInput
    // potentiometer
    // MIC
    // IR
    // temperature
    // light
    // touch

    Module.prototype.SENSOR_MAP = {
        1: 'light',
        2: 'IR',
        3: 'touch',
        4: 'potentiometer',
        5: 'MIC',
        6: 'ultrasonicSensor',
        7: 'temperature',
        10: 'vibrationSensor',
        21: 'UserSensor',
        11: 'UserInput',
        20: 'LED',
        19: 'SERVO',
        18: 'DC',
    };

    handler.write(this.SENSOR_MAP[11], { type: this.SENSOR_MAP[11], value: valueUserInput }); // UserInput
    handler.write(this.SENSOR_MAP[4], { type: this.SENSOR_MAP[4], value: valuePotentiometer }); // potentiometer
    handler.write(this.SENSOR_MAP[5], { type: this.SENSOR_MAP[5], value: valueMic }); // MIC
    handler.write(this.SENSOR_MAP[2], { type: this.SENSOR_MAP[2], value: valueIr }); // IR
    handler.write(this.SENSOR_MAP[7], { type: this.SENSOR_MAP[7], value: p2.sensorValue }); // temperature
    handler.write(this.SENSOR_MAP[1], { type: this.SENSOR_MAP[1], value: p3.sensorValue }); // light
    handler.write(this.SENSOR_MAP[3], { type: this.SENSOR_MAP[3], value: p4.sensorValue }); // button(touch)
    // ====================================================================
};

Module.prototype.reset = function() {
    const buffer = this.localBuffer;
    for (let i = 2; i < 18; ++i) {
        buffer[i] = 0;
    }
};

/**
 * 
 * @param number portNum1 
 * @param number portNum2 
 */
Module.prototype._decodeSensorPortNum = function(portNum1, portNum2) {
    const sP1 = portNum1.toString(2).padStart(8, '0');
    const sMsb = sP1.substr(0, 1);
    const sSensorType = sP1.substr(1, 5);
    const sV1 = sP1.substr(6, 2);
    const sV2 = portNum2.toString(2).padStart(8, '0');
    const sSensorVal = sV1 + sV2;

    let iSensorType = parseInt(sSensorType, 2); // 2 => 10
    let iSensorVal = parseInt(sSensorVal, 2); // 2 => 10

    if (iSensorType == CoalaBoardType.P_TEM) {
        // [온도센서] 
        // 1. 비트브릭에서 PC로 전달하는 값의 범위 : 0 ~ 160
        // 2. 실제로 스크래치에서 보여줘야 하는 실제 온도 : - 40 ~ 120
        // 3. 정리 : 전달되는 값에서 -40을 하면 됨. 
        iSensorVal = iSensorVal - 40;
    } else if (
        (iSensorType == CoalaBoardType.P_BRI) ||
        (iSensorType == CoalaBoardType.P_IRS) ||
        (iSensorType == CoalaBoardType.P_BUT) ||
        (iSensorType == CoalaBoardType.P_POT) ||
        (iSensorType == CoalaBoardType.P_MIC) ||
        (iSensorType == CoalaBoardType.P_ULT) ||
        (iSensorType == CoalaBoardType.P_VIB) ||
        (iSensorType == CoalaBoardType.P_USR)
    ) {
        // it's a sensor
    } else {
        // it's not a sensor
        iSensorType = CoalaBoardType.P_NO;
        iSensorVal = 0;
    }
    return { sensorType: iSensorType, sensorValue: iSensorVal };
};

module.exports = new Module();
