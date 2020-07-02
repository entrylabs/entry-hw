import React from 'react';
import Styled from 'styled-components';
import { toggleLicenseView } from '../../store/modules/common';
import { useDispatch } from 'react-redux';
import Logo from '../../../../images/logo.png';
import usePreload from '../../hooks/usePreload';

const FooterContainer = Styled.div`
    flex: none;
    width: 100%;
    height: 60px;
    background-position: 30px 15px;
    background-repeat: no-repeat;
    background-image: url(${Logo});
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

const Footer: React.FC = () => {
    const { translator, rendererRouter } = usePreload();
    const dispatch = useDispatch();

    return (
        <FooterContainer>
            <VersionLabel
                id="version_label"
                onClick={() => {
                    rendererRouter.requestOpenAboutWindow();
                }}
            >
                {translator.translate('Version Info')}
            </VersionLabel>
            <OpenSourceLabel
                id="opensource_label"
                onClick={() => {
                    toggleLicenseView(dispatch)(true);
                }}
            >
                {translator.translate('Opensource lincense')}
            </OpenSourceLabel>
        </FooterContainer>
    );
};

export default Footer;
