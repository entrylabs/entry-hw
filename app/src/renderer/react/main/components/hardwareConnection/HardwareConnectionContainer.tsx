import React, { useCallback } from 'react';
import styled from 'styled-components';
import ProgressDot from './ProgressDot';
import { useSelector } from 'react-redux';
import { IStoreState } from '../../store';
import DriverButtonSetElement from './DriverButtonSetElement';
import FirmwareButtonSetElement from './FirmwareButtonSetElement';
import ComputerImage from '../../../../images/computer.png';
import usePreload from '../../hoc/usePreload';

const HardwarePanel = styled.div`
    display: flex;
    flex-grow: 1;
    width: 100%;
`;

const ReferenceDiv = styled.div`
    display: grid;
    margin-bottom: 25px;
    text-align: right;
    font-weight: bold;
    line-height: 25px;
    font-size: 14px;
    color: #595757;
`;

const ReferenceMidDiv = styled.div`
    margin: auto;
`;

const ReferenceContentSpan = styled.span`
    width: 100%;
    height: 100%;
    text-align: left;
    cursor: pointer;
    text-decoration: underline;
`;

const HardwarePanelElementDiv = styled.div`
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const ClientElement = styled(HardwarePanelElementDiv)`
    width: 210px;
`;

const HardwareElement = styled(HardwarePanelElementDiv)`
    width: 210px;
`;

const SelectedHardwareThumb = styled.img`
    width: 135px;
    height: 135px;
`;

const RightBox = styled.div`
    float: right;
`;

const HardwareConnectionContainer: React.FC = () => {
    const { translator, clipboard, rendererRouter } = usePreload();
    const selectedHardware = useSelector<IStoreState, IHardwareConfig | undefined>(
        state => state.connection.selectedHardware,
    );
    const copyString = useCallback((str: string) => {
        clipboard.writeText(str);
        alert(translator.translate('Copied to clipboard'));
    }, []);

    if (!selectedHardware) {
        return <HardwarePanel/>;
    }

    const { email, url, video, icon, driver, firmware } = selectedHardware;

    return (
        <HardwarePanel id="hwPanel">
            <ReferenceMidDiv>
                <ReferenceDiv id="reference">
                    {
                        email &&
                        <div id="emailArea">
                            <RightBox onClick={() => {
                                copyString(email);
                            }}>
                                <span>{translator.translate('E-Mail : ')}</span>
                                <ReferenceContentSpan id="email">{email}</ReferenceContentSpan>
                            </RightBox>
                        </div>
                    }
                    {
                        url &&
                        <div id="urlArea">
                            <RightBox onClick={() => rendererRouter.openExternalUrl(url)}>
                                <span>{translator.translate('WebSite : ')}</span>
                                <ReferenceContentSpan id="url">{url}</ReferenceContentSpan>
                            </RightBox>
                        </div>
                    }
                    {
                        video &&
                        <div id="videoArea">
                            <span>{translator.translate('Video : ')}</span>
                            {
                                video instanceof Array
                                    ? video.map((videoElement) => (
                                        <React.Fragment key={videoElement}>
                                            <ReferenceContentSpan
                                                id="video"
                                                onClick={() => rendererRouter.openExternalUrl(videoElement)}
                                            >{videoElement}</ReferenceContentSpan>
                                            <br/>
                                        </React.Fragment>
                                    ))
                                    : <ReferenceContentSpan
                                        id="video"
                                        onClick={() => rendererRouter.openExternalUrl(video)}
                                    >{video}</ReferenceContentSpan>
                            }
                        </div>
                    }
                </ReferenceDiv>
                <ClientElement>
                    <img src={ComputerImage} alt={''}/>
                    {
                        driver &&
                        <div id="driverButtonSet">
                            <DriverButtonSetElement buttonSet={driver}/>
                        </div>
                    }
                </ClientElement>
                <ProgressDot/>
                <HardwareElement>
                    <SelectedHardwareThumb
                        alt={''}
                        src={`${rendererRouter.baseModulePath}/${icon}`}
                    />
                    {
                        firmware &&
                        <div id="firmwareButtonSet">
                            <FirmwareButtonSetElement buttonSet={firmware}/>
                        </div>
                    }
                </HardwareElement>
            </ReferenceMidDiv>
        </HardwarePanel>
    );
};

export default HardwareConnectionContainer;
