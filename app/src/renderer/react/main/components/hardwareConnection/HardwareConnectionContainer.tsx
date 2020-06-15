import React from 'react';
import styled from 'styled-components';
import {useSelector} from 'react-redux';
import {IStoreState} from '../../store';
import ReferencePanel from './ReferencePanel';
import ClientPanel from './ClientPanel';
import DevicePanel from './DevicePanel';
import DotProgressPanel from './DotProgressPanel';
import HandShakePayloadPanel from './HandShakePayloadPanel';

const HardwarePanel = styled.div`
    display: flex;
    flex-grow: 1;
    width: 100%;
`;

const HardwareContentsDiv = styled.div`
    margin: auto;
`;

const HardwareConnectionContainer: React.FC = () => {
    const selectedHardware = useSelector<IStoreState, IHardwareConfig | undefined>(
        state => state.connection.selectedHardware,
    );

    if (!selectedHardware) {
        return <HardwarePanel/>;
    }

    return (
        <HardwarePanel id="hwPanel">
            <HardwareContentsDiv>
                <ReferencePanel/>
                <ClientPanel/>
                {
                    selectedHardware?.handshake
                        ? <HandShakePayloadPanel/>
                        : <DotProgressPanel/>
                }
                <DevicePanel/>
            </HardwareContentsDiv>
        </HardwarePanel>
    );
};

export default HardwareConnectionContainer;
