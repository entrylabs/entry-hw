import { dialog } from 'electron';
import { exec, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import Utils from './utils/fileUtils';
const platform = process.platform;


type firmwareType = {baudRate?: number, MCUType?: string};
/**
 * 아두이노 플래싱 및 데이터카피(마이크로빗) 기능을 담당한다.
 * Flasher 가 기능을 하기전에 SerialPort 의 동작을 끊어야 한다. (COMPort 점유)
 * 아두이노 계열 펌웨어의 hex 파일은 main/firmwares/core 에 있는 파일을 커맨드라인 실행한다.
 *
 */
class Flasher {
    flasherProcess?: ChildProcess;

    static get _firmwareDirectoryPath() {
        const asarIndex = __dirname.indexOf('app.asar');
        if (asarIndex > -1) {
            const asarPath = __dirname.substr(0, asarIndex);
            const externalFlahserPath = path.join(asarPath, 'firmwares');
            const flasherPath = path.resolve(__dirname, '..', '..', 'firmwares');
            if (!fs.existsSync(externalFlahserPath)) {
                Utils.copyRecursiveSync(flasherPath, externalFlahserPath);
            }
            return externalFlahserPath;
        } else {
            return path.resolve('app', 'firmwares');
        }
    }

    _flashArduino(firmware: string, port: string, options: firmwareType): Promise<any[]> {
        return new Promise((resolve) => {
            const appPath = Flasher._firmwareDirectoryPath;
            const baudRate = options.baudRate || '115200';
            const MCUType = options.MCUType || ' m328p';

            let avrName: string;
            let avrConf: string;
            let portPrefix: string;

            if (platform === 'darwin') {
                avrName = './avrdude';
                avrConf = './avrdude.conf';
                portPrefix = '';
            } else {
                avrName = 'avrdude.exe';
                avrConf = './avrdude.conf';
                portPrefix = '\\\\.\\';
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

    _flashCopy(firmware: FirmwareObject, port: string, options: firmwareType): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const firmwareDirectory = Flasher._firmwareDirectoryPath;
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

    flash(firmware: Firmware, port: string, options: firmwareType): Promise<any[]> {
        if (typeof (firmware as string) === 'string') {
            return this._flashArduino((firmware as string), port, options);
        }

        if ((firmware as FirmwareObject).type === 'copy') {
            return this._flashCopy((firmware as FirmwareObject), port, options);
        }

        return Promise.reject(new Error());
    }

    kill() {
        if (this.flasherProcess) {
            this.flasherProcess.kill();
            this.flasherProcess = undefined;
        }
    }
}

export default Flasher;
