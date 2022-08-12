import FirmwareButtonSetElement from './FirmwareButtonSetElement';
import CustomButtonSetElement from './CustomButtonSetElement';
import React from 'react';
import styled from 'styled-components';
import usePreload from '../../hooks/usePreload';
import { useSelector } from 'react-redux';
import { IStoreState } from '../../store';

const HardwareElement = styled.div`
    width: 210px;
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const SelectedHardwareThumb = styled.img`
    width: 135px;
    height: 135px;
`;

const DevicePanel: React.FC = () => {
    const { rendererRouter } = usePreload();
    const selectedHardware = useSelector<IStoreState, IHardwareConfig | undefined>(
        (state) => state.connection.selectedHardware
    );

    if (!selectedHardware) {
        return <React.Fragment />;
    }

    const { icon, firmware, customButton } = selectedHardware;

    return (
        <HardwareElement>
            <SelectedHardwareThumb alt={''} src={`${rendererRouter.baseModulePath}/${icon}`} />
            {firmware && (
                <div id="firmwareButtonSet">
                    <FirmwareButtonSetElement buttonSet={firmware} />
                </div>
            )}
            {customButton && (
                <div id="customButtonSet">
                    <CustomButtonSetElement buttonSet={customButton} />
                </div>
            )}
        </HardwareElement>
    );
};

export default DevicePanel;
