const BaseModule = require('../baseModule');
const ButtonService = require('./ButtonService');
const LedService = require('./LedService');

class Test2 extends BaseModule {
    constructor() {
        super();
        this.buttonService = new ButtonService();
        this.ledService = new LedService();
    }

    getOptions() {
        return {
            filters: [
                {
                    namePrefix: 'BBC micro:bit',
                },
            ],
            optionalServices: [ButtonService.uuid, LedService.uuid],
        };
    }

    async connect() {
        if (!this.device.gatt.connected) {
            await this.device.gatt.connect();
        }
        this.services = await this.device.gatt.getPrimaryServices();
        await this.buttonService.init(this.services);
        await this.ledService.init(this.services);
        console.log('connect');
    }

    async disconnect() {
        if (this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
        console.log('disconnect');
    }
}

module.exports = new Test2();
