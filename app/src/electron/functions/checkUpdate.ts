import { net } from 'electron';

export default () => new Promise((resolve, reject) => {
    const { updateCheckUrl, hardwareVersion } = global.sharedObject;
    const request = net.request({
        method: 'POST',
        url: updateCheckUrl,
    });

    request.setHeader('content-type', 'application/json; charset=utf-8');
    request.write(
        JSON.stringify({
            category: 'hardware',
            version: hardwareVersion,
        }),
    );
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
