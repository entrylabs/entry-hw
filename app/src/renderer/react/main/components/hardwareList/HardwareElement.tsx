import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { changeCurrentPageState } from '../../store/modules/common';
import { HardwareAvailableTypeEnum, HardwarePageStateEnum } from '../../constants/constants';
import { selectHardware } from '../../store/modules/connection';
import styled from 'styled-components';
import { requestHardwareModuleDownload } from '../../store/modules/hardware';
import EmptyDeviceImage from '../../../../images/empty_module_image.png';
import usePreload from '../../hooks/usePreload';

const HardwareTypeDiv = styled.div`
    width: 170px;
    height: 170px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const HardwareThumbnailContainer = styled.div`
    width: 100px;
    height: 100px;
    cursor: pointer;
    display: flex;
`;

const HardwareThumbnailImg = styled.img<{ type: HardwareAvailableTypeEnum }>`
    max-width: 100px;
    margin: auto;
    cursor: pointer;
    ${({ type }) => {
        if (type !== HardwareAvailableTypeEnum.available) {
            return 'filter: grayscale(1);';
        }
    }}
`;

const HardwareTitle = styled.h2`
    font-size: 12px;
    color: #595757;
    margin-top: 15px;
    cursor: pointer;
    display: flex;
`;

const HardwareElement: React.FC<{ hardware: IHardwareConfig }> = (props) => {
    const { translator, rendererRouter } = usePreload();
    const dispatch = useDispatch();
    const { hardware } = props;
    const { availableType } = hardware;

    const [isImageSrcNotFound, setImageNotFound] = useState(false);
    const langType = useMemo(() => translator.currentLanguage, [translator]);
    const onElementClick = useCallback(() => {
        if (availableType === HardwareAvailableTypeEnum.available) {
            selectHardware(dispatch)(hardware);
            changeCurrentPageState(dispatch)(HardwarePageStateEnum.connection);
        } else {
            hardware.moduleName
                ? requestHardwareModuleDownload(dispatch)(hardware.moduleName)
                : console.log('moduleName is not defined');
        }
    }, [hardware, availableType]);

    const getImageBaseSrc = useMemo(() => {
        if (isImageSrcNotFound) {
            return EmptyDeviceImage;
        }

        const imageBaseUrl = rendererRouter.sharedObject.moduleResourceUrl;

        switch (availableType) {
        case HardwareAvailableTypeEnum.needUpdate:
        case HardwareAvailableTypeEnum.needDownload:
            return `${imageBaseUrl}/${hardware.moduleName}/files/image`;
        case HardwareAvailableTypeEnum.available:
        default:
            return `${rendererRouter.baseModulePath}/${hardware.icon}`;
        }
    }, [isImageSrcNotFound, availableType]);

    return (
        <HardwareTypeDiv id={`${hardware.id}`} onClick={onElementClick}>
            <HardwareThumbnailContainer>
                <HardwareThumbnailImg
                    src={getImageBaseSrc}
                    type={availableType}
                    alt=""
                    onError={() => {
                        setImageNotFound(true);
                    }}
                />
            </HardwareThumbnailContainer>
            <HardwareTitle>
                {`${hardware.name && hardware.name[langType] || hardware.name.en}`}
            </HardwareTitle>
        </HardwareTypeDiv>
    );
};

export default HardwareElement;

