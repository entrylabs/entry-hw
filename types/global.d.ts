declare type IFileConfig = {
    moduleResourceUrl: string;
    updateCheckUrl: string;
}

declare type IInternalConfig = {
    appName: 'hardware',
    hardwareVersion: string,
    roomIds: string[],
}

declare type ICommandLineFlags = {
    debug?: boolean; // alias: 'd', if flag is on, devtool will be opened
}

declare type ICommandLineArgs = {
    config?: string; // alias: 'c', for configFileName mid-fix
}

declare type ICommandLineConfig = ICommandLineFlags & ICommandLineArgs;

declare namespace NodeJS {
    // noinspection JSUnusedGlobalSymbols
    interface Global {
        sharedObject: IFileConfig & IInternalConfig;
        $: any;
    }
}
