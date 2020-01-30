import Stream from 'stream';
import fs from 'fs';
import path from 'path';
import tar, { ParseStream } from 'tar';

/**
 * 네트워크를 통해 들어온 압축파일을 받아 targetPath 에 바로 압축을 푸는 스트림이다.
 * 네트워크 데이터를 끊기지 않도록 받기위해 Stream.PassThrough 를 스타트로,
 * 모든 파일의 압축해제가 끝난 다음에는 'done' 이벤트를 emit 한다.
 * @type {Stream}
 */
export default class NetworkZipHandleStream extends Stream.PassThrough {
    constructor(targetPath: string) {
        super();

        const fileList: string[] = [];
        const fileWriteStreamPromises: Promise<void>[] = [];

        // eslint-disable-next-line new-cap
        const tarParse: ParseStream = tar.Parse();

        tarParse.on('error', (e) => {
            throw e;
        });
        this.on('error', (e) => {
            throw e;
        });

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

        this.pipe(tarParse);
    }
};
