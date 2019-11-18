const { app, dialog } = require('electron');
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');
const Utils = require('./utils/fileUtils');
const platform = process.platform;

/**
 * 아두이노 플래싱 및 데이터카피(마이크로빗) 기능을 담당한다.
 * Flasher 가 기능을 하기전에 SerialPort 의 동작을 끊어야 한다. (COMPort 점유)
 * 아두이노 계열 펌웨어의 hex 파일은 main/firmwares/core 에 있는 파일을 커맨드라인 실행한다.
 *
 */
class Flasher {
    static get firmwareDirectoryPath() {
        const asarIndex = app.getAppPath().indexOf(`${path.sep}app.asar`);
        if (asarIndex > -1) {
            const asarPath = app.getAppPath().substr(0, asarIndex);
            const externalFlasherPath = path.join(asarPath, 'firmwares');
            const flasherPath = path.resolve(app.getAppPath(), __dirname, '..', '..', 'firmwares');
            if (!fs.existsSync(externalFlasherPath)) {
                Utils.copyRecursiveSync(flasherPath, externalFlasherPath);
            }
            return externalFlasherPath;
        } else {
            return path.resolve(__dirname, '..', '..', 'firmwares');
        }
    }

    _flashArduino(firmware, port, options) {
        return new Promise((resolve) => {
            const appPath = Flasher.firmwareDirectoryPath;
            const baudRate = options.baudRate || '115200';
            const MCUType = options.MCUType || ' m328p';

            let avrName;
            let avrConf;
            let portPrefix;

            switch (platform) {
                case 'darwin':
                    avrName = './avrdude';
                    avrConf = './avrdude.conf';
                    portPrefix = '';
                    break;
                default:
                    avrName = 'avrdude.exe';
                    avrConf = './avrdude.conf';
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

    _flashCopy(firmware, port, options) {
        return new Promise((resolve, reject) => {
            const firmwareDirectory = Flasher.firmwareDirectoryPath;
            const destPath = dialog.showOpenDialogSync({
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
            return this._flashArduino(firmware, port, options);
        } else if (firmware.type === 'copy') {
            return this._flashCopy(firmware, port, options);
        } else {
            return Promise.reject(new Error());
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
