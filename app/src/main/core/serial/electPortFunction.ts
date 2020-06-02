import SerialConnector from './connector';
import { compact } from 'lodash';

type IElectedResult = { port: string; connector: SerialConnector; };

const electPort = async (
    ports: string[],
    hwConfig: IHardwareModuleConfig,
    hwModule: IHardwareModule,
    beforeConnectCallback: (connector: SerialConnector) => void,
    handshakePayload?: string,
) => {
    // 선출 후보 포트 모두 오픈
    const connectors = await _initialize(ports, hwConfig, hwModule);

    if (!connectors || connectors.length === 0) {
        return;
    }

    // TODO
    //  현재는 여러포트가 걸리면 위에 있는 친구를 펌웨어 업로드용 포트로 잡는다.
    //  이는 프로세스 자체의 변경이 필요하므로 기획팀 논의를 거쳐서
    //  '펌웨어 클릭 > 포트가 여러개인경우 목록노출 > 선택적 플래시' 프로세스로 추후개발필요
    if (beforeConnectCallback) {
        const { connector } = connectors[0];
        beforeConnectCallback(connector);
    }

    // 전부 checkInitialData 로직 수행
    const electedConnector = await Promise.race(
        connectors.map(async (connectorObject) => {
            const { connector } = connectorObject;
            await connector.initialize(handshakePayload);
            return connectorObject;
        }),
    );

    // 선출되지 못한 포트들 전부 다시 닫기
    _finalize(connectors.filter(({ port }) => port !== electedConnector.port));

    return electedConnector;
};

/**
 * 선출후보인 모든 포트를 전부 커넥터 오픈한다.
 * 결과는 this.connectors 에 저장한다
 * @private
 */
const _initialize: (
    ports: string[], hwConfig: IHardwareModuleConfig, hwModule: IHardwareModule,
) => Promise<IElectedResult[]> = async (
    ports, hwConfig, hwModule,
) => {
    const portList = await Promise.all(ports.map(async (port) => {
        try {
            const connector = new SerialConnector(hwModule, hwConfig);
            await connector.open(port);
            return { port, connector };
        } catch (e) {
            console.log(`port ${port} elect initilize error`, e);
            return undefined;
        }
    }));

    return compact(portList);
};

const _finalize = (connectors: IElectedResult[]) => {
    connectors.forEach(({ connector }) => {
        connector.close();
    });
};

export default electPort;
