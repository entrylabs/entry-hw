const { ipcRenderer, remote, shell } = require('electron');
const Translator = require('./js/translator');

function getInitializeList() {
    const preload = {};
    preload.ipcRenderer = ipcRenderer;

    const language = remote.getGlobal('sharedObject').language;
    const translator = new Translator(language);
    const lang = translator.currentLanguage;
    preload.Lang = require(`./lang/${lang}.js`).Lang;

    preload.getAboutWindow = () => remote.getCurrentWindow();
    preload.hardwareVersion = remote.getGlobal('sharedObject').hardwareVersion || '0.0.0';
    preload.openExternal = (url) => shell.openExternal(url);

    return preload;
}

(function() {
    window.preload = getInitializeList();
})();
