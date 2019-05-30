const { net } = require('electron');
const path = require('path');
const fs = require('fs');
const NetworkZipHandlerStream = require('../utils/networkZipHandleStream');

module.exports = (moduleName) => new Promise((resolve, reject) => {
    if (!moduleName) {
        reject();
        return;
    }

    const { host, protocol } = global.sharedObject;

    //TODO 개발간 임시
    const request = net.request({
        host: 'localhost:4000',
        protocol: 'http:',
        path: `/api/hardware/${moduleName}/module`,
    });

    request.on('response', (response) => {
        response.on('error', reject);
        if (response.statusCode === 200) {
            const moduleDirPath = path.resolve('app', 'modules');
            const zipStream = new NetworkZipHandlerStream(moduleDirPath);
            zipStream.on('done', () => {
                fs.readFile(
                    path.join(moduleDirPath, `${moduleName}.json`),
                    (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(JSON.parse(data));
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
