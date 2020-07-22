import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
// project's app directory path
// development: /Users/user/entry_projects/entry-hw/app
// production: /Users/user/entry_projects/entry-hw/dist/mac/Entry_HW.app/Contents/Resources
const rootAppPath = isProduction
    ? path.join(__dirname, '..', '..', '..', '..')
    : path.join(__dirname, '..', '..');

export default {
    driver: path.join(rootAppPath, 'drivers'),
    firmware: path.join(rootAppPath, 'firmwares'),
    modules: path.join(rootAppPath, 'modules'),
};

