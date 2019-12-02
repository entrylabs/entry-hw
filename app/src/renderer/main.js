'use strict';
const {
    clipboard, rendererRouter, constants, translator, os,
} = window;

const $body = $('body');
$body.on('keyup', (e) => {
    if (e.keyCode === 8) {
        $('#back.active').trigger('click');
    }
});
