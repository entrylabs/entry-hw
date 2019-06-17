/* for Entry Hardware */
declare type HardwareModuleOptions = any;
declare type HardwareOptions = any;
declare type HardwareModule = any;

declare type FirmwareObject = {
    name: string;
    type: string;
    afterDelay?: number;
};
declare type Firmware = string | FirmwareObject;
declare type Router = any;
declare type DataHandler = any;
