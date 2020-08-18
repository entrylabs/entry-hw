import fs from 'fs-extra';
import { isEqual } from 'lodash';
import { app } from 'electron';
import path from 'path';
import directoryPaths from '../directoryPaths';
import FileUtils from '../fileUtils';

const markerFilePath = path.join(directoryPaths.appRoot, 'moduleVersion');

// 현재 버전으로 마킹한다. 동일 버전의 프로그램 실행이 계속해서 복사하는 것을 방지하기 위함
async function markInitializedVersion() {
    await fs.writeFile(markerFilePath, app.getVersion());
}

async function isSameMarkedVersion() {
    try {
        const file = await fs.readFile(markerFilePath);
        return isEqual(file.toString('utf8'), app.getVersion());
    } catch (e) {
        // 만약 파일이 없는 경우 혹은 에러가 발생한 경우
        return false;
    }
}

export default async () => {
    const isInAsar = __dirname.indexOf('app.asar') > -1;
    const isSourceExists = await fs.pathExists(directoryPaths.relativeRootModules());

    if (isInAsar && isSourceExists && !(await isSameMarkedVersion())) {
        await Promise.all([
            FileUtils.rmdir(directoryPaths.modules),
            FileUtils.rmdir(directoryPaths.firmware),
            FileUtils.rmdir(directoryPaths.driver),
        ]);
        await Promise.all([
            fs.copy(directoryPaths.relativeRootModules(), directoryPaths.modules, { overwrite: true }),
            fs.copy(directoryPaths.relativeRootDriver(), directoryPaths.driver), { overwrite: true },
            fs.copy(directoryPaths.relativeRootFirmware(), directoryPaths.firmware, { overwrite: true }),
        ]);
        await markInitializedVersion();
    } else {
        console.info('userData\'s modules is on same version. will not copy from application');
    }
};
