class Scanner {
    static get SCAN_INTERVAL_MILLS() {
        return 1500;
    }

    constructor(router) {
        this.router = router;
        this.isScanning = false;
    }

    async startScan(hwModule, config) {
        this.stopScan();
        this.setConfig(config);
        this.hwModule = hwModule;
        return await this.intervalScan();
    }

    setConfig(config) {
        this.config = config;
    }

    async intervalScan() {
        this.isScanning = true;
        let scanResult = undefined;
        while (this.isScanning) {
            scanResult = await this.scan();
            if (scanResult) {
                this.isScanning = false;
                break;
            }
            await new Promise((resolve) =>
                setTimeout(resolve, this.SCAN_INTERVAL_MILLS)
            );
        }
        return scanResult;
    }

    scan() {}

    stopScan() {
        this.config = undefined;
        this.isScanning = false;
        this.clearTimers();
    }

    clearTimers() {}

    finalizeScan(comName) {
        if (this.connectors && comName) {
            this.connectors[comName] = undefined;
        }
        this.stopScan();
    }
}

module.exports = Scanner;
