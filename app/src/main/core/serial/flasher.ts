import { dialog } from 'electron';
import { ChildProcess, exec } from 'child_process';
import path from 'path';
import fileUtils from '../fileUtils';
import createLogger from '../../electron/functions/createLogger';
import directoryPaths from '../directoryPaths';

const logger = createLogger('core/SerialFlasher.ts');

const platform = process.platform;

/**
 * 아두이노 플래싱 및 데이터카피(마이크로비트) 기능을 담당한다.
 * Flasher 가 기능을 하기전에 SerialPort 의 동작을 끊어야 한다. (COMPort 점유)
 * 아두이노 계열 펌웨어의 hex 파일은 main/firmwares/core 에 있는 파일을 커맨드라인 실행한다.
 *
 */
class Flasher {
    private flasherProcess?: ChildProcess;

    private _flashESP(
        firmware: IESP32TypeFirmware,
        port: string,
        options: {
            baudRate?: number;
            MCUType?: string;
        }
    ): Promise<any[]> {
        return new Promise((resolve) => {
            const cmd = [
                platform === 'darwin' ? './esptool' : 'esptool.exe',
                ` --port ${port}`,
                ` --baud ${options.baudRate || '115200'}`,
                ' --before default_reset',
                ' --after hard_reset write_flash',
                ` ${firmware.offset}`,
                ` ${firmware.name}.bin`,
            ].join('');

            logger.info(`ESP board firmware requested.\nparameter is ${cmd}`);
            this.flasherProcess = exec(
                cmd,
                {
                    cwd: directoryPaths.firmware(),
                },
                (...args) => {
                    resolve(args);
                }
            );
        });
    }

    private _flashArduino(
        firmware: IFirmwareInfo,
        port: string,
        options: {
            baudRate?: number;
            MCUType?: string;
        }
    ): Promise<any[]> {
        return new Promise((resolve) => {
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
            ].join('');

            logger.info(`arduino board firmware requested.\nparameter is ${cmd}`);

            this.flasherProcess = exec(
                cmd,
                {
                    cwd: directoryPaths.firmware(),
                },
                (...args) => {
                    resolve(args);
                }
            );
        });
    }

    private async _flashCopy(firmware: ICopyTypeFirmware): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const firmwareDirectory = directoryPaths.firmware();
            const destPath = dialog.showOpenDialogSync({
                properties: ['openDirectory'],
            });
            if (!destPath) {
                return reject(['경로 미선택']);
            }

            const targetFirmwarePath = path.join(firmwareDirectory, `${firmware.name}.hex`);
            const destFirmwarePath = path.join(destPath[0], `${firmware.name}.hex`);
            // TODO 파일 없을 시 에러 처리
            logger.info('copy style firmware upload requested');
            logger.info(`${firmwareDirectory} to ${destFirmwarePath}`);
            fileUtils
                .copyFile(targetFirmwarePath, destFirmwarePath)
                .then(async () => {
                    if (firmware.afterDelay) {
                        await new Promise((resolve) => setTimeout(resolve, firmware.afterDelay));
                    }
                    resolve([]);
                })
                .catch((err) => {
                    reject([err]);
                });
        });
    }

    flash(
        firmware: IFirmwareInfo,
        port: string,
        options: {
            baudRate?: number;
            MCUType?: string;
        }
    ): Promise<any[]> {
        if (typeof firmware === 'string') {
            return this._flashArduino(firmware, port, options);
        } else if ((firmware as ICopyTypeFirmware).type === 'copy') {
            return this._flashCopy(firmware as ICopyTypeFirmware);
        } else if ((firmware as IESP32TypeFirmware).type === 'esp32') {
            return this._flashESP(firmware as IESP32TypeFirmware, port, options);
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
