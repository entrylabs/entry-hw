const Stream = require('stream');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

/**
 *
 * @type {Stream.PassThrough}
 */
module.exports = class NetworkZipHandleStream extends Stream.PassThrough {
    constructor(targetPath) {
        super();

        this.removeAllListeners('end');

        // eslint-disable-next-line new-cap
        this.pipe(unzipper.Parse())
            .on('entry', (entry) => {
                const type = entry.type;
                const fileName = entry.path;
                if (type === 'File') {
                    return entry.pipe(fs.createWriteStream(path.join(targetPath, fileName)));
                } else {
                    return entry.autodrain();
                }
            })
            .promise()
            .then(() => {
                this.emit('end');
            });
    }
};
