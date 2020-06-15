import React from 'react';
import { useSelector } from 'react-redux';
import { IStoreState } from '../../store';
import { range } from 'lodash';
import styled from 'styled-components';

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

const DotProgressPanel: React.FC = () => {
    const selectedHardware = useSelector<IStoreState, IHardwareConfig | undefined>(
        state => state.connection.selectedHardware,
    );

    if (!selectedHardware) {
        return <></>;
    }

    return (
        <ProgressContainer>
            {
                range(16)
                    .map((number) => (
                        <ProgressDot key={number}/>
                    ))
            }
        </ProgressContainer>
    );
};

export default DotProgressPanel;
