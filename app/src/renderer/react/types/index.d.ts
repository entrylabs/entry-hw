declare type ObjectLike = { [key: string]: string };

declare type IDriverButtonSet = ObjectLike | [{ translate: string } & ObjectLike]
declare type IFirmwareButtonSet = string | [{name: string; translate: string}]

declare interface IHardware {
    category: 'board' | 'robot' | 'module';
    entry: { protocol: 'json' };
    driver?: IDriverButtonSet;
    firmware?: IFirmwareButtonSet;
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
    comName: string;
    manufacturer?: string;
    serialNumber?: string;
    locationId?: string;
    vendorId?: string;
    productId?: string;
}
