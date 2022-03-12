import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IStoreState } from '../../store';
import { requestFirmwareInstall } from '../../store/modules/connection';
import { HardwareStatement } from '../../../../../common/constants';
import HardwarePanelButton from '../common/HardwarePanelButton';
import usePreload from '../../hooks/usePreload';

interface IProps {
    buttonSet: IFirmwareInfo;
}

const FirmwareButtonSetElement: React.FC<IProps> = (props) => {
    const [isElementShow, showElement] = useState(true);
    const { buttonSet } = props;
    const moduleState = useSelector<IStoreState>((state) => state.common.moduleState);
    const { translator } = usePreload();
    const dispatch = useDispatch();

    const onButtonClicked = useCallback((firmware: IFirmwareInfo) => {
        console.log('firmware requested', firmware);
        requestFirmwareInstall(dispatch)(firmware);
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
        return (
            <>
                {buttonSet.map((firmware) => (
                    <HardwarePanelButton
                        key={firmware.name}
                        onClick={() => {
                            if ((firmware as IESP32TypeFirmware).offset) {
                                onButtonClicked(firmware as IESP32TypeFirmware);
                            } else if ((firmware as ICopyTypeFirmware).type === 'copy') {
                                onButtonClicked(firmware as ICopyTypeFirmware);
                            } else {
                                onButtonClicked(firmware.name);
                            }
                        }}
                    >
                        {translator.translate(firmware.translate)}
                    </HardwarePanelButton>
                ))}
            </>
        );
    } else {
        return (
            <HardwarePanelButton
                onClick={() => {
                    onButtonClicked(buttonSet);
                }}
            >
                {translator.translate('Install Firmware')}
            </HardwarePanelButton>
        );
    }
};

export default FirmwareButtonSetElement;
