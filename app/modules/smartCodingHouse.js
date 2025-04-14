function Module() {
    this.digitalValue = new Array(14);
    this.analogValue = new Array(6);

    this.remoteDigitalValue = new Array(14);
    this.readablePorts = null;
    this.remainValue = null;

    // 내부 타이머 초기화 (있다면)
    this.processInterval = null;
}

Module.prototype.init = function (handler, config) {
    // 내부 상태 초기화
    this.requestInitialData();

    // 시리얼 통신 버퍼 flush (flush 함수가 있는 경우)
    if (handler && typeof handler.flush === 'function') {
        handler.flush();
    }
};

Module.prototype.requestInitialData = function () {
    for (var i = 0; i < 14; i++) {
        this.digitalValue[i] = 0;
        this.remoteDigitalValue[i] = 0;
    }
    for (var i = 0; i < 6; i++) {
        this.analogValue[i] = 0;
    }
    this.readablePorts = null;
    this.remainValue = null;
    return null;
};

Module.prototype.checkInitialData = function (data, config) {
    return true;
};

Module.prototype.validateLocalData = function (data) {
    return true;
};

Module.prototype.handleRemoteData = function (handler) {
    this.readablePorts = handler.read('readablePorts');
    var digitalValue = this.remoteDigitalValue;
    for (var port = 0; port < 14; port++) {
        digitalValue[port] = handler.read(port);
    }
};

Module.prototype.requestLocalData = function () {
    var queryString = [];

    // 만약 readablePorts에 대한 별도 처리가 필요 없다면, 첫 번째 루프는 제거할 수 있습니다.
    // 또는 필요하다면 그대로 두고, 두 번째 루프에서는 모든 핀을 처리합니다.
    // 기존 첫 번째 루프를 제거한 예:
    var digitalValue = this.remoteDigitalValue;
    for (var port = 0; port < 14; port++) {
        var value = digitalValue[port];
        if (value === 255 || value === 0) {
            var query = (7 << 5) + (port << 1) + (value === 255 ? 1 : 0);
            queryString.push(query);
        } else if (value > 0 && value < 255) {
            var query = (6 << 5) + (port << 1) + (value >> 7);
            queryString.push(query);
            query = value & 127;
            queryString.push(query);
        }
    }

    return queryString;
};

Module.prototype.handleLocalData = function (data) {
    // data: Native Buffer
    for (var i = 0; i < 32; i++) {
        var chunk;
        if (!this.remainValue) {
            chunk = data[i];
        } else {
            chunk = this.remainValue;
            i--;
        }

        if (chunk >> 7) {
            if ((chunk >> 6) & 1) {
                var nextChunk = data[i + 1];
                if (nextChunk === undefined) {
                    this.remainValue = chunk;
                } else {
                    this.remainValue = null;
                    var port = (chunk >> 3) & 7;
                    this.analogValue[port] = ((chunk & 7) << 7) + (nextChunk & 127);
                }
                i++;
            } else {
                var port = (chunk >> 2) & 15;
                this.digitalValue[port] = chunk & 1;
            }
        }
    }

    // Entry.hw 및 Entry.hw.portData 초기화
    if (typeof Entry === 'undefined') {
        Entry = {};
    }
    if (!Entry.hw) {
        Entry.hw = {};
    }
    if (!Entry.hw.portData) {
        Entry.hw.portData = {};
    }

    // 아날로그, 디지털 값 저장
    Entry.hw.portData.analog = this.analogValue;
    Entry.hw.portData.digital = this.digitalValue;
    // 각 아날로그 채널 a0 ~ a5 매핑
    for (var i = 0; i < 6; i++) {
        Entry.hw.portData['a' + i] = this.analogValue[i];
    }
    // 초음파 센서: 아날로그 채널 1
    Entry.hw.portData.ultrasonic = this.analogValue[1];
    // 온습도 센서: 아날로그 채널 2 (온도와 습도 동일값; 필요시 별도 처리)
    Entry.hw.portData.temperature = this.analogValue[2];
    Entry.hw.portData.humidity = this.analogValue[2];
};

Module.prototype.requestRemoteData = function (handler) {
    for (var i = 0; i < this.analogValue.length; i++) {
        var value = this.analogValue[i];
        handler.write('a' + i, value);
    }
    for (var i = 0; i < this.digitalValue.length; i++) {
        var value = this.digitalValue[i];
        handler.write(i, value);
    }
};

Module.prototype.reset = function () {
    if (this.processInterval) {
        clearInterval(this.processInterval);
        this.processInterval = null;
    }
    this.requestInitialData();
};

module.exports = new Module();
