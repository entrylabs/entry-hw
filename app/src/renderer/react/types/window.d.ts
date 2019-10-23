interface ITranslator {
    translate: (str: string) => string;
}

declare interface Preload {
    translator: ITranslator;
    rendererRouter: any; //instance
    Modal: any;
}

declare interface Window extends Preload {
    RendererRouter: any; //class
}
