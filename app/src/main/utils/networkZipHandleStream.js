const Stream = require('stream');
const fs = require('fs');
const path = require('path');
const tar = require('tar');

/**
 * 네트워크를 통해 들어온 압축파일을 받아 targetPath 에 바로 압축을 푸는 스트림이다.
 * 네트워크 데이터를 끊기지 않도록 받기위해 Stream.PassThrough 를 스타트로,
 * 모든 파일의 압축해제가 끝난 다음에는 'done' 이벤트를 emit 한다.
 * @type {Stream}
 */
module.exports = class NetworkZipHandleStream extends Stream.PassThrough {
    constructor(targetPath) {
        super();

        const fileList = [];
        const fileWriteStreamPromises = [];
        const tarParse = new tar.Parse();
        // eslint-disable-next-line new-cap
        this.on('error', (e) => {
            throw e;
        });

        this.pipe(tarParse);
        tarParse.on('entry', (entry) => {
                const type = entry.type;
                const fileName = entry.path;
                if (type === 'File') {
                    fileList.push(fileName);
                    const fileWriteStream = fs.createWriteStream(path.join(targetPath, fileName));
                    fileWriteStreamPromises.push(new Promise((resolve, reject) => {
                        fileWriteStream.on('error', reject);
                        fileWriteStream.on('finish', resolve);
                    }));
                    entry.pipe(fileWriteStream);
                } else {
                    entry.autodrain();
                }
            });
        tarParse.on('close', () => {
            Promise.all(fileWriteStreamPromises)
                .then(() => {
                    this.emit('done', fileList);
                })
                .catch((e) => {
                    this.emit('error', e);
                });
        });
    }
};
