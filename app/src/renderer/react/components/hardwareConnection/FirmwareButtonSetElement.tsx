import React, { useCallback } from 'react';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapDispatchToProps } from '../../store';
import { requestFirmwareInstall } from '../../store/modules/connection';

type IProps = { buttonSet: IFirmwareInfo } & Preload & IDispatchProps
const FirmwareButtonSetElement: React.FC<IProps> = (props) => {
    const { buttonSet, translator } = props;
    const onButtonClicked = useCallback((firmware: IFirmwareInfo) => {
        console.log(firmware);
        props.requestFirmwareInstall(firmware);
    }, []);

    if (buttonSet instanceof Array) {
        return <>
            {
                buttonSet.map((firmware) => {
                    return <button
                        key={firmware.name}
                        className="hwPanelBtn"
                        onClick={() => {onButtonClicked(firmware.name)}}
                    >{translator.translate(firmware.translate)}</button>;
                })
            }
        </>;
    } else {
        return <button
            className="hwPanelBtn"
            onClick={() => {onButtonClicked(buttonSet)}}
        >{translator.translate('Install Firmware')}</button>;
    }
};

interface IDispatchProps {
    requestFirmwareInstall: (firmware: IFirmwareInfo) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    requestFirmwareInstall: requestFirmwareInstall(dispatch),
});

export default connect(undefined, mapDispatchToProps)(withPreload(FirmwareButtonSetElement));
