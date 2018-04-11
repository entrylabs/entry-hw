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

    checkInitialData() {
        return true;
    }

    validateLocalData() {
        return true;
    }

    requestRemoteData() {}

    handleRemoteData() {}

    requestLocalData() {}

    handleLocalData() {}
}

module.exports = BaseModule;
