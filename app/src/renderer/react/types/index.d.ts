declare interface IHardware {
    category: 'board' | 'robot' | 'module';
    entry: {protocol: 'json'};
    driver?: any;
    firmware?: any;
    hardware: any;
    icon: string;
    id: string;
    module: string;
    url?: string;
    email?: string;
    video?: string;
    name: any;
    platform: any;
    reconnect?: boolean;
    select_com_port?: boolean;
    tryFlasherNumber?: number;
}
