import {BrowserWindow, WebContents} from 'electron';

export default class {
    static sender: WebContents;

    static initialize(rendererWindow: BrowserWindow) {
        this.sender = rendererWindow.webContents;
    }

    static log(contents: string, ...args: string[]) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', contents, ...args);
        }
    }

    static info(contents: string) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', `%c${contents}`, 'color: dodgerblue');
        }
    }

    static warn(contents: string) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', `%c${contents}`, 'color: orange');
        }
    }

    static error<T extends Error = Error>(contents: string, error: T) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', `%c${contents}`, 'color: red', error);
        }
    }
};
