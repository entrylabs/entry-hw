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
    os: string;
}

declare interface Window extends Preload {
}
