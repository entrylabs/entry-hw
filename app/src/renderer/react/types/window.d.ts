interface ITranslator {
    translate: (str: string) => string;
}

declare interface Preload {
    translator: ITranslator;
}

declare interface Window extends Preload {
}
