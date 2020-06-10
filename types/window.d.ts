/// <reference types="Electron" />

declare interface Preload {
    ipcRenderer: Electron.IpcRenderer;
    translator: import('../app/src/preload/translator').default;
    clipboard: {
        writeText(str: string): void;
    }
    rendererRouter: import('../app/src/preload/rendererRouter').default; //instance
    os: string;
}

declare interface Window extends Preload {
    Modal: any;
    Lang: any;
}

// eslint-disable-next-line no-var
declare var Lang: any;
