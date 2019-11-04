'use strict';
const {
    clipboard, rendererRouter, constants, translator, os,
} = window;

$('#firmwareButtonSet').on('click', 'button', function() {
    // 여기서의 this 는 $dom 의 props 이다. arrow function 금지
    ui.flashFirmware(this.firmware);
});

const ui = new class {
    showConnecting() {
        this.showAlert(
            translator.translate('Connecting to hardware device.'),
        );
    }

    showConnected() {
        this.showAlert(
            translator.translate('Connected to hardware device.'),
            2000,
        );
    }

    showDisconnected() {
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
}();
const router = rendererRouter;
window.ui = ui;

const $body = $('body');
$body.on('keyup', (e) => {
    if (e.keyCode === 8) {
        $('#back.active').trigger('click');
    }
});
