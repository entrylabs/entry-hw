'use strict';

import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import EntryServer from './serverProcessManager';
import WindowManager from './windowManager';
import CommonUtils from './commonUtils';
// functions
import parseCommandLine from './functions/parseCommandLine';
import configInit from './functions/configInitialize';
import registerGlobalShortcut from './functions/registerGlobalShortcut';
import checkUpdate from './functions/checkUpdate';
import MainRouter from '../mainRouter.build';
import createLogger from './functions/createLogger';

const logger = createLogger('electron/index.ts');
global.$ = require('lodash');

let mainWindow: BrowserWindow | undefined = undefined;
let mainRouter: any = null;
let entryServer: any = null;

const argv = process.argv.slice(1);
const commandLineOptions = parseCommandLine(argv) as any;
const configuration = configInit(commandLineOptions.config);
const { roomIds = [] } = configuration;

const roomIdIndex = argv.indexOf('entryhw:');
if (roomIdIndex > -1) {
    const data = CommonUtils.getArgsParseData(argv[roomIdIndex]);
    if (data) {
        logger.info(`roomId ${data} detected`);
        roomIds.push(data);
    }
}

if (!app.requestSingleInstanceLock()) {
    logger.verbose('App is already running');
    app.quit();
    process.exit(0);
} else {
    logger.info('Entry HW started.');
    app.on('window-all-closed', () => {
        app.quit();
    });

    // 어플리케이션을 중복 실행했습니다. 주 어플리케이션 인스턴스를 활성화 합니다.
    app.on('second-instance', (event, argv, workingDirectory) => {
        let parseData: string | undefined = undefined;
        const roomIdIndex = argv.indexOf('entryhw:');
        if (roomIdIndex > -1) {
            parseData = CommonUtils.getArgsParseData(argv[roomIdIndex]);
        }

        if (mainWindow) {
            logger.verbose('[second-instance] mainWindow restored');
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();

            if (mainWindow.webContents && parseData) {
                if (roomIds.indexOf(parseData) === -1) {
                    logger.info(`[second-instance] roomId ${parseData} pushed`);
                    roomIds.push(parseData);
                }
                mainRouter.addRoomId(parseData);
            }
        }
    });

    ipcMain.on('reload', () => {
        logger.info('Entry HW reload.');
        entryServer.close();
        app.relaunch();
        app.exit(0);
    });

    app.commandLine.appendSwitch('enable-experimental-web-platform-features', 'true');
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    app.commandLine.appendSwitch('enable-web-bluetooth');
    app.setAsDefaultProtocolClient('entryhw');
    app.once('ready', () => {
        Menu.setApplicationMenu(null);
        WindowManager.createMainWindow({ debug: commandLineOptions.debug });
        mainWindow = WindowManager.mainWindow;
        WindowManager.createAboutWindow(mainWindow);

        registerGlobalShortcut();
        entryServer = new EntryServer();

        // @ts-ignore
        mainRouter = new MainRouter(mainWindow, entryServer);
    });

    ipcMain.on('hardwareForceClose', () => {
        WindowManager.mainWindowCloseConfirmed = true;
        mainWindow?.close();
    });

    ipcMain.on('showMessageBox', (e, msg) => {
        dialog.showMessageBoxSync({
            type: 'none',
            message: msg,
            detail: msg,
        });
    });

    ipcMain.on('openAboutWindow', () => {
        WindowManager.aboutWindow && WindowManager.aboutWindow.show();
    });

    ipcMain.handle('checkUpdate', async () => await checkUpdate());

    ipcMain.handle('getOpenSourceText', async () => {
        const openSourceFile = path.resolve(__dirname, '..', 'OPENSOURCE.md');
        return await fs.promises.readFile(openSourceFile, 'utf8');
    });
}

process.on('uncaughtException', (error) => {
    const whichButtonClicked = dialog.showMessageBoxSync({
        type: 'error',
        title: 'Unexpected Error',
        message: 'Unexpected Error',
        detail: error.toString(),
        buttons: ['ignore', 'exit'],
    });
    logger.error('Entry HW uncaughtException occurred', error.message, error.stack);
    if (whichButtonClicked === 1) {
        process.exit(-1);
    }
});
