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
