function Module() {
    this.digitalValue = new Array(14);
    this.analogValue = new Array(6);
    this.isConSuccess = false;

    this.remoteCommandValue = new Array(17);
    //this.readablePorts = null;
    this.lastRemoteCommandValue = new Array(17);
    console.log("***MODULE");
    this.resCnt = 0;

}

Module.prototype.RainBowLedRgb = {
    "OFF": [0, 0, 0],
    "Red": [80, 0, 0],
    "Orange": [80, 20, 0],
    "Yellow": [80, 80, 0],
    "Green": [0, 80, 0],
    "Blue": [0, 0, 80],
    "Dark Blue": [0, 50, 80],
    "Purple": [80, 0, 80],
    "White": [80, 80, 80]
};

Module.prototype.Melodies = {
    "L_So": 196,
    "L_So#": 208,
    "L_La": 220,
    "L_La#": 233,
    "L_Ti": 247,
    "Do": 262,
    "Do#": 277,
    "Re": 294,
    "Re#": 311,
    "Mi": 330,
    "Fa": 349,
    "Fa#": 370,
    "So": 392,
    "So#": 415,
    "La": 440,
    "La#": 466,
    "Ti": 494,
    "H_Do": 523,
    "H_Do#": 554,
    "H_Re": 587,
    "H_Re#": 622,
    "H_Mi": 659,
    "H_Fa": 698
};

Module.prototype.PORT_MAP = {
    "ELED_R": 0,
    "ELED_G": 1,
    "ELED_B": 2,
    "ELED_IDX": 3,
    "RainBowLED_IDX": 4,
    "RainBowLED_COL": 5,
    "Servo1": 6,
    "Servo2": 7,
    "DC1_DIR": 8,
    "DC1_SPEED": 9,
    "DC2_DIR": 10,
    "DC2_SPEED": 11,
    "7SEG": 12,
    "Melody": 13,
    "RainBowLED_1": 14,
    "RainBowLED_2": 15,
    "RainBowLED_3": 16,
};

Module.prototype.COMMAND_MAP = {
    "LED": 0x1,
    "TONE": 0x2,
    "DC": 0x3,
    "LCD": 0x4,
    "SSEG": 0x5,
    "ELED": 0x6,
    "SERVO": 0x7,
};


Module.prototype.init = function(handler, config) {
    console.log("***init");
    this.isConSuccess = false;
};

Module.prototype.requestInitialData = function() {
    var queryString = [];

    ///	console.log("***requestInitialData");
    return null;
};

Module.prototype.checkInitialData = function(data, config) {
    console.log("***checkInitialData");
    return true;
};

Module.prototype.validateLocalData = function(data) {
    //		console.log("***validateLocalData");
    return true;
};


Module.prototype.handleRemoteData = function(handler) {
    //console.log("***remote Value copy");
    //	this.readablePorts = handler.read('readablePorts');

    var remoteValue = this.remoteCommandValue;

    remoteValue[this.PORT_MAP["ELED_R"]] = handler.e("ELED_R") ? handler.read("ELED_R") : undefined;
    remoteValue[this.PORT_MAP["ELED_G"]] = handler.e("ELED_G") ? handler.read("ELED_G") : undefined;
    remoteValue[this.PORT_MAP["ELED_B"]] = handler.e("ELED_B") ? handler.read("ELED_B") : undefined;
    remoteValue[this.PORT_MAP["ELED_IDX"]] = handler.e("ELED_IDX") ? handler.read("ELED_IDX") : undefined;

    remoteValue[this.PORT_MAP["RainBowLED_IDX"]] = handler.e("RainBowLED_IDX") ? handler.read("RainBowLED_IDX") : undefined;
    remoteValue[this.PORT_MAP["RainBowLED_COL"]] = handler.e("RainBowLED_COL") ? handler.read("RainBowLED_COL") : undefined;

    if (handler.e("RainBowLED_1")) remoteValue[this.PORT_MAP["RainBowLED_1"]] = handler.read("RainBowLED_1");
    if (handler.e("RainBowLED_2")) remoteValue[this.PORT_MAP["RainBowLED_2"]] = handler.read("RainBowLED_2");
    if (handler.e("RainBowLED_3")) remoteValue[this.PORT_MAP["RainBowLED_3"]] = handler.read("RainBowLED_3");

    if (handler.e("Servo1")) remoteValue[this.PORT_MAP["Servo1"]] = handler.read("Servo1");
    if (handler.e("Servo2")) remoteValue[this.PORT_MAP["Servo2"]] = handler.read("Servo2");


    if (handler.e("Melody")) remoteValue[this.PORT_MAP["Melody"]] = handler.read("Melody");

    if (handler.e("DC1_DIR") && handler.e("DC1_SPEED")) {
        remoteValue[this.PORT_MAP["DC1_DIR"]] = handler.read("DC1_DIR");
        if (remoteValue[this.PORT_MAP["DC1_DIR"]] != 3)
            remoteValue[this.PORT_MAP["DC1_SPEED"]] = handler.read("DC1_SPEED") * 25 + 130;
        else
            remoteValue[this.PORT_MAP["DC1_SPEED"]] = 0;
    }

    if (handler.e("DC2_DIR") && handler.e("DC2_SPEED")) {
        remoteValue[this.PORT_MAP["DC2_DIR"]] = handler.read("DC2_DIR");
        if (remoteValue[this.PORT_MAP["DC2_DIR"]] != 3)
            remoteValue[this.PORT_MAP["DC2_SPEED"]] = handler.read("DC2_SPEED") * 25 + 130;
        else
            remoteValue[this.PORT_MAP["DC2_SPEED"]] = 0;
    }

    if (handler.e("EXUSB1")) {
        var exUSB1 = handler.read("EXUSB1");
        remoteValue[this.PORT_MAP["DC1_DIR"]] = 1;
        if (exUSB1 > 0)
            remoteValue[this.PORT_MAP["DC1_SPEED"]] = exUSB1 * 50 + 5;
        else
            remoteValue[this.PORT_MAP["DC1_SPEED"]] = 0;
    }

    if (handler.e("EXUSB2")) {
        var exUSB1 = handler.read("EXUSB2");
        remoteValue[this.PORT_MAP["DC2_DIR"]] = 1;
        if (exUSB1 > 0)
            remoteValue[this.PORT_MAP["DC2_SPEED"]] = exUSB1 * 50 + 5;
        else
            remoteValue[this.PORT_MAP["DC2_SPEED"]] = 0;
    }

    if (handler.e("7SEG")) remoteValue[this.PORT_MAP["7SEG"]] = handler.read("7SEG");

    console.log("RemoteValue:" + this.remoteCommandValue);
};

Module.prototype.parseNumberTwoBytes = function(queryString, num) {
    queryString.push(num & 0x7F);
    queryString.push((num >> 7) & 0x7F);
}

Module.prototype.encodeCommand = function(queryString, command, argc, args) {
    queryString.push(0xF0);

    queryString.push(command);

    for (var i = 0; i < argc; i++)
        this.parseNumberTwoBytes(queryString, args[i]);

    //this.parseNumberTwoBytes(queryString, 80);
    //this.parseNumberTwoBytes(queryString, 80);
    //this.parseNumberTwoBytes(queryString, 0);


    queryString.push(0xF7);
}

Module.prototype.requestLocalData = function() {
    ///	console.log("***2");
    /*
    	var queryString = [];

    	var readablePorts = this.readablePorts;
    	if (readablePorts) {
    		for (var i in readablePorts) {
    			var query = (5 << 5) + (readablePorts[i] << 1);
    			queryString.push(query);
    		}
    	}

    	var digitalValue = this.remoteDigitalValue;
    	for (var port = 0; port < 14; port++) {
    		var value = digitalValue[port];
    		if (value === 255 || value === 0) {
    			var query = (7 << 5) + (port << 1) + (value == 255 ? 1 : 0);
    			queryString.push(query);
    		} else if (value > 0 && value < 255) {
    			var query = (6 << 5) + (port << 1) + (value >> 7);
    			queryString.push(query);
    			query = value & 127;
    			queryString.push(query);
    		}
    	}
    	*/

    var queryString = [];

    //	if(remoteValue[this.PORT_MAP["RainBowLED_IDX"]] != lastRemoteValue[this.PORT_MAP["RainBowLED_IDX"]] ||
    //		remoteValue[this.PORT_MAP["RainBowLED_COL"]] != lastRemoteValue[this.PORT_MAP["RainBowLED_COL"]]) {
    //		console.log("DIFF!" + remoteValue[this.PORT_MAP["RainBowLED_IDX"]] + " " + lastRemoteValue[this.PORT_MAP["RainBowLED_IDX"]]);


    //		console.log("COL" + remoteValue[this.PORT_MAP["RainBowLED_COL"]] + "/" + color);

    /*
    		console.log("remote:" + this.remoteCommandValue);
    		if(this.remoteCommandValue[this.PORT_MAP["RainBowLED_IDX"]] !== undefined && 
    			this.RainBowLedRgb[this.remoteCommandValue[this.PORT_MAP["RainBowLED_COL"]]]!== undefined) {
    			var args = new Array(4);
    			var color = this.RainBowLedRgb[this.remoteCommandValue[this.PORT_MAP["RainBowLED_COL"]]];
    			args[0] = this.remoteCommandValue[this.PORT_MAP["RainBowLED_IDX"]] -1;
    			args[1] =  color[0];
    			args[2] =  color[1];
    			args[3] =  color[2];
    			
    			this.encodeCommand(queryString, this.COMMAND_MAP["LED"], 4, args);
    			console.log("LED:" + args);
    		}*/

    if (this.remoteCommandValue[this.PORT_MAP["RainBowLED_1"]] !== undefined) {
        var args = new Array(4);
        var color = this.RainBowLedRgb[this.remoteCommandValue[this.PORT_MAP["RainBowLED_1"]]];

        delete this.remoteCommandValue[this.PORT_MAP["RainBowLED_1"]];

        args[0] = 0;
        args[1] = color[0];
        args[2] = color[1];
        args[3] = color[2];

        this.encodeCommand(queryString, this.COMMAND_MAP["LED"], 4, args);
        console.log("LED:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["RainBowLED_2"]] !== undefined) {
        var args = new Array(4);
        var color = this.RainBowLedRgb[this.remoteCommandValue[this.PORT_MAP["RainBowLED_2"]]];

        delete this.remoteCommandValue[this.PORT_MAP["RainBowLED_2"]];

        args[0] = 1;
        args[1] = color[0];
        args[2] = color[1];
        args[3] = color[2];

        this.encodeCommand(queryString, this.COMMAND_MAP["LED"], 4, args);
        console.log("LED:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["RainBowLED_3"]] !== undefined) {
        var args = new Array(4);
        var color = this.RainBowLedRgb[this.remoteCommandValue[this.PORT_MAP["RainBowLED_3"]]];

        delete this.remoteCommandValue[this.PORT_MAP["RainBowLED_3"]];

        args[0] = 2;
        args[1] = color[0];
        args[2] = color[1];
        args[3] = color[2];

        this.encodeCommand(queryString, this.COMMAND_MAP["LED"], 4, args);
        console.log("LED:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["ELED_IDX"]] !== undefined &&
        this.remoteCommandValue[this.PORT_MAP["ELED_R"]] !== undefined &&
        this.remoteCommandValue[this.PORT_MAP["ELED_G"]] !== undefined &&
        this.remoteCommandValue[this.PORT_MAP["ELED_B"]] !== undefined) {

        var args = new Array(4);
        args[0] = this.remoteCommandValue[this.PORT_MAP["ELED_IDX"]] - 1;
        args[1] = this.remoteCommandValue[this.PORT_MAP["ELED_R"]] * 8;
        args[2] = this.remoteCommandValue[this.PORT_MAP["ELED_G"]] * 8;
        args[3] = this.remoteCommandValue[this.PORT_MAP["ELED_B"]] * 8;

        delete this.remoteCommandValue[this.PORT_MAP["ELED_IDX"]];
        delete this.remoteCommandValue[this.PORT_MAP["ELED_R"]];
        delete this.remoteCommandValue[this.PORT_MAP["ELED_G"]];
        delete this.remoteCommandValue[this.PORT_MAP["ELED_B"]];

        this.encodeCommand(queryString, this.COMMAND_MAP["ELED"], 4, args);
        console.log("ELED:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["Servo1"]] !== undefined) {
        var args = new Array(2);
        args[0] = 1;
        args[1] = this.remoteCommandValue[this.PORT_MAP["Servo1"]];

        delete this.remoteCommandValue[this.PORT_MAP["Servo1"]];

        if (args[1] > 165) args[1] = 165;
        else if (args[1] < 15) args[1] = 15;

        this.encodeCommand(queryString, this.COMMAND_MAP["SERVO"], 2, args);
        console.log("SERVO:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["Servo2"]] !== undefined) {
        var args = new Array(2);
        args[0] = 2;
        args[1] = this.remoteCommandValue[this.PORT_MAP["Servo2"]];

        delete this.remoteCommandValue[this.PORT_MAP["Servo2"]];

        if (args[1] > 165) args[1] = 165;
        else if (args[1] < 15) args[1] = 15;

        this.encodeCommand(queryString, this.COMMAND_MAP["SERVO"], 2, args);
        console.log("SERVO:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["DC1_DIR"]] !== undefined) {
        var args = new Array(3);
        args[0] = 0;
        args[1] = this.remoteCommandValue[this.PORT_MAP["DC1_DIR"]] == 1 ? 1 : 0;
        args[2] = this.remoteCommandValue[this.PORT_MAP["DC1_SPEED"]];

        delete this.remoteCommandValue[this.PORT_MAP["DC1_DIR"]];
        delete this.remoteCommandValue[this.PORT_MAP["DC1_SPEED"]];

        this.encodeCommand(queryString, this.COMMAND_MAP["DC"], 3, args);
        console.log("DC:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["DC2_DIR"]] !== undefined) {
        var args = new Array(3);
        args[0] = 1;
        args[1] = this.remoteCommandValue[this.PORT_MAP["DC2_DIR"]] == 1 ? 1 : 0;
        args[2] = this.remoteCommandValue[this.PORT_MAP["DC2_SPEED"]];

        delete this.remoteCommandValue[this.PORT_MAP["DC2_DIR"]];
        delete this.remoteCommandValue[this.PORT_MAP["DC2_SPEED"]];

        this.encodeCommand(queryString, this.COMMAND_MAP["DC"], 3, args);
        console.log("DC:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["Melody"]] !== undefined) {
        var args = new Array(3);
        if (this.Melodies[this.remoteCommandValue[this.PORT_MAP["Melody"]]] !== undefined) {
            args[0] = 11;
            args[1] = this.Melodies[this.remoteCommandValue[this.PORT_MAP["Melody"]]];
            args[2] = 1000;

            delete this.remoteCommandValue[this.PORT_MAP["Melody"]];

            this.encodeCommand(queryString, this.COMMAND_MAP["TONE"], 3, args);
            //this.lastRemoteCommandValue[this.PORT_MAP["Melody"]] = this.remoteCommandValue[this.PORT_MAP["Melody"]];
        }
        console.log("MELODY:" + args);
    }

    if (this.remoteCommandValue[this.PORT_MAP["7SEG"]] !== undefined) {
        var args = new Array(1);
        args[0] = this.remoteCommandValue[this.PORT_MAP["7SEG"]];

        delete this.remoteCommandValue[this.PORT_MAP["7SEG"]];

        this.encodeCommand(queryString, this.COMMAND_MAP["SSEG"], 1, args);

        console.log("7SEG:" + args);
    }

    //		lastRemoteValue[this.PORT_MAP["RainBowLED_IDX"]] = remoteValue[this.PORT_MAP["RainBowLED_IDX"]];
    //		lastRemoteValue[this.PORT_MAP["RainBowLED_COL"]] = remoteValue[this.PORT_MAP["RainBowLED_COL"]];
    //	}
    //else {
    //	console.log("Any changes found..");
    //}

    if (this.isConSuccess == false) {
        queryString.push(0xCB);
        queryString.push(0x02);
        this.isConSuccess = true;
    }

    console.log("Query:" + queryString);
    return queryString;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer

    //console.log("handleLocalData" + data);
    if ((data.length % 3) !== 0)
        return;

    var numData = data.length / 3;

    //console.log("read size: " + data.length);
    for (var i = 0; i < numData; i++) {
        var chunk = data[i * 3];
        //console.log(chunk);
        var vallsb = data[i * 3 + 1];
        var valmsb = data[i * 3 + 2];

        if ((chunk & 0xE0) != 0xE0)
            continue;


        var port = chunk & 0xF;

        var value = (valmsb & 0x7F) << 7;
        value += vallsb & 0x7F;

        this.analogValue[port] = value;
        //console.log('data' + port + ':' + value);
    }
    //	console.log('data: ' + this.analogValue);
};

Module.prototype.requestRemoteData = function(handler) {
    //console.log("***4");

    for (var i = 0; i < this.analogValue.length; i++) {
        var value = this.analogValue[i];
        handler.write('a' + i, value);
    }
    for (var i = 0; i < this.digitalValue.length; i++) {
        var value = this.digitalValue[i];
        handler.write(i, value);
    }


    handler.write("airread1", (1023 - this.analogValue[0]));
    handler.write("airread2", (1023 - this.analogValue[1]));
    handler.write("ajoyx", (this.analogValue[0] < 300 ? -1 : this.analogValue[0] > 800 ? 1 : 0));
    handler.write("ajoyy", (this.analogValue[1] < 300 ? -1 : this.analogValue[1] > 800 ? 1 : 0));
    handler.write("asens1", (1023 - this.analogValue[2]));
    handler.write("asens2", (1023 - this.analogValue[3]));
    handler.write("apotenmeter", (this.analogValue[4]));
    handler.write("atouch", (this.analogValue[8]));
    handler.write("aultrason", (this.analogValue[6]));
    handler.write("atemps1", (21.5 + ((1023 - this.analogValue[2]) - 410) * 0.094));
    handler.write("atemps2", (21.5 + ((1023 - this.analogValue[3]) - 410) * 0.094));
    handler.write("abtn1", (this.analogValue[2] < 500 ? true : false));
    handler.write("abtn2", (this.analogValue[3] < 500 ? true : false));
    handler.write("alight1", (this.analogValue[2] / 100));
    handler.write("alight2", (this.analogValue[3] / 100));

    var tiltval = this.analogValue[7];
    if ((tiltval & 0x2000) == 0x2000) tiltval = 1;
    else if ((tiltval & 0x1000) == 0x1000) tiltval = 3;
    else if ((tiltval & 0x800) == 0x800) tiltval = 4;
    else if ((tiltval & 0x400) == 0x400) tiltval = 2;
    else tiltval = 0;

    handler.write("atilt", tiltval);
};

Module.prototype.reset = function() {
    //console.log("***5");
};

module.exports = new Module();
