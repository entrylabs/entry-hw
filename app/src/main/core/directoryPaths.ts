import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
// project's app directory path
// development: /Users/user/entry_projects/entry-hw/app
// production: /Users/user/entry_projects/entry-hw/dist/mac/Entry_HW.app/Contents/Resources
const isInAsar = __dirname.indexOf('app.asar') > -1;
const rootAppPath = (() => {
    if (isProduction) {
        return path.join(__dirname, '..', '..', '..', '..');
    } else if (isInAsar) {
        return path.join(__dirname, '..', '..', '..', '..', '..').replace('app.asar', 'app.asar.unpacked');
    } else {
        return path.join(__dirname, '..', '..');
    }
})();

export default {
    driver: path.join(rootAppPath, 'drivers'),
    firmware: path.join(rootAppPath, 'firmwares'),
    modules: path.join(rootAppPath, 'modules'),
};

