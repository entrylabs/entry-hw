function Module() {
    this.tx_a = [165, 241, 170, 85, 0, 0, 0, 16, 0, 0, 0, 0, 165, 241, 170, 101, 85, 240, 85, 170];
    this.tx_b = [165, 241, 170, 85, 1, 0, 0, 16, 0, 0, 0, 0, 166, 241, 170, 101, 85, 240, 85, 170];

    this.A_channel = null;
    this.B_channel = null;
    this.C_channel = null;
    this.D_channel = null;

    this.toss_data = null;

}

function decode(data) //base64 decode
{
    var array = [];
    for (var i = 2; i < data.length - 2; i++) {
        array.push(data[i]);
    }
    var test = bin2String(array);
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    test = test.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    do {
        enc1 = keyStr.indexOf(test.charAt(i++));
        enc2 = keyStr.indexOf(test.charAt(i++));
        enc3 = keyStr.indexOf(test.charAt(i++));
        enc4 = keyStr.indexOf(test.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }
    } while (i < test.length);

    if (output[0] == 's') {
        var uni = []; // String to ASCII
        for (var ii = 2; ii <= 5; ii++) {
            uni.push(parseInt(output[ii].charCodeAt(0)));
        }
        // Float
        var temp = (new Float32Array(new Uint8Array(uni).buffer)[0]);
        return temp;
    }
    return output;
}

function bin2String(array) { //byte to String
    var result = "";
    for (var i = 0; i < array.length; i++) {
        result += String.fromCharCode(array[i]);
    }
    return result;
}
////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////

Module.prototype.init = function(handler, config) {};


//연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
Module.prototype.requestInitialData = function() {
    var tx_a = this.tx_a;
    return tx_a;
};


// 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
Module.prototype.checkInitialData = function(data, config) {

    console.log("data = ", data);
    var cnt = 0;

    for (var i = 0; i < 20; i++) {
        if (data[i] == this.tx_b[i]) {
            cnt++;
        }
    }

    if (cnt == 20) {
        return true;
    }
};


//하드웨어 기기에 전달할 데이터를 반환합니다.
//slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.

Module.prototype.requestLocalData = function() {
    var cmd_set_sensorcheckdata = "{ENTR}";

    return cmd_set_sensorcheckdata;
};




// 하드웨어에서 온 데이터 처리
Module.prototype.handleLocalData = function(data) {

    var result = bin2String(data);

    var startp = result.indexOf("{");
    var first_comma = result.indexOf(",");
    var second_comma = result.indexOf(",", 8);
    var third_comma = result.indexOf(",", 15);
    var endp = result.indexOf("}");

    this.A_channel = result.substring(startp + 1, first_comma);
    this.B_channel = result.substring((first_comma + 1), second_comma);
    this.C_channel = result.substring((second_comma + 1), third_comma);
    this.D_channel = result.substring((third_comma + 1), endp);



};

// 엔트리로 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {

    if (this.toss_data == 'A') {
        handler.write('A', this.A_channel);
    }
    if (this.toss_data == 'B') {
        handler.write('B', this.B_channel);
    }
    if (this.toss_data == 'C') {
        handler.write('C', this.C_channel);
    }
    if (this.toss_data == 'D') {
        handler.write('D', this.D_channel);
    }
};

// 엔트리에서 받은 데이터에 대한 처리 (시작 버튼)
Module.prototype.handleRemoteData = function(handler) {
    this.toss_data = handler.read('data');
};

Module.prototype.reset = function() {};

module.exports = new Module();