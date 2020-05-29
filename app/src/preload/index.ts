import { clipboard, ipcRenderer, remote } from 'electron';
import Translator from './translator';
import RendererRouter from './rendererRouter';
import BleRouter from './bleProcessManager';

const isOSWin64 = () => (
    process.arch === 'x64' ||
    // eslint-disable-next-line no-prototype-builtins
    process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')
);

function getInitializeList(): Preload {
    const rendererRouter = new RendererRouter();
    const locale = remote.app.getLocale().substr(0, 2);
    const translator = new Translator(locale);
    new BleRouter();

    return {
        ipcRenderer,
        clipboard,
        translator,
        os: `${process.platform}-${isOSWin64() ? 'x64' : process.arch}`,
        rendererRouter,
    };
}

// TODO Lang 에 있는 하드웨어 관련 템플릿 전부 translator 로 처리
(function() {
    Object.assign(window, getInitializeList());
})();
