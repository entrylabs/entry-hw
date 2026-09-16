const BaseModule = require('./baseModule');

// =============================================================================
// 1. 애니멀 키링 하드웨어 모듈 초기화 및 프로토콜 정의
// =============================================================================
class JikkoAnimal extends BaseModule {
    constructor() {
        super();

        this.sp = null;
        this.sendBuffers = [];
        this.recvBuffers = [];
        this.isDraing = false;

        this.entrySensorTypes = {
            DIGITAL: 0x01,
        };

        this.protocol = {
            HEADER_1: 0xff,
            HEADER_2: 0xfd,
            READ_PIN_MASK: 0x40,
            ...this.entrySensorTypes,
        };

        this.sensorDatas = this.makeDefaultSensorDatas();
        this.pendingMcuPackets = [];
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

        const instruction = this.protocol.READ_PIN_MASK | 2;
        this.lastReadPortByCommand[instruction] = 2;
        return this.makeFrame(instruction, [this.protocol.DIGITAL]);
    }

    checkInitialData(data) {
        return !!(data && data.length);
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

    reset() {
        this.sendBuffers = [];
        this.recvBuffers = [];
        this.sensorDatas = this.makeDefaultSensorDatas();
        this.pendingMcuPackets = [];
        this.lastReadPortByCommand = {};
    }

    makeDefaultSensorDatas() {
        return {
            DIGITAL: { 2: 1, 3: 1 },
            2: 1,
            3: 1,
        };
    }

    // =============================================================================
    // 2. JS 데이터 변환 및 펌웨어 프로토콜 프레임 생성
    // =============================================================================
    updatePinData(entryPin, value) {
        const pin = Number(entryPin);
        const pinKey = String(pin);
        if (!this.sensorDatas.DIGITAL) {
            this.sensorDatas.DIGITAL = {};
        }
        this.sensorDatas.DIGITAL[pin] = value;
        this.sensorDatas[pinKey] = value;
    }

    toByte(value, defaultValue = 0) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return defaultValue;
        }
        return Math.max(0, Math.min(255, Math.round(number)));
    }

    makeFrame(instruction, params = []) {
        const body = Buffer.from(params.map((value) => this.toByte(value)));
        const frameWithoutCrc = Buffer.concat([
            Buffer.from([
                this.protocol.HEADER_1,
                this.protocol.HEADER_2,
                body.length,
                this.toByte(instruction),
            ]),
            body,
        ]);
        const crc = this.calcrc(Buffer.concat([
            Buffer.from([this.toByte(instruction)]),
            body,
        ]));
        return Buffer.concat([
            frameWithoutCrc,
            Buffer.from([crc & 0xff, (crc >> 8) & 0xff]),
        ]);
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

        if (!Array.isArray(readData.packet)) {
            return;
        }

        const instruction = this.toByte(readData.instruction);
        if ((instruction & this.protocol.READ_PIN_MASK) !== 0 && instruction !== 0xff) {
            this.lastReadPortByCommand[instruction] = instruction & 0x3f;
        }
        this.sendBuffers.push(Buffer.from(readData.packet));
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
    // 6. 수신 프레임의 헤더·길이·CRC를 검증하고 센서 데이터로 해석
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

            const instruction = frame[3];
            const params = Array.from(frame.subarray(4, 4 + parameterLength));
            this.pendingMcuPackets.push({
                packet: Array.from(frame),
                instruction,
                params,
            });

            if ((instruction & this.protocol.READ_PIN_MASK) !== 0 && params.length >= 2) {
                const entryPin = this.lastReadPortByCommand[instruction] || (instruction & 0x3f);
                if (params[0] === this.protocol.DIGITAL) {
                    this.updatePinData(entryPin, params[1]);
                }
            }

            index += frameLength;
        }

        if (index > 0) {
            this.recvBuffers = this.recvBuffers.slice(index);
        }
    }

    // =============================================================================
    // 7. 해석한 버튼값과 검증된 보드 패킷을 EntryJS로 전달
    // =============================================================================
    requestRemoteData(handler) {
        Object.keys(this.sensorDatas).forEach((key) => {
            handler.write(key, this.sensorDatas[key]);
        });
        handler.write('MCU_PACKETS', this.pendingMcuPackets);
        this.pendingMcuPackets = [];
    }
}

module.exports = new JikkoAnimal();
