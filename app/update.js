const autoUpdater = require('electron').autoUpdater;
const app = require('electron').app;
const ipcMain = require('electron').ipcMain;
var UPDATE_SERVER_HOST = "localhost:4001";

module.exports = function (window){
    var that = {};
    var version = app.getVersion();

    autoUpdater.addListener("update-available", function(e) {
    	console.log("A new update is available");
        window.webContents.send('update-message', 'update-available');
    });
    autoUpdater.addListener("update-downloaded", function(e, releaseNotes, releaseName, releaseDate, updateURL) {
        console.log("A new update is ready to install", 'Version ${releaseName} is downloaded and will be automatically installed on Quit');
        window.webContents.send('update-message', 'update-downloaded');
    });
    autoUpdater.addListener("error", function(e) {
        console.log('error');
    	console.log(e)
        window.webContents.send('update-message', {'error':'error', 'msg': e.message});
    });
    autoUpdater.addListener("checking-for-update", function(e) {
    	console.log("checking-for-update");
        window.webContents.send('update-message', 'checking-for-update');
    });
    autoUpdater.addListener("update-not-available", function() {
    	console.log("update-not-available");
        window.webContents.send('update-message', 'update-not-available');
    });

    console.log('http://' + UPDATE_SERVER_HOST + '/update/win32/' + version);

    autoUpdater.setFeedURL('http://' + UPDATE_SERVER_HOST + '/update/win32/' + version);

    that.checkForUpdates = function () {
        autoUpdater.checkForUpdates();
    }

    return that;
};