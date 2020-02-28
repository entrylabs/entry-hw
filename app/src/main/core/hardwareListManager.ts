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
        this.updateHardwareListFromFileSystem();
        this.updateHardwareListFromOnline();
    }

    async updateHardwareListFromOnline() {
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

    updateHardwareListFromFileSystem() {
        const moduleList = this.getAllHardwareModulesFromDisk();
        this.updateHardwareList(moduleList);
    }

    updateHardwareList(source: IHardwareConfig[]) {
        const mergedList = unionWith(this.allHardwareList, source,
            (src, ori) => {
                // 동일한 모듈이 존재한다면
                if (ori.id === src.id) {
                    // 기존 엘리먼트가 버전이 없거나, 버전이 신규로 들어올 엘리먼트보다 낮거나, 사용가능한 상태가 아니면
                    // 신규 엘리먼트의 정보로 치환된다.
                    if (!ori.version
                        || lt(valid(ori.version) as string, valid(src.version) as string)
                        || ori.availableType !== AvailableTypes.available
                    ) {
                        // ori = src;
                        Object.assign(ori, src);
                    }
                    return true;
                }
                // 그렇지 않으면 신규 엘리먼트로서 추가된다.
                return false;
            });

        this.allHardwareList = mergedList
            .filter(platformFilter)
            .sort(nameSortComparator);
        this.notifyHardwareListChanged();
    }

    notifyHardwareListChanged() {
        this.router &&
        this.router.sendEventToMainWindow('hardwareListChanged');
    }

    private getAllHardwareModulesFromDisk() {
        try {
            const moduleList = fs.readdirSync(this.moduleBasePath)
                .filter((file) => !!file.match(/\.json$/))
                .map<IHardwareConfig>((file) => {
                    const bufferData = fs.readFileSync(path.join(this.moduleBasePath, file));
                    const configJson = JSON.parse(bufferData.toString());
                    configJson.availableType = AvailableTypes.available;
                    return configJson;
                })
                .filter(platformFilter)
                .sort(nameSortComparator);

            return moduleList || [];
        } catch (e) {
            console.error('error occurred while reading module json files', e);
        }
        return [];
    }
};
