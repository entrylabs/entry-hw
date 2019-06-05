const { ipcRenderer, shell, clipboard, remote } = require('electron');
const Translator = require('./js/translator');
const RendererRouter = require('./js/rendererRouter');
const constants = require('../common/constants');
(function() {
    window.ipcRenderer = ipcRenderer;
    window.shell = shell;
    window.clipboard = clipboard;
    window.remote = remote;
    window.RendererRouter = RendererRouter;
    window.constants = constants;

    const translator = new Translator();
    const lang = translator.currentLangauge;
    window.lang = lang;
    window.Lang = require(`./lang/${lang}.js`).Lang;
    window.translator = translator;


    window.platform = process.platform;
    function isOSWin64() {
        return (
            process.arch === 'x64' ||
            process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')
        );
    }
    window.os = `${process.platform}-${isOSWin64() ? 'x64' : process.arch}`;
})();
