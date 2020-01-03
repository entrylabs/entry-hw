module.exports = {
    RUNNING_MODE_TYPES: {
        server: 2,
        client: 3,
    },
    CLOUD_MODE_TYPES: {
        singleServer: 0,
        cloud: 1,
    },
    HARDWARE_STATEMENT: {
        lost: 'lost',
        disconnected: 'disconnected',
        selectPort: 'select_port',
        flash: 'flash',
        beforeConnect: 'before_connect',
        connected: 'connected',
        scan: 'scan',
    },
    AVAILABLE_TYPE: {
        available: 'available',
        needUpdate: 'needUpdate',
        needDownload: 'needDownload',
    },
    ENTRY_MESSAGE_ACTION: {
        init: 'init',
        state: 'state',
    },
    ENTRY_STATE_PAYLOAD: {
        disconnectHardware: 'disconnectHardware',
        connected: 'connected', // {name: string}
    },
};
