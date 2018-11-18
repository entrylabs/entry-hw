var path = require('path');
var fs = require('fs');

class Utils {
    static copyFile(src, dest, option) {
        return new Promise(function (resolve, reject) {
            var crs = fs.createReadStream(src);
            var cws = fs.createWriteStream(dest, option);
            new Promise(function(res, rej) {
                crs.on('error', rej);
                cws.on('error', rej);
                cws.on('finish', res);
                crs.pipe(cws);
            }).then(resolve).catch(function(err) {
                crs.destroy();
                cws.end();
                reject(err);
            });
        });
    }

    static mkdir(target) {
        return new Promise(function (resolve, reject) {
            fs.stat(target, function (err, stats) {
                if (err) {
                    if (err.code === 'ENOENT') {
                        var parser = path.parse(target);
                        return this.mkdir(parser.dir).then(function () {
                            fs.mkdir(target, function (err) {
                                if (err) {
                                    if(err.code === 'EEXIST') {
                                        return resolve('EXIST');
                                    }
                                    return reject(err);
                                }
                                resolve(target);
                            });
                        }).catch(function (err) {
                            reject(err);
                        });
                    } else {
                        reject(err);
                    }
                } else {
                    resolve('EXIST');
                }
            }.bind(this));
        }.bind(this));
    }
}

module.exports = Utils;