declare type ObjectLike = {[key:string]: any};

declare module '@serialport/*' {
    const value: any;
    export default value;
}

declare module '@entrylabs/bindings' {
    const value: any;
    export default value;
}
