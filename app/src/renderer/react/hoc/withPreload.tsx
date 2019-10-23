import React, { ComponentType } from 'react';

const { translator, RendererRouter, Modal } = window;
const router = new RendererRouter();
//@ts-ignore
window.fooRouter = router;

type IPreloadProps = Preload;

function withPreload<P extends IPreloadProps>(
    WrappedComponent: React.ComponentType<P>,
) {
    const injectProps: IPreloadProps = {
        translator,
        rendererRouter: router, //TODO
        Modal,
    };

    const WrappingComponentFC: React.FC<P> = (props: Readonly<P>) => (
        <WrappedComponent {...props} {...injectProps} />
    );

    type ExposedProps = Omit<P, keyof IPreloadProps> & Partial<IPreloadProps>
    return (WrappingComponentFC as any) as ComponentType<ExposedProps>;
}

export default withPreload;
