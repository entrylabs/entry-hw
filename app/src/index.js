'use strict';

const {
    app,
    BrowserWindow,
    globalShortcut,
    ipcMain,
    webContents,
    dialog,
    net,
} = require('electron');
const path = require('path');
const fs = require('fs');
global.$ = require('lodash');

const MainRouter = require('./main/mainRouter');
const configInit = require('./main/utils/functions/configInitialize');
const commonUtils = require('./main/utils/commonUtils');

let mainWindow = null;
let aboutWindow = null;
let mainRouter = null;

const configuration = configInit();

const { roomIds = [], hardwareVersion } = configuration;
let { hostURI, hostProtocol } = configuration;
let isForceClose = false;

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

    aboutWindow.loadURL(`file:///${
        path.resolve(__dirname, 'src', 'renderer', 'views', 'about.html')
        }`);

    aboutWindow.on('closed', () => {
        aboutWindow = null;
    });
}

app.on('window-all-closed', () => {
    app.quit();
});

const argv = process.argv.slice(1);

if (argv.indexOf('entryhw:')) {
    const data = commonUtils.getArgsParseData(argv);
    if (data) {
        roomIds.push(data);
    }
}

const option = {
    file: null,
    help: null,
    version: null,
    webdriver: null,
    modules: [],
};
for (let i = 0; i < argv.length; i++) {
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
            parseData = commonUtils.getArgsParseData(argv);
        }

        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();

            if (mainWindow.webContents) {
                if (roomIds.indexOf(parseData) === -1) {
                    roomIds.push(parseData);
                }
                mainWindow.webContents.send('customArgs', parseData);
                mainRouter.addRoomId(parseData);
            }
        }
    });

    ipcMain.on('reload', (event, arg) => {
        app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
        app.exit(0);
    });

    app.commandLine.appendSwitch('enable-web-bluetooth', true);
    app.commandLine.appendSwitch('enable-experimental-web-platform-features', true);
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    // app.commandLine.appendSwitch('enable-web-bluetooth');
    app.once('ready', () => {
        const language = app.getLocale();

        let title;

        if (language === 'ko') {
            title = '엔트리 하드웨어 v';
        } else {
            title = 'Entry Hardware v';
        }

        mainWindow = new BrowserWindow({
            width: 800,
            height: 670,
            title: title + hardwareVersion,
            webPreferences: {
                backgroundThrottling: false,
            },
        });

        mainWindow.webContents.on(
            'select-bluetooth-device',
            (event, deviceList, callback) => {
                event.preventDefault();
                const result = deviceList.find(
                    (device) => device.deviceName === 'LPF2 Smart Hub 2 I/O',
                );
                if (!result) {
                    callback('A0:E6:F8:1D:FB:E3');
                } else {
                    callback(result.deviceId);
                }
            },
        );

        const mainWindowPath = `file:///${
            path.join(__dirname, 'src', 'renderer', 'views', 'index.html')
            }`;
        mainWindow.loadURL(mainWindowPath);

        if (option.debug) {
            mainWindow.webContents.openDevTools();
        }

        mainWindow.setMenu(null);

        mainWindow.on('close', (e) => {
            if (!isForceClose) {
                e.preventDefault();
                mainWindow.webContents.send('hardwareClose');
            }
        });

        mainWindow.on('closed', () => {
            mainWindow = null;
        });

        let inspectorShortcut = '';
        if (process.platform === 'darwin') {
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
        mainRouter = new MainRouter(mainWindow);
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
                } catch (e) {
                }
                e.sender.send('checkUpdateResult', data);
            });
        });
        request.on('error', (err) => {
        });
        request.setHeader('content-type', 'application/json; charset=utf-8');
        request.write(
            JSON.stringify({
                category: 'hardware',
                version: hardwareVersion,
            }),
        );
        request.end();
    });

    ipcMain.on('getOpensourceText', (e) => {
        const opensourceFile = path.resolve(__dirname, 'OPENSOURCE.md');
        fs.readFile(opensourceFile, 'utf8', (err, text) => {
            e.sender.send('getOpensourceText', text);
        });
    });

    ipcMain.on('checkVersion', (e, lastCheckVersion) => {
        const version = commonUtils.getPaddedVersion(hardwareVersion);
        const lastVersion = commonUtils.getPaddedVersion(lastCheckVersion);

        e.sender.send('checkVersionResult', lastVersion > version);
    });

    ipcMain.on('openAboutWindow', (event, arg) => {
        aboutWindow.show();
    });

    let requestLocalDataInterval = -1;
    ipcMain.on('startRequestLocalData', (event, duration) => {
        requestLocalDataInterval = setInterval(() => {
            if (!event.sender.isDestroyed()) {
                event.sender.send('sendingRequestLocalData');
            }
        }, duration);
    });
    ipcMain.on('stopRequestLocalData', () => {
        clearInterval(requestLocalDataInterval);
    });
}
