import React from 'react';
import Styled from 'styled-components';

const FooterContainer = Styled.div`
    flex: none;
    width: 100%;
    height: 60px;
    background-position: 30px 15px;
    background-repeat: no-repeat;
    background-image: url('../images/logo.png');
    background-color: white;
`;

const VersionLabel = Styled.div`
    text-align: right;
    margin: 20px 20px 20px 10px;
    color: #595757;
    cursor: pointer;
    font-weight: bold;
    float: right;
`;

const OpenSourceLabel = Styled.div`
    text-align: right;
    margin: 20px 10px 20px 20px;
    color: #595757;
    cursor: pointer;
    font-weight: bold;
    float: right;
`;

export default () => {
    return (
        <FooterContainer>
            <VersionLabel id="version_label">
                버전 정보
            </VersionLabel>
            <OpenSourceLabel id="opensource_label">
                오픈소스 라이선스
            </OpenSourceLabel>
        </FooterContainer>
    );
}
