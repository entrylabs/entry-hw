const BaseModule = require('./baseModule');

class Test2 extends BaseModule {
    constructor() {
        super();
        this.buttonService = {
            service: 'e95d9882-251d-470a-a062-fa1922dfa9a8',
            characteristics: [
                { key: 'buttonAState', uuid: 'e95dda90-251d-470a-a062-fa1922dfa9a8', type: 'read' },
                { key: 'buttonBState', uuid: 'e95dda91-251d-470a-a062-fa1922dfa9a8', type: 'read' },
            ],
        };

        this.ledService = {
            service: 'e95dd91d-251d-470a-a062-fa1922dfa9a8',
            characteristics: [
                {
                    key: 'ledMatrixState',
                    uuid: 'e95d7b77-251d-470a-a062-fa1922dfa9a8',
                    type: 'write',
                },
                { key: 'ledText', uuid: 'e95d93ee-251d-470a-a062-fa1922dfa9a8', type: 'write' },
                {
                    key: 'scrollingDelay',
                    uuid: 'e95d0d2d-251d-470a-a062-fa1922dfa9a8',
                    type: 'write',
                },
            ],
        };
    }

    /**
     * web-bluetooth 의 requestDevice 옵션설정. undefined 인 경우
     * { acceptAllDevices: true } 로 기본값 설정된다.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice
     */
    getScanOptions() {
        return {
            filters: [
                {
                    namePrefix: 'BBC micro:bit',
                },
            ],
            optionalServices: [this.buttonService.service, this.ledService.service],
        };
    }

    /**
     * @typedef {Object} Profile
     * @property {{type: string, uuid: string, key: string}[]} characteristics - 서비스 내 특성들
     * @property {string} service - 등록하고자 하는 서비스 uuid
     * @returns Profile[]
     */
    getProfiles() {
        return [this.buttonService, this.ledService];
    }

    /**
     *
     * @param key {string} - 특성 Profile 에 작성한 key 값
     * @param value {*}
     */
    handleLocalData(key, value) {
        console.log(key, value);
    }

    requestRemoteData(handler) {
        handler.write('hello', 'world');
    }

    /**
     * BLE 특정 특성에 데이터를 전송한다. 반환값 구조가 맞지않으면 데이터를 보내지 않으므로
     * 이를 가지고 전송로직을 컨트롤 할 수 있다.
     * @param {[]} commandQueue
     * @return {{key: string, value: string}} - 이 형태가 지켜지지 않으면 전송하지 않는다.
     */
    requestLocalData(commandQueue) {
        if (commandQueue.length < 1) {
            commandQueue.push({
                key: 'ledText',
                value: 'hi',
            });
        }
    }
}

module.exports = new Test2();
