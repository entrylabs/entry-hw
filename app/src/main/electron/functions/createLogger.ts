import { createLogger, format, transports } from 'winston';
import { app } from 'electron';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, label, printf } = format;

const _logPath = path.join(app.getAppPath(), '..', 'logs');

export const logPath = _logPath;
export default (labelName: string) => {
    const logger = createLogger({
        format: combine(
            label({ label: labelName }),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            printf(({ level, message, label, timestamp }) => `[${label}][${level}][${timestamp}]: ${message}`),
        ),
        transports: [
            new transports.Console(),
        ],
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new DailyRotateFile({
            filename: 'entry-hw-%DATE%.log',
            dirname: _logPath,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
        }));
    }

    return logger;
};
