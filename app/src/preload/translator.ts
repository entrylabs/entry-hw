class Translator {
    public lang: string;
    private readonly data: any;

    get currentLanguage() {
        return this.lang;
    }

    constructor(lang?: string) {
        if (!window.navigator) {
            throw Error('translator must be created on browser environment');
        }

        const selectedLang =
            lang ||
            window.navigator.language?.substr(0, 2) ||
            'ko';
        
        this.lang = selectedLang;
        this.setGlobalLang(selectedLang);
        this.data = require('./translations.json');
    }

    translate(str: string) {
        const value = this.data[str] || [];
        return value[this.lang] || str;
    }
    
    private setGlobalLang(lang: string) {
        window.Lang = require(`./lang/${lang}.js`).Lang;        
    }
}

export default Translator;
