function Module() {
    this.tx_a = [123, 123, 84, 103, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 66, 79, 125, 125];
    this.tx_b = [123, 123, 85, 119, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 66, 84, 125, 125];
    this.remainValue = null;
    this.remainValue2 = null;

}

function bin2String(array) { //byte to String
    var result = "";
    for (var i = 0; i < array.length; i++) {
      result += String.fromCharCode(array[i]);
    }
    return result;
  }

function decode(data) //base64 decode
{
    var array = [];
    for(var i=2; i<data.length-2; i++){
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

  if(output[0] == 's')
  {
    var uni = []; // String to ASCII
    for(var ii=2; ii<=5; ii++){
        uni.push(parseInt(output[ii].charCodeAt(0)));
    }
  // Float
    var temp = (new Float32Array(new Uint8Array(uni).buffer)[0]);
    return temp;
    }
    return output;
}
////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////

Module.prototype.init = function(handler, config) {};

Module.prototype.requestInitialData = function() {
    var tx_a = this.tx_a;
    return tx_a;
};

Module.prototype.checkInitialData = function(data, config) {
    
    var decodeFirst = decode(data);
    var result = "";
    for(var i=2; i<=decodeFirst.length-5; i++)
    {
        result += decodeFirst[i];
    }
    this.remainValue = result;
    return true;
};

Module.prototype.requestLocalData = function() {
    var tx_b = this.tx_b;
    //console.log("Second : " + tx_b);
	return tx_b;    
};

Module.prototype.handleLocalData = function(data) {
    var decodeSecond = decode(data);
    this.remainValue2 = decodeSecond;

};

Module.prototype.requestRemoteData = function(handler) {
    if(this.remainValue == "WL100T")
    {
        this.remainValue2;
        handler.write('tempData', this.remainValue2);
    }
    if(this.remainValue == "WL103P")
    {
        this.remainValue2;
        handler.write('pressueData', this.remainValue2);
    }
    if(this.remainValue == "WL102C")
    {
        this.remainValue2;
        handler.write('currentData', this.remainValue2);
    }
    if(this.remainValue == "WL101V")
    {
        this.remainValue2;
        handler.write('voltageData', this.remainValue2);
    }
};

Module.prototype.handleRemoteData = function(handler) {
    var data = handler.read('data');
    //console.log("data " +data["currentData"]);
};

Module.prototype.reset = function() {};

module.exports = new Module();


