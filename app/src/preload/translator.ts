class Translator {
    public lang: SupportedLanguage;
    private readonly data: any;

    get currentLanguage() {
        return this.lang;
    }

    constructor(lang?: SupportedLanguage) {
        if (!window.navigator) {
            throw Error('translator must be created on browser environment');
        }

        const selectedLang = lang || 'ko';

        this.lang = selectedLang;
        this.setGlobalLang(selectedLang);
        this.data = require('./translations.json');
    }

    translate(str: any) {
        if(typeof str == 'string') {
            const value = this.data[str] || [];
            return value[this.lang] || str;
        } else {
            return str[this.lang];
        }
    }

    private setGlobalLang(lang: string) {
        try {
            window.Lang = require(`./lang/${lang}.js`).Lang;
        } catch (e) {
            console.error(e);
            window.Lang = require(`./lang/en.js`).Lang;
        }
    }
}

export default Translator;
