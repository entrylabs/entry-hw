type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
    {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
    }[Keys];

declare type LocalizedString = RequireAtLeastOne<{
    ko: string;
    jp: string;
    en: string;
}>;
declare type SupportedLanguage = keyof LocalizedString;

declare type HandshakeType = 'argument' | 'digit' | 'word';

declare type ObjectLike = { [key: string]: string };

declare type IDriverInfo = ObjectLike | [{ translate: string } & ObjectLike];

declare type ICopyTypeFirmware = {
    type: 'copy';
    name: string;
    afterDelay?: number;
    translate?: string;
};
declare type IESP32TypeFirmware = {
    type: string;
    offset: string;
    name: string;
    afterDelay?: number;
    translate?: string;
};
declare type IFirmwareInfo =
    | string
    | [{ name: string; translate: string }]
    | ICopyTypeFirmware
    | IESP32TypeFirmware;

declare type IHardwareType = 'serial' | 'bluetooth' | 'hid' | 'ble';
declare type IHardwareControlType = 'slave' | 'master';
declare interface IHardwareModuleConfig {
    type: IHardwareType;
    control: IHardwareControlType;
    duration: number;
    baudRate: number;
    commType: 'ascii' | 'utf8' | 'utf16le' | 'ucs2' | 'base64' | 'binary' | 'hex' | undefined;

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
    name: LocalizedString;
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
    handshake?: {
        // argument = 어떤 문자도 허용 / digit = 숫자만 / word = 문자만
        type: HandshakeType;
        message?: {
            default?: string | LocalizedString;
            invalid?: string | LocalizedString;
            sending?: string | LocalizedString;
        };
    };
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
