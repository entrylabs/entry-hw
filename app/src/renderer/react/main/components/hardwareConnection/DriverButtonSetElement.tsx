import React, { useCallback } from 'react';
import withPreload from '../../hoc/withPreload';
import HardwarePanelButton from '../common/HardwarePanelButton';

const { os } = window;

const DriverButtonSetElement: React.FC<{ buttonSet: IDriverInfo } & Preload> = (props) => {
    const { buttonSet, translator, rendererRouter } = props;
    const onButtonClicked = useCallback((path) => {
        rendererRouter.executeDriverFile(path);
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

export default withPreload(DriverButtonSetElement);
