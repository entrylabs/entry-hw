import { app } from 'electron';
import path from 'path';
import os from 'os';

// project's app directory path
const rootAppPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '..', '..', '..', 'app')
    : path.join(__dirname, '..' ,'..');

export default {
    driver: path.join(rootAppPath, 'drivers'),
    firmware: path.join(rootAppPath, 'firmwares'),
    modules: path.join(rootAppPath, 'modules'),
    views: path.join(rootAppPath, 'src', 'views'),
    config: path.join(rootAppPath, '..', 'config'),
    server: os.type().includes('Darwin')
        ? path.join(rootAppPath, 'server', 'mac', 'server.txt')
        : path.join(rootAppPath, 'server', 'win', 'server.exe'),
};

