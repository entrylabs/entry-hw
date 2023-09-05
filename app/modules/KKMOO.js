const BaseModule = require('./baseModule');
const _ = global.$;

class KKMOO extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
        
        this.sendToEntry = "";
        this.receiveData;
        this.isReceived = false;
        this.isPlaying = false;
        this.isPlaying_old = false;
        this.cmdProc = "";
        this.sendBuffer = [];
        this.test = 0;
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
        if(received.includes("entry:")){
            if(received.includes("true")){
                this.isPlaying = "true";
            }
            else {
                this.isPlaying = "false";
            }
        }
    }
    requestRemoteData(handler) {
        handler.write("data",this.isPlaying);
        /*if(this.isPlaying != this.isPlaying_old){
            this.isPlaying_old = this.isPlaying;
            handler.write("data",this.isPlaying);            
        }*/
    }
    
    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        if(handler.serverData != null){
            this.receiveData = handler.read('msg');
        }
        else{
            this.receiveData = null;
        }
    }

    requestLocalData(){
        if(this.receiveData != null){
            switch(this.receiveData.prot){
                case "EC":
                    var msg = "";
                    var data = this.receiveData.data;
                    var motnum = parseInt(data.MOT);
                    var angle = parseInt(data.ANG);
                    angle *= 10;
                    if(angle<0){
                        angle = 4096+angle;
                    }
                    motnum = motnum.toString(16).padStart(2,'0')
                    msg+=motnum;
                    angle = angle.toString(16).padStart(3,'0')
                    msg+=angle;
                    
                    var cmd = "^AN"+msg;
                    this.sp.write(Buffer.from(cmd));
                    this.sp.flush()
                    console.log(cmd);
    
                    break;
                case "IR":
                    //console.log("!!!!!!!!!!!!ir!!!!!!!!!!!");
                    var cmd = "^ir"
                    this.sp.write(Buffer.from(cmd))
                    break;
                case "PM":
                    var msg = "";
                    var slot = parseInt(this.receiveData.data);
                    msg = slot.toString(16).padStart(2,'0');
                    var cmd = "$PM"+msg;
                    this.sp.write(Buffer.from(cmd));
                    break;
                case "CM":
                    var msg = "";
                    var slot = parseInt(this.receiveData.data)+90;
                    msg = slot.toString(16).padStart(2,'0');
                    var cmd = "$PM"+msg;
                    this.sp.write(Buffer.from(cmd));
                    break;
                case "AD":
                    var msg = "";
                    var data = this.receiveData.data;
                    var motnum = parseInt(data.MOT);
                    var angle = parseInt(data.ANG);
                    var time = parseInt(data.TME);
                    angle *=10;
                    if(angle<0){
                        angle = 4096+angle;
                    }
                    motnum = motnum.toString(16).padStart(2,'0');
                    msg+=motnum;
                    angle = angle.toString(16).padStart(3,'0');
                    msg+=angle;
                    time = time.toString(16).padStart(4,'0');
                    msg += time;
                    var cmd = "^ad"+msg;
                    this.sp.write(Buffer.from(cmd));
                    break;
            }
        }
        this.receiveData = null;
        
    }
    disconnect(connect){
        var cmd = "^ce";
        this.sp.write(Buffer.from(cmd));
        setTimeout(()=>{
            connect.close();
        },500); 
        this.isConnect = false;
        }
    lostController() { }

  

}

module.exports = new KKMOO();
