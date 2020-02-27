import { ipcRenderer, IpcRendererEvent } from 'electron';

class IpcRendererManager {
    static instance: IpcRendererManager;

    constructor() {
        if (IpcRendererManager.instance) {
            return IpcRendererManager.instance;
        } else {
            IpcRendererManager.instance = this;
        }
    }

    handle<T = any>(channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => Promise<T> | void) {
        ipcRenderer.on(channel, async (event, key, ...args) => {
            const result = await callback(event, ...args);

            // noinspection ES6MissingAwait
            ipcRenderer.invoke(key, result);
        });
    }

    invoke = ipcRenderer.invoke.bind(ipcRenderer);
}

export default IpcRendererManager;
