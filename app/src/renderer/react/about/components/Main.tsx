import React, { useEffect, useState } from 'react';
import Styled from 'styled-components';
import Logo from '../../../images/about/logo.png';
import remote from '@electron/remote';

const { translator, rendererRouter, ipcRenderer } = window;

const MainContainer = Styled.div`
    height: 100%;
    display: flex;
    z-index:-1;
`;

const InnerContainer = Styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    text-align: center;
    align-self: center;
    align-items: center;
    background-color:white;
`;

const LogoWrapper = Styled.div`
    background-repeat: repeat-x;
    width: 100%;
    height: 142px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color:rgb(0, 185, 0);
`;

const LogoImage = Styled.img`
    width: 204px;
    height: 42px;
`;

const VersionNotifyContainer = Styled.div`
    font-size: 16px;
    margin: 16px 0 10px;
    background-color:white;
`;

const VersionUpdateButton = Styled.button`
    cursor: pointer;
    padding-left: 14px;
    padding-right: 14px;
    height: 42px;
    line-height: 42px;
    background-color: #00b900;
    border-radius: 3px;
    color: #ffffff;
`;

const LatestVersionNotifyText = Styled.div`
    height: 42px;
    line-height: 42px;
    font-weight: bold;
    color: #3b3b3b;
`;

const HomepageLinkAnchor = Styled.a`
    text-decoration: initial;
    color: #00b900;
    cursor: pointer !important;
`;

const LowerWrapper = Styled.div`
    background-color:white;
`;

const Main: React.FC = () => {
    const [hasNewVersion, toggleNewVersion] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('0.0.0');
    useEffect(() => {
        ipcRenderer.invoke('checkUpdate').then((result) => {
            setCurrentVersion(result.currentVersion || '0.0.0');
            toggleNewVersion(result.hasNewVersion || false);
        });
    }, []);

    useEffect(() => {
        document.body.addEventListener('click', hideWindow);
        return () => {
            document.body.removeEventListener('click', hideWindow);
        };
    }, []);

    const hideWindow = () => {
        rendererRouter.closeAboutWindow();
    };

    return (
        <MainContainer>
            <InnerContainer>
                <LogoWrapper className={'logo_wrapper'}>
                    <LogoImage src={Logo} className={'logo'} alt="logo" />
                </LogoWrapper>
                <LowerWrapper>
                    <VersionNotifyContainer>
                        {/* TODO 만약 오프라인에서도 하드웨어의 버전을 알아야 한다면 이부분은 다른 로직이 되어야한다. */}
                        {`Version ${currentVersion}`}
                        <br />
                        <HomepageLinkAnchor
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                rendererRouter.openExternalUrl(
                                    'https://entry.line.me'
                                );
                            }}
                        >
                            https://entry.line.me
                        </HomepageLinkAnchor>
                    </VersionNotifyContainer>
                    <div>
                        {hasNewVersion ? (
                            <VersionUpdateButton
                                onClick={(e) => {
                                    e.preventDefault();
                                    rendererRouter.openExternalUrl(
                                        'https://entry.line.me/policy/download'
                                    );
                                    hideWindow();
                                }}
                            >
                                {translator.translate(
                                    'Download the latest version'
                                )}
                            </VersionUpdateButton>
                        ) : (
                            <LatestVersionNotifyText>
                                {translator.translate(
                                    'You are running the latest version.'
                                )}
                            </LatestVersionNotifyText>
                        )}
                    </div>
                </LowerWrapper>
            </InnerContainer>
        </MainContainer>
    );
};

export default Main;
