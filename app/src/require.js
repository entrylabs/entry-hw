'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const shell = require('shell');
const path = require('path');
var selectedList = JSON.parse(localStorage.getItem('hardwareList'));
window.$ = window.jQuery = require('./src/js/jquery-1.11.3.min.js');
var NODE_ENV = process.env.NODE_ENV || 'production';