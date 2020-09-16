import path from 'path';
import { app } from 'electron';

let rootAppPath = path.join(__dirname, '..', '..');
const modulesPath = path.join(app.getPath('appData'), 'entry-hw-modules');

export default {
    setRootAppPath: (nextPath: string) => {
        rootAppPath = nextPath;
    },
    flasherPath: () => path.join(rootAppPath, 'firmwares'),

    // moduleRelatedPath
    driver: () => path.join(modulesPath, 'drivers'),
    firmware: () => path.join(modulesPath, 'firmwares'),
    modules: () => path.join(modulesPath, 'modules'),
    moduleRoot: () => modulesPath,
};
