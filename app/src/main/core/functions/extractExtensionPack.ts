import { net } from 'electron';
import createLogger from '../../electron/functions/createLogger';

const logger = createLogger('ExtractExtensionPack');

const extractExtensionPackFunction = (path: string) => {};

// Promise<IOnlineHardwareConfig[]> = () => new Promise((resolve, reject) => {
//     const { moduleResourceUrl } = global.sharedObject;

//     const request = net.request(moduleResourceUrl);
//     logger.info(`hardware list requested from ${moduleResourceUrl}`);

//     request.on('response', (response) => {
//         let buffer = '';
//         response.on('error', reject);
//         response.on('data', (chunk) => {
//             buffer += chunk.toString();
//         });
//         response.on('end', () => {
//             let data = [];
//             try {
//                 data = JSON.parse(buffer);
//                 logger.info('get hardware list from online is success');
//             } catch (e) {
//                 // nothing to do
//             } finally {
//                 resolve(data);
//             }
//         });
//     });
//     request.on('error', reject);
//     request.end();
// });

export default extractExtensionPackFunction;
