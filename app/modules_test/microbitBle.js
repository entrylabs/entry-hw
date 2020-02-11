const BaseModule = require('./baseModule');

class MicrobitBle extends BaseModule {
    constructor() {
        super();
        this._commandQueue = [
            { key: 'accelerometerPeriod', value: 160 },
            { key: 'magnetometerPeriod', value: 160 },
        ];
        this.sensorStateMap = {};
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
        this.accelerometerService = {
            service: 'e95d0753-251d-470a-a062-fa1922dfa9a8',
            characteristics: [
                {
                    key: 'accelerometerPeriod',
                    uuid: 'e95dfb24-251d-470a-a062-fa1922dfa9a8',
                    type: 'write',
                },
                {
                    key: 'accelerometerData',
                    uuid: 'e95dca4b-251d-470a-a062-fa1922dfa9a8',
                    type: 'read',
                },
            ],
        };
        this.magnetometerService = {
            service: 'e95df2d8-251d-470a-a062-fa1922dfa9a8',
            characteristics: [
                {
                    key: 'magnetometerPeriod',
                    uuid: 'e95d386c-251d-470a-a062-fa1922dfa9a8',
                    type: 'write',
                },
                {
                    key: 'magnetometerData',
                    uuid: 'e95dfb11-251d-470a-a062-fa1922dfa9a8',
                    type: 'read',
                },
                {
                    key: 'magnetometerBearing',
                    uuid: 'e95d9715-251d-470a-a062-fa1922dfa9a8',
                    type: 'read',
                },
            ],
        };
        this.temperatureService = {
            service: 'e95d6100-251d-470a-a062-fa1922dfa9a8',
            characteristics: [
                {
                    key: 'temperaturePeriod',
                    uuid: 'e95d1b25-251d-470a-a062-fa1922dfa9a8',
                    type: 'write',
                },
                {
                    key: 'temperatureData',
                    uuid: 'e95d9250-251d-470a-a062-fa1922dfa9a8',
                    type: 'read',
                },
            ],
        };

        this.wholeServices = [
            this.buttonService,
            this.ledService,
            this.accelerometerService,
            this.magnetometerService,
            this.temperatureService,
        ];
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
            optionalServices: this.wholeServices.map((serviceObject) => serviceObject.service),
        };
    }

    /**
     * @typedef {Object} Profile
     * @property {{type: string, uuid: string, key: string}[]} characteristics - 서비스 내 특성들
     * @property {string} service - 등록하고자 하는 서비스 uuid
     * @returns Profile[]
     */
    getProfiles() {
        return this.wholeServices;
    }

    /**
     *
     * @param key {string} - 특성 Profile 에 작성한 key 값
     * @param value {*}
     */
    handleLocalData({ key, value }) {
        console.log(key);
        switch (key) {
            case 'buttonAState':
            case 'buttonBState':
                this.sensorStateMap[key] = value.readUInt8();
                break;
            case 'magnetometerData':
                this.sensorStateMap[key] = {
                    x: value.readInt16LE(0),
                    y: value.readInt16LE(2),
                    z: value.readInt16LE(4),
                };
                break;
            case 'accelerometerData':
                this.sensorStateMap[key] = {
                    x: value.readInt16LE(0) / 1000,
                    y: value.readInt16LE(2) / 1000,
                    z: value.readInt16LE(4) / 1000,
                };
                break;
            case 'temperatureData':
                this.sensorStateMap[key] = value.readInt8();
        }
        console.log('handleLocalData', this.sensorStateMap);
    }

    requestRemoteData(handler) {
        console.log('requestRemoteData', this.sensorStateMap);
        handler.write('data', this.sensorStateMap);
    }

    handleRemoteData(handler) {
        const value = handler.read('string');
        this._commandQueue.push({
            key: 'ledText',
            value,
        });
    }

    /**
     * BLE 특정 특성에 데이터를 전송한다.
     * 반환값 구조에 key 가 없으면 전송해도 쓸모가 없다.
     * 만약 callback 이 선언되어있으면, 해당 커맨드가 실행되고 callback 을 실행한다.
     * callback 이 Promise 형태인 경우는 완료를 기다린다.
     * 이 딜레이는 다음 커맨드를 송신하는데 영향을 준다.
     * @param {[]} commandQueue
     * @return {{key: string, value: string, callback: function=}}
     */
    requestLocalData(commandQueue) {
        if (this._commandQueue.length) {
            commandQueue.push(...this._commandQueue.splice(0));
        }
    }
}

module.exports = new MicrobitBle();
