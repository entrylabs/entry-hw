var connect_ = {};
var conModuleName = [];
var hrI = 0;
var hrJ = null;
var path = "";
var messageBuffer_ = "";

var displayTextOld = {};

var moduleCount = {
    number: 0,
    random: 0,
    mic: 0,
    dial: 0,
    environment: 0,
    gyro: 0,
    button: 0,
    ir: 0,
    ultrasonic: 0,
    motor: 0,
    led: 0,
    display: 0,
    speaker: 0,
    usb: 0,
    network: 0
};
var setProperty = {
    LED_RGB: 16,

    MOTOR_TORQUE: 16,
    MOTOR_SPEED: 17,
    MOTOR_ANGLE: 18,

    SPEAKER_BUZZER: 16,
    F_DO_1: 32,
    F_RE_1: 36,
    F_MI_1: 41,
    F_PA_1: 43,
    F_SOL_1: 48,
    F_RA_1: 55,
    F_SO_1: 61,
    F_DO_S_1: 34,
    F_RE_S_1: 39,
    F_PA_S_1: 46,
    F_SOL_S_1: 52,
    F_RA_S_1: 58,
    F_DO_2: 65,
    F_RE_2: 73,
    F_MI_2: 82,
    F_PA_2: 87,
    F_SOL_2: 97,
    F_RA_2: 110,
    F_SO_2: 123,
    F_DO_S_2: 69,
    F_RE_S_2: 77,
    F_PA_S_2: 92,
    F_SOL_S_2: 103,
    F_RA_S_2: 116,
    F_DO_3: 130,
    F_RE_3: 146,
    F_MI_3: 165,
    F_PA_3: 174,
    F_SOL_3: 196,
    F_RA_3: 220,
    F_SO_3: 247,
    F_DO_S_3: 138,
    F_RE_S_3: 155,
    F_PA_S_3: 185,
    F_SOL_S_3: 207,
    F_RA_S_3: 233,
    F_DO_4: 261,
    F_RE_4: 293,
    F_MI_4: 329,
    F_PA_4: 349,
    F_SOL_4: 392,
    F_RA_4: 440,
    F_SO_4: 493,
    F_DO_S_4: 277,
    F_RE_S_4: 311,
    F_PA_S_4: 369,
    F_SOL_S_4: 415,
    F_RA_S_4: 466,
    F_DO_5: 523,
    F_RE_5: 587,
    F_MI_5: 659,
    F_PA_5: 698,
    F_SOL_5: 783,
    F_RA_5: 880,
    F_SO_5: 988,
    F_DO_S_5: 554,
    F_RE_S_5: 622,
    F_PA_S_5: 739,
    F_SOL_S_5: 830,
    F_RA_S_5: 932,
    F_DO_6: 1046,
    F_RE_6: 1174,
    F_MI_6: 1318,
    F_PA_6: 1397,
    F_SOL_6: 1567,
    F_RA_6: 1760,
    F_SO_6: 1975,
    F_DO_S_6: 1108,
    F_RE_S_6: 1244,
    F_PA_S_6: 1479,
    F_SOL_S_6: 1661,
    F_RA_S_6: 1864,
    F_DO_7: 2093,
    F_RE_7: 2349,
    F_MI_7: 2637,
    F_PA_7: 2793,
    F_SOL_7: 3135,
    F_RA_7: 3520,
    F_SO_7: 3951,
    F_DO_S_7: 2217,
    F_RE_S_7: 2489,
    F_PA_S_7: 2959,
    F_SOL_S_7: 3322,
    F_RA_S_7: 3729,

    DISPLAY_TEXT: 17
};
var getProperty = {
    BUTTON_CLICK: 2,
    BUTTON_DBLCLICK: 3,
    BUTTON_TOGGLE: 5,
    BUTTON_PUSH: 4,

    DIAL_DEGREE: 2,

    IR_DIST: 2,
    IR_BRIGHT: 3,

    ULTRASONIC_DIST: 2,

    ENVIRONMENT_TEMPER: 6,
    ENVIRONMENT_HUMID: 7,
    ENVIRONMENT_BRIGHT: 2,
    ENVIRONMENT_RED: 3,
    ENVIRONMENT_BLUE: 5,
    ENVIRONMENT_GREEN: 4,

    GYRO_ROLL: 2,
    GYRO_PITCH: 3,
    GYRO_YAW: 4,
    // GYRO_GYROX: 5,
    // GYRO_GYROY: 6,
    // GYRO_GYROZ: 7,
    GYRO_ACCELX: 8,
    GYRO_ACCELY: 9,
    GYRO_ACCELZ: 10,
    // GYRO_VIBRATION: 11,

    MIC_VOLUME: 2,
    MIC_FREQUENCE: 3,

    DISPLAY_CURSORX: 2,
    DISPLAY_CURSORY: 3,

    LED_RED: 2,
    LED_GREEN: 3,
    LED_BLUE: 4,

    SPEAKER_FREQ: 3,
    SPEAKER_VOLUME: 2,

    MOTOR_RDEGREE: 4,
    MOTOR_LDEGREE: 12,  
    MOTOR_RSPEED: 3,
    MOTOR_LSPEED: 11,
    MOTOR_RTORQUE: 2,
    MOTOR_LTORQUE: 10
};
var outputIndex = {
    "led" : 0,
    "motor" : 0, 
    "speaker" : 0,
    "display" : 0
}

function Module() {
    isConnected = true;

    this.requestData = [];
    this.moduleData = null;
}

setInterval(function disconnectHandler() {// disconnect cheak
    for (var obj in connect_) {
        newT = new Date().getTime();
        oldT = connect_[obj].ping;
        if (oldT === undefined) {
            continue;
        }
        if (newT - oldT > 3500) {
            // disconnect
            console.log("DC");//모듈 disconnect
            unsetConnect(connect_[obj].uuid);
        }
    }
}, 500);

function btoa(data) {
    return Buffer.from(data).toString('base64');
}

function atob(data) {
    return Buffer.from(data, 'base64').toString();
}

function unsetConnect( id, port ) {
    var obj = connect_[id];
    if (port !== undefined && connect_[port] !== undefined) {
        obj = connect_[port][id];
    }
    if (obj === undefined)
        return;
    if(moduleCount[obj.moduleT] > 0) {
        moduleCount[obj.moduleT]--;
    }

    if(obj.moduleT === "display") {
        delete(displayTextOld[obj.id]);
    }

    delete(connect_[obj.port][obj.id]);
    delete(connect_[obj.uuid]);
}

Module.prototype.setConnect = function( categoryT, moduleT, port, id, uuid ) {
    if (connect_[port] === undefined) {
        connect_[port] = {};
    }
    if (connect_[uuid] === undefined) {
        connect_[uuid] = {};
    }
    else if(connect_[uuid].id) {
        return;
    }
    var obj = connect_[uuid];
    obj.uuid = uuid;
    obj.categoryT = categoryT;
    obj.num = moduleCount[moduleT]++;
    obj.id = id;
    obj.port = port;
    obj.moduleT = moduleT;
    obj.value = [];

    if (connect_[port] === undefined) {
        connect_[port] = {};
    }

    connect_[port][id] = uuid;
}

Module.prototype.updateHealth = function(id, port) {
    var obj = this.isConnect(id, port);

    if (obj !== undefined) {
        obj.ping = new Date().getTime();
        return;
    }
}

Module.prototype.isConnect = function(id, port) {
    var uuid = id;
    if (port !== undefined) {
        if (connect_[port] === undefined) {
            return undefined;
        }
        uuid = connect_[port][id];
    }

    return connect_[uuid];
}

Module.prototype.str2ab = function(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

Module.prototype.type2strArr = function( type ) {    
    var category = type[0] >> 13;
    var module = (type[0] >> 4) & 0x1FF;
    var swDec = type[1];
    var swBin = (swDec >>> 0).toString(2);
    var swOct = (swDec >>> 0).toString(8);
    var swHex = (swDec >>> 0).toString(16);

    var categoryArr = ["network", "input", "output"];

    var networkArr = ["usb", "usb/wifi/ble"];
    var inputArr = ["environment", "gyro", "mic", "button", "dial", "ultrasonic", "ir"];
    var outputArr = ["display", "motor", "led", "speaker"];
    var moduleArr = [networkArr, inputArr, outputArr];

    return [categoryArr[category], moduleArr[category][module], moduleArr[category][module], swDec];
}

Module.prototype.handleJsonMessage = function( object ) {
    var obj = {};

    obj.c = object.c;
    obj.id = object.s;

    var byteTemp = Buffer.from(object.b, 'base64').toString();
    var buffer = this.str2ab(byteTemp);

    switch(obj.c) {
        case 0x00:
            this.updateHealth( obj.id, path );
            console.log(object);
            break;
        case 0x05:
            this.offPnp(obj.id);

            // type, uuid, category, module, sw
            var type = new Uint16Array(buffer, 4, 2);
            var arr = this.type2strArr(type);
            obj.uuid = Number("0x" + (type[0]).toString(16) + (new Uint32Array(buffer, 0, 1)[0]).toString(16));
            obj.category = arr[0];
            obj.module = arr[1];
            obj.from = path;
            this.setConnect( obj.category, obj.module, obj.from, obj.id, obj.uuid);
            break;
        case 0x1F:
            var data = new Uint8Array(buffer, 0, 4);
            var buf = new ArrayBuffer(4);
            var view = new DataView(buf);

            for(var i=0;i<4;i++) {
				view.setUint8(3-i, data[i]);
            }
            
            var propertyValue = Number(view.getFloat32(0).toFixed(0));

            if(object.d == 0 || object.d == 1) {
                return;
            }
            for(var i in connect_) {
                if(object.s == connect_[i].id) {
                    connect_[i].value[object.d] = propertyValue;
                }
            }
            return;
    }
}

Module.prototype.offPnp = function(id) {
    console.log("offPnp");
    var offStr= {"c":9,"s":0,"d":4095,"b":"AAI=","l":2};
    this.requestData.push(JSON.stringify(offStr));
}

Module.prototype.getJson = function() {
    while ( true ) {
        var index = messageBuffer_.search( '{' );

        if ( index === -1 ) {
            messageBuffer_ = "";
            return false;
        }

        messageBuffer_ = messageBuffer_.slice( index );

        index = messageBuffer_.search( '}' );
        if ( index === -1 ) {
            return false;
        }

        index = index + 1;
        var jsonString = messageBuffer_.slice( 0, index );
        messageBuffer_ = messageBuffer_.slice( index );

        var json;
        try {
            json = JSON.parse( jsonString );
        }catch(e) {
            return false;
        }

        if ( json.c === undefined ) {
            return false;
        }

        return json;
    }
}

Module.prototype.ab2str = function(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

Module.prototype.setSerialPort = function(sp) {
    path = sp.path;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    messageBuffer_ += data;
    while(true) {
        var json = this.getJson();
        if ( json === false )
            return;
        try{
            this.handleJsonMessage(json);
        }catch(err) {}
    }
};

Module.prototype.handleRemoteData = function(handler) {
    var moduleValue = handler.read('moduleValue');
    if(conModuleName.length <  Object.keys(connect_).length) {
        for(var i in connect_) {
            if(connect_[i].moduleT)
                conModuleName.push(connect_[i].moduleT);
        }
    }
    hrJ = conModuleName.shift();
    hrI = outputIndex[hrJ];

    if(!moduleValue[hrJ])
    return;

    if(moduleValue[hrJ].length != 0) {
        this.moduleData = moduleValue[hrJ][hrI];
        if(!this.moduleData) {
            outputIndex[hrJ] = 0;
            isSet = false;
            return;
        }
        if(outputIndex[hrJ]+1 <= moduleValue[hrJ].length) {
            outputIndex[hrJ]++;
            isSet = false;
        }
    }
    if(this.moduleData) {
        var send = this.setProperty(JSON.parse(this.moduleData));
        if(send) {
            this.requestData.push(send);
        }
        
    }
};

Module.prototype.requestLocalData = function() {

    if(this.requestData.length > 0) {
        return this.requestData.shift();
    } else {
        return null;
    }
};

Module.prototype.setProperty = function(moduleValue) {
    var obj = {};

    if(!moduleValue)
        return;

    if(!moduleValue.module)
        return;


    var buffer = new ArrayBuffer(8);
    var view = new Uint16Array(buffer);
    var moduleName = moduleValue.module.split("_")[0];

    if(moduleName == "DISPLAY") {
        this.setDisplay(moduleValue);
        return;
    }
    if(moduleName == "SPEAKER") {
        return this.setTune(moduleValue);
    }
    if(moduleValue.value1) {
        view[0] = moduleValue.value1;

        if(setProperty[moduleValue.value1]) {
            view[0] = setProperty[moduleValue.value1];
        }
    }
    if(moduleValue.value2) {
        view[1] = moduleValue.value2;
    }
    if(moduleValue.value3) {
        view[2] = moduleValue.value3;
    }

    var b64 = Buffer.from(this.ab2str(buffer)).toString('base64');

    obj.c = 0x04;
    obj.s = setProperty[moduleValue.module];//function ID
    obj.d = moduleValue.id;// module ID
    obj.b = b64;// property value
    obj.l = 8;
    return JSON.stringify(obj);  
};

Module.prototype.setDisplay = function(moduleValue) {

    var str = moduleValue.value1;
    var strArray = [];

    if(str.length > 27 || displayTextOld[moduleValue.id] === str)
        return;

    for(var i=0; i<Math.ceil(str.length/8); i++) {
        strArray.push(str.substr((i*8),8));
    }

    var clear = {
        c : 0x04,
        s : 21,
        d : moduleValue.id,
        b : "AQ==",
        l : 1
    };
    this.requestData.push(JSON.stringify(clear));

    for(var i=0; i<strArray.length; i++) {
        var obj = {};

        var buffer = new ArrayBuffer(strArray[i].length);
        var view = new Uint8Array(buffer);
        for(var j = 0; j < strArray[i].length; j++) {
            view[j] = strArray[i].charCodeAt(j);
        }
        var b64 = Buffer.from(this.ab2str(buffer)).toString('base64');

        obj.c = 0x04;
        obj.s = setProperty[moduleValue.module];    //function ID
        obj.d = moduleValue.id;                     // module ID
        obj.b = b64;                                // property value
        obj.l = strArray[i].length;

        this.requestData.push(JSON.stringify(obj));
    }

    displayTextOld[moduleValue.id] = str;
};

Module.prototype.setTune = function(moduleValue) {

    var obj = {};
    var frequence = 0;
    var volume = 0;

    if(moduleValue.value1) {
        frequence = moduleValue.value1;

        if(setProperty[moduleValue.value1]) {
            frequence = setProperty[moduleValue.value1];
        }
    }
    if(moduleValue.value2) {
        volume = moduleValue.value2;
    }

    var freqBuffer = new ArrayBuffer(4);
    var freqView = new DataView(freqBuffer);
    freqView.setFloat32(0,frequence);

    var volBuffer = new ArrayBuffer(4);
    var volView = new DataView(volBuffer);
    volView.setFloat32(0,volume);

    var buffer = new ArrayBuffer(8);
    var view = new Uint8Array(buffer);

    for(var i=0; i<4; i++) {
        view[i] = freqView.getUint8(3-i);
        view[i+4] = volView.getUint8(3-i);
    }

    var b64 = Buffer.from(this.ab2str(buffer)).toString('base64');

    obj.c = 0x04;
    obj.s = setProperty[moduleValue.module];//function ID
    obj.d = moduleValue.id;// module ID
    obj.b = b64;// property value
    obj.l = 8;// property value

    return JSON.stringify(obj);
};

var arr = [];
Module.prototype.getProperty = function() {
    if(arr.length == 0)
        arr = [];
    else if(arr.length != 0) {
        return arr.shift();  
    }

    if(connect_.length == 0)
        return;

    for(var i in connect_) {
        if(i != path) {
            for(var j in getProperty) {
                var s = j.split("_")[0].toLowerCase();
                if(s == connect_[i].moduleT) {
                    arr.push(this.getPropertyJson(getProperty[j],connect_[i].id));
                }
            }
        }
    }
};

Module.prototype.getPropertyJson = function(propertyNum, moduleID) {
    var obj = {};
    obj.c = 0x03; 
    var buffer = new ArrayBuffer(4);
    var view = new Uint8Array(buffer);
    view[0] = propertyNum;
    view[2] = 97;
    var b64 = Buffer.from(this.ab2str(buffer)).toString('base64');

    obj.s = 0;
    obj.d = moduleID;

    obj.b = b64;
    obj.l = 4;
    return JSON.stringify(obj);  
};

Module.prototype.requestRemoteData = function(handler) {
    var arr = new Object();
    $.forEach(connect_,function(value, index) {
        if(index != path) {
            if(arr[connect_[index].moduleT] == undefined) {
                arr[connect_[index].moduleT] = new Array();
            }      
            arr[connect_[index].moduleT][connect_[index].num] = JSON.stringify(connect_[index]);

        }
    });
    handler.write("module", arr);
};

Module.prototype.lostController = function(self, callback) {
    self.timer = setInterval(function() {
        if (self.connected) {
            if (self.received == false) {
                if (isConnected == false) {
                    self.connected = false;
                    if (callback) {
                        callback('lost');
                    }
                }
                isConnected = false;
            }
            self.received = false;
        }
    }, 1000);
};

Module.prototype.resetProperty = function() {
    displayTextOld = {};
    outputIndex = {
        "led" : 0,
        "motor" : 0, 
        "speaker" : 0,
        "display" : 0
    };
    moduleCount = {
        number: 0,
        random: 0,
        mic: 0,
        dial: 0,
        environment: 0,
        gyro: 0,
        button: 0,
        ir: 0,
        ultrasonic: 0,
        motor: 0,
        led: 0,
        display: 0,
        speaker: 0,
        usb: 0,
        network: 0
    };

    //reset command
    var obj = {};
    obj.c = 0x09;

    var buffer = new ArrayBuffer(1);
    var view = new Uint8Array(buffer);
    view[0] = 0x06;
    var b64 = Buffer.from(this.ab2str(buffer)).toString('base64');

    obj.s = 0;
    obj.d = 0xFFF;
    obj.b = b64;
    obj.l = 1;

    return JSON.stringify(obj);  
};

Module.prototype.reset = function() {
    this.moduleData = null;
    this.requestData = [];
    connect_ = {};
    arr = [];
    path = "";
    messageBuffer_ = "";
    displayTextOld = {};
    outputIndex = {
        "led" : 0,
        "motor" : 0, 
        "speaker" : 0,
        "display" : 0
    };
    moduleCount = {
        number: 0,
        random: 0,
        mic: 0,
        dial: 0,
        environment: 0,
        gyro: 0,
        button: 0,
        ir: 0,
        ultrasonic: 0,
        motor: 0,
        led: 0,
        display: 0,
        speaker: 0,
        usb: 0,
        network: 0
    };
};

Module.prototype.init = function(handler, config) {
};

Module.prototype.requestInitialData = function() {
    isConnected = true;
    return null;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

module.exports = new Module();
