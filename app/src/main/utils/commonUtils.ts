function lpad(str: string, len: number) {
    const strLen = str.length;
    if (strLen < len) {
        for (let i = 0; i < len - strLen; i++) {
            str = `0${str}`;
        }
    }
    return String(str);
}

export function getPaddedVersion(version: number | string) {
    if (!version) {
        return '';
    }
    version = String(version);

    const padded: string[] = [];
    const splitVersion = version.split('.');
    splitVersion.forEach((item) => {
        padded.push(lpad(item, 4));
    });

    return padded.join('.');
}

export function getArgsParseData(argv: any) {
    const regexRoom = /roomId:(.*)/;
    const arrRoom = regexRoom.exec(argv) || ['', ''];
    let roomId = arrRoom[1];

    if (roomId === 'undefined') {
        roomId = '';
    }

    return roomId.replace(/\//g, '');
}
