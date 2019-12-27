import React, { useCallback, useMemo, useState } from 'react';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapDispatchToProps } from '../../store';
import { changeCurrentPageState } from '../../store/modules/common';
import { HardwareAvailableTypeEnum, HardwarePageStateEnum } from '../../constants/constants';
import { selectHardware } from '../../store/modules/connection';
import styled from 'styled-components';
import { requestHardwareModuleDownload } from '../../store/modules/hardware';

const HardwareTypeDiv = styled.div`
    width: 170px;
    height: 170px;
    display: inline-block;
    text-align: center;
`;

const HardwareThumbnailImg = styled.img<{ type: HardwareAvailableTypeEnum }>`
    width: 100px;
    height: 100px;
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
`;

const HardwareElement: React.FC<Preload & IDispatchProps & { hardware: any }> = (props) => {
    const { hardware, translator, rendererRouter } = props;
    const { availableType } = hardware;

    const [isImageSrcNotFound, setImageNotFound] = useState(false);
    const langType = useMemo(() => translator.currentLanguage, [translator]);
    const onElementClick = useCallback(() => {
        if (availableType === HardwareAvailableTypeEnum.available) {
            props.selectHardware(hardware);
            props.changeCurrentState(HardwarePageStateEnum.connection);
        } else {
            hardware.moduleName
                ? props.requestHardwareModuleDownload(hardware.moduleName)
                : console.log('moduleName is not defined');
        }
    }, [hardware, availableType]);

    const getImageBaseSrc = useMemo(() => {
        if (isImageSrcNotFound) {
            return '../images/empty_module_image.png';
        }

        const imageBaseUrl =
            rendererRouter.sharedObject?.moduleResourceUrl || 'https://playentry.org/';

        switch (availableType) {
            case HardwareAvailableTypeEnum.needUpdate:
            case HardwareAvailableTypeEnum.needDownload:
                return `${imageBaseUrl}/${hardware.moduleName}/image`;
            case HardwareAvailableTypeEnum.available:
            default:
                return `../../../modules/${hardware.icon}`;
        }
    }, [isImageSrcNotFound, availableType]);

    return (
        <HardwareTypeDiv id={`${hardware.id}`} onClick={onElementClick}>
            <HardwareThumbnailImg
                src={getImageBaseSrc}
                type={availableType}
                alt=""
                onError={() => {
                    setImageNotFound(true);
                }}
            />
            <HardwareTitle>
                {`${hardware.name && hardware.name[langType] || hardware.name.en}`}
            </HardwareTitle>
        </HardwareTypeDiv>
    );
};

interface IDispatchProps {
    selectHardware: (hardware: IHardware) => void;
    changeCurrentState: (category: HardwarePageStateEnum) => void;
    requestHardwareModuleDownload: (moduleName: string) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    selectHardware: selectHardware(dispatch),
    changeCurrentState: changeCurrentPageState(dispatch),
    requestHardwareModuleDownload: requestHardwareModuleDownload(dispatch),
});

export default connect(undefined, mapDispatchToProps)(withPreload(HardwareElement));
