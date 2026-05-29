const _ = global.$;
const BaseModule = require('./baseModule');

class Abilix_Krypton0 extends BaseModule {
    constructor() {
        super();

        //this.counter = 0;
        this.isSendInitData = false;
        this.isSensorCheck = false;
        this.isSensing = false;
        this.isConnect = false;
        this.isSendStartSnd = false;
        //this.isMotorPower = false;
        this.isLEDenabled = false;
        this.cmdcount = 0;
        this.skipcount = 0;
        this.waitingcmd = 0;

        this.sp = null;
        this.sensors = [];
        this.previous_wheel_status = null;

        // For log level.
        this.loglevelType = {
            INFO:            0x00,
            DEBUG:            0x01,
            WARNING:        0x02,
            ERROR:            0x04,
        };

        this.loglevel = this.loglevelType.ERROR;

        this.deviceTypes = {
            NONE:            0x01,
            BUTTON:            0x02,
            GRAY_INFRARED:    0x03,
            LIGHT:            0x07,
            MICROPHONE:        0x08,
            LED:            0x09,
            LMOTOR:            0x0A,
            RMOTOR:            0x0B,

            Initializing:    0x7d,
            WrongPort:        0x7f,
            Unknown:        0xff,
        };

        this.motoring = {
            LMOTOR: 0,
            RMOTOR: 0,
        };

        this.SENSOR = {
            BUTTON:            -1,
            GRAY_INFRARED1:    -1,
            GRAY_INFRARED2:    -1,
            LIGHT:            -1,
            MICROPHONE:        -1,
            LED:            -1,
        };

        this.PORT_INFO = {
            '1': {
                type: this.deviceTypes.NONE,
                port_values: 0,
            },
            '2': {
                type: this.deviceTypes.NONE,
                port_values: 0,
            },
            '3': {
                type: this.deviceTypes.NONE,
                port_values: 0,
            },
            '4': {
                type: this.deviceTypes.NONE,
                port_values: 0,
            },
        };


        this.SENSOR_MAP = {
            '1': {
                type: this.deviceTypes.NONE,
                port_values: 0,
            },
            '2': {
                type: this.deviceTypes.NONE,
                port_values: 0,
            },
            '3': {
                type: this.deviceTypes.NONE,
                port_values: 0,
            },
            '4': {
                type: this.deviceTypes.NONE,
                port_values: 0,
            },
        };

        this.audiofile = {
            audiodata: 'none',
            APPLIED: true,
        };

        this.led = {
            port: -1,
            value: -1,
            APPLIED: true,
        };

        this.LAST_PORT_STATUS = null;
    }

    //*************************************************************************
    // Name: checkLogLevel
    //
    // Description: Check Log Level
    //
    // Returned Value :
    //*************************************************************************/
    checkLogLevel(level) {
/*    
        var showlog = false;
    
        switch (level) {
            case 'error' :
                showlog = true;
                break;
            case 'warning' :
                if ( this.loglevel > this.loglevelType.DEBUG)
                    showlog = true;
                break;
            case 'debug' :
                if ( this.loglevel > this.loglevelType.INFO)
                    showlog = true;
                break;
            case 'info' :
                //if ( this.loglevel >= this.loglevelType.INFO)
                //    showlog = true;
                break;
            default :
                break;
        }

        return showlog;
*/
        return true;
    }

    /*************************************************************************
     * Name: writeDebug
     *
     * Description: Debugging Log Function
     *
     * level - debug log level : info, warning, error, success
     * message - log message
     *
     * Returned Value :
     *************************************************************************/
    writeDebug(level = 'info', message) {
        if (this.checkLogLevel(level) == true) {
            console.log('[', level, '] : ', message);
        }
    }

    /*************************************************************************
     * Name: writeArrayData
     *
     * Description: Debugging Log Function
     *
     * Returned Value :
     *************************************************************************/
    writeArrayData(level = 'info', buffer, iscommand) {
        if (this.checkLogLevel(level) == true) {
            const messages = Array.from(buffer, function(byte) {
                                    return ('0' + (byte & 0xff).toString(16)).slice(-2);
                                }).join(' ');
            if (iscommand) {
                console.log('    [ command ] : ${messages}');
            } else {
                console.log('    [ event ] : ${messages}');
			}
        }
    }

    /*************************************************************************
     * Name: setSerialPort
     *
     * Description: Debugging Log Function
     *
     * sp - serial port object
     *
     * Returned Value :
     *************************************************************************/
    setSerialPort(sp) {
        this.sp = sp;
    }

    /*************************************************************************
     * Name: getPortIndex
     *
     * Description: get port index (0x01 : PORT #4, 0x02 : PORT #3, 0x03 : PORT #2, 0x04 : PORT #1
     *
     * port - Port index
     *
     * Returned Value :
     *************************************************************************/
    getPortIndex(port) {
        let portindex = 0x00;

        switch (port) {
            case 1 : 
            case '1' :
                portindex = 0x04;
                break;
            case 2 :
            case '2' :
                portindex = 0x03;
                break;
            case 3 :
            case '3' :
                portindex = 0x02;
                break;
            case 4 :
            case '4' :
                portindex = 0x01;
                break;
            default :
                this.writeDebug('error', 'getPortIndex : unknown port number = ${port}');
                break;
        }
        
        this.writeDebug('debug', 'getPortIndex : port = ${port}   port index = ${portindex}');
        return portindex;
    }

    /*************************************************************************
     * Name: makeCmdHeaderBuffer
     *
     * Description: Make Abilix Command Header
     *
     * cmdword - Command word
     *
     * Returned Value :
     *************************************************************************/
    makeCmdHeaderBuffer(cmdword1, cmdword2) {
        const frameHeader = new Buffer([0xAA, 0x55, 0xFF, 0xFF, 0x72]);
        const cmdword = new Buffer([cmdword1, cmdword2, 0x00, 0x00, 0x00, 0x00]);

        if (cmdword1 == 0x0C) {
            const cmdindex = new Buffer([0x00, 0x00, 0x00, 0x00]);
            cmdindex[0] = this.cmdcount >> 24;
            cmdindex[1] = this.cmdcount >> 16;
            cmdindex[2] = this.cmdcount >> 8;
            cmdindex[3] = this.cmdcount++;

            return Buffer.concat([frameHeader, cmdword, cmdindex]);
        } else {
            return Buffer.concat([frameHeader, cmdword]);
        }
    }

    /*************************************************************************
     * Name: updatePacketSize
     *
     * Description: Change command packet length
     *
     * buffer - Command buffer data
     *
     * Returned Value :
     *************************************************************************/
    updatePacketSize(buffer) {
        const bufferLength = buffer.length - 4;
        buffer[2] = bufferLength >> 8;
        buffer[3] = bufferLength;
    }

    /*************************************************************************
     * Name: makeCRCdata
     *
     * Description:
     *
     * buffer - Command buffer data
     *
     * Returned Value :
     *************************************************************************/
    makeCRCdata(buffer) {
        let crcdata = 0x00;

        this.updatePacketSize(buffer);

        for (let index = 0; index < buffer.length; index++) {
            crcdata += buffer[index];
        }

        crcdata += 1;
        const crcValue = new Buffer([crcdata]);

        const data = Buffer.concat([buffer, crcValue]);
        this.updatePacketSize(data);

        this.writeArrayData('debug', data, 1);
        return data;
    }

     /*************************************************************************
     * Name: sensorChecking
     *
     * Description: Check the sensor every 200ms. Do not check while sensing.
     *
     * Returned Value :
     *************************************************************************/
    sensorChecking() {
        if (!this.isSensorCheck) {
            this.writeDebug('info', 'sensorChecking');
            this.sensing = setInterval(() => {
                this.sendCheckSensorcmd();
                this.isSensing = false;
            }, 100);
        }
    }

    /*************************************************************************
     * Name: sendStartSound
     *
     * Description: Send start sound ('Hello' or 'bye')
     *
     * Returned Value :
     *************************************************************************/
    sendSound(snddata) {
        this.writeDebug('info', 'sendSound : ${snddata}');
        const cmdheaderbuf = this.makeCmdHeaderBuffer([0x0C], [0x12]);
        const data = Buffer.concat([cmdheaderbuf, snddata]);

        return this.makeCRCdata(data);
    }

    /*************************************************************************
     * Name: makeStartmorotcmd
     *
     * Description: Make command to start Motor
     *
     * Returned Value :
     *************************************************************************/
    makeStartmorotcmd(port, direction, speed) {
        this.writeDebug('info', 'makeStartmorotcmd : port = ${port} direction = ${direction} speed = ${speed}');
        const cmdheader = this.makeCmdHeaderBuffer([0x0C], [0x01]);
        const portdata = new Buffer([0x00, 0x00, 0x00, 0x00]);
        const dirdata = new Buffer([0x00, 0x00, 0x00, 0x00]);
        const spdata = new Buffer([0x00, 0x00, 0x00, 0x00]);

        if (port == 'B') {
            portdata[3] = 0x01;
		}
		
        if (direction == 1) {
            dirdata[3] = 0x01;
		}
		
        spdata[3] = speed;

        const startmotorcmd = Buffer.concat([cmdheader, portdata, dirdata, spdata]);

        return this.makeCRCdata(startmotorcmd);
    }

    /*************************************************************************
     * Name: makeTurnoffcmd
     *
     * Description: Make command to turn off
     *
     * Returned Value :
     *************************************************************************/
    makeTurnoffcmd() {
        this.writeDebug('info', 'makeMotorTurnoffcmd');
        const cmdheader = this.makeCmdHeaderBuffer([0x0C], [0x05]);
        const param = new Buffer([0x00, 0x00, 0x00, 0x00]);
        const stopMotorcmd = Buffer.concat([cmdheader, param]);

        return this.makeCRCdata(stopMotorcmd);
    }

    /*************************************************************************
     * Name: makeUltasonicDetectObstacle
     *
     * Description: Make command to detect the obstacle by Ultasonic
     *
     * Returned Value :
     *************************************************************************/
    makeUltasonicDetectObstacle(port) {
        this.writeDebug('info', 'makeUltasonicDetectObstacle : port = ${port}');
        const cmdheader = this.makeCmdHeaderBuffer([0x0C], [0x06]);
        const usoniccmd = Buffer.concat([cmdheader, port]);

        return this.makeCRCdata(usoniccmd);
    }

    /*************************************************************************
     * Name: makeUltasonicDetectDistance
     *
     * Description: Make command to detect distance by Ultasonic
     *
     * Returned Value :
     *************************************************************************/
    makeUltasonicDetectDistance(port) {
        this.writeDebug('info', 'makeUltasonicDetectDistance : port = ${port}');
        const cmdheader = this.makeCmdHeaderBuffer([0x0C], [0x07]);
        const usoniccmd = Buffer.concat([cmdheader, port]);

        return this.makeCRCdata(usoniccmd);
    }

    /*************************************************************************
     * Name: makeTouchdetectcmd
     *
     * Description: Make command to detect touch by Ultasonic
     *
     * Returned Value :
     *************************************************************************/
    makeTouchdetectcmd(port) {
        this.writeDebug('info', 'makeTouchdetectcmd : port = ${port}');
        const cmdheader = this.makeCmdHeaderBuffer([0x0C], [0x08]);
        const touchdetectcmd = Buffer.concat([cmdheader, port]);

        return this.makeCRCdata(touchdetectcmd);
    }

    /*************************************************************************
     * Name: makeColorvaluecmd
     *
     * Description: Make command to change LED value
     *
     * Returned Value :
     *************************************************************************/
    makeColorvaluecmd(port, colorvalue) {
        this.writeDebug('info', 'makeColorvaluecmd : port = ${port} Color Value = ${colorvalue.toString(10)}');
        const cmdheader = this.makeCmdHeaderBuffer([0x0C], [0x09]);
        const param1 = new Buffer([0x00, 0x00, 0x00, 0x00]);
        const param2 = new Buffer([0x00, 0x00, 0x00, 0x00]);
        const colorvaluecmd = Buffer.concat([cmdheader, param1, param2]);

        return this.makeCRCdata(colorvaluecmd);
    }

    /*************************************************************************
     * Name: makePortonoffcmd
     *
     * Description: Make command to change LED value
     *
     * Returned Value :
     *************************************************************************/
    makePortonoffcmd(port, onoff) {
        this.writeDebug('debug', 'makePortonoffcmd : port = ${port} onoff Value = ${onoff.toString(10)}');
        this.isSensorCheck = true;
        const cmdheader = new Buffer([0xaa, 0x55, 0xFF, 0xFF, 0x72, 0xA4, 0x17, 0x00, 0x00, 0x00, 0x00]);
        const param1 = new Buffer([0x00, 0x00]);
        const pIndex = this.getPortIndex(port);

        param1[0] = pIndex;
        param1[1] = onoff;

        if (onoff == 0) {
            this.SENSOR.LED = 1;
        } else {
            this.SENSOR.LED = 0;
		}

        const portonoffcmd = Buffer.concat([cmdheader, param1]);

        return this.makeCRCdata(portonoffcmd);
    }

    /*************************************************************************
     * Name: makeDetectGrayvaluecmd
     *
     * Description: Make command to detect gray values
     *
     * Returned Value :
     *************************************************************************/
    makeDetectGrayvaluecmd(port) {
        this.writeDebug('info', 'makeDetectGrayvaluecmd : port = ${port}');
        const cmdheader = this.makeCmdHeaderBuffer([0x0C], [0x0A]);
        const detectgrayvaluecmd = Buffer.concat([cmdheader, port]);

        return this.makeCRCdata(detectgrayvaluecmd);
    }

    /*************************************************************************
     * Name: makeSmallmotorControlcmd
     *
     * Description: Make command to control motor
     *
     * Returned Value :
     *************************************************************************/
    makeSmallmotorControlcmd(ports, porttype, valuetype, values1, values2, values3, values4) {
        this.writeDebug('info', 'makeSmallmotorControlcmd : ports = 0x${ports.toString(16)}  values = ${values1}');
        const cmdheader = this.makeCmdHeaderBuffer([0x0C], [0x13]);
        const param1 = new Buffer([0x00, 0x00, 0x00, 0x00]);
        const param2 = new Buffer([0x00, 0x00, 0x00, 0x00]);
        const param3 = new Buffer([0x00, 0x00, 0x00, 0x00]);
        const param4 = new Buffer([0x00, 0x00, 0x00, 0x00]);
        let data1;

        data1 = 0x80;
        if (porttype) {
            data1 |= 0x40;
		}

        data1 |= valuetype << 2;

        if (ports & 0x01) {
                if (valuetype == 0) {
                    data1 |= 0x02; //0x01;
                    param4[0] = values1;
                } else {
                    data1 |= 0x01; //0x02;
                    param2[0] = values1 >> 8;
                    param2[1] = values1;
                }
                param1[0] = data1;
        }

        if (ports & 0x02) {
                if (valuetype == 0) {
                    data1 |= 0x02; //0x01;
                    param4[1] = values2;
                } else {
                    data1 |= 0x01; //0x02;
                    param2[2] = values2 >> 8;
                    param2[3] = values2;
                }
                param1[1] = data1;
        }

        if (ports & 0x04) {
                if (valuetype == 0) {
                    data1 |= 0x01;
                    param4[2] = values3;
                } else {
                    data1 |= 0x02;
                    param3[0] = values3 >> 8;
                    param3[1] = values3;
                }
                param1[2] = data1;
        }

        if (ports & 0x08) {
                if (valuetype == 0) {
                    data1 |= 0x01;
                    param4[3] = values4;
                } else {
                    data1 |= 0x02;
                    param3[2] = values4 >> 8;
                    param3[3] = values4;
                }
                param1[3] = data1;
        }

        const smallmotorctrlcmd = Buffer.concat([cmdheader, param1, param2, param3, param4]);

        this.writeDebug('debug', 'makeSmallmotorControlcmd : data 1 = ${data1}');
        return this.makeCRCdata(smallmotorctrlcmd);
    }

    /*************************************************************************
     * Name: sendCheckSensorcmd
     *
     * Description: Make command to check port status & values
     *
     * Returned Value :
     *************************************************************************/
    sendCheckSensorcmd() {
        if (!this.isSensorCheck) {
            //this.writeDebug('info', 'sendCheckSensorcmd');
            this.isSensorCheck = true;
            if (this.isLEDenabled == false && this.led.port != -1) {
                //this.writeDebug('debug', 'checkSensorStatus : send LED off cmd => port = ' + this.led.port);
                this.sp.write(this.makePortonoffcmd(this.led.port, 0x01));
                this.SENSOR.LED = 0x00;
                this.isLEDenabled = true;

                return;
            } else {
                const cmddata = new Buffer([0xaa, 0x55, 0x00, 0x08, 0x72, 0xa4, 0x16, 0x00, 0x00, 0x00, 0x00, 0x33]);

                this.writeArrayData('debug', cmddata, 1);
                this.sp.write(cmddata);
            }
        } else {
            const count = 0;
            //this.writeDebug('info', 'sendCheckSensorcmd ==> skip (count = ' + this.skipcount + ')');

            this.skipcount++;

            if (this.skipcount > 2) {
                this.isSensorCheck = false;
                this.skipcount = 0;
            }
        }
    }

    /*************************************************************************
     * Name: getDevicetype
     *
     * Description:
     *
     * Returned Value :
     *************************************************************************/
    getDevicetype(devicetype) {
        switch (devicetype) {
            case 0: return this.deviceTypes.NONE;
            case 1: return this.deviceTypes.BUTTON;
            case 2: return this.deviceTypes.GRAY_INFRARED;
            case 5: return this.deviceTypes.LIGHT;
            case 6: return this.deviceTypes.MICROPHONE;
            case 7: return this.deviceTypes.LED;
            case 8: return this.deviceTypes.LMOTOR;
            case 9: return this.deviceTypes.RMOTOR;
            default:
                this.writeDebug('error', 'Unkown device type : 0x${devicetype.toString(16)}');
                return this.deviceTypes.NONE;
        }
    }

    /*************************************************************************
     * Name: checkSensorStatus
     *
     * Description: Check port status.
     *
     * Returned Value :
     *************************************************************************/
    checkSensorStatus(cmdwd2, params) {
        if (cmdwd2 == 0x2A) {
            let values = 0;
            let infra1 = false;
            let index = 0;

            Object.keys(this.SENSOR_MAP).forEach((port) => {
                values = params.readInt16BE((index) * 2 + 4);

                this.SENSOR_MAP[port].type = this.getDevicetype(params[index]);
                this.SENSOR_MAP[port].port_values = values;
                    
                    switch (params[index]) {
                        case 1: 
                            if ((values == 1) || (values > 0x0F00)) {
                                this.SENSOR_MAP[port].port_values = 1;
                                this.SENSOR.BUTTON = 1;
                            } else {
                                this.SENSOR.BUTTON = 0;
                                this.SENSOR_MAP[port].port_values = 0;
                            }
                            break;
                        case 2:
                            if (infra1 == false) {
                                this.SENSOR.GRAY_INFRARED1 = values;
                                infra1 = true;
                            } else {
                                this.SENSOR.GRAY_INFRARED2 = values;
                            }
                            break;
                        case 5: 
                            this.SENSOR.LIGHT = values;
                            break;
                        case 6: 
                            this.SENSOR.MICROPHONE = values;
                            break;
                        case 7: 
                            this.writeDebug('debug', 'checkSensorStatus : LED_DATA = ${values} port = ${port}');
                            this.SENSOR_MAP[port].port_values = values; //this.SENSOR.LED;
                            break;
                        case 0:
                        default:
                            //this.writeDebug('debug', 'not Connected');
                            break;
                    }
                    
                    if (this.led.port == port) {
                        // check command status
                        if ((this.led.value != this.SENSOR_MAP[port].port_values) && this.led.APPLIED == true) {
                            if ((this.SENSOR_MAP[port].type == this.deviceTypes.LED) ||
							     this.SENSOR_MAP[port].type == 0) {
                                this.sp.write(this.makePortonoffcmd(this.led.port, this.led.value));
                            }
                        }
                    }
                index++;
            });

            this.isSensorCheck = false;
        } else {
            //this.writeDebug('error', 'Unknown command word2 = 0x' + cmdwd2.toString(16));
        }
    }

    /*************************************************************************
     * Name: init
     *
     * Description: Initialize after connect at first
     *
     * handler - Object to communicate with Workspace (refer to datahandler/json)
     * config - object of module.json
     *
     * Returned Value :
     *************************************************************************/
    init(handler, config) {
        //this.writeDebug('info', 'init');
    }

    /*************************************************************************
     * Name: requestInitialData
     *
     * Description: Use when need to send data initially after connecting.
     *              If use this function, checkInitialdata() should be needed.
     *              If don't use this function, can skip this function
     *
     * sp - serial port object
     *
     * Returned Value :
     *************************************************************************/
    requestInitialData(sp) {
        if (!this.sp) {
            this.sp = sp;
        }

        if (!this.isSendInitData) {
            //this.writeDebug('info', 'requestInitialData');
            this.isSendInitData = true;
            const testbuf = new Buffer([0xaa, 0x55, 0x00, 0x08, 0x72, 0xb0, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2a]);
            this.sp.write(testbuf, () => {
                this.sensorChecking();
            });
        }

        return null;
    }

    /*************************************************************************
     * Name: checkInitialData
     *
     * Description: Used when it is necessary to check
     *              whether the connection is normal by receiving
     *              it initially after connecting.
     *
     * Returned Value :
     *************************************************************************/
    checkInitialData(data, config) {
        //this.writeDebug('info', 'checkInitialData');
        return true;
    }

    /*************************************************************************
     * Name: afterConnect
     *
     * Description: cb is object to send event to windows
     *
     * Returned Value :
     *************************************************************************/
    afterConnect(that, cb) {
        //this.writeDebug('info', 'afterConnect');
        that.connected = true;
        this.isConnect = true;
        if (cb) {
            cb('connected');
        }
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
        //this.writeDebug('info', 'validateLocalData');
        return true;
    }
    
    checkAudiofile() {
        if ((this.audiofile.audiodata == 'hello') || 
            (this.audiofile.audiodata == 'bye') ||
            (this.audiofile.audiodata == 'welcome') ||
            (this.audiofile.audiodata == 'cheer')) {
            return true;
		} else {
            return false;
		}
    }
    
    getAudiofile(index) {
        switch (index) {
            case 1: return 'hello';
            case 2: return 'bye';
            case 3: return 'welcome';
            case 4: return 'cheer';
        }
        
        return 'none';
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
    requestLocalData() {
        this.writeDebug('info', 'requestLocalData');

        let skipPortOutput = false;
        let foundLED = false;

        if (this.previous_wheel_status) {
            if ((this.previous_wheel_status.LMOTOR == this.motoring.LMOTOR) &&
                (this.previous_wheel_status.RMOTOR == this.motoring.RMOTOR)) {
                skipPortOutput = true;
			}
        }

        if (!skipPortOutput) {
            this.previous_wheel_status = _.cloneDeep(this.motoring);
            this.writeDebug('debug',
			    'requestLocalData : LMOTOR = ${this.motoring.LMOTOR} RMOTOR = ${this.motoring.RMOTOR}');

            return this.makeSmallmotorControlcmd(0x03, 0x00, 0x00, this.motoring.LMOTOR, this.motoring.RMOTOR, 0, 0);
        }

        if (this.led.port != 0 && this.led.port != -1) {
            Object.keys(this.SENSOR_MAP).forEach((port) => {
                if (this.SENSOR_MAP[port].type == this.deviceTypes.LED) {
                    foundLED = true;
                    if (this.led.port == port) {
                        if (this.led.APPLIED != true || 
						   (this.SENSOR_MAP[port].port_values == 1 && this.led.value == 0)) {
                            this.writeDebug('debug', 'requestLocalData ===> port = ${port}');
                            this.led.port = port;
                            this.led.APPLIED = true;
                            return this.makePortonoffcmd(this.led.port, this.led.value);
                        }
                    } else {
                        this.writeDebug('debug', 'Port is different. So not applied ${port} / ${this.led.port}');
                    }
                }
            });
            
            if (foundLED == false) {
                if (this.led.APPLIED == false) {
                    this.writeDebug('debug', 'requestLocalData ===> this.led.port = ${this.led.port}');
                    this.led.APPLIED = true;
                    return this.makePortonoffcmd(this.led.port, this.led.value);
                }
            }
        } else {
            if (this.led.port == -1) {
                Object.keys(this.SENSOR_MAP).forEach((port) => {
                    if (this.SENSOR_MAP[port].type == this.deviceTypes.LED) {
                        this.led.port = 0;
                        return this.makePortonoffcmd(port, 1);
                    }
                });
            }
        }
        
        if (this.audiofile.APPLIED == false && this.checkAudiofile() == true) {
            this.writeDebug('debug', 'requestLocalData : Sound = ${this.audiofile.audiodata}');
            const sndtype = new Buffer(this.audiofile.audiodata);
            const sndcmd = this.sendSound(sndtype);
            this.audiofile.APPLIED = true;

            return sndcmd;
        }

        return null;
    }

    /*************************************************************************
     * Name: handleLocalData
     *
     * Description: Handle data from H/W device
     *
     * Returned Value :
     *************************************************************************/
    handleLocalData(data) {
        //this.writeDebug('info', 'handleLocalData');
        let receiveddata = data.slice();

        if (receiveddata[0] == 0xAA && receiveddata[1] == 0x55) {
            const length = receiveddata.readInt16LE(2);
            const type = receiveddata[4];
            const cmdwd1 = receiveddata[5];
            const cmdwd2 = receiveddata[6];

            this.writeArrayData('debug', receiveddata, 0);

            if (length > 0 && type == 0x72) {
                if (cmdwd1 == 0xA1) {
                    this.isSensing = false;
                    receiveddata = receiveddata.slice(11);
                    const requestID = receiveddata[3];
                    const returnedDatafromHW = receiveddata.readInt32LE(4);
                } else if (cmdwd1 == 0xB0) {
                    receiveddata = receiveddata.slice(11);
                    const canConnection = receiveddata[0];
                    const fwversion = receiveddata.readInt32LE(1);
                } else if (cmdwd1 == 0xF1) {
                    receiveddata = receiveddata.slice(11);
                    this.checkSensorStatus(cmdwd2, receiveddata);
                } else {
                    this.writeDebug('error', 'unknown data from H/W : 0x${cmdwd1.toString(16)}');
                }
            }
        } else {
			//this.writeDebug('error', 'unknown data from H/W');
            //this.writeArrayData('debug', receiveddata);
        }
    }

    /*************************************************************************
     * Name: requestRemoteData
     *
     * Description: Send data to Entry
     *
     * Returned Value :
     *************************************************************************/
    requestRemoteData(handler) {
        this.writeDebug('info', 'requestRemoteData');

        Object.keys(this.SENSOR_MAP).forEach((key) => {
            if (this.SENSOR_MAP[key] !== undefined) {
                handler.write(key, this.SENSOR_MAP[key]);
            }
        });

        return null;
    }

    /*************************************************************************
     * Name: handleRemoteData
     *
     * Description: Handle received data from Entry
     *
     * Returned Value :
     *************************************************************************/
    handleRemoteData(handler) {
        //this.writeDebug('info', 'handleRemoteData ==>');
        let temp;

        // read motor control
        temp = handler.read('LMOTOR');
        if (temp < -50) {
			temp = -50;
		} else if (temp > 50) {
			temp = 50;
		}

        this.motoring.LMOTOR = temp;

        // right wheel
        temp = handler.read('RMOTOR');
        if (temp < -50) {
			temp = -50;
		} else if (temp > 50) {
			temp = 50;
		}

        this.motoring.RMOTOR = temp;

        // Read LED control
        Object.keys(this.PORT_INFO).forEach((port) => {
            this.PORT_INFO[port] = handler.read(port);
            //this.writeDebug('debug', 'handleRemoteData : port Device type  = ' + this.PORT_INFO[port].type);
            if (this.PORT_INFO[port].type == this.deviceTypes.LED) {
                if (this.led.APPLIED == true && 
				   (this.led.port != port || this.led.value != this.PORT_INFO[port].port_values)) {
                    this.writeDebug('debug', 
					  'handleRemoteData : Port = ${port} Received LED values = ${this.PORT_INFO[port].port_values}');
                    this.led.port = port;
                    this.led.value = this.PORT_INFO[port].port_values;
                    this.led.APPLIED = false;
                }
            }
        });
        
        // read internal audio

        if (handler.e('INTERSND')) {
            temp = handler.read('INTERSND');
            if (temp != 'none' && this.audiofile.APPLIED == true  && this.audiofile.audiodata != temp) {
                this.audiofile.audiodata = temp;
                this.audiofile.APPLIED = false;
            } else {
                this.audiofile.audiodata = temp;
			}
        }
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

        this.audiofile.audiodata = 'none';
        this.audiofile.APPLIED = true;
        
        this.isSendStartSnd = true;
        //    this.sp.write(sndbuf);
    }

    /*************************************************************************
     * Name: disconnect
     *
     * Description:
     *
     * Returned Value :
     *************************************************************************/
    disconnect(connect) {
        const self = this;

        this.writeDebug('info', 'disconnect');
        if (this.isConnect == true) {
            //var snd_type = new Buffer('bye');
            //var endsndbuf = this.sendSound(snd_type);

            clearInterval(this.sensing);

            //self.sp.write(endsndbuf,
            //            (err) => {
                                /* nothing to do. disconnect command execute */
            //                this.isSendStartSnd = false;
            //                connect.close();
            //            }
            //);

            connect.close();
            if (this.sp) {
                delete self.sp;
            }
            self.sp = null;
            this.isConnect = false;
            this.isSendInitData = false;
            //this.isSendStartSnd = false;
            this.isSensorCheck = false;
        } else {
            this.writeDebug('warning', 'device is not connected');
        }
    }

    /*************************************************************************
     * Name: reset
     *
     * Description:
     *
     * Returned Value :
     *************************************************************************/
    reset() {
        //this.writeDebug('info', 'reset');
    }
}

module.exports = new Abilix_Krypton0();
