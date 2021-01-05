import path from 'path';

let rootAppPath = path.join(__dirname, '..', '..');

export default {
    setRootAppPath: (nextPath: string) => {
        rootAppPath = nextPath;
    },
    driver: () => path.join(rootAppPath, 'drivers'),
    firmware: () => path.join(rootAppPath, 'firmwares'),
    modules: () => path.join(rootAppPath, 'modules'),
};

