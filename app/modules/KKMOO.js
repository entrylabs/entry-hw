const BaseModule = require('./baseModule');
const _ = global.$;

class KKMOO extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();

        this.sendToEntry = "";
        this.receiveData;
        this.isReceived = false;
        this.isReceived_old = false;
        this.isPlaying = false;
        this.isPlaying_old = false;
        this.cmdProc = "";
        this.sendBuffer = [];
        this.buffercnt = 0;

        // ...
    }
    /*
   최초에 커넥션이 이루어진 후의 초기 설정.
   handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
   config 은 module.json 오브젝트입니다.
   */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
        this.isReceived = false;
        this.isReceived_old = false;
    }
    setSerialPort(sp) {
        this.sp = sp;
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData(sp) {
        if (!this.isConnect) {
            this.isConnect = true;
            if (!this.sp) {
                this.sp = sp;
            }
            const initTX = Buffer.from("^ET");
            sp.write(initTX);
        }
        return null;
    }


    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        return true;
    }
    handleLocalData(data) {
        const received = data.toString("ascii");
        if (received.includes('entry:')) {
            if (received.includes('true')) {
                this.isPlaying = 'true';
            }
            else {
                this.isPlaying = 'false';
            }
        }
        if (received.includes('ATfinRobot')) {
            //console.log("ATfinRobot");
            this.buffercnt++;
            if (this.sendBuffer[this.buffercnt] != null) {
                this.sp.write(Buffer.from(this.sendBuffer[this.buffercnt]));
            }
        }
    }
    requestRemoteData(handler) {
        handler.write('data', this.isPlaying);
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        if (Object.keys(handler.read('msg')).length === 0) {
            this.isReceived = false;
        }
        else {
            this.isReceived = true;
        }
        if (this.isReceived != this.isReceived_old && this.isReceived == true) {
            this.received = true;
            this.receiveData = handler.read('msg');
        }
        this.isReceived_old = this.isReceived;
    }

    requestLocalData() {
        if (this.received) {
            this.received = false;
            switch (this.receiveData.prot) {
                case "RT":
                    var data = this.receiveData;
                    this.isReceived = false;
                    this.isReceived_old = false;
                    return;
                case "EC":
                    var msg = "";
                    var data = this.receiveData.data;
                    var motnum = parseInt(data.MOT);
                    var angle = parseInt(data.ANG);
                    angle *= 10;
                    if (angle < 0) {
                        angle = 4096 + angle;
                    }
                    motnum = motnum.toString(16).padStart(2, '0');
                    msg += motnum;
                    angle = angle.toString(16).padStart(3, '0');
                    msg += angle;

                    var cmd = "^AN" + msg;
                    //this.sp.write(Buffer.from(cmd));
                    //console.log(cmd);
                    return cmd;
                case "IR":
                    var cmd = "^ir"
                    return cmd;
                case "PM":
                    var msg = "";
                    var slot = parseInt(this.receiveData.data);
                    msg = slot.toString(16).padStart(2, '0');
                    var cmd = "$PM" + msg;
                    return cmd;
                case "CM":
                    var msg = "";
                    var slot = parseInt(this.receiveData.data) + 90;
                    msg = slot.toString(16).padStart(2, '0');
                    var cmd = "$PM" + msg;
                    return cmd;
                case "AD":
                    var msg = "";
                    var data = this.receiveData.data;
                    var motnum = parseInt(data.MOT);
                    var angle = parseInt(data.ANG);
                    var time = parseInt(data.TME);
                    angle *= 10;
                    if (angle < 0) {
                        angle = 4096 + angle;
                    }
                    motnum = motnum.toString(16).padStart(2, '0');
                    msg += motnum;
                    angle = angle.toString(16).padStart(3, '0');
                    msg += angle;
                    time = time.toString(16).padStart(4, '0');
                    msg += time;
                    var cmd = "^ad" + msg;
                    return cmd;
                case "MP":
                    var msg = "00";
                    var data = this.receiveData.data;
                    var time = parseInt(data.pop());
                    for (var i of data) {
                        var angle = parseInt(i.ANG);
                        angle *= 10;
                        if (angle < 0) {
                            angle = 4096 + angle;
                            msg += "f" + angle.toString(16).padStart(3, '0');
                        }
                        else {
                            msg += "0" + angle.toString(16).padStart(3, '0');
                        }

                        if (i.MOT == 8 || i.MOT == 17) {
                            msg += "000000000000";
                        }
                    }
                    var cmd = "*mf" + msg;
                    this.sp.write(Buffer.from(cmd));
                    this.sp.write("*mt00" + Buffer.from(time.toString(16).padStart(4, '0')));
                    var cmd = "*pm01"
                    return cmd;
                case "PT":
                    this.buffercnt = 0;
                    this.sendBuffer = [];
                    var frame = 0;
                    var data = this.receiveData.data;
                    for (var i of data) {
                        var msg = "";
                        for (var key in i.data) {
                            var angle = parseInt(i.data[key].angle);
                            angle *= 10;
                            if (angle < 0) {
                                angle = 4096 + angle;
                                msg += "f" + angle.toString(16).padStart(3, '0');
                            }
                            else {
                                msg += "0" + angle.toString(16).padStart(3, '0');
                            }
                            if (key == 8 || key == 17) {
                                msg += "000000000000";
                            }
                        }
                        msg = "*mf" + frame.toString(16).padStart(2, '0') + msg;
                        var cmd_msg = msg;
                        var time = parseInt(i.time);
                        var cmd_time = "*mt" + frame.toString(16).padStart(2, '0') + Buffer.from(time.toString(16).padStart(4, '0'));
                        frame++;
                        this.sendBuffer.push(cmd_msg);
                        this.sendBuffer.push(cmd_time);

                        //this.sp.write(Buffer.from(cmd_msg));
                        //console.log(cmd_msg);
                        //this.sp.write(Buffer.from(cmd_time));
                        //console.log(cmd_time);
                    }
                    if (frame > 0) {
                        var pm = "*pm" + frame.toString(16).padStart(2, '0');
                        this.sendBuffer.push(pm);
                        var _this = this;
                        for (let i in this.sendBuffer) {
                            setTimeout(() =>
                                _this.sp.write(Buffer.from(_this.sendBuffer[i]))
                                , 20 * i);
                        }
                        return;
                    }
                    else {
                        return;
                    }
                case "SV":
                    this.buffercnt = 0;
                    this.sendBuffer = [];
                    var _frame = 0;
                    var data = this.receiveData.data;
                    var _slot = this.receiveData.slot;
                    var slot = (parseInt(_slot) + 90).toString(16).padStart(2, '0');
                    var _name = this.receiveData.name;
                    if (data.length > 0) {
                        var framelength = data.length.toString(16).padStart(2, '0');
                        var cmd_header = ">mh" + slot + _name + '00000000000' + framelength;
                        this.sendBuffer.push(cmd_header);
                        //this.sp.write(Buffer.from(cmd_header));
                        for (var i of data) {
                            var msg = "";
                            for (var key in i.data) {
                                var angle = parseInt(i.data[key].angle);
                                angle *= 10;
                                if (angle < 0) {
                                    angle = 4096 + angle;
                                    msg += "f" + angle.toString(16).padStart(3, '0');
                                }
                                else {
                                    msg += "0" + angle.toString(16).padStart(3, '0');
                                }
                                if (key == 8 || key == 17) {
                                    msg += "000000000000";
                                }
                            }
                            var time = parseInt(i.time).toString(16).padStart(4, '0');
                            frame = _frame.toString(16).padStart(2, '0');
                            var cmd_frame = ">mf" + slot + frame + time + msg;
                            _frame++;
                            this.sendBuffer.push(cmd_frame);
                            //this.sp.write(Buffer.from(cmd_frame));
                        }
                        var cmd_hash = ">hs" + slot + this.receiveData.hash;
                        this.sendBuffer.push(cmd_hash);
                        return this.sendBuffer[0];
                    }
                    else {
                        return;
                    }
            }
        }
        this.receiveData = null;

    }
    disconnect(connect) {
        var cmd = "^ce";
        this.sp.write(Buffer.from(cmd));
        setTimeout(() => {
            connect.close();
        }, 500);
        this.isConnect = false;
    }
    lostController() { }

    reset() {
        //console.log("reset");
    }

}
module.exports = new KKMOO();
