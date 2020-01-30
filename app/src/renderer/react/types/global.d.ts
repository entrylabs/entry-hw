type ISharedObject = {
    appName: string; // ?
    roomIds: string[]; // ?

}

declare namespace NodeJS {
    // noinspection JSUnusedGlobalSymbols
    interface Global {
        sharedObject: any;
        $: any;
    }
}
