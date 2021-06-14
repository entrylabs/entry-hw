import Stream from 'stream';
import fs from 'fs-extra';
import path from 'path';
import tar, { ParseStream } from 'tar';
import createLogger from '../electron/functions/createLogger';

const logger = createLogger('core/networkZipHandleStream.ts');

/**
 * 네트워크를 통해 들어온 압축파일을 받아 targetPath 에 바로 압축을 푸는 스트림이다.
 * 네트워크 데이터를 끊기지 않도록 받기위해 Stream.PassThrough 를 스타트로,
 * 모든 파일의 압축해제가 끝난 다음에는 'done' 이벤트를 emit 한다.
 * @type {Stream}
 */
export default class NetworkZipHandleStream extends Stream.PassThrough {
    constructor(targetPath: string) {
        super();
        logger.info(`online module zip extraction requested : ${targetPath}`);

        const fileList: string[] = [];
        const fileWriteStreamPromises: Promise<void>[] = [];

        // eslint-disable-next-line new-cap
        // @ts-ignore
        const tarParse: ParseStream = new tar.Parse({ onentry: true });

        tarParse.on('error', (e) => {
            throw e;
        });

        tarParse.on('entry', async (entry) => {
            const type = entry.type;
            const fileName = entry.path;
            const filePath = path.join(targetPath, fileName);

            fs.ensureDirSync(path.dirname(filePath));
            const writeStream = fs.createWriteStream(filePath);
            fileList.push(path.basename(filePath));
            fileWriteStreamPromises.push(
                // @ts-ignore
                new Promise((resolve, reject) => {
                    try {
                        writeStream.on('error', reject);
                        writeStream.on('finish', resolve);
                    } catch (err) {
                        console.log(err);
                    }
                }).catch((err) => {
                    console.log(err);
                })
            );
            entry.pipe(writeStream);
        });
        tarParse.on('close', () => {
            Promise.all(fileWriteStreamPromises)
                .then(() => {
                    logger.info('zip extraction done');
                    this.emit('done', fileList);
                })
                .catch((e) => {
                    logger.error(`error occurred while zip extraction ${e.message}`);
                    this.emit('error', e);
                });
        });

        this.pipe(tarParse);
    }
}
