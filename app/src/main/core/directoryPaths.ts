import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const isForStandalone = process.env.STANDALONE === 'true';
// project's app directory path
// development: /Users/user/entry_projects/entry-hw/app
// production: /Users/user/entry_projects/entry-hw/dist/mac/Entry_HW.app/Contents/Resources
const rootAppPath = (() => {
    if (isProduction) {
        if (isForStandalone) {
            return path.join(__dirname, '..', '..', '..', '..');
        } else {
            return path.join(__dirname, '..', '..', '..', '..', '..', '..');
        }
    } else {
        return path.join(__dirname, '..', '..');
    }
})();


export default {
    driver: path.join(rootAppPath, 'drivers'),
    firmware: path.join(rootAppPath, 'firmwares'),
    modules: path.join(rootAppPath, 'modules'),
};

