var path = require('path');
console.log(__dirname);
require('electron-compile').init(__dirname, './main', true);