import { net } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { AvailableTypes } from '../../../common/constants';
import fileUtils from '../fileUtils';
import NetworkZipHandlerStream from '../networkZipHandleStream';
import getExtraDirectoryPath from './getExtraDirectoryPath';

const downloadModuleFunction: (moduleName: string) => Promise<IHardwareConfig> = (moduleName: string) =>
    new Promise((resolve, reject) => {
        if (!moduleName) {
            reject('must be present moduleName');
            return;
        }

        const { moduleResourceUrl } = global.sharedObject;

        const request = net.request(`${moduleResourceUrl}/${moduleName}/files/module`);
        request.on('response', (response) => {
            response.on('error', reject);
            if (response.statusCode === 200) {
                const moduleDirPath = getExtraDirectoryPath('modules');
                const zipStream = new NetworkZipHandlerStream(moduleDirPath);
                zipStream.on('done', () => {
                    fs.readFile(
                        path.join(moduleDirPath, `${moduleName}.json`),
                        async (err, data) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            await moveFirmwareAndDriverDirectory();
                            const configJson = JSON.parse(data as any) as IHardwareConfig;
                            configJson.availableType = AvailableTypes.available;
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
    const moduleDirPath = getExtraDirectoryPath('modules');
    const srcDriverDirPath = path.join(moduleDirPath, 'drivers');
    const destDriverDirPath = getExtraDirectoryPath('driver');
    const srcFirmwaresDirPath = path.join(moduleDirPath, 'firmwares');
    const destFirmwareDirPath = getExtraDirectoryPath('firmware');

    await Promise.all([
        new Promise(async (resolve) => {
            if (fs.pathExistsSync(srcDriverDirPath)) {
                await fileUtils.moveFileOrDirectory(srcDriverDirPath, destDriverDirPath);
                await fileUtils.rmdir(srcDriverDirPath);
            }
            resolve();
        }),
        new Promise(async (resolve) => {
            if (fs.pathExistsSync(srcFirmwaresDirPath)) {
                await fileUtils.moveFileOrDirectory(srcFirmwaresDirPath, destFirmwareDirPath);
                await fileUtils.rmdir(srcFirmwaresDirPath);
            }
            resolve();
        }),
    ]);
};

export default downloadModuleFunction;
