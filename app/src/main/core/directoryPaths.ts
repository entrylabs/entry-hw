import path from 'path';
import { app } from 'electron';

const isProduction = process.env.NODE_ENV === 'production';
// project's app directory path
// development: /Users/user/entry_projects/entry-hw/app
// production: /Users/user/entry_projects/entry-hw/dist/mac/Entry_HW.app/Contents/Resources

// @ts-ignore
const getUserDataPath = () => app.getPath('userData');
const relativeRootPath = () => (
    isProduction ? path.join(__dirname, '..', '..', '..', '..') : path.join(__dirname, '..', '..')
);
console.log('directoryPath', __dirname);
const getRootAppPath = () => (isProduction ? getUserDataPath() : relativeRootPath());

export default {
    driver: path.join(getRootAppPath(), 'drivers'),
    firmware: path.join(getRootAppPath(), 'firmwares'),
    modules: path.join(getRootAppPath(), 'modules'),
    relativeRootDriver: path.join(relativeRootPath(), 'drivers'),
    relativeRootFirmware: path.join(relativeRootPath(), 'firmwares'),
    relativeRootModules: path.join(relativeRootPath(), 'modules'),
};
