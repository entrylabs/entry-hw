'use strict';

const { ipcRenderer, shell, clipboard, remote } = require('electron');
const path = require('path');
const sharedObject = remote.getGlobal('sharedObject');
var selectedList = JSON.parse(localStorage.getItem('hardwareList'));
const Modal = require('./src/modal/app.js').default;
window.$ = window.jQuery = require('./src/js/jquery-1.11.3.min.js');
var NODE_ENV = process.env.NODE_ENV || 'production';
var lastCheckVersion = localStorage.getItem('lastCheckVersion');
var hasNewVersion = localStorage.getItem('hasNewVersion');
// language
var translator = require('./custom_modules/translator');
var lang = translator.getLanguage();
window.Lang = require(path.resolve(__dirname, 'src', 'lang', lang + '.js')).Lang;
