import { app } from 'electron';
import path from 'path';

// project's app directory path
const rootAppPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '..', '..', '..', 'app')
    : path.join(__dirname, '..' ,'..');

export default {
    driver: path.join(rootAppPath, 'drivers'),
    firmware: path.join(rootAppPath, 'firmwares'),
    modules: path.join(rootAppPath, 'modules'),
};

