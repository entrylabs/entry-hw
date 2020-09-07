const fs = require('fs');
const crypto = require('crypto');

module.exports = async (context) => {
    const { appOutDir, electronPlatformName } = context;

    let targetPath = '';
    if (electronPlatformName === 'darwin') {
        const appName = context.packager.appInfo.productFilename;
        targetPath = `${appOutDir}/${appName}.app/Contents/Resources/app.asar`;
    } else {
        targetPath = `${appOutDir}/resources/app.asar`;
    }

    if (fs.existsSync(targetPath)) {
        await new Promise((resolve) => {
            const checksum = crypto.createHash('sha1');
            const readStream = fs.createReadStream(targetPath);
            readStream.on('data', (data) => {
                checksum.update(data);
            });
            readStream.on('end', () => {
                console.log(`  • app.asar checksum: ${checksum.digest('hex')}`);
                resolve();
            });
            readStream.on('error', () => {
                console.log('  • extract checksum from app.asar is failed');
                resolve();
            });
        });
    } else {
        console.log('app.asar is not found');
    }
};
