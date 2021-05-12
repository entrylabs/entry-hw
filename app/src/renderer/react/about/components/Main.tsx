import React, { useEffect, useState } from 'react';
import Styled from 'styled-components';
import Logo from '../../../images/about/logo.png';
import Fill from '../../../images/about/fill-1.png';

const { translator, rendererRouter, ipcRenderer } = window;

const MainContainer = Styled.div`
    height: 100%;
    display: flex;
`;

const InnerContainer = Styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    text-align: center;
    align-self: center;
    align-items: center;
`;

const LogoWrapper = Styled.div`
    background-image: url(${Fill});
    background-repeat: repeat-x;
    width: 100%;
    height: 142px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const LogoImage = Styled.img`
    width: 204px;
    height: 42px;
`;

const VersionNotifyContainer = Styled.div`
    font-size: 16px;
    margin: 16px 0 10px;
`;

const VersionUpdateButton = Styled.button`
    cursor: pointer;
    padding-left: 14px;
    padding-right: 14px;
    height: 42px;
    line-height: 42px;
    background-color: #6e5ae6;
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
    color: #6e5ae6;
    cursor: pointer !important;
`;

const hideWindow = () => {
    rendererRouter.closeAboutWindow();
};

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

    return (
        <MainContainer>
            <InnerContainer>
                <LogoWrapper className={'logo_wrapper'}>
                    <LogoImage src={Logo} className={'logo'} alt="logo" />
                </LogoWrapper>
                <div>
                    <VersionNotifyContainer>
                        {/* TODO 만약 오프라인에서도 하드웨어의 버전을 알아야 한다면 이부분은 다른 로직이 되어야한다. */}
                        {`Version ${currentVersion}`}
                        <br />
                        <HomepageLinkAnchor
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                rendererRouter.openExternalUrl('https://playentry.org');
                            }}
                        >
                            https://playentry.org
                        </HomepageLinkAnchor>
                    </VersionNotifyContainer>
                    <div>
                        {hasNewVersion ? (
                            <VersionUpdateButton
                                onClick={() => {
                                    rendererRouter.openExternalUrl(
                                        'https://playentry.org/#!/offlineEditor'
                                    );
                                }}
                            >
                                {translator.translate('Download the latest version')}
                            </VersionUpdateButton>
                        ) : (
                            <LatestVersionNotifyText>
                                {translator.translate('You are running the latest version.')}
                            </LatestVersionNotifyText>
                        )}
                    </div>
                </div>
            </InnerContainer>
        </MainContainer>
    );
};

export default Main;
