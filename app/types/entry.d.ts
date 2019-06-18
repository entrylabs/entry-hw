type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>>
    & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys]

/* for Entry Hardware */
declare type HardwareModule = any;

declare type FirmwareObject = {
    name: string;
    type?: string;
    afterDelay?: number;
};
declare type Firmware = string | FirmwareObject;
declare type Router = any;
declare type DataHandler = any;

interface ILocalizeTemplate {
    en: string;
    ko: string;
    jp: string;
    vn: string;
}

type IDriverTypes = RequireAtLeastOne<{
    'win32-ia32': string;
    'win32-x64': string;
    'darwin-x64': string;
}> & { translate?: string }

declare type LocalizeTemplate = RequireAtLeastOne<ILocalizeTemplate>;
declare type HardwarePlatformType = 'win32' | 'darwin';
declare type HardwareCategory = 'board' | 'robot' | 'module';
declare type DriverTypes = IDriverTypes | IDriverTypes[];

declare interface HardwareModuleConfig {
    id: string;
    name: LocalizeTemplate;
    category: HardwareCategory;
    platform: HardwarePlatformType | HardwarePlatformType[]
    icon: string;
    module: string;
    url?: string;
    email?: string;
    driver?: DriverTypes;
    reconnect?: boolean;
    firmware?: Firmware;
    firmwareBaudRate?: number,
    firmwareMCUType?: string,
    video?: string | string[];
    tryFlasherNumber?: number;
    entry: { protocol: 'json' | 'bytearray', bufferSize?: number }
    select_com_port?: true | {
        win32: boolean,
        darwin: boolean
    };
    this_com_port?: string;
    hardware: HardwareConfig;
}

declare interface HardwareConfig {
    type: 'serial' | 'bluetooth';
    control: 'slave' | 'master';
    duration: number;
    comName?: string | string[];
    vendor?: string | string[];
    pnpId?: string | string[];
    baudRate: number;
    firmwarecheck?: boolean;
    flowControl?: 'software' | 'hardware';
    stream: string;
    delimiter?: string;
    byteDelimiter?: string;
    rtscts?: boolean;
    lostTimer?: number;
    advertise?: number;
    softwareReset?: boolean;
}
