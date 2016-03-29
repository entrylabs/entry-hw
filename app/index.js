'use strict';

const electron = require('electron');
const app = electron.app;  // 어플리케이션 기반을 조작 하는 모듈.
const BrowserWindow = electron.BrowserWindow;  // 네이티브 브라우저 창을 만드는 모듈.
const path = require('path');
const fs = require('fs');
const Menu     = electron.Menu;
const packageJson     = require('./package.json');
const ChildProcess = require('child_process'); 
var language;

function spawn(command, args, callback) {
    var error, spawnedProcess, stdout;
    stdout = '';
    try {
        spawnedProcess = ChildProcess.spawn(command, args);
    } catch (_error) {
        error = _error;
        process.nextTick(function() {
            return typeof callback === "function" ? callback(error, stdout) : void 0;
        });
        return;
    }
    spawnedProcess.stdout.on('data', function(data) {
        return stdout += data;
    });
    error = null;
    spawnedProcess.on('error', function(processError) {
        return error != null ? error : error = processError;
    });
    return spawnedProcess.on('close', function(code, signal) {
        if (code !== 0) {
            if (error == null) {
                error = new Error("Command failed: " + (signal != null ? signal : code));
            }
        }
    if (error != null) {
        if (error.code == null) {
            error.code = code;
        }
    }
    if (error != null) {
        if (error.stdout == null) {
            error.stdout = stdout;
        }
    }
    return typeof callback === "function" ? callback(error, stdout) : void 0;
    });
};

var defaultPath = 'HKCU\\Software\\Entry_HW';
var system32Path, regPath, setxPath;

if (process.env.SystemRoot) {
    system32Path = path.join(process.env.SystemRoot, 'System32');
    regPath = path.join(system32Path, 'reg.exe');
    setxPath = path.join(system32Path, 'setx.exe');
} else {
    regPath = 'reg.exe';
    setxPath = 'setx.exe';
}

function spawnReg(args, callback) {
    return spawn(regPath, args, callback);
};

function addToRegistry(args, callback) {
    args.unshift('add');
    args.push('/f');
    return spawnReg(args, callback);
};

function installRegistry() {
    // var args = [defaultPath, '/ve', '/d', 'Open with Entry_HW'];
    // addToRegistry(args, function (a) {
    // });
}

function unInstallRegistry() {

}

var mainWindow = null;
var isClose = true;

function run(command, done) {
    var updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe"); 
    var target = path.basename(process.execPath);
    var child = ChildProcess.spawn(updateExe, [command, target], { detached: true });
    child.on('close', done);
}

function createShortcut(locations, done) {
    var updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe"); 
    var target = path.basename(process.execPath);
    var args = ['--createShortcut', target, '-l', locations];
    var child = ChildProcess.spawn(updateExe, args, { detached: true });
    child.on('close', function () {
        language = app.getLocale();
        if(language === 'ko') {
            var sourcePath = path.resolve(process.env.USERPROFILE, 'Desktop', 'Entry_HW.lnk');
            var destPath = path.resolve(process.env.USERPROFILE, 'Desktop', '엔트리 하드웨어.lnk');
            fs.rename(sourcePath, destPath, function (err) {
                sourcePath = path.resolve(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'EntryLabs', 'Entry_HW.lnk');
                destPath = path.resolve(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'EntryLabs', '엔트리 하드웨어.lnk');
                fs.rename('/tmp/hello', '/tmp/world', function (err) {
                    if(done) {
                        done();
                    }
                });
            });
        }        
    });
}

function removeShortcut(locations, done) {
    var updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe"); 
    var target = path.basename(process.execPath);
    var args = ['--removeShortcut', target, '-l', locations];
    var child = ChildProcess.spawn(updateExe, args, { detached: true });
    child.on('close', done);
}

var handleStartupEvent = function() {
    if (process.platform !== 'win32') {
        return false;
    }

    var defaultLocations = 'Desktop,StartMenu';
    createShortcut(defaultLocations, function () {

    });
    const target = path.basename(process.execPath);
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
        case '--squirrel-install':
        case '--squirrel-updated':
            createShortcut(defaultLocations, app.quit);
            return true;
        case '--squirrel-uninstall':
            removeShortcut(defaultLocations, app.quit);
            return true;
        case '--squirrel-obsolete':
            app.quit();
            return true;
    }
};

if (handleStartupEvent()) {
    return;
}

app.on('window-all-closed', function() {
    app.quit();
});

var argv = process.argv.slice(1);
var option = { file: null, help: null, version: null, webdriver: null, modules: [] };
for (var i = 0; i < argv.length; i++) {
    if (argv[i] == '--version' || argv[i] == '-v') {
        option.version = true;
        break;
    } else if (argv[i].match(/^--app=/)) {
        option.file = argv[i].split('=')[1];
        break;
    } else if (argv[i] == '--help' || argv[i] == '-h') {
        option.help = true;
        break;
    } else if (argv[i] == '--test-type=webdriver') {
        option.webdriver = true;
    } else if (argv[i] == '--debug' || argv[i] == '-d') {
        option.debug = true;
        continue;
    } else if (argv[i] == '--require' || argv[i] == '-r') {
        option.modules.push(argv[++i]);
        continue;
    } else if (argv[i][0] == '-') {
        continue;
    } else {
        option.file = argv[i];
        break;
    }
}


var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
// 어플리케이션을 중복 실행했습니다. 주 어플리케이션 인스턴스를 활성화 합니다.
    if (mainWindow) {
        if (mainWindow.isMinimized()) 
            mainWindow.restore();
        mainWindow.focus();
    }
    return true;
});

if (shouldQuit) {
    app.quit();
    return;
}

app.once('ready', function() {
    language = app.getLocale();

    var title;

    if(language === 'ko') {
        title = '엔트리 하드웨어 v';
    } else {
        title = 'Entry Hardware v'
    }

    mainWindow = new BrowserWindow({
        width: 800, 
        height: 650, 
        resizable: false, 
        title: title + packageJson.version
    });
    
    mainWindow.loadURL('file:///' + path.join(__dirname, 'index.html'));

    if(option.debug) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.setMenu(null);

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});