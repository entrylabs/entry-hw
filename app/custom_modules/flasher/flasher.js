'use strict';
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var platform = process.platform;

var copyRecursiveSync = function(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (exists && isDirectory) {
        if(!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach(function(childItemName) {
            copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
        });
    } else {
        var data = fs.readFileSync(src);
        fs.writeFileSync(dest, data, {
            mode: 0o755
        });
    }
};

var Module = {
    flash : function(firmware, port, baudRate, callBack) {
        var appPath = '';
        var asarIndex = __dirname.indexOf('app.asar');
        if(asarIndex > -1) {
            var asarPath = __dirname.substr(0, asarIndex);
            copyRecursiveSync(__dirname, path.join(asarPath, 'flasher'));
            appPath = asarPath;
        } else {
            appPath = path.join(__dirname, '..');
        }

        var rate = baudRate || '115200';
        var avrName;
        var avrConf;
        var portPrefix;
        switch(platform) {
            case 'darwin': 
                avrName = './avrdude';
                avrConf = './avrdude.conf';
                portPrefix = '';
                break;
            default :
                avrName = 'avrdude.exe';
                avrConf = './avrdude.conf';
                portPrefix = '\\\\.\\';
                break;
        }
        var cmd = [avrName, ' -p m328p -P', portPrefix, port, ' -b', rate, ' -Uflash:w:\"', firmware, '.hex\":i -C', avrConf, ' -carduino -D'];
        
        var flasherProcess = exec(
            cmd.join(''),
            {
                cwd: path.resolve(appPath, 'flasher')
            },
            callBack
        );
         
        flasherProcess.on('exit', function (code) {
            callBack('exit');
            // console.log('child process exited with code ' + code);
        });

        return flasherProcess;
    }
};

module.exports = Module;