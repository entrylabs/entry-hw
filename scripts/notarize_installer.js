const path = require('path');
const notarize = require('./notarize');

module.exports = async (context) => {
    const { artifactPaths } = context;
    const { APPLE_ID, APPLE_PASSWORD, TEAM_ID } = process.env;

    return await Promise.all(artifactPaths.map(async (artifactPath) => {
        if (path.extname(artifactPath) === '.pkg') {
            return await notarize({
                appBundleId: 'org.playentry.entryhw',
                appPath: artifactPath,
                appleId: APPLE_ID,
                teamId: TEAM_ID,
                appleIdPassword: APPLE_PASSWORD,
            });
        }
    }));
};
