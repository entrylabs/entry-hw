declare type ObjectLike = { [key: string]: string };

declare type IDriverInfo = ObjectLike | [{ translate: string } & ObjectLike]

declare type ICopyTypeFirmware = { type: 'copy'; afterDelay?: number, name: string; }
declare type IFirmwareInfo =
    string
    | [{ name: string; translate: string }]
    | ICopyTypeFirmware

declare interface IHardwareConfig {
    version?: string;
    moduleName?: string;

    category: 'board' | 'robot' | 'module';
    entry: { protocol: 'json' };
    id: string;
    name: any;
    icon: string;
    module: string;
    platform: any;
    hardware: any;

    // for automatic port select
    vendor: string | string[] | { [key in 'win32' | 'darwin']: string | string[] };
    pnpId: string | string[];
    comName: string;

    // optional
    driver?: IDriverInfo;
    firmware?: IFirmwareInfo;
    firmwareBaudRate?: number;
    firmwareMCUType?: string;

    url?: string;
    email?: string;
    video?: string | string[];
    reconnect?: boolean;
    select_com_port?: boolean | { [platform: string]: boolean };
    tryFlasherNumber?: number;
}

declare interface ISerialPortScanData {
    path: string;
    manufacturer?: string;
    serialNumber?: string;
    locationId?: string;
    vendorId?: string;
    productId?: string;
}

declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.woff' {
    const value: string;
    export default value;
}
