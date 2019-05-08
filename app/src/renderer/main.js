(function() {
    'use strict';
    const { ipcRenderer, shell, clipboard, remote } = require('electron');
    const Translator = require('../js/translator');
    window.jQuery = require('../js/jquery-1.11.3.min.js');
    window.$ = window.jQuery;

    const lastCheckVersion = localStorage.getItem('lastCheckVersion');
    const hasNewVersion = localStorage.getItem('hasNewVersion');
    let priorHardwareList = JSON.parse(localStorage.getItem('hardwareList')) || [];
    const sharedObject = remote.getGlobal('sharedObject');
    const Modal = require('../modal/app.js').default;
    const translator = new Translator();
    const lang = translator.currentLangauge;
    window.Lang = require(`../lang/${lang}.js`).Lang;

    // initialize options
    window.modal = new Modal();

    let viewMode = 'main';
    let hardwareList = [];

    const os = `${process.platform}-${isOSWin64() ? 'x64' : process.arch}`;

    if (sharedObject.appName === 'hardware' && navigator.onLine) {
        if (hasNewVersion) {
            localStorage.removeItem('hasNewVersion');
            modal
                .alert(
                    Lang.Msgs.version_update_msg2.replace(
                        /%1/gi,
                        lastCheckVersion,
                    ),
                    Lang.General.update_title,
                    {
                        positiveButtonText: Lang.General.recent_download,
                        positiveButtonStyle: {
                            width: '180px',
                        },
                    },
                )
                .one('click', (event) => {
                    if (event === 'ok') {
                        shell.openExternal(
                            'https://playentry.org/#!/offlineEditor',
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
                },
            );
            ipcRenderer.send('checkUpdate');
        }
    }
    const router = require('../js/rendererRouter');
    window.router = router;

    $('html').addClass(process.platform);

    // ui & control
    // dropdown setting start
    const categoryDropdown = $('#filter_category');
    const categoryDropdownOptions = categoryDropdown.children('li:not(.init)');
    const categoryDropdownCurrentSelected = categoryDropdown.children('.init');

    const hideCategory = () => {
        categoryDropdown.hide();
        categoryDropdownOptions.hide();
    };

    categoryDropdown.on('click', '.init', () => {
        categoryDropdownCurrentSelected.toggleClass('open');
        categoryDropdownOptions.toggle();
    });

    categoryDropdown.on('click', 'li:not(.init)', function() {
        categoryDropdownOptions.removeClass('selected');

        const selected = $(this);
        const selectedCategory = selected.data('value');
        selected.addClass('selected');
        categoryDropdownCurrentSelected.html(selected.html());

        categoryDropdownCurrentSelected.append(
            $('<div></div>')
                .addClass('arrow'),
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
        translator.translate('If unexpected problem occurs while operating,'),
    );
    $('.alertMsg .alertMsg2').text(
        translator.translate(
            'contact the hardware company to resolve the problem.',
        ),
    );
    $('#errorAlert .comment').text(
        translator.translate(
            '* Entry Labs is not responsible for the extension program and hardware products on this site.',
        ),
    );

    $('#select_port_box .title span').text(translator.translate('Select'));
    $('#select_port_box .description').text(
        translator.translate('Select the COM PORT to connect'),
    );
    $('#select_port_box #btn_select_port_cancel').text(
        translator.translate('Cancel'),
    );
    $('#select_port_box #btn_select_port').text(
        translator.translate('Connect'),
    );

    $('#opensource_license_viewer .title span').text(
        translator.translate('Opensource lincense'),
    );
    $('#opensource_license_viewer #btn_close').text(
        translator.translate('Close'),
    );

    $('#reference .emailTitle').text(translator.translate('E-Mail : '));
    $('#reference .urlTitle').text(translator.translate('WebSite : '));
    $('#reference .videoTitle').text(translator.translate('Video : '));

    $('#opensource_label').text(translator.translate('Opensource lincense'));
    $('#version_label').text(translator.translate('Version Info'));
    $('#firmware').text(translator.translate('Install Firmware'));
    $('#other-robot .text').text(
        translator.translate('Connect Other Hardware'),
    );
    $('#entry .text').text(translator.translate('Show Entry Web Page'));

    $('#driverButtonSet').on('click', 'button', function() {
        router.executeDriverFile(this.driverPath);
    });

    $('#firmwareButtonSet').on('click', 'button', function() {
        // 여기서의 this 는 $dom 의 props 이다. arrow function 금지
        ui.flashFirmware(this.firmware);
    });

    var ui = {
        cachedPortList: [],
        countRobot: 0,
        showRobotList() {
            viewMode = 'main';
            $('#alert')
                .stop()
                .clearQueue();
            currentState = 'disconnected';
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
                translator.translate('Connecting to hardware device.'),
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
                2000,
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
                    'Hardware device is disconnected. Please restart this program.',
                ),
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

            $('#hwList').append(`
                <div class="hardwareType" id="${config.id}">
                    <img class="hwThumb" src="../../../modules/${config.icon}">
                    <h2 class="hwTitle">
                        ${config.name && config.name[lang] || config.name.en}
                    </h2>
                </div>
            `);

            $(`#${config.id}`)
                .off('click')
                .on('click', function() {
                    viewMode = this.id;
                    $('#back.navigate_button').addClass('active');

                    isSelectPort = config.select_com_port ||
                        config.hardware.type === 'bluetooth' ||
                        serverMode === 1 ||
                        false;

                    const newSelectList = priorHardwareList
                        .filter((item) => item !== config.name.ko);

                    newSelectList.push(config.name.ko);
                    localStorage.setItem(
                        'hardwareList',
                        JSON.stringify(newSelectList),
                    );
                    priorHardwareList = newSelectList;

                    const icon = `../../../modules/${config.icon}`;
                    $('#selectedHWThumb').attr('src', icon);

                    if (config.url) {
                        const $url = $('#url');
                        $url.text(config.url);
                        $('#urlArea').show();
                        $url.off('click');
                        $url.on('click', () => {
                            shell.openExternal(config.url);
                        });
                    } else {
                        $('#urlArea').hide();
                    }

                    if (config.video) {
                        let video = config.video;
                        const $video = $('#video');

                        if (typeof video === 'string') {
                            video = [video];
                        }

                        $video.empty();
                        video.forEach((link, idx) => {
                            $video.append(`<span>${link}</span><br/>`);
                            $('#videoArea').show();
                        });
                        $video.off('click');
                        $video.on('click', 'span', (e) => {
                            const index = $('#video span').index(e.target);
                            console.log(video, index, video[index]);
                            shell.openExternal(video[index]);
                        });
                    } else {
                        $('#videoArea').hide();
                    }

                    if (config.email) {
                        const $email = $('#email');
                        $email.text(config.email);
                        $('#emailArea').show();
                        $email
                            .off('click')
                            .on('click', () => {
                                clipboard.writeText(config.email);
                                alert(
                                    translator.translate('Copied to clipboard'),
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
                            const $dom = $('<button class="hwPanelBtn">');
                            $dom.text(
                                translator.translate('Install Device Driver'),
                            );
                            $dom.prop('driverPath', config.driver[os]);
                            $('#driverButtonSet').append($dom);
                        } else if (Array.isArray(config.driver)) {
                            config.driver.forEach((driver) => {
                                if (driver[os]) {
                                    const $dom = $('<button class="hwPanelBtn">');
                                    $dom.text(
                                        translator.translate(driver.translate),
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
                            config.firmware.forEach((firmware) => {
                                const $dom = $('<button class="hwPanelBtn">');
                                $dom.text(
                                    translator.translate(firmware.translate),
                                );
                                $dom.prop('firmware', firmware.name);
                                $dom.prop('config', config);
                                $('#firmwareButtonSet').append($dom);
                            });
                        } else {
                            const $dom = $('<button class="hwPanelBtn">');
                            $dom.text(translator.translate('Install Firmware'));
                            $dom.prop('firmware', config.firmware);
                            $dom.prop('config', config);
                            $('#firmwareButtonSet').append($dom);
                        }
                    }

                    ui.hardware = config.id.substring(0, 4);
                    ui.numLevel = 1;
                    ui.showConnecting();
                    config.serverMode = serverMode;
                    router.startScan(config);
                    window.currentConfig = config;
                });
        },
        flashFirmware(firmwareName) {
            if (currentState !== 'before_connect' && currentState !== 'connected') {
                alert(
                    translator.translate('Hardware Device Is Not Connected'),
                );
                ui.showConnecting();
                $('#firmwareButtonSet').show();
                return;
            }

            $('#firmwareButtonSet').hide();
            ui.showAlert(translator.translate('Firmware Uploading...'));
            router.requestFlash(firmwareName)
                .then(() => {
                    ui.showAlert(
                        translator.translate('Firmware Uploaded!'),
                    );
                })
                .catch((e) => {
                    console.error(e);
                    ui.showAlert(
                        translator.translate(
                            'Failed Firmware Upload',
                        ),
                    );
                })
                .finally(() => {
                    $('#firmwareButtonSet').show();
                });
        },
        showPortSelectView(portList) {
            if (
                JSON.stringify(portList) !== this.cachedPortList &&
                isSelectPort &&
                viewMode !== 'main'
            ) {
                let portHtml = '';
                portList.forEach((port) => {
                    portHtml +=
                        `<option title="${port.comName}">${port.comName}</option>`;
                });

                $('#select_port_box select').html(portHtml);
                this.cachedPortList = JSON.stringify(portList);
            }
            $('#select_port_box').css('display', 'flex');
        },
        quit() {
        },
        showIeGuide() {
            $('#errorAlert').show();
        },
        hideIeGuide() {
            $('#errorAlert').hide();
        },
    };

    $('#search_bar').on('keydown', function(e) {
        if (e.which === 27) {
            this.value = '';
            searchHardware('');
        } else if (e.which === 13) {
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
        isSelectPort = true;
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
            'https://www.google.com/chrome/browser/desktop/index.html',
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
        if (currentState === 'connected') {
            isQuit = confirm(
                translator.translate(
                    'Connection to the hardware will terminate once program is closed.',
                ),
            );
        }

        if (isQuit) {
            router.close();
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
            clearSelectPort();
        }
    });

    $('#select_port_box .cancel_event').click((e) => {
        clearSelectPort();
        ui.cachedPortList = '';
        clearTimeout(selectPortConnectionTimeout);
    });

    function clearSelectPort() {
        isSelectPort = false;
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

    router.getOpensourceContents().then((text) => {
        $('#opensource_content').val(text);
    });

    var isSelectPort = true;
    let selectPortConnectionTimeout;
    var serverMode = 0;
    // state

    const initialServerMode = ipcRenderer.sendSync('getCurrentServerModeSync');
    serverMode = initialServerMode;
    if (initialServerMode === 1) {
        console.log('%cI`M CLIENT', 'background:black;color:yellow;font-size: 30px');
        $('#cloud_icon').show();
    } else {
        console.log('%cI`M SERVER', 'background:orange; font-size: 30px');
        $('#cloud_icon').hide();
    }
    ipcRenderer.on('serverMode', (event, mode) => {
        if (serverMode === mode && mode === 1) {
            console.log('%cI`M SERVER', 'background:orange; font-size: 30px');
        }

        serverMode = mode;
        if (mode === 1) {
            $('#cloud_icon').show();
        } else {
            $('#cloud_icon').hide();
        }
    });

    let currentState = '';
    ipcRenderer.on('state', (event, state, data) => {
        console.log(state);

        // select_port 는 기록해두어도 쓸모가 없으므로 표기하지 않는다
        if (state !== 'select_port') {
            currentState = state;
        }

        switch (state) {
            case 'select_port': {
                router.close();
                ui.showPortSelectView(data);
                if (isSelectPort) {
                    selectPortConnectionTimeout = setTimeout(() => {
                        if (viewMode !== 'main') {
                            router.startScan(window.currentConfig);
                        }
                    }, 1000);
                } else {
                    isSelectPort = true;
                }
                return; // ui 변경 이루어지지 않음.
            }
            case 'flash': {
                ui.flashFirmware();
                break;
            }
            case 'before_connect': {
                ui.showAlert(
                    `${translator.translate('Connecting to hardware device.')
                        } ${
                        translator.translate('Please select the firmware.')}`,
                );
                break;
            }
            case 'lost':
                ui.showConnecting();
                break;
            case 'disconnected':
                ui.showDisconnected();
                break;
            case 'connected':
                ui.showConnected();
                break;
        }
    });

    //ipcEvent
    ipcRenderer.on('console', (event, ...args) => {
        console.log(...args);
    });

    // configuration
    const routerHardwareList = router.getHardwareListSync();
    priorHardwareList.reverse().forEach((target, index) => {
        const currentIndex = routerHardwareList.findIndex((item) => item.name.ko.trim() === target);
        if (currentIndex > -1) {
            const temp = routerHardwareList[currentIndex];
            routerHardwareList[currentIndex] = routerHardwareList[index];
            routerHardwareList[index] = temp;
        }
    });
    hardwareList = routerHardwareList;
    hardwareList.forEach((config) => {
        ui.addRobot(config);
    });
})();
