const path = require('path');
const merge = require('webpack-merge');
const base = require('./webpack.base.config');

const preloadDirectoryPath = path.join(__dirname, '..', 'app', 'src', 'preload');

module.exports = merge({
    target: 'electron-preload',
    entry: ['babel-polyfill', path.join(preloadDirectoryPath, 'index.js')],
    output: {
        path: preloadDirectoryPath,
        filename: 'preload.bundle.js',
    },
    externals: [
        function(directory, moduleName, callback) {
            if (/\/lang$/.test(directory)) {
                return callback(null, `commonjs ./lang/${moduleName.replace('./', '')}`);
            }
            callback();
        },
    ],
}, base);
