(function() {
    'use strict';

    var VERSION = 1.1;

    // initialize options
    var options = {};
    var viewMode = 'main';
    var firmwareCount = 0;
    var flasherProcess;

    var os = process.platform + '-' + (isOSWin64() ? 'x64' : process.arch);
    var driverDefaultPath;

    // language
    var translator = require('./custom_modules/translator');
    var lang = translator.getLanguage();

    // logger
    var logger = {
        v: function(str) {
            console.log(str);
        },
        i: function(str) {
            console.info('%c' + str, 'color: dodgerblue');
        },
        w: function(str) {
            console.warn('%c' + str, 'color: orange');
        },
        e: function(str) {
            console.error('%c' + str, 'color: red');
        }
    };
    require('./custom_modules/logger').set(logger);

    // server
    var server = require('./custom_modules/entry');
    server.open(logger);

    // router
    var router = require('./custom_modules/router').init(server);
    window.router = router;

    // flasher
    var flasher = require('./custom_modules/flasher');

    $('html').addClass(process.platform);
    // ui & control
    $('.alertMsg .alertMsg1').text(translator.translate('If unexpected problem occurs while operating,'));
    $('.alertMsg .alertMsg2').text(translator.translate('contact the hardware company to resolve the problem.'));
    $('#errorAlert .comment').text(translator.translate('* Entry Labs is not responsible for the extension program and hardware products on this site.'));


    $('#select_port_box .title span').text(translator.translate('Select'));
    $('#select_port_box .description').text(translator.translate('Select the COM PORT to connect'));
    $('#select_port_box #btn_select_port_cancel').text(translator.translate('Cancel'));
    $('#select_port_box #btn_select_port').text(translator.translate('Connect'));

    $('#reference .emailTitle').text(translator.translate('E-Mail : '));
    $('#reference .urlTitle').text(translator.translate('WebSite : '));

    $('#firmware').text(translator.translate('Install Firmware'));
    $('#other-robot .text').text(translator.translate('Connect Other Hardware'));
    $('#entry .text').text(translator.translate('Show Entry Web Page'));

    $('#driverButtonSet').on('click', 'button', function() {
        if (!driverDefaultPath) {
            var sourcePath = path.join(__dirname, 'drivers');
            if (__dirname.indexOf('.asar') >= 0) {
                driverDefaultPath = path.join(__dirname, '..', 'drivers');
                if (!fs.existsSync(driverDefaultPath)) {
                    copyRecursiveSync(sourcePath, driverDefaultPath);
                }
            } else {
                driverDefaultPath = sourcePath;
            }
        }
        shell.openItem(path.resolve(driverDefaultPath, this.driverPath));
    });

    $('#firmwareButtonSet').on('click', 'button', function() {
        ui.flashFirmware(this.firmware, this.config);
    });

    var copyRecursiveSync = function(src, dest) {
        var exists = fs.existsSync(src);
        var stats = exists && fs.statSync(src);
        var isDirectory = exists && stats.isDirectory();
        if (exists && isDirectory) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            fs.readdirSync(src).forEach(function(childItemName) {
                copyRecursiveSync(path.join(src, childItemName),
                    path.join(dest, childItemName));
            });
        } else {
            var data = fs.readFileSync(src);
            fs.writeFileSync(dest, data);
        }
    };

    var ui = {
        countRobot: 0,
        showRobotList: function() {
            viewMode = 'main';
            if(flasherProcess) {
                flasherProcess.kill();
                flasherProcess = undefined;
            }
            $('#alert').stop().clearQueue();
            router.close();
            router.stopScan();
            delete window.currentConfig;
            $('#title').text(translator.translate('Select hardware'));
            $('#hwList').show();
            $('#hwPanel').css('display', 'none');
            ui.showIeGuide();
            this.hideAlert();
            $('#back.navigate_button').removeClass('active');
        },
        showConnecting: function() {
            $('#title').text(translator.translate('hardware > connecting'));
            $('#hwList').hide();
            $('#hwPanel').css('display', 'flex');
            ui.hideIeGuide();
            this.showAlert(translator.translate('Connecting to hardware device.'));
        },
        showConnected: function() {
            $('#title').text(translator.translate('hardware > connected'));
            $('#hwList').hide();
            $('#hwPanel').css('display', 'flex');
            ui.hideIeGuide();
            this.showAlert(translator.translate('Connected to hardware device.'), 2000);
        },
        showDisconnected: function() {
            $('#title').text(translator.translate('hardware > disconnected'));
            $('#hwList').hide();
            $('#hwPanel').css('display', 'flex');
            ui.hideIeGuide();
            this.showAlert(translator.translate('Hardware device is disconnected. Please restart this program.'));
        },
        showAlert: function(message, duration) {
            if (!$('#hwList').is(':visible')) {
                $('#alert').removeClass('error');
                $('#alert').text(message);

                $('#alert').css({
                    height: '0px'
                });
                $('#alert').stop().animate({
                    height: '35px'
                });
                if (duration) {
                    setTimeout(function() {
                        $('#alert').stop().animate({
                            height: '0px'
                        });
                    }, duration);
                }
            }
        },
        showError: function(message, duration) {
            if (!$('#hwList').is(':visible')) {
                $('#alert').addClass('error');
                $('#alert').text(message);

                $('#alert').css({
                    height: '0px'
                });
                $('#alert').stop().animate({
                    height: '35px'
                });
                if (duration) {
                    setTimeout(function() {
                        $('#alert').stop().animate({
                            height: '0px'
                        });
                    }, duration);
                }
            }
        },
        hideAlert: function(message) {
            $('#alert').stop(true, true).animate({
                height: '0px'
            });
        },
        addRobot: function(config) {
            ui.showRobotList();
            var name, platform;
            if (config.name) {
                name = config.name[lang] || config.name['en'];
            }            

            if ((config.platform && config.platform.indexOf(process.platform) === -1) || !config.platform) {
                return;
            }

            $('#hwList').append(
                '<div class="hardwareType" id="' + config.id + '">' +
                '<img class="hwThumb" src="./modules/' + config.icon + '">' +
                '<h2 class="hwTitle">' + name + '</h2></div>');

            $('#' + config.id).off('click').on('click', function() {
                viewMode = this.id;
                $('#back.navigate_button').addClass('active');

                var checkComPort = (config.select_com_port || config.hardware.type === 'bluetooth' || serverMode === 1) || false;
                is_select_port = checkComPort;

                if (Array.isArray(selectedList)) {
                    var newSelectList = selectedList.filter(function(item) {
                        return item !== config.name.ko;
                    });
                    newSelectList.push(config.name.ko);
                    localStorage.setItem('hardwareList', JSON.stringify(newSelectList));
                    selectedList = newSelectList;
                } else {
                    selectedList = [config.name.ko];
                    localStorage.setItem('hardwareList', JSON.stringify(selectedList));
                }
                ui.hardware = config.id.substring(0, 4);
                ui.numLevel = 1;
                ui.showConnecting();
                config.serverMode = serverMode;
                router.startScan(config);
                window.currentConfig = config;

                var icon = './modules/' + config.icon;
                $('#selectedHWThumb').attr('src', icon);

                if (config.url) {
                    $('#url').text(config.url);
                    $('#urlArea').show();
                    $('#url').off('click');
                    $('#url').on('click', function() {
                        shell.openExternal(config.url);
                    });
                } else {
                    $('#urlArea').hide();
                }

                if (config.email) {
                    $('#email').text(config.email);
                    $('#emailArea').show();
                    $('#email').off('click').on('click', function() {
                        clipboard.writeText(config.email);
                        alert(translator.translate('Copied to clipboard'));
                    });
                } else {
                    $('#emailArea').hide();
                }

                $('#driverButtonSet button').remove();
                $('#firmwareButtonSet button').remove();

                if (config.driver) {
                    if ($.isPlainObject(config.driver) && config.driver[os]) {
                        var $dom = $('<button class="hwPanelBtn">');
                        $dom.text(translator.translate('Install Device Driver'));
                        $dom.prop('driverPath', config.driver[os]);
                        $('#driverButtonSet').append($dom);
                    } else if (Array.isArray(config.driver)) {
                        config.driver.forEach(function(driver, idx) {
                            if(driver[os]) {
                                var $dom = $('<button class="hwPanelBtn">');
                                $dom.text(translator.translate(driver.translate));
                                $dom.prop('driverPath', driver[os]);
                                $('#driverButtonSet').append($dom);
                            }
                        });
                    }
                }
                if (config.firmware) {
                    $('#firmware').show();
                    if (typeof config.firmware === 'string') {
                        var $dom = $('<button class="hwPanelBtn">');
                        $dom.text(translator.translate('Install Firmware'));
                        $dom.prop('firmware', config.firmware);
                        $dom.prop('config', config);
                        $('#firmwareButtonSet').append($dom);
                    } else if (Array.isArray(config.firmware)) {
                        config.firmware.forEach(function(firmware, idx) {
                            var $dom = $('<button class="hwPanelBtn">');
                            $dom.text(translator.translate(firmware.translate));
                            $dom.prop('firmware', firmware.name);
                            $dom.prop('config', config);
                            $('#firmwareButtonSet').append($dom);
                        });
                    }
                }
            });
        },
        flashFirmware: function(firmware, config, prevPort) {
            try {
                if (viewMode === 'main' || viewMode != config.id) {
                    $('#firmwareButtonSet').show();
                    return;
                }
                if (!router.connector || (!router.connector.sp && !prevPort)) {
                    alert(translator.translate('Hardware Device Is Not Connected'));
                    ui.showConnecting();
                    $('#firmwareButtonSet').show();
                    return;
                }
                if (prevPort && router.connector.sp && (prevPort != router.connector.sp.path)) {
                    $('#firmwareButtonSet').show();
                    return;
                }

                var port = prevPort || router.connector.sp.path;
                var baudRate = config.firmwareBaudRate;
                $('#firmwareButtonSet').hide();
                ui.showAlert(translator.translate("Firmware Uploading..."));
                router.close();
                setTimeout(function() {
                    flasherProcess = flasher.flash(
                        firmware,
                        port,
                        baudRate,
                        function(error, stdout, stderr) {
                            if (error) {
                                if(firmwareCount > 10) {
                                    firmwareCount = 0;
                                    $('#firmwareButtonSet').show();
                                    ui.showAlert(translator.translate("Failed Firmware Upload"));
                                    router.startScan(config);
                                } else if(error === 'exit') {
                                    firmwareCount = 0;
                                    $('#firmwareButtonSet').show();
                                } else {
                                    setTimeout(function() {
                                        ui.flashFirmware(firmware, config, port);
                                    }, 100);
                                }
                            } else {
                                $('#firmwareButtonSet').show();
                                ui.showAlert(translator.translate("Firmware Uploaded!"));
                                router.startScan(config);
                            }
                        }
                    );
                }, 500);
            } catch (e) {
                $('#firmwareButtonSet').show();
            }
        },
        setState: function(state) {
            if (state == 'connected') {
                ui.showConnected();
            } else if (state == 'lost') {
                $('#message').text(translator.translate('Connecting...'));
            } else if (state == 'disconnected') {
                ui.showDisconnected();
            }
        },
        quit: function() {

        },
        showIeGuide: function() {
            $('#errorAlert').show();
        },
        hideIeGuide: function() {
            $('#errorAlert').hide();
        }
    };

    $('body').on('keyup', function(e) {
        if (e.keyCode === 8) {
            $('#back.navigate_button.active').trigger('click');
        }
    });

    $('body').on('click', '#back.navigate_button.active', function(e) {
        is_select_port = true;
        delete window.currentConfig.this_com_port;
        ui.showRobotList();
    });

    $('body').on('click', '#refresh', function(e) {
        if (confirm('프로그램을 재시작 하시겠습니까?')) {
            ipcRenderer.send('reload');
        }
    });

    $('.chromeButton').click(function(e) {
        shell.openExternal("https://www.google.com/chrome/browser/desktop/index.html");
    });


    function isOSWin64() {
        return process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
    };

    // close
    window.onbeforeunload = function(e) {
        var isQuit = true;
        if (router.connector && router.connector.connected) {
            isQuit = confirm(translator.translate('Connection to the hardware will terminate once program is closed.'));
        }

        if (isQuit) {
            router.close();
            server.close();
        } else {
            e.preventDefault();
            e.returnValue = false;
        }
    };

    $('#select_port').dblclick(function() {
        $('#btn_select_port').trigger('click');
    });

    $('#btn_select_port').click(function(e) {
        var com_port = $("#select_port").val();
        if (!com_port) {
            alert('연결할 COM PORT를 선택하세요.');
        } else {
            window.currentConfig.this_com_port = com_port[0];
            clear_select_port();
        }
    });

    $('#select_port_box .cancel_event').click(function(e) {
        clear_select_port();
        clearTimeout(select_port_connection);
        ui.showRobotList();
    });

    function clear_select_port() {
        is_select_port = false;
        _cache_object = '';
        $('#select_port_box').css('display', 'none');
    }


    var _cache_object = '';
    var _com_port = '';
    var is_select_port = true;
    var select_port_connection;
    var serverMode = 0;
    // state
    router.on('serverMode', function(state, data) {
        // console.log(arguments);
    });

    ipcRenderer.on('serverMode', function(event, mode) {
        serverMode = mode;
        if (mode === 1) {
            $('#cloud_icon').show();
        } else {
            $('#cloud_icon').hide();
        }
    });

    router.on('state', function(state, data) {
        console.log(state);
        if (state === "select_port") {
            router.close();
            var _temp = JSON.stringify(data);
            if (_temp !== _cache_object && is_select_port && viewMode !== 'main') {
                var port_html = '';
                data.forEach(function(port) {
                    port_html += '<option title="' + port.comName + '">' + port.comName + '</option>';
                });

                $('#select_port_box').css('display', 'flex');
                $('#select_port_box select').html(port_html);

                _cache_object = _temp;
            }
            if (is_select_port) {
                select_port_connection = setTimeout(function() {
                    if(viewMode !== 'main') {
                        router.startScan(window.currentConfig);
                    }
                }, 1000);
            } else {
                is_select_port = true;
            }
            return;
        } else if (state === "flash") {
            console.log('flash');
            $('#firmware').trigger('click');
        } else if (state === "connect" && window.currentConfig.softwareReset) {
            var sp = router.connector.sp;
            sp.set({ dtr: false }, function() {});
            setTimeout(function() { sp.set({ dtr: true }, function() {}) }, 1000);
            return;
        } else if ((state === "lost" || state === "disconnected") && window.currentConfig.reconnect) {
            router.close();
            ui.showConnecting();
            router.startScan(window.currentConfig);
            return;
        } else if (state === "lost" || state === "disconnected") {
            state = "disconnected";
            router.close();
        } else if (state === 'before_connect' && window.currentConfig.firmware) {
            ui.showAlert(translator.translate('Connecting to hardware device.') + ' 펌웨어를 선택해 주세요.');
        }
        ui.setState(state);
        server.setState(state);
    });

    //ipcEvent
    ipcRenderer.on('update-message', function(e, message) {

    });

    // configuration
    var fs = require('fs');
    var path = require('path');
    fs.readdir(path.join(__dirname, 'modules'), function(error, files) {
        if (error) {
            logger.e(error);
            return;
        }
        var hardwareList = [];
        files.filter(function(file) {
            return /(?:\.([^.]+))?$/.exec(file)[1] == 'json';
        }).forEach(function(file) {
            try {
                var config = fs.readFileSync(path.join(__dirname, 'modules', file));
                hardwareList.push(JSON.parse(config));
            } catch (e) {}
        });

        hardwareList.sort(function(left, right) {
            var lName = left.name.ko.trim();
            var rName = right.name.ko.trim();
            var lIndex = (Array.isArray(selectedList)) ? selectedList.indexOf(lName) : 0;
            var rIndex = (Array.isArray(selectedList)) ? selectedList.indexOf(rName) : 0;
            if (lIndex < rIndex) {
                return 1;
            } else if (lIndex > rIndex) {
                return -1;
            } else if (lName > rName) {
                return 1;
            } else if (lName < rName) {
                return -1;
            } else {
                return 0;
            }
        });

        hardwareList.forEach(function(config) {
            ui.addRobot(config);
        });
    });
}());
