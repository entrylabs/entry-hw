'use strict';

// 삐오(Robomation) entry-hw 모듈.
// 전송: SerialConnector (hex 문자열, 115200, rtscts, FF\r 핸드세이크, 끝에 -<주소>\r).
// 레이어 분담: entry-hw는 펄스 변환, 바퀴/목/눈/소리 id 및 이벤트 상태머신, 완료 id 합성을 담당.
// entryjs PioRobot가 motionType/motionUnit/motionValue와 *Id 변경 신호를 전송.

function Module() {
    // sensory: entryjs로 전달 (필드명은 entryjs PioRobot.handleSensory와 일치해야 함)
    // 라우팅: hw.ts checkDevice가 `${hex(company)}.${hex(model)}` 키 생성 -> "2.20" == Entry.Pio.id.
    // Entry.Robomation.afterReceive가 model 0x20(핸드세이크 토큰 info[2] "20")으로 PioRobot 생성.
    this.sensory = {
        company: 0x02,
        model: 0x20,
        index: 0,
        signalStrength: 0,
        forwardButton: 0,
        backwardButton: 0,
        leftButton: 0,
        rightButton: 0,
        runButton: 0,
        behaviorButton: 0,
        repeatButton: 0,
        clearButton: 0,
        pulseCount: 0,
        wheelStateId: 0,
        neckEncoder: 0,
        neckStateId: 0,
        soundStateId: 0,
        batteryState: 3,
        usbState: 0,
        chargeState: 0,
    };
    // motoring: entryjs에서 수신 (sendQueue)
    this.motoring = {
        leftWheel: 0,
        rightWheel: 0,
        leftEyeRed: 0,
        leftEyeGreen: 0,
        leftEyeBlue: 0,
        rightEyeRed: 0,
        rightEyeGreen: 0,
        rightEyeBlue: 0,
        buzzer: 0,
        turbo: 0,
        turboId: 0,
        pulse: 0,
        pulseId: 0,
        neckSpeed: 4,
        neckSpeedId: 0,
        neckAngle: 0,
        neckAngleId: 0,
        eyePattern: 0,
        eyePatternId: 0,
        note: 0,
        noteId: 0,
        sound: 0,
        soundId: 0,
        motionType: 0,
        motionUnit: 0,
        motionSpeed: 0,
        motionValue: 0,
        motionRadius: 0,
        motionId: 0,
    };
    this.address = '';
    this._init();
}

Module.CM_TO_PULSE = 968.0;
Module.DEG_TO_PULSE_SPIN = 15104 / 360.0; // 좌우 동일
Module.DEG_TO_PULSE_PIVOT_LEFT = 30375 / 360.0;
Module.DEG_TO_PULSE_PIVOT_RIGHT = 30336 / 360.0;
Module.DEFAULT_VELOCITY = 70;

// 의미 소리 코드(entryjs가 보내는 Pio.SOUND_*) -> 장치 바이트
Module.SOUNDS = {
    0: 0x00,
    1: 0x01, // beep
    2: 0x05, // random beep
    10: 0x07, // noise
    3: 0x09, // siren
    4: 0x0b, // engine
    11: 0x12, // chop
    5: 0x15, // robot
    8: 0x27, // dibidibidip
    9: 0x28, // good job
    18: 0x14, // random melody
    20: 0x29, // poo(p)
    12: 0x21, // happy
    13: 0x22, // angry
    14: 0x23, // sad
    15: 0x24, // sleep
    6: 0x25, // march
    7: 0x26, // birthday
    21: 0x2a, // bath
};

Module.prototype._init = function() {
    // 인코더가 읽는 장치 레벨 필드
    this._left_wheel = 0;
    this._right_wheel = 0;
    this._pulse = 0;
    this._pulse_written = false;
    this._left_red = 0;
    this._left_green = 0;
    this._left_blue = 0;
    this._right_red = 0;
    this._right_green = 0;
    this._right_blue = 0;
    this._buzzer = 0;
    this._turbo = 0;
    this._neck_speed = 4;
    this._neck_angle = 0;
    this._neck_angle_written = false;
    this._eye_pattern = 0;
    this._eye_pattern_written = false;
    this._note = 0;
    this._sound = 0;
    this._sound_written = false;

    // 인코더 상태머신
    this._wheel_id = 0;
    this._wheel_pulse_prev = -1;
    this._wheel_event = 0;
    this._neck_id = 0;
    this._neck_event = 0;
    this._eye_id = 0;
    this._eye_event = 0;
    this._sound_id = 0;
    this._sound_event = 0;
    this._sound_prev = 0;
    this._current_sound = 0;
    this._sound_repeat = 1;

    // 디코더 완료 추적 (장치 2비트 순환 id)
    this._wheel_state_id = -1;
    this._neck_state_id = -1;
    this._eye_state_id = -1;
    this._sound_state_id = -1;
    this._event_pulse_count = -1;
    this._event_neck_encoder = -46;
    this._event_key_state_id = -1;
    this._event_usb_state = -1;
    this._event_charge_state = -1;
    this._event_battery_state = -1;

    // entryjs로 노출되는 JSON 완료 카운터 (단조 증가 %255)
    this._wheelStateJson = 0;
    this._neckStateJson = 0;
    this._soundStateJson = 0;

    // entryjs *Id 필드 변경 감지
    this._prev_turboId = 0;
    this._prev_pulseId = 0;
    this._prev_neckSpeedId = 0;
    this._prev_neckAngleId = 0;
    this._prev_eyePatternId = 0;
    this._prev_noteId = 0;
    this._prev_soundId = 0;
    this._prev_motionId = 0;

    // SEC(시간) 모션: 벽시계 종료 시각과 대기 중 완료
    this._sec_motion_end = 0;
    this._sec_motion_active = false;
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

Module.prototype._round = function(v) {
    // 반올림: 0에서 먼 쪽으로(half-away-from-zero)
    return v < 0 ? Math.ceil(v - 0.5) : Math.floor(v + 0.5);
};

// 장치로 나가는 값을 규격 범위로 포화시킨다. 펄스 배수(CM_TO_PULSE 등)와 프레임 필드
// 폭이 이 모듈에 있고 entryjs __PULSE_PER_UNIT은 같은 값을 복제해 둔 것이다. 또 이 소켓은
// 구버전 entryjs, 오프라인 엔트리, 제3자 클라이언트가 보낸 motoring도 그대로 받는다.
// 유한한데 범위를 넘은 값은 하위 비트만 남아 그럴듯한 다른 명령이 된다(100cm 요청이
// 32.3cm 이동으로 나간다). 이 함수가 실제로 막는 것은 이 경우다.
// toHex/toHex2는 건드리지 않는다. id와 이벤트 플래그 합성에도 쓰이므로 거기서 자르면
// 프레임 자체가 깨진다.
Module.prototype._sat = function(v, min, max) {
    var n = parseFloat(v);
    // NaN은 방향이 없어 포화시킬 곳이 없다. 중립값으로 둔다. 소켓 경로에서는 dataHandler의
    // read()가 이미 0으로 만들고 toHex의 & 0xff도 0을 내므로 이 분기는 보험이다.
    if (isNaN(n)) return min <= 0 && max >= 0 ? 0 : min;
    // 무한대는 이 경로로 오지 못한다. JSON에서 null이 되고 read()가 0으로 만든다.
    if (n < min) return min;
    if (n > max) return max;
    return n;
};

// ---------------- 연결 ----------------

Module.prototype.requestInitialData = function() {
    return 'FF\r';
};

Module.prototype.checkInitialData = function(data, config) {
    // 이름에 의존하지 않는 핸드세이크(hamster.js와 동일): 이름 필드는 임의/다국어이며 콤마를 포함할 수
    // 있으므로 끝의 CR/LF만 제거하고 콤마로 분리한 뒤, 뒤쪽 고정 필드(모델/변형/주소)를 집는다.
    // 삐오 모델 토큰은 "20".
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
    if (model == '20') {
        config.id = '0220' + variant;
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

Module.prototype.handleLocalData = function(data) {
    var packet = String(data);
    if (packet.length != 53) return; // 잘리거나 손상된 프레임 폐기
    if (parseInt(packet.slice(0, 1), 16) != 1) return;
    var sensory = this.sensory;
    var value;

    sensory.pulseCount = parseInt(packet.slice(2, 6), 16);
    if (sensory.pulseCount != this._event_pulse_count) this._event_pulse_count = sensory.pulseCount;

    sensory.neckEncoder = parseInt(packet.slice(6, 8), 16);

    // 버튼 (packet[8:10])
    value = parseInt(packet.slice(8, 10), 16);
    sensory.runButton = value & 0x01;
    sensory.forwardButton = (value >> 1) & 0x01;
    sensory.backwardButton = (value >> 2) & 0x01;
    sensory.leftButton = (value >> 3) & 0x01;
    sensory.rightButton = (value >> 4) & 0x01;
    sensory.behaviorButton = (value >> 5) & 0x01;
    sensory.repeatButton = (value >> 6) & 0x01;
    sensory.clearButton = (value >> 7) & 0x01;

    // 완료 바이트 1 (packet[10:12]): 바퀴/목/눈 2비트 순환 id
    value = parseInt(packet.slice(10, 12), 16);
    var id = (value >> 6) & 0x03;
    if (this._wheel_event == 1) {
        if (id != this._wheel_state_id && this._wheel_state_id != -1) {
            this._bumpWheelState();
            this._wheel_event = 0;
            // 장치는 펄스 목표 지점에서 완료 이벤트만 올리고 지정 속도로 계속 주행한다.
            // 완료 후 바퀴를 0으로 세우는 것은 호스트의 몫이다.
            this._left_wheel = 0;
            this._right_wheel = 0;
        }
    }
    this._wheel_state_id = id;

    id = (value >> 4) & 0x03;
    if (this._neck_event == 1) {
        if (id != this._neck_state_id && this._neck_state_id != -1) {
            this._bumpNeckState();
            this._neck_event = 0;
        }
    }
    this._neck_state_id = id;

    id = (value >> 2) & 0x03;
    if (this._eye_event == 1) {
        if (id != this._eye_state_id && this._eye_state_id != -1) {
            this._eye_event = 0;
        }
    }
    this._eye_state_id = id;

    // 완료 바이트 2 (packet[12:14]): 소리/키/usb/충전
    value = parseInt(packet.slice(12, 14), 16);
    id = (value >> 6) & 0x03;
    if (this._sound_event == 1) {
        if (id != this._sound_state_id && this._sound_state_id != -1) {
            this._sound_event = 0;
            if (this._current_sound > 0) {
                if (this._sound_repeat < 0) {
                    this._runSound(this._current_sound, -1);
                } else if (this._sound_repeat > 1) {
                    this._sound_repeat -= 1;
                    this._runSound(this._current_sound, this._sound_repeat);
                } else {
                    this._current_sound = 0;
                    this._sound_repeat = 1;
                    this._bumpSoundState();
                }
            } else {
                this._current_sound = 0;
                this._sound_repeat = 1;
            }
        }
    }
    this._sound_state_id = id;

    id = (value >> 4) & 0x03;
    this._event_key_state_id = id;

    var state = (value >> 1) & 0x01;
    sensory.usbState = state;
    this._event_usb_state = state;

    state = value & 0x01;
    state = 1 - state; // 충전 극성 반전
    sensory.chargeState = state;
    this._event_charge_state = state;

    // 배터리 (packet[36:38]) -> 전압 -> 상태
    value = parseInt(packet.slice(36, 38), 16);
    value = (value + 200) / 100.0;
    state = 3;
    if (value < 3.35) state = 0;
    else if (value < 3.4) state = 1;
    else if (value < 3.5) state = 2;
    sensory.batteryState = state;

    // 신호 세기 (packet[38:40])
    value = parseInt(packet.slice(38, 40), 16);
    value -= 0x100;
    sensory.signalStrength = value;
};

Module.prototype._bumpWheelState = function() {
    this._wheelStateJson = (this._wheelStateJson % 255) + 1;
    this.sensory.wheelStateId = this._wheelStateJson;
};
Module.prototype._bumpNeckState = function() {
    this._neckStateJson = (this._neckStateJson % 255) + 1;
    this.sensory.neckStateId = this._neckStateJson;
};
Module.prototype._bumpSoundState = function() {
    this._soundStateJson = (this._soundStateJson % 255) + 1;
    this.sensory.soundStateId = this._soundStateJson;
};

// ---------------- entryjs 브리지 ----------------

Module.prototype.requestRemoteData = function(handler) {
    var sensory = this.sensory;
    for (var key in sensory) {
        handler.write(key, sensory[key]);
    }
};

Module.prototype._runSound = function(sound, repeat) {
    if (typeof repeat != 'number') repeat = 1;
    if (repeat < 0) repeat = -1;
    if (repeat != 0) {
        this._current_sound = sound;
        this._sound_repeat = repeat;
        this._sound = sound;
        this._sound_written = true;
    }
};

// motionType -> (leftVel, rightVel) 부호. 속도 크기는 DEFAULT_VELOCITY
Module.prototype._motionVelocity = function(type) {
    var v = Module.DEFAULT_VELOCITY;
    switch (type) {
        case 1: case 101: return [v, v]; // forward
        case 2: case 102: return [-v, -v]; // backward
        case 3: case 103: return [-v, v]; // turn left
        case 4: case 104: return [v, -v]; // turn right
        case 5: return [0, v]; // pivot left, forward
        case 6: return [0, -v]; // pivot left, backward
        case 7: return [v, 0]; // pivot right, forward
        case 8: return [-v, 0]; // pivot right, backward
    }
    return [0, 0];
};

// motionType + unit + value -> 펄스 목표 (시간/연속 모션은 0)
Module.prototype._motionPulse = function(type, unit, value) {
    // unit: 1 = cm/deg, 2 = 초, 3 = 펄스
    if (unit == 2) return 0; // SEC은 타이머가 처리
    if (unit == 3) return this._round(value); // 펄스 직접 사용
    // unit == 1
    switch (type) {
        case 1: case 2: case 101: case 102:
            return this._round(value * Module.CM_TO_PULSE);
        case 3: case 4: case 103: case 104:
            return this._round(value * Module.DEG_TO_PULSE_SPIN);
        case 5: case 6:
            return this._round(value * Module.DEG_TO_PULSE_PIVOT_LEFT);
        case 7: case 8:
            return this._round(value * Module.DEG_TO_PULSE_PIVOT_RIGHT);
    }
    return 0;
};

Module.prototype.handleRemoteData = function(handler) {
    var m = this.motoring;
    // entryjs가 보낸 필드 모두 가져오기
    for (var key in m) {
        if (handler.e(key)) m[key] = handler.read(key);
    }

    // 터보 (id 변경 시)
    if (m.turboId != this._prev_turboId) {
        this._prev_turboId = m.turboId;
        this._turbo = m.turbo;
    }

    // 목 속도 (id 변경 시)
    if (m.neckSpeedId != this._prev_neckSpeedId) {
        this._prev_neckSpeedId = m.neckSpeedId;
        this._neck_speed = m.neckSpeed;
    }
    // 목 각도 (id 변경 시에만 기록)
    if (m.neckAngleId != this._prev_neckAngleId) {
        this._prev_neckAngleId = m.neckAngleId;
        this._neck_angle = this._sat(m.neckAngle, -90, 90);
        this._neck_angle_written = true;
    }

    // 눈: 매 주기 RGB 직접 설정
    this._left_red = this._sat(m.leftEyeRed, 0, 255);
    this._left_green = this._sat(m.leftEyeGreen, 0, 255);
    this._left_blue = this._sat(m.leftEyeBlue, 0, 255);
    this._right_red = this._sat(m.rightEyeRed, 0, 255);
    this._right_green = this._sat(m.rightEyeGreen, 0, 255);
    this._right_blue = this._sat(m.rightEyeBlue, 0, 255);
    if (m.eyePatternId != this._prev_eyePatternId) {
        this._prev_eyePatternId = m.eyePatternId;
        this._eye_pattern = m.eyePattern;
        this._eye_pattern_written = true;
    }

    // 부저 직접 설정
    this._buzzer = this._sat(m.buzzer, 0, 6553.5);
    // 음 (id 변경 시)
    if (m.noteId != this._prev_noteId) {
        this._prev_noteId = m.noteId;
        this._note = m.note;
    }
    // 소리 (id 변경 시에만 기록)
    if (m.soundId != this._prev_soundId) {
        this._prev_soundId = m.soundId;
        this._runSound(Module.SOUNDS[m.sound] !== undefined ? m.sound : 0, 1);
    }

    // 모션 처리 (id 변경 시)
    if (m.motionId != this._prev_motionId) {
        this._prev_motionId = m.motionId;
        this._sec_motion_active = false;
        var type = m.motionType;
        if (type == 0) {
            // 연속 바퀴 (setWheels/changeWheels/stop)
            this._left_wheel = this._sat(m.leftWheel, -100, 100);
            this._right_wheel = this._sat(m.rightWheel, -100, 100);
            this._pulse = 0;
            this._pulse_written = true;
        } else {
            var unit = m.motionUnit || 1;
            var value = m.motionValue;
            // 기본 이동/회전(101-104)은 value가 0 -> 기본 거리/각도
            if ((type >= 101 && type <= 104) && (!value || value <= 0)) {
                value = type <= 102 ? 10 : 90; // 10cm 이동 / 90deg 회전
                unit = 1;
            }
            var vel = this._motionVelocity(type);
            if (unit == 2) {
                // SEC: 속도는 지금, 완료는 타이머
                this._left_wheel = vel[0];
                this._right_wheel = vel[1];
                this._pulse = 0;
                this._pulse_written = true;
                this._sec_motion_active = true;
                // 유한한 초만 타이머에 쓴다. "abc"처럼 숫자가 아닌 참 값은 JSON과 read()를
                // 그대로 통과해 end를 NaN으로 만들고, 그러면 Date.now() >= end 가 영원히
                // 거짓이 된다. 이 타이머가 wheelStateId 증가의 유일한 출처라서
                // (requestLocalData 주석 참고) 블록이 끝나지 않는다. 무한대는 이 경로로
                // 오지 못한다. JSON에서 null이 되고 read()가 0으로 만든다.
                var sec = parseFloat(value);
                if (!isFinite(sec) || sec < 0) sec = 0;
                this._sec_motion_end = Date.now() + sec * 1000;
            } else {
                var pulse = this._sat(this._motionPulse(type, unit, value), 0, 65535);
                if (pulse > 0) {
                    this._left_wheel = vel[0];
                    this._right_wheel = vel[1];
                    this._pulse = pulse;
                } else {
                    this._left_wheel = 0;
                    this._right_wheel = 0;
                    this._pulse = 0;
                }
                this._pulse_written = true;
            }
        }
    }

};

// ---------------- 인코드 (motoring -> 장치) ----------------

Module.prototype.requestLocalData = function() {
    // SEC(초) 모션 완료는 호스트가 매 틱 폴링하는 송신 루프에서 처리한다(새 motoring에서만
    // 불리는 handleRemoteData가 아님). SEC 이동은 pulse=0이라 장치가 바퀴 완료를 보내지 않으므로,
    // entryjs가 기다리는 wheelStateId 증가는 이 타이머가 유일한 출처다.
    if (this._sec_motion_active && Date.now() >= this._sec_motion_end) {
        this._sec_motion_active = false;
        this._left_wheel = 0;
        this._right_wheel = 0;
        this._pulse = 0;
        this._pulse_written = true;
        this._bumpWheelState();
    }

    var result = '10';
    if (this._turbo == 1) result = '11';

    // 바퀴
    if (this._pulse_written) {
        if (this._pulse != 0 || this._wheel_pulse_prev != 0) {
            this._wheel_id = (this._wheel_id % 15) + 1;
        }
        this._wheel_event = this._pulse > 0 ? 1 : 0;
        this._wheel_pulse_prev = this._pulse;
        this._pulse_written = false;
    }
    if (this._wheel_event == 0) result += this.toHex(this._wheel_id);
    else result += this.toHex(0x10 | this._wheel_id);
    result += this.toHex(this._left_wheel);
    result += this.toHex(this._right_wheel);
    result += this.toHex2(this._pulse);

    // 목
    if (this._neck_angle_written) {
        this._neck_id = (this._neck_id % 15) + 1;
        this._neck_event = 1;
        this._neck_angle_written = false;
    }
    if (this._neck_event == 0) result += this.toHex(this._neck_id);
    else result += this.toHex(0x30 | this._neck_id);
    result += this.toHex(this._neck_speed);
    result += this.toHex(this._neck_angle);

    // 눈
    if (this._eye_pattern_written) {
        this._eye_id = (this._eye_id % 3) + 1;
        this._eye_event = 1;
        this._eye_pattern_written = false;
    }
    if (this._eye_event == 0) {
        result += this.toHex((this._eye_id << 4) | this._eye_id);
        result += this.toHex(this._left_red);
        result += this.toHex(this._left_green);
        result += this.toHex(this._left_blue);
        result += this.toHex(this._right_red);
        result += this.toHex(this._right_green);
        result += this.toHex(this._right_blue);
    } else {
        result += this.toHex(0x80 | (this._eye_id << 4) | (this._eye_pattern & 0x0f));
        result += '000000000000';
    }
    result += '00';

    // 소리 / 음 / 부저 (끝단)
    var temp = Module.SOUNDS[this._sound] || 0;
    if (this._sound_written) {
        if (temp > 0) {
            this._sound_id = (this._sound_id % 15) + 1;
            this._sound_event = 1;
        } else {
            this._sound_event = 0;
        }
    }
    if (temp > 0) {
        if (this._sound_written && this._sound_prev == temp) {
            result += '000000';
        } else {
            if (temp > 0x20) {
                result += this.toHex(0x30 | this._sound_id);
                result += this.toHex(temp - 0x20);
            } else {
                result += this.toHex(0x20 | this._sound_id);
                result += this.toHex(temp);
            }
            result += this.toHex(0);
        }
        this._sound_prev = temp;
    } else if (this._note > 0) {
        result += this.toHex(0x10 | this._sound_id);
        result += this.toHex(this._note);
        result += this.toHex(0);
    } else {
        result += this.toHex(this._sound_id);
        result += this.toHex2(this._round(this._buzzer * 10));
    }
    this._sound_written = false;

    result += '-';
    result += this.address;
    result += '\r';
    return result;
};

Module.prototype.reset = function() {
    this._init();
    var s = this.sensory;
    for (var k in s) s[k] = 0;
    s.company = 0x02;
    s.model = 0x20;
    s.index = 0;
    s.batteryState = 3;
    var m = this.motoring;
    for (var mk in m) m[mk] = 0;
    m.neckSpeed = 4;
};

module.exports = new Module();
