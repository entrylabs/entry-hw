const { ipcRenderer, translator, rendererRouter, clipboard, os } = window;

function usePreload() {
    return {
        ipcRenderer,
        translator,
        rendererRouter, //TODO
        clipboard,
        os,
    };
}

export default usePreload;
