'use strict';

const path = require('path');
const Modal = require('./src/modal/app.js').default;
window.$ = window.jQuery = require('./src/js/jquery-1.11.3.min.js');
// language
var translator = require('./custom_modules/translator');
var lang = translator.getLanguage();
window.Lang = require(path.resolve(__dirname, 'src', 'lang', lang + '.js')).Lang;
