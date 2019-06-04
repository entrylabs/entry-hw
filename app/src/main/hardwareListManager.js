const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const requestModules = require('./network/getModuleList');
const { AVAILABLE_TYPE } = require('../common/constants');

const nameSortComparator = function(left, right) {
    const lName = left.name && left.name.en.trim();
    const rName = right.name && right.name.en.trim();

    if (lName > rName) {
        return 1;
    } else if (lName < rName) {
        return -1;
    } else {
        return 0;
    }
};

const platformFilter = function(config) {
    return config.platform && config.platform.indexOf(process.platform) > -1;
};

module.exports = class {
    constructor(browser) {
        this.moduleBasePath = path.resolve(__dirname, '..', '..', 'modules');
        this.allHardwareList = [];
        this.browser = browser;
        this.initialize();
        this._requestModuleList();
    }

    /**
     * 파일을 읽어와 리스트에 작성한다.
     *
     */
    initialize() {
        // noinspection JSCheckFunctionSignatures
        try {
            fs.readdirSync(this.moduleBasePath)
                .filter((file) => !!file.match(/\.json$/))
                .map((file) => fs.readFileSync(path.join(this.moduleBasePath, file)))
                .map(JSON.parse)
                .filter(platformFilter)
                .sort(nameSortComparator)
                .map((config) => {
                    config.availableType = AVAILABLE_TYPE.available;
                    return config;
                })
                .forEach((config) => this.allHardwareList.push(config));
        } catch (e) {
            console.error('error occurred while reading module json files');
        }
    }

    _requestModuleList() {
        requestModules()
            .then((moduleList) => {
                if (!moduleList || moduleList.length === 0) {
                    return;
                }

                const onlineHardwareList = moduleList.map(this._convertMetadataToHardwareConfig);
                this.updateHardwareList(onlineHardwareList);
            });
    }

    _convertMetadataToHardwareConfig(metadata) {
        const { baseUrl, baseResource } = global.sharedObject;
        const resourceUrl = `${baseUrl}${baseResource}`;

        const { moduleName, moduleFile, imageFile, version, name, _id: id } = metadata;
        return {
            id,
            version,
            image: `${resourceUrl}/${moduleName}/${version}/${imageFile}`,
            name,
            moduleName,
            moduleFile,
            availableType: AVAILABLE_TYPE.needDownload,
        };
    }

    updateHardwareList(source) {
        const src = _.cloneDeep(source);
        const availables = this._getAllHardwareModulesFromDisk();
        this.allHardwareList = [];
        const mergedList = availables.map((oriElem) => {
            const foundElem = src.find((srcElem, index) => {
                if (this._getModuleName(srcElem) === this._getModuleName(oriElem)) {
                    delete src[index];
                    return true;
                }
                return false;
            });

            if (foundElem) {
                if (!oriElem.version || oriElem.version !== foundElem.version) {
                    oriElem.availableType = AVAILABLE_TYPE.needUpdate;
                }
            }
            return oriElem;
        });

        this.allHardwareList = mergedList.concat(src || []).sort(nameSortComparator);
        this.browser.send('onlineHardwareUpdated');
    }

    /**
     * 현재 디스크에 있는 모듈들을 전부 가져온다.
     * 해당 모듈은 전부 available 플래그이다.
     * @returns {Object[]} module objects
     * @private
     */
    _getAllHardwareModulesFromDisk() {
        return fs.readdirSync(this.moduleBasePath)
            .filter((file) => !!file.match(/\.json$/))
            .map((file) => fs.readFileSync(path.join(this.moduleBasePath, file)))
            .map(JSON.parse)
            .map((config) => {
                config.availableType = AVAILABLE_TYPE.available;
                return config;
            });
    }

    /**
     * available config.json 에서는 module property 의 앞부분을
     * module metadata 라면 모듈명에 해당하는 name 을 가져온다.
     *
     * TODO 이는 하나로 통일되어야 한다.
     * @param moduleObject
     * @returns {string|undefined}
     * @private
     */
    _getModuleName(moduleObject) {
        if (!moduleObject) {
            return;
        }

        // 수정된 하드웨어모듈 json 혹은 metadata 의 경우
        if (moduleObject.moduleName) {
            return moduleObject.moduleName;
        }

        // 아직 수정되지 않은 오리지널 하드웨어모듈 json 의 경우
        // 모듈 프로퍼티의 .js 를 뗀 값을 모듈명으로 상정한다.
        if (moduleObject.module) {
            return moduleObject.module.substring(0, moduleObject.module.indexOf('.'));
        }
    }
};
