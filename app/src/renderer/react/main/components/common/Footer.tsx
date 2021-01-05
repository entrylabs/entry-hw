import React from 'react';
import styled from 'styled-components';
import { toggleLicenseView } from '../../store/modules/common';
import { useDispatch, useSelector } from 'react-redux';
import Logo from '../../../../images/logo.png';
import usePreload from '../../hooks/usePreload';
import { IStoreState } from '../../store';

const FooterContainer = styled.div`
    display: flex;
    flex-direction: row-reverse;
    width: 100%;
    height: 60px;
    background-position: 30px 15px;
    background-repeat: no-repeat;
    background-image: url(${Logo});
    background-color: white;
`;

const VersionLabel = styled.div`
    margin: 20px 20px 20px 10px;
    color: #595757;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-self: flex-end;
`;

const OpenSourceLabel = styled.div`
    margin: 20px 10px 20px 20px;
    color: #595757;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-self: flex-end;
`;

const InvalidatedInformLabel = styled.div`
    margin-top: 20px;
    color: #979797;
    padding-bottom: 40px;
    position: absolute;
    left: 35%;
`;

const Footer: React.FC = () => {
    const { translator, rendererRouter } = usePreload();
    const isInvalidBuild = useSelector<IStoreState>((state) => state.common.isInvalidBuild);
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
            {
                isInvalidBuild &&
                <InvalidatedInformLabel>
                    이 프로그램은 엔트리 공식 빌드가 아닙니다.
                </InvalidatedInformLabel>
            }
        </FooterContainer>
    );
};

export default Footer;
