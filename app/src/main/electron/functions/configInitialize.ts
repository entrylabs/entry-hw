import packageJson from '../../../../../package.json';
import getExtraDirectoryPath from '../../core/functions/getExtraDirectoryPath';
import { forEach, merge, reduce, toPairs } from 'lodash';
import path from 'path';
import fs from 'fs';
import createLogger from './createFileLogger';

const logger = createLogger('ConfigInitialize');
/**
 * 외부 config 파일이 존재하지 않는 경우의 기본값.
 * 아래 로직상 여기에 없는 키는 적용되지 않는다.
 */
const defaultConfigSchema: IFileConfig = {
    updateCheckUrl: 'https://playentry.org/api/checkVersion',
    remoteLogUrl: 'https://playentry.org/log',
    moduleResourceUrl: 'https://playentry.org/modules',
};

/**
 * 외부 설정이 아닌 내부에서 정의되며, 변경될 여지가 없는 하드코드의 경우 이쪽에 선언한다.
 */
const internalConfig = {
    appName: 'hardware',
    hardwareVersion: packageJson.version,
    roomIds: [],
};

// target 에 있는 키만 병합한다.
function mergeExistProperties(target: any, src: any): IFileConfig & IInternalConfig {
    const result = target;
    forEach(src, (value, key) => {
        if (result[key] !== undefined) {
            result[key] = value;
        }
    });
    return result;
}

export default (configName = 'entry'): IFileConfig & IInternalConfig => {
    const getMergedConfig = (target: any) => mergeExistProperties(defaultConfigSchema, target);
    const configFilePath = path.resolve(getExtraDirectoryPath('config'), `config.${configName}.json`);

    logger.info(`load configuration ${configFilePath}...`);

    const fileData = fs.readFileSync(configFilePath);
    // @ts-ignore
    const externalConfig = getMergedConfig(JSON.parse(fileData) as IFileConfig);

    const mergedConfig = merge({}, internalConfig, externalConfig);

    logger.info('configuration applied');
    logger.verbose(reduce(toPairs(mergedConfig), (result, [key, value]) =>
        `${result}\n${key}: ${value}`, 'configuration properties is..'));

    if (global !== undefined) {
        global.sharedObject = mergedConfig;
    }
    return mergedConfig;
};
