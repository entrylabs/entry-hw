import React from 'react';
import ReactDOM from 'react-dom';
import Main from './components/main';
import Footer from './components/Footer';
import Header from './components/Header';

ReactDOM.render(
    <>
        <Header/>
        <Main/>
        <Footer/>
    </>,
    document.getElementById('__main'),
);
