const { net } = require('electron');

module.exports = () => new Promise((resolve, reject) => {
    const { baseUrl, versionCheckApi, hardwareVersion } = global.sharedObject;
    const request = net.request({
        method: 'POST',
        url: `${baseUrl}${versionCheckApi}`,
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
            let data = {};
            try {
                console.log('asdf', buffer);
                data = JSON.parse(buffer);
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
