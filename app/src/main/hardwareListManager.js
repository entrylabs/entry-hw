const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { unionWith } = require('lodash');
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

module.exports = class {
    constructor(router) {
        this.moduleBasePath = commonUtils.getExtraDirectoryPath('modules');
        this.allHardwareList = [];
        this.router = router;
        this._initialize();
        this._requestModuleList();
        this._notifyHardwareListChanged();
    }

    /**
     * 파일을 읽어와 리스트에 작성한다.
     */
    _initialize() {
        try {
            this._getAllHardwareModulesFromDisk()
                .forEach((config) => config && this.allHardwareList.push(config));
        } catch (e) {
            console.error('error occurred while reading module json files', e);
        }
    }

    _getAllHardwareModulesFromDisk() {
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

            this.updateHardwareList(moduleList.map((elem) => {
                elem.availableType = AVAILABLE_TYPE.needDownload;
                return elem;
            }));
        } catch (e) {
            console.log('online hardware list update failed');
        }
    }

    updateHardwareList(source) {
        const availables = this._getAllHardwareModulesFromDisk();
        const mergedList = unionWith(availables, source, (src, ori) => {
            if (ori.id === src.id) {
                if (!ori.version || lt(valid(ori.version), valid(src.version))) {
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

    _notifyHardwareListChanged() {
        this.router &&
        this.router.sendEventToMainWindow('hardwareListChanged');
    }
};
