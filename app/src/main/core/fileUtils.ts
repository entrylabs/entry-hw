import path from 'path';
import fs from 'fs-extra';
import rimraf from 'rimraf';

class FileUtils {
    static copyRecursiveSync(src: string, dest: string) {
        const stats = fs.existsSync(src) && fs.statSync(src);
        const isDirectory = stats && stats.isDirectory();
        if (isDirectory) {
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

    static copyFile(src: string, dest: string) {
        return new Promise(((resolve, reject) => {
            fs.copyFile(src, dest, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }));
    }

    static async moveFileOrDirectory(src: string, dest: string) {
        try {
            const stat = await fs.stat(src);
            if (stat.isFile()) {
                await this.ensureDirectoryExist(dest);
                await fs.move(src, dest, { overwrite: true });
            } else if (stat.isDirectory()) {
                const files = await fs.readdir(src);
                await Promise.all(files.map((file) => this.moveFileOrDirectory(
                    path.join(src, file),
                    path.join(dest, file),
                )));
            }
        } catch (e) {
            console.error(e);
        }
    }

    static async ensureDirectoryExist(dirPath: string) {
        try {
            await fs.ensureDir(dirPath);
        } catch (e) {

        }
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

    static rmdir(dirPath: string) {
        return new Promise((resolve) => {
            rimraf(dirPath, resolve);
        });
    }
}

export default FileUtils;
