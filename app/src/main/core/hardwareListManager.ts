import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AVAILABLE_TYPE } from '../../common/constants';
import getModuleList from './network/getModuleList';

const nameSortComparator = (left: IHardwareConfig, right: IHardwareConfig) => {
    const lName = left.name.ko.trim();
    const rName = right.name.ko.trim();

    if (lName > rName) {
        return 1;
    } else if (lName < rName) {
        return -1;
    } else {
        return 0;
    }
};

const platformFilter = (config: IHardwareConfig) =>
    config.platform && config.platform.indexOf(process.platform) > -1;

export default class {
    private moduleBasePath = path.resolve(app.getAppPath(), __dirname, '..', '..', 'modules');
    private allHardwareList: IHardwareConfig[] = [];
    private readonly router?: any;

    constructor(router: any) {
        this.router = router;
        this._initialize();
        this._requestModuleList();
        this._notifyHardwareListChanged();
    }

    /**
     * 파일을 읽어와 리스트에 작성한다.
     */
    private _initialize() {
        try {
            this._getAllHardwareModulesFromDisk()
                .forEach((config) => config && this.allHardwareList.push(config));
        } catch (e) {
            console.error('error occurred while reading module json files', e);
        }
    }

    private _getAllHardwareModulesFromDisk() {
        return fs.readdirSync(this.moduleBasePath)
            .filter((file) => !!file.match(/\.json$/))
            .map((file) => {
                const bufferData = fs.readFileSync(path.join(this.moduleBasePath, file));
                const configJson = JSON.parse(bufferData.toString());
                configJson.availableType = AVAILABLE_TYPE.available;
                return configJson;
            })
            .filter(platformFilter)
            .sort(nameSortComparator);
    }

    async _requestModuleList() {
        try {
            const moduleList = await getModuleList();
            if (!moduleList || moduleList.length === 0) {
                return;
            }

            this._updateHardwareList(moduleList);
        } catch (e) {
            console.log(e);
        }
    }

    _updateHardwareList(source: IHardwareConfig[]) {
        const availables = this._getAllHardwareModulesFromDisk();
        this.allHardwareList = [];
        const mergedList = availables.map((original) => {
            const foundElem = source.find((srcElem, index) => {
                if (this._isSameModule(original, srcElem)) {
                    source.splice(index, 1);
                    return true;
                }
                return false;
            });

            if (foundElem) {
                // != 의 경우 일부러 그랬습니다. 문자열 / 숫자를 상관하지 않게 하기 위함
                // noinspection EqualityComparisonWithCoercionJS
                if (!original.version || original.version != foundElem.version) {
                    original.availableType = AVAILABLE_TYPE.needUpdate;
                }
            }
            return original;
        });

        this.allHardwareList = mergedList
            .concat(source || [])
            .filter(platformFilter)
            .sort(nameSortComparator);
        this._notifyHardwareListChanged();
    }

    private _notifyHardwareListChanged() {
        this.router &&
        this.router.sendEventToMainWindow('hardwareListChanged');
    }

    /**
     * 현재 모듈과 특정 외부 모듈이 동일한 모듈인지 판단한다.
     * 함수가 따로 존재하는 이유는, 기존 모듈 데이터가 legacy 라서
     * moduleName 프로퍼티가 없고 id 만 존재할 수 있기 때문이다.
     * 이 함수는 moduleName 이 없으면 id 로 비교하고 있으면 moduleName 으로 비교한다.
     * id 비교시엔 outdated 경고를 출력한다.
     * @param original 기존에 가지고 있던 모듈데이터
     * @param source 신규로 추가된 모듈데이터
     * @private
     */
    _isSameModule(original: IHardwareConfig, source: IHardwareConfig) {
        if (original.moduleName) {
            return original.moduleName === source.moduleName;
        } else {
            console.warn(`${original.id} was outdated. please modulize`);
            return original.id === source.id;
        }
    }
};
