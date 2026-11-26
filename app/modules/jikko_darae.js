const BaseModule = require('./baseModule');

// =============================================================================
// 1. 다래보드 하드웨어 모듈 초기화 및 프로토콜 정의
// =============================================================================
class JikkoDarae extends BaseModule {
    constructor() {
        super();

        this.sp = null;
        this.sendBuffers = [];
        this.recvBuffers = [];
        this.isDraing = false;

        this.entrySensorTypes = {
            DIGITAL: 0x01,
            ANALOG: 0x02,
            WIFI: 0x0d,
            GYRO: 0x0e,
            OPTICAL: 0x0f,
            IR_DISTANCE: 0x10,
        };

        this.protocol = {
            HEADER_1: 0xff,
            HEADER_2: 0xfd,
            READ_PIN_MASK: 0x40,
            GLOBAL: 0xff,
            ...this.entrySensorTypes,
        };

        this.sensorDatas = this.makeDefaultSensorDatas();
        this.lastProcessedPacketSignature = null;
        this.lastRemotePacketKey = null;
        this.wifiDatas = this.makeDefaultWifiDatas();
        this.extendedSensorDatas = this.makeDefaultExtendedSensorDatas();
        this.lastReadPortByCommand = {};
    }

    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    requestInitialData(sp) {
        if (sp) {
            this.sp = sp;
            if (typeof this.sp.set === 'function') {
                this.sp.set({ dtr: false, rts: true });
                this.sp.set({ dtr: false, rts: false });
            }
        }

        // 제어 전용 모드: 연결할 때 센서 읽기 또는 시동 명령을 자동으로 보내지 않는다.
        return null;
    }

    checkInitialData() {
        return true;
    }

    validateLocalData() {
        return true;
    }

    afterConnect(that, cb) {
        that.connected = true;
        if (cb) {
            cb('connected');
        }
    }

    lostController() {}

    disconnect(connect) {
        if (connect && typeof connect.close === 'function') {
            connect.close();
        }
        this.sp = null;
        this.sendBuffers = [];
        this.recvBuffers = [];
    }

    canShowCustomButton() {
        return true;
    }

    customButtonClicked(key) {
        // 현재 사용자 버튼은 별도 명령을 사용하지 않는다.
        void key;
    }

    reset() {
        this.sendBuffers = [];
        this.recvBuffers = [];
        this.sensorDatas = this.makeDefaultSensorDatas();
        this.lastProcessedPacketSignature = null;
        this.lastRemotePacketKey = null;
        this.wifiDatas = this.makeDefaultWifiDatas();
        this.extendedSensorDatas = this.makeDefaultExtendedSensorDatas();
        this.lastReadPortByCommand = {};
    }

    makeDefaultSensorDatas() {
        return {
            DIGITAL: {
                32: 0,
                33: 0,
            },
            ANALOG: {
                32: 0,
                33: 0,
            },
            32: 0,
            33: 0,
            A32: 0,
            A33: 0,
        };
    }

    makeDefaultWifiDatas() {
        return {
            WIFI_ROLL: 0,
            WIFI_PITCH: 0,
            WIFI_YAW: 0,
            WIFI_THROTTLE: 0,
            WIFI_ARMING: 0,
            WIFI_RGB_PIN: 0,
            WIFI_RGB_R: 0,
            WIFI_RGB_G: 0,
            WIFI_RGB_B: 0,
        };
    }

    makeDefaultExtendedSensorDatas() {
        return {
            GYRO_acceleration_X: 0,
            GYRO_acceleration_Y: 0,
            GYRO_acceleration_Z: 0,
            GYRO_angularVelocity_X: 0,
            GYRO_angularVelocity_Y: 0,
            GYRO_angularVelocity_Z: 0,
            GYRO_ANGLE_X: 0,
            GYRO_ANGLE_Y: 0,
            GYRO_TEMPERATURE: 0,
            OPTICAL_X: 0,
            OPTICAL_Y: 0,
            IR_DISTANCE: 0,
        };
    }

    // =============================================================================
    // 2. JS 데이터 변환 및 Entry 프로토콜 프레임 생성
    // =============================================================================
    readInt16LE(params, offset) {
        if (offset + 1 >= params.length) {
            return null;
        }
        const value = params[offset] | (params[offset + 1] << 8);
        return value & 0x8000 ? value - 0x10000 : value;
    }

    readUInt16LE(params, offset) {
        if (offset + 1 >= params.length) {
            return null;
        }
        return params[offset] | (params[offset + 1] << 8);
    }

    updateExtendedSensorData(params) {
        const device = params[0];
        if (device === this.protocol.GYRO && params.length >= 19) {
            const keys = [
                'GYRO_acceleration_X',
                'GYRO_acceleration_Y',
                'GYRO_acceleration_Z',
                'GYRO_angularVelocity_X',
                'GYRO_angularVelocity_Y',
                'GYRO_angularVelocity_Z',
                'GYRO_ANGLE_X',
                'GYRO_ANGLE_Y',
                'GYRO_TEMPERATURE',
            ];
            keys.forEach((key, index) => {
                this.extendedSensorDatas[key] = this.readInt16LE(params, 1 + index * 2);
            });
        } else if (device === this.protocol.OPTICAL && params.length >= 5) {
            this.extendedSensorDatas.OPTICAL_X = this.readInt16LE(params, 1);
            this.extendedSensorDatas.OPTICAL_Y = this.readInt16LE(params, 3);
        } else if (device === this.protocol.IR_DISTANCE && params.length >= 3) {
            this.extendedSensorDatas.IR_DISTANCE = this.readUInt16LE(params, 1);
        }
    }

    updatePinData(entryPin, device, value) {
        const pin = Number(entryPin);
        const pinKey = String(pin);
        this.sensorDatas[pinKey] = value;
        if (device === this.protocol.DIGITAL) {
            this.sensorDatas.DIGITAL[pin] = value;
            this.sensorDatas[`digital_${pin}`] = value;
        } else if (device === this.protocol.ANALOG) {
            this.sensorDatas.ANALOG[pin] = value;
            this.sensorDatas[`A${pin}`] = value;
            this.sensorDatas[`analog_${pin}`] = value;
        }
    }

    toByte(value, defaultValue = 0) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return defaultValue;
        }

        return Math.max(0, Math.min(255, Math.round(number)));
    }

    firmwarePinToEntryPin(pin) {
        const number = Number(pin);
        if (number === 2) {
            return 32;
        }
        if (number === 3) {
            return 33;
        }
        return this.toByte(number);
    }

    calcrc(buffer) {
        let crc = 0xffff;

        for (let index = 0; index < buffer.length; index += 1) {
            crc ^= buffer[index];
            for (let bit = 0; bit < 8; bit += 1) {
                crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
            }
        }

        return crc & 0xffff;
    }

    // =============================================================================
    // 3. EntryJS에서 받은 블록 데이터를 펌웨어 전송 대기열로 변환
    // =============================================================================
    handleRemoteData(handler) {
        const readData = handler.read('SET');
        if (!readData) {
            return;
        }

        if (Array.isArray(readData.packet)) {
            const remotePacketKey = `${readData.time || 0}:${readData.packet.join(',')}`;
            if (remotePacketKey === this.lastRemotePacketKey) {
                return;
            }
            this.lastRemotePacketKey = remotePacketKey;
            const instruction = this.toByte(readData.instruction);
            if ((instruction & this.protocol.READ_PIN_MASK) !== 0 && instruction !== 0xff) {
                this.lastReadPortByCommand[instruction] = this.firmwarePinToEntryPin(
                    instruction & 0x3f,
                );
            }
            this.sendBuffers.push(Buffer.from(readData.packet));
            return;
        }
    }

    // =============================================================================
    // 4. 대기열의 명령을 직렬 포트로 펌웨어에 전송
    // =============================================================================
    requestLocalData() {
        if (!this.sp || this.isDraing || !this.sendBuffers.length) {
            return null;
        }

        const buffer = this.sendBuffers.shift();
        this.isDraing = true;
        this.sp.write(buffer, () => {
            if (this.sp && typeof this.sp.drain === 'function') {
                this.sp.drain(() => {
                    this.isDraing = false;
                });
            } else {
                this.isDraing = false;
            }
        });

        return null;
    }

    // =============================================================================
    // 5. 펌웨어가 보낸 직렬 데이터를 수신 버퍼에 저장
    // =============================================================================
    handleLocalData(data) {
        if (!data || !data.length) {
            return;
        }

        this.recvBuffers.push(...data);
        this.processBuffer();
    }

    // =============================================================================
    // 6. 수신 프레임의 헤더·길이·CRC를 검증하고 센서/상태 데이터로 해석
    // =============================================================================
    processBuffer() {
        let index = 0;

        while (index <= this.recvBuffers.length - 6) {
            if (
                this.recvBuffers[index] !== this.protocol.HEADER_1 ||
                this.recvBuffers[index + 1] !== this.protocol.HEADER_2
            ) {
                index += 1;
                continue;
            }

            const parameterLength = this.recvBuffers[index + 2];
            const frameLength = parameterLength + 6;
            if (this.recvBuffers.length - index < frameLength) {
                break;
            }

            const frame = Buffer.from(this.recvBuffers.slice(index, index + frameLength));
            const expectedCrc = frame[frameLength - 2] | (frame[frameLength - 1] << 8);
            const actualCrc = this.calcrc(frame.subarray(3, frameLength - 2));
            if (actualCrc !== expectedCrc) {
                index += 1;
                continue;
            }

            const packetSignature = Array.from(frame).join(',');
            if (packetSignature === this.lastProcessedPacketSignature) {
                index += frameLength;
                continue;
            }
            this.lastProcessedPacketSignature = packetSignature;

            const instruction = frame[3];
            const params = Array.from(frame.subarray(4, 4 + parameterLength));

            // ESP-01 조종기 패킷의 필드 순서:
            // Wi-Fi 장치, 롤, 피치, 요, 스로틀, 시동 상태, RGB 핀, 빨강, 초록, 파랑
            if (
                instruction === this.protocol.GLOBAL &&
                params[0] === this.protocol.WIFI &&
                params.length >= 10
            ) {
                const previousArming = this.wifiDatas.WIFI_ARMING;
                this.wifiDatas.WIFI_ROLL = params[1];
                this.wifiDatas.WIFI_PITCH = params[2];
                this.wifiDatas.WIFI_YAW = params[3];
                this.wifiDatas.WIFI_THROTTLE = params[4];
                this.wifiDatas.WIFI_ARMING = params[5];
                this.wifiDatas.WIFI_RGB_PIN = params[6];
                this.wifiDatas.WIFI_RGB_R = params[7];
                this.wifiDatas.WIFI_RGB_G = params[8];
                this.wifiDatas.WIFI_RGB_B = params[9];

                if (previousArming !== this.wifiDatas.WIFI_ARMING) {
                    console.log('[JIKKO_DARAE][WIFI][ARMING]', {
                        previous: previousArming,
                        current: this.wifiDatas.WIFI_ARMING,
                    });
                }
            }

            if (instruction === this.protocol.GLOBAL) {
                this.updateExtendedSensorData(params);
            }

            if ((instruction & this.protocol.READ_PIN_MASK) !== 0 && params.length >= 2) {
                const entryPin = this.lastReadPortByCommand[instruction] || (instruction & 0x3f);
                if (params[0] === this.protocol.DIGITAL || params[0] === this.protocol.ANALOG) {
                    this.updatePinData(entryPin, params[0], params[1]);
                }
            }

            index += frameLength;
        }

        if (index > 0) {
            this.recvBuffers = this.recvBuffers.slice(index);
        }
    }

    // =============================================================================
    // 7. 해석한 센서값과 상태를 EntryJS로 전달
    // =============================================================================
    requestRemoteData(handler) {
        Object.keys(this.sensorDatas).forEach((key) => {
            handler.write(key, this.sensorDatas[key]);
        });
        Object.keys(this.wifiDatas).forEach((key) => {
            handler.write(key, this.wifiDatas[key]);
        });
        Object.keys(this.extendedSensorDatas).forEach((key) => {
            handler.write(key, this.extendedSensorDatas[key]);
        });
    }
}

module.exports = new JikkoDarae();
