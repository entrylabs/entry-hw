import React from 'react';
import ReactDOM from 'react-dom';
import Main from './components/Main';
import Footer from './components/common/Footer';
import Header from './components/common/Header';
import { Provider } from 'react-redux';
import store from './store';
import GlobalStyle from './GlobalStyle';
import IpcRendererWatchComponent from './components/IpcRendererWatchComponent';
import makeConsoleAsciiArt from './functions/makeConsoleAsciiArt';

const { rendererRouter } = window;

makeConsoleAsciiArt();
ReactDOM.render(
    <>
        <Provider store={store}>
            <IpcRendererWatchComponent/>
            <Header/>
            <Main/>
            <Footer/>
            <GlobalStyle/>
        </Provider>
    </>,
    document.getElementById('__main'),
    () => {
        // 첫 렌더가 완료된 후 하드웨어 리스트 업데이트한다.
        rendererRouter.refreshHardwareModules();
        rendererRouter.checkProgramUpdate();
    },
);
