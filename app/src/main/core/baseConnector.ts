'use strict';

import MainRouter from '../mainRouter';

/**
 * 스캔이 끝난 후, 선택된 포트로 시리얼포트를 오픈하는 클래스
 * 스캐너에서 open, initialize 가 일어나고,
 * 라우터에서 setRouter, connect 를 거쳐 통신한다.
 */
abstract class BaseConnector {
    static get DEFAULT_CONNECT_LOST_MILLS() {
        return 1000;
    }

    static get DEFAULT_SLAVE_DURATION() {
        return 1000;
    }

    protected readonly options: IHardwareModuleConfig;
    protected readonly hwModule: IHardwareModule;
    protected router?: MainRouter;

    // 현재상태 체크
    public connected = false;
    protected received = false;
    public executeFlash = false;

    constructor(hwModule: IHardwareModule, hardwareOptions: IHardwareModuleConfig) {
        this.options = hardwareOptions;
        this.hwModule = hwModule;
        this.router = undefined;
    }

    protected _sendState(state: string) {
        this.hwModule.eventController && this.hwModule.eventController(state);
        this.router?.sendState(state);
    }

    public setRouter(router: MainRouter) {
        this.router = router;
    }

    abstract open(port: string): Promise<unknown>
    abstract initialize(): Promise<unknown>
    abstract connect(): void;
    abstract close(): void;
    abstract send(data: any): void | Promise<void>
}

export default BaseConnector;
