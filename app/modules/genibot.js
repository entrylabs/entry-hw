const BaseModule = require('./baseModule');

const blockIconURI = 'data:image/png;base64,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';

const BLETimeout = 4000;

const BLESendInterval = 100;

const BLEDataStoppedError = 'GeniBot extension stopped receiving data';

const GenibotReboot = Buffer.from([0xA6,0x00,0x00,0xA8,0x00,0x07,0x00]);

const OP_CODE = {
    STEPPERS: 0xC0,
    CARDS: 0xC1,
    PERIPHERALS: { SET: 0xC2, GET: 0xB1 },
    ROBOT: 0xB0,
};

const TASK_ID = {
    STEPPERS: {
        SET_PAUSE_STEPS: 0xA0,
        SET_CONTINUOUS_STEPS: 0xA1,
        SET_SINGLE_STEPS: 0xA2,
        SET_MOTION_STEPS: 0xA6,
    },
    CARDS: {
        SET_MUSIC_NOTES: 0xA3,
        SET_LINE_FOLLOWER: 0xA4,
    },
    PERIPHERALS: {
        SET_COLOR_LED: 0xC1,
        SET_SPEAKER_VOLUME: 0xC3,
        GET_SENSORS: 0xB2,
    },
    ROBOT: {
        GET_VERSION: 0xA1,
    },
};

const ACTION_STATE = {
    PAUSE: 0x00,
    START: 0x01,
    RESUME: 0x02,
};

const STEPPER_RATE = {
    SLOW: 900,
    NORMAL: 950,
    FAST: 1000,
};

const NOTES_CODES = {
    lowTi: 0,
    do: 1,
    doSharp: 2,
    re: 3,
    reSharp: 4,
    mi: 5,
    fa: 6,
    faSharp: 7,
    sol: 8,
    solSharp: 9,
    la: 10,
    laSharp: 11,
    ti: 12,
    highDo: 13,
    highDoSharp: 14,
    highRe: 15,
    highReSharp: 16,
    highMi: 17,
    highFa: 18,
};

const GenibotDistanceLimit = {
    MIN: 1,
    MAX: 30,
};

const GenibotAngleLimit = {
    MIN: 0,
    MAX: 360,
};

const convertIntToUint8Array = (value, length) => {
    let hexString = (value >>> 0).toString(16).substr(-4)
        .toUpperCase()
        .padStart(4, '0');
    const array = [];
    let hexStringLength = hexString.length;
    while (hexStringLength > 0) {
        array.push(parseInt(`0x${hexString.slice(0, 2)}`, 16));
        hexString = hexString.slice(2);
        hexStringLength -= 2;
    }
    return new Uint8Array(array, length);
};

const convertHexToSignedInt = (hex => {
    var hexString = hex;
    if ((hex & 0x8000) > 0) {
        hexString = 0xFFFF0000 | hex;
    }
    return hexString;
});

class Module extends BaseModule {
    constructor() {
        super();
        this.isSendInitData = false;
        this.isConnect = false;

        this.buttonStatus = { status: 0 };
        this.accelerationSensor = { aX: 0, aY: 0, aZ: 0, tilt: 0, tiltStatus: '' };
        this.lightSensor = { R2: 0, R1: 0, L1: 0, L2: 0 };
        this.arduino = { ain: 0 };

        this.sp = null;
        this.digitalPin = [];
        this.sendBuffers = [];
        this.receiveBuffers = [];

        this.cmd = {};
        this._busy = false;
        this.isDraing = false;
        this.data = [];
        this.logger = [];
        this.next_ack = 0;
        this._timeoutID = null;
        this._busyTimeoutID = null;
        this.accelerationSensor = { aX: 0, aY: 0, aZ: 0, tilt: 0, tiltStatus: '' };
        this.lightSensor = { R2: 0, R1: 0, L1: 0, L2: 0 };
        this.buttonStatus = { status: 0 };
        this.arduino = { ain: 0 };
        this.oidCode = { decimal: 65535 };
        this.robot = { version: 8, id: 0x0, samplingPeriods: 0x19 };
        this.music = {
            instrument: 'piano',
            tempo: 120,
        };

        const distanceError = (2 * 1000 * 0.81) / (3.141592 * 3.2 * 1.25);
        this.motion = {
            stepRate: STEPPER_RATE.NORMAL,
            distanceMultiplier: distanceError,
            angleMultiplier: (distanceError * 3.141592 * 5.0 * 1.01 / 360),
        };
        this.linefollower = { action: ACTION_STATE.PAUSE };
    }

    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    requestInitialData(sp) {
        return this.connectGeniBot();
    }

    connectGeniBot() {
        return Buffer.from([0xA2, 0x00, 0xBF, 0xA9, 0x00, 0x07, 0x00]);
    }

    checkInitialData(data, config) {
        return true;
    }

    validateLocalData(data) {
        if(!this.isConnect){
            if(data.byteLength == 13 && data[3] == 0xA9 && data[6] == 0x01){
                this.isConnect = true;
                setTimeout(() => {
                    const sensorCmd = this.getSensors(this.robot.samplingPeriods);
                    this.sp.write(sensorCmd, (err) => {});
                }, 500);

                setTimeout(() => {
                    const sensorCmd = this.getVersion();
                    this.sp.write(sensorCmd, (err) => {});
                }, 1500);
                this.next_ack = 0;

                return true;
            }else {
                return false;
            }
        }else{
            return true;
        }
                
    }

    requestRemoteData(handler) { 
         handler.write('OIDCODE', this.oidCode.decimal);
         handler.write('ACC_TILT', this.accelerationSensor);
         handler.write('ROBOT_VERSION',this.robot.version);
 
        if (this.buttonStatus.status > 0) {
            this.buttonStatus.status = -1;
            handler.write('BUTTON', true);
 
        }else{
            handler.write('BUTTON', false);
        }

        if(this.logger.length > 0){
            handler.write('LOGGER', {list:this.logger});
            this.logger =[];
        }
    };
    isValidACK(ack) {
        if (ack && this.next_ack <= ack) {
            this.next_ack = ack + 1;
            return true;
        }
        return false;
    }

    handleRemoteData(handler) {
        const set_led = handler.read('SET_LED_COLOR');
        if (set_led) {
            if (this.isValidACK(set_led['ACK'])) {
                const ledColor = set_led['COLOR'];
                const side = set_led['SIDE'];
                this.setLED(ledColor, side);
            }
        }
        const slcn = handler.read('SET_LED_COLOR_NAME');

        if (handler.e('SET_LED_COLOR_NAME')) {
            const args = handler.read('SET_LED_COLOR_NAME');
            if (this.isValidACK(args['ACK'])) {
                this.setLedColorName(args);
            }
        }

        if (handler.e('TURN_ANGLE')) {
            const args = handler.read('TURN_ANGLE');
            if (this.isValidACK(args['ACK'])) {
                this.cmd = { 'TURN_ANGLE': args };
                this.turnAngle(args);
            }
        }
        if (handler.e('MOVE_DISTANCE')) {
            const args = handler.read('MOVE_DISTANCE');
            if (this.isValidACK(args['ACK'])) {
                this.moveDistance(args);
            }
        }
        if (handler.e('START_MOVING')) {
            const args = handler.read('START_MOVING');
            if (this.isValidACK(args['ACK'])) {
                this.cmd = { 'START_MOVING': args };
                this.startMoving(args);
            }
        }
        if (handler.e('STOP_MOVING')) {
            const args = handler.read('STOP_MOVING');
            if (this.isValidACK(args['ACK'])) {
                this.cmd = { 'STOP_MOVING': args };
                this.stopMoving();
            }
        }

        if (handler.e('SET_ROBOT_SPEED_ITEM')) {
            const args = handler.read('SET_ROBOT_SPEED_ITEM');
            if (this.isValidACK(args['ACK'])) {
                let a =  this.setRobotSpeedItem(args);
            }
        }

        if (handler.e('MOTION_GO_DISTANCE')) {
            const args = handler.read('MOTION_GO_DISTANCE');
            if (this.isValidACK(args['ACK'])) {
                this.motionGoDistance(args);
            }
        }

        if (handler.e('MOTION_ROTATE_ANGLE')) {
            const args = handler.read('MOTION_ROTATE_ANGLE');
            if (this.isValidACK(args['ACK'])) {
                this.motionRotateAngle(args);
            }
        }

        if (handler.e('START_LINE_FOLLOWER')) {
            const args = handler.read('START_LINE_FOLLOWER');
            if (this.isValidACK(args['ACK'])) {
                this.startLineFollower(args);
            }
        }


        if (handler.e('SET_SPEAKER_VOLUME')) {
            const args = handler.read('SET_SPEAKER_VOLUME');
            if (this.isValidACK(args['ACK'])) {
                this.setSpeakerVolume(args);
            }
        }


        if (handler.e('SET_TEMPO')) {
            const args = handler.read('SET_TEMPO');
            if (this.isValidACK(args['ACK'])) {
                this.setTempo(args);
            }
        }

        if (handler.e('SET_INSTRUMENT')) {
            const args = handler.read('SET_INSTRUMENT');
            if (this.isValidACK(args['ACK'])) {
                this.setInstrument(args);
            }
        }


        if (handler.e('PLAY_NOTE')) {
            const args = handler.read('PLAY_NOTE');
            if (this.isValidACK(args['ACK'])) {
                this.playNote(args);
            }
        }
    }

    requestLocalData() { 
        return null;
    }

    arraysEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }

        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    _onMessage(data) {

        if (data.byteLength == 25 || data.byteLength == 29) {
            this.data = data;
            this.buttonStatus.status = data[7];
            this.lightSensor = {
                R2: (data[9] << 8 | data[8]),
                R1: (data[11] << 8 | data[10]),
                L1: (data[13] << 8 | data[12]),
                L2: (data[15] << 8 | data[14]),
            };
            this.accelerationSensor = {
                aX: Math.round((convertHexToSignedInt(data[17] << 8 | data[16]) / 16384) * 100) * 0.01,
                aY: Math.round((convertHexToSignedInt(data[19] << 8 | data[18]) / 16384) * 100) * 0.01,
                aZ: Math.round((convertHexToSignedInt(data[21] << 8 | data[20]) / 16384) * 100) * 0.01,
                tilt: (data[22] & 0x80) > 0 ? data[22] - 0x100 : data[22],
            };
            this.arduino = {
                ain: (data[24] << 8 | data[23]),
            };
            if (data.byteLength == 29) {
                this.oidCode = { decimal: (data[26] << 8 | data[25]) };
            }
        } else if (data.byteLength == 9) {
            if (data[3] == OP_CODE.ROBOT && data[0] == TASK_ID.ROBOT.GET_VERSION) {
                this.data = data;
                this.robot.version = data[7] << 8 | data[8];
            }
        }
    }

    handleLocalData(data) {
        this._onMessage(data);
    }

    connect() {
        this.isConnect = false;
    }   

    disconnect(connector) {
        if(this.sp){
            this.isConnect = false;
            this.sp.write(GenibotReboot, err => {
                if (this.sp.isOpen) {
                    connector.close();
                }
                this.sp = null;
            });
        }else{
            connector.close();
        }
    };

    reset() {
        this.isDraing = false;
        this.logger= [];
        this.next_ack = 0;
        this.buttonStatus = { status: 0 };
        this.accelerationSensor = { aX: 0, aY: 0, aZ: 0, tilt: 0 };
        this.lightSensor = { R2: 0, R1: 0, L1: 0, L2: 0 };
        this.arduino = { ain: 0 };
    }

    makeOutputBuffer(device, port, data) {
        let buffer;
        const value = new Buffer(2);
        const dummy = new Buffer([10]);

        value.writeInt16LE(data);
        buffer = new Buffer([
            255,
            85,
            6,
            0, 
            2,
            device,
            port
        ]);
        buffer = Buffer.concat([buffer, value, dummy]);

        return buffer;
    };

    getDataByBuffer(buffer) {
        const datas = [];
        let lastIndex = 0;
        buffer.forEach((value, idx) => {
            if (value == 13 && buffer[idx + 1] == 10) {
                datas.push(buffer.subarray(lastIndex, idx));
                lastIndex = idx + 2;
            }
        });

        return datas;
    };

    getVersion() {
        const virtualId = [TASK_ID.ROBOT.GET_VERSION, 0x00, this.robot.id];
        const opCode = [OP_CODE.ROBOT];
        const packageSize = [0x00, 0x07];
        const buildVersion = [0x2];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...buildVersion,
        ];
        return command;
    }

    getSensors(periods) {
        const virtualId = [TASK_ID.PERIPHERALS.GET_SENSORS, 0x10, this.robot.id];
        const opCode = [OP_CODE.PERIPHERALS.GET];
        const packageSize = [0x00, 0x07];
        const samplingPeriods = [periods];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...samplingPeriods
        ];
        return command;
    }

    isConnected() {
        return this.isConnect;
    }

    setRobotSpeedItem(args) {
        if(!args.SPEED)
            return

        let speed = STEPPER_RATE.NORMAL;

        switch (args.SPEED) {
        case 'slow':
            speed = STEPPER_RATE.SLOW;
            break;
        case 'normal':
            speed = STEPPER_RATE.NORMAL;
            break;
        case 'fast':
            speed = STEPPER_RATE.FAST;
            break;
        }
        this.motion.stepRate = speed;

        return this.motion.stepRate
    }

    moveDistance(args) {
        let stepRate =  this.motion.stepRate;
        if (args.DIRECTION == 'front') {
            stepRate *= 1;
        } else {
            stepRate *= -1;
        }
        return this.startMotionStepsDistance(stepRate, parseInt(args.DISTANCE, 10));
    }

    turnAngle(args) {
        let stepRate = this.motion.stepRate;
        if (args.DIRECTION === 'left') {
            stepRate *= 1;
        } else {
            stepRate *= -1;
        }
        return this.startMotionStepsAngle(stepRate, parseInt(args.ANGLE, 10));
    }

    motionGoDistance(args) {
        let velocity = parseInt(args.VELOCITY, 10) * 30;
        if (velocity != 0) {
            if (velocity < 0) {
                velocity -= 850;
            } else {
                velocity += 850;
            }
        }
        return this.startMotionStepsDistance(velocity, args.DISTANCE);
    }

    motionRotateAngle(args) {
        let velocity = parseInt(args.VELOCITY, 10) * 30;
        if (velocity != 0) {
            if (velocity < 0) {
                velocity -= 850;
            } else {
                velocity += 850;
            }
        }
        return this.startMotionStepsAngle(velocity, args.ANGLE);
    }

    startMoving(args) {
        let velocity1 = parseInt(args.VELOCITY1, 10) * 30;
        let velocity2 = parseInt(args.VELOCITY2, 10) * 30;
        if (this.linefollower.action > ACTION_STATE.PAUSE) {
            this.setLineFollower(false);
        } else {
            if (velocity1 != 0) {
                if (velocity1 < 0) {
                    velocity1 -= 850;
                } else {
                    velocity1 += 850;
                }
            }
            if (velocity2 != 0) {
                if (velocity2 < 0) {
                    velocity2 -= 850;
                } else {
                    velocity2 += 850;
                }
            }
            return this.setContinuousSteps(ACTION_STATE.START, velocity1, velocity2);
        }
    }

    stopMoving() {
        if (this.linefollower.action > ACTION_STATE.PAUSE) {
            this.setLineFollower(false);
            return new Promise(resolve => {
                window.setTimeout(() => {
                    resolve();
                }, BLESendInterval);
            });
        } else {
            return this.setContinuousSteps(ACTION_STATE.PAUSE);
        }
    }

    setLedColorName(args) {
        const indexOfColorName = {
            'white': 0x0E,
            'red': 0x0,
            'green': 0x1,
            'blue': 0x2,
            'cyan': 0x3,
            'magenta': 0x4,
            'yellow': 0x5,
            'violet': 0x6,
            'orange': 0x7,
            'spring green': 0x8,
            'light pink': 0x9
        };
        const ledIdIndex = { 'left': 0x02, 'right': 0x00, 'front': 0x03, 'back': 0x01, 'all': 0xFF };
        let colorNameIndex = indexOfColorName[args.COLOR_NAME];
        let ledId = ledIdIndex[args.LED];
        let brightness = MathUtil.clamp(Number(args.COLOR_BRIGHTNESS), 1, 100);
        this.setLEDName(colorNameIndex, ledId, brightness);
        if (ledId != 0xFF && this.robot.version < 7) {
            return this.resolveVersionError();
        }
    }

    startLineFollower(args) {
        if (args.ACTION == 'start') {
            this.linefollower.action = ACTION_STATE.START;
            this.setLineFollower(true);
        } else {
            this.linefollower.action = ACTION_STATE.PAUSE;
            this.setLineFollower(false);
        }
    }

    setInstrument(args) {
        this.setInstrumentCMD(args.INSTRUMENT);
    }

    setTempo(args) {
        const tempo = MathUtil.clamp(args.TEMPO, 88, 140);
        this.setTempoCMD(tempo);
    }

    playNote(args) {
        const noteLabel = ['whole', 'half', 'dottedHalf', 'quarter', 'dottedQuarter', 'eight', 'dottedEight', 'sixteenth'];
        const noteId = noteLabel.findIndex(element => element === args.BEATS);
 
        this.setMusicNotes(args.NOTE, noteId, -1);
    }

    setSingleSteps(StepRate1, Steps1, StepRate2, Steps2) {
        const virtualId = [TASK_ID.STEPPERS.SET_SINGLE_STEPS, 0x00, this.robot.id];
        const opCode = [OP_CODE.STEPPERS];
        const packageSize = [0x00, 0x0F];
        const actionState = ACTION_STATE.RESUME;
        const steppers = [
            ...convertIntToUint8Array(StepRate1, 2),
            ...convertIntToUint8Array(Steps1, 2),
            ...convertIntToUint8Array(StepRate2, 2),
            ...convertIntToUint8Array(Steps2, 2),
        ];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...actionState,
            ...steppers,
        ];
        return this.sp.write(command);
    }

    setMotionStepsDistance(stepRate, distance) {
        const virtualId = [TASK_ID.STEPPERS.SET_MOTION_STEPS, 0x00, this.robot.id];
        const opCode = [OP_CODE.STEPPERS];
        const packageSize = [0x00, 0x0C];
        const actionState = [ACTION_STATE.RESUME];
        const motionProperty = [0x00];
        const steppers = [
            ...convertIntToUint8Array(stepRate, 2),
            ...convertIntToUint8Array(distance, 2),
        ];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...actionState,
            ...motionProperty,
            ...steppers,
        ];

        this.sp.write(command);
    }

    setMotionStepsAngle(stepRate, angle) {
        const virtualId = [TASK_ID.STEPPERS.SET_MOTION_STEPS, 0x00, this.robot.id];
        const opCode = [OP_CODE.STEPPERS];
        const packageSize = [0x00, 0x0C];
        const actionState = [ACTION_STATE.RESUME];
        const motionProperty = [0x01];
        const steppers = [
            ...convertIntToUint8Array(stepRate, 2),
            ...convertIntToUint8Array(angle, 2),
        ];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...actionState,
            ...motionProperty,
            ...steppers
        ];

        return this.sp.write(command);
    }

    setLED(color, ledId) {
        const virtualId = [TASK_ID.PERIPHERALS.SET_COLOR_LED, 0xFF, this.robot.id];
        const opCode = [OP_CODE.PERIPHERALS.SET];
        const packageSize = [0x00, 0x0B];
        const colorSpace = [0x01];
        const colorRGB = [color[0], color[1], color[2]];
        const setLedId = [(this.robot.version < 7) ? 0xFF : ledId];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...colorSpace,
            ...colorRGB,
            ...setLedId
        ];
        return this.sp.write(command);
    }

    setLEDName(colorNameIndex, ledId, brightness) {
        const virtualId = [TASK_ID.PERIPHERALS.SET_COLOR_LED, 0x00, this.robot.id];
        const opCode = [OP_CODE.PERIPHERALS.SET];
        const packageSize = [0x00, 0x0B];
        const colorSpace = [0x02];
        const colorRGB = [0x0, colorNameIndex, brightness];
        const setLedId = [(this.robot.version < 7) ? 0xFF : ledId];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...colorSpace,
            ...colorRGB,
            ...setLedId
        ];
        return this.sp.write(command);
    }

    setContinuousSteps(stepperActionState, speed1, speed2) {
        const virtualId = [TASK_ID.STEPPERS.SET_CONTINUOUS_STEPS, 0x00, this.robot.id];
        const opCode = [OP_CODE.STEPPERS];
        const packageSize = [0x00, 0x0B];
        const actionState = [stepperActionState];
        const steppers = [
            ...convertIntToUint8Array(speed1, 2),
            ...convertIntToUint8Array(speed2, 2),
        ];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...actionState,
            ...steppers
        ];
        return this.sp.write(command);
    }

    setLineFollower(isStartAction) {
        const virtualId = [TASK_ID.CARDS.SET_LINE_FOLLOWER, 0x00, this.robot.id];
        const opCode = [OP_CODE.CARDS];
        const packageSize = [0x00, 0x07];
        const actionState = [isStartAction ? ACTION_STATE.START : ACTION_STATE.PAUSE];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...actionState
        ];
        return this.sp.write(command);
    }

    setInstrumentCMD(instrument) {
        this.music.instrument = instrument;
    }

    setTempoCMD(tempo) {
        this.music.tempo = tempo;
    }

    setMusicNotes(note, beatId, key) {
        let instrumentId = 0x00;
        let noteIndex = (key >= 0) ? key : NOTES_CODES[note];
        switch (this.music.instrument) {
        case 'piano':
            instrumentId = 0x00;
            break;
        case 'flute':
            instrumentId = 0x01;
            break;
        case 'string':
            instrumentId = 0x02;
            break;
        }
        const virtualId = [TASK_ID.CARDS.SET_MUSIC_NOTES, 0x00, this.robot.id];
        const opCode = [OP_CODE.CARDS];
        const packageSize = [0x00, 0x0D];
        const actionState = [ACTION_STATE.START];
        const musicNotes = [
            ...convertIntToUint8Array((1100 + instrumentId * 20 + noteIndex), 2),
            instrumentId,
            0x00,
            beatId,
            parseInt(this.music.tempo, 10)
        ];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...actionState,
            ...musicNotes
        ];
 
        this.sp.write(command);
    }

    setSpeakerVolumeCMD(volume) {
        const virtualId = [TASK_ID.PERIPHERALS.SET_SPEAKER_VOLUME, 0x00, this.robot.id];
        const opCode = [OP_CODE.PERIPHERALS.SET];
        const packageSize = [0x00, 0x07];
        const setVolume = [parseInt(volume, 10)];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...setVolume
        ];
        return this.sp.write(command);
    }

    countNoteLength(noteId) {
        const noteBPM = [240, 120, 180, 60, 90, 30, 45, 15]; // Beat per miniutes
        return noteBPM[noteId] ? (noteBPM[noteId] / this.music.tempo) : 2.4; // Duration in seconds
    }

    resolveVersionError() {
        return false;
    }

    setSpeakerVolume(args) {
        let volume = args.VOLUME;
        volume = (volume == '10') ? '0' : volume;
        this.setSpeakerVolumeCMD(volume);
    }

    startMotionStepsDistance(stepRate, distance) {
        let stepTime = (distance * this.motion.distanceMultiplier / (Math.abs(stepRate) / (Math.abs(stepRate) * -0.01 + 11))) * 1000;

        if (this.linefollower.action > ACTION_STATE.PAUSE) {
            this.setLineFollower(false);
        } else {
            distance = MathUtil.clamp(distance, GenibotDistanceLimit.MIN, GenibotDistanceLimit.MAX);
            this.setMotionStepsDistance(stepRate, distance);
        }
    }

    startMotionStepsAngle(stepRate, angle) {
        if (this.linefollower.action > ACTION_STATE.PAUSE) {
            this.setLineFollower(false);
        } else {
            angle = MathUtil.clamp(angle, GenibotAngleLimit.MIN, GenibotAngleLimit.MAX);
            this.setMotionStepsAngle(stepRate, angle);
        }
    }

}

module.exports = new Module();

class MathUtil {
    static degToRad(deg) {
        return deg * Math.PI / 180;
    }
    static radToDeg(rad) {
        return rad * 180 / Math.PI;
    }
    static clamp(n, min, max) {
        return Math.min(Math.max(n, min), max);
    }
    static wrapClamp(n, min, max) {
        const range = (max - min) + 1;
        return n - (Math.floor((n - min) / range) * range);
    }
   
    static tan(angle) {
        angle = angle % 360;
        switch (angle) {
        case -270:
        case 90:
            return Infinity;
        case -90:
        case 270:
            return -Infinity;
        default:
            return parseFloat(Math.tan((Math.PI * angle) / 180).toFixed(10));
        }
    }
    
    static reducedSortOrdering(elts) {
        const sorted = elts.slice(0).sort((a, b) => a - b);
        return elts.map(e => sorted.indexOf(e));
    }
    
    static inclusiveRandIntWithout(lower, upper, excluded) {

        const possibleOptions = upper - lower;

        const randInt = lower + Math.floor(Math.random() * possibleOptions);
        if (randInt >= excluded) {
            return randInt + 1;
        }

        return randInt;
    }
    static scale(i, iMin, iMax, oMin, oMax) {
        const p = (i - iMin) / (iMax - iMin);
        return (p * (oMax - oMin)) + oMin;
    }
}
