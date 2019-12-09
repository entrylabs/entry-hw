import React, { useCallback, useMemo } from 'react';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapDispatchToProps } from '../../store';
import { changeCurrentPageState } from '../../store/modules/common';
import { HardwarePageStateEnum } from '../../constants/constants';
import { selectHardware } from '../../store/modules/connection';
import styled from 'styled-components'

const HardwareTypeDiv = styled.div`
    width: 170px;
    height: 170px;
    display: inline-block;
    text-align: center;
`;

const HardwareThumbnailImg = styled.img`
    width: 100px;
    height: 100px;
    cursor: pointer;
`;

const HardwareTitle = styled.h2`
    font-size: 12px;
    color: #595757;
    margin-top: 15px;
    cursor: pointer;
`;

const HardwareElement: React.FC<Preload & IDispatchProps & { hardware: any }> = (props) => {
    const { hardware, translator } = props;
    const langType = useMemo(() => translator.currentLanguage, [translator]);
    const onElementClick = useCallback(() => {
        props.selectHardware(hardware);
        props.changeCurrentState(HardwarePageStateEnum.connection);
    }, [hardware]);

    return (
        <HardwareTypeDiv id={`${hardware.id}`} onClick={onElementClick}>
            <HardwareThumbnailImg src={`../../../modules/${hardware.icon}`} alt=""/>
            <HardwareTitle>
                {`${hardware.name && hardware.name[langType] || hardware.name.en}`}
            </HardwareTitle>
        </HardwareTypeDiv>
    );
};

interface IDispatchProps {
    selectHardware: (hardware: IHardware) => void;
    changeCurrentState: (category: HardwarePageStateEnum) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    selectHardware: selectHardware(dispatch),
    changeCurrentState: changeCurrentPageState(dispatch),
});

export default connect(undefined, mapDispatchToProps)(withPreload(HardwareElement));
