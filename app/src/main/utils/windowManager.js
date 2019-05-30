const { BrowserWindow } = require('electron');
const path = require('path');

module.exports = new class {
    constructor() {
        this.aboutWindow = undefined;
        this.mainWindow = undefined;
        this.mainRouter = undefined;
    }

    createAboutWindow(parent) {
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
        });

        this.aboutWindow.loadURL(`file:///${
            path.resolve(__dirname, '..', '..', 'renderer', 'views', 'about.html')
            }`);

        this.aboutWindow.on('closed', () => {
            this.aboutWindow = undefined;
        });

        return this.aboutWindow;
    }

    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 670,
            title: title + hardwareVersion,
            webPreferences: {
                backgroundThrottling: false,
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

        const mainWindowPath = `file:///${
            path.join(__dirname, 'src', 'renderer', 'views', 'index.html')
            }`;
        this.mainWindow.loadURL(mainWindowPath);

        if (option.debug) {
            this.mainWindow.webContents.openDevTools();
        }

        this.mainWindow.setMenu(null);

        this.mainWindow.on('close', (e) => {
            if (!isForceClose) {
                e.preventDefault();
                this.mainWindow.webContents.send('hardwareCloseConfirm');
            }
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = undefined;
        });
    }
}();
