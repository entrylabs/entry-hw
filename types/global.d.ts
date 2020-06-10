declare type IFileConfig = {
    moduleResourceUrl: string;
    updateCheckUrl: string;
    language?: string;
}

declare type IInternalConfig = {
    appName: 'hardware',
    hardwareVersion: string,
    roomIds: string[],
    language: string;
}

declare type ICommandLineFlags = {
    debug?: boolean; // alias: 'd', if flag is on, devtool will be opened
}

declare type ICommandLineArgs = {
    config?: string; // alias: 'c', for configFileName mid-fix
    lang?: string;
}

declare type ICommandLineConfig = ICommandLineFlags & ICommandLineArgs;
declare type ISharedObject = Omit<IFileConfig, 'language'> & IInternalConfig

declare namespace NodeJS {
    // noinspection JSUnusedGlobalSymbols
    interface Global {
        sharedObject: ISharedObject;
        $: any;
    }
}
