import React from 'react';
import Styled from 'styled-components';
import ProgressDot from './ProgressDot';
import withPreload from '../../hoc/withPreload';

const HardwarePanel = Styled.div`
    display: none;
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
    height: 100%;
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

const HardwareConnectionContainer: React.FC<Preload> = (props) => {
    const { translator } = props;
    return (
        <HardwarePanel id="hwPanel">
            <ReferenceMidDiv>
                <ReferenceDiv id="reference">
                    <div id="emailArea">
                        <span>{translator.translate('E-Mail : ')}</span>
                        <ReferenceContentSpan id="email"/>
                    </div>
                    <div id="urlArea">
                        <span>{translator.translate('WebSite : ')}</span>
                        <ReferenceContentSpan id="url"/>
                    </div>
                    <div id="videoArea">
                        <span>{translator.translate('Video : ')}</span>
                        <ReferenceContentSpan id="video"/>
                    </div>
                </ReferenceDiv>
                <ClientElement>
                    <img src="../images/computer.png" alt={''}/>
                    <div id="driverButtonSet"/>
                </ClientElement>
                <ProgressDot/>
                <HardwareElement>
                    <SelectedHardwareThumb id="selectedHWThumb" alt={''}/>
                    <div id="firmwareButtonSet">
                        <button name="firmware" className="hwPanelBtn"/>
                    </div>
                </HardwareElement>
            </ReferenceMidDiv>
        </HardwarePanel>
    );
};

export default withPreload(HardwareConnectionContainer);
