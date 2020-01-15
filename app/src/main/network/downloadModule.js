const { net } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const rimraf = require('rimraf');
const { AVAILABLE_TYPE } = require('../../common/constants');
const fileUtils = require('../utils/fileUtils');
const commonUtils = require('../utils/commonUtils');
const NetworkZipHandlerStream = require('../utils/networkZipHandleStream');

module.exports = (moduleName) => new Promise((resolve, reject) => {
    if (!moduleName) {
        reject(new Error('moduleName it not present'));
        return;
    }

    const { moduleResourceUrl } = global.sharedObject;

    //TODO 개발간 임시
    const request = net.request(`${moduleResourceUrl}/${moduleName}/files/module`);
    request.on('response', (response) => {
        response.on('error', reject);
        if (response.statusCode === 200) {
            const moduleDirPath = commonUtils.getExtraDirectoryPath('modules');
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
                        const configJson = JSON.parse(data);
                        configJson.availableType = AVAILABLE_TYPE.available;
                        resolve(configJson);
                    });
            });

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
    const moduleDirPath = commonUtils.getExtraDirectoryPath('modules');
    const srcDriverDirPath = path.join(moduleDirPath, 'drivers');
    const destDriverDirPath = commonUtils.getExtraDirectoryPath('driver');
    const srcFirmwaresDirPath = path.join(moduleDirPath, 'firmwares');
    const destFirmwareDirPath = commonUtils.getExtraDirectoryPath('firmware');

    //TODO Promise.all
    if (fs.pathExistsSync(srcDriverDirPath)) {
        await fileUtils.moveFileOrDirectory(srcDriverDirPath, destDriverDirPath);
    }
    if (fs.pathExistsSync(srcFirmwaresDirPath)) {
        await fileUtils.moveFileOrDirectory(srcFirmwaresDirPath, destFirmwareDirPath);
    }

    await Promise.all([
        fileUtils.rmdir(srcDriverDirPath),
        fileUtils.rmdir(srcFirmwaresDirPath),
    ]);
};
