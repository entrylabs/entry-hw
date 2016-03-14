'use strict';

const electron = require('electron');
const app = electron.app;  // 어플리케이션 기반을 조작 하는 모듈.
const BrowserWindow = electron.BrowserWindow;  // 네이티브 브라우저 창을 만드는 모듈.
const path = require('path');
const Menu     = electron.Menu;
console.log('dasdasdas');
function run(args, done) {
    const updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe")
    log("Spawning `%s` with args `%s`", updateExe, args)
    spawn(updateExe, args, {
        detached: true
    }).on("close", done)
}


var handleStartupEvent = function() {
    if (process.platform !== 'win32') {
        return false;
    }

    const target = path.basename(process.execPath);
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
        case '--squirrel-install':
        case '--squirrel-updated':
            run(['--createShortcut=' + target + ''], app.quit);
          return true;
        case '--squirrel-uninstall':
            run(['--removeShortcut=' + target + ''], app.quit);
            return true;
        case '--squirrel-obsolete':
            app.quit();
            return true;
    }
};

if (handleStartupEvent()) {
    return;
}

var mainWindow = null;
var isClose = true;

app.on('window-all-closed', function() {
    app.quit();
});

var argv = process.argv.slice(1);
var option = { file: null, help: null, version: null, webdriver: null, modules: [] };
for (var i = 0; i < argv.length; i++) {
    if (argv[i] == '--version' || argv[i] == '-v') {
        option.version = true;
        break;
    } else if (argv[i].match(/^--app=/)) {
        option.file = argv[i].split('=')[1];
        break;
    } else if (argv[i] == '--help' || argv[i] == '-h') {
        option.help = true;
        break;
    } else if (argv[i] == '--test-type=webdriver') {
        option.webdriver = true;
    } else if (argv[i] == '--debug' || argv[i] == '-d') {
        option.debug = true;
        continue;
    } else if (argv[i] == '--require' || argv[i] == '-r') {
        option.modules.push(argv[++i]);
        continue;
    } else if (argv[i][0] == '-') {
        continue;
    } else {
        option.file = argv[i];
        break;
    }
}

app.once('ready', function() {

    mainWindow = new BrowserWindow({width: 1024, height: 700});
    mainWindow.loadURL('file:///' + path.join(__dirname, 'index.html'));

    if(option.debug) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});