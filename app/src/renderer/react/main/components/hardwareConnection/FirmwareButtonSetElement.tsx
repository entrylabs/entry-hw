import React, { useCallback, useEffect, useState } from 'react';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapDispatchToProps, IMapStateToProps } from '../../store';
import { requestFirmwareInstall } from '../../store/modules/connection';
import { HardwareStatement } from '../../../../../common/constants';
import HardwarePanelButton from '../common/HardwarePanelButton';

interface IProps extends Preload, IDispatchProps, IStateProps {
    buttonSet: IFirmwareInfo;
}

const FirmwareButtonSetElement: React.FC<IProps> = (props) => {
    const [isElementShow, showElement] = useState(true);
    const { moduleState, buttonSet, translator } = props;
    const onButtonClicked = useCallback((firmware: IFirmwareInfo) => {
        console.log('firmware requested', firmware);
        props.requestFirmwareInstall(firmware);
    }, []);

    useEffect(() => {
        /*
        flash 요청이 들어오면 버튼을 가린다.
        버튼이 한번 가려지면 connected 될때까지 버튼이 돌아오지 않는다.
         */
        if (moduleState === HardwareStatement.flash) {
            showElement(false);
        } else if (!isElementShow && moduleState === HardwareStatement.connected) {
            showElement(true);
        }
    }, [moduleState]);

    if (!isElementShow) {
        return <></>;
    }

    if (buttonSet instanceof Array) {
        return <>
            {
                buttonSet.map((firmware) => <HardwarePanelButton
                        key={firmware.name}
                        onClick={() => {
onButtonClicked(firmware.name);
}}
                    >{translator.translate(firmware.translate)}</HardwarePanelButton>)
            }
        </>;
    } else {
        return <HardwarePanelButton
            onClick={() => {
onButtonClicked(buttonSet);
}}
        >{translator.translate('Install Firmware')}</HardwarePanelButton>;
    }
};

interface IStateProps {
    moduleState: HardwareStatement;
}

interface IDispatchProps {
    requestFirmwareInstall: (firmware: IFirmwareInfo) => void;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    moduleState: state.common.moduleState,
});

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    requestFirmwareInstall: requestFirmwareInstall(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withPreload(FirmwareButtonSetElement));
