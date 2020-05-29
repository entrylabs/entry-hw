import React from 'react';
import styled from 'styled-components';
import {range} from 'lodash';
import {useSelector} from 'react-redux';
import {IStoreState} from '../../store';
import FirmwareButtonSetElement from './FirmwareButtonSetElement';
import usePreload from '../../hoc/usePreload';
import ReferencePanel from './ReferencePanel';
import ClientPanel from './ClientPanel';

const HardwarePanel = styled.div`
    display: flex;
    flex-grow: 1;
    width: 100%;
`;

const HardwareContentsDiv = styled.div`
    margin: auto;
`;

const HardwarePanelElementDiv = styled.div`
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const ProgressContainer = styled.div`
    width: 137px;
    margin-right: -7px;
    padding-top: 22px;
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const ProgressDot = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 5px;
    display: inline-block;
    background-color: #ccc;
    margin-right: 7px;
    margin-bottom: 33px;
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

const HardwareConnectionContainer: React.FC = () => {
    const { rendererRouter } = usePreload();
    const selectedHardware = useSelector<IStoreState, IHardwareConfig | undefined>(
        state => state.connection.selectedHardware,
    );

    if (!selectedHardware) {
        return <HardwarePanel/>;
    }

    const { icon, firmware } = selectedHardware;

    return (
        <HardwarePanel id="hwPanel">
            <HardwareContentsDiv>
                <ReferencePanel />
                <ClientPanel />
                <ProgressContainer>
                    {
                        range(16)
                            .map((number) => (
                                <ProgressDot key={number}/>
                            ))
                    }
                </ProgressContainer>
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
            </HardwareContentsDiv>
        </HardwarePanel>
    );
};

export default HardwareConnectionContainer;
