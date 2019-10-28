import React, { useCallback } from 'react';
import withPreload from '../../hoc/withPreload';

const FirmwareButtonSetElement: React.FC<{ buttonSet: IFirmwareButtonSet } & Preload> = (props) => {
    const { buttonSet, translator, rendererRouter } = props;
    const onButtonClicked = useCallback((path) => {
        console.log(path);
    }, []);

    if (buttonSet instanceof Array) {
        return <>
            {
                buttonSet.map((firmware) => {
                    return <button
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

export default withPreload(FirmwareButtonSetElement);
