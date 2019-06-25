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
         1. constructor 의 인자값 - 하드코딩
         2. config.[name].json 파일의 language 값
         3. window.navigator 의 값 (chromium)
         4. default 값 = 'ko'
         */
        const browserLanguage = window.navigator.userLanguage || window.navigator.language;
        this.lang = lang ||
            global.sharedObject.language ||
            (browserLanguage && browserLanguage.substr(0, 2)) ||
            'ko';
        this.data = require('./translations.json');
    }

    translate(str) {
        const value = this.data[str] || [];
        return value[this.lang] || str;
    }
};
