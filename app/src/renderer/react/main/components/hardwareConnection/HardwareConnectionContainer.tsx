import React, { useCallback } from 'react';
import Styled from 'styled-components';
import ProgressDot from './ProgressDot';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapStateToProps } from '../../store';
import DriverButtonSetElement from './DriverButtonSetElement';
import FirmwareButtonSetElement from './FirmwareButtonSetElement';
import ComputerImage from '../../../../images/computer.png';

const HardwarePanel = Styled.div`
    display: flex;
    flex-grow: 1;
    width: 100%;
`;

const ReferenceDiv = Styled.div`
    margin-bottom: 25px;
    text-align: right;
    font-weight: bold;
    line-height: 25px;
    font-size: 14px;
    color: #595757;
`;

const ReferenceMidDiv = Styled.div`
    margin: auto;
`;

const ReferenceContentSpan = Styled.span`
    width: 100%;
    height: 100%;
    text-align: left;
    cursor: pointer;
    text-decoration: underline;
`;

const HardwarePanelElementDiv = Styled.div`
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const ClientElement = Styled(HardwarePanelElementDiv)`
    width: 210px;
`;

const HardwareElement = Styled(HardwarePanelElementDiv)`
    width: 210px;
`;

const SelectedHardwareThumb = Styled.img`
    width: 135px;
    height: 135px;
`;

const HardwareConnectionContainer: React.FC<IStateProps & Preload> = (props) => {
    const { translator, clipboard, selectedHardware, rendererRouter } = props;
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
                        <div id="emailArea" onClick={() => {
                            copyString(email);
                        }}>
                            <span>{translator.translate('E-Mail : ')}</span>
                            <ReferenceContentSpan id="email">{email}</ReferenceContentSpan>
                        </div>
                    }
                    {
                        url &&
                        <div id="urlArea" onClick={() => rendererRouter.openExternalUrl(url)}>
                            <span>{translator.translate('WebSite : ')}</span>
                            <ReferenceContentSpan id="url">{url}</ReferenceContentSpan>
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

interface IStateProps {
    selectedHardware?: IHardwareConfig;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    selectedHardware: state.connection.selectedHardware,
});


export default connect(mapStateToProps)(withPreload(HardwareConnectionContainer));
