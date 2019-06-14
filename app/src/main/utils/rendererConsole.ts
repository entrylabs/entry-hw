import { BrowserWindow, webContents } from 'electron';

class rendererConsole {
    static sender: webContents;
    /**
     * @param rendererWindow{BrowserWindow}
     */
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

    static error(contents: any, error: any) {
        if (!this.sender.isDestroyed()) {
            this.sender.send('console', `%c${contents}`, 'color: red', error);
        }
    }
};

module.exports = rendererConsole;
export default rendererConsole;
