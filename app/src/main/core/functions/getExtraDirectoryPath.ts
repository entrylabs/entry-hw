import { app } from 'electron';
import path from 'path';

type DirectoryResolverType = 'driver' | 'firmware' | 'modules';

const getExtraDirectoryPath = (target: DirectoryResolverType) => {
    const asarIndex = app.getAppPath().indexOf(`${path.sep}app.asar`);
    const isInAsar = asarIndex > -1;

    return {
        driver: {
            dev: path.join(__dirname, '..', '..', 'drivers'),
            prod: path.join(app.getAppPath(), '..', 'drivers'),
        },
        firmware: {
            dev: path.join(__dirname, '..', '..', 'firmwares'),
            prod: path.join(app.getAppPath(), '..', 'firmwares'),
        },
        modules: {
            dev: path.join(__dirname, '..', '..', 'modules'),
            prod: path.join(app.getAppPath(), '..', 'modules'),
        },
    }[target][isInAsar ? 'prod' : 'dev'];
};

export default getExtraDirectoryPath;
