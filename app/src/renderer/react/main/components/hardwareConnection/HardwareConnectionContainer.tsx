import React from 'react';
import styled from 'styled-components';
import { range } from 'lodash';
import { useSelector } from 'react-redux';
import { IStoreState } from '../../store';
import ReferencePanel from './ReferencePanel';
import ClientPanel from './ClientPanel';
import DevicePanel from './DevicePanel';

const HardwarePanel = styled.div`
    display: flex;
    flex-grow: 1;
    width: 100%;
`;

const HardwareContentsDiv = styled.div`
    margin: auto;
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
                <DevicePanel />
            </HardwareContentsDiv>
        </HardwarePanel>
    );
};

export default HardwareConnectionContainer;
