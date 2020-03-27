const path = require('path');
const merge = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const base = require('./webpack.base.config');

module.exports = merge({
    dependencies: ['mainRouter'],
    target: 'electron-main',
    entry: path.join(__dirname, '..', 'app', 'src', 'main', 'electron', 'index.ts'),
    devtool: 'cheap-module-source-map',
    node: {
        __dirname: false,
    },
    output: {
        path: path.join(__dirname, '..', 'app', 'src'),
        filename: 'index.bundle.js',
    },
    externals: [
        function(requestDirectoryPath, requestModuleName, callback) {
            // 상대경로로 표기된 모듈의 경우는 번들포함, 외에는 전부 commonjs 모듈
            const moduleName = path.basename(requestModuleName);

            if (moduleName === 'mainRouter.build') {
                return callback(null, `commonjs ${requestModuleName.replace('..', './main')}`);
            }

            if (requestModuleName.startsWith('.') || moduleName === 'index.ts') {
                return callback();
            }
            callback(null, `commonjs ${requestModuleName}`);
        },
    ],
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['index.bundle.js', 'index.bundle.js.map'],
        }),
    ],
}, base);
