const BaseModule = require('./baseModule');

class cuboai extends BaseModule {
    constructor() {
        super();
        console.log('CUBO_DBG', 'CUBO AI Constructor()');
        this.sp = null;
        this.buffer = [];
        this.sendPacketQueue = [];
        this.sensorData = {
            p1: 0, p2: 0, p3: 0, p4: 0,
            p5: 0, p6: 0, rmc: 0
        };
        this.constants = {
            START_DELIMITER: 0x23,
            CMD_SET_ZERO: 0x00,
            CMD_GPIO_OUT: 0x80,
            CMD_SERVO_MOTOR: 0x81,
            CMD_DC_MOTOR_ALL_ON: 0x82,
            CMD_DC_MOTOR_OFF: 0x83,
            CMD_IN_KEYBOARD: 0x84,
            CMD_DC_MOTOR_1_ON: 0x85,
            CMD_DC_MOTOR_2_ON: 0x86,

            CMD_FLOW_COND_NUM: 0xB0,
            CMD_FLOW_COND_IF: 0xB1,
            CMD_FLOW_COND_IF_START: 0xB2,
            CMD_FLOW_COND_ELSE_START: 0xB3,
            CMD_FLOW_COND_IF_END: 0xB4,
            CMD_FLOW_LOOP_COND_START: 0xB5,
            CMD_FLOW_LOOP_COND_END: 0xB6,
            CMD_FLOW_LOOP_START: 0xB7,
            CMD_FLOW_LOOP_END: 0xB8,
            CMD_FLOW_LOOP_CNT_START: 0xB9,
            CMD_FLOW_LOOP_CNT_END: 0xBA,
            CMD_FLOW_LOOP_DELAY_SEC: 0xBB,
            CMD_FLOW_WRITE_VARIABLE: 0xBC,
            CMD_FLOW_READ_VARIABLE: 0xBD,
            CMD_FLOW_SET_VARIABLE: 0xBE,
            CMD_IOT_SERVO_MOTOR_ANGLE_VALUE: 0xBF,
            CMD_FLOW_LOOP_BREAK_CONTINUE: 0xC0,
            CMD_FLOW_JGMT_SIGN: 0xC1,
            CMD_FLOW_JGMT_BOOL: 0xC2,
            CMD_FLOW_JGMT_LOGIC: 0xC3,
            CMD_IOT_READ_REMOTE: 0xC4,
            CMD_IOT_DC_MOTOR_OFF: 0xC5,
            CMD_IOT_DC_MOTOR_SPEED: 0xC6,
            CMD_IOT_SERVO_MOTOR_ANGLE: 0xC7,
            CMD_IOT_DIGIT_OUTPUT: 0xC8,
            CMD_IOT_ANALOG_INPUT: 0xC9,
            CMD_IOT_DIGIT_INPUT: 0xCA,
            CMD_IOT_DC_MOTOR_1_ON: 0xCB,
            CMD_IOT_DC_MOTOR_2_ON: 0xCC,
            CMD_IOT_DC_ALL_MOTOR_VALUE: 0xCD,
            CMD_IOT_DC_MOTOR_1_VALUE: 0xCE,
            CMD_IOT_DC_MOTOR_2_VALUE: 0xCF,
            CMD_BLOCK_SAVE_START: 0xD0,
            CMD_BLOCK_SAVE_END: 0xD1,
        };
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
        if (!this.sp) {
            this.sp = sp;
        }
        return true;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        return true;
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        for(let i = 0; i<data.length; i++){
            this.buffer.push(data[i]);
        }
        while(this.buffer.length >= 11){
            if(this.buffer[0] !== 0x23){
                this.buffer.shift();
                continue;
            }
            if(this.buffer[1] == 0x08 && this.buffer[2] == 0x00){
                if(this.buffer.length >= 11){
                    const packet = this.buffer.slice(3, 11);
                    if(this.validateChecksum(packet)){
                        this.sensorData.p1 = packet[0];
                        this.sensorData.p2 = packet[1];
                        this.sensorData.p3 = packet[2];
                        this.sensorData.p4 = packet[3];
                        this.sensorData.p5 = packet[4];
                        this.sensorData.p6 = packet[5];
                        this.sensorData.rmc = packet[6];
                        //console.log("CUBO_DBG", "Valid Packet Parsed:", this.sensorData);   
                        this.buffer.splice(0, 11);            
                    }
                    else{
                        //console.log("CUBO_DBG", "Invalid Checksum, Packet Discarded:", packet);
                        this.buffer.shift();
                    }
                }
            }
            else{
                this.buffer.shift();
            }
            if (this.buffer.length > 100) {
                this.buffer = [];
            }
        }
    }

    // Web Socket(엔트리)에 전달할 데이터
    requestRemoteData(handler) {
        Object.keys(this.sensorData).forEach((key) => {
            handler.write(key, this.sensorData[key]);
        });
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        const setDict = handler.read('SET');
        if(!setDict) return;
        const sortedKeys = Object.keys(setDict).sort((a, b) => {
            const idxA = parseInt(a.split('_')[1] || 0);
            const idxB = parseInt(b.split('_')[1] || 0);
            return idxA - idxB;
        });
        sortedKeys.forEach((fullKey) => {
            const command = fullKey.split('_')[0];
            const currentDatas = setDict[fullKey];
            if (!currentDatas) return;
            const isDuplicate = this.sendPacketQueue.some(item => {
                return item.cmd === command && JSON.stringify(item.originalDatas) === JSON.stringify(currentDatas);
            });
            if (!isDuplicate) {
                const packet = this.processCommand(command, currentDatas);
                if (packet) {                   
                    this.sendPacketQueue.push({ 
                        cmd: command, 
                        packet: packet,
                        originalDatas: currentDatas
                    });
                }
            }
            // const packet = this.processCommand(command, currentDatas);
            // if (packet) {                   
            //     this.sendPacketQueue.push({ cmd: command, packet: packet });
        
            // }
            delete setDict[fullKey];
        });
    }

    processCommand(command, datas){
        const cmdKey = Number(command);
        let packet = null;
        let packet2 = null;
        switch(cmdKey){
            case this.constants.CMD_GPIO_OUT:
                packet = this.makePacket(cmdKey, datas.port, datas.value);
                break;
            case this.constants.CMD_DC_MOTOR_1_ON:
                packet = this.makePacket(cmdKey, datas.l1, datas.r1);
                break;
            case this.constants.CMD_DC_MOTOR_2_ON:
                packet = this.makePacket(cmdKey, datas.l2, datas.r2);
                break;
            case this.constants.CMD_DC_MOTOR_ALL_ON:
                packet = this.makePacket(cmdKey, datas.l1, datas.r1, datas.l2, datas.r2);
                break;
            case this.constants.CMD_SERVO_MOTOR:
                packet = this.makePacket(cmdKey, datas.port, datas.angle, datas.speed);               
                break;
            case this.constants.CMD_DC_MOTOR_OFF:
                packet = this.makePacket(cmdKey);
                break;
            case this.constants.CMD_IN_KEYBOARD:
                packet = this.makePacket(cmdKey, datas.value);;
                break;
            case this.constants.CMD_BLOCK_SAVE_START:
                packet = this.makePacket(cmdKey, datas.value);
                break;
            case this.constants.CMD_BLOCK_SAVE_END:
                packet = this.makePacket(cmdKey);
                break;
            case this.constants.CMD_IOT_SERVO_MOTOR_ANGLE:
                packet = this.makePacket(cmdKey, datas.port, datas.angle, datas.speed);
                break;
            case this.constants.CMD_IOT_DC_MOTOR_OFF:
                packet = this.makePacket(cmdKey);
                break;
            case this.constants.CMD_IOT_DC_MOTOR_SPEED:
                packet = this.makePacket(cmdKey, datas.l1, datas.r1, datas.l2, datas.r2);
                break;
            case this.constants.CMD_IOT_DC_ALL_MOTOR_VALUE:
                packet = this.makePacket(cmdKey, datas.l1, datas.r1, datas.l2, datas.r2);
                break;
            case this.constants.CMD_IOT_READ_REMOTE:
                packet = this.makePacket(cmdKey);            
                break;  
            case this.constants.CMD_IOT_DIGIT_OUTPUT:
                packet = this.makePacket(cmdKey, datas.port, datas.value);
                break;
            case this.constants.CMD_IOT_ANALOG_INPUT:
                packet = this.makePacket(cmdKey, datas.port);
                break;
            case this.constants.CMD_IOT_DIGIT_INPUT:
                packet = this.makePacket(cmdKey, datas.port);
                break;
            case this.constants.CMD_IOT_DC_MOTOR_1_ON:
                packet = this.makePacket(cmdKey, datas.l1, datas.r1);
                break;
            case this.constants.CMD_IOT_DC_MOTOR_1_VALUE:
                packet = this.makePacket(cmdKey, datas.l1, datas.r1);
                break;
            case this.constants.CMD_IOT_DC_MOTOR_2_ON:
                packet = this.makePacket(cmdKey, datas.l2, datas.r2);
                break;
            case this.constants.CMD_IOT_DC_MOTOR_2_VALUE:
                packet = this.makePacket(cmdKey, datas.l2, datas.r2);
                break;
            case this.constants.CMD_FLOW_WRITE_VARIABLE:
                packet = this.makePacket(cmdKey, datas.variable);
                break;
            case this.constants.CMD_FLOW_COND_NUM:
                packet = this.makePacket(cmdKey, datas.value);
                break;
            case this.constants.CMD_FLOW_SET_VARIABLE:
                packet = this.makePacket(cmdKey, datas.variable, datas.value, datas.calc);
                break;
            case this.constants.CMD_FLOW_COND_IF:
                packet = this.makePacket(cmdKey);
                break;
            case this.constants.CMD_FLOW_COND_IF_END:
                packet = this.makePacket(cmdKey);
                break;
            case this.constants.CMD_FLOW_COND_ELSE_START:
                packet = this.makePacket(cmdKey);
                break;
            case this.constants.CMD_FLOW_COND_IF_START:
                packet = this.makePacket(cmdKey);
                break;
            case this.constants.CMD_FLOW_LOOP_START:
                packet = this.makePacket(cmdKey);
                break;
            case this.constants.CMD_FLOW_LOOP_END:
                packet = this.makePacket(cmdKey);
                break;                
            case this.constants.CMD_FLOW_LOOP_CNT_START:
                packet = this.makePacket(cmdKey, datas.value);
                break;                
            case this.constants.CMD_FLOW_LOOP_CNT_END:
                packet = this.makePacket(cmdKey);
                break;                
            case this.constants.CMD_FLOW_LOOP_DELAY_SEC:
                packet = this.blockFlowLoopDelaySec(cmdKey, datas.type, datas.value);
                break;
            case this.constants.CMD_FLOW_LOOP_BREAK_CONTINUE:
                packet = this.makePacket(cmdKey, datas.value);
                break;
            case this.constants.CMD_FLOW_JGMT_SIGN:
                packet = this.makePacket(cmdKey, datas.jgmt);
                break;
            case this.constants.CMD_FLOW_JGMT_LOGIC:
                packet = this.makePacket(cmdKey, datas.value);
                break;
        }
        return packet;
    }
    
    makePacket(cmd, ...args) {
        const buf = [
            this.constants.START_DELIMITER, 
            args.length+1, 
            cmd, 
            ...args, 
            0
        ];
        return this.makeChecksum(buf);
    }
    blockFlowLoopDelaySec(cmd, type, sec){
        const buf = [this.constants.START_DELIMITER, 4, cmd, type, sec&0xFF, (sec>>8)&0xFF, 0];
        return this.makeChecksum(buf);
    }

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        const commands = Object.keys(this.sendPacketQueue);       
        if (commands.length === 0 || !this.sp) {
            return null;
        }
        //while (this.sendPacketQueue.length > 0) 
            {
            const item = this.sendPacketQueue.shift();
            if (item && item.packet) {
                console.log("CUBO_DBG", `Sending Packet for Command ${item.cmd} :`, item.packet);
                this.sp.write(item.packet);
            }
        }
        return null;
    }

    connect() {
        console.log("CUBO_DBG", "Cubo AI SweSocket Connected");
    }

    disconnect(connect) {
        console.log("CUBO_DBG", "Cubo AI SweSocket Disconnect");
        if(this.sp){
            try{
                const stopMotorPacket = this.makeStopMotorBuffer();
                this.sp.write(stopMotorPacket);
            } catch(e) {
                console.log("CUBO_DBG", "Error while sending stop motor packet:", e);
            }
            try{
                for(let i = 0; i<7; i++){
                    const lefOffPacket = this.makeDigitalWriteBuffer(i, 0);
                    this.sp.write(lefOffPacket);
                }
            } catch(e) {
                console.log("CUBO_DBG", "Error while sending digital write packets:", e);
            }
            this.delay(500);        //하드웨어 전송 시간 대기
            this.sp = null;
            connect.close();
        }
        else{
            connect.close();
        }
    }
    /**
     * 지정된 시간만큼 대기하는 유틸리티 메서드
     * @param {number} ms - 밀리초
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    reset() {}

    /**
     * 체크섬 확인 함수
     * 데이터 0~6번 바이트를 XOR 연산하여 7번 바이트(Checksum)와 비교합니다.
     */
    validateChecksum(data) {
        let cksum = 0;
        // 마지막 바이트(인덱스 7) 전까지 XOR 연산
        for (let i = 0; i < 7; i++) {
            cksum ^= data[i];
        }
        
        // 계산된 cksum이 데이터의 마지막 바이트와 일치하는지 확인
        return cksum === data[7];
    }
    makeChecksum(buf) {
        let cksum = 0;
        for (let i = 2; i < buf.length - 1; i++) {
            cksum ^= buf[i];
        }
        buf[buf.length - 1] = cksum;
        return buf;
    }
}

module.exports = new cuboai();
