const Stream = require('stream');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

/**
 * 네트워크를 통해 들어온 압축파일을 받아 targetPath 에 바로 압축을 푸는 스트림이다.
 * 네트워크 데이터를 끊기지 않도록 받기위해 Stream.PassThrough 를 스타트로,
 * 모든 파일의 압축해제가 끝난 다음에는 'end' 이벤트를 emit 한다.
 * @type {Stream}
 */
module.exports = class NetworkZipHandleStream extends Stream.PassThrough {
    constructor(targetPath) {
        super();

        this.removeAllListeners('end');
        const fileList = [];
        // eslint-disable-next-line new-cap
        this.pipe(unzipper.Parse())
            .on('entry', (entry) => {
                const type = entry.type;
                const fileName = entry.path;
                if (type === 'File') {
                    fileList.push(fileName);
                    return entry.pipe(fs.createWriteStream(path.join(targetPath, fileName)));
                } else {
                    return entry.autodrain();
                }
            })
            .promise()
            .then(() => {
                this.emit('end', fileList);
            })
            .catch((e) => {
                this.emit('error', e);
            });
    }
};
