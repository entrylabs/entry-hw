const fs = require('fs');
const path = require('path');
const { unionWith, merge } = require('lodash');
const { AVAILABLE_TYPE } = require('../common/constants');
const { valid, lt } = require('semver');
const commonUtils = require('./utils/commonUtils');
const getModuleList = require('./network/getModuleList');

const nameSortComparator = (left, right) => {
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

const platformFilter = (config) =>
    config.platform && config.platform.indexOf(process.platform) > -1;

const onlineModuleSchemaModifier = (schema) => {
    schema.name = schema.title;
    schema.availableType = AVAILABLE_TYPE.needDownload;

    delete schema.title;
    delete schema.files;
    return merge(schema, schema.properties);
};

module.exports = class {
    constructor(router) {
        this.moduleBasePath = commonUtils.getExtraDirectoryPath('modules');
        this.allHardwareList = [];
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

    updateHardwareList(source = []) {
        const availables = this._getAllHardwareModulesFromDisk();
        const mergedList = unionWith(availables, source, (src, ori) => {
            if (ori.id === src.id) {
                if (!ori.version || lt(valid(ori.version), valid(src.version))) {
                    // legacy 는 moduleName 이 없기 때문에 서버에 요청을 줄 인자가 없다.
                    ori.moduleName = src.moduleName;
                    ori.availableType = AVAILABLE_TYPE.needUpdate;
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

    _getAllHardwareModulesFromDisk() {
        try {
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
        } catch (e) {
            console.error('error occurred while reading module json files', e);
        }
    }

    _notifyHardwareListChanged() {
        this.router &&
        this.router.sendEventToMainWindow('hardwareListChanged');
    }
};
