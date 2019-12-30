'use strict';

module.exports = class HandlerClass {
    constructor(config) {
        this.config = config;

        const { id = 'FFFFFF' } = config;

        const [company, model, variation] =
            id.match(/.{1,2}/g).map((item) => parseInt(item, 16) & 0xFF);

        this.data = {
            company,
            model,
            variation,
            __metadata: {
                // 이 부분을 진짜 쓸 것이고, 위 부분은 레거시로 남겨두었다.
                company, model, variation,
            },
        };

        console.log('entry data handler created. module\'s id is', company, model, variation);
    }

    // legacy
    encode() {
        return this.data;
    }

    // legacy
    decode(data) {
        try {
            this.data = JSON.parse(data);
        } catch (e) {
            console.error('data from entry is failed parse to json');
        }
    }

    // legacy. 해당 키값이 존재하는지 확인한다. 이름의 출처는 불명
    e(key) {
        return this.data && !!this.data[key];
    }

    read(key) {
        return this.data ? this.data[key] : 0;
    }

    write(key, value) {
        if (!this.data) {
            return false;
        }

        this.data[key] = value;
        return true;
    }
};
