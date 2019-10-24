interface ITranslator {
    translate: (str: string) => string;
    currentLanguage: string;
}

declare interface Preload {
    translator: ITranslator;
    rendererRouter: any; //instance
    Modal: any;
}

declare interface Window extends Preload {

}
