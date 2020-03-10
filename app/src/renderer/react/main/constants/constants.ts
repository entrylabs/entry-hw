export enum HardwarePageStateEnum {
    list = 'list',
    connection = 'connection',
}

export enum CategoryTypeEnum {
    all = 'all',
    robot = 'robot',
    module = 'module',
    board = 'board',
}

export enum HardwareModuleStatus {
    available = 'available',
    needUpdate = 'needUpdate',
    needDownload = 'needDownload',
}

export enum HardwareConnectionStatusEnum {
    lost = 'lost',
    disconnected = 'disconnected',
    selectPort = 'select_port',
    flash = 'flash',
    beforeConnect = 'before_connect',
    connected = 'connected',
    scan = 'scan',
}

export enum CloudModeTypesEnum {
    singleServer,
    cloud,
}

export enum HardwareAvailableTypeEnum {
    available = 'available',
    needUpdate = 'needUpdate',
    needDownload = 'needDownload',
}
