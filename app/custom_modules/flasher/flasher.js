const { remote } = require('electron');
const { dialog } = remote;
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');
const Utils = require('../../src/js/utils');
const platform = process.platform;

var copyRecursiveSync = function(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (exists && isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName),
                path.join(dest, childItemName));
        });
    } else {
        const data = fs.readFileSync(src);
        fs.writeFileSync(dest, data, {
            mode: 0o755,
        });
    }
};

class Flasher {
    constructor() {
        this.flasherProcess;
        this.avrFileList = ['avrdude', 'avrdude.conf', 'avrdude.exe', 'libusb0.dll'];
    }

    getAppPath(firmware) {
        return new Promise((resolve, reject) => {
            const firmwareName = typeof firmware === 'string' ? firmware : firmware.name;
            const asarIndex = __dirname.indexOf('app.asar');
            if (asarIndex > -1) {
                const asarPath = __dirname.substr(0, asarIndex);
                copyRecursiveSync(__dirname, path.join(asarPath, 'flasher'));
                resolve(asarPath);
            } else {
                resolve(path.join(__dirname, '..'));
            }
        });
    }

    flashArduino(firmware, port, options) {
        return this.getAppPath(firmware).then((appPath) => new Promise((resolve, reject) => {
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
                        cwd: path.resolve(appPath, 'flasher'),
                    },
                    (...args) => {
                        resolve(args);
                    },
                );
            }));
    }

    flashCopy(firmware, port, options, callBack) {
        return this.getAppPath(firmware).then((appPath) => new Promise((resolve, reject) => {
                const destPath = dialog.showOpenDialog({
                    properties: ['openDirectory'],
                });
                if (!destPath) {
                    return resolve(['경로 미선택']);
                }
                Utils.copyFile(
                    path.join(appPath, 'flasher', `${firmware.name}.hex`),
                    path.join(destPath[0], `${firmware.name}.hex`),
                ).then(() => {
                    resolve([]);
                }).catch((err) => {
                    resolve([err]);
                });
            }));
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

module.exports = new Flasher();
