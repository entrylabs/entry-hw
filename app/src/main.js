(function() {
    'use strict';
    const { ipcRenderer, shell, clipboard, remote } = require('electron');
    const fs = require('fs');
    const path = require('path');
    window.jQuery = require('./src/js/jquery-1.11.3.min.js');
    window.$ = window.jQuery;

    const lastCheckVersion = localStorage.getItem('lastCheckVersion');
    const hasNewVersion = localStorage.getItem('hasNewVersion');
    let selectedList = JSON.parse(localStorage.getItem('hardwareList'));
    const sharedObject = remote.getGlobal('sharedObject');
    const Modal = require('./src/modal/app.js').default;
    const translator = require('./custom_modules/translator');
    const lang = translator.getLanguage();
    window.Lang = require(path.resolve(__dirname, 'src', 'lang', lang + '.js')).Lang;

    // initialize options
    window.modal = new Modal();

    let viewMode = 'main';
    const hardwareList = [];

    const os = `${process.platform}-${isOSWin64() ? 'x64' : process.arch}`;
    let driverDefaultPath;

    if (sharedObject.appName === 'hardware' && navigator.onLine) {
        if (hasNewVersion) {
            localStorage.removeItem('hasNewVersion');
            modal
                .alert(
                    Lang.Msgs.version_update_msg2.replace(
                        /%1/gi,
                        lastCheckVersion
                    ),
                    Lang.General.update_title,
                    {
                        positiveButtonText: Lang.General.recent_download,
                        positiveButtonStyle: {
                            width: '180px',
                        },
                    }
                )
                .one('click', (event) => {
                    if (event === 'ok') {
                        shell.openExternal(
                            'https://playentry.org/#!/offlineEditor'
                        );
                    }
                });
        } else {
            ipcRenderer.on(
                'checkUpdateResult',
                (e, { hasNewVersion, version } = {}) => {
                    if (hasNewVersion && version !== lastCheckVersion) {
                        localStorage.setItem('hasNewVersion', hasNewVersion);
                        localStorage.setItem('lastCheckVersion', version);
                    }
                }
            );
            ipcRenderer.send('checkUpdate');
        }
    }
    // logger
    const loggerModule = require('./custom_modules/logger');
    loggerModule.set({
        v(str) {
            console.log(str);
        },
        i(str) {
            console.info(`%c${str}`, 'color: dodgerblue');
        },
        w(str) {
            console.warn(`%c${str}`, 'color: orange');
        },
        e(str) {
            console.error(`%c${str}`, 'color: red');
        },
    });
    const logger = loggerModule.get();

    const router = require('./custom_modules/router/rendererRouter');
    window.router = router;

    $('html').addClass(process.platform);

    // ui & control
    // dropdown setting start
    const categoryDropdown = $("#filter_category");
    const categoryDropdownOptions = categoryDropdown.children('li:not(.init)');
    const categoryDropdownCurrentSelected = categoryDropdown.children('.init');

    const hideCategory = () => {
        categoryDropdown.hide();
        categoryDropdownOptions.hide();
    };

    categoryDropdown.on("click", ".init", () => {
        categoryDropdownCurrentSelected.toggleClass('open');
        categoryDropdownOptions.toggle();
    });

    categoryDropdown.on("click", "li:not(.init)", function() {
        categoryDropdownOptions.removeClass('selected');

        const selected = $(this);
        const selectedCategory = selected.data('value');
        selected.addClass('selected');
        categoryDropdownCurrentSelected.html(selected.html());

        categoryDropdownCurrentSelected.append(
            $('<div></div>')
                .addClass('arrow')
        );

        // 카테고리 닫기
        categoryDropdownCurrentSelected.toggleClass('open');
        categoryDropdownOptions.toggle();

        // 카테고리 목록, 선택 카테고리 데이터 변경
        categoryDropdownCurrentSelected.data('value', selectedCategory);
        filterHardware(selectedCategory);
    });

    // dropdown setting end

    $('.alertMsg .alertMsg1').text(
        translator.translate('If unexpected problem occurs while operating,')
    );
    $('.alertMsg .alertMsg2').text(
        translator.translate(
            'contact the hardware company to resolve the problem.'
        )
    );
    $('#errorAlert .comment').text(
        translator.translate(
            '* Entry Labs is not responsible for the extension program and hardware products on this site.'
        )
    );

    $('#select_port_box .title span').text(translator.translate('Select'));
    $('#select_port_box .description').text(
        translator.translate('Select the COM PORT to connect')
    );
    $('#select_port_box #btn_select_port_cancel').text(
        translator.translate('Cancel')
    );
    $('#select_port_box #btn_select_port').text(
        translator.translate('Connect')
    );

    $('#opensource_license_viewer .title span').text(
        translator.translate('Opensource lincense')
    );
    $('#opensource_license_viewer #btn_close').text(
        translator.translate('Close')
    );

    $('#reference .emailTitle').text(translator.translate('E-Mail : '));
    $('#reference .urlTitle').text(translator.translate('WebSite : '));
    $('#reference .videoTitle').text(translator.translate('Video : '));

    $('#opensource_label').text(translator.translate('Opensource lincense'));
    $('#version_label').text(translator.translate('Version Info'));
    $('#firmware').text(translator.translate('Install Firmware'));
    $('#other-robot .text').text(
        translator.translate('Connect Other Hardware')
    );
    $('#entry .text').text(translator.translate('Show Entry Web Page'));

    $('#driverButtonSet').on('click', 'button', function() {
        if (!driverDefaultPath) {
            const sourcePath = path.join(__dirname, 'drivers');
            const asarIndex = __dirname.indexOf('app.asar');
            if (asarIndex >= 0) {
                driverDefaultPath = path.join(
                    __dirname.substr(0, asarIndex),
                    'drivers'
                );
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
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();
        if (exists && isDirectory) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            fs.readdirSync(src).forEach((childItemName) => {
                copyRecursiveSync(
                    path.join(src, childItemName),
                    path.join(dest, childItemName)
                );
            });
        } else {
            const data = fs.readFileSync(src);
            fs.writeFileSync(dest, data);
        }
    };

    var ui = {
        countRobot: 0,
        showRobotList() {
            viewMode = 'main';
            $('#alert')
                .stop()
                .clearQueue();
            router.close();
            router.stopScan();
            delete window.currentConfig;
            $('#title').text(translator.translate('Select hardware'));
            categoryDropdown.show();
            $('#hwList').show();
            $('#search_area').show();
            $('#hwPanel').css('display', 'none');
            ui.showIeGuide();
            this.hideAlert();
            $('#back.navigate_button').removeClass('active');
        },
        showConnecting() {
            $('#title').text(translator.translate('hardware > connecting'));
            hideCategory();
            $('#hwList').hide();
            $('#search_area').hide();
            $('#hwPanel').css('display', 'flex');
            ui.hideIeGuide();
            this.showAlert(
                translator.translate('Connecting to hardware device.')
            );
        },
        showConnected() {
            $('#title').text(translator.translate('hardware > connected'));
            hideCategory();
            $('#hwList').hide();
            $('#search_area').hide();
            $('#hwPanel').css('display', 'flex');
            ui.hideIeGuide();
            this.showAlert(
                translator.translate('Connected to hardware device.'),
                2000
            );
        },
        showDisconnected() {
            $('#title').text(translator.translate('hardware > disconnected'));
            hideCategory();
            $('#hwList').hide();
            $('#search_area').hide();
            $('#hwPanel').css('display', 'flex');
            ui.hideIeGuide();
            this.showAlert(
                translator.translate(
                    'Hardware device is disconnected. Please restart this program.'
                )
            );
        },
        showAlert(message, duration) {
            if (!$('#hwList').is(':visible')) {
                const $alert = $('#alert');
                $alert.removeClass('error');
                $alert.text(message);
                $alert.css({ height: '0px' });
                $alert
                    .stop()
                    .animate({ height: '35px' });
                if (duration) {
                    setTimeout(() => {
                        $alert
                            .stop()
                            .animate({ height: '0px' });
                    }, duration);
                }
            }
        },
        showError(message, duration) {
            if (!$('#hwList').is(':visible')) {
                $('#alert').addClass('error');
                $('#alert').text(message);

                $('#alert').css({
                    height: '0px',
                });
                $('#alert')
                    .stop()
                    .animate({
                        height: '35px',
                    });
                if (duration) {
                    setTimeout(() => {
                        $('#alert')
                            .stop()
                            .animate({
                                height: '0px',
                            });
                    }, duration);
                }
            }
        },
        hideAlert(message) {
            $('#alert')
                .stop(true, true)
                .animate({
                    height: '0px',
                });
        },
        hideRobot(id) {
            $(`#${id}`).hide();
        },
        showRobot(id) {
            if (id) {
                $(`#${id}`).show();
            } else {
                $('.hardwareType').show();
            }
        },
        addRobot(config) {
            ui.showRobotList();
            let name, platform;
            if (config.name) {
                name = config.name[lang] || config.name.en;
            }

            if (
                (config.platform &&
                    config.platform.indexOf(process.platform) === -1) ||
                !config.platform
            ) {
                return;
            }

            $('#hwList').append(`
                <div class="hardwareType" id="${config.id}">
                    <img class="hwThumb" src="./modules/${config.icon}">
                    <h2 class="hwTitle">
                        ${name}
                    </h2>
                </div>
            `);

            $(`#${config.id}`)
                .off('click')
                .on('click', function() {
                    viewMode = this.id;
                    $('#back.navigate_button').addClass('active');

                    const checkComPort =
                        config.select_com_port ||
                        config.hardware.type === 'bluetooth' ||
                        serverMode === 1 ||
                        false;
                    is_select_port = checkComPort;

                    if (Array.isArray(selectedList)) {
                        const newSelectList = selectedList.filter((item) => item !== config.name.ko);
                        newSelectList.push(config.name.ko);
                        localStorage.setItem(
                            'hardwareList',
                            JSON.stringify(newSelectList)
                        );
                        selectedList = newSelectList;
                    } else {
                        selectedList = [config.name.ko];
                        localStorage.setItem(
                            'hardwareList',
                            JSON.stringify(selectedList)
                        );
                    }
                    ui.hardware = config.id.substring(0, 4);
                    ui.numLevel = 1;
                    ui.showConnecting();
                    config.serverMode = serverMode;
                    router.startScan(config);
                    window.currentConfig = config;

                    const icon = `./modules/${config.icon}`;
                    $('#selectedHWThumb').attr('src', icon);

                    if (config.url) {
                        $('#url').text(config.url);
                        $('#urlArea').show();
                        $('#url').off('click');
                        $('#url').on('click', () => {
                            shell.openExternal(config.url);
                        });
                    } else {
                        $('#urlArea').hide();
                    }

                    if (config.video) {
                        let video = config.video;
                        if (typeof video === 'string') {
                            video = [video];
                        }
                        $('#video').empty();
                        video.forEach((link, idx) => {
                            $('#video').append(`<span>${link}</span><br/>`);
                            $('#videoArea').show();
                        });
                        $('#video').off('click');
                        $('#video').on('click', 'span', (e) => {
                            const index = $('#video span').index(e.target);
                            console.log(video, index, video[index]);
                            shell.openExternal(video[index]);
                        });
                    } else {
                        $('#videoArea').hide();
                    }

                    if (config.email) {
                        $('#email').text(config.email);
                        $('#emailArea').show();
                        $('#email')
                            .off('click')
                            .on('click', () => {
                                clipboard.writeText(config.email);
                                alert(
                                    translator.translate('Copied to clipboard')
                                );
                            });
                    } else {
                        $('#emailArea').hide();
                    }

                    $('#driverButtonSet button').remove();
                    $('#firmwareButtonSet button').remove();

                    if (config.driver) {
                        if (
                            $.isPlainObject(config.driver) &&
                            config.driver[os]
                        ) {
                            var $dom = $('<button class="hwPanelBtn">');
                            $dom.text(
                                translator.translate('Install Device Driver')
                            );
                            $dom.prop('driverPath', config.driver[os]);
                            $('#driverButtonSet').append($dom);
                        } else if (Array.isArray(config.driver)) {
                            config.driver.forEach((driver, idx) => {
                                if (driver[os]) {
                                    const $dom = $('<button class="hwPanelBtn">');
                                    $dom.text(
                                        translator.translate(driver.translate)
                                    );
                                    $dom.prop('driverPath', driver[os]);
                                    $('#driverButtonSet').append($dom);
                                }
                            });
                        }
                    }
                    if (config.firmware) {
                        $('#firmware').show();
                        if (Array.isArray(config.firmware)) {
                            config.firmware.forEach((firmware, idx) => {
                                const $dom = $('<button class="hwPanelBtn">');
                                $dom.text(
                                    translator.translate(firmware.translate)
                                );
                                $dom.prop('firmware', firmware.name);
                                $dom.prop('config', config);
                                $('#firmwareButtonSet').append($dom);
                            });
                        } else {
                            var $dom = $('<button class="hwPanelBtn">');
                            $dom.text(translator.translate('Install Firmware'));
                            $dom.prop('firmware', config.firmware);
                            $dom.prop('config', config);
                            $('#firmwareButtonSet').append($dom);
                        }
                    }
                });
        },
        flashFirmware(firmware, config, prevPort) {
            if (currentState !== 'connected') {
                alert(
                    translator.translate('Hardware Device Is Not Connected')
                );
                ui.showConnecting();
                $('#firmwareButtonSet').show();
                return;
            }

            $('#firmwareButtonSet').hide();
            ui.showAlert(translator.translate('Firmware Uploading...'));
            router.requestFlash()
                .then(() => {
                    ui.showAlert(
                        translator.translate('Firmware Uploaded!')
                    );
                })
                .catch((e) => {
                    ui.showAlert(
                        translator.translate(
                            'Failed Firmware Upload'
                        )
                    );
                })
                .finally(() => {
                    $('#firmwareButtonSet').show();
                });
        },
        setState(state) {
            if (state == 'connected') {
                ui.showConnected();
            } else if (state == 'lost') {
                $('#message').text(translator.translate('Connecting...'));
            } else if (state == 'disconnected') {
                ui.showDisconnected();
            }
        },
        quit() {},
        showIeGuide() {
            $('#errorAlert').show();
        },
        hideIeGuide() {
            $('#errorAlert').hide();
        },
    };

    $('#search_bar').on('keydown', function(e) {
        if (e.which == 27) {
            this.value = '';
            searchHardware('');
        } else if (e.which == 13) {
            searchHardware(this.value);
        }

        if (this.value) {
            $('#search_close_button').show();
        } else {
            $('#search_close_button').hide();
        }
    });

    $('#search_button').on('click', () => {
        searchHardware($('#search_bar').val());
    });

    $('#search_close_button').on('click', function() {
        $('#search_bar').val('');
        $(this).hide();
        filterHardware(categoryDropdownCurrentSelected.data('value'));
    });

    function searchHardware(searchText) {
        // var searchText = $('#search_bar').val();
        const currentCategory = $('#filter_category').children('.init').data('value');
        let isNotFound = true;
        if (searchText) {
            const hideList = hardwareList.filter((hardware) => {
                const en = hardware.name.en.toLowerCase();
                const ko = hardware.name.ko.toLowerCase();
                const text = searchText.toLowerCase();
                if (
                    (ko.indexOf(text) > -1 || en.indexOf(text) > -1) && // 검색결과가 있는지
                    (hardware.platform.indexOf(process.platform) > -1) && // 현재 플랫폼과 동일한지
                    (currentCategory === 'all' || hardware.category === currentCategory) // 현재 카테고리에 포함되었는지
                ) {
                    ui.showRobot(hardware.id);
                    isNotFound = false;
                } else {
                    return true;
                }
            });

            if (isNotFound) {
                alert(translator.translate('No results found'));
            } else {
                hideList.forEach((hardware) => {
                    ui.hideRobot(hardware.id);
                });
            }
        } else {
            ui.showRobot();
        }
    }

    /**
     * 카테고리 별로 데이터를 표시한다.
     * 카테고리 변경시 검색결과는 삭제된다.
     * @param type{string} all|robot|module|board
     */
    function filterHardware(type) {
        $('#search_bar').val('');
        $('#search_close_button').hide();
        if (!type || type === 'all') {
            ui.showRobot();
        } else {
            hardwareList.forEach((hardware) => {
                if (hardware.category === type) {
                    ui.showRobot(hardware.id);
                } else {
                    ui.hideRobot(hardware.id);
                }
            });
        }
    }

    $('body').on('keyup', (e) => {
        if (e.keyCode === 8) {
            $('#back.navigate_button.active').trigger('click');
        }
    });

    $('body').on('click', '#back.navigate_button.active', (e) => {
        is_select_port = true;
        delete window.currentConfig.this_com_port;
        ui.showRobotList();
    });

    $('body').on('click', '#refresh', (e) => {
        if (
            confirm(translator.translate('Do you want to restart the program?'))
        ) {
            ipcRenderer.send('reload');
        }
    });

    $('.chromeButton').click((e) => {
        shell.openExternal(
            'https://www.google.com/chrome/browser/desktop/index.html'
        );
    });

    function isOSWin64() {
        return (
            process.arch === 'x64' ||
            process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')
        );
    }

    ipcRenderer.on('hardwareClose', () => {
        let isQuit = true;
        if (router.connector && router.connector.connected) {
            isQuit = confirm(
                translator.translate(
                    'Connection to the hardware will terminate once program is closed.'
                )
            );
        }

        if (isQuit) {
            router.close();
            // server.close();
            ipcRenderer.send('hardwareForceClose', true);
        }
    });

    $('#select_port').dblclick(() => {
        $('#btn_select_port').trigger('click');
    });

    $('#btn_select_port').click((e) => {
        const com_port = $('#select_port').val();
        if (!com_port) {
            alert(translator.translate('Select the COM PORT to connect'));
        } else {
            window.currentConfig.this_com_port = com_port[0];
            clear_select_port();
        }
    });

    $('#select_port_box .cancel_event').click((e) => {
        clear_select_port();
        clearTimeout(select_port_connection);
    });

    function clear_select_port() {
        is_select_port = false;
        _cache_object = '';
        $('#select_port_box').css('display', 'none');
    }

    $('#opensource_license_viewer .close_event').on('click', () => {
        $('#opensource_license_viewer').css('display', 'none');
    });

    $('#opensource_label').on('click', () => {
        $('#opensource_license_viewer').css('display', 'flex');
    });

    $('#version_label').on('click', () => {
        ipcRenderer.send('openAboutWindow');
    });

    const opensourceFile = path.resolve(__dirname, 'OPENSOURCE.md');
    fs.readFile(opensourceFile, 'utf8', (err, text) => {
        $('#opensource_content').val(text);
    });

    var _cache_object = '';
    const _com_port = '';
    var is_select_port = true;
    let select_port_connection;
    var serverMode = 0;
    // state
    router.on('serverMode', (state, data) => {
        // console.log(arguments);
    });

    ipcRenderer.on('serverMode', (event, mode) => {
        serverMode = mode;
        if (mode === 1) {
            $('#cloud_icon').show();
        } else {
            $('#cloud_icon').hide();
        }
    });

    //router.on('state' ..
    let currentState = '';
    ipcRenderer.on('state', (event, state, data) => {
        console.log(state);
        currentState = state;
        if (state === 'select_port') {
            router.close();
            const _temp = JSON.stringify(data);
            if (
                _temp !== _cache_object &&
                is_select_port &&
                viewMode !== 'main'
            ) {
                let port_html = '';
                data.forEach((port) => {
                    port_html +=
                        `<option title="${ 
                        port.comName 
                        }">${ 
                        port.comName 
                        }</option>`;
                });

                $('#select_port_box').css('display', 'flex');
                $('#select_port_box select').html(port_html);

                _cache_object = _temp;
            }
            if (is_select_port) {
                select_port_connection = setTimeout(() => {
                    if (viewMode !== 'main') {
                        router.startScan(window.currentConfig);
                    }
                }, 1000);
            } else {
                is_select_port = true;
            }
            return;
        } else if (state === 'flash') {
            console.log('flash');
            $('#firmware').trigger('click');
        } else if (state === 'connect' && window.currentConfig.softwareReset) {
            const sp = router.connector.sp;
            sp.set(
                {
                    dtr: false,
                },
                () => {}
            );
            setTimeout(() => {
                sp.set(
                    {
                        dtr: true,
                    },
                    () => {}
                );
            }, 1000);
            return;
        } else if (
            (state === 'lost' || state === 'disconnected') &&
            window.currentConfig.reconnect
        ) {
            router.close();
            ui.showConnecting();
            router.startScan(window.currentConfig);
            return;
        } else if (state === 'lost' || state === 'disconnected') {
            state = 'disconnected';
            router.close();
        } else if (
            state === 'before_connect' &&
            window.currentConfig && window.currentConfig.firmware
        ) {
            ui.showAlert(
                `${translator.translate('Connecting to hardware device.') 
                    } ${ 
                    translator.translate('Please select the firmware.')}`
            );
        }
        ui.setState(state);
        // server.setState(state);
    });

    //ipcEvent
    ipcRenderer.on('update-message', (e, message) => {});

    // configuration
    fs.readdir(path.join(__dirname, 'modules'), (error, files) => {
        if (error) {
            logger.e(error);
            return;
        }

        files
            .filter((file) => /(?:\.([^.]+))?$/.exec(file)[1] == 'json')
            .forEach((file) => {
                try {
                    const config = fs.readFileSync(
                        path.join(__dirname, 'modules', file)
                    );
                    hardwareList.push(JSON.parse(config));
                } catch (e) {}
            });

        hardwareList.sort((left, right) => {
            const lName = left.name.ko.trim();
            const rName = right.name.ko.trim();
            const lIndex = Array.isArray(selectedList)
                ? selectedList.indexOf(lName)
                : 0;
            const rIndex = Array.isArray(selectedList)
                ? selectedList.indexOf(rName)
                : 0;
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

        hardwareList.forEach((config) => {
            ui.addRobot(config);
        });
    });
})();
