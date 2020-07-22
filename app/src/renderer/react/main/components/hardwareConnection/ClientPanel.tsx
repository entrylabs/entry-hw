import ComputerImage from '../../../../images/computer.png';
import DriverButtonSetElement from './DriverButtonSetElement';
import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { IStoreState } from '../../store';

const ClientElement = styled.div`
    width: 210px;
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const ClientPanel:React.FC = () => {
    const selectedHardware = useSelector<IStoreState, IHardwareConfig | undefined>(
        state => state.connection.selectedHardware,
    );

    if (!selectedHardware) {
        return <React.Fragment />;
    }

    const { driver } = selectedHardware;

    return (
        <ClientElement>
            <img src={ComputerImage} alt={''}/>
            {
                driver &&
                <div id="driverButtonSet">
                    <DriverButtonSetElement buttonSet={driver}/>
                </div>
            }
        </ClientElement>
    );
};

export default ClientPanel;
