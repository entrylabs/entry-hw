import { net } from 'electron';
import createLogger from './createLogger';

type CheckUpdateResult = {
    version: string;
    padded_version: string;
    hasNewVersion: boolean;
    currentVersion: string;
    _id: string;
}

const logger = createLogger('CheckUpdate');

export default (): Promise<CheckUpdateResult> => new Promise((resolve, reject) => {
    const { updateCheckUrl, hardwareVersion } = global.sharedObject;
    const request = net.request({
        method: 'GET',
        url: updateCheckUrl,
    });

    request.setHeader('content-type', 'application/json; charset=utf-8');

    logger.info(`entry hw version check.. ${JSON.stringify({
        url: updateCheckUrl,
        method: 'GET',
        contentType: 'application/json; charset=utf-8',
    })}`);
    request.on('response', (response) => {
        let buffer = '';
        response.on('error', reject);
        response.on('data', (chunk) => {
            buffer += chunk.toString();
        });
        response.on('end', () => {
            let data: Partial<CheckUpdateResult> = {};
            try {
                data = JSON.parse(buffer);
                if(data.version && data.version > hardwareVersion){
                    data.hasNewVersion = true;
                };
                data.currentVersion = data.version;
                logger.info(`result: ${JSON.stringify(data)}`);
            } catch (e) {
                // nothing to do
            } finally {
                resolve(data as CheckUpdateResult);
            }
        });
    });
    request.on('error', reject);
    request.end();
});
