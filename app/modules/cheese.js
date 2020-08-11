'use strict';
const Cheese = {
    OUTPUT_SA: 'outputSa',
    OUTPUT_SB: 'outputSb',
    OUTPUT_SC: 'outputSc',
    OUTPUT_LA: 'outputLa',
    OUTPUT_LB: 'outputLb',
    OUTPUT_LC: 'outputLc',
    OUTPUT_MAB: 'outputMab',
    OUTPUT_MCD: 'outputMcd',
    BUZZER: 'buzzer',
    VELOCITY: 'velocity',
    STEP: 'step',
    STEP_ID: 'stepId',
    NOTE: 'note',
    SOUND: 'sound',
    SOUND_REPEAT: 'soundRepeat',
    SOUND_ID: 'soundId',
    MODE_SA: 'modeSa',
    MODE_SB: 'modeSb',
    MODE_SC: 'modeSc',
    MODE_LA: 'modeLa',
    MODE_LB: 'modeLb',
    MODE_LC: 'modeLc',
    MODE_MAB: 'modeMab',
    MODE_MCD: 'modeMcd',
    MODE_PID: 'modePid',
    MODE_EXT: 'modeExt',
    WRITE_HAT: 'writeHat',
    WRITE_HAT_ID: 'writeHatId',
    WRITE_PID: 'writePid',
    WRITE_PID_ID: 'writePidId',
    WRITE_NEOPIXEL: 'writeNeopixel',
    WRITE_NEOPIXEL_ID: 'writeNeopixelId',
    PACKET_NORMAL: 1,
    PACKET_HAT: 2,
    PACKET_PID: 3,
    PACKET_NEOPIXEL: 4,
    MODE_S_DIGITAL_INPUT_PULL_DOWN_2M: 0x00,
    MODE_S_MAKEY_INPUT: 0x00, // pull down 2M
    MODE_S_BUTTON_INPUT: 0x90, // pull up 50K
    MODE_S_DIGITAL_INPUT_PULL_UP_50K: 0x10,
    MODE_S_DIGITAL_INPUT_PULL_DOWN_50K: 0x20,
    MODE_S_ANALOG_INPUT_RELATIVE: 0x01, // pull down 2M
    MODE_S_ANALOG_INPUT_ABSOLUTE: 0x41, // pull down 2M
    MODE_S_VOLTAGE_INPUT: 0xc1, // pull down 2M absolute
    MODE_SC_PULSE_INPUT_PULL_DOWN_2M: 0x04,
    MODE_SC_PULSE_INPUT_PULL_UP_50K: 0x14,
    MODE_SC_PULSE_INPUT_PULL_DOWN_50K: 0x24,
    MODE_S_PWM_OUTPUT: 0x02,
    MODE_S_DIGITAL_OUTPUT: 0x82,
    MODE_S_SERVO_OUTPUT: 0x03,
    MODE_SA_NEOPIXEL_OUTPUT: 0x08,
    MODE_L_DIGITAL_INPUT_PULL_DOWN_2M: 0x00,
    MODE_L_MAKEY_INPUT: 0x00, // pull down 2M
    MODE_L_BUTTON_INPUT: 0x90,// pull up 50K
    MODE_L_DIGITAL_INPUT_PULL_UP_50K: 0x10,
    MODE_L_DIGITAL_INPUT_PULL_DOWN_50K: 0x20,
    MODE_L_ANALOG_INPUT_RELATIVE: 0x01, // pull down 2M
    MODE_L_ANALOG_INPUT_ABSOLUTE: 0x41, // pull down 2M
    MODE_L_VOLTAGE_INPUT: 0xc1, // pull down 2M absolute
    MODE_LC_PULSE_INPUT_PULL_DOWN_2M: 0x04,
    MODE_LC_PULSE_INPUT_PULL_UP_50K: 0x14,
    MODE_LC_PULSE_INPUT_PULL_DOWN_50K: 0x24,
    MODE_L_PWM_OUTPUT: 0x02,
    MODE_L_DIGITAL_OUTPUT: 0x82,
    MODE_L_SERVO_OUTPUT: 0x03,
    MODE_M_DIGITAL_OUTPUT: 0x00,
    MODE_M_DC: 0x01,
    MODE_M_SERVO_DUAL: 0x02,
    MODE_MAB_SOUND: 0x03,
    MODE_M_SERVO_MONO: 0x40, // 0100
    MODE_M_STEP_SW_OFF: 0x80, // 1000
    MODE_M_STEP_SW_WAVE: 0x90, // 1001
    MODE_M_STEP_SW_FULL: 0xa0, // 1010
    MODE_M_STEP_HW_OFF: 0xc0, // 1100
    MODE_M_STEP_HW_WAVE: 0xd0, // 1101
    MODE_M_STEP_HW_FULL: 0xe0, // 1110
    MODE_PID_SERIAL: 3,
    MODE_PID_ULTRASONIC: 10,
    MODE_PID_DHT: 11,
    MODE_PID_DS18B20: 12,
    MODE_PID_JOYSTICK_BUTTON: 13,
    MODE_PID_JOYSTICK_DUAL: 14,
    MODE_PID_IR_TRANSCEIVER: 15,
    MODE_PID_ENCODER: 16,
    HAT_RGB_5X5_MATRIX: 10, // 0x00a
    HAT_NEO_5X5_MATRIX: 11, // 0x00b
    HAT_TOUCH: 20, // 0x014
    HAT_PIANO: 21, // 0x015
    HAT_MINI_PIANO: 22, // 0x016
    HAT_GESTURE: 30, // 0x01e
    HAT_COLOR: 31, // 0x01f
    HAT_PRIXIMITY_COLOR: 32, // 0x020
    HAT_MONO_5X15_MATRIX: 40, // 0x028
    HAT_RFID: 50, // 0x032
    SOUND_OFF: 0,
    SOUND_BEEP: 1,
    SOUND_RANDOM_BEEP: 2,
    SOUND_NOISE: 10,
    SOUND_SIREN: 3,
    SOUND_ENGINE: 4,
    SOUND_CHOP: 11,
    SOUND_ROBOT: 5,
    SOUND_DIBIDIBIDIP: 8,
    SOUND_GOOD_JOB: 9,
    SOUND_HAPPY: 12,
    SOUND_ANGRY: 13,
    SOUND_SAD: 14,
    SOUND_SLEEP: 15,
    SOUND_MARCH: 6,
    SOUND_BIRTHDAY: 7,
};

function Module() {
    this.sensory = {
        signalStrength: 0,
        accelerationX: 0,
        accelerationY: 0,
        accelerationZ: 0,
        internalTemperature: 0,
        inputSa: 0,
        inputSb: 0,
        inputSc: 0,
        inputLa: 0,
        inputLb: 0,
        inputLc: 0,
        pulseSc: 0,
        pulseScId: 0,
        pulseLc: 0,
        pulseLcId: 0,
        freeFall: 0,
        freeFallId: 0,
        tap: 0,
        tapId: 0,
        tilt: 0,
        stepCount: 0,
        stepState: -1,
        stepStateId: 0,
        soundState: -1,
        soundStateId: 0,
        batteryState: 2,
        hatState: 0,
        hatStateId: 0,
        pidState: 0,
        pidStateId: 0,
        neopixelState: 0,
        neopixelStateId: 0,
        readHat: undefined,
        readHatId: 0,
        readPid: undefined,
        readPidId: 0,
    };
    this.motoring = {
        outputSa: 0,
        outputSb: 0,
        outputSc: 0,
        outputLa: 0,
        outputLb: 0,
        outputLc: 0,
        outputMab: 0,
        outputMcd: 0,
        buzzer: 0,
        velocity: 0,
        step: 0,
        stepId: 0,
        note: 0,
        sound: 0,
        soundRepeat: 1,
        soundId: 0,
        modeSa: 0,
        modeSb: 0,
        modeSc: 0,
        modeLa: 0,
        modeLb: 0,
        modeLc: 0,
        modeMab: 0,
        modeMcd: 0,
        modePid: 0,
        modeExt: 0,
        writeHat: undefined,
        writeHatId: 0,
        writePid: undefined,
        writePidId: 0,
        writeNeopixel: undefined,
        writeNeopixelId: 0,
    };
    this.acceleration = {
        x: new Array(5),
        y: new Array(5),
        z: new Array(5),
        sumx: 0.0,
        sumy: 0.0,
        sumz: 0.0,
        index: 0,
        count: 0,
    };
    this.step = {
        written: false,
        id: 0,
        pulse: 0,
        pulsePrev: -1,
        event: 0,
        stateId: -1,
    };
    this.sound = {
        written: false,
        flag: 0,
        prev: 0,
        event: 0,
        stateId: -1,
    };
    this.event = {
        freeFallId: -1,
        tapId: -1,
        tilt: -4,
        stepCount: -40000,
        batteryState: -1,
    };
    this.port = {
        ackId: -1,
        modePid: 0,
    };
    this.hat = {
        written: false,
        sendId: 0,
        sendPrevId: 0,
        activated: 0,
        deactivating: false,
    };
    this.pid = {
        written: false,
        sendId: 0,
        sendPrevId: 0,
    };
    this.neopixel = {
        written: false,
        sendId: 0,
        sendPrevId: 0,
        updateId: 0,
        activated: false,
        deactivating: false,
    };
    this.packetSent = 0;
    this.packetReceived = 0;
}

Module.prototype.toHex = function(number) {
    let value = parseInt(number);
    if (value < 0) {
        value += 0x100;
    }

    value = value.toString(16).toUpperCase();
    if (value.length > 1) {
        return value;
    } else {
        return `0${value}`;
    }
};

Module.prototype.toHex2 = function(number) {
    let value = parseInt(number);
    if (value < 0) {
        value += 0x10000;
    }

    value = value.toString(16).toUpperCase();
    let result = '';
    for (let i = value.length; i < 4; ++i) {
        result += '0';
    }
    return result + value;
};

Module.prototype.runSound = function(sound, count) {
    if (typeof count != 'number') {
        count = 1;
    }
    if (count < 0) {
        count = -1;
    }
    if (count) {
        const motoring = this.motoring;
        motoring.sound = sound;
        motoring.soundRepeat = count;
        this.sound.written = true;
    }
};

Module.prototype.getOrCreateReadHatArray = function() {
    const sensory = this.sensory;
    if (sensory.readHat == undefined) {
        sensory.readHat = new Array(20);
    }
    return sensory.readHat;
};

Module.prototype.getOrCreateWriteHatArray = function() {
    const motoring = this.motoring;
    if (motoring.writeHat == undefined) {
        motoring.writeHat = new Array(20);
    }
    return motoring.writeHat;
};

Module.prototype.getOrCreateReadPidArray = function() {
    const sensory = this.sensory;
    if (sensory.readPid == undefined) {
        sensory.readPid = new Array(20);
    }
    return sensory.readPid;
};

Module.prototype.getOrCreateWritePidArray = function() {
    const motoring = this.motoring;
    if (motoring.writePid == undefined) {
        motoring.writePid = new Array(20);
    }
    return motoring.writePid;
};

Module.prototype.getOrCreateWriteNeopixelArray = function() {
    const motoring = this.motoring;
    if (motoring.writeNeopixel == undefined) {
        motoring.writeNeopixel = new Array(20);
    }
    return motoring.writeNeopixel;
};

Module.prototype.requestInitialData = function() {
    return 'FF\r';
};

Module.prototype.checkInitialData = function(data, config) {
    if (data && data.slice(0, 2) == 'FF') {
        const info = data.split(/[,\n]+/);
        if (info && info.length >= 5) {
            if (info[2] == '0D' && info[4].length >= 12) {
                config.id = `020D${info[3]}`;
                this.address = info[4].substring(0, 12);
                return true;
            } else {
                return false;
            }
        }
    }
};

Module.prototype.validateLocalData = function(data) {
    return (data.length == 53);
};

Module.prototype.handleLocalData = function(data) { // data: string
    if (data.length != 53) {
        return;
    }

    const motoring = this.motoring;
    const sensory = this.sensory;

    this.packetReceived = 0;
    let str = data.slice(0, 1);
    let value = parseInt(str, 16);
    if (value == 1) { // normal
        const event = this.event;

        // input S
        str = data.slice(2, 4);
        value = parseInt(str, 16);
        switch (motoring.modeSa) {
        case Cheese.MODE_S_BUTTON_INPUT:
            if (value == 0) {
                sensory.inputSa = 1;
            } else {
                sensory.inputSa = 0;
            }
            break;
        case Cheese.MODE_S_VOLTAGE_INPUT:
            sensory.inputSa = Math.round(value * 360 / 255.0) / 100.0;
            break;
        default:
            sensory.inputSa = value;
            break;
        }
        str = data.slice(4, 6);
        value = parseInt(str, 16);
        switch (motoring.modeSb) {
        case Cheese.MODE_S_BUTTON_INPUT:
            if (value == 0) {
                sensory.inputSb = 1;
            } else {
                sensory.inputSb = 0;
            }
            break;
        case Cheese.MODE_S_VOLTAGE_INPUT:
            sensory.inputSb = Math.round(value * 360 / 255.0) / 100.0;
            break;
        default:
            sensory.inputSb = value;
            break;
        }
        str = data.slice(6, 8);
        value = parseInt(str, 16);
        switch (motoring.modeSc) {
        case Cheese.MODE_S_BUTTON_INPUT:
            if (value == 0) {
                sensory.inputSc = 1;
            } else {
                sensory.inputSc = 0;
            }
            break;
        case Cheese.MODE_S_VOLTAGE_INPUT:
            sensory.inputSc = Math.round(value * 360 / 255.0) / 100.0;
            break;
        case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_2M:
        case Cheese.MODE_SC_PULSE_INPUT_PULL_UP_50K:
        case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_50K: {
            sensory.inputSc = (value >> 7) & 0x01;
            if ((value & 0x7f) > 0) {
                sensory.pulseSc = 1;
                sensory.pulseScId = (sensory.pulseScId % 255) + 1;
            }
            break;
        }
        default:
            sensory.inputSc = value;
            break;
        }

        // input L
        str = data.slice(8, 10);
        value = parseInt(str, 16);
        switch (motoring.modeLa) {
        case Cheese.MODE_L_BUTTON_INPUT:
            if (value == 0) {
                sensory.inputLa = 1;
            } else {
                sensory.inputLa = 0;
            }
            break;
        case Cheese.MODE_L_VOLTAGE_INPUT:
            sensory.inputLa = Math.round(value * 360 / 255.0) / 100.0;
            break;
        default:
            sensory.inputLa = value;
            break;
        }
        str = data.slice(10, 12);
        value = parseInt(str, 16);
        switch (motoring.modeLb) {
        case Cheese.MODE_L_BUTTON_INPUT:
            if (value == 0) {
                sensory.inputLb = 1;
            } else {
                sensory.inputLb = 0;
            }
            break;
        case Cheese.MODE_L_VOLTAGE_INPUT:
            sensory.inputLb = Math.round(value * 360 / 255.0) / 100.0;
            break;
        default:
            sensory.inputLb = value;
            break;
        }
        str = data.slice(12, 14);
        value = parseInt(str, 16);
        switch (motoring.modeLc) {
        case Cheese.MODE_L_BUTTON_INPUT:
            if (value == 0) {
                sensory.inputLc = 1;
            } else {
                sensory.inputLc = 0;
            }
            break;
        case Cheese.MODE_L_VOLTAGE_INPUT:
            sensory.inputLc = Math.round(value * 360 / 255.0) / 100.0;
            break;
        case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_2M:
        case Cheese.MODE_LC_PULSE_INPUT_PULL_UP_50K:
        case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_50K: {
            sensory.inputLc = (value >> 7) & 0x01;
            if ((value & 0x7f) > 0) {
                sensory.pulseLc = 1;
                sensory.pulseLcId = (sensory.pulseLcId % 255) + 1;
            }
            break;
        }
        default:
            sensory.inputLc = value;
            break;
        }

        // acceleration
        const acc = this.acceleration;
        if (acc.count < 5) {
            ++acc.count;
        } else {
            acc.index %= 5;
            acc.sumx -= acc.x[acc.index];
            acc.sumy -= acc.y[acc.index];
            acc.sumz -= acc.z[acc.index];
        }
        // acceleration x
        str = data.slice(14, 18);
        value = parseInt(str, 16) & 0xfff;
        if (value > 0x7ff) {
            value -= 0x1000;
        }
        value *= 16;
        acc.sumx += value;
        acc.x[acc.index] = value;
        // acceleration y
        str = data.slice(18, 22);
        value = parseInt(str, 16) & 0xfff;
        if (value > 0x7ff) {
            value -= 0x1000;
        }
        value *= 16;
        acc.sumy += value;
        acc.y[acc.index] = value;
        // acceleration z
        str = data.slice(22, 26);
        value = parseInt(str, 16) & 0xfff;
        if (value > 0x7ff) {
            value -= 0x1000;
        }
        value *= -16;
        acc.sumz += value;
        acc.z[acc.index] = value;
        ++acc.index;
        sensory.accelerationX = Math.round(acc.sumx / acc.count);
        sensory.accelerationY = Math.round(acc.sumy / acc.count);
        sensory.accelerationZ = Math.round(acc.sumz / acc.count);
        // tilt
        if (sensory.accelerationZ < 8192 && sensory.accelerationX > 8192 && sensory.accelerationY > -4096 && sensory.accelerationY < 4096) {
            value = 1;
        } else if (sensory.accelerationZ < 8192 && sensory.accelerationX < -8192 && sensory.accelerationY > -4096 && sensory.accelerationY < 4096) {
            value = -1;
        } else if (sensory.accelerationZ < 8192 && sensory.accelerationY > 8192 && sensory.accelerationX > -4096 && sensory.accelerationX < 4096) {
            value = 2;
        } else if (sensory.accelerationZ < 8192 && sensory.accelerationY < -8192 && sensory.accelerationX > -4096 && sensory.accelerationX < 4096) {
            value = -2;
        } else if (sensory.accelerationZ > 12288 && sensory.accelerationX > -8192 && sensory.accelerationX < 8192 && sensory.accelerationY > -8192 && sensory.accelerationY < 8192) {
            value = 3;
        } else if (sensory.accelerationZ < -12288 && sensory.accelerationX > -4096 && sensory.accelerationX < 4096 && sensory.accelerationY > -4096 && sensory.accelerationY < 4096) {
            value = -3;
        } else {
            value = 0;
        }
        sensory.tilt = value;

        // step count
        str = data.slice(26, 30);
        value = parseInt(str, 16);
        if (value > 0x7fff) {
            value -= 0x10000;
        }
        sensory.stepCount = value;

        // free fall
        str = data.slice(30, 32);
        value = parseInt(str, 16);
        let id = (value >> 6) & 0x03;
        if (id != event.freeFallId) {
            if (event.freeFallId != -1) {
                sensory.freeFall = 1;
                sensory.freeFallId = (sensory.freeFallId % 255) + 1;
            }
            event.freeFallId = id;
        }

        // tap
        id = (value >> 4) & 0x03;
        if (id != event.tapId) {
            if (event.tapId != -1) {
                sensory.tap = 1;
                sensory.tapId = (sensory.tapId % 255) + 1;
            }
            event.tapId = id;
        }

        // step state
        str = data.slice(32, 34);
        value = parseInt(str, 16);
        id = (value >> 6) & 0x03;
        const step = this.step;
        if (step.event == 1) {
            if ((id != step.stateId) && (step.stateId != -1)) {
                sensory.stepState = 0;
                sensory.stepStateId = (sensory.stepStateId % 255) + 1;
                step.event = 0;
            }
        }
        step.stateId = id;

        // sound state
        id = (value >> 4) & 0x03;
        const sound = this.sound;
        if (sound.event == 1) {
            if ((id != sound.stateId) && (sound.stateId != -1)) {
                sound.event = 0;
                if (motoring.sound > 0) {
                    if (motoring.soundRepeat < 0) {
                        this.runSound(motoring.sound, -1);
                    } else if (motoring.soundRepeat > 1) {
                        motoring.soundRepeat--;
                        this.runSound(motoring.sound, motoring.soundRepeat);
                    } else {
                        motoring.sound = 0;
                        motoring.soundRepeat = 1;
                        sensory.soundState = 0;
                        sensory.soundStateId = (sensory.soundStateId % 255) + 1;
                    }
                } else {
                    motoring.sound = 0;
                    motoring.soundRepeat = 1;
                    sensory.soundState = 0;
                    sensory.soundStateId = (sensory.soundStateId % 255) + 1;
                }
            }
        }
        sound.stateId = id;

        // battery state
        let state = value & 0x03;
        if (state == 0) {
            state = 2;
        }// normal
        else if (state >= 2) {
            state = 0;
        } // empty
        sensory.batteryState = state;

        // ack
        const port = this.port;
        id = (value >> 2) & 0x03;
        if (id != port.ackId) {
            if (port.ackId != -1) {
                port.modePid = motoring.modePid;
            }
            port.ackId = id;
        }

        // temperature
        str = data.slice(34, 36);
        value = parseInt(str, 16);
        if (value > 0x7f) {
            value -= 0x100;
        }
        value = value / 2.0 + 23;
        sensory.internalTemperature = parseInt(value);

        // signal strength
        str = data.slice(36, 38);
        value = parseInt(str, 16);
        value -= 0x100;
        sensory.signalStrength = value;

        this.packetReceived = Cheese.PACKET_NORMAL;
        this.handleExtensionSensory(sensory);
    } else if (value == 2) { // hat
        const readHat = this.getOrCreateReadHatArray();
        for (var i = 0, j = 0; i < 20; ++i, j += 2) {
            str = data.slice(j, j + 2);
            readHat[i] = parseInt(str, 16);
        }
        sensory.readHatId = (sensory.readHatId % 255) + 1;
        this.packetReceived = Cheese.PACKET_HAT;
        this.handleExtensionSensory(sensory);
    } else if (value == 3) { // pid
        if (motoring.modePid > 0) {
            const readPid = this.getOrCreateReadPidArray();
            for (var i = 0, j = 0; i < 20; ++i, j += 2) {
                str = data.slice(j, j + 2);
                readPid[i] = parseInt(str, 16);
            }
            sensory.readPidId = (sensory.readPidId % 255) + 1;
        }
        this.packetReceived = Cheese.PACKET_PID;
        this.handleExtensionSensory(sensory);
    }
};

Module.prototype.handleExtensionSensory = function(sensory) {
    const hat = this.hat;
    if (hat.sendId != hat.sendPrevId) {
        hat.sendPrevId = hat.sendId;
        sensory.hatState = 1;
        sensory.hatStateId = (sensory.hatStateId % 255) + 1;
    }
    const pid = this.pid;
    if (pid.sendId != pid.sendPrevId) {
        pid.sendPrevId = pid.sendId;
        sensory.pidState = 1;
        sensory.pidStateId = (sensory.pidStateId % 255) + 1;
    }
    const neopixel = this.neopixel;
    if (neopixel.sendId != neopixel.sendPrevId) {
        neopixel.sendPrevId = neopixel.sendId;
        sensory.neopixelState = 1;
        sensory.neopixelStateId = (sensory.neopixelStateId % 255) + 1;
    }
};

Module.prototype.requestRemoteData = function(handler) {
    const sensory = this.sensory;
    for (const key in sensory) {
        handler.write(key, sensory[key]);
    }
    sensory.pulseSc = 0;
    sensory.pulseLc = 0;
    sensory.freeFall = 0;
    sensory.tap = 0;
    sensory.stepState = -1;
    sensory.soundState = -1;
    sensory.hatState = 0;
    sensory.pidState = 0;
    sensory.neopixelState = 0;
};

Module.prototype.handleRemoteData = function(handler) {
    const motoring = this.motoring;
    let t;
    // mode
    if (handler.e(Cheese.MODE_SA)) {
        t = handler.read(Cheese.MODE_SA);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeSa = t;
    }
    if (handler.e(Cheese.MODE_SB)) {
        t = handler.read(Cheese.MODE_SB);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeSb = t;
    }
    if (handler.e(Cheese.MODE_SC)) {
        t = handler.read(Cheese.MODE_SC);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeSc = t;
    }
    if (handler.e(Cheese.MODE_LA)) {
        t = handler.read(Cheese.MODE_LA);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeLa = t;
    }
    if (handler.e(Cheese.MODE_LB)) {
        t = handler.read(Cheese.MODE_LB);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeLb = t;
    }
    if (handler.e(Cheese.MODE_LC)) {
        t = handler.read(Cheese.MODE_LC);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeLc = t;
    }
    if (handler.e(Cheese.MODE_MAB)) {
        t = handler.read(Cheese.MODE_MAB);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeMab = t;
    }
    if (handler.e(Cheese.MODE_MCD)) {
        t = handler.read(Cheese.MODE_MCD);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeMcd = t;
    }
    if (handler.e(Cheese.MODE_PID)) {
        t = handler.read(Cheese.MODE_PID);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modePid = t;
    }
    if (handler.e(Cheese.MODE_EXT)) {
        t = handler.read(Cheese.MODE_EXT);
        if (t < 0) {
            t = 0;
        } else if (t > 255) {
            t = 255;
        }
        motoring.modeExt = t;
    }
    // output S
    if (handler.e(Cheese.OUTPUT_SA)) {
        t = handler.read(Cheese.OUTPUT_SA);
        switch (motoring.modeSa) {
        case Cheese.MODE_S_DIGITAL_OUTPUT:
            break;
        case Cheese.MODE_S_PWM_OUTPUT:
            if (t < 0) {
                t = 0;
            } else if (t > 100) {
                t = 100;
            }
            break;
        case Cheese.MODE_S_SERVO_OUTPUT:
            if (t != 0) {
                if (t < 1) {
                    t = 1;
                } else if (t > 180) {
                    t = 180;
                }
            }
            break;
        default:
            if (t < 0) {
                t = 0;
            } else if (t > 255) {
                t = 255;
            }
            break;
        }
        motoring.outputSa = t;
    }
    if (handler.e(Cheese.OUTPUT_SB)) {
        t = handler.read(Cheese.OUTPUT_SB);
        switch (motoring.modeSb) {
        case Cheese.MODE_S_DIGITAL_OUTPUT:
            break;
        case Cheese.MODE_S_PWM_OUTPUT:
            if (t < 0) {
                t = 0;
            } else if (t > 100) {
                t = 100;
            }
            break;
        case Cheese.MODE_S_SERVO_OUTPUT:
            if (t != 0) {
                if (t < 1) {
                    t = 1;
                } else if (t > 180) {
                    t = 180;
                }
            }
            break;
        default:
            if (t < 0) {
                t = 0;
            } else if (t > 255) {
                t = 255;
            }
            break;
        }
        motoring.outputSb = t;
    }
    if (handler.e(Cheese.OUTPUT_SC)) {
        t = handler.read(Cheese.OUTPUT_SC);
        switch (motoring.modeSc) {
        case Cheese.MODE_S_DIGITAL_OUTPUT:
            break;
        case Cheese.MODE_S_PWM_OUTPUT:
            if (t < 0) {
                t = 0;
            } else if (t > 100) {
                t = 100;
            }
            break;
        case Cheese.MODE_S_SERVO_OUTPUT:
            if (t != 0) {
                if (t < 1) {
                    t = 1;
                } else if (t > 180) {
                    t = 180;
                }
            }
            break;
        default:
            if (t < 0) {
                t = 0;
            } else if (t > 255) {
                t = 255;
            }
            break;
        }
        motoring.outputSc = t;
    }
    // output L
    if (handler.e(Cheese.OUTPUT_LA)) {
        t = handler.read(Cheese.OUTPUT_LA);
        switch (motoring.modeLa) {
        case Cheese.MODE_L_DIGITAL_OUTPUT:
            break;
        case Cheese.MODE_L_PWM_OUTPUT:
            if (t < 0) {
                t = 0;
            } else if (t > 100) {
                t = 100;
            }
            break;
        case Cheese.MODE_L_SERVO_OUTPUT:
            if (t != 0) {
                if (t < 1) {
                    t = 1;
                } else if (t > 180) {
                    t = 180;
                }
            }
            break;
        default:
            if (t < 0) {
                t = 0;
            } else if (t > 255) {
                t = 255;
            }
            break;
        }
        motoring.outputLa = t;
    }
    if (handler.e(Cheese.OUTPUT_LB)) {
        t = handler.read(Cheese.OUTPUT_LB);
        switch (motoring.modeLb) {
        case Cheese.MODE_L_DIGITAL_OUTPUT:
            break;
        case Cheese.MODE_L_PWM_OUTPUT:
            if (t < 0) {
                t = 0;
            } else if (t > 100) {
                t = 100;
            }
            break;
        case Cheese.MODE_L_SERVO_OUTPUT:
            if (t != 0) {
                if (t < 1) {
                    t = 1;
                } else if (t > 180) {
                    t = 180;
                }
            }
            break;
        default:
            if (t < 0) {
                t = 0;
            } else if (t > 255) {
                t = 255;
            }
            break;
        }
        motoring.outputLb = t;
    }
    if (handler.e(Cheese.OUTPUT_LC)) {
        t = handler.read(Cheese.OUTPUT_LC);
        switch (motoring.modeLc) {
        case Cheese.MODE_L_DIGITAL_OUTPUT:
            break;
        case Cheese.MODE_L_PWM_OUTPUT:
            if (t < 0) {
                t = 0;
            } else if (t > 100) {
                t = 100;
            }
            break;
        case Cheese.MODE_L_SERVO_OUTPUT:
            if (t != 0) {
                if (t < 1) {
                    t = 1;
                } else if (t > 180) {
                    t = 180;
                }
            }
            break;
        default:
            if (t < 0) {
                t = 0;
            } else if (t > 255) {
                t = 255;
            }
            break;
        }
        motoring.outputLc = t;
    }
    // output M
    if (handler.e(Cheese.OUTPUT_MAB)) {
        t = handler.read(Cheese.OUTPUT_MAB);
        switch (motoring.modeMab) {
        case Cheese.MODE_M_DIGITAL_OUTPUT:
            if (t != 0) {
                t = 2;
            }
            break;
        case Cheese.MODE_M_DC:
            if (t < -100) {
                t = -100;
            } else if (t > 100) {
                t = 100;
            }
            break;
        case Cheese.MODE_M_SERVO_DUAL:
        case Cheese.MODE_M_SERVO_MONO:
            if (t != 0) {
                if (t < 1) {
                    t = 1;
                } else if (t > 180) {
                    t = 180;
                }
            }
            break;
        default:
            if (t < 0) {
                t = 0;
            } else if (t > 255) {
                t = 255;
            }
            break;
        }
        motoring.outputMab = t;
    }
    if (handler.e(Cheese.OUTPUT_MCD)) {
        t = handler.read(Cheese.OUTPUT_MCD);
        switch (motoring.modeMcd) {
        case Cheese.MODE_M_DIGITAL_OUTPUT:
            if (t != 0) {
                t = 2;
            }
            break;
        case Cheese.MODE_M_DC:
            if (t < -100) {
                t = -100;
            } else if (t > 100) {
                t = 100;
            }
            break;
        case Cheese.MODE_M_SERVO_DUAL:
            if (t != 0) {
                if (t < 1) {
                    t = 1;
                } else if (t > 180) {
                    t = 180;
                }
            }
            break;
        default:
            if (t < 0) {
                t = 0;
            } else if (t > 255) {
                t = 255;
            }
            break;
        }
        motoring.outputMcd = t;
    }
    // buzzer
    if (handler.e(Cheese.BUZZER)) {
        t = handler.read(Cheese.BUZZER);
        if (t < 0) {
            t = 0;
        } else if (t > 170000) {
            t = 170000;
        }
        motoring.buzzer = t;
    }
    // velocity
    if (handler.e(Cheese.VELOCITY)) {
        t = handler.read(Cheese.VELOCITY);
        if (t < -500) {
            t = -500;
        } else if (t > 500) {
            t = 500;
        }
        motoring.velocity = t;
    }
    // step
    if (handler.e(Cheese.STEP_ID)) {
        t = handler.read(Cheese.STEP_ID);
        if (t != motoring.stepId) {
            motoring.stepId = t;
            if (handler.e(Cheese.STEP)) {
                t = handler.read(Cheese.STEP);
                if (t < 0) {
                    t = 0;
                } else if (t > 65535) {
                    t = 65535;
                }
                motoring.step = t;
                this.step.written = true;
            }
        }
    }
    // note
    if (handler.e(Cheese.NOTE)) {
        t = handler.read(Cheese.NOTE);
        if (t < 0) {
            t = 0;
        } else if (t > 88) {
            t = 88;
        }
        motoring.note = t;
    }
    // sound
    if (handler.e(Cheese.SOUND_ID)) {
        t = handler.read(Cheese.SOUND_ID);
        if (t != motoring.soundId) {
            motoring.soundId = t;
            if (handler.e(Cheese.SOUND) && handler.e(Cheese.SOUND_REPEAT)) {
                t = handler.read(Cheese.SOUND);
                if (t < 0) {
                    t = 0;
                } else if (t > 127) {
                    t = 127;
                }
                const t2 = handler.read(Cheese.SOUND_REPEAT);
                this.runSound(t, t2);
            }
        }
    }
    // hat
    if (handler.e(Cheese.WRITE_HAT_ID)) {
        t = handler.read(Cheese.WRITE_HAT_ID);
        if (t != motoring.writeHatId) {
            motoring.writeHatId = t;
            if (handler.e(Cheese.WRITE_HAT)) {
                const writeHat = this.getOrCreateWriteHatArray();
                t = handler.read(Cheese.WRITE_HAT);
                for (var i = 0; i < 20; ++i) {
                    writeHat[i] = t[i];
                }
                if ((t[0] & 0xf0) == 0x20) {
                    this.hat.activated = ((t[1] & 0xff) << 4) | (t[0] & 0x0f);
                }
                this.hat.written = true;
            }
        }
    }
    // pid
    if (handler.e(Cheese.WRITE_PID_ID)) {
        t = handler.read(Cheese.WRITE_PID_ID);
        if (t != motoring.writePidId) {
            motoring.writePidId = t;
            if (handler.e(Cheese.WRITE_PID)) {
                const writePid = this.getOrCreateWritePidArray();
                t = handler.read(Cheese.WRITE_PID);
                for (var i = 0; i < 20; ++i) {
                    writePid[i] = t[i];
                }
                this.pid.written = true;
            }
        }
    }
    // neopixel
    if (handler.e(Cheese.WRITE_NEOPIXEL_ID)) {
        t = handler.read(Cheese.WRITE_NEOPIXEL_ID);
        if (t != motoring.writeNeopixelId) {
            motoring.writeNeopixelId = t;
            if (handler.e(Cheese.WRITE_NEOPIXEL)) {
                const writeNeopixel = this.getOrCreateWriteNeopixelArray();
                t = handler.read(Cheese.WRITE_NEOPIXEL);
                for (var i = 0; i < 20; ++i) {
                    writeNeopixel[i] = t[i];
                }
                this.neopixel.activated = true;
                this.neopixel.written = true;
            }
        }
    }
};

Module.prototype.requestLocalData = function() {
    const self = this;
    const motoring = self.motoring;
    const port = self.port;

    // hat
    if (self.hat.written && (self.packetSent != Cheese.PACKET_HAT)) {
        self.hat.written = false;
        self.packetSent = Cheese.PACKET_HAT;
        self.hat.sendId = (self.hat.sendId % 255) + 1;

        const writeHat = motoring.writeHat;
        if (self.hat.deactivating) {
            self.hat.deactivating = false;
            motoring.writeHat = undefined;
        }
        if (writeHat) {
            var str = '';
            for (var i = 0; i < 20; ++i) {
                str += self.toHex(writeHat[i]);
            }
            str += '-';
            str += self.address;
            str += '\r';
            return str;
        }
    }

    // pid
    if (self.pid.written && (port.modePid == motoring.modePid) && (self.packetSent != Cheese.PACKET_PID)) {
        self.pid.written = false;
        self.packetSent = Cheese.PACKET_PID;
        self.pid.sendId = (self.pid.sendId % 255) + 1;

        const writePid = motoring.writePid;
        if (writePid) {
            var str = '';
            for (var i = 0; i < 20; ++i) {
                str += self.toHex(writePid[i]);
            }
            str += '-';
            str += self.address;
            str += '\r';
            return str;
        }
    }

    // neopixel
    if (self.neopixel.written && (self.packetSent != Cheese.PACKET_NEOPIXEL)) {
        self.neopixel.written = false;
        self.packetSent = Cheese.PACKET_NEOPIXEL;
        self.neopixel.sendId = (self.neopixel.sendId % 255) + 1;

        const writeNeopixel = motoring.writeNeopixel;
        if (self.neopixel.deactivating) {
            self.neopixel.deactivating = false;
            motoring.writeNeopixel = undefined;
        }
        if (writeNeopixel) {
            if (writeNeopixel[19] == 1) {
                self.neopixel.updateId = (self.neopixel.updateId % 255) + 1;
            }
            var str = '';
            for (var i = 0; i < 20; ++i) {
                str += self.toHex(writeNeopixel[i]);
            }
            str += '-';
            str += self.address;
            str += '\r';
            return str;
        }
    }

    var str = '10';
    // mode S
    let tmp = 0;
    switch (motoring.modeSa) {
    //		case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_S_MAKEY_INPUT
    case Cheese.MODE_S_MAKEY_INPUT:
    case Cheese.MODE_S_BUTTON_INPUT:
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_UP_50K:
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_S_ANALOG_INPUT_RELATIVE:
    case Cheese.MODE_S_ANALOG_INPUT_ABSOLUTE:
    case Cheese.MODE_S_VOLTAGE_INPUT:
        tmp |= 0x01;
        break;
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_S_PWM_OUTPUT:
    case Cheese.MODE_S_DIGITAL_OUTPUT:
        tmp |= 0x02;
        break;
    case Cheese.MODE_S_SERVO_OUTPUT:
        tmp |= 0x03;
        break;
    case Cheese.MODE_SA_NEOPIXEL_OUTPUT:
        tmp |= 0x80;
        break;
    }
    switch (motoring.modeSb) {
    //		case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_S_MAKEY_INPUT
    case Cheese.MODE_S_MAKEY_INPUT:
    case Cheese.MODE_S_BUTTON_INPUT:
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_UP_50K:
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_S_ANALOG_INPUT_RELATIVE:
    case Cheese.MODE_S_ANALOG_INPUT_ABSOLUTE:
    case Cheese.MODE_S_VOLTAGE_INPUT:
        tmp |= 0x04;
        break;
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_S_PWM_OUTPUT:
    case Cheese.MODE_S_DIGITAL_OUTPUT:
        tmp |= 0x08;
        break;
    case Cheese.MODE_S_SERVO_OUTPUT:
        tmp |= 0x0c;
        break;
    case Cheese.MODE_SA_NEOPIXEL_OUTPUT:
        break;
    }
    switch (motoring.modeSc) {
    //		case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_S_MAKEY_INPUT
    case Cheese.MODE_S_MAKEY_INPUT:
    case Cheese.MODE_S_BUTTON_INPUT:
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_UP_50K:
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_S_ANALOG_INPUT_RELATIVE:
    case Cheese.MODE_S_ANALOG_INPUT_ABSOLUTE:
    case Cheese.MODE_S_VOLTAGE_INPUT:
        tmp |= 0x10;
        break;
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_50K:
        tmp |= 0x40;
        break;
    case Cheese.MODE_S_PWM_OUTPUT:
    case Cheese.MODE_S_DIGITAL_OUTPUT:
        tmp |= 0x20;
        break;
    case Cheese.MODE_S_SERVO_OUTPUT:
        tmp |= 0x30;
        break;
    case Cheese.MODE_SA_NEOPIXEL_OUTPUT:
        break;
    }
    str += self.toHex(tmp);

    // mode L
    tmp = 0;
    switch (motoring.modeLa) {
    //		case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_L_MAKEY_INPUT
    case Cheese.MODE_L_MAKEY_INPUT:
    case Cheese.MODE_L_BUTTON_INPUT:
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_UP_50K:
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_L_ANALOG_INPUT_RELATIVE:
    case Cheese.MODE_L_ANALOG_INPUT_ABSOLUTE:
    case Cheese.MODE_L_VOLTAGE_INPUT:
        tmp |= 0x01;
        break;
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_L_PWM_OUTPUT:
    case Cheese.MODE_L_DIGITAL_OUTPUT:
        tmp |= 0x02;
        break;
    case Cheese.MODE_L_SERVO_OUTPUT:
        tmp |= 0x03;
        break;
    }
    switch (motoring.modeLb) {
    //		case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_L_MAKEY_INPUT
    case Cheese.MODE_L_MAKEY_INPUT:
    case Cheese.MODE_L_BUTTON_INPUT:
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_UP_50K:
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_L_ANALOG_INPUT_RELATIVE:
    case Cheese.MODE_L_ANALOG_INPUT_ABSOLUTE:
    case Cheese.MODE_L_VOLTAGE_INPUT:
        tmp |= 0x04;
        break;
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_L_PWM_OUTPUT:
    case Cheese.MODE_L_DIGITAL_OUTPUT:
        tmp |= 0x08;
        break;
    case Cheese.MODE_L_SERVO_OUTPUT:
        tmp |= 0x0c;
        break;
    }
    switch (motoring.modeLc) {
    //		case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_L_MAKEY_INPUT
    case Cheese.MODE_L_MAKEY_INPUT:
    case Cheese.MODE_L_BUTTON_INPUT:
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_UP_50K:
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_50K:
        break;
    case Cheese.MODE_L_ANALOG_INPUT_RELATIVE:
    case Cheese.MODE_L_ANALOG_INPUT_ABSOLUTE:
    case Cheese.MODE_L_VOLTAGE_INPUT:
        tmp |= 0x10;
        break;
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_50K:
        tmp |= 0x40;
        break;
    case Cheese.MODE_L_PWM_OUTPUT:
    case Cheese.MODE_L_DIGITAL_OUTPUT:
        tmp |= 0x20;
        break;
    case Cheese.MODE_L_SERVO_OUTPUT:
        tmp |= 0x30;
        break;
    }
    str += self.toHex(tmp);

    // mode M
    tmp = 0;
    switch (motoring.modeMab) {
    case Cheese.MODE_M_DIGITAL_OUTPUT:
    case Cheese.MODE_M_DC:
    case Cheese.MODE_M_SERVO_DUAL:
    case Cheese.MODE_MAB_SOUND:
        switch (motoring.modeMab) {
        case Cheese.MODE_M_DIGITAL_OUTPUT:
            break;
        case Cheese.MODE_M_DC:
            tmp |= 0x01;
            break;
        case Cheese.MODE_M_SERVO_DUAL:
            tmp |= 0x02;
            break;
        case Cheese.MODE_MAB_SOUND:
            tmp |= 0x03;
            break;
        }
        switch (motoring.modeMcd) {
        case Cheese.MODE_M_DIGITAL_OUTPUT:
            break;
        case Cheese.MODE_M_DC:
            tmp |= 0x04;
            break;
        case Cheese.MODE_M_SERVO_DUAL:
            tmp |= 0x08;
            break;
        }
        break;
    case Cheese.MODE_M_SERVO_MONO:
        tmp |= 0x40;
        break;
    case Cheese.MODE_M_STEP_SW_OFF:
        tmp |= 0x80;
        break;
    case Cheese.MODE_M_STEP_SW_WAVE:
        tmp |= 0x90;
        break;
    case Cheese.MODE_M_STEP_SW_FULL:
        tmp |= 0xa0;
        break;
    case Cheese.MODE_M_STEP_HW_OFF:
        tmp |= 0xc0;
        break;
    case Cheese.MODE_M_STEP_HW_WAVE:
        tmp |= 0xd0;
        break;
    case Cheese.MODE_M_STEP_HW_FULL:
        tmp |= 0xe0;
        break;
    }
    str += self.toHex(tmp);

    // mode pid
    str += self.toHex(motoring.modePid & 0xff);

    // config gravity / band width
    tmp = 0;
    str += self.toHex(tmp);

    // output S
    switch (motoring.modeSa) {
    //		case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_S_MAKEY_INPUT
    case Cheese.MODE_S_MAKEY_INPUT: // pull down 2M
    case Cheese.MODE_S_ANALOG_INPUT_RELATIVE: // pull down 2M
        tmp = 0x00;
        break;
    case Cheese.MODE_S_BUTTON_INPUT: // pull up 50K
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_UP_50K: // pull up 50K
        tmp = 0x01;
        break;
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_50K: // pull down 50K
        tmp = 0x02;
        break;
    case Cheese.MODE_S_ANALOG_INPUT_ABSOLUTE: // pull down 2M
    case Cheese.MODE_S_VOLTAGE_INPUT: // pull down 2M
        tmp = 0x10;
        break;
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_50K:
        tmp = 0x00;
        break;
    case Cheese.MODE_S_DIGITAL_OUTPUT:
        if (motoring.outputSa == 0) {
            tmp = 0;
        } else {
            tmp = 255;
        }
        break;
    case Cheese.MODE_SA_NEOPIXEL_OUTPUT:
        tmp = self.neopixel.updateId;
        break;
    default:
        tmp = motoring.outputSa;
        break;
    }
    str += self.toHex(tmp);
    switch (motoring.modeSb) {
    //		case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_S_MAKEY_INPUT
    case Cheese.MODE_S_MAKEY_INPUT: // pull down 2M
    case Cheese.MODE_S_ANALOG_INPUT_RELATIVE: // pull down 2M
        tmp = 0x00;
        break;
    case Cheese.MODE_S_BUTTON_INPUT: // pull up 50K
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_UP_50K: // pull up 50K
        tmp = 0x01;
        break;
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_50K: // pull down 50K
        tmp = 0x02;
        break;
    case Cheese.MODE_S_ANALOG_INPUT_ABSOLUTE: // pull down 2M
    case Cheese.MODE_S_VOLTAGE_INPUT: // pull down 2M
        tmp = 0x10;
        break;
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_50K:
        tmp = 0x00;
        break;
    case Cheese.MODE_S_DIGITAL_OUTPUT:
        if (motoring.outputSb == 0) {
            tmp = 0;
        } else {
            tmp = 255;
        }
        break;
    default:
        tmp = motoring.outputSb;
        break;
    }
    str += self.toHex(tmp);
    switch (motoring.modeSc) {
    //		case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_S_MAKEY_INPUT
    case Cheese.MODE_S_MAKEY_INPUT: // pull down 2M
    case Cheese.MODE_S_ANALOG_INPUT_RELATIVE: // pull down 2M
        tmp = 0x00;
        break;
    case Cheese.MODE_S_BUTTON_INPUT: // pull up 50K
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_UP_50K: // pull up 50K
        tmp = 0x01;
        break;
    case Cheese.MODE_S_DIGITAL_INPUT_PULL_DOWN_50K: // pull down 50K
        tmp = 0x02;
        break;
    case Cheese.MODE_S_ANALOG_INPUT_ABSOLUTE: // pull down 2M
    case Cheese.MODE_S_VOLTAGE_INPUT: // pull down 2M
        tmp = 0x10;
        break;
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_2M:
        tmp = 0x00;
        break;
    case Cheese.MODE_SC_PULSE_INPUT_PULL_UP_50K:
        tmp = 0x01;
        break;
    case Cheese.MODE_SC_PULSE_INPUT_PULL_DOWN_50K:
        tmp = 0x02;
        break;
    case Cheese.MODE_S_DIGITAL_OUTPUT:
        if (motoring.outputSc == 0) {
            tmp = 0;
        } else {
            tmp = 255;
        }
        break;
    default:
        tmp = motoring.outputSc;
        break;
    }
    str += self.toHex(tmp);

    // output L
    switch (motoring.modeLa) {
    //		case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_L_MAKEY_INPUT
    case Cheese.MODE_L_MAKEY_INPUT: // pull down 2M
    case Cheese.MODE_L_ANALOG_INPUT_RELATIVE: // pull down 2M
        tmp = 0x00;
        break;
    case Cheese.MODE_L_BUTTON_INPUT: // pull up 50K
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_UP_50K: // pull up 50K
        tmp = 0x01;
        break;
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_50K: // pull down 50K
        tmp = 0x02;
        break;
    case Cheese.MODE_L_ANALOG_INPUT_ABSOLUTE: // pull down 2M
    case Cheese.MODE_L_VOLTAGE_INPUT: // pull down 2M
        tmp = 0x10;
        break;
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_50K:
        tmp = 0x00;
        break;
    case Cheese.MODE_L_DIGITAL_OUTPUT:
        if (motoring.outputLa == 0) {
            tmp = 0;
        } else {
            tmp = 255;
        }
        break;
    default:
        tmp = motoring.outputLa;
        break;
    }
    str += self.toHex(tmp);
    switch (motoring.modeLb) {
    //		case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_L_MAKEY_INPUT
    case Cheese.MODE_L_MAKEY_INPUT: // pull down 2M
    case Cheese.MODE_L_ANALOG_INPUT_RELATIVE: // pull down 2M
        tmp = 0x00;
        break;
    case Cheese.MODE_L_BUTTON_INPUT: // pull up 50K
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_UP_50K: // pull up 50K
        tmp = 0x01;
        break;
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_50K: // pull down 50K
        tmp = 0x02;
        break;
    case Cheese.MODE_L_ANALOG_INPUT_ABSOLUTE: // pull down 2M
    case Cheese.MODE_L_VOLTAGE_INPUT: // pull down 2M
        tmp = 0x10;
        break;
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_2M:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_UP_50K:
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_50K:
        tmp = 0x00;
        break;
    case Cheese.MODE_L_DIGITAL_OUTPUT:
        if (motoring.outputLb == 0) {
            tmp = 0;
        } else {
            tmp = 255;
        }
        break;
    default:
        tmp = motoring.outputLb;
        break;
    }
    str += self.toHex(tmp);
    switch (motoring.modeLc) {
    //		case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_2M: == MODE_L_MAKEY_INPUT
    case Cheese.MODE_L_MAKEY_INPUT: // pull down 2M
    case Cheese.MODE_L_ANALOG_INPUT_RELATIVE: // pull down 2M
        tmp = 0x00;
        break;
    case Cheese.MODE_L_BUTTON_INPUT: // pull up 50K
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_UP_50K: // pull up 50K
        tmp = 0x01;
        break;
    case Cheese.MODE_L_DIGITAL_INPUT_PULL_DOWN_50K: // pull down 50K
        tmp = 0x02;
        break;
    case Cheese.MODE_L_ANALOG_INPUT_ABSOLUTE: // pull down 2M
    case Cheese.MODE_L_VOLTAGE_INPUT: // pull down 2M
        tmp = 0x10;
        break;
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_2M:
        tmp = 0x00;
        break;
    case Cheese.MODE_LC_PULSE_INPUT_PULL_UP_50K:
        tmp = 0x01;
        break;
    case Cheese.MODE_LC_PULSE_INPUT_PULL_DOWN_50K:
        tmp = 0x02;
        break;
    case Cheese.MODE_L_DIGITAL_OUTPUT:
        if (motoring.outputLc == 0) {
            tmp = 0;
        } else {
            tmp = 255;
        }
        break;
    default:
        tmp = motoring.outputLc;
        break;
    }
    str += self.toHex(tmp);

    // output M
    switch (motoring.modeMab) {
    case Cheese.MODE_M_STEP_SW_OFF:
    case Cheese.MODE_M_STEP_SW_WAVE:
    case Cheese.MODE_M_STEP_SW_FULL:
    case Cheese.MODE_M_STEP_HW_OFF:
    case Cheese.MODE_M_STEP_HW_WAVE:
    case Cheese.MODE_M_STEP_HW_FULL:
        str += self.toHex2(motoring.velocity);
        break;
    default:
        str += self.toHex(motoring.outputMab);
        str += self.toHex(motoring.outputMcd);
        break;
    }

    // led, step
    const step = self.step;
    step.pulse = motoring.step;
    if (step.written) {
        step.written = false;
        if (step.pulse != 0 || step.pulsePrev != 0) {
            step.id = (step.id % 3) + 1;
        }
        if (step.pulse > 0) {
            step.event = 1;
        } else {
            step.event = 0;
        }
        step.pulsePrev = step.pulse;
    }
    tmp = step.id & 0x03;
    str += self.toHex(tmp);
    str += self.toHex2(step.pulse);

    // sound
    const sound = self.sound;
    let sndid = 0;
    switch (motoring.sound) {
    case Cheese.SOUND_OFF:
        sndid = 0x00;
        break;
    case Cheese.SOUND_BEEP:
        sndid = 0x01;
        break;
    case Cheese.SOUND_RANDOM_BEEP:
        sndid = 0x05;
        break;
    case Cheese.SOUND_NOISE:
        sndid = 0x07;
        break;
    case Cheese.SOUND_SIREN:
        sndid = 0x09;
        break;
    case Cheese.SOUND_ENGINE:
        sndid = 0x0b;
        break;
    case Cheese.SOUND_CHOP:
        sndid = 0x12;
        break;
    case Cheese.SOUND_ROBOT:
        sndid = 0x20;
        break;
    case Cheese.SOUND_DIBIDIBIDIP:
        sndid = 0x21;
        break;
    case Cheese.SOUND_GOOD_JOB:
        sndid = 0x23;
        break;
    case Cheese.SOUND_HAPPY:
        sndid = 0x30;
        break;
    case Cheese.SOUND_ANGRY:
        sndid = 0x31;
        break;
    case Cheese.SOUND_SAD:
        sndid = 0x32;
        break;
    case Cheese.SOUND_SLEEP:
        sndid = 0x33;
        break;
    case Cheese.SOUND_MARCH:
        sndid = 0x34;
        break;
    case Cheese.SOUND_BIRTHDAY:
        sndid = 0x35;
        break;
    }
    if (sound.written) {
        sound.written = false;
        if (sndid > 0) {
            sound.flag ^= 0x80;
            sound.event = 1;
        } else {
            sound.event = 0;
        }
    }
    if (sndid > 0) { // sound
        str += '00';
        str += self.toHex(sndid | sound.flag);
        sound.prev = sndid;
    } else if (sound.prev > 0) {
        sound.prev = 0;
        str += '0000';
    } else if (motoring.note > 0) { // note
        str += '01';
        str += self.toHex(motoring.note);
    } else { // buzzer
        tmp = parseInt(motoring.buzzer * 100);
        if (tmp < 10000) {
            tmp += 512;
        } else if (tmp < 100001) {
            tmp = ((tmp - 10000) >> 2) + 10512;
        } else if (tmp < 999970) {
            tmp = ((tmp - 100001) >> 6) + 33013;
        } else if (tmp < 9999907) {
            tmp = ((tmp - 999970) >> 9) + 47076;
        } else {
            tmp = ((tmp - 9999907) >> 13) + 64655;
        }
        str += self.toHex2(tmp);
    }

    // mode X
    str += '00';

    str += '-';
    str += self.address;
    str += '\r';
    self.packetSent = Cheese.PACKET_NORMAL;
    return str;
};

Module.prototype.reset = function() {
    const motoring = this.motoring;
    motoring.outputSa = 0;
    motoring.outputSb = 0;
    motoring.outputSc = 0;
    motoring.outputLa = 0;
    motoring.outputLb = 0;
    motoring.outputLc = 0;
    motoring.outputMab = 0;
    motoring.outputMcd = 0;
    motoring.buzzer = 0.0;
    motoring.velocity = 0;
    motoring.step = 0;
    motoring.stepId = 0;
    motoring.note = 0;
    motoring.sound = 0;
    motoring.soundRepeat = 1;
    motoring.soundId = 0;
    motoring.modeSa = 0;
    motoring.modeSb = 0;
    motoring.modeSc = 0;
    motoring.modeLa = 0;
    motoring.modeLb = 0;
    motoring.modeLc = 0;
    motoring.modeMab = 0;
    motoring.modeMcd = 0;
    motoring.modePid = 0;
    motoring.modeExt = 0;
    motoring.writeHatId = 0;
    motoring.writePid = undefined;
    motoring.writePidId = 0;
    motoring.writeNeopixelId = 0;

    const sensory = this.sensory;
    sensory.pulseSc = 0;
    sensory.pulseScId = 0;
    sensory.pulseLc = 0;
    sensory.pulseLcId = 0;
    sensory.freeFall = 0;
    sensory.freeFallId = 0;
    sensory.tap = 0;
    sensory.tapId = 0;
    sensory.tilt = 0;
    sensory.stepCount = 0;
    sensory.stepState = -1;
    sensory.stepStateId = 0;
    sensory.soundState = -1;
    sensory.soundStateId = 0;
    sensory.batteryState = 2;
    sensory.hatState = 0;
    sensory.hatStateId = 0;
    sensory.pidState = 0;
    sensory.pidStateId = 0;
    sensory.neopixelState = 0;
    sensory.neopixelStateId = 0;
    sensory.readHat = undefined;
    sensory.readHatId = 0;
    sensory.readPid = undefined;
    sensory.readPidId = 0;

    const acc = this.acceleration;
    acc.sumx = 0.0;
    acc.sumy = 0.0;
    acc.sumz = 0.0;
    acc.index = 0;
    acc.count = 0;

    const step = this.step;
    step.written = false;
    step.pulse = 0;
    step.pulsePrev = -1;
    step.event = 0;
    step.stateId = -1;

    const sound = this.sound;
    sound.written = false;
    sound.prev = 0;
    sound.event = 0;
    sound.stateId = -1;

    const event = this.event;
    event.freeFallId = -1;
    event.tapId = -1;
    event.tilt = -4;
    event.stepCount = -40000;
    event.batteryState = -1;

    const hat = this.hat;
    hat.sendId = 0;
    hat.sendPrevId = 0;

    this.pid.sendId = 0;
    this.pid.sendPrevId = 0;

    const neopixel = this.neopixel;
    neopixel.sendId = 0;
    neopixel.sendPrevId = 0;

    this.port.ackId = -1;
    this.port.modePid = 0;

    this.packetSent = 0;
    this.packetReceived = 0;

    if (hat.activated != 0) {
        const id = hat.activated;
        hat.activated = 0;
        hat.deactivating = true;
        var packet = this.getOrCreateWriteHatArray();
        packet[0] = (id & 0x0f) | 0x20;
        packet[1] = (id >> 4) & 0xff;
        for (let i = 2; i < 20; ++i) {
            packet[i] = 0;
        }
        hat.written = true;
    }
    if (neopixel.activated) {
        neopixel.activated = false;
        neopixel.deactivating = true;
        var packet = this.getOrCreateWriteNeopixelArray();
        packet[1] = 0x50;
        packet[19] = 1;
        neopixel.written = true;
    }
};

module.exports = new Module();
