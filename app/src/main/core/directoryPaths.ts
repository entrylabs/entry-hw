import path from 'path';
import { app } from 'electron';

/**
 * 각 환경에 맞춰 기본 경로를 잡아주는 로직
 * 개발 환경시에는 /Users/user/entry_projects/entry-hw/app
 * 빌드 환경시에는 [Entry_HW App's location]/Contents/Resources 가 목표위치이다.
 *
 * 또한 빌드 환경에서는 상대경로가 아닌 'userData' 위치에 저장 후 사용한다.
 *
 * entry-hw 개발시
 * 개발환경 : NODE_ENV=development, no asar, 상대경로 ../../
 * 빌드환경 : NODE_ENV=production, asar, 상대경로 ../../../../ (app.asar 안에 있는 경우 fs permission deny)
 *
 * entry-offline 개발시
 * 개발환경 : NODE_ENV=development, no asar, 상대경로 ../..
 * 빌드환경 : NODE_ENV=production, asar.unpack, 상대경로 ../../ (unpack 이기 때문에 권한 문제 x)
 */

const isInAsar = __dirname.indexOf('app.asar/') > -1;
const isInAsarUnpacked = __dirname.indexOf('app.asar.unpacked') > -1;

const userDataPath = app.getPath('userData');
const relativeRootPath = () => {
    if (isInAsar) {
        if (process.env.ASAR_UNPACKED === 'true') {
            return path.join(__dirname, '..', '..').replace('app.asar', 'app.asar.unpacked');
        } else {
            return path.join(__dirname, '..', '..', '..', '..');
        }
    }
    return path.join(__dirname, '..', '..');
};

const getRootAppPath = () => ((isInAsar || isInAsarUnpacked) ? userDataPath : relativeRootPath());

export default {
    appRoot: getRootAppPath(),
    driver: path.join(getRootAppPath(), 'drivers'),
    firmware: path.join(getRootAppPath(), 'firmwares'),
    modules: path.join(getRootAppPath(), 'modules'),
    relativeRootDriver: () => path.join(relativeRootPath(), 'drivers'),
    relativeRootFirmware: () => path.join(relativeRootPath(), 'firmwares'),
    relativeRootModules: () => path.join(relativeRootPath(), 'modules'),
};
