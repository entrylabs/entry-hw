class BaseModule {
    constructor() {
        this.sp = null;
        this.socket = null;
        this.handler = null;
        this.config = null;
        this.isDraing = false;
    }

    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    requestInitialData() {}

    // actual parameter is (data, config)
    checkInitialData() {
        return true;
    }

    // actual parameter is (data)
    validateLocalData() {
        return true;
    }

    requestRemoteData() {}

    handleRemoteData() {}

    requestLocalData() {}

    handleLocalData() {}
}

module.exports = BaseModule;
