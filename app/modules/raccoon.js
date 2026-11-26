'use strict';

// 라쿤(Robomation) entry-hw 모듈.
// 전송: SerialConnector (hex 문자열, 115200, rtscts, FF\r 핸드세이크, 끝에 -<주소>\r).
// 레이어 분담: 앱 레벨 두뇌(기구학, 관절 한계, 모드 상태머신, 소리 반복, 그리퍼 슬롯)는
// entryjs RaccoonRobot에 있고, 이 모듈은 deg->step 변환, 패킷 인코드/디코드, 완료 id 합성을 담당
// (장치 2비트 순환 id로 만든 단조 증가 %255 JSON 카운터, 첫 샘플 방어, 소리는 _sound_event로 게이트).

function Module() {
    // sensory: entryjs로 전달 (필드명은 entryjs RaccoonRobot.handleSensory와 일치해야 함)
    // 라우팅: hw checkDevice가 `${hex(company)}.${hex(model)}` 키 생성 -> "2.30" == Entry.Raccoon.id.
    // Entry.Robomation.afterReceive가 model 0x30(핸드세이크 토큰 info[2] "30")으로 RaccoonRobot 생성.
    this.sensory = {
        company: 0x02,
        model: 0x30,
        index: 0,
        signalStrength: 0,
        encoder1: 0,
        encoder2: 0,
        encoder3: 0,
        encoder4: 0,
        teachButton: 0,
        playButton: 0,
        deleteButton: 0,
        teachClickedId: 0,
        playClickedId: 0,
        deleteClickedId: 0,
        teachLongPressedId: 0,
        playLongPressedId: 0,
        deleteLongPressedId: 0,
        warning: 0,
        moving: 0,
        collision1Id: 0,
        collision2Id: 0,
        collision3Id: 0,
        collision4Id: 0,
        jointStateId: 0,
        soundStateId: 0,
        batteryState: 2,
        chargeState: 0,
        slotR1Id: 0,
        slotR1: [0, 0, 0, 0, 0, 0, 0, 0],
        slotR2Id: 0,
        slotR2: [0, 0, 0, 0, 0, 0, 0, 0],
        slotR3Id: 0,
        slotR3: [0, 0, 0, 0, 0, 0, 0, 0],
    };
    // motoring: entryjs에서 수신 (sendQueue)
    this.motoring = {
        jointVelocity1: 0,
        jointVelocity2: 0,
        jointVelocity3: 0,
        jointVelocity4: 0,
        jointSpeed: 100,
        jointAngleId: 0,
        jointAngle1: 0,
        jointAngle2: -10,
        jointAngle3: -140,
        jointAngle4: 60,
        jointModeId: 0,
        jointMode: 0,
        noteId: 0,
        note: 0,
        soundId: 0,
        sound: 0,
        slotW1Id: 0,
        slotW1: [0x10, 0, 0, 0, 0, 0, 0, 0],
        slotW2Id: 0,
        slotW2: [0x20, 0, 0, 0, 0, 0, 0, 0],
        slotW3Id: 0,
        slotW3: [0x30, 0, 0, 0, 0, 0, 0, 0],
    };
    this.address = '';
    this._init();
}

Module.STEP_TO_DEG = 360.0 / 4096.0;
Module.DEG_TO_STEP = 4096.0 / 360.0;

// 의미 소리 코드(entryjs가 보내는 Raccoon.SOUND_*) -> 장치 바이트.
// 삐오 표와 다름 (예: dibidibidip은 여기 0x21, 삐오는 0x27).
Module.SOUNDS = {
    0: 0x00,
    1: 0x01, // beep
    2: 0x05, // random beep
    3: 0x09, // siren
    4: 0x0b, // engine
    5: 0x15, // robot
    8: 0x21, // dibidibidip
    9: 0x22, // good job
    10: 0x07, // noise
    11: 0x12, // chop
    18: 0x14, // random melody
    22: 0x23, // wake up
    23: 0x24, // start
    24: 0x25, // bye
    127: 0x16, // error sound
};

// 관절 인덱스별 각도 한계 (deg)
Module.JOINT_LIMITS = [
    [-120, 120],
    [-90, 30],
    [-150, 0],
    [-105, 105],
];

Module.prototype._init = function() {
    // 인코더가 읽는 장치 레벨 필드
    this._joint_velocity = [0, 0, 0, 0];
    this._joint_speed = 100;
    // 의도적으로 0 초기화 대신 기본 자세를 시드한다. 모드/각도 순서 경합(각도 쓰기 전 각도모드 헤더)이
    // 나더라도 전 관절이 크게 움직이는 대신 안전한 정지 자세를 명령하도록. 정상 상태 바이트 결과는 불변
    // (두뇌가 항상 jointModeId와 jointAngleId를 한 배치로 함께 보내 이 값을 덮어씀).
    this._joint_angle = [0, -10, -140, 60];
    this._joint_angle_written = false;
    this._joint_mode = 0;
    this._note = 0;
    this._note_written = false;
    this._sound = 0;
    this._sound_written = false;
    this._slot_w1 = [0x10, 0, 0, 0, 0, 0, 0, 0];
    this._slot_w2 = [0x20, 0, 0, 0, 0, 0, 0, 0];
    this._slot_w3 = [0x30, 0, 0, 0, 0, 0, 0, 0];

    // 인코더 카운터 (풀바이트 %255, 삐오의 %15와 다름)
    this._joint_angle_id = 0;
    this._sound_id = 0;
    this._sound_event = 0;
    this._packet_sent = -1;

    // 장치 2비트 순환 id의 디코더 내부 캐시.
    // -1 = 첫 샘플 방어. 재연결/재부팅이 오래된 id의 잘못된 완료를 두뇌로 흘리지 못하게 여기서 다시 설정.
    this._dev_ids = {
        jointState: -1,
        soundState: -1,
        collision1: -1,
        collision2: -1,
        collision3: -1,
        collision4: -1,
        teachClicked: -1,
        playClicked: -1,
        deleteClicked: -1,
        teachLongPressed: -1,
        playLongPressed: -1,
        deleteLongPressed: -1,
    };
    // entryjs로 노출되는 단조 증가 JSON 카운터 (%255)
    this._json_counters = {};

    // entryjs *Id 필드 변경 감지.
    // _primed=true면 priming(기준선 채택) 없이 0 시드에서 바로 첫 명령을 발동한다.
    // 최초 연결에서는 idle 프레임이 선행하지 않으므로(non-multi는 블록 실행 시점에야 motoring을
    // sendQueue에 연결) 첫 handleRemoteData가 곧 첫 명령이다. priming을 켜두면 그 첫 명령을
    // 기준선으로 삼켜 관절 각도가 미기록되고(angle id 미증가) 첫 실행이 멈춘다.
    // 재연결(웹소켓 재접속으로 reset() 경유)에서만 _primed=false로 두어, 브라우저가 유지한 stale
    // nonzero id가 잘못 재발동되지 않도록 첫 프레임을 발동 없이 기준만 잡는다. (reset()에서 설정)
    this._primed = true;
    this._prev_jointAngleId = 0;
    this._prev_noteId = 0;
    this._prev_soundId = 0;
    this._prev_slotW1Id = 0;
    this._prev_slotW2Id = 0;
    this._prev_slotW3Id = 0;
};

Module.prototype.toHex = function(number) {
    var value = parseInt(number);
    if (value < 0) value += 0x100;
    value = (value & 0xff).toString(16).toUpperCase();
    return value.length > 1 ? value : '0' + value;
};

Module.prototype.toHex2 = function(number) {
    var value = parseInt(number);
    if (value < 0) value += 0x10000;
    value = (value & 0xffff).toString(16).toUpperCase();
    var result = '';
    for (var i = value.length; i < 4; ++i) result += '0';
    return result + value;
};

// 반올림은 half-to-even(은행가 반올림). 삐오의 half-away-from-zero와 다름.
Module.prototype._pyRound = function(v) {
    if (Math.abs(v % 1) === 0.5) {
        var f = Math.floor(v);
        return f % 2 === 0 ? f : f + 1;
    }
    return Math.round(v);
};

Module.prototype._signed16 = function(hex) {
    var value = parseInt(hex, 16);
    if (value > 0x7fff) value -= 0x10000;
    return value;
};

// 속도 검증: 127 = 전원 차단 통과, 그 외 +/-100로 제한
Module.prototype._verifyVelocity = function(vel) {
    if (vel == 127) return 127;
    if (vel < -100) return -100;
    if (vel > 100) return 100;
    return vel;
};

Module.prototype._verifySpeed = function(speed) {
    if (speed < 0) return 0;
    if (speed > 100) return 100;
    return speed;
};

// deg->step: 관절별 제한 -> half-to-even 반올림 -> step 제한
Module.prototype._degToStep = function(index, deg) {
    var limit = Module.JOINT_LIMITS[index];
    if (deg < limit[0]) deg = limit[0];
    else if (deg > limit[1]) deg = limit[1];
    var step = this._pyRound(deg * Module.DEG_TO_STEP);
    if (step < -2048) return -2048;
    if (step > 2047) return 2047;
    return step;
};

// ---------------- 연결 ----------------

Module.prototype.requestInitialData = function() {
    return 'FF\r';
};

Module.prototype.checkInitialData = function(data, config) {
    // 이름에 의존하지 않는 핸드세이크(hamster.js/pio.js와 동일): 이름 필드는 임의/다국어이며 콤마를
    // 포함할 수 있으므로 끝의 CR/LF만 제거하고 콤마로 분리한 뒤, 뒤쪽 고정 필드(모델/변형/주소)를
    // 집는다. 라쿤 모델 토큰은 "30".
    if (typeof data !== 'string' || data.slice(0, 2) != 'FF') {
        return;
    }
    var info = data.replace(/[\r\n]+$/, '').split(',');
    if (info.length < 5) {
        return;
    }
    var model = info[info.length - 3];
    var variant = info[info.length - 2];
    var address = info[info.length - 1];
    if (!/^[0-9A-Fa-f]{2}$/.test(variant) || !/^[0-9A-Fa-f]{12}$/.test(address)) {
        return false;
    }
    if (model == '30') {
        config.id = '0230' + variant;
        this.address = address;
        return true;
    }
    return false;
};

Module.prototype.validateLocalData = function(data) {
    // 장치 패킷은 끝의 '\r' 포함 54바이트. 프레임워크가 '\r'를 제거하므로 데이터 줄은 53.
    return data.length == 53;
};

// ---------------- 디코드 (장치 -> sensory) ----------------

Module.prototype._bumpId = function(jsonKey) {
    var next = ((this._json_counters[jsonKey] || 0) % 255) + 1;
    this._json_counters[jsonKey] = next;
    this.sensory[jsonKey] = next;
};

// 장치 2비트 순환 id 하나를 추적: 변경 시 JSON 카운터 증가.
// (재)연결 후 첫 샘플은 방어(devKey를 -1로 시드).
Module.prototype._trackId = function(devKey, jsonKey, id) {
    var prev = this._dev_ids[devKey];
    if (id != prev && prev != -1) {
        this._bumpId(jsonKey);
    }
    this._dev_ids[devKey] = id;
};

Module.prototype.handleLocalData = function(data) {
    var packet = String(data);
    if (packet.length != 53) return; // 잘리거나 손상된 프레임 폐기
    // 손상 hex 프레임 방어: 손상된 바이트에서 parseInt는 NaN을 반환해 sensory.encoderN -> 기구학을
    // 조용히 오염시킨다. 이하 모든 parseInt가 숫자가 되도록, 파싱하는 40자 데이터 구간을 검증한다
    // ([40] 이후 꼬리는 읽지 않음).
    if (!/^[0-9A-Fa-f]{40}/.test(packet)) return;
    if (parseInt(packet.slice(0, 1), 16) != 1) return;
    var sensory = this.sensory;
    var value;
    var id;

    // 인코더 (packet[2:18]): signed16 스텝 -> RAW 실수 degree. 범위 제한/정수 절삭 없음.
    sensory.encoder1 = this._signed16(packet.slice(2, 6)) * Module.STEP_TO_DEG;
    sensory.encoder2 = this._signed16(packet.slice(6, 10)) * Module.STEP_TO_DEG;
    sensory.encoder3 = this._signed16(packet.slice(10, 14)) * Module.STEP_TO_DEG;
    sensory.encoder4 = this._signed16(packet.slice(14, 18)) * Module.STEP_TO_DEG;

    // 상태 바이트 (packet[20:22])
    value = parseInt(packet.slice(20, 22), 16);
    sensory.warning = (value >> 7) & 0x01;
    sensory.moving = (value >> 6) & 0x01;
    this._trackId('jointState', 'jointStateId', (value >> 4) & 0x03);
    // soundState는 _sound_event로 추가 게이트: 이 모듈이 낸 소리의 완료만 노출한다.
    // 그렇지 않으면 두뇌의 반복 루프가 무관한 id 토글에 이중 발동한다.
    id = (value >> 2) & 0x03;
    if (this._sound_event == 1) {
        var prevSound = this._dev_ids.soundState;
        if (id != prevSound && prevSound != -1) {
            this._sound_event = 0;
            this._bumpId('soundStateId');
        }
    }
    this._dev_ids.soundState = id;
    sensory.chargeState = (value >> 1) & 0x01;

    // 충돌 바이트 (packet[22:24]): 2비트 순환 id, MSB부터 joint4..1
    value = parseInt(packet.slice(22, 24), 16);
    this._trackId('collision4', 'collision4Id', (value >> 6) & 0x03);
    this._trackId('collision3', 'collision3Id', (value >> 4) & 0x03);
    this._trackId('collision2', 'collision2Id', (value >> 2) & 0x03);
    this._trackId('collision1', 'collision1Id', value & 0x03);

    // 슬롯 디먹스 (packet[24:26] 상위 니블)
    value = parseInt(packet.slice(24, 26), 16);
    var slot = (value >> 4) & 0x0f;
    if (slot == 0) {
        // 버튼 (packet[26:28]): teach bit0, play bit1, delete bit3 (bit2 건너뜀)
        value = parseInt(packet.slice(26, 28), 16);
        sensory.teachButton = value & 0x01;
        sensory.playButton = (value >> 1) & 0x01;
        sensory.deleteButton = (value >> 3) & 0x01;
        // 클릭 (packet[28:30]): teach bits1-0, play bits3-2, delete bits7-6 (5-4 건너뜀)
        value = parseInt(packet.slice(28, 30), 16);
        this._trackId('teachClicked', 'teachClickedId', value & 0x03);
        this._trackId('playClicked', 'playClickedId', (value >> 2) & 0x03);
        this._trackId('deleteClicked', 'deleteClickedId', (value >> 6) & 0x03);
        // 롱프레스 (packet[30:32]): 클릭과 동일 레이아웃
        value = parseInt(packet.slice(30, 32), 16);
        this._trackId('teachLongPressed', 'teachLongPressedId', value & 0x03);
        this._trackId('playLongPressed', 'playLongPressedId', (value >> 2) & 0x03);
        this._trackId('deleteLongPressed', 'deleteLongPressedId', (value >> 6) & 0x03);
        // 신호 세기 (packet[36:38])
        value = parseInt(packet.slice(36, 38), 16);
        sensory.signalStrength = value - 0x100;
        // 배터리 (packet[38:40]) -> 전압 -> 3단계 상태 (삐오의 4단계와 다름)
        value = parseInt(packet.slice(38, 40), 16);
        value = (value + 200) / 100.0;
        var state = 2;
        if (value < 3.25) state = 0;
        else if (value < 3.45) state = 1;
        sensory.batteryState = state;
    } else if (slot == 1) {
        this._readSlot(packet, sensory.slotR1);
        this._bumpId('slotR1Id');
    } else if (slot == 2) {
        this._readSlot(packet, sensory.slotR2);
        this._bumpId('slotR2Id');
    } else if (slot == 3) {
        this._readSlot(packet, sensory.slotR3);
        this._bumpId('slotR3Id');
    }
};

// 슬롯 페이로드 (packet[24:40]): [0]의 슬롯 헤더 바이트 포함 8바이트
Module.prototype._readSlot = function(packet, out) {
    for (var i = 0; i < 8; ++i) {
        out[i] = parseInt(packet.slice(2 * i + 24, 2 * i + 26), 16);
    }
};

// ---------------- entryjs 브리지 ----------------

Module.prototype.requestRemoteData = function(handler) {
    var sensory = this.sensory;
    for (var key in sensory) {
        handler.write(key, sensory[key]);
    }
};

Module.prototype._copySlot = function(src, dst) {
    if (!src || src.length === undefined) return;
    for (var i = 0; i < 8; ++i) {
        var v = parseInt(src[i]);
        if (isNaN(v)) v = 0;
        // 슬롯 선언 범위 -128..255: 범위 밖 슬롯 바이트는 &0xff 마스크가 아니라 CLAMP한다.
        // 300은 실제 장치처럼 0x2C가 아닌 0xFF로 나가야 한다.
        if (v < -128) v = -128;
        else if (v > 255) v = 255;
        dst[i] = v;
    }
};

Module.prototype.handleRemoteData = function(handler) {
    var m = this.motoring;
    // entryjs가 보낸 필드 모두 가져오기
    for (var key in m) {
        if (handler.e(key)) m[key] = handler.read(key);
    }

    // 재연결 전용 priming 패스: reset() 후 _primed=false일 때만 실행된다(최초 연결은 _init의
    // _primed=true라 여기 진입하지 않고 0 시드에서 첫 명령이 바로 발동). 재연결 첫 프레임에서는
    // 브라우저가 유지한 현재 id를 기준선으로 채택하고 아무것도 발동하지 않아 stale id 오발동을 막는다.
    // entryjs가 진짜 새 명령(id 변경)을 내면 그때 발동한다.
    if (!this._primed) {
        this._primed = true;
        this._prev_jointAngleId = m.jointAngleId;
        this._prev_noteId = m.noteId;
        this._prev_soundId = m.soundId;
        this._prev_slotW1Id = m.slotW1Id;
        this._prev_slotW2Id = m.slotW2Id;
        this._prev_slotW3Id = m.slotW3Id;
    }

    // 연속 값: 매 주기 복사(이펙터 의미). 의도적 비대칭에 유의: jointMode는 매 주기 읽는 실시간
    // 필드이고, jointAngle은 아래 jointAngleId로 게이트되는 고정 명령이다. 통합하지 말 것 -
    // 두뇌가 항상 jointModeId와 jointAngleId를 한 배치로 함께 보낸다.
    this._joint_velocity[0] = m.jointVelocity1;
    this._joint_velocity[1] = m.jointVelocity2;
    this._joint_velocity[2] = m.jointVelocity3;
    this._joint_velocity[3] = m.jointVelocity4;
    this._joint_speed = m.jointSpeed;
    this._joint_mode = m.jointMode;

    // 관절 각도 (id 변경 시에만 기록). 송신 사이의 여러 entryjs id 증가는 한 번의 encoder id
    // 증가로 합쳐진다(송신당 한 번 인코드).
    if (m.jointAngleId != this._prev_jointAngleId) {
        this._prev_jointAngleId = m.jointAngleId;
        this._joint_angle[0] = m.jointAngle1;
        this._joint_angle[1] = m.jointAngle2;
        this._joint_angle[2] = m.jointAngle3;
        this._joint_angle[3] = m.jointAngle4;
        this._joint_angle_written = true;
    }

    // 음 / 소리 (id 변경 시에만 기록)
    if (m.noteId != this._prev_noteId) {
        this._prev_noteId = m.noteId;
        this._note = m.note;
        this._note_written = true;
    }
    if (m.soundId != this._prev_soundId) {
        this._prev_soundId = m.soundId;
        this._sound = Module.SOUNDS[m.sound] !== undefined ? m.sound : 0;
        this._sound_written = true;
    }

    // 슬롯 쓰기 (id 변경 시 배열 복사, 어느 경우든 4번째 패킷마다 전송)
    if (m.slotW1Id != this._prev_slotW1Id) {
        this._prev_slotW1Id = m.slotW1Id;
        this._copySlot(m.slotW1, this._slot_w1);
    }
    if (m.slotW2Id != this._prev_slotW2Id) {
        this._prev_slotW2Id = m.slotW2Id;
        this._copySlot(m.slotW2, this._slot_w2);
    }
    if (m.slotW3Id != this._prev_slotW3Id) {
        this._prev_slotW3Id = m.slotW3Id;
        this._copySlot(m.slotW3, this._slot_w3);
    }
};

// ---------------- 인코드 (motoring -> 장치) ----------------

Module.prototype.requestLocalData = function() {
    var result;
    var i;
    var mode = this._joint_mode;

    if (mode == 1 || mode == 4 || mode == 5) {
        // 각도 모드: 헤더 + angleId + step16 4개 + speed + 00
        result = mode == 4 ? '1C' : mode == 5 ? '1D' : '11';
        if (this._joint_angle_written) {
            this._joint_angle_id = (this._joint_angle_id % 255) + 1;
        }
        this._joint_angle_written = false;
        result += this.toHex(this._joint_angle_id);
        for (i = 0; i < 4; ++i) {
            result += this.toHex2(this._degToStep(i, this._joint_angle[i]));
        }
        result += this.toHex(this._verifySpeed(this._joint_speed));
        result += '00';
    } else {
        // 속도 모드: 0/2/3과 알 수 없는 값은 모두 여기로
        result = mode == 2 ? '1A' : mode == 3 ? '1B' : '10';
        for (i = 0; i < 4; ++i) {
            result += this.toHex(this._verifyVelocity(this._joint_velocity[i]));
        }
        result += '00000000000000';
    }

    // 슬롯 순환: -1 시드 -> 첫 패킷은 SLOT0
    this._packet_sent = (this._packet_sent + 1) % 4;
    if (this._packet_sent == 0) {
        result += '0000000000';
        var temp = Module.SOUNDS[this._sound] || 0;
        if (this._note_written || this._sound_written) {
            this._sound_id = (this._sound_id % 255) + 1;
        }
        if (this._sound_written) {
            // 소리가 들리는 경우에만 디코드 쪽 완료 게이트를 켠다
            this._sound_event = temp > 0 ? 1 : 0;
        }
        result += this.toHex(this._sound_id);
        if (temp > 0) {
            result += this.toHex(temp + 128);
        } else if (this._note > 0) {
            result += this.toHex(this._note & 0x7f);
        } else {
            result += '00';
        }
        this._note_written = false;
        this._sound_written = false;
        result += '00';
    } else if (this._packet_sent == 1) {
        for (i = 0; i < 8; ++i) result += this.toHex(this._slot_w1[i]);
    } else if (this._packet_sent == 2) {
        for (i = 0; i < 8; ++i) result += this.toHex(this._slot_w2[i]);
    } else {
        for (i = 0; i < 8; ++i) result += this.toHex(this._slot_w3[i]);
    }

    result += '-';
    result += this.address;
    result += '\r';
    return result;
};

Module.prototype.reset = function() {
    this._init();
    // reset()은 엔트리 워크스페이스 웹소켓이 끊길 때만 호출된다(mainRouter handleServerSocketClosed).
    // 즉 다음 handleRemoteData는 '재연결'이다. 이때만 priming을 켜(_primed=false) 브라우저가 유지한
    // stale id의 오발동을 막는다. 최초 연결(모듈 로드)에는 reset()이 안 불리므로 _init의
    // _primed=true가 유지돼 첫 명령이 정상 발동된다.
    // (아래 줄은 반드시 this._init() 뒤에 와야 한다. _init이 _primed=true로 재설정하기 때문이다.)
    this._primed = false;
    var s = this.sensory;
    for (var k in s) {
        if (s[k] instanceof Array) {
            for (var i = 0; i < s[k].length; ++i) s[k][i] = 0;
        } else {
            s[k] = 0;
        }
    }
    s.company = 0x02;
    s.model = 0x30;
    s.index = 0;
    s.batteryState = 2;
    var m = this.motoring;
    for (var mk in m) {
        if (m[mk] instanceof Array) continue;
        m[mk] = 0;
    }
    m.jointSpeed = 100;
    m.jointAngle2 = -10;
    m.jointAngle3 = -140;
    m.jointAngle4 = 60;
    m.slotW1 = [0x10, 0, 0, 0, 0, 0, 0, 0];
    m.slotW2 = [0x20, 0, 0, 0, 0, 0, 0, 0];
    m.slotW3 = [0x30, 0, 0, 0, 0, 0, 0, 0];
};

module.exports = new Module();
