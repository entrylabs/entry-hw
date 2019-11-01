interface ITranslator {
    translate: (str: string) => string;
    currentLanguage: string;
}

declare interface Preload {
    ipcRenderer: Electron.IpcRenderer;
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
