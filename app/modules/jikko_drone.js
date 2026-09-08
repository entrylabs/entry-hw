const BaseModule = require('./baseModule');

// =============================================================================
// 1. 직코 드론 하드웨어 모듈 초기화 및 드론 명령 정의
// =============================================================================
class JikkoDrone extends BaseModule {
    constructor() {
        super();
        this.sendBuffers = [];
        this.lastRemotePacketKey = null;
        this.lastDroneCommandSequence = null;

        this.droneCommands = Object.freeze({
            CALIBRATE: 0x01,
            ARM: 0x03,
            DISARM: 0x05,
            MOVE_TIME: 0x10,
            MOVE_DISTANCE: 0x20,
            TAKEOFF: 0x30,
            LANDING: 0x35,
        });
        this.droneDirections = Object.freeze({
            FRONT: 0x10,
            BACK: 0x12,
            LEFT: 0x14,
            RIGHT: 0x16,
            COUNTER_CLOCKWISE: 0x18,
            CLOCKWISE: 0x19,
            UP: 0x1a,
            DOWN: 0x1c,
        });
        this.validDroneCommands = new Set(Object.values(this.droneCommands));
        this.validDroneDirections = new Set(Object.values(this.droneDirections));
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
        // 연결할 때 센서 읽기나 드론 시동 명령을 자동으로 보내지 않는다.
        return null;
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
    }

    reset() {
        this.sendBuffers = [];
        this.lastRemotePacketKey = null;
        this.lastDroneCommandSequence = null;
    }

    // =============================================================================
    // 2. 드론 명령값 정리 및 7바이트 비행 패킷 생성
    // =============================================================================
    toByte(value, defaultValue = 0) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return defaultValue;
        }
        return Math.max(0, Math.min(255, Math.round(number)));
    }

    calculateDroneChecksum(command, value1, value2, value3) {
        const sum = command + value1 + value2 + value3;
        return (0xff - (sum & 0xff)) & 0xff;
    }

    buildDronePacket(command, value1 = 0, value2 = 0, value3 = 0) {
        const normalizedCommand = this.toByte(command);
        const normalizedValue1 = this.toByte(value1);
        const normalizedValue2 = this.toByte(value2);
        const normalizedValue3 = this.toByte(value3);
        const checksum = this.calculateDroneChecksum(
            normalizedCommand,
            normalizedValue1,
            normalizedValue2,
            normalizedValue3,
        );
        return Buffer.from([
            0xff,
            0xff,
            normalizedCommand,
            normalizedValue1,
            normalizedValue2,
            normalizedValue3,
            checksum,
        ]);
    }

    validateDroneCommand(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        const sequence = Number(data.sequence);
        if (!Number.isSafeInteger(sequence) || sequence < 0) {
            return false;
        }

        const command = this.toByte(data.command);
        const direction = this.toByte(data.value1);
        const speedOrDistance = this.toByte(data.value2);
        const duration = this.toByte(data.value3);
        if (!this.validDroneCommands.has(command)) {
            return false;
        }
        if (
            (command === this.droneCommands.MOVE_TIME ||
                command === this.droneCommands.MOVE_DISTANCE) &&
            !this.validDroneDirections.has(direction)
        ) {
            return false;
        }
        return !(
            command === this.droneCommands.MOVE_TIME &&
            (speedOrDistance > 100 || duration === 0)
        );
    }

    handleDroneCommand(data) {
        const sequence = Number(data && data.sequence);
        if (Number.isSafeInteger(sequence) && sequence === this.lastDroneCommandSequence) {
            return;
        }
        if (!this.validateDroneCommand(data)) {
            console.warn('[JIKKO_DRONE][DRONE_COMMAND][REJECTED]', data);
            return;
        }

        const command = this.toByte(data.command);
        const packet = this.buildDronePacket(command, data.value1, data.value2, data.value3);
        this.lastDroneCommandSequence = sequence;
        // 시동 해제는 다른 대기 명령보다 먼저 전송한다.
        if (command === this.droneCommands.DISARM) {
            this.sendBuffers.unshift(packet);
        } else {
            this.sendBuffers.push(packet);
        }
    }

    // =============================================================================
    // 3. EntryJS에서 받은 드론 명령과 정지용 원시 패킷을 전송 대기열에 저장
    // =============================================================================
    handleRemoteData(handler) {
        const droneCommand = handler.read('DRONE_COMMAND');
        if (droneCommand) {
            this.handleDroneCommand(droneCommand);
        }

        const readData = handler.read('SET');
        if (!readData || !Array.isArray(readData.packet)) {
            return;
        }
        const packetKey = `${readData.time || 0}:${readData.packet.join(',')}`;
        if (packetKey === this.lastRemotePacketKey) {
            return;
        }
        this.lastRemotePacketKey = packetKey;
        this.sendBuffers.push(Buffer.from(readData.packet));
    }

    // =============================================================================
    // 4. 대기열의 패킷을 드론 펌웨어에 순서대로 전송
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
}

module.exports = new JikkoDrone();
