import { app } from 'electron';
import path from 'path';
import os from 'os';

/**
 * electron 디렉토리 이하는 외부 서브모듈로 사용되지 않는다. 그러므로 getAppPath 를 사용할 수 있다.
 */

// project's app directory path
const rootAppPath = process.env.NODE_ENV === 'production'
    ? path.join(app.getAppPath(), 'app')
    : path.join(app.getAppPath(), '..');

export default {
    views: path.join(rootAppPath, 'src', 'views'),
    config: path.join(rootAppPath, '..', 'config'),
    server: os.type().includes('Darwin')
        ? path.join(rootAppPath, 'server', 'mac', 'server.txt')
        : path.join(rootAppPath, 'server', 'win', 'server.exe'),
};

