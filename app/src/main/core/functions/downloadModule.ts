import { net } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { AvailableTypes } from '../../../common/constants';
import fileUtils from '../fileUtils';
import NetworkZipHandlerStream from '../networkZipHandleStream';
import createLogger from '../../electron/functions/createLogger';
import directoryPaths from '../../../common/directoryPaths';

const logger = createLogger('DownloadModule');

const downloadModuleFunction = (moduleName: string) =>
    new Promise((resolve, reject) => {
        if (!moduleName) {
            reject('must be present moduleName');
            return;
        }

        const { moduleResourceUrl } = global.sharedObject;
        const requestModuleUrl = `${moduleResourceUrl}/${moduleName}/files/module`;
        const request = net.request(requestModuleUrl);
        logger.info(`hardware module download from ${requestModuleUrl}`);

        request.on('response', (response) => {
            response.on('error', reject);
            if (response.statusCode === 200) {
                const moduleDirPath = directoryPaths.modules;
                logger.verbose('hardware module zip extract..');
                const zipStream = new NetworkZipHandlerStream(moduleDirPath);
                zipStream.on('done', () => {
                    const moduleConfigPath = path.join(moduleDirPath, `${moduleName}.json`);
                    logger.info(`hardware module config path: ${moduleConfigPath}`);
                    fs.readFile(moduleConfigPath, async (err, data) => {
                        if (err) {
                            logger.warn(`hardware module config read failed. ${err.name} ${err.message}`);
                            return reject(err);
                        }

                        await moveFirmwareAndDriverDirectory();
                        const configJson = JSON.parse(data as any) as IHardwareConfig;
                        configJson.availableType = AvailableTypes.available;

                        logger.info(`hardware module online load success. config : ${JSON.stringify(configJson)}`);
                        resolve(configJson);
                    });
                });

                // @ts-ignore
                response.pipe(zipStream);
                response.on('end', () => {
                    // nothing to do
                });
            } else {
                console.error('module request get not ok status');
                reject();
            }
        });
        request.end();
    });

const moveFirmwareAndDriverDirectory = async () => {
    const moduleDirPath = directoryPaths.modules;
    const srcDriverDirPath = path.join(moduleDirPath, 'drivers');
    const destDriverDirPath = directoryPaths.driver;
    const srcFirmwaresDirPath = path.join(moduleDirPath, 'firmwares');
    const destFirmwareDirPath = directoryPaths.firmware;

    try {
        await Promise.all([
            new Promise(async (resolve) => {
                if (fs.pathExistsSync(srcDriverDirPath)) {
                    logger.info(`driver file move ${srcDriverDirPath} to ${destDriverDirPath}`);
                    await fileUtils.moveFileOrDirectory(srcDriverDirPath, destDriverDirPath);
                    await fileUtils.rmdir(srcDriverDirPath);
                }
                resolve();
            }),
            new Promise(async (resolve) => {
                if (fs.pathExistsSync(srcFirmwaresDirPath)) {
                    logger.info(`firmware file move ${srcFirmwaresDirPath} to ${destFirmwareDirPath}`);
                    await fileUtils.moveFileOrDirectory(srcFirmwaresDirPath, destFirmwareDirPath);
                    await fileUtils.rmdir(srcFirmwaresDirPath);
                }
                resolve();
            }),
        ]);
        logger.info('driver, firmware file move success');
    } catch (e) {
        logger.info(`driver, firmware file move failed. ${e.name}: ${e.message}`);
    }
};

export default downloadModuleFunction;
