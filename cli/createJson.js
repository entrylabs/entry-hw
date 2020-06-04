const inquirer = require('inquirer');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const template = {
    id: 'FF0101',
    moduleName: '',
    version: '',
    name: { ko: '', en: '' },
    category: '',
    platform: [],
    icon: '',
    module: '',
    url: '',
    email: '',
    reconnect: false,
    selectPort: false,
    hardware: {},
};

(async () => {
    const result = await inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'input module\'s unique ID',
            default: 'FF0101',
        },
        {
            type: 'input',
            name: 'moduleName',
            message: 'input module\'s distinguished name (it used filename)',
            validate: (name) => !!name,
        },
        {
            type: 'input',
            name: 'name.ko',
            message: 'input module\'s notation name (korean)',
            validate: (name) => !!name,
        },
        {
            type: 'input',
            name: 'name.en',
            message: 'input module\'s notation name (english)',
            validate: (name) => !!name,
        },
        {
            type: 'list',
            name: 'category',
            message: 'Which module type is ?',
            choices: ['board', 'module', 'robot'],
        },
        {
            type: 'input',
            name: 'url',
            message: 'input your url',
        },
        {
            type: 'input',
            name: 'email',
            message: 'input your email',
        },
        {
            type: 'checkbox',
            name: 'platform',
            message: 'which platform device can be executed ?',
            default: ['win32'],
            choices: ['win32', 'darwin'],
        },
        {
            type: 'confirm',
            name: 'selectPort',
            message: 'need COM port selection popup ?',
            default: false,
        },
        {
            type: 'confirm',
            name: 'reconnect',
            message: 'need reconnection after device lost ?',
            default: false,
        },
        {
            type: 'list',
            name: 'hardware.control',
            message: 'select device control type',
            default: 'slave',
            choices: ['slave', 'master'],
        },
        {
            type: 'number',
            name: 'hardware.duration',
            message: 'select device request sending duration',
            default: 64,
            when: (answer) => answer.hardware.control === 'slave',
        },
        {
            type: 'number',
            name: 'hardware.baudRate',
            message: 'input baudRate',
            default: 115200,
        },
        {
            type: 'confirm',
            name: 'hardware.firmwarecheck',
            message: 'need firmware check when device can\'t connect while 3 second ?',
            default: false,
        },
    ]);

    // modify configs
    result.url || (delete result.url);
    result.email || (delete result.email);
    result.icon = `${result.name.en}.png`;
    result.module = `${result.name.en}.js`;
    result.version = '0.0.1';

    const orderedResult = _.assign(template, result);

    const targetPath = path.join(__dirname, '..', 'app', 'modules', `${orderedResult.moduleName}.json`);
    fs.writeFileSync(targetPath, JSON.stringify(orderedResult, null, 4));

    console.log(`result is \n${orderedResult}`);
    console.log(`\x1b[34mJSON config file is created at ${targetPath}\x1b[0m`);
    console.log('\x1b[31mif you need support install driver or firmware, please input driver/firmware property manually\x1b[0m');

    console.log('Please see Entry Docs for additional setting information');
    console.log('https://entrylabs.github.io/docs/guide/entry-hw/2016-05-03-add_module.html#json-파일생성');
})();

// icon, module = moduleName
// driver,firmware 는 직접

