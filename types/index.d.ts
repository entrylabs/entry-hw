declare type ObjectLike = { [key: string]: string };

declare type IDriverInfo = ObjectLike | [{ translate: string } & ObjectLike]

declare type ICopyTypeFirmware = { type: 'copy'; afterDelay?: number, name: string; }
declare type IFirmwareInfo =
    string
    | [{ name: string; translate: string }]
    | ICopyTypeFirmware

declare type IHardwareType = 'serial' | 'bluetooth' | 'hid' | 'ble';
declare type IHardwareControlType = 'slave' | 'master';
declare interface IHardwareModuleConfig {
    type: IHardwareType;
    control: IHardwareControlType;
    duration: number;
    baudRate: number;

    firmwarecheck?: boolean;

    // for automatic port select
    vendor: string | string[] | { [key in 'win32' | 'darwin']: string | string[] };
    pnpId: string | string[];
    comName: string;

    lostTimer?: number;
    flowControl?: 'hardware' | 'software';
    byteDelimiter?: number[];
    delimiter?: string;

    advertise?: number;
    softwareReset?: boolean;
    stream?: 'string';
}

declare interface IOnlineHardwareConfig {
    moduleName: string;
    version: string;
    sha1: string;
    type: string;
    title: {
        ko: string;
        en: string;
    };
    properties: {
        id: string;
        category: string;
        platform: string[];
    };
    files: {
        image: string;
        block: string;
        module: string;
    };
}

declare interface IHardwareConfig {
    version?: string;
    moduleName?: string;

    availableType?: any;

    category: 'board' | 'robot' | 'module';
    id: string;
    name: any;
    icon: string;
    module: string;
    platform: any;
    hardware: IHardwareModuleConfig;

    // optional
    driver?: IDriverInfo;
    firmware?: IFirmwareInfo;
    firmwareBaudRate?: number;
    firmwareMCUType?: string;

    url?: string;
    email?: string;
    video?: string | string[];
    reconnect?: boolean;
    selectPort?: boolean | { [platform: string]: boolean };
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

