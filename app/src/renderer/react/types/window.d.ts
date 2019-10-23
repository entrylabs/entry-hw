interface ITranslator {
    translate: (str: string) => string;
}

declare interface Preload {
    translator: ITranslator;
    rendererRouter: any;
}

declare interface Window extends Preload {
}
