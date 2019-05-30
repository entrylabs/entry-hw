'use strict';

const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
global.$ = require('lodash');

// classes
const MainRouter = require('./main/mainRouter');
const windowManager = require('./main/utils/windowManager');
const commonUtils = require('./main/utils/commonUtils');

// functions
const configInit = require('./main/utils/functions/configInitialize');
const registerGlobalShortcut = require('./main/utils/functions/registerGlobalShortcut');
const checkUpdate = require('./main/network/checkUpdate');

let mainWindow = null;
let mainRouter = null;

const configuration = configInit();

const { roomIds = [], hardwareVersion } = configuration;
let { hostURI, hostProtocol } = configuration;

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
    app.once('ready', () => {
        windowManager.createMainWindow({ debug: option.debug });
        mainWindow = windowManager.mainWindow;
        windowManager.createAboutWindow(mainWindow);

        registerGlobalShortcut();
        mainRouter = new MainRouter(mainWindow);
    });

    ipcMain.on('hardwareForceClose', () => {
        windowManager.mainWindowCloseConfirmed = true;
        mainWindow.close();
    });

    ipcMain.on('showMessageBox', (e, msg) => {
        dialog.showMessageBox({
            type: 'none',
            message: msg,
            detail: msg,
        });
    });

    ipcMain.on('checkUpdate', (e) => {
        checkUpdate()
            .then((data) => {
                e.sender.send('checkUpdateResult', data);
            })
            .catch((e) => {
                console.error(`checkUpdate error : ${e}`);
            });
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
        windowManager.aboutWindow.show();
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
