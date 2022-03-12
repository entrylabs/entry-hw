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
import isValidAsarFile from './modifyValidator';

const logger = createLogger('electron/index.ts');

let mainWindow: BrowserWindow | undefined = undefined;
let mainRouter: any = null;
let entryServer: any = null;
let autoOpenHardwareId = '';
let roomIds: string[] = [];

if (!app.requestSingleInstanceLock()) {
    logger.verbose('App is already running');
    app.quit();
    process.exit(0);
} else {
    logger.info('Entry HW started.');
    app.on('window-all-closed', () => {
        app.quit();
    });

    app.on('open-url', (event, url) => {
        const { openHardwareId } = CommonUtils.getArgsParseData(url);
        setTimeout(async () => {
            while (!mainRouter) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
            mainRouter.selectHardware(openHardwareId);
        }, 1000);
    });

    // 어플리케이션을 중복 실행했습니다. 주 어플리케이션 인스턴스를 활성화 합니다.
    app.on('second-instance', (event, argv, workingDirectory) => {
        let parseData: { roomId: string; openHardwareId: string } = {
            roomId: '',
            openHardwareId: '',
        };
        const entryHwCustomSchema = argv.find((arg) => arg.indexOf('entryhw:') > -1);
        if (entryHwCustomSchema) {
            parseData = CommonUtils.getArgsParseData(entryHwCustomSchema);
        }

        if (mainWindow) {
            logger.verbose('[second-instance] mainWindow restored');
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();

            if (mainWindow.webContents && parseData) {
                const { roomId, openHardwareId } = parseData;
                if (roomIds.indexOf(roomId) === -1) {
                    logger.info(`[second-instance] roomId ${roomId} pushed`);
                    roomIds.push(roomId);
                }
                mainRouter.addRoomId(roomId);

                if (openHardwareId) {
                    mainRouter.selectHardware(openHardwareId);
                }
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
        const argv = process.argv.slice(1);
        const commandLineOptions = parseCommandLine(argv);
        const configuration = configInit(commandLineOptions);
        const { roomIds: configRoomIds } = configuration;
        roomIds = configRoomIds || [];

        const customSchemaArgvIndex = argv.indexOf('entryhw:');
        if (customSchemaArgvIndex > -1) {
            const { roomId, openHardwareId } = CommonUtils.getArgsParseData(
                argv[customSchemaArgvIndex]
            );
            if (roomId) {
                logger.info(`roomId ${roomId} detected`);
                roomIds.push(roomId);
            }

            if (openHardwareId) {
                autoOpenHardwareId = openHardwareId;
            }
        }

        WindowManager.createMainWindow({ debug: commandLineOptions.debug });
        mainWindow = WindowManager.mainWindow;
        WindowManager.createAboutWindow(mainWindow);

        registerGlobalShortcut();
        entryServer = new EntryServer();

        // @ts-ignore
        mainRouter = new MainRouter(mainWindow, entryServer, {
            rootAppPath:
                process.env.NODE_ENV === 'production' && path.join(__dirname, '..', '..', '..'),
        });

        if (autoOpenHardwareId) {
            setTimeout(() => {
                mainRouter.selectHardware(autoOpenHardwareId);
            }, 1000);
        }

        setTimeout(async () => {
            try {
                const result = await isValidAsarFile();
                if (!result) {
                    mainWindow?.webContents.send('invalidAsarFile');
                }
            } catch (e) {
                console.log(e);
                mainWindow?.webContents.send('invalidAsarFile');
            }
        }, 2000);
    });

    ipcMain.on('hardwareForceClose', () => {
        WindowManager.mainWindowCloseConfirmed = true;
        mainWindow?.close();
    });

    ipcMain.on('closeAboutWindow', () => {
        WindowManager.aboutWindow && WindowManager.aboutWindow.hide();
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
