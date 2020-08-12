import path from 'path';
import { app } from 'electron';

const isProduction = process.env.NODE_ENV === 'production';
// project's app directory path
// development: /Users/user/entry_projects/entry-hw/app
// production: /Users/user/entry_projects/entry-hw/dist/mac/Entry_HW.app/Contents/Resources
const isInAsar = __dirname.indexOf('app.asar') > -1;
const appDataPath = path.join(app.getPath('appData'), 'entry-hw');
const relativeRootPath = path.join(__dirname, '..', '..', '..', '..');
const rootAppPath = isProduction ? appDataPath : relativeRootPath;
// (() => {
//     if (isProduction) {
//         return path.join(__dirname, '..', '..');
//     } else if (isInAsar) {
//         return path.join(__dirname, '..', '..', '..', '..', '..').replace('app.asar', 'app.asar.unpacked');
//     } else {
//         return path.join(__dirname, '..', '..');
//     }
// })();

export default {
    relativeRootPath,
    driver: path.join(rootAppPath, 'drivers'),
    firmware: path.join(rootAppPath, 'firmwares'),
    modules: path.join(rootAppPath, 'modules'),
    relativeRootDriver: path.join(relativeRootPath, 'drivers'),
    relativeRootFirmware: path.join(relativeRootPath, 'firmwares'),
    relativeRootModules: path.join(relativeRootPath, 'modules'),
};
