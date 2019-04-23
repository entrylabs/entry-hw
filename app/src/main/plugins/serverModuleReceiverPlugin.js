const NetworkZipHandleStream = require('../utils/networkZipHandleStream');
const path = require('path');
const fs = require('fs');
/**
 * POST /module 위치로 파일전송이 있는 경우,
 * @param req
 * @param res
 * @param mainRouter
 */
module.exports = (req, res, mainRouter) => {
    if (req.url === '/module' && req.method.toLowerCase() === 'post') {
        const moduleDirPath = path.resolve('app', 'modules');
        const zipStream = new NetworkZipHandleStream(moduleDirPath);
        zipStream.on('done', (fileList) => {
            const configFile = fileList.find((fileName) => fileName.match(/\.json$/));
            if (configFile) {
                fs.readFile(path.join(moduleDirPath, configFile), (err, file) => {
                    if (err) {
                        console.error(err);
                    } else {
                        mainRouter.startScan(JSON.parse(file));
                        res.writeHead(200);
                    }
                    res.end();
                });
            } else {
                res.writeHead(400);
                res.write('configuration file not found');
                res.end();
            }
        });
        zipStream.on('error', (e) => {
            console.error(e);
            res.write(e.message);
            res.writeHead(500);
            res.end();
        });

        req.pipe(zipStream);
    } else {
        res.writeHead(200);
        res.write('welcome to entry hardware! please visit https://playentry.org/');
        res.end();
    }
};

