const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
        appBundleId: 'org.playentry.entryhw',
        appPath: `${appOutDir}/${appName}.app`,
        // appleId: 'Apple Developer ID',
        // appleIdPassword: 'Apple Developer's App Password (check Security tab)',
    });
};
