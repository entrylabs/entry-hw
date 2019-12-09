import ReactDOM from 'react-dom';
import React from 'react';
import GlobalStyle from './GlobalStyle';
import Main from './components/Main';

ReactDOM.render(
    <>
        <Main/>
        <GlobalStyle/>
    </>,
    document.getElementById('__main'),
);

// 첫 렌더가 완료된 후 프로그램을 업데이트한다.
// rendererRouter.checkProgramUpdate();
