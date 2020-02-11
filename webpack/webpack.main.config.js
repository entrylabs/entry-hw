const path = require('path');
const merge = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const base = require('./webpack.base.config');

const mainDirectoryPath = path.join(__dirname, '..', 'app', 'src', 'main');

// webpack 에 포함하지 않을 디렉토리.
// 해당 디렉토리 안에 있는 모든 파일들은 commonjs 로서 로드하고, full path 를 그대로 가져간다.
const commonjsDirectories = [
    path.join(__dirname, '..', 'app', 'modules'),
    path.join(__dirname, '..', 'app', 'drivers'),
    path.join(__dirname, '..', 'app', 'firmwares'),
];

// webpack 에 포함하지 않을 모듈
// 해당 모듈명으로 시작하는 모든 required module 은 commonjs 형태로 로드하는 external module 이 된다.
const commonjsModules = [
    '@serialport/',
    'node-hid',
];

module.exports = merge({
    target: 'electron-main',
    entry: path.join(mainDirectoryPath, 'mainRouter.ts'),
    devtool: 'cheap-module-source-map',
    node: {
        __dirname: false,
    },
    output: {
        path: mainDirectoryPath,
        filename: 'mainRouter.build.js',
        library: 'mainRouter',
        libraryTarget: 'umd',
    },
    externals: [
        function(requestDirectoryPath, requestModuleName, callback) {
            if (commonjsDirectories.some((directory) => requestDirectoryPath === directory)) {
                return callback(
                    null,
                    `commonjs ${requestModuleName.replace('./', `./../../${path.basename(requestDirectoryPath)}/`)}`,
                );
            }

            if (commonjsModules.some((moduleName) => requestModuleName.startsWith(moduleName))) {
                return callback(null, `commonjs ${requestModuleName}`);
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
