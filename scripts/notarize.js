const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    const { NOTARIZE, APPLE_ID, APPLE_PASSWORD } = process.env;

    if (electronPlatformName !== 'darwin') {
        return;
    }

    // noinspection EqualityComparisonWithCoercionJS
    if (NOTARIZE == 'false') {
        console.log('  • NOTARIZE flag is false. will be skipped this process');
        return;
    }

    if (!APPLE_ID || !APPLE_PASSWORD) {
        console.log('  • APPLE_ID or APPLE_PASSWORD not found. will be skipped this process');
        return;
    }

    const appName = context.packager.appInfo.productFilename;

    console.log('  • Apple Notarizing...');
    console.log(`  • appBundleId: org.playentry.entryhw
    appPath: ${appOutDir}/${appName}.app
    appleId: ${APPLE_ID}`,
    );
    return await notarize({
        appBundleId: 'org.playentry.entryhw',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: APPLE_ID,
        appleIdPassword: APPLE_PASSWORD,
    });
};
