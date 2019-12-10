'use strict';
const Readline = require('@serialport/parser-readline'); // modify
const Delimiter = require('@serialport/parser-delimiter');
const SerialPort = require('@serialport/stream');
SerialPort.Binding = require('@serialport/bindings');

/**
 * 스캔이 끝난 후, 선택된 포트로 시리얼포트를 오픈하는 클래스
 * 스캐너에서 open, initialize 가 일어나고,
 * 라우터에서 setRouter, connect 를 거쳐 통신한다.
 */
class Connector {
    static get DEFAULT_CONNECT_LOST_MILLS() {
        return 1000;
    }

    static get DEFAULT_SLAVE_DURATION() {
        return 1000;
    }

    constructor(hwModule, hardwareOptions) {
        this.options = hardwareOptions;
        this.hwModule = hwModule;

        /**
         * @type {MainRouter}
         */
        this.router = undefined;

        /**
         * @type {SerialPort}
         */
        this.serialPort = undefined;

        this.connected = false;
        this.received = false;

        this.lostTimer =
            hardwareOptions.lostTimer || Connector.DEFAULT_CONNECT_LOST_MILLS;
    }

    /**
     * MainRouter 를 세팅한다.
     * @param {MainRouter} router
     */
    setRouter(router) {
        this.router = router;
    }

    _makeSerialPortOptions(serialPortOptions) {}

    open(port) {}

    /**
     * checkInitialData, requestInitialData 가 둘다 존재하는 경우 handShake 를 진행한다.
     * 둘 중 하나라도 없는 경우는 로직을 종료한다.
     * 만약 firmwareCheck 옵션이 활성화 된 경우면 executeFlash 를 세팅하고 종료한다.
     * 이 플래그는 라우터에서 flasher 를 바로 사용해야하는지 판단한다.
     *
     * @returns {Promise<void>} 준비완료 or 펌웨어체크 준비
     */
    initialize() {}

    /**
     * router 와 hwModule 양쪽에 state 변경점을 보낸다.
     * @param {string} state
     * @private
     */
    _sendState(state) {
        this.hwModule.eventController && this.hwModule.eventController(state);
        this.router.sendState(state);
    }

    connect() {}

    clear() {}

    close() {}

    send(data, callback) {}
}

module.exports = Connector;
