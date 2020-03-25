import MQLogger, { StatisticsOptions } from 'mq-logger';
import path from 'path';
import { app } from 'electron';

const _logPath = path.join(app.getPath('documents'), 'entry-hw-logs', 'queue.txt');
let mqLogger: MQLogger | undefined = undefined;

export function initialize(options: Omit<StatisticsOptions, 'cacheDir'>) {
    mqLogger = new MQLogger({ cacheDir: _logPath, ...options });
}

async function send(event: string, ...args: any) {
    if (!mqLogger) {
        throw new Error('please initialize logger');
    }

    await mqLogger.send({ event, ...args, type: 'hardware', timestamp: Date.now() }).catch(console.warn);
}

export const sendStartLog = () => send('start');
export const sendHardwareSelectedLog = (hardwareId: string) => send('selectHardware', { hardwareId });
export const sendUnexpectedErrorLog = (e: Error) => send('error', { error: e });
