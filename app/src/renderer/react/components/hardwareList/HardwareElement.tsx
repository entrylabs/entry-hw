import React, { useCallback, useMemo } from 'react';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapDispatchToProps } from '../../store';
import { changeHardwareCategory, selectHardware } from '../../store/modules/hardware';
import { changeCurrentState } from '../../store/modules/common';
import { HardwarePageStateEnum } from '../../constants/constants';

const HardwareElement: React.FC<Preload & IDispatchProps & { hardware: any }> = (props) => {
    const { hardware, translator, rendererRouter } = props;
    const langType = useMemo(() => translator.currentLanguage, [translator]);
    const onElementClick = useCallback(() => {
        props.selectHardware(hardware);
        props.changeCurrentState(HardwarePageStateEnum.connection);
        // rendererRouter.startScan(hardware);
    }, [hardware]);

    return (
        <div className="hardwareType" id={`${hardware.id}`} onClick={onElementClick}>
            <img className="hwThumb" src={`../../../modules/${hardware.icon}`} alt=""/>
            <h2 className="hwTitle">
                {`${hardware.name && hardware.name[langType] || hardware.name.en}`}
            </h2>
        </div>
    );
};

interface IDispatchProps {
    selectHardware: (hardware: IHardware) => void;
    changeCurrentState: (category: HardwarePageStateEnum) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    selectHardware: selectHardware(dispatch),
    changeCurrentState: changeCurrentState(dispatch),
});

export default connect(undefined, mapDispatchToProps)(withPreload(HardwareElement));
