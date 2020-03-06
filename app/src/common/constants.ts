export enum RunningModeTypes {
    server = 2,
    client = 3,
}

export enum CloudModeTypes {
    singleServer, cloud
}

export enum HardwareStatement {
    lost = 'lost',
    scan = 'scan',
    disconnected = 'disconnected',
    selectPort = 'select_port',
    flash = 'flash',
    beforeConnect = 'before_connect',
    connected = 'connected',
}

export enum AvailableTypes {
    available = 'available',
    needUpdate = 'needUpdate',
    needDownload = 'needDownload',
}

export enum EntryMessageAction {
    init = 'init',
    state = 'state',
}

export enum EntryStatePayload {
    disconnectHardware = 'disconnectHardware',
    connected = 'connected', // {name: string}
}
