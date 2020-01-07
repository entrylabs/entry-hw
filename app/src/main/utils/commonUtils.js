const { app } = require('electron');
const path = require('path');

class CommonUtils {
    lpad(str, len) {
        const strLen = str.length;
        let result = str;
        if (strLen < len) {
            for (let i = 0; i < len - strLen; i++) {
                result = `0${result}`;
            }
        }
        return String(result);
    };

    getPaddedVersion(version) {
        if (!version) {
            return '';
        }
        const versionStr = String(version);

        const padded = [];
        const splitVersion = versionStr.split('.');
        splitVersion.forEach((item) => {
            padded.push(this.lpad(item, 4));
        });

        return padded.join('.');
    }

    getArgsParseData(argv) {
        const regexRoom = /roomId:(.*)/;
        const arrRoom = regexRoom.exec(argv) || ['', ''];
        let roomId = arrRoom[1];

        if (roomId === 'undefined') {
            roomId = '';
        }

        return roomId.replace(/\//g, '');
    }

    getExtraDirectoryPath(target) {
        const asarIndex = app.getAppPath().indexOf(`${path.sep}app.asar`);
        const isInAsar = asarIndex > -1;

        return {
            driver: {
                dev: path.resolve(__dirname, '..', '..', '..', 'drivers'),
                prod: path.join(app.getAppPath(), '..', 'drivers'),
            },
            firmware: {
                dev: path.resolve(__dirname, '..', '..', '..', 'firmwares'),
                prod: path.join(app.getAppPath(), '..', 'firmwares'),
            },
            modules: {
                dev: path.resolve(__dirname, '..', '..', '..', 'modules'),
                prod: path.join(app.getAppPath(), '..', 'modules'),
            },
        }[target][isInAsar ? 'prod' : 'dev'];
    }
}

module.exports = new CommonUtils();
