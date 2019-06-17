/**
 * ./dist 와 ./app/src/renderer 를 제외한 ts 파일 결과물을 전부 삭제한다.
 * @author extracold1209
 * @since 2019-06
 * @version 0.0.1
 */
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');

const cleanDistDirectory = () => {
    const distDirectoryPath = path.resolve(__dirname, '..', 'dist');
    rimraf.sync(distDirectoryPath);
};

const getFileListFromPath = (directoryPath) => {
    if (!fs.existsSync(directoryPath)) {
        return [];
    }

    const files = fs.readdirSync(directoryPath);
    const result = [];

    files.forEach((filename) => {
        const filePath = path.join(directoryPath, filename);
        if (fs.lstatSync(filePath).isDirectory()) {
            result.push(...getFileListFromPath(filePath));
        } else if (!filename.match(/\.tsx?$/)) {
            result.push(filePath);
        }
    });

    return result;
};

const cleanJsFiles = (startPath) => {
    const files = getFileListFromPath(startPath);
    files.forEach((filePath) => {
        console.log(`delete ${filePath}...`);
        fs.unlinkSync(filePath);
    });
};

(function() {
    console.log('clean dist directory..');
    cleanDistDirectory();
    console.log('dist directory removed.');

    console.log('clean main source\'s js files..');
    const mainSourceDirectoryPath = path.resolve(__dirname, '..', 'app', 'src', 'main');
    const commonSourceDirectoryPath = path.resolve(__dirname, '..', 'app', 'src', 'common');
    cleanJsFiles(mainSourceDirectoryPath);
    cleanJsFiles(commonSourceDirectoryPath);

    console.log('exit successfully');
})();
