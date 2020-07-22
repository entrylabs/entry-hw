declare module 'winston-daily-rotate-file' {
    const value: any;
    export default value;
}

declare module '@serialport/parser-*' {
    const value: any;
    export = value;
}

declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.svg' {
    import React = require('react');
    export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}

declare module '*.woff' {
    const value: string;
    export default value;
}
