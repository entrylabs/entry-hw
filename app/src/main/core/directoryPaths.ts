import path from 'path';
import { app } from 'electron';

let rootAppPath = path.join(__dirname, '..', '..');
const modulesPath = path.join(app.getPath('appData'), 'entry-hw-modules');

export default {
    setRootAppPath: (nextPath: string) => {
        rootAppPath = nextPath;
    },
    rootAppPath: () => rootAppPath,
    flasherPath: () => path.join(rootAppPath, 'flashbinary'),

    //legacy path, only for development
    static_driver: () => path.join(rootAppPath, 'drivers'),
    static_firmware: () => path.join(rootAppPath, 'firmwares'),
    static_modules: () => path.join(rootAppPath, 'modules'),

    // moduleRelatedPath
    driver: () => path.join(modulesPath, 'drivers'),
    firmware: () => path.join(modulesPath, 'firmwares'),
    modules: () => path.join(modulesPath, 'modules'),
    blockModules: () => path.join(modulesPath, 'block_module'),
    packs: () => path.join(rootAppPath, 'packs'),
    moduleRoot: () => modulesPath,
};
