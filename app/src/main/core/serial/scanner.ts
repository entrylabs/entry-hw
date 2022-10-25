import _ from 'lodash';
import rendererConsole from '../rendererConsole';
import SerialPort from 'serialport';
import electPort from './electPortFunction';
import { CloudModeTypes } from '../../../common/constants';
import BaseScanner from '../baseScanner';
import SerialConnector from './connector';
import createLogger from '../../electron/functions/createLogger';

const logger = createLogger('core/SerialScanner.ts');

/**
 * 전체 포트를 검색한다.
 * 검색 조건은 hwModule 의 config 에서 설정한다.
 * pnpId, VendorName, select port 등등 이다.
 *
 * 결과의 송수신은 router 에 만들어진 함수로 보낸다.
 */
class SerialScanner extends BaseScanner<SerialConnector> {
    private isScanning = false;

    static get SCAN_INTERVAL_MILLS() {
        return 1500;
    }

    public stopScan() {
        logger.verbose('scan stopped');
        this.config = undefined;
        this.isScanning = false;
    }

    protected async intervalScan() {
        this.isScanning = true;
        let scanResult = undefined;
        while (this.isScanning) {
            logger.verbose('intervalScan..');
            scanResult = await this.scan();
            logger.verbose(`scan result :${scanResult}`);
            if (scanResult) {
                this.isScanning = false;
                break;
            }
            await new Promise((resolve) =>
                setTimeout(resolve, SerialScanner.SCAN_INTERVAL_MILLS)
            );
        }
        return scanResult;
    }

    private async scan() {
        if (!this.config || !this.hwModule) {
            logger.warn('config or hwModule is not present');
            return;
        }
        const serverMode = this.router.currentCloudMode;
        const selectedComPortName = this.router.selectedPort;
        const { hardware } = this.config;
        let { selectPort: needCOMPortSelect } = this.config;
        const { type } = hardware;

        // win, mac 플랫폼에 맞춰 COMPort 확인창 필요한지 설정
        if (needCOMPortSelect && typeof needCOMPortSelect !== 'boolean') {
            needCOMPortSelect = needCOMPortSelect[process.platform];
        }

        // comPort 선택지가 필요한지 체크한다. 블루투스나 클라우드 모드인경우 무조건 검사한다.
        const isComPortSelected =
            needCOMPortSelect ||
            type === 'bluetooth' ||
            serverMode === CloudModeTypes.cloud;

        // 전체 포트 가져오기
        const comPorts = await SerialPort.list();
        const selectedPorts = [];

        // 포트 선택을 유저에게서 직접 받아야 하는가?
        if (isComPortSelected) {
            // 포트가 외부에서 선택되었는가?
            if (selectedComPortName) {
                // lost 후 reconnect 임시 대응
                if (
                    comPorts
                        .map((portData) => portData.path)
                        .findIndex((path) => path === selectedComPortName) ===
                    -1
                ) {
                    return;
                }
                selectedPorts.push(selectedComPortName);
            } else {
                rendererConsole.log(comPorts);
                this.router.sendEventToMainWindow('portListScanned', comPorts);
                return;
            }
        } else {
            // 포트 선택을 config 에서 처리해야 하는 경우
            selectedPorts.push(
                ..._.compact(
                    comPorts.map((port) =>
                        this._selectCOMPortUsingProperties(hardware, port)
                    )
                )
            );
        }

        if (this.config.handshake && !this.router.selectedPayload) {
            // handshakeType 가 argument 면 selectedPayload 가 필요하다. 이 값이 없으면 시리얼포트 선출하지 않는다.
            return;
        }

        const electedConnector = await electPort(
            selectedPorts,
            hardware,
            this.hwModule,
            (connector) => {
                if (this.config && this.config.firmware) {
                    /*
                    펌웨어가 없는 상태에서 통신이 이루어지지 않는 경우,
                    before_connect 로 임시 연결됨 상태로 만들어서 펌웨어 버튼은 동작할 수 있게끔
                    만든다.
                    TODO 현재는 여러개의 포트가 선출되는 경우, 가장 첫번째 포트를 선택한다.
                     */
                    this.router.setConnector(connector);
                    this.router.sendState('before_connect');
                }
            },
            () => this.router.selectedPayload
        );

        if (electedConnector) {
            logger.info(`${electedConnector.port} is finally connected`);
            rendererConsole.log(
                `${electedConnector.port} is finally connected`
            );
            this.stopScan();
            return electedConnector.connector;
        }
        logger.info(
            `scan completed but no connected. portList is ${comPorts
                .map((port) => port.path)
                .join(', ')}`
        );
    }

    private _selectCOMPortUsingProperties(
        hardwareConfig: IHardwareModuleConfig,
        comPort: SerialPort.PortInfo
    ) {
        const {
            vendor,
            pnpId: verifiedPnpId,
            comName: verifiedComPortNames,
        } = hardwareConfig;
        const { path, manufacturer, pnpId } = comPort;
        const comName = path;
        let platformVendor: string | string[];

        // win, mac 플랫폼에 맞는 벤더명 설정
        if (vendor && typeof vendor !== 'string' && !Array.isArray(vendor)) {
            platformVendor = vendor[process.platform as 'win32' | 'darwin'];
        } else {
            platformVendor = vendor;
        }

        // config 에 입력한 특정 벤더와 겹치는지 여부
        const isVendor = this._indexOfStringOrArray(
            platformVendor,
            manufacturer
        );

        // config 에 입력한 특정 COMPortName과 겹치는지 여부
        const isComName = this._indexOfStringOrArray(
            verifiedComPortNames,
            comName
        );

        // config 에 입력한 특정 pnpId와 겹치는지 여부
        const isPnpId = this._indexOfStringOrArray(verifiedPnpId, pnpId);

        // 현재 포트가 config 과 일치하는 경우 연결시도할 포트목록에 추가
        if (isVendor || isPnpId || isComName) {
            logger.info(`auto port select: ${comName}`);
            return comName;
        }
        logger.verbose('not found auto select port');
    }

    private _indexOfStringOrArray(
        arrayOrString?: string | string[],
        target?: string
    ): boolean {
        if (!target || !arrayOrString) {
            return false;
        }

        if (Array.isArray(arrayOrString)) {
            return arrayOrString.some((item) => target.indexOf(item) >= 0);
        } else {
            return target.indexOf(arrayOrString) >= 0;
        }
    }
}

export default SerialScanner;
