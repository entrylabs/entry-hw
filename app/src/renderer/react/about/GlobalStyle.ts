import { createGlobalStyle } from 'styled-components';
import NanumGothicFont from '../../fonts/NanumGothic.woff';

const GlobalStyle = createGlobalStyle`
    @font-face {
        font-family: NanumGothic;
        src: url(${NanumGothicFont});
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
