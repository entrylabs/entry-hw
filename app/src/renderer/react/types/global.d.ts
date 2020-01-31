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

declare namespace NodeJS {
    // noinspection JSUnusedGlobalSymbols
    interface Global {
        sharedObject: any;
        $: any;
    }
}
