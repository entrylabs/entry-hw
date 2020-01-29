module.exports = class {
    get currentLanguage() {
        return this.lang;
    }

    constructor(lang) {
        if (!window.navigator) {
            throw Error('translator must be created on browser environment');
        }

        let selectedLang = lang || 'ko';
        const browserLanguage = window.navigator.userLanguage || window.navigator.language;
        if (browserLanguage) {
            selectedLang = browserLanguage.substr(0, 2);
        }
        // else { selectedLang = 'en' }
        // 기존 로직은 위와 같으나 translations.json 구조상 key 가 en 언어셋이므로 key 를 리턴하기로 함.

        this.lang = selectedLang;
        this.data = require('./translations.json');
    }

    translate(str) {
        const value = this.data[str] || [];
        return value[this.lang] || str;
    }
};
