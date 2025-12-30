function Module() {
    this.sp = null;
    this.sensorTypes = {
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        PWM: 3,
        SERVO_PIN: 4,
        TONE: 5,
        PULSEIN: 6,
        ULTRASONIC: 7,
        TIMER: 8,
        NEOPIXEL_INIT: 9,
        NEOPIXEL_COLOR: 10,
        NEOPIXEL_BRIGHTNESS: 11,
        NEOPIXEL_SHIFT: 12,
        NEOPIXEL_ROTATE: 13,
        NEOPIXEL_BLINK: 14,
        NEOPIXEL_BLINK_STOP: 15,
    };

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3,
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
    };

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    this.neopixelLastData = {}; // 각 LED의 마지막 색상 저장
    this.neopixelShiftLastTime = 0; // SHIFT 마지막 실행 시간
    this.neopixelRotateLastTime = 0; // ROTATE 마지막 실행 시간
    this.neopixelDuplicateCheckTime = 100; // 중복 체크 유효 시간 (ms)
    this.neopixelBlinkTasks = {}; // 사이드별 깜박이기 작업 관리

    this.sensorData = {
        ULTRASONIC: 0,
        DIGITAL: {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0,
            8: 0,
            9: 0,
            10: 0,
            11: 0,
            12: 0,
            13: 0,
            14: 0,
            15: 0,
        },
        ANALOG: {},
        PULSEIN: {},
        TIMER: 0,
    };

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
    
    // BLINK 명령 throttling을 위한 캐시
    this.lastBlinkCommand = {
        left: { time: 0, data: null },
        right: { time: 0, data: null },
        all: { time: 0, data: null }
    };
}

var sensorIdx = 0;

Module.prototype.init = function (handler, config) {};

Module.prototype.setSerialPort = function (sp) {
    var self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function () {
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

Module.prototype.checkInitialData = function (data, config) {
    return true;
    // 이후에 체크 로직 개선되면 처리
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
};

Module.prototype.afterConnect = function (that, cb) {
    that.connected = true;
    if (cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function (data) {
    return true;
};

Module.prototype.requestRemoteData = function (handler) {
    var self = this;
    if (!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach(function (key) {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
};

Module.prototype.handleRemoteData = function (handler) {
    var self = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET') || this.defaultOutput;
    var time = handler.read('TIME');
    var buffer = new Buffer([]);

    if (getDatas) {
        var keys = Object.keys(getDatas);
        keys.forEach(function (key) {
            var dataObj = getDatas[key];
            var deviceType = parseInt(key); // 문자열 키를 숫자로 변환 (예: "7" -> 7)

            // --- [수정됨] millis() 펌웨어 최적화 ---
            // DIGITAL(1)과 ANALOG(2)는 펌웨어에서 자동으로 스트리밍되므로 GET 요청 불필요.
            // ULTRASONIC(7)은 펌웨어에서 센서를 초기화하는 '트리거'로 GET 요청이 필요함.
            if (deviceType !== self.sensorTypes.ULTRASONIC) {
                return; // ULTRASONIC 외의 모든 GET 요청은 무시
            }
            // --- [수정 끝] ---

            var isSend = false;
            if (typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                var time = self.digitalPortTimeList[dataObj.port];
                if (dataObj.time > time) {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } else if (Array.isArray(dataObj.port)) {
                isSend = dataObj.port.every(function (port) {
                    var time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if (isSend) {
                    dataObj.port.forEach(function (port) {
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if (isSend) {
                // deviceType을 숫자로 전달
                if (!self.isRecentData(dataObj.port, deviceType, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: deviceType, // 숫자형 deviceType 저장
                        data: dataObj.data,
                    };
                    buffer = Buffer.concat([
                        buffer,
                        // deviceType을 숫자로 전달
                        self.makeSensorReadBuffer(deviceType, dataObj.port, dataObj.data),
                    ]);
                }
            }
        });
    }

    if (setDatas) {
        var setKeys = Object.keys(setDatas);
        var sendItems = [];
        var localSeq = 0; // 같은 시간대에는 입력 순서 보장
        setKeys.forEach(function (port) {
            var data = setDatas[port];
            if (!data) { return; }

            var portNum = parseInt(port, 10);
            var isNeopixelColorPort = (portNum >= 100 && portNum <= 103);
            var isNeopixelInitPort = (portNum === 200);
            var isNeopixelBrightnessPort = (portNum === 201);
            var isNeopixelAllPort = (portNum === 202);
            var isNeopixelRangePort = (portNum === 203);
            var isNeopixelShiftPort = (portNum === 204);
            var isNeopixelRotatePort = (portNum === 205);
            var isNeopixelBlinkPort = (portNum === 206);
            var isNeopixelBlinkStopPort = (portNum === 207);
            var isNeopixelVirtualPort = (
                isNeopixelColorPort || isNeopixelInitPort || isNeopixelBrightnessPort ||
                isNeopixelAllPort || isNeopixelRangePort || isNeopixelShiftPort ||
                isNeopixelRotatePort || isNeopixelBlinkPort || isNeopixelBlinkStopPort
            );

            // INIT는 호스트측 블링크 작업도 중지
            if (isNeopixelInitPort) {
                self.stopNeopixelBlinkTask(-1);
            }

            var shouldSend = false;
            var lastTime = self.digitalPortTimeList[port] || 0;
            if (lastTime < data.time) {
                self.digitalPortTimeList[port] = data.time;
                shouldSend = !self.isRecentData(port, data.type, data.data);
            }

            if (!shouldSend) { return; }

            if (!isNeopixelColorPort) {
                self.recentCheckData[port] = {
                    type: data.type,
                    data: data.data,
                };
            }

            var actualPort = isNeopixelVirtualPort ? 9 : port;

            // 배치 전송용 아이템 수집 (우선순위 제거, 시간/입력순서만 사용)
            sendItems.push({
                port: port,
                data: data,
                actualPort: actualPort,
                time: data.time || 0,
                type: data.type,
                seq: localSeq++,
            });
        });

        if (sendItems.length) {
            // 시간 → 입력순 정렬 (엄격한 순서 보장)
            sendItems.sort(function (a, b) {
                if (a.time !== b.time) return a.time - b.time;
                return a.seq - b.seq;
            });

            // 병합 버퍼 생성
            var mergedSetBuffer = new Buffer([]);
            sendItems.forEach(function (it) {
                var out = self.makeOutputBuffer(it.type, it.actualPort, it.data.data);
                mergedSetBuffer = Buffer.concat([mergedSetBuffer, out]);
            });

            buffer = Buffer.concat([buffer, mergedSetBuffer]);
        }
    }

    if (buffer.length) {
        // 버퍼 크기 제한: 명령 밀림 방지 (반복 블록에서 빠른 종료를 위해)
        // 최대 10개까지만 유지 (오래된 명령 제거)
        if (this.sendBuffers.length > 10) {
            console.log('[ITPLE] Send buffer overflow, dropping old commands');
            this.sendBuffers = this.sendBuffers.slice(-5); // 최근 5개만 유지
        }
        this.sendBuffers.push(buffer);
    }
};

// --- NeoPixel Blink Scheduler (Background) ---
Module.prototype.startNeopixelBlinkTask = function (side, count, r, g, b, interval) {
    var self = this;
    // 파라미터 보정
    if (side !== 0 && side !== 1 && side !== -1) {
        side = -1; // 기본 전체
    }
    // count가 0이면 무한 깜박임 (255로 처리)
    count = parseInt(count || 1);
    if (count === 0) {
        count = 255; // 무한 깜박임을 255로 표현
    } else {
        count = Math.max(1, count);
    }
    r = Math.min(255, Math.max(0, parseInt(r || 0)));
    g = Math.min(255, Math.max(0, parseInt(g || 0)));
    b = Math.min(255, Math.max(0, parseInt(b || 0)));
    interval = Math.max(100, Number(interval || 500)); // 최소 100ms

    // 전체(-1)인 경우 양쪽을 각각 시작
    if (side === -1) {
        this.stopNeopixelBlinkTask(-1);
        this.startNeopixelBlinkTask(0, count, r, g, b, interval);
        this.startNeopixelBlinkTask(1, count, r, g, b, interval);
        return;
    }

    var key = side === 0 ? 'left' : 'right';

    // 기존 작업이 있다면 중지
    this.stopNeopixelBlinkTask(side);

    // LED 맵핑: 왼쪽(3,4) -> 인덱스 [2,3], 오른쪽(0,1) -> 인덱스 [0,1]
    var ledNumbers = side === 0 ? [2, 3] : [0, 1];

    var state = {
        side: side,
        key: key,
        ledNumbers: ledNumbers,
        count: count,
        r: r,
        g: g,
        b: b,
        isOn: false,
        done: false,
        toggles: 0, // off로 바뀔 때 1회로 카운트
        timer: null,
        infinite: (count === 255), // 255는 무한 깜박임
    };

    // 즉시 1회 켜기
    this._applyNeopixelColorToList(ledNumbers, r, g, b);
    state.isOn = true;

    // 주기적 토글
    state.timer = setInterval(function () {
        if (state.done) { return; }
        if (state.isOn) {
            // 끄기
            self._applyNeopixelColorToList(ledNumbers, 0, 0, 0);
            state.isOn = false;
            state.toggles += 1;
            // 무한 깜박임이 아닐 때만 카운트 체크
            if (!state.infinite && state.toggles >= state.count) {
                // 완료
                state.done = true;
                self.stopNeopixelBlinkTask(side);
            }
        } else {
            // 켜기
            self._applyNeopixelColorToList(ledNumbers, r, g, b);
            state.isOn = true;
        }
    }, interval);

    this.neopixelBlinkTasks[key] = state;
};

Module.prototype.stopNeopixelBlinkTask = function (side) {
    if (side === -1) {
        this.stopNeopixelBlinkTask(0);
        this.stopNeopixelBlinkTask(1);
        return;
    }
    var key = side === 0 ? 'left' : 'right';
    var task = this.neopixelBlinkTasks[key];
    if (task && task.timer) {
        clearInterval(task.timer);
    }
    if (task) {
        // 종료 시 LED 끄기 보장
        this._applyNeopixelColorToList(task.ledNumbers, 0, 0, 0);
    }
    delete this.neopixelBlinkTasks[key];
};

Module.prototype._applyNeopixelColorToList = function (ledNumbers, r, g, b) {
    var self = this;
    // 연속된 LED 번호인지 확인
    var sorted = ledNumbers.slice().sort(function(a, b) { return a - b; });
    var isContiguous = sorted.length > 1 && sorted.every(function(num, idx) {
        return idx === 0 || num === sorted[idx - 1] + 1;
    });
    
    if (isContiguous && sorted.length > 1) {
        // 연속된 LED는 RANGE 명령 사용 (단일 버퍼)
        var buf = self.makeOutputBuffer(self.sensorTypes.NEOPIXEL_COLOR, 9, {
            num: 254, // RANGE 명령
            start: sorted[0],
            end: sorted[sorted.length - 1],
            r: r,
            g: g,
            b: b
        });
        self.sendBuffers.push(buf);
        // 캐시 업데이트
        sorted.forEach(function(num) {
            self.neopixelLastData[num.toString()] = { r: r, g: g, b: b, lastCommand: 'color' };
        });
    } else {
        // 불연속 LED는 개별 명령 사용
        ledNumbers.forEach(function (num) {
            var buf = self.makeOutputBuffer(self.sensorTypes.NEOPIXEL_COLOR, 9, { num: num, r: r, g: g, b: b });
            self.sendBuffers.push(buf);
            // 캐시 업데이트
            self.neopixelLastData[num.toString()] = { r: r, g: g, b: b, lastCommand: 'color' };
        });
    }
};

Module.prototype.isRecentData = function (port, type, data) {
    var that = this;
    var isRecent = false;
    var currentTime = new Date().getTime();
    
    // BLINK 명령에 대한 특별한 throttling (반복 블록에서 빠른 종료를 위해)
    if (type == this.sensorTypes.NEOPIXEL_BLINK) {
        var sideKey = 'all';
        if (data && data.side !== undefined) {
            if (data.side === 0) sideKey = 'left';
            else if (data.side === 1) sideKey = 'right';
            else sideKey = 'all';
        }
        
        var lastBlink = this.lastBlinkCommand[sideKey];
        var throttleTime = 50; // 50ms 이내의 중복 명령 무시
        
        // 동일한 내용의 BLINK 명령이 짧은 시간 내에 반복되면 무시
        if (lastBlink.data && (currentTime - lastBlink.time) < throttleTime) {
            var isSame = lastBlink.data.side === data.side &&
                         lastBlink.data.count === data.count &&
                         lastBlink.data.r === data.r &&
                         lastBlink.data.g === data.g &&
                         lastBlink.data.b === data.b &&
                         lastBlink.data.interval === data.interval;
            if (isSame) {
                return true; // 중복이므로 전송 안 함
            }
        }
        
        // 새 명령이므로 캐시 업데이트
        this.lastBlinkCommand[sideKey] = {
            time: currentTime,
            data: JSON.parse(JSON.stringify(data)) // deep copy
        };
        return false; // 전송
    }
    
    // BLINK_STOP은 항상 즉시 전송 (빠른 종료를 위해)
    if (type == this.sensorTypes.NEOPIXEL_BLINK_STOP) {
        // STOP 명령이 들어오면 BLINK 캐시도 초기화
        this.lastBlinkCommand = {
            left: { time: 0, data: null },
            right: { time: 0, data: null },
            all: { time: 0, data: null }
        };
        return false; // 항상 전송
    }
    
    // 다른 NeoPixel 명령어는 중복 체크 없이 항상 전송
    if (type == this.sensorTypes.NEOPIXEL_COLOR ||
        type == this.sensorTypes.NEOPIXEL_INIT ||
        type == this.sensorTypes.NEOPIXEL_BRIGHTNESS ||
        type == this.sensorTypes.NEOPIXEL_SHIFT ||
        type == this.sensorTypes.NEOPIXEL_ROTATE) {
        return false; // 항상 전송
    }
    
    if (type == this.sensorTypes.ULTRASONIC) {
        var portString = port.toString();
        var isGarbageClear = false;
        Object.keys(this.recentCheckData).forEach(function (key) {
            var recent = that.recentCheckData[key];
            if (key === portString) {
            }
            if (key !== portString && (recent.type == that.sensorTypes.ULTRASONIC)) {
                delete that.recentCheckData[key];
                isGarbageClear = true;
            }
        });

        if ((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
            isRecent = false;
        } else {
            isRecent = true;
        }
    } else if (
        port in this.recentCheckData && 
        type != this.sensorTypes.TONE
    ) {
        if (this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
            isRecent = true;
        }
    }

    return isRecent;
};

Module.prototype.requestLocalData = function () {
    var self = this;

    if (!this.isDraing && this.sendBuffers.length > 0) {
        this.isDraing = true;
        var bufferToSend = this.sendBuffers.shift();
        this.sp.write(bufferToSend, function () {
            if (self.sp) {
                self.sp.drain(function () {
                    self.isDraing = false;
                });
            }
        });
    }

    return null;
};

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function (data) {
    var self = this;
    var datas = this.getDataByBuffer(data);

    datas.forEach(function (data) {
        if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
        
        var readData = data.subarray(2, data.length);
        var value;
        switch (readData[0]) {
            case self.sensorValueSize.FLOAT: {
                value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                value = Math.round(value * 100) / 100;
                break;
            }
            case self.sensorValueSize.SHORT: {
                value = new Buffer(readData.subarray(1, 3)).readInt16LE();
                break;
            }
            default: {
                value = 0;
                break;
            }
        }

        var type = readData[readData.length - 1];
        var port = readData[readData.length - 2];

        switch (type) {
            case self.sensorTypes.DIGITAL: {
                self.sensorData.DIGITAL[port] = value;
                break;
            }
            case self.sensorTypes.ANALOG: {
                self.sensorData.ANALOG[port] = value;
                break;
            }
            case self.sensorTypes.PULSEIN: {
                self.sensorData.PULSEIN[port] = value;
                break;
            }
            case self.sensorTypes.ULTRASONIC: {
                self.sensorData.ULTRASONIC = value;
                break;
            }
            case self.sensorTypes.TIMER: {
                self.sensorData.TIMER = value;
                break;
            }
            case self.sensorTypes.NEOPIXEL_INIT: {
                self.sensorData.NEOPIXEL_INIT = value;
                break;
            }
            default: {
                break;
            }
        }
    });
};

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function (device, port, data) {
    var buffer;
    var dummy = new Buffer([10]);
    if (device == this.sensorTypes.ULTRASONIC) {
        buffer = new Buffer([
            255,
            85,
            6,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port[0],
            port[1],
            10,
        ]);
        //console.log(buffer);
    }else if (!data) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
    } else {
        value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.GET, device, port, 10]);
        buffer = Buffer.concat([buffer, value, dummy]);
    }
    sensorIdx++;
    if (sensorIdx > 254) {
        sensorIdx = 0;
    }
    //console.log(buffer);
    return buffer;
};

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function (device, port, data) {
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);
    switch (device) {
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            //console.log(buffer);
            break;
        }
        case this.sensorTypes.TONE: {
            var time = new Buffer(2);
            if ($.isPlainObject(data)) {
                value.writeInt16LE(data.value);
                time.writeInt16LE(data.duration);
            } else {
                value.writeInt16LE(0);
                time.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXEL_INIT: {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXEL_COLOR: {
            if ($.isPlainObject(data)) {
                // 범위 명령 (num === 254)
                if (data.num === 254) {
                    buffer = new Buffer(14);
                    buffer[0] = 255;
                    buffer[1] = 85;
                    buffer[2] = 10;
                    buffer[3] = sensorIdx;
                    buffer[4] = this.actionTypes.SET;
                    buffer[5] = device;
                    buffer[6] = 9; // 실제 Arduino 포트는 9번
                    buffer[7] = data.num || 0; // 254
                    buffer[8] = data.start || 0;
                    buffer[9] = data.end || 0;
                    buffer[10] = data.r || 0;
                    buffer[11] = data.g || 0;
                    buffer[12] = data.b || 0;
                    buffer[13] = 10;
                } else {
                    buffer = new Buffer(12);
                    buffer[0] = 255;
                    buffer[1] = 85;
                    buffer[2] = 8;
                    buffer[3] = sensorIdx;
                    buffer[4] = this.actionTypes.SET;
                    buffer[5] = device;
                    buffer[6] = 9; // 실제 Arduino 포트는 9번
                    buffer[7] = data.num || 0;
                    buffer[8] = data.r || 0;
                    buffer[9] = data.g || 0;
                    buffer[10] = data.b || 0;
                    buffer[11] = 10;
                }
            } else {
                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, 9]);
                buffer = Buffer.concat([buffer, value, dummy]);
            }
            break;
        }
        case this.sensorTypes.NEOPIXEL_BRIGHTNESS: {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXEL_SHIFT: {
            if ($.isPlainObject(data)) {
                buffer = new Buffer(11);
                buffer[0] = 255;
                buffer[1] = 85;
                buffer[2] = 7;
                buffer[3] = sensorIdx;
                buffer[4] = this.actionTypes.SET;
                buffer[5] = device;
                buffer[6] = 9; // 실제 Arduino 포트는 9번
                buffer[7] = data.direction || 1; // 1: 오른쪽, -1: 왼쪽
                buffer[8] = data.steps || 0;
                buffer[9] = 0; // 0: shift
                buffer[10] = 10;
            } else {
                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, 9]);
                buffer = Buffer.concat([buffer, value, dummy]);
            }
            break;
        }
        case this.sensorTypes.NEOPIXEL_ROTATE: {
            if ($.isPlainObject(data)) {
                buffer = new Buffer(11);
                buffer[0] = 255;
                buffer[1] = 85;
                buffer[2] = 7;
                buffer[3] = sensorIdx;
                buffer[4] = this.actionTypes.SET;
                buffer[5] = device;
                buffer[6] = 9; // 실제 Arduino 포트는 9번
                buffer[7] = data.direction || 1; // 1: 오른쪽, -1: 왼쪽
                buffer[8] = data.steps || 0;
                buffer[9] = 1; // 1: rotate (shift와 구분)
                buffer[10] = 10;
            } else {
                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, 9]);
                buffer = Buffer.concat([buffer, value, dummy]);
            }
            break;
        }
        case this.sensorTypes.NEOPIXEL_BLINK: {
            // Payload: side(int8), count(uint8), r, g, b, interval(uint16)
            if ($.isPlainObject(data)) {
                var side = (typeof data.side === 'number') ? data.side : -1;
            var sideByte = side < 0 ? 2 : side; // -1(all) => 2 (firmware ALL)
                var count = data.count || 1;
                var r = data.r || 0;
                var g = data.g || 0;
                var b = data.b || 0;
                var interval = Math.max(100, parseInt(data.interval || 500, 10));
                buffer = new Buffer(15);
                buffer[0] = 255;
                buffer[1] = 85;
                buffer[2] = 11; // 4 (idx,action,device,port) + 7 payload
                buffer[3] = sensorIdx;
                buffer[4] = this.actionTypes.SET;
                buffer[5] = device;
                buffer[6] = 9; // actual port
                buffer[7] = sideByte & 0xFF;
                buffer[8] = count & 0xFF;
                buffer[9] = r & 0xFF;
                buffer[10] = g & 0xFF;
                buffer[11] = b & 0xFF;
                buffer[12] = interval & 0xFF;
                buffer[13] = (interval >> 8) & 0xFF;
                buffer[14] = 10;
            } else {
                // minimal packet with defaults
                buffer = new Buffer(9);
                buffer[0] = 255; buffer[1] = 85; buffer[2] = 5; buffer[3] = sensorIdx; buffer[4] = this.actionTypes.SET; buffer[5] = device; buffer[6] = 9; buffer[7] = 2; buffer[8] = 10;
            }
            break;
        }
        case this.sensorTypes.NEOPIXEL_BLINK_STOP: {
            // Payload: side(int8)
            if ($.isPlainObject(data)) {
                var side = (typeof data.side === 'number') ? data.side : -1;
                var sideByte = side < 0 ? 2 : side; // -1(all) => 2 (firmware ALL)
                buffer = new Buffer(9);
                buffer[0] = 255;
                buffer[1] = 85;
                buffer[2] = 5; // 4 + 1
                buffer[3] = sensorIdx;
                buffer[4] = this.actionTypes.SET;
                buffer[5] = device;
                buffer[6] = 9; // actual port
                buffer[7] = sideByte & 0xFF;
                buffer[8] = 10;
            } else {
                buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.SET, device, 9, 2, 10]);
            }
            break;
        }
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function (buffer) {
    var datas = [];
    var lastIndex = 0;
    buffer.forEach(function (value, idx) {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};

Module.prototype.disconnect = function (connect) {
    var self = this;
    console.log('[ITPLE] disconnect called');
    // Stop all blink tasks
    this.stopNeopixelBlinkTask(0);
    this.stopNeopixelBlinkTask(1);
    // Send NEOPIXEL_INIT to turn off all LEDs before closing
    if (this.sp) {
        console.log('[ITPLE] Sending NEOPIXEL_INIT before disconnect');
        var initBuffer = this.makeOutputBuffer(this.sensorTypes.NEOPIXEL_INIT, 9, 0);
        this.sp.write(initBuffer, function() {
            console.log('[ITPLE] NEOPIXEL_INIT sent, draining...');
            self.sp.drain(function() {
                console.log('[ITPLE] Drain complete, closing connection');
                connect.close();
                if (self.sp) {
                    delete self.sp;
                }
            });
        });
    } else {
        console.log('[ITPLE] No serial port, closing directly');
        connect.close();
    }
    // Reset NeoPixel data on disconnect
    this.neopixelLastData = {};
};

Module.prototype.reset = function () {
    console.log('[ITPLE] reset called, sp exists:', !!this.sp);
    // Stop all blink tasks on reset
    this.stopNeopixelBlinkTask(0);
    this.stopNeopixelBlinkTask(1);
    // Send NEOPIXEL_INIT to turn off all LEDs
    if (this.sp) {
        console.log('[ITPLE] Sending NEOPIXEL_INIT in reset');
        var initBuffer = this.makeOutputBuffer(this.sensorTypes.NEOPIXEL_INIT, 9, 0);
        try {
            this.sp.write(initBuffer, function(err) {
                if (err) {
                    console.log('[ITPLE] Error writing INIT in reset:', err);
                } else {
                    console.log('[ITPLE] NEOPIXEL_INIT sent in reset');
                }
            });
        } catch (e) {
            console.log('[ITPLE] Exception in reset write:', e);
        }
    }
    this.lastTime = 0;
    this.lastSendTime = 0;
    this.sensorData.PULSEIN = {};
    this.sendBuffers = [];
    this.recentCheckData = {};
    this.neopixelLastData = {};
    this.digitalPortTimeList = {};
};

module.exports = new Module();
