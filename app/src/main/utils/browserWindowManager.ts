import MainRouter from '../mainRouter';

import { app, BrowserWindow } from 'electron';
import path from 'path';

const viewDirectoryPath = path.resolve(__dirname, '..', '..', 'renderer', 'views');
export default new class {
    aboutWindow ?: BrowserWindow;
    mainWindow ?: BrowserWindow;
    mainRouter ?: MainRouter;
    mainWindowCloseConfirmed: boolean;

    constructor() {
        this.aboutWindow = undefined;
        this.mainWindow = undefined;
        this.mainRouter = undefined;

        /*
        하드웨어 메인 윈도우는 하드웨어 연결중인 경우는 꺼지지 않도록 기획되었다.
        그러므로 close native event 가 발생했을 때, 렌더러에 다시 물어본 후
        해당 값을 세팅 한 뒤 다시 close 를 호출 하는 식으로 종료한다.
         */
        this.mainWindowCloseConfirmed = false;
    }

    createAboutWindow(parent?: BrowserWindow) {
        this.aboutWindow = new BrowserWindow({
            parent,
            width: 380,
            height: 290,
            resizable: false,
            movable: false,
            center: true,
            frame: false,
            modal: true,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                preload: path.join(viewDirectoryPath, '..', 'about_preload.js'),
            },
        });

        this.aboutWindow.loadURL(`file:///${path.resolve(viewDirectoryPath, 'about.html')}`);

        this.aboutWindow.on('closed', () => {
            this.aboutWindow = undefined;
        });
    }

    createMainWindow({ debug }: CommandLineOptions) {
        const language = app.getLocale();
        const title = language === 'ko' ? '엔트리 하드웨어 v' : 'Entry Hardware v';
        const { hardwareVersion } = global.sharedObject;

        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 670,
            title: title + hardwareVersion,
            webPreferences: {
                backgroundThrottling: false,
                nodeIntegration: false,
                preload: path.join(viewDirectoryPath, '..', 'preload.js'),
            },
        });

        this.mainWindow.webContents.on(
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

        this.mainWindow.loadURL(`file:///${path.resolve(viewDirectoryPath, 'index.html')}`);

        if (debug) {
            this.mainWindow.webContents.openDevTools();
        }

        this.mainWindow.setMenu(null);

        this.mainWindow.on('close', (e) => {
            if (!this.mainWindowCloseConfirmed) {
                e.preventDefault();
                this.mainWindow!.webContents.send('hardwareCloseConfirm');
            }
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = undefined;
        });
    }
}();
