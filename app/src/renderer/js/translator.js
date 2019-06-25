module.exports = class {
    get currentLanguage() {
        return this.lang;
    }

    constructor(lang) {
        if (!window.navigator) {
            throw Error('translator must be created on browser environment');
        }

        /*
         langType 의 우선순위
         1. constructor 의 인자값 = 하드코딩 or config 내 language 값
         2. window.navigator 의 값 (chromium)
         3. default 값 = 'ko'
         */
        const browserLanguage = window.navigator.userLanguage || window.navigator.language;
        this.lang = lang ||
            (browserLanguage && browserLanguage.substr(0, 2)) ||
            'ko';
        this.data = require('./translations.json');
    }

    translate(str) {
        const value = this.data[str] || [];
        return value[this.lang] || str;
    }
};
