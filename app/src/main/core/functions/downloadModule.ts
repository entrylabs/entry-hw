import { net } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { AvailableTypes } from '../../../common/constants';
import fileUtils from '../fileUtils';
import NetworkZipHandlerStream from '../networkZipHandleStream';
import createLogger from '../../electron/functions/createLogger';
import directoryPaths from '../directoryPaths';
import axios from 'axios';
const logger = createLogger('DownloadModule');

const downloadModuleFunction = (
    moduleInfo: {
        name: string;
        version: string;
    },
    server: IEntryServerBase
): Promise<IHardwareConfig> =>
    new Promise((resolve, reject) => {
        if (!moduleInfo.name) {
            reject('must be present moduleName');
            return;
        }

        const { moduleResourceUrl } = global.sharedObject;
        const requestModuleUrl = `${moduleResourceUrl}/${moduleInfo.name}/files/module/${moduleInfo.version}`;
        const request = net.request(requestModuleUrl);
        logger.info(`hardware module download from ${requestModuleUrl}`);

        request.on('response', (response) => {
            response.on('error', reject);
            if (response.statusCode === 200) {
                const moduleDirPath = directoryPaths.modules();
                logger.verbose('hardware module zip extract..');
                const zipStream = new NetworkZipHandlerStream(moduleDirPath);
                zipStream.on('done', () => {
                    const moduleConfigPath = path.join(moduleDirPath, `${moduleInfo.name}.json`);
                    logger.info(`hardware module config path: ${moduleConfigPath}`);
                    fs.readFile(moduleConfigPath, async (err, data) => {
                        if (err) {
                            logger.warn(
                                `hardware module config read failed. ${err.name} ${err.message}`
                            );
                            return reject(err);
                        }
                        await downloadBlockFile(moduleInfo, server);
                        await moveFirmwareAndDriverDirectory();
                        const configJson = JSON.parse(data as any) as IHardwareConfig;
                        configJson.availableType = AvailableTypes.available;
                        logger.info(
                            `hardware module online load success. config : ${JSON.stringify(
                                configJson
                            )}`
                        );
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

const downloadBlockFile = async (
    moduleInfo: { name: string; version: string },
    server: IEntryServerBase
) => {
    const { moduleResourceUrl } = global.sharedObject;
    const blockModuleKeys = ['block'];
    const requestModuleUrl = `${moduleResourceUrl}/${moduleInfo.name}/files`;
    const queue = [];
    await Promise.all(
        blockModuleKeys.map(async (key) => {
            try {
                const requestUrl = `${requestModuleUrl}/${key}/${moduleInfo.version}`;
                const response = await axios({
                    url: requestUrl,
                    method: 'GET',
                    responseType: 'arraybuffer',
                });
                const blockPath = path.join(directoryPaths.blockModules(), moduleInfo.name);
                await fs.ensureDir(blockPath);
                await fs.writeFile(path.join(blockPath, key), Buffer.from(response.data, 'binary'));
                const fileRead = fs.readFileSync(path.join(blockPath, key), { encoding: 'utf8' });
                //overwrite encryption
                await fs.writeFile(
                    path.join(blockPath, key),
                    await server.requestEncryption(fileRead)
                );
            } catch (err) {
                console.error(err);
            }
        })
    );
};
const moveFirmwareAndDriverDirectory = async () => {
    const appDirPath = path.join(directoryPaths.moduleRoot());
    const moduleDirPath = path.join(appDirPath, 'modules');
    const srcDriverDirPath = path.join(moduleDirPath, 'drivers');
    const destDriverDirPath = path.join(appDirPath, 'drivers');
    const srcFirmwaresDirPath = path.join(moduleDirPath, 'firmwares');
    const destFirmwareDirPath = path.join(appDirPath, 'firmwares');

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
                    logger.info(
                        `firmware file move ${srcFirmwaresDirPath} to ${destFirmwareDirPath}`
                    );
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
