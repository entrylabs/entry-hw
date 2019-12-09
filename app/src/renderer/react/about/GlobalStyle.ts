import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
    @font-face {
        font-family: NanumGothic;
        src: url('../fonts/NanumGothic.woff');
    }
    
    * {
        font-family: NanumGothic, serif !important;
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
