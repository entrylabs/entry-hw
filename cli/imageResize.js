const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const fsp = fs.promises;

(async () => {
    const moduleDirPath = path.join(__dirname, '..', 'app', 'modules');
    const imageFiles = (await fsp.readdir(moduleDirPath)).filter((fileName) => fileName.endsWith('.png'));

    await Promise.all(imageFiles.map(
        async (imageFile) => {
            const filePath = path.join(moduleDirPath, imageFile);
            const metadata = await sharp(filePath).metadata();
            if (metadata.width > 150) {
                const result = await sharp(filePath).resize(120, 120, {
                    withoutEnlargement: true,
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 },
                }).png().toBuffer();
                await fsp.writeFile(filePath, result);
                console.log(`${filePath} is resized`);
            }
        },
    ));
})();

