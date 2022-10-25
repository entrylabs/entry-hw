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
        height: 100%;
        margin: 0;
        background-color: #ecf4ff;
    }
`;

export default GlobalStyle;
