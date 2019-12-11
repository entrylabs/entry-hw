'use strict';

/**
 * 스캔이 끝난 후, 선택된 포트로 시리얼포트를 오픈하는 클래스
 * 스캐너에서 open, initialize 가 일어나고,
 * 라우터에서 setRouter, connect 를 거쳐 통신한다.
 */
class BaseConnector {
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

        this.connected = false;
        this.received = false;

        this.lostTimer =
            hardwareOptions.lostTimer || BaseConnector.DEFAULT_CONNECT_LOST_MILLS;
    }

    /**
     * MainRouter 를 세팅한다.
     * @param {MainRouter} router
     */
    setRouter(router) {
        this.router = router;
    }

    /**
     * @return Promise || Object
     */
    open(port) {
        throw new Error('Not Implemented Function. please write this function');
    }

    /**
     * @return Promise
     */
    initialize() {
        throw new Error('Not Implemented Function. please write this function');
    }

    /**
     * router 와 hwModule 양쪽에 state 변경점을 보낸다.
     * @param {string} state
     */
    sendState(state) {
        this.hwModule.eventController && this.hwModule.eventController(state);
        this.router.sendState(state);
    }

    connect() {
        throw new Error('Not Implemented Function. please write this function');
    }

    close() {
        throw new Error('Not Implemented Function. please write this function');
    }

    send(data, callback) {
        throw new Error('Not Implemented Function. please write this function');
    }
}

module.exports = BaseConnector;
