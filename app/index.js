'use strict';

const electron = require('electron');
const {app, BrowserWindow, Menu, globalShortcut, ipcMain} = electron;
const path = require('path');
const fs = require('fs');
const packageJson     = require('./package.json');
const ChildProcess = require('child_process');
var mainWindow = null;
var isClose = true;
var clientId = '';

console.fslog = function (text) {    
    var log_path = path.join(__dirname, '..');
    if(!fs.existsSync(log_path)) {
        fs.mkdirSync(log_path);
    }
    if(!fs.existsSync(path.join(log_path, 'debug.log'))) {
        fs.writeFileSync(path.join(log_path, 'debug.log'), '', 'utf8');
    }
    var data = fs.readFileSync(path.join(log_path, 'debug.log'), 'utf8');
    data += '\n\r' + new Date() + ' : ' + text;
    fs.writeFileSync(path.join(log_path, 'debug.log'), data, 'utf8');
};

app.on('window-all-closed', function() {
    app.quit();
});

var argv = process.argv.slice(1);
console.fslog(argv);

if(argv.indexOf('entryhw:')) {
    var regexClient = /clientId:(.*)\//;
    var arrClient = regexClient.exec(argv) || ['', ''];
    clientId = arrClient[1];
    if(clientId === 'undefined') {
        clientId = '';
    }
}

var option = { file: null, help: null, version: null, webdriver: null, modules: [] };
for (var i = 0; i < argv.length; i++) {
    console.fslog(argv[i]);
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

// 어플리케이션을 중복 실행했습니다. 주 어플리케이션 인스턴스를 활성화 합니다.
var shouldQuit = app.makeSingleInstance(function(argv, workingDirectory) {
    if(argv.indexOf('entryhw:')) {
        var regexClient = /clientId:(.*)\//;
        var arrClient = regexClient.exec(argv) || ['', ''];
        clientId = arrClient[1];
        if(clientId === 'undefined') {
            clientId = '';
        }
    }
    
    if (mainWindow) {
        if (mainWindow.isMinimized()) 
            mainWindow.restore();
        mainWindow.focus();

        if(mainWindow.webContents) {
            console.fslog('2');
            console.fslog(clientId);
            mainWindow.webContents.send('clientId', clientId);
        }
    }

    return true;
});

if (shouldQuit) {
    app.quit();
}

ipcMain.on('reload', function(event, arg) {
    mainWindow.reload(true);
});

ipcMain.on('clientId', function(event, arg) {
    event.returnValue = clientId;
});

app.once('ready', function() {
    let language = app.getLocale();

    let title;

    if(language === 'ko') {
        title = '엔트리 하드웨어 v';
    } else {
        title = 'Entry Hardware v'
    }

    mainWindow = new BrowserWindow({
        width: 800, 
        height: 650, 
        title: title + packageJson.version,
        webPreferences: {
            backgroundThrottling: false
        }
    });

    mainWindow.loadURL('file:///' + path.join(__dirname, 'index.html'));

    if(option.debug) {
    }
    mainWindow.webContents.openDevTools();

    mainWindow.setMenu(null);

    mainWindow.on('closed', function() {
        mainWindow = null;
    });

    let inspectorShortcut = '';
    if(process.platform == 'darwin') {
        inspectorShortcut = 'Command+Alt+i';
    } else {
        inspectorShortcut = 'Control+Shift+i';
    }
    globalShortcut.register(inspectorShortcut, () => {
        mainWindow.webContents.openDevTools();
    });
});