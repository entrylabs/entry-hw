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
     */
    initialize() {
        // noinspection JSCheckFunctionSignatures
        try {
            this._getAllHardwareModulesFromDisk()
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

        const { moduleName, moduleFile, imageFile, version, name, hardware } = metadata;
        const { id, platform } = hardware;
        return {
            id,
            version,
            image: `${resourceUrl}/${moduleName}/${version}/${imageFile}`,
            name,
            moduleName,
            moduleFile,
            platform,
            availableType: AVAILABLE_TYPE.needDownload,
        };
    }

    updateHardwareList(source) {
        const src = _.cloneDeep(source);
        const availables = this._getAllHardwareModulesFromDisk();
        this.allHardwareList = [];
        const mergedList = availables.map((oriElem) => {
            const foundElem = src.find((srcElem, index) => {
                if (this._isSameModule(oriElem, srcElem)) {
                    src.splice(index, 1);
                    return true;
                }
                return false;
            });

            if (foundElem) {
                // != 의 경우 일부러 그랬습니다. 문자열 / 숫자를 상관하지 않게 하기 위함
                if (!oriElem.version || oriElem.version != foundElem.version) {
                    oriElem.availableType = AVAILABLE_TYPE.needUpdate;
                }
            }
            return oriElem;
        });

        this.allHardwareList = mergedList
            .concat(src || [])
            .filter(platformFilter)
            .sort(nameSortComparator);
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
     * 현재 모듈과 특정 외부 모듈이 동일한 모듈인지 판단한다.
     * 함수가 따로 존재하는 이유는, 기존 모듈 데이터가 legacy 라서
     * moduleName 프로퍼티가 없고 id 만 존재할 수 있기 때문이다.
     * 이 함수는 moduleName 이 없으면 id 로 비교하고 있으면 moduleName 으로 비교한다.
     * id 비교시엔 outdated 경고를 출력한다.
     * @param original 기존에 가지고 있던 모듈데이터
     * @param source 신규로 추가된 모듈데이터
     * @private
     */
    _isSameModule(original, source) {
        if (original.moduleName) {
            return original.moduleName === source.moduleName;
        } else {
            console.warn(`${original.id} was outdated. please modulize`);
            return original.id === source.id;
        }
    }
};
