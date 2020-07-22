class CommonUtils {
    lpad(str: string, len: number) {
        const strLen = str.length;
        let result = str;
        if (strLen < len) {
            for (let i = 0; i < len - strLen; i++) {
                result = `0${result}`;
            }
        }
        return String(result);
    };

    getPaddedVersion(version: string) {
        if (!version) {
            return '';
        }
        const versionStr = String(version);

        const padded: string[] = [];
        const splitVersion = versionStr.split('.');
        splitVersion.forEach((item) => {
            padded.push(this.lpad(item, 4));
        });

        return padded.join('.');
    }

    getArgsParseData(argv: string) {
        console.log('argv', argv);

        const arrRoom = /roomId:(.*)/.exec(argv) || ['', ''];
        let roomId = arrRoom[1];

        if (roomId === 'undefined') {
            roomId = '';
        }

        const regexHardwareId = /openHardwareId:([^&]*)/.exec(argv) || ['', ''];
        let openHardwareId = regexHardwareId[1];

        if (openHardwareId === 'undefined') {
            openHardwareId = '';
        }

        return { roomId: roomId.replace(/\//g, ''), openHardwareId };
    }
}

export default new CommonUtils();
