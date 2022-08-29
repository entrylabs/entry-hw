import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { IStoreState } from '../../store';
import { HardwareStatement } from '../../../../../common/constants';
import HardwarePanelButton from '../common/HardwarePanelButton';
import usePreload from '../../hooks/usePreload';

const CustomButtonSetElement: React.FC<{ buttonSet: ICustomButtonInfo }> = (props) => {
    const [isElementShow, showElement] = useState(false);
    const { buttonSet } = props;
    const moduleState = useSelector<IStoreState>((state) => state.common.moduleState);
    const { translator, rendererRouter } = usePreload();

    const onButtonClicked = useCallback((key: string) => {
        rendererRouter.customButtonClicked(key);
    }, []);

    useEffect(() => {
        if (!isElementShow && moduleState === HardwareStatement.connected) {
            if (rendererRouter.canShowCustomButton()) {
                showElement(true);
            }
        }
    }, [moduleState]);

    if (!isElementShow) {
        return <></>;
    }

    if (buttonSet instanceof Array) {
        return (
            <>
                {buttonSet.map((button) => (
                    <HardwarePanelButton
                        key={button.key}
                        onClick={() => {
                            onButtonClicked(button.key);
                        }}
                    >
                        {translator.translate(button.translate)}
                    </HardwarePanelButton>
                ))}
            </>
        );
    } else if (typeof buttonSet == 'string') {
        return (
            <HardwarePanelButton
                key={buttonSet}
                onClick={() => {
                    onButtonClicked(buttonSet);
                }}
            >
                {translator.translate(buttonSet)}
            </HardwarePanelButton>
        );
    } else {
        return (
            <HardwarePanelButton
                key={buttonSet.key}
                onClick={() => {
                    onButtonClicked(buttonSet.key);
                }}
            >
                {translator.translate(buttonSet.translate)}
            </HardwarePanelButton>
        );
    }
};

export default CustomButtonSetElement;
