const _ = require('lodash');
const BaseModule = require('./baseModule');

const FUNCTION_KEYS = {
    TEMP: 0x01,
    RESET: 0xfe,
};

const COMMAND_LIST = {
    LED_SET: 0x10,
    LED_CLR: 0x11,
    MOTOR_MOVE: 0x20,
    MOTOR_STOP: 0x21,
    GYRO_GET: 0x30,
    SOUND_PLAY: 0x40,
    SOUND_STOP: 0x41,
    SOUND_SET: 0x42,
    SOUND_GET: 0x43,
    SOUND_LIST: 0x44,
    SOUND_VOL: 0x45,
    ACTION_PLAY: 0x50,
    ACTION_STOP: 0x51,
    ACTION_SET: 0x52,
    ACTION_GET: 0x53,
    BLE_CON: 0x70,
    FILE_LIST: 0x80,
    FILE_GET: 0x81,
    FILE_SET: 0x82,
    FILE_DEL: 0x83,
    FILE_FOM: 0x84,        
};

class Armz extends BaseModule {
    constructor() {
        super();
				this.isConnect = false;        
        this.sendIndex = 0;
        this.sendBuffers = [];
        this.executeCount = 0;
        this.drainTime = 0;
        this.executeCheckList = [];
    }

    connect() {
        this.sp.write(this.makeData('CON'));			// connect is ok! say hello
    }

    socketReconnection() {
        this.socket.send(this.handler.encode());
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    setSocket(socket) {
        this.socket = socket;
    }
    
		//Send init data after connected (request connect)
    requestInitialData(sp) {
        this.isConnect = true;
        if (!this.sp) {
            this.sp = sp;
        }
        return this.makeData('REQ');    			
    }
    
		// Check data from hardware (for init connection)
    checkInitialData(data, config) {
        return true;
    }

		// Validate data from hardware (optional)
    validateLocalData(data) {
        return true;
    }

    // Data to Web Socket(entry) process 
    requestRemoteData(handler) {
    }

    // Data from Web Socket(entry) process 
    handleRemoteData({ receiveHandler = {} }) {
//    console.log('handleRemoteData');	
        const { data: handlerData } = receiveHandler;
        if (_.isEmpty(handlerData)) {
            return;
        }

        Object.keys(handlerData).forEach((id) => {
            const { type, data } = handlerData[id] || {};
            if (
                _.findIndex(this.sendBuffers, { id }) === -1 &&
                this.executeCheckList.indexOf(id) === -1
            ) {
                const sendData = this.makeData(type, data);
                this.sendBuffers.push({
                    id,
                    data: sendData,
                    index: this.executeCount,
                });
            }
        });
    }
    
		// Data to Hardware process 
    requestLocalData() {
        if (this.sendBuffers.length > 0) {        	
            const sendData = this.sendBuffers.shift();
            this.sp.write(sendData.data, () => {
                if (this.sp) {
                    this.sp.drain(() => {
                        this.executeCheckList[sendData.index] = sendData.id;
                    });
                }
            });
        }
//        console.count('write hardware');
        return;
    }

		// Data from Hardware process 
    handleLocalData(data) {
        const count = data[data.length - 3];
        const blockId = this.executeCheckList[count];
        if (blockId) {
            const socketData = this.handler.encode();
            socketData.blockId = blockId;
            this.setSocketData({
                data,
                socketData,
            });
            this.socket.send(socketData);
        }
    }

    setSocketData({ socketData, data }) {
        const key = data[2];
        let drainTime = 0;
        switch (key) {
            case FUNCTION_KEYS.TEMP: {
                drainTime = 0;
                break;
            }
            default:
                break;
        }

        setTimeout(() => {
            this.isDraing = true;
        }, drainTime);
    }

    makeData(key, data) {
        let returnData = new Buffer(59);
        let dummy_packet = new Buffer(20);
				
				console.log('key : ' + key);	

        switch (key) {
            case 'RUN_PLAY': {
                const { port, value } = data;
                var data0 = Number(value);
                var data1 = data0 >> 8;
                
                if (port === 'SOUND') {
                		dummy_packet.fill(Buffer([COMMAND_LIST.SOUND_PLAY,0x03,0x01,data0,data1]),0,5);
               
                } else if (port === 'ACTION') {
                		dummy_packet.fill(Buffer([COMMAND_LIST.ACTION_PLAY,0x06,0x01,0,data0,data1,0,0]),0,8);                	
		
                }
                break;
            }        	
            case 'RST':
            		dummy_packet.fill(Buffer([COMMAND_LIST.ACTION_STOP,0x02,0x01,0x00]),0,4);              
                break;
            case 'REQ':	{
            		dummy_packet.fill(Buffer([COMMAND_LIST.ACTION_PLAY,0x06,0x01,0x00,0x0f,0x00,0x00,0x00]),0,8);
                break;
            }
            case 'CON':	{
      //      		dummy_packet.fill(Buffer([COMMAND_LIST.ACTION_PLAY,0x06,0x01,0x00,0x0d,0x00,0x00,0x00]),0,8);            
            		dummy_packet.fill(Buffer([COMMAND_LIST.BLE_CON,0x02,0x01,0x01]),0,4);            
      
                break;
            }
            case 'BYE':	{
            		dummy_packet.fill(Buffer([COMMAND_LIST.SOUND_PLAY,0x03,0x01,0x05,0x00]),0,5);            
                break;
            }
            default:
                break;
        }

        const packet = dummy_packet.slice(0, (dummy_packet[1] + 2)); 
        const command = Buffer.concat([
            packet,
            this.makeCheckSum(packet),
        ]);
				return command;
    }

    makeCheckSum(buffer) {
        const bufferLength = buffer.length;
        var cs = 0;
        for (var i = 0; i < bufferLength; i++) {
        cs = cs + buffer[i]; 
      	}
        return Buffer([cs, 0x0a]);
    }

    getExecuteCount() {
        if (this.executeCount < 255) {
            this.executeCount++;
        } else {
            this.executeCount = 0;
        }
        return Buffer([this.executeCount]);
    }

    lostController() {}

    disconnect(connect) {
        if (this.isConnect) {
            this.isConnect = false;
		        this.sendBuffers = [];
  
            if (this.sp) {
                this.sp.write(
                    this.makeData('BYE'),		//action stop
                    (err) => {
                        /* nothing to do. disconnect command execute */
                    }
                );
            } 
            this.sp = null;
            connect.close();
        }    	
    }
    reset() {
        this.sp = null; 
    }
}

module.exports = new Armz(); 
