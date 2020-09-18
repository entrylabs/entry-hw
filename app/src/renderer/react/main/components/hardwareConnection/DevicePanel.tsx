import FirmwareButtonSetElement from './FirmwareButtonSetElement';
import React, { useMemo, useState } from 'react';
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
    const [imageFound, setImageFound] = useState(true);

    if (!selectedHardware) {
        return <React.Fragment />;
    }

    const { icon, firmware } = selectedHardware;
    const getImageSrc = useMemo(() => {
        if (!imageFound) {
            return `${rendererRouter.staticModulePath}/${icon}`;
        }
        return `${rendererRouter.baseModulePath}/${icon}`;
    }, [imageFound]);

    return (
        <HardwareElement>
            <SelectedHardwareThumb
                alt={''}
                src={getImageSrc}
                onError={() => {
                    setImageFound(false);
                }}
            />
            {firmware && (
                <div id="firmwareButtonSet">
                    <FirmwareButtonSetElement buttonSet={firmware} />
                </div>
            )}
        </HardwareElement>
    );
};

export default DevicePanel;
