function Module() {
    this.tx_d = new Array(22);
    this.rx_d = new Array(22);
    this.timeCheck = null;

    this.sensordata = {
        hum: 0,
        heatertemp: 0,
        temp: 0,
        soil: 0,
        cds: 0,
        switch1: 0,
        switch2: 0,
        switch3: 0
    };


    this.motordata = {
        control: 0,
        led1: 0,
        led2: 0,
        led3: 0,
        led4: 0,
        led5: 0,
        led6: 0,
        display1: 0,
        display2: 0,
        display3: 0,
        display4: 0,
        display5: 0,
        display6: 0,
        display7: 0,
        display8: 0,
        display9: 0,
        isSend: 0,
        switch: 0
    };
}

var IOTSMARTFARM = {
    CONTROL: 'control',
    LED1: 'led1',
    LED2: 'led2',
    LED3: 'led3',
    LED4: 'led4',
    LED5: 'led5',
    LED6: 'led6',
    DISPLAY1: 'display1',
    DISPLAY2: 'display2',
    DISPLAY3: 'display3',
    DISPLAY4: 'display4',
    DISPLAY5: 'display5',
    DISPLAY6: 'display6',
    DISPLAY7: 'display7',
    DISPLAY8: 'display8',
    DISPLAY9: 'display9',
    SWITCH: 'switch'
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
    tx_d[0] = 0x02;     // Start
    tx_d[1] = 16;       // Data length
    tx_d[2] = 0;        // Checksum
    tx_d[3] = 0;        // Comm ID H
    tx_d[4] = 0;        // Comm ID L
    tx_d[5] = 0;        // Control Field
    tx_d[6] = 0;        // bit 0~3 : LED 1 R, bit 4~7 : LED 1 G
    tx_d[7] = 0;        // bit 0~3 : LED 1 B, bit 4~7 : LED 2 R
    tx_d[8] = 0;        // bit 0~3 : LED 2 G, bit 4~7 : LED 2 B
    tx_d[9] = 0;        // bit 0~3 : LED 3 R, bit 4~7 : LED 3 G
    tx_d[10] = 0;       // bit 0~3 : LED 3 B, bit 4~7 : LED 4 R
    tx_d[11] = 0;       // bit 0~3 : LED 4 G, bit 4~7 : LED 4 B
    tx_d[12] = 0;       // Display
    tx_d[13] = 0;       // Display
    tx_d[14] = 0;       // Display
    tx_d[15] = 0;       // Display
    tx_d[16] = 0;       // Display
    tx_d[17] = 0;       // Display
    tx_d[18] = 0;       // Display
    tx_d[19] = 0;       // Display
    tx_d[20] = 0;       // Display
    tx_d[21] = 0x03;    // End
    return tx_d;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};


// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    var sensordata = this.sensordata;
    var motordata = this.motordata;
    
    for (var i = 0; i < data.length; i++) {
        var str = data[i];
        this.rx_d[i] = parseInt(str, 10);
    }

    if(this.rx_d[1] == 16) {
        if((this.rx_d[17] == 0) && (this.rx_d[18] == 0) && (this.rx_d[19] == 0) && (this.rx_d[20] == 0)) {
            if((this.rx_d[0] == 0x02) && (this.rx_d[21] == 0x03))
            {
                if((this.rx_d[3] == 0x01) && (this.rx_d[4] == 0x01)) {
                    sensordata.hum = ((this.rx_d[6] << 8) | this.rx_d[5]) / 100;
                    sensordata.heatertemp = ((this.rx_d[8] << 8) | this.rx_d[7]) / 100;
                    sensordata.temp = ((this.rx_d[10] << 8) | this.rx_d[9]) / 100;
                    sensordata.soil = ((this.rx_d[12] << 8) | this.rx_d[11]);
                    sensordata.cds = ((this.rx_d[14] << 8) | this.rx_d[13]);
                    sensordata.switch1 = (this.rx_d[16] & 0x01) == 0x01 ? 1 : 0;
                    sensordata.switch2 = (this.rx_d[16] & 0x02) == 0x02 ? 1 : 0;
                    sensordata.switch3 = (this.rx_d[16] & 0x04) == 0x04 ? 1 : 0;
                }
            }
        }
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

    if (handler.e(IOTSMARTFARM.CONTROL)) {
        newValue = handler.read(IOTSMARTFARM.CONTROL);

        if (motordata.control != newValue) {
            motordata.control = newValue;
        }
    }

    if (handler.e(IOTSMARTFARM.LED1)) {
        newValue = handler.read(IOTSMARTFARM.LED1);

        if (motordata.led1 != newValue) {
            motordata.led1 = newValue;
        }
    }

    if (handler.e(IOTSMARTFARM.LED2)) {
        newValue = handler.read(IOTSMARTFARM.LED2);

        if (motordata.led2 != newValue) {
            motordata.led2 = newValue;
        }
    }

    if (handler.e(IOTSMARTFARM.LED3)) {
        newValue = handler.read(IOTSMARTFARM.LED3);
        if (motordata.led3 != newValue) {
            motordata.led3 = newValue;
        }
    }

    if (handler.e(IOTSMARTFARM.LED4)) {
        newValue = handler.read(IOTSMARTFARM.LED4);

        if (motordata.led4 != newValue) {
            motordata.led4 = newValue;
        }
    }

    if (handler.e(IOTSMARTFARM.LED5)) {
        newValue = handler.read(IOTSMARTFARM.LED5);

        if (motordata.led5 != newValue) {
            motordata.led5 = newValue;
        }
    }

    if (handler.e(IOTSMARTFARM.LED6)) {
        newValue = handler.read(IOTSMARTFARM.LED6);

        if (motordata.led6 != newValue) {
            motordata.led6 = newValue;
        }
    }

    if (handler.e(IOTSMARTFARM.DISPLAY1)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY1);
        if (motordata.display1 != newValue) {
            motordata.display1 = newValue;
        }
    }

    if (handler.e(IOTSMARTFARM.DISPLAY2)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY2);

        if (motordata.display2 != newValue) {
            motordata.display2 = newValue;
        }
    }
    
    if (handler.e(IOTSMARTFARM.DISPLAY3)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY3);

        if (motordata.display3 != newValue) {
            motordata.display3 = newValue;
        }
    }
    
    if (handler.e(IOTSMARTFARM.DISPLAY4)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY4);

        if (motordata.display4 != newValue) {
            motordata.display4 = newValue;
        }
    }
    
    if (handler.e(IOTSMARTFARM.DISPLAY5)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY5);

        if (motordata.display5 != newValue) {
            motordata.display5 = newValue;
        }
    }
    
    if (handler.e(IOTSMARTFARM.DISPLAY6)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY6);

        if (motordata.display6 != newValue) {
            motordata.display6 = newValue;
        }
    }
    
    if (handler.e(IOTSMARTFARM.DISPLAY7)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY7);

        if (motordata.display7 != newValue) {
            motordata.display7 = newValue;
        }
    }
    
    if (handler.e(IOTSMARTFARM.DISPLAY8)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY8);

        if (motordata.display8 != newValue) {
            motordata.display8 = newValue;
        }
    }
    
    if (handler.e(IOTSMARTFARM.DISPLAY9)) {
        newValue = handler.read(IOTSMARTFARM.DISPLAY9);

        if (motordata.display9 != newValue) {
            motordata.display9 = newValue;
        }
    }
};

// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {
    var motordata = this.motordata;
    var tx_d = this.tx_d;

    tx_d[0] = 0x02;     // Start
    tx_d[1] = 16;       // Data length
    tx_d[2] = 0;        // Checksum
    tx_d[3] = 0x01;     // Comm ID H
    tx_d[4] = 0x01;     // Comm ID L
    tx_d[5] = motordata.control;        // Control Field
    tx_d[6] = motordata.led1;        // bit 0~3 : LED 1 R, bit 4~7 : LED 1 G
    tx_d[7] = motordata.led2;        // bit 0~3 : LED 1 B, bit 4~7 : LED 2 R
    tx_d[8] = motordata.led3;        // bit 0~3 : LED 2 G, bit 4~7 : LED 2 B
    tx_d[9] = motordata.led4;        // bit 0~3 : LED 3 R, bit 4~7 : LED 3 G
    tx_d[10] = motordata.led5;       // bit 0~3 : LED 3 B, bit 4~7 : LED 4 R
    tx_d[11] = motordata.led6;       // bit 0~3 : LED 4 G, bit 4~7 : LED 4 B
    tx_d[12] = motordata.display1;       // Display
    tx_d[13] = motordata.display2;       // Display
    tx_d[14] = motordata.display3;       // Display
    tx_d[15] = motordata.display4;       // Display
    tx_d[16] = motordata.display5;       // Display
    tx_d[17] = motordata.display6;       // Display
    tx_d[18] = motordata.display7;       // Display
    tx_d[19] = motordata.display8;       // Display
    tx_d[20] = motordata.display9;       // Display
    tx_d[21] = 0x03;    // End

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
