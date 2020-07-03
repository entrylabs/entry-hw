const notarize = require('./notarize');

module.exports = async function notarizing(context) {
    const { appOutDir } = context;
    const { electronPlatformName } = context;
    const { APPLE_ID, APPLE_PASSWORD } = process.env;

    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
        appBundleId: 'org.playentry.entryhw',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: APPLE_ID,
        appleIdPassword: APPLE_PASSWORD,
    });
};
