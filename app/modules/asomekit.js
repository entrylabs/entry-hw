const _ = global.$;
const BaseModule = require('./baseModule');

class AsomeKit extends BaseModule {
    constructor() {
        super();

        this.isDraing = false;
        this.sendBuffer = [];

        this.receivedText = "";

        this.msg_id = '';
        this.sendToEntry = {
            msg_id: "",
            bt_value: 0,
            cm: 0,
            humidity: 0,
            temperature: 0,
            light: 0,
            vibration: 0,
            sound: 0,
            udp_msg: "",
        };
    }

    connect() {
    }

    socketReconnection() {
        this.socket.send(this.handler.encode());
    }

    requestInitialData() { 
        console.log("requestInitialData");

        var init_str = "import button;";
//        var init_str = "import button; import music; import dht11; import tm1637; import vibration_sensor; import hcsr04; light = AnalogPin(1); vs = vibration_sensor.create(1, 1000); tm1637.open(3, 4); ht = dht11.create(5); bt = button.create(6); hcsr04.open(7, 8); buzzer = OutputPin(11); music.open(12);";
        return Buffer.from(init_str, "ascii");
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    setSocket(socket) {
        this.socket = socket;
    }
    
    checkInitialData(data, config) {
        return true;
    }

    validateLocalData(data) {
        return true;
    }

    requestRemoteData(handler) {
        var sendToEntry = this.sendToEntry;
        // console.log("to Entry: ", sendToEntry);

        for (var key in sendToEntry) {
            handler.write(key, sendToEntry[key]);
        }
        return;
    }

    handleRemoteData({ receiveHandler = {} }) {
        const { data: handlerData } = receiveHandler;
        if (_.isEmpty(handlerData)) {
            return;
        }

        if (handlerData.msg_id == undefined) {
            console.log("from handlerData.msg_id == undefined", handlerData);
            return;
        }

        if (handlerData.msg_id != this.msg_id) {
            console.log("from Entry: ", handlerData);

            this.msg_id = handlerData.msg_id;
            this.sendBuffer.push(Buffer.from(handlerData.msg + "\r", 'ascii'));
            this.sendBuffer.push(Buffer.from("'#I'" + "'D " + handlerData.msg_id + "'\r", 'ascii'));
        }
    }

    requestLocalData() {
        var self = this;

        if (!this.isDraing && this.sendBuffer.length > 0) {
            this.isDraing = true;
            var msg = this.sendBuffer.shift();
            console.log("to AsomeBot: ", msg.toString(), this.sendBuffer.length);
            this.sp.write(msg, function() {
                if (self.sp) {
                    self.sp.drain(function() {
                        self.isDraing = false;
                    });
                }
            });
        }

        return null;
    }

    handleLocalData(data) {
//         console.log("handleLocalData: ", this.receivedText);

        this.receivedText = this.receivedText + data.toString();

        var index = this.receivedText.indexOf('\r');
        while (index >= 0) {
            var line = this.receivedText.substring(0, index);
            this.receivedText = this.receivedText.substring(index + 1);

            console.log("from AsomeBot: ", line);

            if (line.indexOf('#BT') >= 0) {
                var values = line.split(" ");
                if (values.length > 1) this.sendToEntry.bt_value = values[1];
            }
            if (line.indexOf('#CM') >= 0) {
                var values = line.split(" ");
                if (values.length > 1) this.sendToEntry.cm = values[1];
            }
            if (line.indexOf('#HD') >= 0) {
                var values = line.split(" ");
                if (values.length > 1) this.sendToEntry.humidity = values[1];
            }
            if (line.indexOf('#TP') >= 0) {
                var values = line.split(" ");
                if (values.length > 1) this.sendToEntry.temperature = values[1];
            }
            if (line.indexOf('#BN') >= 0) {
                var values = line.split(" ");
                if (values.length > 1) this.sendToEntry.light = values[1];
            }
            if (line.indexOf('#VT') >= 0) {
                var values = line.split(" ");
                if (values.length > 1) {
                    if (values[1] == 'False') {
                        this.sendToEntry.vibration = 0;
                    } else {this.sendToEntry.vibration = 1;}
                }
            }
            if (line.indexOf('#SO') >= 0) {
                var values = line.split(" ");
                if (values.length > 1) this.sendToEntry.sound = values[1];
            }
            if (line.indexOf('#UDP') >= 0) {
                var values = line.split(" ");
                if (values.length > 1) {
                    this.sendToEntry.udp_id = this.msg_id;
                    this.sendToEntry.udp_msg = values[1];
                }
            }
            if (line.indexOf('#ID') >= 0) this.sendToEntry.msg_id = line;

            index = this.receivedText.indexOf('\r');
        }
    }

    setSocketData({ socketData, data }) {
    }

    lostController() { }

    disconnect(connect) {
        connect.close();
        this.sp = null;
    }

    reset() {
        this.sp = null;
        this.sendBuffer = [];
        this.receivedText = "";
    }
}

module.exports = new AsomeKit();
