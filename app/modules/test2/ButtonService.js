class ButtonService {
    static get uuid() {
        return 'e95d9882-251d-470a-a062-fa1922dfa9a8';
    }

    static get characteristics() {
        return {
            buttonAState: 'e95dda90-251d-470a-a062-fa1922dfa9a8',
            buttonBState: 'e95dda91-251d-470a-a062-fa1922dfa9a8',
        };
    }

    async init(services) {
        const service = services.find(
            (service) => service.uuid === ButtonService.uuid,
        );

        for (const key in ButtonService.characteristics) {
            const characteristic = await service.getCharacteristic(
                ButtonService.characteristics[key],
            );
            await characteristic.startNotifications();
            characteristic.addEventListener(
                'characteristicvaluechanged',
                ({ target }) => {
                    console.log(target.value.getInt8(0));
                },
            );
        }
        console.log('init', service);
    }
}

module.exports = ButtonService;
