import {app} from 'electron';
import path from 'path';
import os from 'os';

/**
 * electron 디렉토리 이하는 외부 서브모듈로 사용되지 않는다. 그러므로 getAppPath 를 사용할 수 있다.
 */

const isAsarPacked = (() => app.getAppPath().indexOf('app.asar') > -1)();

// project's app directory path
// development: /Users/user/entry_projects/entry-hw/app
// production: /Users/user/entry_projects/entry-hw/dist/mac/Entry_HW.app/Contents/Resources/app.asar
const rootAppPath = (() => (isAsarPacked
    ? path.join(app.getAppPath(), 'app')
    : path.join(app.getAppPath(), '..')
))();

const isMacOS = os.type().includes('Darwin');

export default {
    views: path.join(rootAppPath, 'src', 'views'),
    config: (() => (isAsarPacked
        ? path.join(rootAppPath, '..', '..', 'config')
        : path.join(rootAppPath, '..', 'config')
    ))(),
    server: (() => {
        const subDirPath = isMacOS ? 'mac' : 'win';
        const fileName = isMacOS ? 'server.txt' : 'server.exe';
        return isAsarPacked
            ? path.join(rootAppPath, '..', '..', fileName)
            : path.join(rootAppPath, 'server', subDirPath, fileName);
    })(),
    validator: (() => {
        if (!isAsarPacked) {
            return undefined;
        } else if (isMacOS) {
            return path.join(rootAppPath, '..', '..', 'validator.txt');
        } else {
            return path.join(rootAppPath, '..', '..', 'validator.exe');
        }
    })(),
};

