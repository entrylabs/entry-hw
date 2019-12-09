import React from 'react';
import Styled from 'styled-components';

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
    background-image: url(../images/about/fill-1.png);
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
    display: none;
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
    display: none;
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

const Main: React.FC = () => {
    return (
        <MainContainer>
            <InnerContainer>
                <LogoWrapper className={'logo_wrapper'}>
                    <LogoImage src="../images/about/logo.png" className={'logo'} alt="logo"/>
                </LogoWrapper>
                <div>
                    <VersionNotifyContainer className={'txtVersion'}>
                        Version
                        <span id="version"/>
                        <br/>
                        <HomepageLinkAnchor href="#" id="playEntryBtn">
                            https://playentry.org
                        </HomepageLinkAnchor>
                    </VersionNotifyContainer>
                    <div>
                        <VersionUpdateButton className="btnVersionUpdate"/>
                        <LatestVersionNotifyText className="txtAlreadyVersion"/>
                    </div>
                </div>
            </InnerContainer>
        </MainContainer>
    );
};

export default Main;
