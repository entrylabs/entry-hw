function Module() {
    this.tx_d = new Array(22);
    this.rx_d = new Array(22);

    this.sensordata = {
        cds: 0,
        ir1: 0,
        ir2: 0,
        ir3: 0,
        ir4: 0,
        ir5: 0,
        ir6: 0,
        bat: 0,
    };


    this.motordata = {
        rightmotor: 0,
        leftmotor: 0,
        steering: 0,
        led: 0,
        note: 0,
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
}

var ALTINO = {
    RIGHT_WHEEL: 'rightWheel',
    LEFT_WHEEL: 'leftWheel',
    STEERING: 'steering',
    ASCII: 'ascii',
    LED: 'led',
    NOTE: 'note',
    DOT1: 'dot1',
    DOT2: 'dot2',
    DOT3: 'dot3',
    DOT4: 'dot4',
    DOT5: 'dot5',
    DOT6: 'dot6',
    DOT7: 'dot7',
    DOT8: 'dot8'
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
    tx_d[0] = 0x02;    // Start
    tx_d[1] = 16;      // Data length
    tx_d[2] = 0;       // Checksum
    tx_d[3] = 0;    // Comm ID H
    tx_d[4] = 0;    // Comm ID L
    tx_d[5] = 0;    // Steering
    tx_d[6] = 0;    // Drive Right H
    tx_d[7] = 0;    // Drive Right L
    tx_d[8] = 0;    // Drive Left H
    tx_d[9] = 0;    // Drive Left L
    tx_d[10] = 0;   // Dot Matrix Mode
    tx_d[11] = 0;   // Dotmatrix Line 0
    tx_d[12] = 0;   // Dotmatrix Line 1
    tx_d[13] = 0;   // Dotmatrix Line 2
    tx_d[14] = 0;   // Dotmatrix Line 3
    tx_d[15] = 0;   // Dotmatrix Line 4
    tx_d[16] = 0;   // Dotmatrix Line 5
    tx_d[17] = 0;   // Dotmatrix Line 6
    tx_d[18] = 0;   // Dotmatrix Line 7
    tx_d[19] = 0;   // Buzzer
    tx_d[20] = 0;   // Led
    tx_d[21] = 0x03;   // End
    return tx_d;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};


// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    var rx_check_sum = 0;
    var sensordata = this.sensordata;
    
    for (var i = 0; i < data.length; i++) {
        var str = data[i];
        this.rx_d[i] = parseInt(str, 10);
    }

    if((this.rx_d[0] == 0x02) && (this.rx_d[21] == 0x03))
    {
        sensordata.ir1 = this.rx_d[5] * 256 + this.rx_d[6]; //ir1
        sensordata.ir2 = this.rx_d[7] * 256 + this.rx_d[8]; //ir2
        sensordata.ir3 = this.rx_d[9] * 256 + this.rx_d[10]; //ir3
        sensordata.ir4 = this.rx_d[11] * 256 + this.rx_d[12]; //ir4
        sensordata.ir5 = this.rx_d[13] * 256 + this.rx_d[14]; //ir5
        sensordata.ir6 = this.rx_d[15] * 256 + this.rx_d[16]; //ir6
        sensordata.cds = this.rx_d[17] * 256 + this.rx_d[18]; //cds
        sensordata.bat = this.rx_d[19] * 256 + this.rx_d[20]; //battery
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

    if (handler.e(ALTINO.RIGHT_WHEEL)) {
        
        newValue = handler.read(ALTINO.RIGHT_WHEEL);
        var dir = true;
        if (newValue < 0) dir = false;

        newValue = Math.abs(newValue);

        if (newValue > 1000) newValue = 1000;

        if(dir == false) newValue = ~newValue;

        if (motordata.rightmotor != newValue) {
            motordata.rightmotor = newValue;
        }

    }

    if (handler.e(ALTINO.LEFT_WHEEL)) {
        
        newValue = handler.read(ALTINO.LEFT_WHEEL);
        var dir = true;
        if (newValue < 0) dir = false;

        newValue = Math.abs(newValue);

        if (newValue > 1000) newValue = 1000;

        if(dir == false) newValue = ~newValue;

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
    tx_d[0] = 0x02;    // Start
    tx_d[1] = 16;      // Data length
    tx_d[2] = 0;       // Checksum
    tx_d[3] = 0x01;    // Comm ID H
    tx_d[4] = 0x01;    // Comm ID L
    tx_d[5] = motordata.steering;                       // Steering
    tx_d[6] = (motordata.rightmotor & 0xFF00) >> 8;    // Drive Right H
    tx_d[7] = motordata.rightmotor & 0xFF;              // Drive Right L
    tx_d[8] = (motordata.leftmotor & 0xFF00) >> 8;    // Drive Left H
    tx_d[9] = motordata.leftmotor & 0xFF;    // Drive Left L
    tx_d[10] = motordata.ascii;   // Dot Matrix Mode
    tx_d[11] = motordata.dot1;   // Dotmatrix Line 0
    tx_d[12] = motordata.dot2;   // Dotmatrix Line 1
    tx_d[13] = motordata.dot3;   // Dotmatrix Line 2
    tx_d[14] = motordata.dot4;   // Dotmatrix Line 3
    tx_d[15] = motordata.dot5;   // Dotmatrix Line 4
    tx_d[16] = motordata.dot6;   // Dotmatrix Line 5
    tx_d[17] = motordata.dot7;   // Dotmatrix Line 6
    tx_d[18] = motordata.dot8;   // Dotmatrix Line 7
    tx_d[19] = motordata.note;   // Buzzer
    tx_d[20] = motordata.led;   // Led
    tx_d[21] = 0x03;   // End

    var checksum = 0;
    for(var i = 3; i < 21; i++){
        checksum += tx_d[i];
    }

    tx_d[2] = checksum & 0xFF;

    return tx_d;
};

Module.prototype.reset = function () {
};

module.exports = new Module();

