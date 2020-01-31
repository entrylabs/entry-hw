import { net } from 'electron';

const getModuleListFunction: () => Promise<IHardwareConfig[]> = () => new Promise((resolve, reject) => {
    const { baseUrl, moduleCheckApi } = global.sharedObject;

    //TODO 개발간 임시
    const request = net.request(`${baseUrl}${moduleCheckApi}`);
    request.on('response', (response) => {
        let buffer = '';
        response.on('error', reject);
        response.on('data', (chunk) => {
            buffer += chunk.toString();
        });
        response.on('end', () => {
            let data = [];
            try {
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

export default getModuleListFunction;
