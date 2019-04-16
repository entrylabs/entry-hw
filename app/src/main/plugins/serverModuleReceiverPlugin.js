const NetworkZipHandleStream = require('../utils/networkZipHandleStream');
const path = require('path');

module.exports = (req, res) => {
    if (req.url === '/module' && req.method === 'POST') {
        const networkZipHandleStream = new NetworkZipHandleStream(path.resolve('app', 'modules'));
        networkZipHandleStream.on('end', () => {
            res.writeHead(200);
            res.end();
        });
        networkZipHandleStream.on('error', (e) => {
            console.error(e);
            res.writeHead(500);
            res.end();
        });

        req.pipe(networkZipHandleStream);
    } else {
        res.writeHead(200);
        res.write('welcome to entry hardware! please visit https://playentry.org/');
        res.end();
    }
};

