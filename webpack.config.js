const main = require('./webpack/webpack.main.config');
const renderer = require('./webpack/webpack.renderer.config');
const preload = require('./webpack/webpack.preload.config');

const usingExternalElectron = process.env.DEPLOY;
const webpackConfigs = [preload, renderer];

if (usingExternalElectron) {
    webpackConfigs.push(main);
}

module.exports = webpackConfigs;
