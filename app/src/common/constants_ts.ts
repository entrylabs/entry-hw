export enum RunningModeTypes {
    server = 2,
    client = 3,
}

export enum CloudModeTypes {
    singleServer, cloud
}

export enum HardwareStatement {
    lost = 'lost',
    disconnected = 'disconnected',
    selectPort = 'select_port',
    flash = 'flash',
    beforeConnect = 'before_connect',
    connected = 'connected',
    showRobot = 'show_robot',
}

export enum AvailableTypes {
    available = 'available',
    needUpdate = 'needUpdate',
    needDownload = 'needDownload',
}
