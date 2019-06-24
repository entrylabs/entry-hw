const { globalShortcut, webContents } = require('electron');

export default () => {
    let inspectorShortcut = '';
    if (process.platform === 'darwin') {
        inspectorShortcut = 'Command+Alt+i';
    } else {
        inspectorShortcut = 'Control+Shift+i';
    }

    globalShortcut.register(inspectorShortcut, () => {
        const content = webContents.getFocusedWebContents();
        if (content) {
            webContents.getFocusedWebContents().openDevTools();
        }
    });
};
