const BaseModule = require('./baseModule');

/*
 PDU 정의
 */
const HEADER = [0xaa, 0xaa, 0xcc];
const IDX_LENGTH = 3;
const IDX_FRAME_CODE = 4;
const IDX_PDU_CODE = 5;
const IDX_ACK_NUM = 6;


const FrameCode = {
    BASIC: 0x01,
    CONNECTION: 0x02,
};

const PduConnectionCode = {
    MANUAL_PAIRING: 0x00,
    AUTO_PAIRING: 0x01,
    PAIRING_INFO: 0x03,
    PAIRING_REMOVE: 0x06,
    NOTIFY_LIVE: 0x07,
};

const PduBasicCode = {
    SENSOR_DATA: 0x01,
    CONTROLLER_CMD: 0x02,
    BASIC: 0x10,
    EXTEND_1: 0x11,
    EXTEND_2: 0x12,
    EXTEND_3: 0x13,
};

const SensorKind = {
    CONTROLLER: 0x00,
    ANALOG: 0x01,
    DIGITAL: 0x02,
    COLOR: 0x03,
};

const UnitId = {
    CONTROLLER: 0x00,
    CONTROLLER_IN1: 0x01,
    CONTROLLER_IN2: 0x02,
    CONTROLLER_IN3: 0x03,
    CONTROLLER_OUT1: 0x81,
    CONTROLLER_OUT2: 0x82,
    CONTROLLER_OUT12: 0x83,
    CONTROLLER_OUT3: 0x84,
    CONTROLLER_OUT123: 0x87,
};

class Neo extends BaseModule {
    constructor() {
        super();
        this.remainingPdu = []; // 패킷이 완전하지 않을 경우 병합을 위한 저장 버퍼
        this.sendToHw = []; // 하드웨어로 보낼 데이터

        this.pendingList = {}; // 실행 후 결과 대기중 리스트 : 리스트에서 없어지면 블럭 실행이 완료된 것으로 판단

        // for Debugging
        this.isDebug = process.env.NODE_ENV === 'development' | false;
        this.isDebugPdu = false; // 데이터양이 많으므로 PDU 검증시에만 true 할 것.
        this.isDebugSensor = false; // 데이터양이 많으므로 Sensor Parsing 검증시에만 true 할 것.

        this.sensorValues = {
            controllerBattery: 0,
            irCode: 0,
            in1Kind: 0,
            in1Values: [0, 0, 0, 0],
            in2Kind: 0,
            in2Values: [0, 0, 0, 0],
            in3Kind: 0,
            in3Values: [0, 0, 0, 0],
        };
    }

    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다.
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData() {
        return this.makePdu(this.getPairingInfoCmd());
    };

    /*
     연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
     패킷이 불완전하게 오는 경우가 있으므로 true 처리하고 handleLocalData 에서 무결성 확인함.
     */
    checkInitialData(pdu, config) {
        //this.logPdu(pdu);
        let validPdu = this.getValidPdu(pdu);
        while (validPdu) {
            this.onReceivePdu(validPdu);
            if (!this.remainingPdu || this.remainingPdu.length <= 0) {
                break;
            }
            validPdu = this.getValidPdu([]);
        }
        return true;
    };

    /*
     checkInitialData 와 같은 이유로 true 처리함.
     */
    validateLocalData(pdu) {
        //this.logPdu(pdu);
        return true;
    };

    /**
	 * 엔트리에서 받은 데이터에 대한 처리
	 * @param {*} handler
	 */
    handleRemoteData(handler) {
        const executeList = handler.serverData.executeList;

        const pendingKeys = Object.keys(this.pendingList);

        for (let idx = 0; idx < pendingKeys.length; idx++) {
            const blockId = pendingKeys[idx];
            if (Object.keys(executeList).indexOf(blockId.toString()) < 0) {
                delete this.pendingList[blockId];
            }
        }

        if (!executeList || executeList.length <= 0) {
            return;
        }

        const executeKeys = Object.keys(executeList);

        for (let idx = 0; idx < executeKeys.length; idx++) {
            const blockId = executeKeys[idx];
            const executeData = executeList[blockId];

            if (Object.keys(this.pendingList).indexOf(blockId.toString()) >= 0) {
                continue;
            }

            const pdu = executeData.pdu;
            if (!pdu) {
                continue;
            }

            if (this.isResetPdu(pdu)) {
                this.terminate(pdu);
            } else {
                this.startPendingResponse(blockId, pdu);
            }
        }
    }

    terminate(resetPdu) {
        this.pendingList = {};
        this.sendToHw = [resetPdu];
    }

    isResetPdu(pdu) {
        return pdu[IDX_FRAME_CODE] === 0x01 && pdu[IDX_PDU_CODE] === 0x02 &&
            pdu[IDX_ACK_NUM + 1] === 0x04;
    }

    startPendingResponse(blockId, pdu) {
        this.pendingList[blockId] = {
            state: 'executed',
            pdu,
        };

        this.sendToHw.push(pdu);
    }

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        if (this.sendToHw.length > 0) {
            // this.logPdu(this.sendToHw.length);
            const pdu = this.sendToHw.shift();
            this.logPdu(this.byteArrayToHex(pdu));
            return pdu;
        }
    };

    /**
	 * 하드웨어에서 온 데이터 처리
     * @param {ArrayBuffer} data
	 */
    handleLocalData(data) {
        // this.logPdu(`incoming pdu : ${this.byteArrayToHex(data)}`);
        let validPdu = this.getValidPdu(data);
        while (validPdu) {
            this.onReceivePdu(validPdu);
            if (!this.remainingPdu || this.remainingPdu.length <= 0) {
                break;
            }
            validPdu = this.getValidPdu([]);
        }
    };

    getValidPdu(pdu) {
        const mergedPdu = [];
        if (this.remainingPdu) {
            mergedPdu.push(...this.remainingPdu);
            this.remainingPdu = null;
        }
        mergedPdu.push(...pdu);
        if (mergedPdu.length < 4) {
            this.remainingPdu = [...mergedPdu];
            this.logPdu(`too short header : ${this.byteArrayToHex(mergedPdu)}`);
            return null;
        }

        // 헤더 불일치는 버림
        if (!this.checkHeader(mergedPdu)) {
            this.logPdu(`incorrect header : ${this.byteArrayToHex(mergedPdu)}`);
            return null;
        }

        // 유효 데이터 길이는 data length + header length (3) + length byte (1) + checksum byte (1)
        const validDataLength = mergedPdu[IDX_LENGTH] + HEADER.length + 1 + 1;
        /*
        전체 길이가 유효 데이터 길이보다 작을 경우
        아직 도착하지 않은 부분이 있으므로 병합을 위해 remainingPdu 에 저장
         */
        if (mergedPdu.length < validDataLength) {
            this.logPdu(`too short pdu : ${this.byteArrayToHex(mergedPdu)}`);
            this.remainingPdu = [...mergedPdu];
            this.logPdu(`remaining pdu : ${this.byteArrayToHex(this.remainingPdu)}`);
            return null;
        }

        /*
        전체 길이가 유효 데이터 길이보다 클 경우
        유효한 부분만 잘라내고 나머지는 remainingPdu 에 저장
         */
        if (mergedPdu.length > validDataLength) {
            this.logPdu(`too long pdu : ${this.byteArrayToHex(mergedPdu)}`);
            this.remainingPdu = mergedPdu.slice(validDataLength, mergedPdu.length);
            this.logPdu(`remaining pdu : ${this.byteArrayToHex(this.remainingPdu)}`);
        }

        const validPdu = mergedPdu.slice(0, validDataLength);
        //this.logPdu(`valid pdu : ${this.byteArrayToHex(validPdu)}`);

        /*
        유효 Pdu 의 checksum 확인
         */
        const dataLength = validPdu[IDX_LENGTH];
        let checkSum = 0;
        for (let i = 0; i < dataLength; i++) {
            checkSum += validPdu[i + 4];
        }
        checkSum = checkSum & 255;
        const pduCheckSum = validPdu[HEADER.length + 1 + dataLength];
        if (pduCheckSum !== checkSum) {
            this.logPdu(`checksum error : ${pduCheckSum} ${checkSum}`);
            return null;
        }

        if (validPdu[IDX_FRAME_CODE] === 0xFE) {
            this.logPdu('error data arrived!!');
        }

        return validPdu;
    }

    /**
     * 유효한 pdu 수신 처리함.
     * 센서 데이터 수신, Action Command 의 Response 만 처리함.
     * @param pdu
     */
    onReceivePdu(pdu) {
        if (pdu[IDX_FRAME_CODE] === FrameCode.BASIC) {
            if (pdu[IDX_PDU_CODE] === PduBasicCode.SENSOR_DATA) {
                // this.logPdu(this.byteArrayToHex(pdu));
                this.parseSensorPdu(pdu);
                return;
            }

            this.logPdu(this.byteArrayToHex(pdu));

            if (pdu[IDX_PDU_CODE] >= PduBasicCode.BASIC) {
                const responseData = this.parseResponsePdu(pdu);
                if (responseData && responseData.blockId) {
                    if (this.pendingList[responseData.blockId]) {
                        this.pendingList[responseData.blockId].state = 'completed';
                    }
                }
            }
        }
    }

    /**
     * Sensor Pdu 처리
     * @param pdu
     */
    parseSensorPdu(pdu) {
        let body = pdu.slice(IDX_PDU_CODE + 1, pdu.length - 1);
        this.logSensor(`sensor pdu : ${this.byteArrayToHex(body)}`);
        while (body && body.length > 0) {
            const sensorDataKind = body[0];
            const unitId = body[1];
            const valueLength = body[2];
            const value = body.slice(3, 3 + valueLength);
            if (sensorDataKind === SensorKind.CONTROLLER) {
                if (unitId === UnitId.CONTROLLER) {
                    this.sensorValues.irCode = new Buffer(value.slice(2, 4)).readInt16LE();
                    this.sensorValues.controllerBattery = new Buffer(value.slice(4, 6)).readInt16LE();
                }
            }
            if (sensorDataKind === SensorKind.ANALOG) {
                const analogValue = new Buffer(value.slice(0, 2)).readInt16LE();
                if (unitId === UnitId.CONTROLLER_IN1) {
                    this.sensorValues.in1Values = [analogValue, 0, 0, 0];
                } else if (unitId === UnitId.CONTROLLER_IN2) {
                    this.sensorValues.in2Values = [analogValue, 0, 0, 0];
                } else if (unitId === UnitId.CONTROLLER_IN3) {
                    this.sensorValues.in3Values = [analogValue, 0, 0, 0];
                }
            } else if (sensorDataKind === SensorKind.DIGITAL || sensorDataKind === SensorKind.COLOR) {
                const value1 = new Buffer(value.slice(0, 2)).readInt16LE();
                const value2 = new Buffer(value.slice(2, 4)).readInt16LE();
                const value3 = new Buffer(value.slice(4, 6)).readInt16LE();
                const value4 = new Buffer(value.slice(6, 8)).readInt16LE();
                if (unitId === UnitId.CONTROLLER_IN1) {
                    this.sensorValues.in1Values = [value1, value2, value3, value4];
                } else if (unitId === UnitId.CONTROLLER_IN2) {
                    this.sensorValues.in2Values = [value1, value2, value3, value4];
                } else if (unitId === UnitId.CONTROLLER_IN3) {
                    this.sensorValues.in3Values = [value1, value2, value3, value4];
                }
            }
            body = body.slice(3 + valueLength, body.length);
        }
        this.logSensor(`sensor data : ${JSON.stringify(this.sensorValues)}`);
    }

    /**
     * 응답 Pdu 처리
     * @param pdu
     * @return {{blockId, result}}
     */
    parseResponsePdu(pdu) {
        return {
            blockId: pdu[IDX_ACK_NUM],
            result: pdu[IDX_ACK_NUM + 1],
        };
    }

    /**
	 * 엔트리로 전달할 데이터
     * @param {*} handler
	 */
    requestRemoteData(handler) {
        handler.write('sensor', this.sensorValues);
        handler.write('pendingList', this.pendingList);
        //
        handler.write('IN11', this.sensorValues.in1Values[0]);
        handler.write('IN12', this.sensorValues.in1Values[1]);
        handler.write('IN13', this.sensorValues.in1Values[2]);
        handler.write('IN14', this.sensorValues.in1Values[3]);
        handler.write('IN21', this.sensorValues.in2Values[0]);
        handler.write('IN22', this.sensorValues.in2Values[1]);
        handler.write('IN23', this.sensorValues.in2Values[2]);
        handler.write('IN24', this.sensorValues.in2Values[3]);
        handler.write('IN31', this.sensorValues.in3Values[0]);
        handler.write('IN32', this.sensorValues.in3Values[1]);
        handler.write('IN33', this.sensorValues.in3Values[2]);
        handler.write('IN34', this.sensorValues.in3Values[3]);
        handler.write('IR', this.sensorValues.irCode);
        handler.write('BAT', this.sensorValues.controllerBattery);
    };

    /**
     * 페어링 정보 요청 command (handshake 로 사용)
     * @return {Array} Pairing Info command
     */
    getPairingInfoCmd() {
        return [2, FrameCode.CONNECTION, PduConnectionCode.PAIRING_INFO];
    }

    /**
     * Command Data 를 Validated Pdu 로 변환 (header, checksum 추가)
     * @param data
     * @return {Array} validated pdu
     */
    makePdu(data) {
        return [
            ...HEADER,
            ...data,
            this.getCheckSum(data),
        ];
    }

    /**
     * checkSum 구하기 (command 의 0 index (length) 를 제외한 나머지 값의 합)
     * @param data
     * @return {number} checkSum
     */
    getCheckSum(data) {
        let checkSum = 0;
        for (let i = 1; i < data.length; i++) {
            checkSum += data[i];
        }
        return checkSum & 255;
    }

    /**
     * pdu 길이 확인
     * 전체 길이는 pdu[3] data length + header(3) + length byte(1) + checkSum byte(1)
     * @param pdu
     * @return {boolean} result
     */
    checkPduLength(pdu) {
        const dataLength = pdu[IDX_LENGTH];
        return pdu.length >= dataLength + HEADER.length + 1 + 1;
    }

    /**
     * pdu 의 시작이 HEADER 와 일치하는지 확인
     * @param pdu
     * @return {boolean} result
     */
    checkHeader(pdu) {
        if (pdu.length < HEADER.length) {
            return false;
        }

        for (let i = 0; i < HEADER.length; i++) {
            if (HEADER[i] !== pdu[i]) {
                return false;
            }
        }

        return true;
    }

    /*
     Functions for logging
     */
    logD(msg) {
        if (this.isDebug) {
            console.log(msg);
        }
    }

    logPdu(msg) {
        if (this.isDebugPdu) {
            this.logD(msg);
        }
    }

    logSensor(msg) {
        if (this.isDebugSensor) {
            this.logD(msg);
        }
    }

    byteArrayToHex(data) {
        let hexStr = '';
        for (let i = 0; i < data.length; i++) {
            hexStr += this.byteToHexString(data[i]);
            hexStr += ' ';
        }
        return hexStr;
    }

    byteToHexString(byte) {
        return (`0${byte.toString(16)}`).slice(-2).toUpperCase();
    }

    getCurrentTime() {
        const date = new Date();
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getMilliseconds()}`;
    }
}
module.exports = new Neo();
