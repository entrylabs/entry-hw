import React, { ComponentType } from 'react';

const { translator } = window;

type IPreloadProps = Preload;

function withPreload<P extends IPreloadProps>(
    WrappedComponent: React.ComponentType<P>,
) {
    const injectProps: IPreloadProps = {
        translator,
    };

    const WrappingComponentFC: React.FC<P> = (props: Readonly<P>) => (
        <WrappedComponent {...props} {...injectProps} />
    );

    type ExposedProps = Omit<P, keyof IPreloadProps> & Partial<IPreloadProps>
    return (WrappingComponentFC as any) as ComponentType<ExposedProps>;
}

export default withPreload;
