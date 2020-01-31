import MainRouter from '../mainRouter';
import BaseConnector from './baseConnector';

abstract class BaseScanner<T extends BaseConnector> {
    static get SCAN_INTERVAL_MILLS() {
        return 1500;
    }

    protected readonly router: MainRouter;
    protected hwModule?: IHardwareModule;
    protected config?: IHardwareConfig;

    public constructor(router: MainRouter) {
        this.router = router;
    }

    public async startScan(hwModule: IHardwareModule, config: IHardwareConfig) {
        this.stopScan();
        this.config = config;
        this.hwModule = hwModule;
        return await this.intervalScan();
    }

    protected abstract intervalScan(): Promise<T | undefined>

    public stopScan() {
        this.hwModule = undefined;
        this.config = undefined;
    }
}

export default BaseScanner;
