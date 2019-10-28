import React, { useCallback } from 'react';
import withPreload from '../../hoc/withPreload';

const { os } = window;

const DriverButtonSetElement: React.FC<{ buttonSet: IDriverButtonSet } & Preload> = (props) => {
    const { buttonSet, translator, rendererRouter } = props;
    const onButtonClicked = useCallback((path) => {
        rendererRouter.executeDriverFile(path);
    }, []);

    if (buttonSet instanceof Array) {
        return <>
            {
                buttonSet.filter((button) => button[os]).map((button) => {
                    return <button
                        className="hwPanelBtn"
                        onClick={() => {onButtonClicked(button[os])}}
                    >{translator.translate(button.translate)}</button>;
                })
            }
        </>;
    } else {
        return <button
            className="hwPanelBtn"
            onClick={() => {onButtonClicked(buttonSet[os])}}
        >{translator.translate('Install Device Driver')}</button>;
    }
};

export default withPreload(DriverButtonSetElement);
