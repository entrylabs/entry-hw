const inquirer = require('inquirer');
const _ = require('lodash');
const path = require('path');
const fs = require('fs').promises;
const serialport = require('serialport');

const SerialScanner = require('../app/src/main/serial/scanner');
const SerialConnector = require('../app/src/main/serial/connector');

const dummyRouter = {
    setHandlerData: () => {},
    sendEncodedDataToServer: () => {},
    sendState: (state) => {
        consoleWrite(`router ${state} called`);

        if (state === 'connected') {
            consoleWrite('connection test completed. test will be close after 3 second.');
            setTimeout(() => {
                process.exit(0);
            }, 3000);
        }
    },
};

const modulesDirPath = path.join(__dirname, '..', 'app', 'modules');
const isDebugMode = process.argv.some((arg) => arg === '--verbose');

const printError = (e, msg) => {
    if (isDebugMode) {
        console.error(e);
    }
    console.error(msg);
};

const consoleWrite = (msg) => {
    const ANSIGreen = '\x1b[32m';
    const ANSIReset = '\x1b[0m';
    const ANSIBoldOn = '\x1b[1m';
    const ANSIBoldOff = '\x1b[22m';
    console.log(`${ANSIGreen}? ${ANSIReset}${ANSIBoldOn}${msg}${ANSIBoldOff}`);
};

const stdoutWrite = (msg) => {
    const ANSIGreen = '\x1b[32m';
    const ANSIReset = '\x1b[0m';
    const ANSIBoldOn = '\x1b[1m';
    const ANSIBoldOff = '\x1b[22m';
    process.stdout.write(`${ANSIGreen}? ${ANSIReset}${ANSIBoldOn}${msg}${ANSIBoldOff}\r`);
};

const resetableStdoutWrite = (clear, multiLineMessage) => {
    clear && process.stdout.clearScreenDown();
    multiLineMessage.forEach((msg) => {
        process.stdout.write(msg);
        process.stdout.write('\n');
    });
    process.stdout.moveCursor(0, -1 * multiLineMessage.length);
    process.stdout.cursorTo(0);
    process.stdout.clearScreenDown();
};

/*
해야할일
1. 인자로서 모듈명을 받는다
2. 모듈명으로 json 파일을 찾는다
3. 찾은 파일을 config 으로 등록한다
4. 포트를 스캔한다
5. 포트스캔 하고 scanner 에서 선택된 친구는 노란색으로 표기한다
6.
 */
const getHardwareConfig = async () => {
    const { question: answer } = await inquirer.prompt([{
        name: 'question',
        message: 'Select Module JSON file name',
        default: 'arduinoExt',
    }]);
    try {
        const fileBuffer = await fs.readFile(path.join(modulesDirPath, `${answer}.json`));
        return JSON.parse(fileBuffer.toString());
    } catch (e) {
        printError(e, 'JSON file not found!');
    }
};

const getHardwareModule = (config) => {
    try {
        if (config) {
            return require(`../app/modules/${config.module}`);
        }
    } catch (e) {
        printError(e, 'module js file not found!\nif exists, probably \'module\' property is not present');
    }
};

const getComPort = async (config) => {
    const scanner = new SerialScanner();
    let selectedPort = undefined;

    while (!selectedPort) {
        const portList = await serialport.list();

        // see serial/scanner.js#L104
        const selectedPorts = [];
        selectedPorts.push(
            ..._.compact(
                portList.map((port) => scanner._selectCOMPortUsingProperties(config.hardware, port)),
            ));

        const message = selectedPorts.length
            ? `Select COM Port\n  Auto Selected Port is ${selectedPorts.join(',')}`
            : 'Select COM Port';

        const { question: answer } = await inquirer.prompt([{
            type: 'list',
            name: 'question',
            message,
            choices: [
                ...portList.map((port) => port.path),
                new inquirer.Separator(),
                'rescan',
            ],
        }]);

        if (answer !== 'rescan') {
            selectedPort = portList.find((port) => port.path === answer);
        }
    }

    return selectedPort;
};

const initializeConnector = async (connector) => {
    let requestInitialDataCount = 0;
    const getMessage = () => `requestInitialData count: ${requestInitialDataCount}`;

    // inject logger function into requestInitialData
    const originalRequestInitialData = connector.hwModule.requestInitialData.bind(connector.hwModule);
    connector.hwModule.requestInitialData = (serialPort) => {
        requestInitialDataCount++;
        stdoutWrite(getMessage());
        return originalRequestInitialData(serialPort);
    };
    await connector.initialize();
    consoleWrite('Connector initialize success');
};

// main code
(async () => {
    const config = await getHardwareConfig() || (process.exit(0));
    const hwModule = getHardwareModule(config) || (process.exit(0));
    const comPort = await getComPort(config) || (process.exit(0));

    try {
        const connector = new SerialConnector(hwModule, config.hardware);
        const serialPort = await connector.open(comPort.path);
        connector.setRouter(dummyRouter);
        consoleWrite(`SerialPort connector opened ${comPort.path}`);

        await initializeConnector(connector);

        // mainRouter._connect()
        if (connector.executeFlash) {
            consoleWrite('Entry hardware will be execute Flash (from firmwarecheck property)');
        }
        connector.connect();
    } catch (e) {
        printError(e, 'serial connector throw error');
        process.exit(-1);
    }
})();
