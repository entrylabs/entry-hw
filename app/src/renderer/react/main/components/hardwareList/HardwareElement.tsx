import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { changeCurrentPageState } from '../../store/modules/common';
import { HardwareAvailableTypeEnum, HardwarePageStateEnum } from '../../constants/constants';
import { selectHardware } from '../../store/modules/connection';
import styled from 'styled-components';
import { requestHardwareModuleDownload } from '../../store/modules/hardware';
import EmptyDeviceImage from '../../../../images/empty_module_image.png';
import usePreload from '../../hooks/usePreload';
import { AvailableTypes } from '../../../../../main/mainRouter.build';

const HardwareTypeDiv = styled.div`
    width: 170px;
    height: 170px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
`;

const HardwareThumbnailContainer = styled.div`
    width: 100px;
    height: 100px;
    cursor: pointer;
    display: flex;
`;

const HardwareThumbnailImg = styled.img<{ isGray: boolean }>`
    max-width: 100px;
    margin: auto;
    cursor: pointer;
    ${({ isGray }) => {
        if (isGray) {
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

const HardwareVersionInd = styled.div<{ showPointer: boolean }>`
    height: 20px;
    padding: 3px 5px;
    font-size: 10pt;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 13px;
    position: absolute;
    top: 0;
    left: 0;
    ${({ showPointer }) => {
        if (showPointer) {
            return 'cursor: pointer;';
        }
    }}
`;

const DropdownCell = styled.div`
    height: 20px;
    font-size: 10pt;
    border-radius: 13px;
    top: 0;
    left: 0;
    &:hover: {
        background-color: rgba(0, 0, 0, 0.2);
    }
`;

const DropdownContainer = styled.div`
    height: 80px;
    background-color: rgba(0, 0, 0, 0.1);
    overflow-y: scroll;
`;

const HardwareElement: React.FC<{ hardware: IHardwareConfig }> = (props) => {
    const { translator, rendererRouter } = usePreload();
    const dispatch = useDispatch();
    const { hardware } = props;
    const { availableType } = hardware;
    const [currVersion, setCurrVersion] = useState(hardware.version);
    const [showVerDropdown, setShowVerDropdown] = useState(false);
    // imageStatus = error counter;
    const [imageStatus, setImageStatus] = useState(0);
    const langType = useMemo(() => translator.currentLanguage, [translator]);
    const onElementClick = useCallback(() => {
        if (
            hardware.version === currVersion &&
            availableType == HardwareAvailableTypeEnum.available
        ) {
            selectHardware(dispatch)(hardware);
            changeCurrentPageState(dispatch)(HardwarePageStateEnum.connection);
        } else {
            canUpdateModule();
        }
    }, [hardware, availableType, currVersion]);

    const toggleDropdown = useCallback(
        (forceClose?: boolean | undefined) => () => {
            if (forceClose) {
                setShowVerDropdown(forceClose);
            } else {
                setShowVerDropdown(!showVerDropdown);
            }
        },
        [showVerDropdown]
    );

    const canUpdateModule = useCallback(() => {
        if (confirm(`버전 ${currVersion}을 다운로드 하시겠습니까?`)) {
            downloadModule();
        }
    }, [hardware, availableType, currVersion]);

    const downloadModule = useCallback(() => {
        hardware.moduleName
            ? requestHardwareModuleDownload(dispatch)({
                  name: hardware.moduleName,
                  version: currVersion,
              })
            : console.log('moduleName is not defined');
    }, [hardware, availableType, currVersion]);

    const handleVersionSelect = useCallback(
        (version) => () => {
            setCurrVersion(version);
            toggleDropdown(false);
        },
        []
    );

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
    }, [imageStatus, availableType, currVersion]);

    const dropdownRef = useRef(null);

    const handleClickOutside = (event: Event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowVerDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    });

    return (
        <HardwareTypeDiv id={`${hardware.id}`}>
            <HardwareVersionInd
                onClick={toggleDropdown()}
                ref={dropdownRef}
                showPointer={hardware.availableVersions && hardware.availableVersions.length > 0}
            >
                {currVersion || '1.0.0'}
                {showVerDropdown &&
                    hardware.availableVersions &&
                    hardware.availableVersions.length > 0 && (
                        <DropdownContainer>
                            {hardware.availableVersions.map((version) => {
                                return (
                                    <DropdownCell onClick={handleVersionSelect(version)}>
                                        {version}
                                    </DropdownCell>
                                );
                            })}
                        </DropdownContainer>
                    )}
            </HardwareVersionInd>
            <HardwareThumbnailContainer onClick={onElementClick}>
                <HardwareThumbnailImg
                    src={getImageBaseSrc}
                    isGray={
                        hardware.version !== currVersion ||
                        availableType != HardwareAvailableTypeEnum.available
                    }
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
