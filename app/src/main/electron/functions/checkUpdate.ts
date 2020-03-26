import { net } from 'electron';
import createLogger from './createLogger';

const logger = createLogger('CheckUpdate');

export default () => new Promise((resolve, reject) => {
    const { updateCheckUrl, hardwareVersion } = global.sharedObject;
    const request = net.request({
        method: 'POST',
        url: updateCheckUrl,
    });
    const params = {
        category: 'hardware',
        version: hardwareVersion,
    };

    request.setHeader('content-type', 'application/json; charset=utf-8');
    request.write(JSON.stringify(params));

    logger.info(`entry hw version check.. ${JSON.stringify({
        url: updateCheckUrl,
        method: 'POST',
        contentType: 'application/json; charset=utf-8',
        ...params,
    })}`);
    request.on('response', (response) => {
        let buffer = '';
        response.on('error', reject);
        response.on('data', (chunk) => {
            buffer += chunk.toString();
        });
        response.on('end', () => {
            let data: any = {};
            try {
                data = JSON.parse(buffer);
                data.currentVersion = hardwareVersion;
                logger.info(`result: ${JSON.stringify(data)}`);
            } catch (e) {
                // nothing to do
            } finally {
                resolve(data);
            }
        });
    });
    request.on('error', reject);
    request.end();
});
