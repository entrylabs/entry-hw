'use strict';
const {
    clipboard, RendererRouter, constants, translator, platform, os,
} = window;
const langType = translator.currentLanguage;

const {
    AVAILABLE_TYPE: AvaliableType,
} = constants;
let priorHardwareList = JSON.parse(localStorage.getItem('hardwareList')) || [];

let viewMode = 'main';


$('html').addClass(platform);

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

$('#reference .emailTitle').text(translator.translate('E-Mail : '));
$('#reference .urlTitle').text(translator.translate('WebSite : '));
$('#reference .videoTitle').text(translator.translate('Video : '));

const $openSourceLabel = $('#opensource_label');
$openSourceLabel.text(translator.translate('Opensource lincense'));
$openSourceLabel.on('click', () => {
    $('#opensource_license_viewer').css('display', 'flex');
});
$('#opensource_license_viewer .title span').text(
    translator.translate('Opensource lincense'),
);
$('#opensource_license_viewer #btn_close').text(
    translator.translate('Close'),
);

const $versionLabel = $('#version_label');
$versionLabel.text(translator.translate('Version Info'));
$versionLabel.on('click', () => {
    router.requestOpenAboutWindow();
});

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

const ui = new class {
    constructor() {
        this.cachedPortList = [];
    }

    showRobotList() {
        viewMode = 'main';
        $('#alert')
            .stop()
            .clearQueue();
        router.currentState = 'disconnected';
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
    }

    showConnecting() {
        $('#title').text(translator.translate('hardware > connecting'));
        hideCategory();
        $('#hwList').hide();
        $('#search_area').hide();
        $('#hwPanel').css('display', 'flex');
        $('#back.navigate_button').addClass('active');
        ui.hideIeGuide();
        this.showAlert(
            translator.translate('Connecting to hardware device.'),
        );
    }

    showConnected() {
        $('#title').text(translator.translate('hardware > connected'));
        hideCategory();
        $('#hwList').hide();
        $('#search_area').hide();
        $('#hwPanel').css('display', 'flex');
        $('#back.navigate_button').addClass('active');
        ui.hideIeGuide();
        this.showAlert(
            translator.translate('Connected to hardware device.'),
            2000,
        );
    }

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
    }

    showAlert(message, duration) {
        if (!$('#hwList').is(':visible')) {
            const $alert = $('#alert');
            $alert.text(message);
            $alert.css({ height: '0px' });
            $alert.stop().animate({ height: '35px' });
            if (duration) {
                setTimeout(() => {
                    $alert.stop().animate({ height: '0px' });
                }, duration);
            }
        }
    }

    hideAlert() {
        $('#alert').stop(true, true).animate({ height: '0px' });
    }

    hideRobot(id) {
        $(`#${id}`).hide();
    }

    clearRobot() {
        $('#hwList').empty();
    }

    showRobot(hardware) {
        if (hardware && hardware.id) {
            $(`#${hardware.id}`).show();
        } else {
            $('.hardwareType').show();
        }
    }

    addRobot(config) {
        ui.showRobotList();

        switch (config.availableType) {
            case AvaliableType.needDownload: {
                $('#hwList').append(`
                <div class="hardwareType"
                id="${config.id}"
                style="filter: grayscale(100%); opacity: 0.5">
                    <img class="hwThumb" src="${config.image}" alt="">
                    <h2 class="hwTitle">
                        ${config.name && config.name[langType] || config.name.en || config.name}
                    </h2>
                </div>
            `);
                $(`#${config.id}`)
                    .off('click')
                    .on('click', () => {
                        router.requestDownloadModule(config);
                    });
                break;
            }
            case AvaliableType.needUpdate: {
                $('#hwList').append(`
                <div class="hardwareType" id="${config.id}">
                    <img class="hwThumb" src="../../../modules/${config.icon}" alt="">
                    <h2 class="hwTitle">
                        [업]${config.name && config.name[langType] || config.name.en}
                    </h2>
                </div>
            `);

                $(`#${config.id}`)
                    .off('click')
                    .on('click', () => {
                        router.requestDownloadModule(config);
                    });
                break;
            }
            case AvaliableType.available:
            default: {
                $('#hwList').append(`
                <div class="hardwareType" id="${config.id}">
                    <img class="hwThumb" src="../../../modules/${config.icon}" alt="">
                    <h2 class="hwTitle">
                        ${config.name && config.name[langType] || config.name.en}
                    </h2>
                </div>
            `);

                $(`#${config.id}`)
                    .off('click')
                    .on('click', () => {
                        this._showHardwareConnectingPage(config);
                        router.startScan(config);
                    });
                break;
            }
        }
    }

    flashFirmware(firmwareName) {
        if (router.currentState !== 'before_connect' && router.currentState !== 'connected') {
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
    }

    showPortSelectView(portList) {
        if (isSelectPort) {
            selectPortConnectionTimeout = setTimeout(() => {
                if (viewMode !== 'main') {
                    router.startScan(window.currentConfig);
                }
            }, 1000);
        } else {
            isSelectPort = true;
        }
        if (
            JSON.stringify(portList) !== this.cachedPortList &&
            isSelectPort &&
            viewMode !== 'main'
        ) {
            let portHtml = '';
            portList.forEach((port) => {
                portHtml +=
                    `<option title="${port.path}">${port.path}</option>`;
            });

            $('#select_port_box select').html(portHtml);
            this.cachedPortList = JSON.stringify(portList);
        }
        $('#select_port_box').css('display', 'flex');
    }

    quit() {
    }

    showIeGuide() {
        $('#errorAlert').show();
    }

    hideIeGuide() {
        $('#errorAlert').hide();
    }


    setCloudMode(isCloudMode) {
        const $cloudIcon = $('#cloud_icon');
        if (isCloudMode) {
            $cloudIcon.show();
        } else {
            $cloudIcon.hide();
        }
    }

    _showHardwareConnectingPage(hardware) {
        viewMode = hardware.id;

        isSelectPort = hardware.select_com_port ||
            hardware.hardware.type === 'bluetooth' ||
            router.cloudMode === 1 ||
            false;

        const newSelectList = priorHardwareList
            .filter((item) => item !== hardware.name.ko);

        newSelectList.push(hardware.name.ko);
        localStorage.setItem(
            'hardwareList',
            JSON.stringify(newSelectList),
        );
        priorHardwareList = newSelectList;

        const icon = `../../../modules/${hardware.icon}`;
        $('#selectedHWThumb').attr('src', icon);

        if (hardware.url) {
            const $url = $('#url');
            $url.text(hardware.url);
            $('#urlArea').show();
            $url.off('click');
            $url.on('click', () => {
                router.openExternalUrl(hardware.url);
            });
        } else {
            $('#urlArea').hide();
        }

        if (hardware.video) {
            let video = hardware.video;
            const $video = $('#video');

            if (typeof video === 'string') {
                video = [video];
            }

            $video.empty();
            video.forEach((link) => {
                $video.append(`<span>${link}</span><br/>`);
                $('#videoArea').show();
            });
            $video.off('click');
            $video.on('click', 'span', (e) => {
                const index = $('#video span').index(e.target);
                console.log(video, index, video[index]);
                router.openExternalUrl(video[index]);
            });
        } else {
            $('#videoArea').hide();
        }

        if (hardware.email) {
            const $email = $('#email');
            $email.text(hardware.email);
            $('#emailArea').show();
            $email
                .off('click')
                .on('click', () => {
                    clipboard.writeText(hardware.email);
                    alert(
                        translator.translate('Copied to clipboard'),
                    );
                });
        } else {
            $('#emailArea').hide();
        }

        $('#driverButtonSet button').remove();
        $('#firmwareButtonSet button').remove();

        if (hardware.driver) {
            if (
                $.isPlainObject(hardware.driver) &&
                hardware.driver[os]
            ) {
                const $dom = $('<button class="hwPanelBtn">');
                $dom.text(
                    translator.translate('Install Device Driver'),
                );
                $dom.prop('driverPath', hardware.driver[os]);
                $('#driverButtonSet').append($dom);
            } else if (Array.isArray(hardware.driver)) {
                hardware.driver.forEach((driver) => {
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
        if (hardware.firmware) {
            $('#firmware').show();
            if (Array.isArray(hardware.firmware)) {
                hardware.firmware.forEach((firmware) => {
                    const $dom = $('<button class="hwPanelBtn">');
                    $dom.text(
                        translator.translate(firmware.translate),
                    );
                    $dom.prop('firmware', firmware.name);
                    $dom.prop('config', hardware);
                    $('#firmwareButtonSet').append($dom);
                });
            } else {
                const $dom = $('<button class="hwPanelBtn">');
                $dom.text(translator.translate('Install Firmware'));
                $dom.prop('firmware', hardware.firmware);
                $dom.prop('config', hardware);
                $('#firmwareButtonSet').append($dom);
            }
        }

        ui.hardware = hardware.id.substring(0, 4);
        ui.numLevel = 1;
        ui.showConnecting();
        hardware.serverMode = router.serverMode;
        window.currentConfig = hardware;
    }
}();
const router = new RendererRouter(ui);
window.router = router;

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
        const hideList = router.hardwareList.filter((hardware) => {
            const en = hardware.name.en.toLowerCase();
            const ko = hardware.name.ko.toLowerCase();
            const text = searchText.toLowerCase();
            if (
                (ko.indexOf(text) > -1 || en.indexOf(text) > -1) && // 검색결과가 있는지
                (hardware.platform.indexOf(platform) > -1) && // 현재 플랫폼과 동일한지
                (currentCategory === 'all' || hardware.category === currentCategory) // 현재 카테고리에 포함되었는지
            ) {
                ui.showRobot(hardware);
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
        router.hardwareList.forEach((hardware) => {
            if (hardware.category === type) {
                ui.showRobot(hardware);
            } else {
                ui.hideRobot(hardware.id);
            }
        });
    }
}

const $body = $('body');
$body.on('keyup', (e) => {
    if (e.keyCode === 8) {
        $('#back.navigate_button.active').trigger('click');
    }
});

$body.on('click', '#back.navigate_button.active', (e) => {
    isSelectPort = true;
    window.currentConfig && delete window.currentConfig.this_com_port;
    ui.showRobotList();
});

$body.on('click', '#refresh', (e) => {
    if (
        confirm(translator.translate('Do you want to restart the program?'))
    ) {
        router.reloadApplication();
    }
});

$('.chromeButton').on('click', (e) => {
    router.openExternalUrl('https://www.google.com/chrome/browser/desktop/index.html');
});

$('#select_port').dblclick(() => {
    $('#btn_select_port').trigger('click');
});

$('#btn_select_port').click((e) => {
    const comPort = $('#select_port').val();
    if (!comPort) {
        alert(translator.translate('Select the COM PORT to connect'));
    } else {
        window.currentConfig.this_com_port = comPort[0];
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


router.getOpensourceContents().then((text) => {
    $('#opensource_content').val(text);
});

let isSelectPort = true;
let selectPortConnectionTimeout;

// configuration
router.refreshHardwareModules();
