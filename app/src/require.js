'use strict';

const { ipcRenderer, shell, clipboard, remote } = require('electron');
const path = require('path');
const sharedObject = remote.getGlobal('sharedObject');
var selectedList = JSON.parse(localStorage.getItem('hardwareList'));
window.$ = window.jQuery = require('./src/js/jquery-1.11.3.min.js');
var NODE_ENV = process.env.NODE_ENV || 'production';
var lastCheckVersion = localStorage.getItem('lastCheckVersion');
var newVersion = localStorage.getItem('isNewVersion');

if(sharedObject.appName === 'hardware') {
    if(newVersion) {
        localStorage.removeItem('isNewVersion')
        alert('업데이트 하자');
    } else {
        ipcRenderer.on('checkUpdateResult', (e, { isNewVersion, version } = {}) => {
            if (isNewVersion && version != lastCheckVersion) {
                localStorage.setItem('isNewVersion', version);
                localStorage.setItem('lastCheckVersion', version);
            }
        });
        ipcRenderer.send('checkUpdate');
    }
}