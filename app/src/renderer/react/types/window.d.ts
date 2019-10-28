interface ITranslator {
    translate: (str: string) => string;
    currentLanguage: string;
}

declare interface Preload {
    translator: ITranslator;
    clipboard: {
        writeText(str: string): void;
    }
    rendererRouter: any; //instance
    Modal: any;
}

declare interface Window extends Preload {
    os: string;
}
