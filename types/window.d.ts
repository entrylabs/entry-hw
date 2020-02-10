/// <reference types="Electron" />
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
    os: string;
}

declare interface Window extends Preload {
    Modal: any;
    Lang: any;
}

// eslint-disable-next-line no-var
declare var Lang: any;
