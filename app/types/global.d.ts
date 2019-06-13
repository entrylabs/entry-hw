declare module NodeJS  {
    interface Global {
        sharedObject: any;
        $: any;
    }
}
