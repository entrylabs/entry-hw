declare type ObjectLike = { [key: string]: string };

declare type IDriverInfo = ObjectLike | [{ translate: string } & ObjectLike]
declare type IFirmwareInfo =
    string
    | [{ name: string; translate: string }]
    | { afterDelay: number, name: string; type: string }

declare interface IHardware {
    category: 'board' | 'robot' | 'module';
    entry: { protocol: 'json' };
    id: string;
    name: any;
    icon: string;
    module: string;
    platform: any;
    hardware: any;

    // optional
    driver?: IDriverInfo;
    firmware?: IFirmwareInfo;
    url?: string;
    email?: string;
    video?: string | string[];
    reconnect?: boolean;
    select_com_port?: boolean;
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
