import fs from 'fs';
import path from 'path';
import { merge, unionWith } from 'lodash';
import lt from 'semver/functions/lt';
import valid from 'semver/functions/valid';
import { AvailableTypes } from '../../common/constants';
import getModuleList from './functions/getModuleList';
import getExtraDirectoryPath from './functions/getExtraDirectoryPath';

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

const onlineModuleSchemaModifier = (schema: any) => {
    schema.name = schema.title;
    schema.availableType = AvailableTypes.needDownload;

    delete schema.title;
    delete schema.files;
    return merge(schema, schema.properties);
};

export default class {
    private moduleBasePath = getExtraDirectoryPath('modules');
    private readonly router?: any;
    public allHardwareList: IHardwareConfig[] = [];

    constructor(router: any) {
        this.router = router;

        // 두번 하는 이유는, 먼저 유저에게 로컬 모듈 목록을 보여주기 위함
        this.updateHardwareList();
        this.updateHardwareListWithOnline();
    }

    async updateHardwareListWithOnline() {
        try {
            const moduleList = await getModuleList();
            if (!moduleList || moduleList.length === 0) {
                return;
            }

            this.updateHardwareList(moduleList.map(onlineModuleSchemaModifier));
        } catch (e) {
            console.log('online hardware list update failed');
        }
    }

    updateHardwareList(source: any[] = []) {
        const availables = this._getAllHardwareModulesFromDisk();
        const mergedList = unionWith(availables, source, (src, ori) => {
            if (ori.id === src.id) {
                if (!ori.version || lt(valid(ori.version) as string, valid(src.version) as string)) {
                    // legacy 는 moduleName 이 없기 때문에 서버에 요청을 줄 인자가 없다.
                    ori.moduleName = src.moduleName;
                    ori.availableType = AvailableTypes.needUpdate;
                    return ori;
                }
                return src;
            }
        });

        this.allHardwareList = mergedList
            .filter(platformFilter)
            .sort(nameSortComparator);
        this._notifyHardwareListChanged();
    }

    private _getAllHardwareModulesFromDisk() {
        try {
            return fs.readdirSync(this.moduleBasePath)
                .filter((file) => !!file.match(/\.json$/))
                .map((file) => {
                    const bufferData = fs.readFileSync(path.join(this.moduleBasePath, file));
                    const configJson = JSON.parse(bufferData.toString());
                    configJson.availableType = AvailableTypes.available;
                    return configJson;
                })
                .filter(platformFilter)
                .sort(nameSortComparator);
        } catch (e) {
            console.error('error occurred while reading module json files', e);
        }
    }

    async _requestModuleList() {
        try {
            const moduleList = await getModuleList();
            if (!moduleList || moduleList.length === 0) {
                return;
            }

            this._updateHardwareList(moduleList);
        } catch (e) {
            console.error('error occurred while reading module json files', e);
        }
    }

    _updateHardwareList(source: IHardwareConfig[]) {
        const availables = this._getAllHardwareModulesFromDisk();
        this.allHardwareList = [];
        const mergedList = (availables || []).map((original) => {
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
                    original.availableType = AvailableTypes.needUpdate;
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
