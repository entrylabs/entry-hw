import path from 'path';
import fs from 'fs';

type WriteStreamOptions = string | {
    flags?: string;
    encoding?: string;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    start?: number;
}

class FileUtils {
    static copyRecursiveSync(src: string, dest: string) {
        const exists = fs.existsSync(src);
        if (exists && fs.statSync(src).isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            fs.readdirSync(src).forEach((childItemName) => {
                FileUtils.copyRecursiveSync(path.join(src, childItemName),
                    path.join(dest, childItemName));
            });
        } else {
            const data = fs.readFileSync(src);
            fs.writeFileSync(dest, data, {
                mode: 0o755,
            });
        }
    };

    static copyFile(src: string, dest: string, option?: WriteStreamOptions) {
        return new Promise(((resolve, reject) => {
            const crs = fs.createReadStream(src);
            const cws = fs.createWriteStream(dest, option);
            new Promise(((res, rej) => {
                crs.on('error', rej);
                cws.on('error', rej);
                cws.on('finish', res);
                crs.pipe(cws);
            })).then(resolve).catch((err) => {
                crs.destroy();
                cws.end();
                reject(err);
            });
        }));
    }

    static mkdir(target: string) {
        return new Promise(((resolve, reject) => {
            fs.stat(target, (err, stats) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        const parser = path.parse(target);
                        return this.mkdir(parser.dir).then(() => {
                            fs.mkdir(target, (err) => {
                                if (err) {
                                    if (err.code === 'EEXIST') {
                                        return resolve('EXIST');
                                    }
                                    return reject(err);
                                }
                                resolve(target);
                            });
                        }).catch((err) => {
                            reject(err);
                        });
                    } else {
                        reject(err);
                    }
                } else {
                    resolve('EXIST');
                }
            });
        }));
    }
}

module.exports = FileUtils;
