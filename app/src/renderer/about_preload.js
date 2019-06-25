const { ipcRenderer, remote, shell } = require('electron');
const Translator = require('./js/translator');

function getInitializeList() {
    const preload = {};
    preload.ipcRenderer = ipcRenderer;

    const translator = new Translator();
    const lang = translator.currentLangauge;
    preload.Lang = require(`./lang/${lang}.js`).Lang;

    preload.getAboutWindow = () => remote.getCurrentWindow();
    preload.hardwareVersion = remote.getGlobal('sharedObject').hardwareVersion || '0.0.0';
    preload.openExternal = (url) => shell.openExternal(url);

    return preload;
}

(function() {
    window.preload = getInitializeList();
})();
