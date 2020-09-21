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

    // imageStatus = error counter;
    const [imageStatus, setImageStatus] = useState(0);
    const langType = useMemo(() => translator.currentLanguage, [translator]);
    const onElementClick = useCallback(() => {
        if (availableType === HardwareAvailableTypeEnum.available) {
            selectHardware(dispatch)(hardware);
            changeCurrentPageState(dispatch)(HardwarePageStateEnum.connection);
        } else {
            canUpdateModule();
        }
    }, [hardware, availableType]);

    const canUpdateModule = useCallback(() => {
        if (availableType === HardwareAvailableTypeEnum.needUpdate) {
            if (confirm('업데이트를 진행하시겠습니까?')) {
                downloadModule();
            } else {
                selectHardware(dispatch)(hardware);
                changeCurrentPageState(dispatch)(HardwarePageStateEnum.connection);
            }
        } else if (availableType === HardwareAvailableTypeEnum.needDownload) {
            if (confirm('다운로드가 필요한 모델입니다. 다운로드 하시겠습니까?')) {
                downloadModule();
            }
        }
    }, [hardware, availableType]);

    const downloadModule = useCallback(() => {
        hardware.moduleName
            ? requestHardwareModuleDownload(dispatch)(hardware.moduleName)
            : console.log('moduleName is not defined');
    }, [hardware, availableType]);

    const getImageBaseSrc = useMemo(() => {
        // 이미지가 공용 모듈 폴더에 없으면, 스태틱을 찾는다, 아니면 empty인 이미지를 리턴
        if (imageStatus == 1) {
            return `${rendererRouter.staticModulePath}/${hardware.icon}`;
        } else if (imageStatus == 2) {
            return EmptyDeviceImage;
        }

        // 로딩 초기 경로 세팅
        const imageBaseUrl = rendererRouter.sharedObject.moduleResourceUrl;

        switch (availableType) {
            case HardwareAvailableTypeEnum.needUpdate:
            case HardwareAvailableTypeEnum.needDownload:
                return `${imageBaseUrl}/${hardware.moduleName}/files/image`;
            case HardwareAvailableTypeEnum.available:
            default:
                return `${rendererRouter.baseModulePath}/${hardware.icon}`;
        }
    }, [imageStatus, availableType]);

    return (
        <HardwareTypeDiv id={`${hardware.id}`} onClick={onElementClick}>
            <HardwareThumbnailContainer>
                <HardwareThumbnailImg
                    src={getImageBaseSrc}
                    type={availableType}
                    alt=""
                    onError={() => {
                        setImageStatus(imageStatus + 1);
                    }}
                />
            </HardwareThumbnailContainer>
            <HardwareTitle>
                {`${(hardware.name && hardware.name[langType]) || hardware.name.en}`}
            </HardwareTitle>
        </HardwareTypeDiv>
    );
};

export default HardwareElement;
