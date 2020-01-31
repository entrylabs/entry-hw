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
}

module.exports = new CommonUtils();
