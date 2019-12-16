class LedService {
    static get uuid() {
        return 'e95dd91d-251d-470a-a062-fa1922dfa9a8';
    }

    static get characteristics() {
        return {
            ledMatrixState: 'e95d7b77-251d-470a-a062-fa1922dfa9a8',
            ledText: 'e95d93ee-251d-470a-a062-fa1922dfa9a8',
            scrollingDelay: 'e95d0d2d-251d-470a-a062-fa1922dfa9a8',
        };
    }

    characteristics = {};

    async init(services) {
        const service = services.find(
            (service) => service.uuid === LedService.uuid,
        );

        for (const key in LedService.characteristics) {
            LedService.characteristics[key];
            const characteristic = await service.getCharacteristic(
                LedService.characteristics[key],
            );
            // await characteristic.startNotifications();
            this.characteristics[key] = characteristic;
            console.log(characteristic);
        }

        this.writeText('hi');
    }

    encodeString(text) {
        const buffer = new ArrayBuffer(text.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < text.length; i++) {
            view[i] = text.charCodeAt(i);
        }
        return buffer;
    }

    writeText(text) {
        this.characteristics['ledText'].writeValue(this.encodeString(text));
    }
}

module.exports = LedService;
