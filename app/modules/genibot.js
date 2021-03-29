const BaseModule = require('./baseModule');
// const atob = require('atob');

const atob = (str) => {
    return Buffer.from(str, 'base64').toString('binary');
}

//const fs = require('fs');
const { result } = require('lodash');
const log = (val) => {
    // if (Array.isArray(val)) {
    //     fs.appendFile('D:\\entryCodes\\log\\message.txt', `[${val.toString()}]\n`, function(err) {
    //         if (err) {
    //             throw err;
    //         }
    //         // log('Saved!');/
    //     });
    // } else {
    //     fs.appendFile('D:\\entryCodes\\log\\message.txt', `${val}\n`, function(err) {
    //         if (err) {
    //             throw err;
    //         }
    //         // log('Saved!');/
    //     });
    // }
};
const log2 = (val) => {
    // fs.appendFile('C:\\Users\\GyeDan\\Documents\\CPY_SAVES\\message.txt', `${val},`, function(err) {
    //     if (err) {
    //         throw err;
    //     }
    //     // log('Saved!');/
    // });
};
// import rendererConsole from './core/rendererConsole';
// import rendererConsole from '../src/main/core/rendererConsole';
// import WindowManager from'../src/main/electron/windowManager'; //'./windowManager';

// let mainWindow = WindowManager.mainWindow;
// import createLogger from '../src/main/electron/functions/createLogger'//'./functions/createLogger';
// const logger = createLogger('../src/main/electron/windowManager');


/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
const blockIconURI = 'data:image/png;base64,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';
/**
 * A time interval to wait (in milliseconds) before reporting to the BLE socket
 * that data has stopped coming from the peripheral.
 */
const BLETimeout = 4000; // Timout, ble Connection supervisory timeout
/**
 * A time interval to wait (in milliseconds) in between send messages.
 * @type {number}
 */
const BLESendInterval = 100; // Minimum interval, refer to Bluetooth LE latency time, MTU & PHY parameters,
/**
 * A string to report to the BLE socket when the robot has stopped receiving data.
 * @type {string}
 */
const BLEDataStoppedError = 'GeniBot extension stopped receiving data';
/**
 * Enum for genibot protocol.
 * @readonly
 * @enum {string}
 */
const GenibotBleUUID = {
    discoveryNameFilter: 'GENI',
    service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    txChar: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
    rxChar: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
};

//const logger = createLogger('module/genibot.js');
/**
 * Enum for message op code assigned to GeniBot
 * Peripherals to read or write message
 * Steppers to control motors
 * Cards to run unplugged actvity
 * Robot
 * @readonly
 * @enum {number}
 */
const OP_CODE = {
    STEPPERS: 0xC0,
    CARDS: 0xC1,
    PERIPHERALS: { SET: 0xC2, GET: 0xB1 },
    ROBOT: 0xB0,
};
/**
 * Enum for message task id assigned to GeniBot such as steppers, cards, peripherals, and etc,
 * Stepper functions for direct control,  see Programmer's guide.
 * Unplugged functions, you can create multiple data set with unplugged cards,
 * When you start line follwer, illumination leds will be turned on,
 * SetLedColor: led color in HSV color space,
 * SetSpeakerVolume: Set speakcer loudness from 1 to 9, set zero to maximum volume (default),
 * GetSensors: Read button status, acceleration and tilt status
 * GetVersion: Read build version of the robot,
 * @readonly
 * @enum {number}
 */
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
        // GET_VERSION: 0x00,
    },
};
/**
 * Enum for action property assigned to GeniBot
 * @readonly
 * @enum {number}
 */
const ACTION_STATE = {
    PAUSE: 0x00,
    START: 0x01,
    RESUME: 0x02,
};
/**
 * Enum for step rate in samples per seconds assigned to GeniBot
 * StepRate is from 100 to 1000, Stepping time rate = -0.01 * StepRate + 11
 * Slow: Lower limit of 'slow', time is twice longer than 'fast' by the equation of Stepping time
 * Normal: To configure the default value, normal stepper rate is 950
 * Fast: Upper limit of 'fast'
 * @readonly
 * @enum {number}
 */
const STEPPER_RATE = {
    SLOW: 900,
    NORMAL: 950,
    FAST: 1000,
};
/**
 * Enum for music notes assigned to GeniBot
 * @readonly
 * @enum {number}
 */
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
/**
 * Enum for moving distance limit in cm
 * @readonly
 * @enum {number}
 */
const GenibotDistanceLimit = {
    MIN: 1,
    MAX: 30,
};
/**
 * Enum for rotational angle limit in cm
 * @readonly
 * @enum {number}
 */
const GenibotAngleLimit = {
    MIN: 0,
    MAX: 360,
};
/**
 * @param {int} value - value
 * @param {int} length - array length
 * @returns {Uint8Array} - uint8 array
 */
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
/**
 * @returns {hex} - 32bit negative bit conversion in java script
 */
const convertHexToSignedInt = hex => {
    if ((hex & 0x8000) > 0) {
        hex = 0xFFFF0000 | hex;
    }
    return hex;
};

const base64ToUint8Array = (base64) => {
    log('base64ToUint8Array');
    const binaryString = atob(base64);
    log(binaryString);
    const len = binaryString.length;
    const array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        array[i] = binaryString.charCodeAt(i);
    }
    return array;
};

class Module extends BaseModule {
    constructor() {
        // process.exit();
        log('constructor');
        //logger.info('constructor');
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

        ////
        this.cmd = {};

        /////////////////////////////////
        this._busy = false;
        this.isDraing = false;
        // this.countButton = 0;
        this.data = [];
        this.logger= [];
        this.next_ack = 0;
        /**
         * ID for a timeout which is used to clear the busy flag if it has been
         * true for a long time.
         */
        this._timeoutID = null;
        this._busyTimeoutID = null;
        /**
         * Speficy each robot id from 0 to 7 in Star network, or ffh to broadcast a message to robots that are connected to Star robot.
         * Star network can be available by using "GeniBot Star Network" extention,
         * accelerationSensor: The state-art of 3-axis acceleration, from -1.00g to +1.00g @ 2g scale
         * lightSensor: Reading brightness of ambient light
         * buttonStatus: Button status as latched, pressed or normal state
         * arduino: Reading data from arduino sensors
         * ledColor: To store present four led colors in RGB space,
         */
        this.accelerationSensor = { aX: 0, aY: 0, aZ: 0, tilt: 0, tiltStatus: '' };
        this.lightSensor = { R2: 0, R1: 0, L1: 0, L2: 0 };
        this.buttonStatus = { status: 0 };
        this.arduino = { ain: 0 };
        this.oidCode = { decimal: 65535 };
        /**
         * Robot property as:
         * Sampling period 250ms, it is avaiable from 10 (0.1ms) to 100 (1.0s)
         */
        this.robot = { version: 8, id: 0x0, samplingPeriods: 0x19 };
        // this.robot = { version: 1, id: 0x0, samplingPeriods: 0x19 };
        this.music = {
            instrument: 'piano', // Default instrument 'piano'
            tempo: 120,
        };


        ////// GENI BLOCK CLASS CONSTRUCTOR
        const distanceError = (2 * 1000 * 0.81) / (3.141592 * 3.2 * 1.25);
        // this.runtime = runtime;
        this.motion = {
            stepRate: STEPPER_RATE.NORMAL,
            distanceMultiplier: distanceError,
            angleMultiplier: (distanceError * 3.141592 * 5.0 * 1.01 / 360),
        };
        this.linefollower = { action: ACTION_STATE.PAUSE };
    }

    init(handler, config) {
        //process.exit();
        // 엔트리 브라우저와 연결되었을때 호출됨
        log('init genibot');
        //logger.info('init genibot');
        this.handler = handler;
        this.config = config;
    }

    // deprecated
    // afterConnect(connector, cb) {
    //     log('afterConnect genibot');
    //     // handshake 종료 후 정상 연결상태로 진입전에 호출됨. connector 와 UI state 를 강제변경할 수 있으나 비추천
    //     connector.connected = true;
    //     this.isConnect = true;
    //     if (cb) {
    //         cb('connected'); // 해당 string state 로 UI state 를 강제변경하나 문제를 일으킬 수 있습니다.
    //     }
    // }

    setSerialPort(sp) {
        this.sp = sp;
    }

    requestInitialData(sp) {
        // if(mainWindow){
        //     mainWindow?.webContents.send('console','dddd');
        // }
        // log('requestInitialData');
        // if (!this.sp) {
        //     this.sp = sp;
        // }
        // if (!this.isSendInitData) {
        //     this.isConnect = true;

        //     const startRobot = new Promise(resolve => {
        //         // rendererConsole.log(`I am finally connected`);
        //         console.log('Start the robot.');
        //         // const sensorCmd = this.getSensors(this.robot.samplingPeriods);
        //         const sensorCmd = new Buffer([0xA2, 0x00, 0xBF, 0xA9, 0x00, 0x07, 0x00])
        //         this.sendInit(sensorCmd);

        //         setTimeout(() => {
        //             log('setTimeout');
        //             resolve();
        //         }, BLETimeout);
        //     });
        //     startRobot.finally(() => {
        //         log('finally');
        //         const sensorCmd = this.getSensors(this.robot.samplingPeriods);
        //         this.sendInit(sensorCmd);
        //         // this.isSendInitData = true;
        //         /*const verCmd = this.getVersion();
        //         this.send(verCmd);*/
        //     }).then(() => {
        //         new Promise(resolve => {
        //             setTimeout(() => {
        //                 log('getSensors');
        //                 const sensorCmd = this.getSensors(this.robot.samplingPeriods);
        //                 this.sendInit(sensorCmd);
        //                 resolve();
        //             }, 1000);
        //         })
        //     });

        // }
        //
        
        return this.connectGeniBot();
    }

    connectGeniBot() {
        const result = Buffer.from([0xA2, 0x00, 0xBF, 0xA9, 0x00, 0x07, 0x00]);
        return result;
    }

    checkInitialData(data, config) {
        
        return true;
    }


    /*************************************************************************
     * Name: validateLocalData
     *
     * Description: Use when you need to verify data received
     *              from hardware periodically.
     *
     * data -
     *
     * Returned Value :
     *************************************************************************/
    validateLocalData(data) {
        //logger.info('checkInitialData genibot');
        // log('validateLocalData genibot');
        // log(data);
        // 해당 함수가 존재하면, 디바이스에서 데이터를 받아온 후 validate 를 거친다. 없으면 그대로 처리로직으로 진행한다.
        //return (data.byteLength == 25 || data.byteLength == 29 || data.byteLength == 9)

        return true;
    }

    /*************************************************************************
     * Name: requestRemoteData
     *
     * Description: Send data to Entry
     *
     * Returned Value :
     *************************************************************************/
    requestRemoteData(handler) { //sendtobrowser
         handler.write('OIDCODE', this.oidCode.decimal);
         handler.write('ACC_TILT', this.accelerationSensor);
         handler.write('ROBOT_VERSION',this.robot.version);
        // const val = this.buttonStatus.status > 0 ? "1":"0";
        // this.buttonStatus.status = 0;
        // handler.write("BUTTON", val);
        // const val = this.buttonStatus.status > 0 ? '1' : '0';
        // handler.write("log",this.data);
        // if (this.buttonStatus.status > 0) {
        if (this.buttonStatus.status > 0) {
            this.buttonStatus.status = -1;
            // handler.write("log",this.data);
            // handler.write('BUTTON', this.data);
            handler.write('BUTTON', true);
            // this.data = [];
            // this.countButton = 0;
            // await this.sleep(100);
        }else{
            handler.write('BUTTON', false);
        }

        if(this.logger.length > 0){
            handler.write('LOGGER', {list:this.logger});
            this.logger =[];
        }


        // this.countButton++;{
        /*
        if (this.first) {
            this.first = false;
            /!*setInterval(function() {
                handler.write('OIDCODE', this.oidCode.decimal);
            }, 250);*!/
            /!*setInterval(function() {
                handler.write('ACC_TILT', this.accelerationSensor);
            }, 1000);*!/

            setInterval(function() {
                if (this.buttonStatus == undefined) {
                    this.buttonStatus = { status: 0 };
                }
                const val = this.buttonStatus.status > 0 ? '1' : '0';
                this.buttonStatus.status = 0;
                handler.write('BUTTON', val);
            }, 2000);
        }*/


        //logger.info('checkInitialData genibot');
        // log('requestRemoteData genibot');
        // handler.write("BUTTON", "1")
        // log(this.buttonStatus.status.toString())
        // console.log('HELLOWORLD');
        /*if (this.buttonStatus.status > 0) { // button pressed
            this.buttonStatus.status = 0;
            handler.write("BUTTON", "1")
            log('Button 1');

        } else {
            handler.write("BUTTON", "0")
            // log("Button 0")

        }*/

        // 디바이스에서 데이터를 받아온 후, 브라우저로 데이터를 보내기 위해 호출되는 로직. handler 를 세팅하는 것으로 값을 보낼 수 있다.
        // handler.write(key, value) 로 세팅한 값은 Entry.hw.portData 에서 받아볼 수 있다.

    };

    isValidACK(ack) {
        if (ack && this.next_ack <= ack) {
            this.next_ack = ack + 1;
            console.log('ACK' + ack);
            console.log('next_ACK' + this.next_ack);

            return true;
        }
        return false;
    }

    /*************************************************************************
     * Name: handleRemoteData
     *
     * Description: Handle received data from Entry
     *
     * Returned Value :
     *************************************************************************/
    handleRemoteData(handler) {

        //logger.info('checkInitialData genibot');
        // log('handleRemoteData genibot');

        const set_led = handler.read('SET_LED_COLOR');
        if (set_led) {
            // this.logger.push(set_led['ACK']);
            if (this.isValidACK(set_led['ACK'])) {
                const ledColor = set_led['COLOR'];
                const side = set_led['SIDE'];
                log('LEDCOLOR');

                log(ledColor);
                log('side', side);

                this.setLED(ledColor, side);
            }
        }
        const slcn = handler.read('SET_LED_COLOR_NAME');
        // log('slcn', slcn['ACK']);
        if (handler.e('SET_LED_COLOR_NAME')) {
            const args = handler.read('SET_LED_COLOR_NAME');
            if (this.isValidACK(args['ACK'])) {
                // log('setLedColorName');
                // this.logger.push(`set ledColorName ${args.LED} -${args.COLOR_NAME} -${args.COLOR_BRIGHTNESS} -`)
                this.setLedColorName(args);
            }
        }


        // const setRSI = handler.read('SET_ROBOT_SPEED_ITEM')
        // const setRSI = handler.e('SET_ROBOT_SPEED_ITEM')
        // if (handler.e('SET_ROBOT_SPEED_ITEM')) {
        //     const setRSI = handler.read('SET_ROBOT_SPEED_ITEM');
        //
        //     log(`setRSI${setRSI.SPEED}`);
        // }
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
                // const direction = handler.read('DIRECTION')
                //console.log('args MOVE_DISTANCE');
                //this.logger.push('args MOVE_DISTANCE '+this.motion.stepRate);
                //this.cmd = { 'MOVE_DISTANCE': args };
                this.moveDistance(args);
            }
        }
        if (handler.e('START_MOVING')) {
            const args = handler.read('START_MOVING');
            if (this.isValidACK(args['ACK'])) {
                // const direction = handler.read('DIRECTION')
                this.cmd = { 'START_MOVING': args };
                this.startMoving(args);
            }
        }
        if (handler.e('STOP_MOVING')) {
            const args = handler.read('STOP_MOVING');
            if (this.isValidACK(args['ACK'])) {
                // const direction = handler.read('DIRECTION')
                this.cmd = { 'STOP_MOVING': args };
                this.stopMoving();
            }
        }

        if (handler.e('SET_ROBOT_SPEED_ITEM')) {
            const args = handler.read('SET_ROBOT_SPEED_ITEM');
            //this.logger.push('args SET_ROBOT_SPEED_ITEM '+args['ACK'] +' hw ack: '+this.next_ack);
            if (this.isValidACK(args['ACK'])) {
                let a =  this.setRobotSpeedItem(args);
                // this.logger.push('args SET_ROBOT_SPEED_ITEM2 - '+ a);
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
                // this.logger.push('args MOVE_DISTANCE '+args.VELOCITY +' '+args.ANGLE);
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
                log('SET_SPEAKER_VOLUME');
                this.setSpeakerVolume(args);
            }
        }


        if (handler.e('SET_TEMPO')) {
            const args = handler.read('SET_TEMPO');
            if (this.isValidACK(args['ACK'])) {
                log('SET_TEMPO');
                this.setTempo(args);
            }
        }

        if (handler.e('SET_INSTRUMENT')) {
            const args = handler.read('SET_INSTRUMENT');
            if (this.isValidACK(args['ACK'])) {
                log('SET_INSTRUMENT');
                this.setInstrument(args);
            }
        }


        if (handler.e('PLAY_NOTE')) {
            const args = handler.read('PLAY_NOTE');
            if (this.isValidACK(args['ACK'])) {
                log('PLAY_NOTE');
                this.playNote(args);
            }
        }


        // 엔트리 브라우저에서 온 데이터를 처리한다. handler.read 로 브라우저의 데이터를 읽어올 수 있다.
        // handler 의 값은 Entry.hw.sendQueue 에 세팅한 값과 같다.
        // let buffer = new Buffer([]);
        // const digitalPin = this.digitalPin;

        // for (let i = 0 ; i < 14 ; i++) {
        //     digitalPin[i] = handler.read(i);

        //     buffer = Buffer.concat([
        //         buffer,
        //         this.makeOutputBuffer(1, i, digitalPin[i] === 1 ? 255 : 0),
        //     ]);
        // }

        // if (buffer.length) {
        //     this.sendBuffers.push(buffer);
        // }
    }

    /**
     * delay
     * @param {*} ms
     */
    resolveTimePromise(milliseconds) {
        // return false
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /*************************************************************************
     * Name: requestLocalData
     *
     * Description: Returns the data to pass to the hardware device.
     *              In case of slave mode, requests are made to the device
     *              continuously at intervals of the duration attribute.
     *
     * Returned Value :
     *************************************************************************/
    requestLocalData() { //sendToGENI
        //logger.info('checkInitialData genibot');
        // log('requestLocalData genibot');
        // 디바이스로 데이터를 보내는 로직. control: slave 인 경우 duration 주기에 맞춰 디바이스에 데이터를 보낸다.
        // return 값으로 버퍼를 반환하면 디바이스로 데이터를 보내나, 아두이노의 경우 레거시 코드를 따르고 있다.

        // if (this.sendBuffers.length > 0) {
        //     this.sp.write(this.sendBuffers.shift(), () => {
        //         if (this.sp) {
        //             this.sp.drain(() => {
        //                 this.isDraing = false;
        //             });
        //         }
        //     });
        // }
        //* const self = this;
        // if (this.sendBuffers.length > 0 && !self.isDraing) {
        //     // this.sp.write(this.sendBuffers.shift());
        //     // this.sendBuffers =[]
        //     self.isDraing = true;

        //     const top = this.sendBuffers.shift();
        //     let cmd = [];
        //     let timeout = BLESendInterval;
        //     if (Array.isArray(top[0])){
        //         cmd = top[0];
        //         timeout = top[1];
        //     }else{
        //         cmd = top;
        //     }
        //     // this.logger.push(cmd)
        //     setTimeout(function() {
        //         self.isDraing = false;
        //     },timeout);
        //*     return cmd;
            // this.sp.write(this.sendBuffers.shift(), () => {
            //     if (this.sp) {
            //         this.isDraing = false;
            //         // this.sp.drain(() => {
            //         //     this.isDraing = false;
            //         // });
            //     }
            // });
        //*}
        // if (!this.isDraing && this.sendBuffers.length > 0) {
        //     this.isDraing = true;
        //     const cmd = this.sendBuffers.shift();
            // const list = this.sendBuffers.shift();
            // const cmd = list[0]
            // const timeout = list[1]
            // log('isDraing[' + cmd + '] left:' + this.sendBuffers.length);
            // this.sp.write(cmd, function() {
            //     if (self.sp) {
            //         self.sp.drain(function() {
            //             self.isDraing = false;
            //             // setTimeout(function() {
            //             //     self.isDraing = false;
            //             //     // log('DRAINING FALSE');
            //             // }, 2);
            //         });
            //     }
            // });
            // if (this.sendBuffers.length > 0) {
            //     this.sp.write(this.sendBuffers.shift(), () => {
            //         if (this.sp) {
            //             this.sp.drain(() => {
            //                 this.isDraing = false;
            //             });
            //         }
            //     });
            // }
        // }
        // this.sp.write(new Buffer([0xC1, 0xFF, 0x00, 0xC2, 0x00, 0x0B, 0x02, 0xFF, 0xFF, 0x32, 0xFF]))


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

        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.
        // Please note that calling sort on an array will modify that array.
        // you might want to clone your array first.

        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    _onMessage(data) {
        
        if (data.byteLength == 25 || data.byteLength == 29) {
            
            // if(this.arraysEqual(data,this.data)){
            //     this.data = []
            // }else{
            this.data = data;
            // }

            /* log(data.byteLength);
             log(data.length);
             for (let i = 0; i < data.length; i++) {
                 log2(data[i]);
             }*/

            /* log(' ');*/
            // if(data[7] >0)
            this.buttonStatus.status = data[7];
            // log('BUTTON' + data[7]);
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

    /*************************************************************************
     * Name: handleLocalData
     *
     * Description: Handle data from H/W device
     *
     * Returned Value :
     *************************************************************************/
    handleLocalData(data) {
        //logger.info('checkInitialData genibot');
        // log('handleLocalData genibot');
        // log(data.byteLength)

        this._onMessage(data);
        // await this.sleep(10000);

        // this.setLED([255,51,153],0xff)

        // const startRobotCMD = new Buffer([0xA3, 0x00, 0x00, 0xC1, 0x0, 0x37, 0x01, 0x04, 0x4D, 0x0, 0x28, 0x3, 0x64, 0x04, 0x4F, 0x0, 0x28, 0x3, 0x64, 0x04, 0x51, 0x0, 0x28, 0x3, 0x64, 0x04, 0x52, 0x0, 0x28, 0x3, 0x64, 0x04, 0x54, 0x0, 0x28, 0x3, 0x64, 0x04, 0x56, 0x0, 0x28, 0x3, 0x64, 0x04, 0x58, 0x0, 0x28, 0x3, 0x64, 0x04, 0x59, 0x0, 0x28, 0x3, 0x64])
        // this.send(startRobotCMD)

        // window.clearTimeout(this._timeoutID);
        // this._timeoutID = window.setTimeout(
        //     () => this._ble.handleDisconnectError(BLEDataStoppedError),
        //     BLETimeout);


    }

    /*************************************************************************
     * Name: connect
     *
     * Description:
     *
     * Returned Value :
     *************************************************************************/
    connect() {
        //this.writeDebug('info', 'connect');
        this.isConnect = true;
        log("Connect");
        setTimeout(() => {
            log("SendSensor");
            const sensorCmd = this.getSensors(this.robot.samplingPeriods);
            this.sp.write(sensorCmd, (err) => {log(error);});
        }, 500);

        setTimeout(() => {
            log("SendSensor2");
            const sensorCmd = this.getVersion();
            this.sp.write(sensorCmd, (err) => {log(error);});
        }, 1500);
        this.next_ack = 0;
    }   

    /*************************************************************************
     * Name: disconnect
     *
     * Description:
     *
     * Returned Value :
     *************************************************************************/

    disconnect(connector) {
        //logger.info('checkInitialData genibot');
        log('disconnect genibot');
        // 커넥터가 연결해제될 때 호출되는 로직, 스캔 정지 혹은 디바이스 연결 해제시 호출된다.
        if(this.sp){
            this.isConnect = false;
            if (this.sp.isOpen) {
                console.log('Disconnect');
                connector.close();
            }
            this.sp = null;
        }else{
            connector.close();
        }
        
        // if (this.sp) {
        //     delete this.sp;
        // }
        //logger.info("disconnect")
    };

    /*************************************************************************
     * Name: reset
     *
     * Description:
     *
     * Returned Value :
     *************************************************************************/
    reset() {
        //logger.info('checkInitialData genibot');
        log('reset genibot');
        this.isDraing = false;
        // this.data = [];
        this.logger= [];
        this.next_ack = 0;
        // 엔트리 브라우저와의 소켓 연결이 끊어졌을 때 발생하는 로직.
        this.buttonStatus = { status: 0 };
        this.accelerationSensor = { aX: 0, aY: 0, aZ: 0, tilt: 0 };
        this.lightSensor = { R2: 0, R1: 0, L1: 0, L2: 0 };
        this.arduino = { ain: 0 };

        // if (this._timeoutID) {
        //             window.clearTimeout(this._timeoutID);
        //             this._timeoutID = null;
        // }
    }

    // 이 아래로는 자유롭게 선언하여 사용한 함수입니다.
    makeOutputBuffer(device, port, data) {
        //logger.info('checkInitialData genibot');
        log('makeOutputBuffer genibot');
        let buffer;
        const value = new Buffer(2);
        const dummy = new Buffer([10]);

        value.writeInt16LE(data);
        buffer = new Buffer([
            255,
            85,
            6,
            0, // sensorIdx
            2,
            device,
            port,
        ]);
        buffer = Buffer.concat([buffer, value, dummy]);

        return buffer;
    };

    getDataByBuffer(buffer) {
        //logger.info('checkInitialData genibot');
        log('getDataByBuffer genibot');
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


    /**
     * getVersion
     * Use version control to add a new funtion block
     */
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

    /**
     * getSensors
     * samplingPeriods: 10 to 100 that is mached to 0.1s to 1.0s
     * virtualId 0x10: read Oid, turn off Green led
     * @param {*} periods
     */
    getSensors(periods) {
        const virtualId = [TASK_ID.PERIPHERALS.GET_SENSORS, 0x10, this.robot.id];
        const opCode = [OP_CODE.PERIPHERALS.GET];
        const packageSize = [0x00, 0x07];
        const samplingPeriods = [periods];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...samplingPeriods,
        ];
        return command;
    }

    sendInit(command) {
        if (!this.isConnected()) {
            return;
        }
        if (this._busy) {
            return;
        }
        this._busy = true;
        log('send');
        log(command);
        this.sp.write(command, (val) => {
            this._busy = false;
        });
    }

    send(command) {
        if (!this.isConnected()) {
            return;
        }
        // this.sendBuffers.push(...Array(10).fill(command));
        this.sendBuffers.push(command);
    }

    send2(command,stepTime) {
        if (!this.isConnected()) {
            return;
        }
        // this.sendBuffers.push(...Array(10).fill(command));
        this.sendBuffers.push([command,stepTime]);
    }

    /**
     * Return true if connected to the robot.
     * @return {boolean} - whether the robot is connected.
     */
    isConnected() {
        //should add other logic if using ble later
        return this.isConnect;
    }

    /**
     * setRobotSpeedItem
     * @param {*} args
     */
    async setRobotSpeedItem(args) {
        if(!args.SPEED)
            return

        let speed = STEPPER_RATE.NORMAL;
        // let speed = STEPPER_RATE.FAST;
        // let speed = null;

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
        // if(speed !=null)
        this.motion.stepRate = speed;

        return this.motion.stepRate
    }

    /**
     * moveDistance
     * @param {*} args
     */
    moveDistance(args) {
        // console.log('HELLO');
        // let stepRate = this.motion.stepRate;
        let stepRate =  this.motion.stepRate;
        if (args.DIRECTION == 'front') {
            stepRate *= 1;
        } else {
            stepRate *= -1;
        }
        return this.startMotionStepsDistance(stepRate, parseInt(args.DISTANCE, 10));
    }

    /**
     * turnAngle
     * @param {*} args
     */
    turnAngle(args) {
        let stepRate = this.motion.stepRate;
        if (args.DIRECTION === 'left') {
            stepRate *= 1;
        } else {
            stepRate *= -1;
        }
        return this.startMotionStepsAngle(stepRate, parseInt(args.ANGLE, 10));
    }

    /**
     * motionGoDistance
     * Added SetMotionSteps, a value of positive or negative StepRate is from 850 to 1000
     * @param {*} args
     */
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

    /**
     * motionRotateAngle
     * Added SetMotionSteps,  positive or negative sps (steps per seconds) is from 850 to 1000
     * @param {*} args
     */
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

    /**
     * startMoving
     * Added SetMotionSteps,  positive or negative sps (steps per seconds)  is from 850 to 1000
     */
    startMoving(args) {
        let velocity1 = parseInt(args.VELOCITY1, 10) * 30;
        let velocity2 = parseInt(args.VELOCITY2, 10) * 30;
        if (this.linefollower.action > ACTION_STATE.PAUSE) {
            this.setLineFollower(false);
            //return this.resolveTimePromise(BLESendInterval);
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


    /**
     * setLedColor
     * Set 03h to Front LED, 01h to Back LED, 02h to Left LED, 00h to Right LED or FFh to four LEDs.
     * Color nmae {RED 0, GREEN 1, BLUE 2, CYAN 3, MAGENTA 4, YELLOW 5, VIOLET 6, ORANGE 7, SPRINGGREEN 8,  LIGHTPINK 9, WHITE E}
     * Brighness is 0 to 100 in percentage
     * @param {*} args
     */
    setLedColorName(args) {
        // console.log("colorNameIndex" +colorNameIndex);
        log('args.COLOR_NAME' + args.COLOR_NAME);

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
            'light pink': 0x9,
        };
        const ledIdIndex = { 'left': 0x02, 'right': 0x00, 'front': 0x03, 'back': 0x01, 'all': 0xFF };
        let colorNameIndex = indexOfColorName[args.COLOR_NAME];
        // let colorNameIndex = indexOfColorName[args.COLOR_NAME];
        // let colorNameIndex = 0x0E;
        // log('colorNameIndex'+colorNameIndex)
        let ledId = ledIdIndex[args.LED];
        let brightness = MathUtil.clamp(Number(args.COLOR_BRIGHTNESS), 1, 100);
        this.setLEDName(colorNameIndex, ledId, brightness);
        if (ledId != 0xFF && this.robot.version < 7) {
            return this.resolveVersionError();
        }
        //return this.resolveTimePromise(BLESendInterval);
    }

    /**
     * startLineFollower
     * Check stop message not to conflit another stop command
     * @param {*} args
     */
    startLineFollower(args) {
        if (args.ACTION == 'start') {
            this.linefollower.action = ACTION_STATE.START;
            this.setLineFollower(true);
        } else {
            this.linefollower.action = ACTION_STATE.PAUSE;
            this.setLineFollower(false);
        }
        //return this.resolveTimePromise(BLESendInterval);
    }

    /**
     * setInstrument
     * @param {*} args
     */
    setInstrument(args) {
        this.setInstrumentCMD(args.INSTRUMENT);
        //return this.resolveTimePromise(BLESendInterval);
    }

    /**
     * setTempo
     * Tempo is from 88 to 140
     * @param {*} args
     */
    setTempo(args) {
        const tempo = MathUtil.clamp(args.TEMPO, 88, 140);
        this.setTempoCMD(tempo);
        //return this.resolveTimePromise(BLESendInterval);
    }

    /**
     * playNote
     * @param {*} args
     */
    playNote(args) {
        const noteLabel = ['whole', 'half', 'dottedHalf', 'quarter', 'dottedQuarter', 'eight', 'dottedEight', 'sixteenth'];
        const noteId = noteLabel.findIndex(element => element === args.BEATS);
        // log('noteId' + noteId);
        // log('args.NOTE' + args.NOTE);
        this.setMusicNotes(args.NOTE, noteId, -1);
        // TODO try to remove line under
        // return this.resolveTimePromise((this.countNoteLength(noteId) * 1000) + 500);
    }

    /**
     * Mandatory field data format is described as {VirtualId:OpCode:PacketSize:Property}.
     * Data format of VirtualId is described as {TaskId:Reserved:robotId}.
     * Set 00h or FFh to Reserved and robotId field.
     * When you make GeniBot star network define robotId from 00h to 07h according to the connection link order.
     * {None} means that you don’t add a value or some data set in the excluded fields.
     * To set some parameters such as OidCode, VirtualCode, NoteId, Tempo or more, see GeniBot Oid code reference document.
     *
     * Client robot will immediately send a response with the mandatory field data set to host robot.
     */


    /**
     * @param {number} StepRate - steps per seconds
     * @param {number} Steps - steps
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
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

    /**
     * @param {*} stepRate
     * @param {*} distance
     * Added SetMotionSteps, see Programmer's guide.
     * a. VirtualId{TaskId:Reserved:robotId}:OpCode:PacketSize:ActionState:MotionType:{StepRate:Distance}
     * b. VirtualId{TaskId:Reserved:robotId}:OpCode:PacketSize:ActionState:MotionType:{StepRate:Angle}
     * setMotionStepsDistance: to go forward or backward, back and forth motion,
     * setMotionStepsAngle: to rotate left or right, see Programmer's guide.
     */
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
        // return this.send(command);
        // let stepTime = (distance * this.motion.distanceMultiplier / (Math.abs(stepRate) / (Math.abs(stepRate) * -0.01 + 11)))  * 1000;
        // return this.send2(command,stepTime);
        // let today = new Date();   
        // let hours = today.getHours(); // 시
        // let minutes = today.getMinutes();  // 분
        // let seconds = today.getSeconds();  // 초
        // let milliseconds = today.getMilliseconds();
        // log("setMotionStepsDistance:"+ minutes + ':' + seconds + ':' + milliseconds);
        log("distanceCommand ["+command+"]");
        this.sp.write(command);
    }

    /**
     * @param {*} stepRate
     * @param {*} angle
     */
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
            ...steppers,
        ];
        log("angleCommand ["+command+"]");
        // let today = new Date();   
        // let hours = today.getHours(); // 시
        // let minutes = today.getMinutes();  // 분
        // let seconds = today.getSeconds();  // 초
        // let milliseconds = today.getMilliseconds();
        // log("setMotionStepsAngle:"+ minutes + ':' + seconds + ':' + milliseconds);

        return this.sp.write(command);
    }

    /**
     * setLED:
     * Each color in rgb space,  see Programmer's guide.
     * colorSpace: rgb space
     * setLedId: Set 03h to Front LED, 01h to Back LED, 02h to Left LED, 00h to Right LED or FFh to four LEDs
     * @param {*} color
     * @param {*} ledId
     */
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
            ...setLedId,
        ];
        log('setLED');
        log(command);
        return this.sp.write(command);
    }

    /**
     * setLED:
     * Each color in rgb space,  see Programmer's guide.
     * colorSpace: rgb space
     * setLedId: Set 03h to Front LED, 01h to Back LED, 02h to Left LED, 00h to Right LED or FFh to four LEDs
     * @param {*} color
     * @param {*} ledId
     */
    setLEDName(colorNameIndex, ledId, brightness) {
        const virtualId = [TASK_ID.PERIPHERALS.SET_COLOR_LED, 0x00, this.robot.id];
        const opCode = [OP_CODE.PERIPHERALS.SET];
        const packageSize = [0x00, 0x0B];
        const colorSpace = [0x02];
        const colorRGB = [0x0, colorNameIndex, brightness];
        log('brightness' + brightness);
        log('colorRGB' + colorRGB);
        const setLedId = [(this.robot.version < 7) ? 0xFF : ledId];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...colorSpace,
            ...colorRGB,
            ...setLedId,
        ];
        return this.sp.write(command);
    }

    /**
     * @param {*} stepperActionState
     * @param {*} speed1
     * @param {*} speed2
     * setContinuousSteps:
     * To make a contiuous linear or rotational motion,
     */
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
            ...steppers,
        ];
        return this.sp.write(command);
    }

    /**
     * @param {*} isStartAction
     * setLineFollower:
     * Start line follower with pid motion control in the robot,
     */
    setLineFollower(isStartAction) {
        const virtualId = [TASK_ID.CARDS.SET_LINE_FOLLOWER, 0x00, this.robot.id];
        const opCode = [OP_CODE.CARDS];
        const packageSize = [0x00, 0x07];
        const actionState = [isStartAction ? ACTION_STATE.START : ACTION_STATE.PAUSE];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...actionState,
        ];
        return this.sp.write(command);
    }

    /**
     * @param {*} instrument
     * setInstrument:
     * Configure piano, flute or strting
     */
    setInstrumentCMD(instrument) {
        this.music.instrument = instrument;
    }

    /**
     * setTempo :
     * Configure tempo from 88 to 140
     * @param {*} tempo
     */
    setTempoCMD(tempo) {
        this.music.tempo = tempo;
    }

    /**
     * @param {*} note
     * @param {*} beatId
     * setMusicNotes :
     * Music notes can be constructed in array set as {{NoteCode:InstruementId:Reserved:NoteId:Tempo}, {}, {}  ...}
     * musicNotes: it is spefified with instrument address of which is from 1100 to 1600
     * instrumentId: piano, flute, string
     * beatId: NoteId from whole to sixteenth
     * tempo: it is from 88 to 140
     */
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
            parseInt(this.music.tempo, 10),
        ];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...actionState,
            ...musicNotes,
        ];
        // const resolveTime =  (this.countNoteLength(beatId) * 1000) + BLESendInterval;
        // return this.send2(command,resolveTime);
        // this.sp.write(command);
        this.sp.write(command);
    }

    /**
     * setSpeakerVolume: from 1 (minimum) to 10 (maximum)
     * @param {*} volume
     */
    setSpeakerVolumeCMD(volume) {
        const virtualId = [TASK_ID.PERIPHERALS.SET_SPEAKER_VOLUME, 0x00, this.robot.id];
        const opCode = [OP_CODE.PERIPHERALS.SET];
        const packageSize = [0x00, 0x07];
        const setVolume = [parseInt(volume, 10)];
        const command = [
            ...virtualId,
            ...opCode,
            ...packageSize,
            ...setVolume,
        ];
        return this.sp.write(command);
    }

    /**
     * countNoteLength
     * @param {*} noteId
     */
    countNoteLength(noteId) {
        const noteBPM = [240, 120, 180, 60, 90, 30, 45, 15]; // Beat per miniutes
        return noteBPM[noteId] ? (noteBPM[noteId] / this.music.tempo) : 2.4; // Duration in seconds
    }

    // /**
    //  * countNoteLength
    //  * @param {*} noteId
    //  */
    // countNoteLength(noteId) {
    //     const noteBPM = [240, 120, 180, 60, 90, 30, 45, 15]; // Beat per miniutes
    //     return noteBPM[noteId] ? (noteBPM[noteId] / this.music.tempo) : 2.4; // Duration in seconds
    // }


    /////GENI BLOCK CLASS

    /**
     * resolveVersionError
     */
    resolveVersionError() {
        // return new Promise((resolve, reject) => {
        //     this.timer =   setTimeout(() => {
        //         // alert(message);
        //         let message = "GeniBot firmware verion is " + this.peripheral.robot.version+ ". Please update the robot to run this block.";
        //         switch(formatMessage.setup().locale) {
        //             case 'ko' : message= "지니봇 펌웨어 버전 (" + this.peripheral.robot.version + ") 입니다. 올바른 작동을 위해 새 펌웨어로 업데이트하세요."; break;
        //         }
        //         resolve(message);
        //     }, BLESendInterval);
        // });
        log('GeniBot firmware verion is ' + this.robot.version + '. Please update the robot to run this block.');
        return false;
    }

    /**
     * setSpeakerVolume
     * Default volume is 0 (maximunm loudness), the loudness is from 1 to 9
     * @param {*} args
     */
    setSpeakerVolume(args) {
        let volume = args.VOLUME;
        volume = (volume == '10') ? '0' : volume;
        this.setSpeakerVolumeCMD(volume);
        console.log('Speaker volume', volume);
        //return this.resolveTimePromise(BLESendInterval);
    }

    /**
     * startMotionStepsDistance
     * Added SetMotionSteps{linear motion}, see Programmer's guide
     * @param {*} stepRate
     * @param {*} distance
     */
    startMotionStepsDistance(stepRate, distance) {
        let stepTime = (distance * this.motion.distanceMultiplier / (Math.abs(stepRate) / (Math.abs(stepRate) * -0.01 + 11))) * 1000;

        if (this.linefollower.action > ACTION_STATE.PAUSE) {
            this.setLineFollower(false);
        } else {
            log('setMotionStepsDistance'+distance);
            distance = MathUtil.clamp(distance, GenibotDistanceLimit.MIN, GenibotDistanceLimit.MAX);
            this.setMotionStepsDistance(stepRate, distance);
            // this.setMotionStepsDistance(stepRate, distance, stepTime);
        }

        // Stepping time rate = -0.01 * stepRate + 11, refer to Stepper gear ratio 1:50 at 1000sps
        // let stepTime = (distance * this.motion.distanceMultiplier / (Math.abs(stepRate) / (Math.abs(stepRate) * -0.01 + 11))) * 1000;
        //console.log('Stepping time in ms', stepTime);
        /*if (this.robot.version < 7) {
            return this.resolveVersionError();
        }*/

        // return this.resolveTimePromise(stepTime);
    }

    /**
     * startMotionStepsAngle
     * Added SetMotionSteps{rotation}, see Programmer's guide
     * @param {*} stepRate
     * @param {*} angle
     */
    startMotionStepsAngle(stepRate, angle) {
        if (this.linefollower.action > ACTION_STATE.PAUSE) {
            this.setLineFollower(false);
        } else {
            log('setMotionStepsAngle'+angle);
            angle = MathUtil.clamp(angle, GenibotAngleLimit.MIN, GenibotAngleLimit.MAX);
            this.setMotionStepsAngle(stepRate, angle);
        }
        // Stepping time rate = -0.01 * stepRate + 11, refer to Stepper gear ratio 1:50 at 1000sps
        //let stepTime = (angle * this.motion.angleMultiplier / (Math.abs(stepRate) / (Math.abs(stepRate) * -0.01 + 11))) * 1000;
        //console.log('Stepping time in ms', stepTime);
        /*if(this.robot.version < 7) {
            return this.resolveVersionError();
        }*/
        //return this.resolveTimePromise(stepTime);
    }

}

module.exports = new Module();

class MathUtil {
    /**
     * Convert a value from degrees to radians.
     * @param {!number} deg Value in degrees.
     * @return {!number} Equivalent value in radians.
     */
    static degToRad(deg) {
        return deg * Math.PI / 180;
    }

    /**
     * Convert a value from radians to degrees.
     * @param {!number} rad Value in radians.
     * @return {!number} Equivalent value in degrees.
     */
    static radToDeg(rad) {
        return rad * 180 / Math.PI;
    }

    /**
     * Clamp a number between two limits.
     * If n < min, return min. If n > max, return max. Else, return n.
     * @param {!number} n Number to clamp.
     * @param {!number} min Minimum limit.
     * @param {!number} max Maximum limit.
     * @return {!number} Value of n clamped to min and max.
     */
    static clamp(n, min, max) {
        return Math.min(Math.max(n, min), max);
    }

    /**
     * Keep a number between two limits, wrapping "extra" into the range.
     * e.g., wrapClamp(7, 1, 5) == 2
     * wrapClamp(0, 1, 5) == 5
     * wrapClamp(-11, -10, 6) == 6, etc.
     * @param {!number} n Number to wrap.
     * @param {!number} min Minimum limit.
     * @param {!number} max Maximum limit.
     * @return {!number} Value of n wrapped between min and max.
     */
    static wrapClamp(n, min, max) {
        const range = (max - min) + 1;
        return n - (Math.floor((n - min) / range) * range);
    }


    /**
     * Convert a value from tan function in degrees.
     * @param {!number} angle in degrees
     * @return {!number} Correct tan value
     */
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

    /**
     * Given an array of unique numbers,
     * returns a reduced array such that each element of the reduced array
     * represents the position of that element in a sorted version of the
     * original array.
     * E.g. [5, 19. 13, 1] => [1, 3, 2, 0]
     * @param {Array<number>} elts The elements to sort and reduce
     * @return {Array<number>} The array of reduced orderings
     */
    static reducedSortOrdering(elts) {
        const sorted = elts.slice(0).sort((a, b) => a - b);
        return elts.map(e => sorted.indexOf(e));
    }

    /**
     * Return a random number given an inclusive range and a number in that
     * range that should be excluded.
     *
     * For instance, (1, 5, 3) will only pick 1, 2, 4, or 5 (with equal
     * probability)
     *
     * @param {number} lower - The lower bound (inlcusive)
     * @param {number} upper - The upper bound (inclusive), such that lower <= upper
     * @param {number} excluded - The number to exclude (MUST be in the range)
     * @return {number} A random integer in the range [lower, upper] that is not "excluded"
     */
    static inclusiveRandIntWithout(lower, upper, excluded) {
        // Note that subtraction is the number of items in the
        // inclusive range [lower, upper] minus 1 already
        // (e.g. in the set {3, 4, 5}, 5 - 3 = 2).
        const possibleOptions = upper - lower;

        const randInt = lower + Math.floor(Math.random() * possibleOptions);
        if (randInt >= excluded) {
            return randInt + 1;
        }

        return randInt;
    }

    /**
     * Scales a number from one range to another.
     * @param {number} i number to be scaled
     * @param {number} iMin input range minimum
     * @param {number} iMax input range maximum
     * @param {number} oMin output range minimum
     * @param {number} oMax output range maximum
     * @return {number} scaled number
     */
    static scale(i, iMin, iMax, oMin, oMax) {
        const p = (i - iMin) / (iMax - iMin);
        return (p * (oMax - oMin)) + oMin;
    }
}

// module.exports = MathUtil;
