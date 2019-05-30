const packageJson = require('../../../../../package.json');
const { forEach, merge } = require('lodash');
const path = require('path');
const fs = require('fs');

/**
 * 외부 config 파일이 존재하지 않는 경우의 기본값.
 * 아래 로직상 여기에 없는 키는 적용되지 않는다.
 */
const defaultConfigSchema = {
    'baseUrl': 'https://playentry.org',
    'baseResource': '/public/hardware',
    'versionCheckApi': '/api/checkVersion',
    'moduleCheckApi': '/api/hardware',
};

/**
 * 외부 설정이 아닌 내부에서 정의되며, 변경될 여지가 없는 하드코드의 경우 이쪽에 선언한다.
 */
const internalConfig = {
    appName: 'hardware',
    hardwareVersion: packageJson.version,
    roomIds: [],
    hostURI: 'playentry.org',
    hostProtocol: 'https:',
};

// target 에 있는 키만 병합한다.
function mergeExistProperties(target, src) {
    const result = target;
    forEach(src, (value, key) => {
        if (result[key] !== undefined) {
            result[key] = value;
        }
    });
    return result;
}

module.exports = (configName = 'ko') => {
    const getMergedConfig = (target) => mergeExistProperties(defaultConfigSchema, target);
    const configFilePath = path.resolve('config', `config.${configName}.json`);

    console.log(`load ${configFilePath}...`);

    const fileData = fs.readFileSync(configFilePath);
    const externalConfig = getMergedConfig(JSON.parse(fileData));

    const mergedConfig = merge({}, internalConfig, externalConfig);

    console.log('applied configuration');
    forEach(mergedConfig, (value, key) => {
        console.log(`${key}: ${value}`);
    });

    if (global !== undefined) {
        global.sharedObject = mergedConfig;
    }
    return mergedConfig;
};
