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
}

module.exports = commonUtils;
