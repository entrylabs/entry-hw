function Module() {
    this.tx_d = new Array(28);
    this.rx_d56 = new Array(56);
    this.rx_setting = new Array(31);
    this.rx_dtest = new Array(512);

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


    this.motordata = {
        rightmode: 0,
        rightmotor: 0,
        leftmode: 0,
        leftmotor: 0,
        steering: 0,
        led: 0,
        led2: 0,
        note: 0,
        ascii: 0,
        dot1: 0,
        dot2: 0,
        dot3: 0,
        dot4: 0,
        dot5: 0,
        dot6: 0,
        dot7: 0,
        dot8: 0,
        command: 10,
        trim: 0,
        pgain: 0,
        igain: 0,
        dgain: 0,
        version: 0,
        cnt: 0
    };

    for (var i = 0; i < 56; ++i) {
        this.rx_d56[i] = 0;
        this.rx_dtest[i] = 0;
    }

}

var ALTINO = {
    RIGHT_WHEEL: 'rightWheel',
    LEFT_WHEEL: 'leftWheel',
    STEERING: 'steering',
    ASCII: 'ascii',
    LED: 'led',
    LED2: 'led2',
    NOTE: 'note',
    DOT1: 'dot1',
    DOT2: 'dot2',
    DOT3: 'dot3',
    DOT4: 'dot4',
    DOT5: 'dot5',
    DOT6: 'dot6',
    DOT7: 'dot7',
    DOT8: 'dot8',
    COMMAND: 'command',
    TRIM: 'trim',
    PGAIN: 'pgain',
    IGAIN: 'igain',
    DGAIN: 'dgain',
    VERSION: 'version',
    SETTING: 'setting',
    CNT: 'cnt'
};

Module.prototype.init = function(handler, config) {
    //console.log(this.motoring.lcdTxt);
};

Module.prototype.lostController = function() {}

Module.prototype.eventController = function(state) {
    if (state === 'connected') {
        clearInterval(this.sensing);
    }
}

Module.prototype.setSerialPort = function(sp) {
    this.sp = sp;
};


Module.prototype.requestInitialData = function(sp) {
    var tx_d = this.tx_d;
    tx_d[0] = 0x2;
    tx_d[1] = 0x1c;

    tx_d[3] = 1;
    tx_d[4] = 10;
    tx_d[5] = 2;
    tx_d[6] = 0;
    tx_d[7] = 0;
    tx_d[8] = 0;
    tx_d[9] = 0;
    tx_d[10] = 0;
    tx_d[11] = 0;
    tx_d[12] = 0;
    tx_d[13] = 0;
    tx_d[14] = 0;
    tx_d[15] = 0;
    tx_d[16] = 0;
    tx_d[17] = 0;
    tx_d[18] = 0;
    tx_d[19] = 0;
    tx_d[20] = 0;
    tx_d[21] = 1;
    tx_d[22] = 0;
    tx_d[23] = 0;
    tx_d[24] = 0;
    tx_d[25] = 0;
    tx_d[26] = 0;
    tx_d[27] = 0x3;

    tx_d[2] = 0x2d;

    return tx_d;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};


// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data) { // data: Native Buffer

    var buf = this.rx_d56;
    var settingBuf = this.rx_setting;
    var rx_check_sum = 0;
    var sensordata = this.sensordata;
    var buftest = this.rx_dtest;
    var motordata = this.motordata;

    for (var i = 0; i < data.length; i++) {
        var str = data[i];

        if(motordata.command == 252) {
            settingBuf[i] = parseInt(str, 10);
        }
        else {
            buf[i] = parseInt(str, 10);
        }
    }

    if (buf[0] === 2 && buf[55] === 3 && buf[1] === 56) {
        for(var i = 0; i < 56; i++) {
            if(i != 2) rx_check_sum += buf[i];
        }

        rx_check_sum = rx_check_sum % 256;

        if(rx_check_sum == buf[2]) {

            sensordata.ir1 = buf[7] * 256 + buf[8]; //ir1
            sensordata.ir2 = buf[9] * 256 + buf[10]; //ir2
            sensordata.ir3 = buf[11] * 256 + buf[12]; //ir3
            sensordata.ir4 = buf[13] * 256 + buf[14]; //ir4
            sensordata.ir5 = buf[15] * 256 + buf[16]; //ir5
            sensordata.ir6 = buf[17] * 256 + buf[18]; //ir6

            sensordata.tor1 = buf[19] * 256 + buf[20]; //right torque
            sensordata.tor2 = buf[21] * 256 + buf[22]; //left torque

            sensordata.tem = buf[49] * 256 + buf[50]; //temperature

            sensordata.cds = buf[43] * 256 + buf[44]; //cds

            sensordata.accx = buf[25] * 256 + buf[26]; //acc x
            sensordata.accy = buf[27] * 256 + buf[28]; //acc y
            sensordata.accz = buf[29] * 256 + buf[30]; //acc z

            sensordata.magx = buf[31] * 256 + buf[32]; //mag x
            sensordata.magy = buf[33] * 256 + buf[34]; //mag y
            sensordata.magz = buf[35] * 256 + buf[36]; //mag z

            sensordata.stvar = buf[45] * 256 + buf[46]; //steering var

            sensordata.sttor = buf[23] * 256 + buf[24]; //steering torque

            sensordata.bat = buf[47] * 256 + buf[48]; //battery

            sensordata.remote = buf[51]; //remote control

            sensordata.gyrox = buf[37] * 256 + buf[38]; //gyro sensor x
            sensordata.gyroy = buf[39] * 256 + buf[40]; //gyro sensor y
            sensordata.gyroz = buf[41] * 256 + buf[42]; //gyro sensor z     
            
            motordata.cnt = 0;
        }
        buf.length = 0;

    }
    
    if (settingBuf[0] === 2 && settingBuf[1] === 31) {

        motordata.trim = settingBuf[5];
        motordata.pgain = settingBuf[6];
        motordata.igain = settingBuf[7];
        motordata.dgain = settingBuf[8];
        motordata.version = settingBuf[26];

        if(motordata.command == 252) {
            if(motordata.cnt == 0) {
                this.tx_d.length = 0;
                motordata.cnt += 1;
            }
            else if(motordata.cnt == 1) {
                this.tx_d.length = 0;
                motordata.cnt += 1;
            }
        }
        settingBuf.length = 0;
    }
};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
    var sensordata = this.sensordata;
    for (var key in sensordata) {
        handler.write(key, sensordata[key]);
    }
};

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function(handler) {
    var motordata = this.motordata;
    var newValue;

    if(handler.e(ALTINO.COMMAND)) {

        newValue = handler.read(ALTINO.COMMAND);

        if (motordata.command != newValue) {
            motordata.command = newValue;
        }
    }

    if (handler.e(ALTINO.RIGHT_WHEEL)) {
        
        newValue = handler.read(ALTINO.RIGHT_WHEEL);
        if (newValue < -1000) newValue = -1000;
        else if (newValue > 1000) newValue = 1000;

        if (newValue < 0) {
            newValue = 32768 - newValue;
        }

        if (motordata.rightmotor != newValue) {
            motordata.rightmotor = newValue;
        }
        

    }

    if (handler.e(ALTINO.LEFT_WHEEL)) {
        
        newValue = handler.read(ALTINO.LEFT_WHEEL);
        if (newValue < -1000) newValue = -1000;
        else if (newValue > 1000) newValue = 1000;

        if (newValue < 0) {
            newValue = 32768 - newValue;
        }
        if (motordata.leftmotor != newValue) {
            motordata.leftmotor = newValue;
        }
        
    }

    if (handler.e(ALTINO.STEERING)) {
        newValue = handler.read(ALTINO.STEERING);
        if (motordata.steering != newValue) {
            motordata.steering = newValue;
        }
    }

    if (handler.e(ALTINO.ASCII)) {
        newValue = handler.read(ALTINO.ASCII);
        if (motordata.ascii != newValue) {
            motordata.ascii = newValue;
        }
    }

    if (handler.e(ALTINO.LED)) {
        newValue = handler.read(ALTINO.LED);
        if (motordata.led != newValue) {
            motordata.led = newValue;
        }
    }

    if (handler.e(ALTINO.LED2)) {
        newValue = handler.read(ALTINO.LED2);

        if (motordata.led2 != newValue) {
            motordata.led2 = newValue;
        }
    }

    if (handler.e(ALTINO.DOT1)) {
        newValue = handler.read(ALTINO.DOT1);
        if (motordata.dot1 != newValue) {
            motordata.dot1 = newValue;
        }
    }
    if (handler.e(ALTINO.DOT2)) {
        newValue = handler.read(ALTINO.DOT2);
        if (motordata.dot2 != newValue) {
            motordata.dot2 = newValue;
        }
    }
    if (handler.e(ALTINO.DOT3)) {
        newValue = handler.read(ALTINO.DOT3);
        if (motordata.dot3 != newValue) {
            motordata.dot3 = newValue;
        }
    }
    if (handler.e(ALTINO.DOT4)) {
        newValue = handler.read(ALTINO.DOT4);
        if (motordata.dot4 != newValue) {
            motordata.dot4 = newValue;
        }
    }
    if (handler.e(ALTINO.DOT5)) {
        newValue = handler.read(ALTINO.DOT5);
        if (motordata.dot5 != newValue) {
            motordata.dot5 = newValue;
        }
    }
    if (handler.e(ALTINO.DOT6)) {
        newValue = handler.read(ALTINO.DOT6);
        if (motordata.dot6 != newValue) {
            motordata.dot6 = newValue;
        }
    }
    if (handler.e(ALTINO.DOT7)) {
        newValue = handler.read(ALTINO.DOT7);
        if (motordata.dot7 != newValue) {
            motordata.dot7 = newValue;
        }
    }
    if (handler.e(ALTINO.DOT8)) {
        newValue = handler.read(ALTINO.DOT8);
        if (motordata.dot8 != newValue) {
            motordata.dot8 = newValue;
        }
    }

    if (handler.e(ALTINO.NOTE)) {
        newValue = handler.read(ALTINO.NOTE);
        if (motordata.note != newValue) {
            motordata.note = newValue;
        }
    }

};

// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {
    var motordata = this.motordata;
    var tx_d = this.tx_d;
    var u16_tx_check_sum = 0;
    var u16_tx_cnt;

    if(motordata.command == 252) {
        if(motordata.cnt == 0) {
            var u16_cnt = 21;

            tx_d[0] = 0x2;
            tx_d[1] = 22;

            tx_d[3] = 1;
            tx_d[4] = 252;
            tx_d[5] = 0;
            tx_d[6] = 0;
            tx_d[7] = 0;
            tx_d[8] = 0;
            tx_d[9] = 0;
            tx_d[10] = 0;
            tx_d[11] = 0;
            tx_d[12] = 0;
            tx_d[13] = 0;
            tx_d[14] = 0;
            tx_d[15] = 0;
            tx_d[16] = 0;
            tx_d[17] = 0;
            tx_d[18] = 0;
            tx_d[19] = 0;
            tx_d[20] = 0;
            tx_d[21] = 0x3;
        }
        else if(motordata.cnt == 1) {
            var u16_cnt = 21;

            tx_d[0] = 0x2;
            tx_d[1] = 22;

            tx_d[3] = 1;
            tx_d[4] = 252;
            tx_d[5] = 1;
            tx_d[6] = motordata.trim;
            tx_d[7] = motordata.pgain;
            tx_d[8] = motordata.igain;
            tx_d[9] = motordata.dgain;
            tx_d[10] = 0;
            tx_d[11] = 0;
            tx_d[12] = 0;
            tx_d[13] = 0;
            tx_d[14] = 0;
            tx_d[15] = 0;
            tx_d[16] = 0;
            tx_d[17] = motordata.version;
            tx_d[18] = 0;
            tx_d[19] = 0;
            tx_d[20] = 0;
            tx_d[21] = 0x3;
        }
    }
    else {
        motordata.cnt = 0;
        var u16_cnt = 27;

        tx_d[0] = 0x2;
        tx_d[1] = 28;

        tx_d[3] = 1;
        tx_d[4] = 10;
        tx_d[5] = motordata.steering;
        tx_d[6] = motordata.rightmode;
        tx_d[7] = (motordata.rightmotor & 0xFF00) >> 8;
        tx_d[8] = motordata.rightmotor & 0xFF;
        tx_d[9] = motordata.leftmode;
        tx_d[10] = (motordata.leftmotor & 0xFF00) >> 8;
        tx_d[11] = motordata.leftmotor & 0xFF;
        tx_d[12] = motordata.ascii;
        tx_d[13] = motordata.dot1;
        tx_d[14] = motordata.dot2;
        tx_d[15] = motordata.dot3;
        tx_d[16] = motordata.dot4;
        tx_d[17] = motordata.dot5;
        tx_d[18] = motordata.dot6;
        tx_d[19] = motordata.dot7;
        tx_d[20] = motordata.dot8;
        tx_d[21] = motordata.led2 | 0x01;
        tx_d[22] = motordata.note;
        tx_d[23] = motordata.led;
        tx_d[24] = 1;
        tx_d[25] = 0;
        tx_d[26] = 0;
        tx_d[27] = 0x3;
    }

    u16_tx_check_sum = u16_tx_check_sum + tx_d[1];
    for (u16_tx_cnt = 3; u16_tx_cnt <= u16_cnt; u16_tx_cnt++) {
        u16_tx_check_sum = u16_tx_check_sum + tx_d[u16_tx_cnt];
    }
    u16_tx_check_sum = u16_tx_check_sum % 256;


    tx_d[2] = u16_tx_check_sum;
    return tx_d;
};

Module.prototype.reset = function () {
};

module.exports = new Module();
