import packageJson from '../../../../../package.json';
import { forEach, merge, reduce, toPairs } from 'lodash';
import path from 'path';
import fs from 'fs';
import createLogger from './createLogger';
import directoryPaths from '../electronDirectoryPaths';
import { app } from 'electron';

const logger = createLogger('ConfigInitialize');
/**
 * 외부 config 파일이 존재하지 않는 경우의 기본값.
 * 아래 로직상 여기에 없는 키는 적용되지 않는다.
 */
const defaultConfigSchema: IFileConfig = {
    updateCheckUrl: 'https://playentry.org/api/checkVersion',
    moduleResourceUrl: 'https://playentry.org/modules',
};
/**
 * 외부 설정이 아닌 내부에서 정의되며, 변경될 여지가 없는 하드코드의 경우 이쪽에 선언한다.
 */
const internalConfig: Omit<IInternalConfig, 'language'> = {
    appName: 'hardware',
    hardwareVersion: packageJson.version,
    roomIds: [],
};

// target 에 있는 키만 병합한다.
function mergeExistProperties(target: any, src: any) {
    const result = target;
    forEach(src, (value, key) => {
        if (result[key] !== undefined) {
            result[key] = value;
        }
    });
    return result;
}

function getFileConfig(configName = 'entry') {
    const getMergedConfig = (target: any) => mergeExistProperties(defaultConfigSchema, target);
    const configFilePath = path.resolve(directoryPaths.config, `config.${configName}.json`);

    logger.info(`load configuration file ${configFilePath}...`);

    const fileData = fs.readFileSync(configFilePath);
    return getMergedConfig(JSON.parse(fileData as any)) as IFileConfig;
}

export default (cmdConfig: ICommandLineConfig) => {
    const { config = 'entry', lang } = cmdConfig;
    const externalConfig = getFileConfig(config);
    let locale = (lang || externalConfig.language || app.getLocale()).substr(0, 2);

    if (locale === 'ja') {
        locale = 'jp';
    }

    const mergedConfig = merge({},
        internalConfig, { language: locale },
        externalConfig,
    ) as IFileConfig & IInternalConfig;

    logger.info('configuration applied');
    logger.verbose(reduce(toPairs(mergedConfig), (result, [key, value]) =>
        `${result}\n${key}: ${value}`, 'configuration properties is..'));
    global && (global.sharedObject = mergedConfig);

    return mergedConfig;
};
