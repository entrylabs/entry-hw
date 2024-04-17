function Module()
{
    this.tx_d = new Array(22);
    this.rx_d = new Array(16);
    this.sensordata = {
        Brightness: 0,
        BRight_IR: 0,
        BMid_IR: 0,
        BLeft_IR: 0,
        Right_IR: 0,
        Left_IR: 0,
        Front_IR: 0,
        Real_T: 0,
        Real_H: 0,
        Sound: 0,
        Motor_F: 0
    };

    this.outdata = {
        left_up_red: 0,
        left_up_green: 0,
        left_up_blue: 0,
        right_up_red: 0,
        right_up_green: 0,
        right_up_blue: 0,
        left_down_red: 0,
        left_down_green: 0,
        left_down_blue: 0,
        right_down_red: 0,
        right_down_green: 0,
        right_down_blue: 0,
        tone: 0,
        leftmotor_speed: 0,
        leftmotor_dir: 0,
        rightmotor_speed: 0,
        rightmotor_dir: 0,
        motor_mode: 0,
        motor_value: 0,
        motor_dir: 0
    };
    for(var i = 0; i < 16 ; ++i) {
        this.rx_d[i] = 0;
    }
}

var iCOBOT = {
    LURED: 'left_up_red',
    LUGREEN: 'left_up_green',
    LUBLUE: 'left_up_blue',
    RURED: 'right_up_red',
    RUGREEN: 'right_up_green',
    RUBLUE: 'right_up_blue',
    LDRED: 'left_down_red',
    LDGREEN: 'left_down_green',
    LDBLUE: 'left_down_blue',
    RDRED: 'right_down_red',
    RDGREEN: 'right_down_green',
    RDBLUE: 'right_down_blue',
    TONE: 'tone',
    LMOTORSPEED: 'leftmotor_speed',
    LMOTORDIR: 'leftmotor_dir',
    RMOTORSPEED: 'rightmotor_speed',
    RMOTORDIR: 'rightmotor_dir',
    MOTORMODE: 'motor_mode',
    MOTORVALUE: 'motor_value',
    MOTORDIR: 'motor_dir'
};

Module.prototype.init = function(handler, config){
    //console.log(this.motoring.lcdTxt);
};

Module.prototype.lostController = function(){}

Module.prototype.eventController = function(state){
    if(state === 'connected'){
        clearInterval(this.sensing);
    }
}

Module.prototype.setSerialPort = function(sp){
    this.sp = sp;
};

Module.prototype.requestInitialData = function(sp){
    var tx_d =this.tx_d;
    tx_d[0] = 0x02;
    tx_d[1] = 0x05;
    tx_d[2] = 0;
    tx_d[3] = 0;
    tx_d[4] = 0;
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
    tx_d[21] = 0x03;
    return tx_d;
};

Module.prototype.checkInitialData = function(data,config){
    return true;
};

// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data){ // data: Native Buffer
    var buf = this.rx_d;
    var rx_check_sum = 0;
    var sensordata = this.sensordata;
    for(var i = 0; i<data.length; i++) {
        buf[i] =  data[i];
    }
    if(buf[0] === 2 && buf[15] === 3){
        //console.log("buf", buf);
        rx_check_sum = buf[0];
        rx_check_sum = rx_check_sum + buf[2];
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
        rx_check_sum = rx_check_sum % 256 ;
        if(rx_check_sum == buf[1]){
            sensordata.Brightness = ((buf[2]) + ((buf[3] & 0x03) << 8));
            sensordata.BRight_IR = ((buf[3] >> 2 ) + ((buf[4] & 0x0f) << 6));
            sensordata.BMid_IR = ((buf[4] >> 4 ) + ((buf [5] & 0x3f) << 4));
            sensordata.BLeft_IR = ((buf[5] >> 6 ) + ((buf[6]) << 2));
            sensordata.Right_IR = ((buf[7]) + ((buf[8] & 0x03 ) << 8));
            sensordata.Left_IR = ((buf[8] >> 2 ) + ((buf[9] & 0x0f) << 6));
            sensordata.Front_IR = ((buf[9] >> 4 ) + ((buf[10] & 0x3f) << 4));
            sensordata.Real_T = ((buf[10] >> 6 ) + ((buf[11]) << 2));
            sensordata.Real_H = ((buf[12]) + ((buf[13] & 0x03 ) << 8));
            sensordata.Sound = ((buf[13] >> 2 ) + ((buf[14] & 0x0f ) << 6));
            sensordata.Motor_F = ((buf[14] & 0x30) >> 4);
            //console.log(sensordata.Brightness, " : ", sensordata.BRight_IR, " : ", sensordata.BMid_IR, " : ", sensordata.BLeft_IR, " : ", sensordata.Right_IR, " : ", sensordata.Left_IR, " : ", sensordata.Front_IR, " : ", sensordata.Real_T, " : ", sensordata.Real_H, " : ", sensordata.Sound, " : ", sensordata.Motor_F);
        }
    }
};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler){
    var sensordata = this.sensordata;
    for(var key in sensordata){
        handler.write(key,sensordata[key]);
    }
};

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function(handler){
    var outdata = this.outdata;
    var newValue;
    // Left Up LED
    if(handler.e(iCOBOT.LURED)){
        newValue = handler.read(iCOBOT.LURED);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if(outdata.left_up_red != newValue){
            outdata.left_up_red = newValue;
        }
    }
    if(handler.e(iCOBOT.LUGREEN)){
        newValue = handler.read(iCOBOT.LUGREEN);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if(outdata.left_up_green != newValue){
            outdata.left_up_green = newValue;
        }
    }
    if(handler.e(iCOBOT.LUBLUE)){
        newValue = handler.read(iCOBOT.LUBLUE);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if(outdata.left_up_blue != newValue){
            outdata.left_up_blue = newValue;
        }
    }
    // Right Up LED
    if(handler.e(iCOBOT.RURED)){
        newValue = handler.read(iCOBOT.RURED);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if(outdata.right_up_red != newValue){
            outdata.right_up_red = newValue;
        }
    }
    if(handler.e(iCOBOT.RUGREEN)){
        newValue = handler.read(iCOBOT.RUGREEN);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if(outdata.right_up_green != newValue){
            outdata.right_up_green = newValue;
        }
    }
    if(handler.e(iCOBOT.RUBLUE)){
        newValue = handler.read(iCOBOT.RUBLUE);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if(outdata.right_up_blue != newValue){
            outdata.right_up_blue = newValue;
        }
    }
    // Left Down LED
    if(handler.e(iCOBOT.LDRED)){
        newValue = handler.read(iCOBOT.LDRED);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if (outdata.left_down_red != newValue){
            outdata.left_down_red = newValue;
        }
    }
    if(handler.e(iCOBOT.LDGREEN)){
        newValue = handler.read(iCOBOT.LDGREEN);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if(outdata.left_down_green != newValue){
            outdata.left_down_green = newValue;
        }
    }
    if(handler.e(iCOBOT.LDBLUE)){
        newValue =handler.read(iCOBOT.LDBLUE);
        if(newValue < 0) newValue = 0;
        else if(newValue >255 ) newValue = 255;
        if(outdata.left_down_blue != newValue){
            outdata.left_down_blue = newValue;
        }
    }
    // Right Down LED
    if(handler.e(iCOBOT.RDRED)){
        newValue = handler.read(iCOBOT.RDRED);
        if(newValue < 0 ) newValue = 0;
        else if(newValue > 255 ) newValue = 255;
        if(outdata.right_down_red != newValue) {
            outdata.right_down_red = newValue;
        }
    }
    if(handler.e(iCOBOT.RDGREEN)){
        newValue = handler.read(iCOBOT.RDGREEN);
        if(newValue < 0) newValue = 0;
        else if(newValue > 255) newValue = 255;
        if(outdata.right_down_green != newValue){
            outdata.right_down_green = newValue;
        }
    }
    if(handler.e(iCOBOT.RDBLUE)){
        newValue = handler.read(iCOBOT.RDBLUE);
        if(newValue < 0 ) newValue = 0;
        else if(newValue > 255 ) newValue = 255;
        if(outdata.right_down_blue != newValue){
            outdata.right_down_blue = newValue;
        }
    }
    // Tone
    if(handler.e(iCOBOT.TONE)){
        newValue =handler.read(iCOBOT.TONE);
        if(newValue < 0) newValue = 0;
        else if(newValue > 65535) newValue = 65535;
        if(outdata.tone != newValue){
            outdata.tone = newValue;
        }
    }
    // Left Motor
    if(handler.e (iCOBOT.LMOTORSPEED)){
        newValue = handler.read(iCOBOT.LMOTORSPEED);
        if(newValue < 0) newValue = 0;
        else if(newValue > 1000) newValue = 1000;
        if(outdata.leftmotor_speed != newValue){
            outdata.leftmotor_speed = newValue;
        }
    }
    if(handler.e(iCOBOT.LMOTORDIR)){
        newValue = handler.read(iCOBOT.LMOTORDIR);
        if(newValue < 0) newValue = 0;
        else if(newValue > 1) newValue = 1;
        if(outdata.leftmotor_dir != newValue){
            outdata.leftmotor_dir = newValue;
        }
    }
    // Left Motor
    if(handler.e(iCOBOT.RMOTORSPEED)){
        newValue = handler.read(iCOBOT.RMOTORSPEED);
        if(newValue < 0) newValue = 0;
        else if(newValue > 1000) newValue = 1000;
        if(outdata.rightmotor_speed != newValue) {
            outdata.rightmotor_speed = newValue;
        }
    }
    if(handler.e(iCOBOT.RMOTORDIR)){
        newValue = handler.read(iCOBOT.RMOTORDIR);
        if(newValue < 0) newValue = 0;
        else if(newValue > 1) newValue = 1;
        if(outdata.rightmotor_dir != newValue){
            outdata.rightmotor_dir = newValue;
        }
    }
    // Motor
    if(handler.e(iCOBOT.MOTORMODE)){
        newValue = handler.read(iCOBOT.MOTORMODE);
        if(newValue < 0) newValue = 0;
        else if(newValue > 3) newValue = 3;
        if(outdata.motor_mode != newValue){
            outdata.motor_mode = newValue;
        }
    }
    if(handler.e(iCOBOT.MOTORVALUE)){
        newValue = handler.read(iCOBOT.MOTORVALUE);
        if(newValue < 0 ) newValue = 0;
        else if(newValue > 1023 ) newValue = 1023;
        if(outdata.motor_value != newValue){
            outdata.motor_value = newValue;
        }
    }
    if(handler.e(iCOBOT.MOTORDIR)){
        newValue = handler.read(iCOBOT.MOTORDIR);
        if(newValue < 0) newValue = 0;
        else if(newValue > 1) newValue = 1;
        if(outdata.motor_dir != newValue){
            outdata.motor_dir = newValue;
        }
    }
};
// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function(){
    var outdata =this.outdata;
    var tx_d =this .tx_d;
    var u8_tx_cnt;
    var u8_cnt = 21;

    tx_d[0] = 0x02;
    tx_d[1] = 0x02;
    tx_d[2] = outdata.left_up_red;
    tx_d[3] = outdata.left_up_green;
    tx_d[4] = outdata.left_up_blue;
    tx_d[5] = outdata.right_up_red;
    tx_d[6] = outdata.right_up_green;
    tx_d[7] = outdata.right_up_blue;
    tx_d[8] = outdata.left_down_red;
    tx_d[9] = outdata.left_down_green;
    tx_d[10] = outdata.left_down_blue;
    tx_d[11] = outdata.right_down_red;
    tx_d[12] = outdata.right_down_green;
    tx_d[13] = outdata.right_down_blue;
    tx_d[14] = (outdata.tone & 0xFF);
    tx_d[15] = (outdata.tone & 0xFF00) >> 8;
    tx_d[16] = (outdata.leftmotor_speed & 0xFF);
    tx_d[17] = ((outdata.leftmotor_speed >> 8) |(outdata.leftmotor_dir << 2) | ((outdata.rightmotor_speed & 0x1f) << 3));
    tx_d[18] = ((outdata.rightmotor_speed >> 5) | (outdata.rightmotor_dir << 5) | (outdata.motor_mode << 6));
    tx_d[19] = (outdata.motor_value & 0xFF);
    tx_d[20] = ((outdata.motor_value >> 8) | (outdata.motor_dir << 2));
    tx_d[21] = 0x03 ;

    for(u8_tx_cnt = 2; u8_tx_cnt <= u8_cnt; u8_tx_cnt++){
        tx_d[1] = tx_d[1] + tx_d[u8_tx_cnt];
    }
    tx_d[1] = tx_d[1] % 256;
    // console.log("tx_d", tx_d);
    return tx_d;
};
Module.prototype.reset = function(){};

module.exports = new Module();