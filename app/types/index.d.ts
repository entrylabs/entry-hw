/* common */
declare type ObjectLike = {[key:string]: any};

/* for Entry Hardware */
declare type HardwareModuleOptions = any;
declare type HardwareOptions = any;
declare type HardwareModule = any;
declare type Firmware = {
    name: string;
    type: string;
    afterDelay?: number;
};
declare type Router = any;

/* untyped third party libraries */
declare module '@serialport/*' {
    const value: any;
    export default value;
}

declare module '@entrylabs/bindings' {
    const value: any;
    export default value;
}
