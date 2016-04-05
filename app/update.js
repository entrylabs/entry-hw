const autoUpdater = require('electron').autoUpdater;
const app = require('electron').app;
const ipcMain = require('electron').ipcMain;
const packageJson     = require('./package.json');
const UPDATE_SERVER_HOST = packageJson['updateServer'];

module.exports = function (window){
    var that = {};
    var version = app.getVersion();

    autoUpdater.addListener("update-available", function(e) {
    	// console.log("A new update is available");
        window.webContents.send('update-message', {type:'update-available'});
    });
    autoUpdater.addListener("update-downloaded", function(e, releaseNotes, releaseName, releaseDate, updateURL) {
        // console.log("A new update is ready to install", 'Version ${releaseName} is downloaded and will be automatically installed on Quit');
        var rerutnMsg = {
            type:'update-downloaded',
            releaseNotes : releaseNotes,
            releaseName : releaseName,
            releaseDate : releaseDate,
            updateURL : updateURL
        }
        window.webContents.send('update-message',  rerutnMsg);
    });
    autoUpdater.addListener("error", function(e) {
        window.webContents.send('update-message', {type:'error', 'msg': e.message});
    });
    autoUpdater.addListener("checking-for-update", function(e) {
    	// console.log("checking-for-update");
        window.webContents.send('update-message', {type:'checking-for-update'});
    });
    autoUpdater.addListener("update-not-available", function() {
    	// console.log("update-not-available");
        window.webContents.send('update-message', {type:'update-not-available'});
    });

    autoUpdater.setFeedURL('http://' + UPDATE_SERVER_HOST + '/update/win32/' + version);

    that.checkForUpdates = function () {
        autoUpdater.checkForUpdates();
    }

    that.quitAndInstall = function () {
        autoUpdater.quitAndInstall();
    }

    ipcMain.on('entry-update', function (message) {
        if(message.type === 'update-start') {
            autoUpdater.quitAndInstall();
        }
    });

    return that;
};