declare type ObjectLike = { [key: string]: string };

declare type IDriverInfo = ObjectLike | [{ translate: string } & ObjectLike]
declare type IFirmwareInfo =
    string
    | [{ name: string; translate: string }]
    | { afterDelay: number, name: string; type: string }

declare interface IHardware {
    category: 'board' | 'robot' | 'module';
    entry: { protocol: 'json' };
    driver?: IDriverInfo;
    firmware?: IFirmwareInfo;
    hardware: any;
    icon: string;
    id: string;
    module: string;
    url?: string;
    email?: string;
    video?: string | string[];
    name: any;
    platform: any;
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
