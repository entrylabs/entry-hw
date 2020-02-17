type ISharedObject = {
    // from internal config
    appName: string; // ?
    roomIds: string[]; // ?
    hardwareVersion: string;


    // from external config file
    baseUrl: string;
    baseResource: string;
    versionCheckApi: string;
    moduleCheckApi: string;
}

type IFileConfig = {
    moduleResourceUrl: string;
    updateCheckUrl: string;
}

type IInternalConfig = {
    appName: 'hardware',
    hardwareVersion: string,
    roomIds: string[],
}

declare namespace NodeJS {
    // noinspection JSUnusedGlobalSymbols
    interface Global {
        sharedObject: IFileConfig & IInternalConfig;
        $: any;
    }
}
