const { dialog } = require('electron');
const exec = require('child_process').exec;
const path = require('path');
const Utils = require('../src/js/utils');
const platform = process.platform;

/**
 * 아두이노
 */
class Flasher {
    static get firmwareDirectory() {
        return path.resolve('app', 'main', 'firmwares');
    }

    constructor() {
        this.avrFileList = ['avrdude', 'avrdude.conf', 'avrdude.exe', 'libusb0.dll'];
    }

    _getFirmwareDirectoryPath() {
        //TODO app 패키징 후 위치 수정 필수
        const asarIndex = __dirname.indexOf('app.asar');
        if (asarIndex > -1) {
            const asarPath = __dirname.substr(0, asarIndex);
            Utils.copyRecursiveSync(__dirname, path.join(asarPath, 'flasher'));
            return asarPath;
        } else {
            return Flasher.firmwareDirectory;
            // return path.join(__dirname, '..');
        }
    }

    flashArduino(firmware, port, options) {
        return new Promise((resolve, reject) => {
            const appPath = this._getFirmwareDirectoryPath(firmware);
            const baudRate = options.baudRate || '115200';
            const MCUType = options.MCUType || ' m328p';

            let avrName;
            let avrConf;
            let portPrefix;

            switch (platform) {
                case 'darwin':
                    avrName = './core/avrdude';
                    avrConf = './core/avrdude.conf';
                    portPrefix = '';
                    break;
                default:
                    avrName = './core/avrdude.exe';
                    avrConf = './core/avrdude.conf';
                    portPrefix = '\\\\.\\';
                    break;
            }
            const cmd = [
                avrName,
                ' -p',
                MCUType,
                ' -P',
                portPrefix,
                port,
                ' -b',
                baudRate,
                ' -Uflash:w:"',
                firmware,
                '.hex":i -C',
                avrConf,
                ' -carduino -D',
            ];

            this.flasherProcess = exec(
                cmd.join(''),
                {
                    cwd: appPath,
                },
                (...args) => {
                    resolve(args);
                },
            );
        });
    }

    flashCopy(firmware, port, options) {
        return new Promise((resolve, reject) => {
            const firmwareDirectory = this._getFirmwareDirectoryPath();
            const destPath = dialog.showOpenDialog({
                properties: ['openDirectory'],
            });
            if (!destPath) {
                return resolve(['경로 미선택']);
            }
            Utils.copyFile(
                path.join(firmwareDirectory, `${firmware.name}.hex`),
                path.join(destPath[0], `${firmware.name}.hex`),
            ).then(() => {
                resolve([]);
            }).catch((err) => {
                resolve([err]);
            });
        });
    }

    flash(firmware, port, options) {
        if (typeof firmware === 'string' || firmware.type === 'arduino') {
            return this.flashArduino(firmware, port, options);
        } else if (firmware.type === 'copy') {
            return this.flashCopy(firmware, port, options);
        }
    }

    kill() {
        if (this.flasherProcess) {
            this.flasherProcess.kill();
            this.flasherProcess = undefined;
        }
    }
}

module.exports = Flasher;
