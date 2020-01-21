import { createGlobalStyle } from 'styled-components';
import NanumGothicFont from '../../fonts/NanumGothic.woff';

const GlobalStyle = createGlobalStyle`
    @font-face {
        font-family: NanumGothic;
        src: url(${NanumGothicFont});
    }
    
    .darwin ::-webkit-scrollbar {
        -webkit-appearance: none;
        width: 11px;
    }
    
    .darwin ::-webkit-scrollbar-thumb {
        border-radius: 8px;
        border: 2px solid white;
        /* should match background, can't be transparent */
        background-color: rgba(0, 0, 0, .5);
    }
    
    * {
        font-family: NanumGothic, sans-serif !important;
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        cursor: default;
        outline: none;
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
    }
    
    html,
    body,
    #__main {
        margin: 0;
        padding: 0;
        border: 0;
        outline: 0;
        font-family: NanumGothic, sans-serif;
        font-size: 10pt;
        overflow: hidden !important;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }
    
    button {
        cursor: pointer;
    }
`;

export default GlobalStyle;
