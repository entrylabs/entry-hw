const { ipcRenderer, clipboard, remote } = require('electron');
const Translator = require('./js/translator');
const RendererRouter = require('./js/rendererRouter');
const constants = require('../common/constants');

function getInitializeList() {
    const preload = {};
    preload.ipcRenderer = ipcRenderer;
    preload.clipboard = clipboard;
    preload.remote = remote;
    preload.rendererRouter = new RendererRouter();
    preload.constants = constants;

    const translator = new Translator();
    const lang = translator.currentLanguage;
    preload.Lang = require(`./lang/${lang}.js`).Lang;
    preload.translator = translator;

    const isOSWin64 = () => (
        process.arch === 'x64' ||
        // eslint-disable-next-line no-prototype-builtins
        process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')
    );
    preload.os = `${process.platform}-${isOSWin64() ? 'x64' : process.arch}`;

    return preload;
}

// TODO Lang 에 있는 하드웨어 관련 템플릿 전부 translator 로 처리
(function() {
    Object.assign(window, getInitializeList());
})();
