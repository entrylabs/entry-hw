function Module() {
    this.tx_d = new Array(28);
    this.rx_d56 = new Array(56);
    this.sensory = {
        D2: 0,
        D3: 0,
        D11: 0,
        light: 0,
        mic: 0,
        adc0: 0,
        adc1: 0,
        adc2: 0,
        adc3: 0
    };

    this.sensordata = {
        cds: 0,
        ir1: 0,
        ir2: 0,
        ir3: 0,
        ir4: 0,
        ir5: 0,
        ir6: 0,
        tor1: 0,
        tor2: 0,
        tem: 0,
        accx: 0,
        accy: 0,
        accz: 0,
        magx: 0,
        magy: 0,
        magz: 0,
        gyrox: 0,
        gyroy: 0,
        gyroz: 0,
        stvar: 0,
        sttor: 0,
        bat: 0,
        remote: 0
    };

    this.motoring = {
        rightWheel: 0,
        leftWheel: 0,
        head: 90,
        armR: 90,
        armL: 90,
        analogD5: 127,
        analogD6: 127,
        D4: 0,
        D7: 0,
        D12: 0,
        D13: 0,
        ledR: 0,
        ledG: 0,
        ledB: 0,
        lcdNum: 0,
        lcdTxt: '                ',
        note: 262,
        duration: 0
    };

    this.motordata = {
        rightmode: 0,
        rightmotor: 0,
        leftmode: 0,
        leftmotor: 0,
        steering: 0,
        led: 0,
        buzzer: 0,
        ascii: 0,
        dot1: 0,
        dot2: 0,
        dot3: 0,
        dot4: 0,
        dot5: 0,
        dot6: 0,
        dot7: 0,
        dot8: 0      
    };

    this.flagCmdSend = {
        wheelCmd: false,
        servoCmd: false,
        analogCmd: false,
        digitalCmd: false,
        rgbCmd: false,
        lcdCmd: false,
        toneCmd: false
    };

    this.rxHeader = [0x52, 0x58, 0x3D];

    this.sendBuffer = [];
    this.tmpBuffer = new Array(9);

    this.lcdState = 0;
}

var ALTINO = {
    RIGHT_WHEEL: 'rightWheel',
    LEFT_WHEEL: 'leftWheel',
    HEAD: 'head',
    ARMR: 'armR',
    ARML: 'armL',
    ANALOG_D5: 'analogD5',
    ANALOG_D6: 'analogD6',
    D4: 'D4',
    D7: 'D7',
    D12: 'D12',
    D13: 'D13',
    LED_R: 'ledR',
    LED_G: 'ledG',
    LED_B: 'ledB',
    LCD_NUM: 'lcdNum',
    LCD_TXT: 'lcdTxt',
    NOTE: 'note',
    DURATION: 'duration'
};

Module.prototype.init = function (handler, config) {
    //console.log(this.motoring.lcdTxt);
};

Module.prototype.lostController = function () { }

Module.prototype.requestInitialData = function () {
    return [255, 255];
};

Module.prototype.checkInitialData = function (data, config) {
    return true;
};

Module.prototype.ByteIndexOf = function (searched, find, start, end) {
    var matched = false;

    for (var index = start; index <= end - find.length; ++index) {
        // Assume the values matched.
        matched = true;

        // Search in the values to be found.
        for (var subIndex = 0; subIndex < find.length; ++subIndex) {
            // Check the value in the searched array vs the value
            // in the find array.
            if (find[subIndex] != searched[index + subIndex]) {
                // The values did not match.
                matched = false;
                break;
            }
        }

        // If the values matched, return the index.
        if (matched) {
            // Return the index.
            return index;
        }
    }

    // None of the values matched, return -1.
    return -1;
};

// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function (data) { // data: Native Buffer
    if (data.length != 56) return;
    var buf = this.rx_d56;
    var rx_check_sum = 0;
    var sensordata = this.sensordata;

    for (var i = 0; i < 56; i++) {
        var str = data.slice(i, i + 1);
        buf[i] = parseInt(str, 16);
    }

    if (buf[0] === 2 && buf[55] === 3 && buf[1] === 56) {
        rx_check_sum = buf[0];
        rx_check_sum = rx_check_sum + buf[1];
        rx_check_sum = rx_check_sum + buf[3];
        rx_check_sum = rx_check_sum + buf[4];
        rx_check_sum = rx_check_sum + buf[5];
        rx_check_sum = rx_check_sum + buf[6];
        rx_check_sum = rx_check_sum + buf[7];
        rx_check_sum = rx_check_sum + buf[8];
        rx_check_sum = rx_check_sum + buf[9];
        rx_check_sum = rx_check_sum + buf[10];
        rx_check_sum = rx_check_sum + buf[11];
        rx_check_sum = rx_check_sum + buf[12];
        rx_check_sum = rx_check_sum + buf[13];
        rx_check_sum = rx_check_sum + buf[14];
        rx_check_sum = rx_check_sum + buf[15];
        rx_check_sum = rx_check_sum + buf[16];
        rx_check_sum = rx_check_sum + buf[17];
        rx_check_sum = rx_check_sum + buf[18];
        rx_check_sum = rx_check_sum + buf[19];
        rx_check_sum = rx_check_sum + buf[20];
        rx_check_sum = rx_check_sum + buf[21];
        rx_check_sum = rx_check_sum + buf[22];
        rx_check_sum = rx_check_sum + buf[23];
        rx_check_sum = rx_check_sum + buf[24];
        rx_check_sum = rx_check_sum + buf[25];
        rx_check_sum = rx_check_sum + buf[26];
        rx_check_sum = rx_check_sum + buf[27];
        rx_check_sum = rx_check_sum + buf[28];
        rx_check_sum = rx_check_sum + buf[29];
        rx_check_sum = rx_check_sum + buf[30];
        rx_check_sum = rx_check_sum + buf[31];
        rx_check_sum = rx_check_sum + buf[32];
        rx_check_sum = rx_check_sum + buf[33];
        rx_check_sum = rx_check_sum + buf[34];
        rx_check_sum = rx_check_sum + buf[35];
        rx_check_sum = rx_check_sum + buf[36];
        rx_check_sum = rx_check_sum + buf[37];
        rx_check_sum = rx_check_sum + buf[38];
        rx_check_sum = rx_check_sum + buf[39];
        rx_check_sum = rx_check_sum + buf[40];
        rx_check_sum = rx_check_sum + buf[41];
        rx_check_sum = rx_check_sum + buf[42];
        rx_check_sum = rx_check_sum + buf[43];
        rx_check_sum = rx_check_sum + buf[44];
        rx_check_sum = rx_check_sum + buf[45];
        rx_check_sum = rx_check_sum + buf[46];
        rx_check_sum = rx_check_sum + buf[47];
        rx_check_sum = rx_check_sum + buf[48];
        rx_check_sum = rx_check_sum + buf[49];
        rx_check_sum = rx_check_sum + buf[50];
        rx_check_sum = rx_check_sum + buf[51];
        rx_check_sum = rx_check_sum + buf[52];
        rx_check_sum = rx_check_sum + buf[53];
        rx_check_sum = rx_check_sum + buf[54];
        rx_check_sum = rx_check_sum + buf[55];

        rx_check_sum = rx_check_sum % 256;

    }

    if (rx_check_sum == buf[2]) {
           
        sensordata.ir1 = buf[7] * 256 + buf[8];//ir1
        sensordata.ir2 = buf[9] * 256 + buf[10];//ir2
        sensordata.ir3 = buf[11] * 256 + buf[12];//ir3
        sensordata.ir4 = buf[13] * 256 + buf[14];//ir4
        sensordata.ir5 = buf[15] * 256 + buf[16];//ir5
        sensordata.ir6 = buf[17] * 256 + buf[18];//ir6

        sensordata.tor1 = buf[19] * 256 + buf[20];//right torque
        sensordata.tor2 = buf[21] * 256 + buf[22];//left torque

        sensordata.tem = buf[49] * 256 + buf[50];//temperature

        sensordata.cds = buf[43] * 256 + buf[44];//cds

        sensordata.accx = buf[25] * 256 + buf[26];//acc x
        sensordata.accy = buf[27] * 256 + buf[28];//acc y
        sensordata.accz = buf[29] * 256 + buf[30];//acc z

        sensordata.magx = buf[31] * 256 + buf[32];//mag x
        sensordata.magy = buf[33] * 256 + buf[34];//mag y
        sensordata.magz = buf[35] * 256 + buf[36];//mag z

        sensordata.stvar = buf[45] * 256 + buf[46];//steering var

        sensordata.sttor = buf[23] * 256 + buf[24];//steering torque

        sensordata.bat = buf[47] * 256 + buf[48];//battery

        sensordata.remote = buf[51];//remote control

        sensordata.gyrox = buf[37] * 256 + buf[38];//gyro sensor x
        sensordata.gyroy = buf[39] * 256 + buf[40];//gyro sensor y
        sensordata.gyroz = buf[41] * 256 + buf[42];//gyro sensor z
    }

};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function (handler) {
    var sensordata = this.sensordata;
    for (var key in sensordata) {
        handler.write(key, sensordata[key]);
    }
};

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function (handler) {
    var motoring = this.motoring;
    var flagCmdSend = this.flagCmdSend;
    var newValue;

    if (handler.e(ALTINO.RIGHT_WHEEL)) {
        newValue = handler.read(ALTINO.RIGHT_WHEEL);
        if (newValue < -255) newValue = -255;
        else if (newValue > 255) newValue = 255;
        if (motoring.rightWheel != newValue) {
            motoring.rightWheel = newValue;
            flagCmdSend.wheelCmd = true;
        }
    }

    if (handler.e(ALTINO.LEFT_WHEEL)) {
        newValue = handler.read(ALTINO.LEFT_WHEEL);
        if (newValue < -255) newValue = -255;
        else if (newValue > 255) newValue = 255;
        if (motoring.leftWheel != newValue) {
            motoring.leftWheel = newValue;
            flagCmdSend.wheelCmd = true;
        }
    }

    if (handler.e(ALTINO.HEAD)) {
        newValue = handler.read(ALTINO.HEAD);
        if (newValue < 10) newValue = 10;
        else if (newValue > 170) newValue = 170;
        if (motoring.head != newValue) {
            motoring.head = newValue;
            flagCmdSend.servoCmd = true;
        }
    }

    if (handler.e(ALTINO.ARMR)) {
        newValue = handler.read(ALTINO.ARMR);
        if (newValue < 10) newValue = 10;
        else if (newValue > 170) newValue = 170;
        if (motoring.armR != newValue) {
            motoring.armR = newValue;
            flagCmdSend.servoCmd = true;
        }
    }

    if (handler.e(ALTINO.ARML)) {
        newValue = handler.read(ALTINO.ARML);
        if (newValue < 10) newValue = 10;
        else if (newValue > 170) newValue = 170;
        if (motoring.armL != newValue) {
            motoring.armL = newValue;
            flagCmdSend.servoCmd = true;
        }
    }

    if (handler.e(ALTINO.ANALOG_D5)) {
        newValue = handler.read(ALTINO.ANALOG_D5);
        if (newValue < 0) newValue = 0;
        else if (newValue > 255) newValue = 255;
        if (motoring.analogD5 != newValue) {
            motoring.analogD5 = newValue;
            flagCmdSend.analogCmd = true;
        }
    }

    if (handler.e(ALTINO.ANALOG_D6)) {
        newValue = handler.read(ALTINO.ANALOG_D6);
        if (newValue < 0) newValue = 0;
        else if (newValue > 255) newValue = 255;
        if (motoring.analogD6 != newValue) {
            motoring.analogD6 = newValue;
            flagCmdSend.analogCmd = true;
        }
    }

    if (handler.e(ALTINO.D4)) {
        newValue = handler.read(ALTINO.D4);
        if (newValue < 0) newValue = 0;
        else if (newValue > 1) newValue = 1;
        if (motoring.D4 != newValue) {
            motoring.D4 = newValue;
            flagCmdSend.digitalCmd = true;
        }
    }

    if (handler.e(ALTINO.D7)) {
        newValue = handler.read(ALTINO.D7);
        if (newValue < 0) newValue = 0;
        else if (newValue > 1) newValue = 1;
        if (motoring.D7 != newValue) {
            motoring.D7 = newValue;
            flagCmdSend.digitalCmd = true;
        }
    }

    if (handler.e(ALTINO.D12)) {
        newValue = handler.read(ALTINO.D12);
        if (newValue < 0) newValue = 0;
        else if (newValue > 1) newValue = 1;
        if (motoring.D12 != newValue) {
            motoring.D12 = newValue;
            flagCmdSend.digitalCmd = true;
        }
    }

    if (handler.e(ALTINO.D13)) {
        newValue = handler.read(ALTINO.D13);
        if (newValue < 0) newValue = 0;
        else if (newValue > 1) newValue = 1;
        if (motoring.D13 != newValue) {
            motoring.D13 = newValue;
            flagCmdSend.digitalCmd = true;
        }
    }


    if (handler.e(ALTINO.LED_R)) {
        newValue = handler.read(ALTINO.LED_R);
        if (newValue < 0) newValue = 0;
        else if (newValue > 255) newValue = 255;
        if (motoring.ledR != newValue) {
            motoring.ledR = newValue;
            flagCmdSend.rgbCmd = true;
        }
    }

    if (handler.e(ALTINO.LED_G)) {
        newValue = handler.read(ALTINO.LED_G);
        if (newValue < 0) newValue = 0;
        else if (newValue > 255) newValue = 255;
        if (motoring.ledG != newValue) {
            motoring.ledG = newValue;
            flagCmdSend.rgbCmd = true;
        }
    }

    if (handler.e(ALTINO.LED_B)) {
        newValue = handler.read(ALTINO.LED_B);
        if (newValue < 0) newValue = 0;
        else if (newValue > 255) newValue = 255;
        if (motoring.ledB != newValue) {
            motoring.ledB = newValue;
            flagCmdSend.rgbCmd = true;
        }
    }

    if (handler.e(ALTINO.LCD_NUM)) {
        newValue = handler.read(ALTINO.LCD_NUM);
        if (newValue < 0) newValue = 0;
        else if (newValue > 1) newValue = 1;
        if (motoring.lcdNum != newValue) {
            motoring.lcdNum = newValue;
            flagCmdSend.lcdCmd = true;
            this.lcdState = 0;
        }
    }

    if (handler.e(ALTINO.LCD_TXT)) {
        newValue = handler.read(ALTINO.LCD_TXT) + '                ';
        if (motoring.lcdTxt != newValue) {
            motoring.lcdTxt = newValue;
            flagCmdSend.lcdCmd = true;
            this.lcdState = 0;
        }
    }

    if (handler.e(ALTINO.NOTE)) {
        newValue = handler.read(ALTINO.NOTE);
        if (newValue < 65) newValue = 65;
        else if (newValue > 4186) newValue = 4186;
        if (motoring.note != newValue) {
            motoring.note = newValue;
            flagCmdSend.toneCmd = true;
        }
    }

    if (handler.e(ALTINO.DURATION)) {
        newValue = handler.read(ALTINO.DURATION);
        if (newValue < 0) newValue = 0;
        else if (newValue > 250) newValue = 250;
        if (motoring.duration != newValue) {
            motoring.duration = newValue;
            flagCmdSend.toneCmd = true;
        }
    }

    //console.log('handleRemoteData');
};


// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function () {
    var MOTOR_SPEED = 0;
    var SERVO_ANGLE = 3;
    var ANALOG_WRITE = 4;
    var DIGITAL_WRITE = 5;
    var RGB_WRITE = 6;
    var LCD_WRITE = 7;
    var TONE_PLAY = 8;

    var motoring = this.motoring;
    var flagCmdSend = this.flagCmdSend;
    var buffer = this.tmpBuffer;

    var tx_d = this.tx_d;
    var u16_tx_check_sum = 0;
    var u16_tx_cnt;
    var u16_cnt=27;
    var gridNum = 0;

    this.sendBuffer.length = 0;

    if (flagCmdSend.wheelCmd) {
        this.ALTINOcmdBuild(MOTOR_SPEED, motoring.rightWheel >> 8, motoring.rightWheel, motoring.leftWheel >> 8, motoring.leftWheel, 0);
        for (var i = 0; i < buffer.length; i++) {
            this.sendBuffer.push(buffer[i]);
        }
        flagCmdSend.wheelCmd = false;
    }

    if (flagCmdSend.servoCmd) {
        this.ALTINOcmdBuild(SERVO_ANGLE, motoring.head, motoring.armR, motoring.armL, 0, 0);
        for (var i = 0; i < buffer.length; i++) {
            this.sendBuffer.push(buffer[i]);
        }
        flagCmdSend.servoCmd = false;
    }

    if (flagCmdSend.analogCmd) {
        this.ALTINOcmdBuild(ANALOG_WRITE, motoring.analogD5, motoring.analogD6, 0, 0, 0);
        for (var i = 0; i < buffer.length; i++) {
            this.sendBuffer.push(buffer[i]);
        }
        flagCmdSend.analogCmd = false;
    }

    if (flagCmdSend.digitalCmd) {
        this.ALTINOcmdBuild(DIGITAL_WRITE, motoring.D4, motoring.D7, motoring.D12, motoring.D13, 0);
        for (var i = 0; i < buffer.length; i++) {
            this.sendBuffer.push(buffer[i]);
        }
        flagCmdSend.digitalCmd = false;
    }

    if (flagCmdSend.rgbCmd) {
        this.ALTINOcmdBuild(RGB_WRITE, 255, motoring.ledR, motoring.ledG, motoring.ledB, 0);
        for (var i = 0; i < buffer.length; i++) {
            this.sendBuffer.push(buffer[i]);
        }
        flagCmdSend.rgbCmd = false;
    }

    if (flagCmdSend.toneCmd) {
        var note = motoring.note;
        var duration = motoring.duration;

        //console.log('toneCmd ' + note + ' ' + duration);
        this.ALTINOcmdBuild(TONE_PLAY, note >> 8, note, duration, 0, 0);

        for (var i = 0; i < buffer.length; i++) {
            this.sendBuffer.push(buffer[i]);
        }
        flagCmdSend.toneCmd = false;
    }

    if (flagCmdSend.lcdCmd) {
        //console.log('lcdCmd ' + motoring.lcdTxt);			
        gridNum = motoring.lcdNum * 4 + this.lcdState;

        if (this.lcdState == 0) {
            this.ALTINOcmdBuild(LCD_WRITE, gridNum, motoring.lcdTxt[0].charCodeAt(0), motoring.lcdTxt[1].charCodeAt(0), motoring.lcdTxt[2].charCodeAt(0), motoring.lcdTxt[3].charCodeAt(0));
            this.lcdState++;
        }
        else if (this.lcdState == 1) {
            this.ALTINOcmdBuild(LCD_WRITE, gridNum, motoring.lcdTxt[4].charCodeAt(0), motoring.lcdTxt[5].charCodeAt(0), motoring.lcdTxt[6].charCodeAt(0), motoring.lcdTxt[7].charCodeAt(0));
            this.lcdState++;
        }
        else if (this.lcdState == 2) {
            this.ALTINOcmdBuild(LCD_WRITE, gridNum, motoring.lcdTxt[8].charCodeAt(0), motoring.lcdTxt[9].charCodeAt(0), motoring.lcdTxt[10].charCodeAt(0), motoring.lcdTxt[11].charCodeAt(0));
            this.lcdState++;
        }
        else if (this.lcdState == 3) {
            this.ALTINOcmdBuild(LCD_WRITE, gridNum, motoring.lcdTxt[12].charCodeAt(0), motoring.lcdTxt[13].charCodeAt(0), motoring.lcdTxt[14].charCodeAt(0), motoring.lcdTxt[15].charCodeAt(0));
            this.lcdState++;
        }

        for (var i = 0; i < buffer.length; i++) {
            this.sendBuffer.push(buffer[i]);
        }
        flagCmdSend.lcdCmd = false;

        if (this.lcdState <= 3) {
            var timerId = setTimeout(function () {
                flagCmdSend.lcdCmd = true;
                //clearTimeout(timerId);
                //console.log('setTimeout');				
            }, 30);
        }

    }

    //return this.tmpBuffer;
    //console.log('requestLocalData');

    tx_d[0] = 0x2;
    tx_d[1] = 28;

    tx_d[3] = 1;
    tx_d[4] = 10;
    tx_d[5] = Sendbuf[5];
    tx_d[6] = Sendbuf[6];
    tx_d[7] = Sendbuf[7];
    tx_d[8] = Sendbuf[8];
    tx_d[9] = Sendbuf[9];
    tx_d[10] = Sendbuf[10];
    tx_d[11] = Sendbuf[11];
    tx_d[12] = Sendbuf[12];
    tx_d[13] = Sendbuf[13];
    tx_d[14] = Sendbuf[14];
    tx_d[15] = Sendbuf[15];
    tx_d[16] = Sendbuf[16];
    tx_d[17] = Sendbuf[17];
    tx_d[18] = Sendbuf[18];
    tx_d[19] = Sendbuf[19];
    tx_d[20] = Sendbuf[20];
    if (Sendbuf[4] == 1 || Sendbuf[4] == 10) {
        Sendbuf[21] = Sendbuf[21] | 0x01;
    }
    else {
        Sendbuf[21] = Sendbuf[21];
    }
    tx_d[21] = Sendbuf[21];
    tx_d[22] = Sendbuf[22];
    tx_d[23] = Sendbuf[23];
    tx_d[24] = Sendbuf[24];
    tx_d[25] = Sendbuf[25];
    tx_d[26] = 0;
    tx_d[27] = 0x3;


    u16_tx_check_sum = u16_tx_check_sum + tx_d[1];
    for (u16_tx_cnt = 3; u16_tx_cnt <= u16_cnt; u16_tx_cnt++) {
        u16_tx_check_sum = u16_tx_check_sum + tx_d[u16_tx_cnt];
    }
    u16_tx_check_sum = u16_tx_check_sum % 256;



    tx_d[2] = u16_tx_check_sum;


    if (this.tx_d.length != 0) {
        
        return this.tx_d;
    }
};

Module.prototype.ALTINOcmdBuild = function (u16_cnt) {


};

Module.prototype.ALTINOcmdBuild = function (cmd, d0, d1, d2, d3, d4) {
    this.tmpBuffer[0] = 0x58; // header1
    this.tmpBuffer[1] = 0x52; // header2
    this.tmpBuffer[2] = cmd & 0xff;
    this.tmpBuffer[3] = d0 & 0xff;
    this.tmpBuffer[4] = d1 & 0xff;
    this.tmpBuffer[5] = d2 & 0xff;
    this.tmpBuffer[6] = d3 & 0xff;
    this.tmpBuffer[7] = d4 & 0xff;
    this.tmpBuffer[8] = 0x53; // tail
};

Module.prototype.makeWord = function (hi, lo) {
    return (((hi & 0xff) << 8) | (lo & 0xff));
};

Module.prototype.getLowByte = function (a) {
    return (a & 0xff);
};

Module.prototype.getHighByte = function (a) {
    return ((a >> 8) & 0xff);
};

Module.prototype.reset = function () {
};

module.exports = new Module();