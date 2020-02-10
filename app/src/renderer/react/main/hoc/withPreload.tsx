import React, { ComponentType } from 'react';

const { ipcRenderer, translator, rendererRouter, clipboard, os } = window;

type IPreloadProps = Preload;

function withPreload<P extends IPreloadProps>(
    WrappedComponent: React.ComponentType<P>,
) {
    const injectProps: IPreloadProps = {
        ipcRenderer,
        translator,
        rendererRouter, //TODO
        clipboard,
        os,
    };

    const WrappingComponentFC: React.FC<P> = (props: Readonly<P>) => (
        <WrappedComponent {...props} {...injectProps} />
    );

    type ExposedProps = Omit<P, keyof IPreloadProps>
    return (WrappingComponentFC as any) as ComponentType<ExposedProps>;
}

export default withPreload;
