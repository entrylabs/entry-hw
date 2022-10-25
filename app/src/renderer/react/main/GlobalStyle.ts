import { createGlobalStyle } from 'styled-components';
// import NanumGothicFont from '../../fonts/NanumGothic.woff';

const GlobalStyle = createGlobalStyle`
    /* EntryFont-700 - latin_japanese */
    @font-face {
        font-family: 'EntryFont';
        font-style: normal;
        font-weight: 700;
        src: local('メイリオ'), local('Meiryo'), local('ヒラギノ角ゴ Pro W3'),
            local('Hiragino Kaku Gothic Pro'), local('ＭＳ Ｐゴシック'), local('MS PGothic'),
            local('-apple-system'), local('system'), local('sans-serif');
    }

    /* EntryFont-700 - latin_japanese */
    @font-face {
        font-family: 'EntryFont';
        font-style: normal;
        font-weight: bold;
        src: local('メイリオ'), local('Meiryo'), local('ヒラギノ角ゴ Pro W3'),
            local('Hiragino Kaku Gothic Pro'), local('ＭＳ Ｐゴシック'), local('MS PGothic'),
            local('-apple-system'), local('system'), local('sans-serif');
    }

    /* EntryFont-regular - latin_japanese */
    @font-face {
        font-family: 'EntryFont';
        font-style: normal;
        font-weight: 400;
        src: local('メイリオ'), local('Meiryo'), local('ヒラギノ角ゴ Pro W3'),
            local('Hiragino Kaku Gothic Pro'), local('ＭＳ Ｐゴシック'), local('MS PGothic'),
            local('-apple-system'), local('system'), local('sans-serif');
    }

    /* EntryFont-regular - latin_japanese */
    @font-face {
        font-family: 'EntryFont';
        font-style: normal;
        font-weight: normal;
        src: local('メイリオ'), local('Meiryo'), local('ヒラギノ角ゴ Pro W3'),
            local('Hiragino Kaku Gothic Pro'), local('ＭＳ Ｐゴシック'), local('MS PGothic'),
            local('-apple-system'), local('system'), local('sans-serif');
    }

    * {
        font-family: 'EntryFont' !important;
        user-select: none;
        cursor: default;
    }
    
    html,
    body,
    #__main {
        margin: 0;
        padding: 0;
        border: 0;
        outline: 0;
        font-family: Arial, Dotum;
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
