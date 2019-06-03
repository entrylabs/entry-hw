const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const requestModules = require('./network/getModuleList');
const { AVAILABLE_TYPE } = require('../common/constants');

const nameSortComparator = function(left, right) {
    const lName = left.name.ko ? left.name.ko.trim() : left.title;
    const rName = right.name.ko ? right.name.ko.trim() : right.title;

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
                const { baseUrl, baseResource } = global.sharedObject;
                const resourceUrl = `${baseUrl}${baseResource}`;

                if (!moduleList || moduleList.length === 0) {
                    return;
                }

                const onlineHardwareList = moduleList.map((moduleElement) => {
                    const { name, imageFile, version, title, _id: id } = moduleElement;
                    return {
                        id,
                        version,
                        image: `${resourceUrl}/${name}/${version}/${imageFile}`,
                        name,
                        title,
                        availableType: AVAILABLE_TYPE.needDownload,
                    };
                });
                this.allHardwareList =
                    this._mergeHardwareList(this.allHardwareList, onlineHardwareList);
                this.browser.send('onlineHardwareUpdated');
            });
    }

    _mergeHardwareList(original, source) {
        const src = _.cloneDeep(source);
        const mergedList = original.map((oriElem) => {
            const foundElem = src.find((srcElem, index) => {
                if (this._getNameOrModuleName(srcElem) === this._getNameOrModuleName(oriElem)) {
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

        return mergedList.concat(src).sort(nameSortComparator);
    }

    _getNameOrModuleName(moduleObject) {
        if (!moduleObject) {
            return;
        }

        return typeof moduleObject.name === 'object' ?
            moduleObject.module.substring(0, moduleObject.module.indexOf('.')) :
            moduleObject.name;
    }
};
