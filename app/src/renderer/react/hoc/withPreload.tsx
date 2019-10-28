import React, { ComponentType } from 'react';

const { translator, rendererRouter, Modal, clipboard, os } = window;

type IPreloadProps = Preload;

function withPreload<P extends IPreloadProps>(
    WrappedComponent: React.ComponentType<P>,
) {
    const injectProps: IPreloadProps = {
        translator,
        rendererRouter, //TODO
        Modal,
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
