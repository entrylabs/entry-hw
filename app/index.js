'use strict';

const electron = require('electron');
const {
    app,
    BrowserWindow,
    Menu,
    globalShortcut,
    ipcMain,
    webContents,
    dialog,
    net,
} = electron;
const path = require('path');
const fs = require('fs');
const packageJson = require('../package.json');
const ChildProcess = require('child_process');
let mainWindow = null;
let aboutWindow = null;
var isClose = true;
var roomId = [];
let isForceClose = false;
let hostURI = 'playentry.org';
let hostProtocol = 'https:';

global.sharedObject = {
    appName: 'hardware',
};

console.fslog = function(text) {
    var log_path = path.join(__dirname, '..', '..');
    if (!fs.existsSync(log_path)) {
        fs.mkdirSync(log_path);
    }
    if (!fs.existsSync(path.join(log_path, 'debug.log'))) {
        fs.writeFileSync(path.join(log_path, 'debug.log'), '', 'utf8');
    }
    var data = fs.readFileSync(path.join(log_path, 'debug.log'), 'utf8');
    data += '\n\r' + new Date() + ' : ' + text;
    fs.writeFileSync(path.join(log_path, 'debug.log'), data, 'utf8');
};

function lpad(str, len) {
    var strLen = str.length;
    if (strLen < len) {
        for (var i=0; i<len-strLen; i++) {
            str = "0" + str;
        }
    }
    return String(str);
};

function getPaddedVersion(version) {
    if(!version) {
        return '';
    }
    version = String(version);

    var padded = [];
    var splitVersion = version.split('.');
    splitVersion.forEach(function (item) {
        padded.push(lpad(item, 4));
    });

    return padded.join('.');
}

function createAboutWindow(mainWindow) {
    aboutWindow = new BrowserWindow({
        parent: mainWindow,
        width: 380,
        height: 290,
        resizable: false,
        movable: false,
        center: true,
        frame: false,
        modal: true,
        show: false,
    });

    aboutWindow.loadURL('file:///' + path.resolve(__dirname, 'src', 'views', 'about.html'));

    aboutWindow.on('closed', ()=> {
        aboutWindow = null;
    });
}

function getArgsParseData(argv) {
    var regexRoom = /roomId:(.*)/;
    var arrRoom = regexRoom.exec(argv) || ['', ''];
    var roomId = arrRoom[1];

    if (roomId === 'undefined') {
        roomId = '';
    }

    return roomId.replace(/\//g, '');
}

app.on('window-all-closed', function() {
    app.quit();
});

var argv = process.argv.slice(1);

if (argv.indexOf('entryhw:')) {
    var data = getArgsParseData(argv);
    if (data) {
        roomId.push(data);
    }
}

var option = {
    file: null,
    help: null,
    version: null,
    webdriver: null,
    modules: [],
};
for (var i = 0; i < argv.length; i++) {
    if (argv[i] == '--version' || argv[i] == '-v') {
        option.version = true;
        break;
    } else if (argv[i].match(/^--app=/)) {
        option.file = argv[i].split('=')[1];
        break;
    } else if (argv[i] == '--debug' || argv[i] == '-d') {
        option.debug = true;
        continue;
    } else if (argv[i].match(/^--host=/) || argv[i].match(/^-h=/)) {
        hostURI = argv[i].split('=')[1];
        continue;
    } else if (argv[i].match(/^--protocol=/) || argv[i].match(/^-p=/)) {
        hostProtocol = argv[i].split('=')[1];
        continue;
    } else if (argv[i][0] == '-') {
        continue;
    } else {
        option.file = argv[i];
        break;
    }
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
} else {
    // 어플리케이션을 중복 실행했습니다. 주 어플리케이션 인스턴스를 활성화 합니다.
    app.on('second-instance', (event, argv, workingDirectory) => {
        let parseData = {};
        if (argv.indexOf('entryhw:')) {
            parseData = getArgsParseData(argv);
        }

        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            if (mainWindow.webContents) {
                if (roomId.indexOf(parseData) === -1) {
                    roomId.push(parseData);
                }
                mainWindow.webContents.send('customArgs', parseData);
            }
        }
    });

    ipcMain.on('reload', function(event, arg) {
        app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
        app.exit(0);
    });

    ipcMain.on('roomId', function(event, arg) {
        event.returnValue = roomId;
    });

    ipcMain.on('version', function(event, arg) {
        event.returnValue = packageJson.version;
    });

    ipcMain.on('serverMode', function(event, mode) {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('serverMode', mode);
        }
    });

    app.commandLine.appendSwitch('enable-web-bluetooth', true);
    app.commandLine.appendSwitch('enable-experimental-web-platform-features', true);
    // app.commandLine.appendSwitch('enable-web-bluetooth');
    app.once('ready', function() {
        let language = app.getLocale();

        let title;

        if (language === 'ko') {
            title = '엔트리 하드웨어 v';
        } else {
            title = 'Entry Hardware v';
        }

        mainWindow = new BrowserWindow({
            width: 800,
            height: 670,
            title: title + packageJson.version,
            webPreferences: {
                backgroundThrottling: false,
            },
        });

        mainWindow.webContents.on(
            'select-bluetooth-device',
            (event, deviceList, callback) => {
                event.preventDefault();
                let result = deviceList.find((device) => {
                    return device.deviceName === 'LPF2 Smart Hub 2 I/O';
                });
                if (!result) {
                    callback('A0:E6:F8:1D:FB:E3');
                } else {
                    callback(result.deviceId);
                }
            }
        );

        mainWindow.loadURL('file:///' + path.join(__dirname, 'index.html'));

        if (option.debug) {
            mainWindow.webContents.openDevTools();
        }

        mainWindow.setMenu(null);

        mainWindow.on('close', function(e) {
            if (!isForceClose) {
                e.preventDefault();
                mainWindow.webContents.send('hardwareClose');
            }
        });

        mainWindow.on('closed', function() {
            mainWindow = null;
        });

        let inspectorShortcut = '';
        if (process.platform == 'darwin') {
            inspectorShortcut = 'Command+Alt+i';
        } else {
            inspectorShortcut = 'Control+Shift+i';
        }

        globalShortcut.register(inspectorShortcut, (e) => {
            const content = webContents.getFocusedWebContents();
            if (content) {
                webContents.getFocusedWebContents().openDevTools();
            }
        });

        createAboutWindow(mainWindow);
    });

    ipcMain.on('hardwareForceClose', () => {
        isForceClose = true;
        mainWindow.close();
    });

    ipcMain.on('showMessageBox', (e, msg) => {
        dialog.showMessageBox({
            type: 'none',
            message: msg,
            detail: msg,
        });
    });

    ipcMain.on('checkUpdate', (e, msg) => {
        const request = net.request({
            method: 'POST',
            host: hostURI,
            protocol: hostProtocol,
            path: '/api/checkVersion',
        });
        let body = '';
        request.on('response', (res) => {
            res.on('data', (chunk) => {
                body += chunk.toString();
            });
            res.on('end', () => {
                let data = {};
                try {
                    data = JSON.parse(body);
                } catch (e) {}
                e.sender.send('checkUpdateResult', data);
            });
        });
        request.on('error', (err) => {
        });
        request.setHeader('content-type', 'application/json; charset=utf-8');
        request.write(
            JSON.stringify({
                category: 'hardware',
                version: packageJson.version,
            })
        );
        request.end();
    });

    ipcMain.on('checkVersion', (e, lastCheckVersion) => {
        const version = getPaddedVersion(packageJson.version);
        const lastVersion = getPaddedVersion(lastCheckVersion);

        e.sender.send('checkVersionResult', lastVersion > version);
    });

    ipcMain.on('openAboutWindow', function(event, arg) {
        aboutWindow.show();
    });

    ipcMain.on('writeLog', function(event, arg) {
        console.fslog(arg);
    });

    let requestLocalDataInterval = -1;
    ipcMain.on('startRequestLocalData', function(event, duration) {
        requestLocalDataInterval = setInterval(() => {
            event.sender.send('sendingRequestLocalData');
        }, duration);
    });
    ipcMain.on('stopRequestLocalData', function() {
        clearInterval(requestLocalDataInterval);
    });
}
