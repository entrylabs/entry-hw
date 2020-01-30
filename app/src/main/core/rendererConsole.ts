import { BrowserWindow, WebContents } from 'electron';

class RendererConsole {
    static sender: WebContents;

    static initialize(rendererWindow: BrowserWindow) {
        this.sender = rendererWindow.webContents;
    }

    static log(contents: any, ...args: any[]) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', contents, ...args);
        }
    }

    static info(contents: any) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', `%c${contents}`, 'color: dodgerblue');
        }
    }

    static warn(contents: any) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', `%c${contents}`, 'color: orange');
        }
    }

    static error<T extends Error = Error>(contents: any, error: T) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', `%c${contents}`, 'color: red', error);
        }
    }
}

export default RendererConsole;
module.exports = RendererConsole;
