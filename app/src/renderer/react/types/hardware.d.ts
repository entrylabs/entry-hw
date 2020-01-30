/// <reference path="./index.d.ts" />

declare interface IHardwareModule {
    // 디바이스 데이터 송수신 라이프사이클

    // TODO serialport or undefined 를 어떻게 처리해야하나?
    requestInitialData: (serialPort?: any) => any;
    checkInitialData: (data: any, options: IHardwareModuleConfig) => boolean | undefined;
    requestRemoteData: (handler: any) => void;
    handleRemoteData?: (handler: any) => void;
    validateLocalData?: (data: any) => boolean;
    handleLocalData: (data: any) => void;
    requestLocalData: () => any;

    // 연결 절차
    connect?: () => void;
    afterConnect?: (router: any, callback: (state: string) => void) => void;
    disconnect?: (connector: any) => void;

    // 기타 최초 연결 수립시 사용되는 함수. 사용처가 통일되지 않아 정리 대상
    init?: (handler: any, config: any) => void; // deprecate into hook
    setSocket?: (server: any) => void; // deprecate into hook
    setSerialPort?: (serialPort: any) => void; // deprecate
    resetProperty?: () => any; // after init, send to device
    getProperty?: () => any; // using master device. after requestLocalData send to device
    socketReconnection?: () => void; // need rename
    reset?: () => void; // need rename it called socket client(Entry web) is closed

    // 모듈이 프로그램 자체에 영향을 줄수 있으므로 제거 및 로직 개선 필요
    eventController: (state: any) => void;
    lostController?: (connector: any, routerSendStateFunction: (state: string) => void) => void;
}
