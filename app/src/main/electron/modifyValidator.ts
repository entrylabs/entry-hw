import fs from 'fs';
import spawn from 'cross-spawn';
import directoryPaths from './electronDirectoryPaths';
import createLogger from './functions/createLogger';

const logger = createLogger('Validator');

/**
 * 파일 변조 여부를 검사하는 검사체
 * 변조 로직의 변조를 막기위해 실제 로직은 바이너리화 되어있다.
 * 코드는 공개되어있기 때문에 누구나 사용가능하지만, 정식 릴리즈된 바이너리의 변조를 감지하기 위해 로직이 작성되었다. (사내 보안관련 권고사항)
 * 변조가 감지되면 변조가 의심된다는 알림을 표기한다. (오픈소스이기 때문에 프로그램 사용에 제재를 가하지는 않는다.)
 */

export enum ResultCode {
    VALID = 100,
    INVALID = 200,
    FILE_NOT_FOUND = 201,
    NETWORK_DISCONNECTED = 300,
    LOGIC_ERROR = 301,
    NETWORK_INVALID = 302,
}

export type ValidationResult = { result: ResultCode; reason?: string };

function isValidAsarFile(): Promise<boolean> {
    const validatorPath = directoryPaths.validator;
    // production asar build 환경에서만 정상동작한다.
    if (process.env.NODE_ENV === 'development') {
        return Promise.resolve(true);
    }

    if (!validatorPath) {
        logger.info('not asar packed environment. pass validation');
        return Promise.resolve(true);
    }

    if (!fs.existsSync(validatorPath)) {
        // 파일이 없는 경우 변조됨 처리
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        const childProcess = spawn(validatorPath, ['--type=hardware'], {
            stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
            detached: true,
        });

        const timeout = setTimeout(() => {
            logger.warn('validator spawn timeout. check validator logic');
            childProcess.kill();
            resolve(false);
        }, 3000);

        childProcess.on('message', ((message: ValidationResult) => {
            clearTimeout(timeout);
            const { result, reason } = message;
            if (result === ResultCode.INVALID || result === ResultCode.FILE_NOT_FOUND) {
                logger.warn(`validation fail reason: ${reason}`);
                resolve(false);
            } else {
                resolve(true);
            }
            !childProcess.killed && childProcess.kill();
        }));
    });
}

export default isValidAsarFile;
