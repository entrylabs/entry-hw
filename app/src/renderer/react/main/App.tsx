import React from 'react';
import ReactDOM from 'react-dom';
import Main from './components/Main';
import Footer from './components/common/Footer';
import Header from './components/common/Header';
import { Provider } from 'react-redux';
import store from './store';
import GlobalStyle from './GlobalStyle';
import IpcRendererWatchComponent from './components/IpcRendererWatchComponent';
import GlobalEventListener from './GlobalEventListener';

const { rendererRouter } = window;

ReactDOM.render(
    <>
        <Provider store={store}>
            <IpcRendererWatchComponent />
            <Header/>
            <Main/>
            <Footer/>
            <GlobalStyle/>
            <GlobalEventListener/>
        </Provider>
    </>,
    document.getElementById('__main'),
);

// 첫 렌더가 완료된 후 프로그램을 업데이트한다.
rendererRouter.checkProgramUpdate();
