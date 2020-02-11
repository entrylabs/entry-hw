import { dialog } from 'electron';
import { ChildProcess, exec } from 'child_process';
import path from 'path';
import fileUtils from '../fileUtils';
import getExtraDirectoryPath from '../functions/getExtraDirectoryPath';

const platform = process.platform;

/**
 * 아두이노 플래싱 및 데이터카피(마이크로빗) 기능을 담당한다.
 * Flasher 가 기능을 하기전에 SerialPort 의 동작을 끊어야 한다. (COMPort 점유)
 * 아두이노 계열 펌웨어의 hex 파일은 main/firmwares/core 에 있는 파일을 커맨드라인 실행한다.
 *
 */
class Flasher {
    private flasherProcess?: ChildProcess;

    static get firmwareDirectoryPath() {
        return getExtraDirectoryPath('firmware');
    }

    private _flashArduino(firmware: IFirmwareInfo, port: string, options: { baudRate?: string; MCUType?: string; }) {
        return new Promise((resolve) => {
            const appPath = Flasher.firmwareDirectoryPath;
            const baudRate = options.baudRate || '115200';
            const MCUType = options.MCUType || ' m328p';

            let avrName;
            let avrConf;
            let portPrefix;

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

    private _flashCopy(firmware: ICopyTypeFirmware) {
        return new Promise((resolve, reject) => {
            const firmwareDirectory = Flasher.firmwareDirectoryPath;
            const destPath = dialog.showOpenDialogSync({
                properties: ['openDirectory'],
            });
            if (!destPath) {
                return resolve(['경로 미선택']);
            }
            // TODO 파일 없을 시 에러 처리
            fileUtils.copyFile(
                path.join(firmwareDirectory, `${firmware.name}.hex`),
                path.join(destPath[0], `${firmware.name}.hex`),
            ).then(async () => {
                if (firmware.afterDelay) {
                    await new Promise((resolve) => setTimeout(resolve, firmware.afterDelay));
                }
                resolve([]);
            }).catch((err) => {
                resolve([err]);
            });
        });
    }

    flash(firmware: IFirmwareInfo, port: string, options: { baudRate?: string; MCUType?: string; }) {
        if (typeof firmware === 'string') {
            return this._flashArduino(firmware, port, options);
        } else if ((firmware as ICopyTypeFirmware).type === 'copy') {
            return this._flashCopy(firmware as ICopyTypeFirmware);
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

export default Flasher;
