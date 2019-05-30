class commonUtils {
    /**
     * asar.unpack 대응. 특정 path 가 asar pack 되어있는 경우,
     * asar.unpack 경로로 변경해준다.
     * 개발시에는 asar 가 아니므로 적용되지 않는다.
     * @file electron-builder.json
     * @param targetPath {string}
     * @returns {string} app.asar -> app.asar.unpacked 로 치환된 경로
     */
    static getAsarUnpackPath(targetPath) {
        const asarIndex = targetPath.indexOf('app.asar');
        if (asarIndex > -1) {
            return targetPath.replace('app.asar', 'app.asar.unpacked');
        } else {
            return targetPath;
        }
    }

    static lpad(str, len) {
        const strLen = str.length;
        let result = str;
        if (strLen < len) {
            for (let i = 0; i < len - strLen; i++) {
                result = `0${result}`;
            }
        }
        return String(result);
    };

    static getPaddedVersion(version) {
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

    static getArgsParseData(argv) {
        const regexRoom = /roomId:(.*)/;
        const arrRoom = regexRoom.exec(argv) || ['', ''];
        let roomId = arrRoom[1];

        if (roomId === 'undefined') {
            roomId = '';
        }

        return roomId.replace(/\//g, '');
    }
}

module.exports = commonUtils;
