const path = require('path');
const merge = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const base = require('./webpack.base.config');

const preloadDirectoryPath = path.join(__dirname, '..', 'app', 'src', 'preload');

module.exports = merge({
    target: 'electron-preload',
    entry: path.join(preloadDirectoryPath, 'index.ts'),
    output: {
        path: preloadDirectoryPath,
        filename: 'preload.bundle.js',
    },
    node: {
        __dirname: false,
    },
    externals: [
        function(directory, moduleName, callback) {
            if (/\/lang$/.test(directory)) {
                return callback(null, `commonjs ./lang/${moduleName.replace('./', '')}`);
            }
            callback();
        },
    ],
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['*.bundle.js', '*.map'],
        }),
    ],
}, base);
