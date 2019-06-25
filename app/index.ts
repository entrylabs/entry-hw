'use strict';

import MainRouter from './src/main/mainRouter';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import windowManager from './src/main/utils/browserWindowManager';
import { getArgsParseData, getPaddedVersion } from './src/main/utils/commonUtils';
import parseCommandLine from './src/main/utils/functions/parseCommandLine';
import configInitialize from './src/main/utils/functions/configInitialize';
import registerGlobalShortcut from './src/main/utils/functions/registerGlobalShortcut';
import checkUpdate from './src/main/network/checkUpdate';

let mainWindow: undefined | BrowserWindow = undefined;
let mainRouter: undefined | MainRouter = undefined;

const argv = process.argv.slice(1);
const commandLineOptions = parseCommandLine(argv);
const configuration = configInitialize(commandLineOptions.config);
const { roomIds, hardwareVersion } = configuration;
if (argv.indexOf('entryhw:')) {
    const data = getArgsParseData(argv);
    if (data) {
        roomIds.push(data);
    }
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
} else {
    app.on('window-all-closed', () => {
        app.quit();
    });

    // 어플리케이션을 중복 실행했습니다. 주 어플리케이션 인스턴스를 활성화 합니다.
    app.on('second-instance', (event, argv, workingDirectory) => {
        let parseData = '';
        if (argv.indexOf('entryhw:')) {
            parseData = getArgsParseData(argv);
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
                mainRouter && mainRouter.addRoomId(parseData);
            }
        }
    });

    ipcMain.on('reload', (event: Electron.Event, arg: any) => {
        app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
        app.exit(0);
    });

    app.commandLine.appendSwitch('enable-web-bluetooth', 'true');
    app.commandLine.appendSwitch('enable-experimental-web-platform-features', 'true');
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    app.once('ready', () => {
        windowManager.createMainWindow(commandLineOptions);
        mainWindow = windowManager.mainWindow;
        windowManager.createAboutWindow(mainWindow);

        registerGlobalShortcut();
        mainRouter = new MainRouter(mainWindow as BrowserWindow);
    });

    ipcMain.on('hardwareForceClose', () => {
        windowManager.mainWindowCloseConfirmed = true;
        mainWindow && mainWindow.close();
    });

    ipcMain.on('showMessageBox', (e: Electron.Event, msg: string) => {
        dialog.showMessageBox({
            type: 'none',
            message: msg,
            detail: msg,
        });
    });

    ipcMain.on('checkUpdate', (e: Electron.Event, msg: string) => {
        checkUpdate()
            .then((data) => {
                console.log(`checkUpdate Result: ${JSON.stringify(data || {})}`);
                e.sender.send('checkUpdateResult', data);
            })
            .catch((e) => {
                console.error(`checkUpdate error : ${e}`);
            });
    });

    ipcMain.on('getOpensourceText', (e: Electron.Event) => {
        const opensourceFile = path.resolve(__dirname, 'OPENSOURCE.md');
        fs.readFile(opensourceFile, 'utf8', (err, text) => {
            e.sender.send('getOpensourceText', text);
        });
    });

    ipcMain.on('checkVersion', (e: Electron.Event, lastCheckVersion: any) => {
        const version = getPaddedVersion(hardwareVersion);
        const lastVersion = getPaddedVersion(lastCheckVersion);

        if (!e.sender.isDestroyed()) {
            e.sender.send('checkVersionResult', lastVersion > version);
        }
    });

    ipcMain.on('openAboutWindow', (event: Electron.Event, arg: any) => {
        windowManager.aboutWindow && windowManager.aboutWindow.show();
    });

    let requestLocalDataInterval: undefined | NodeJS.Timeout = undefined;
    ipcMain.on('startRequestLocalData', (event: Electron.Event, duration: number) => {
        requestLocalDataInterval = setInterval(() => {
            if (!event.sender.isDestroyed()) {
                event.sender.send('sendingRequestLocalData');
            }
        }, duration);
    });
    ipcMain.on('stopRequestLocalData', () => {
        requestLocalDataInterval && clearInterval(requestLocalDataInterval);
    });
}
