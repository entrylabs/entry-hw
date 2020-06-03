import React, { useCallback } from 'react';
import HardwarePanelButton from '../common/HardwarePanelButton';
import usePreload from '../../hooks/usePreload';

const DriverButtonSetElement: React.FC<{ buttonSet: IDriverInfo }> = (props) => {
    const { buttonSet } = props;
    const { translator, rendererRouter, os } = usePreload();
    const onButtonClicked = useCallback((path: string) => {
        if (path.startsWith('http')) {
            rendererRouter.openExternalUrl(path);
        } else {
            rendererRouter.executeDriverFile(path);
        }
    }, []);

    if (buttonSet instanceof Array) {
        return <>
            {
                buttonSet.filter((button) => button[os]).map((button) => <HardwarePanelButton
                    key={button[os]}
                    onClick={() => {
                        onButtonClicked(button[os]);
                    }}
                >{translator.translate(button.translate)}</HardwarePanelButton>)
            }
        </>;
    } else if (buttonSet[os]) {
        return <HardwarePanelButton
            onClick={() => {
                onButtonClicked(buttonSet[os]);
            }}
        >{translator.translate('Install Device Driver')}</HardwarePanelButton>;
    } else {
        return <></>;
    }
};

export default DriverButtonSetElement;
