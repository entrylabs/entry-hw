const fs = require('fs');
const { app } = require('electron');
const path = require('path');

module.exports = class {
    constructor(router) {
        this.moduleBasePath = path.resolve(app.getAppPath(), __dirname, '..', '..', 'modules');
        this.allHardwareList = [];
        this.router = router;
        this.initialize();
        this.notifyHardwareListChanged();
    }

    /**
     * 파일을 읽어와 리스트에 작성한다.
     */
    initialize() {
        // noinspection JSCheckFunctionSignatures
        try {
            fs.readdirSync(this.moduleBasePath)
                .filter((file) => !!file.match(/\.json$/))
                .map((file) => fs.readFileSync(path.join(this.moduleBasePath, file)))
                .map(JSON.parse)
                .filter((config) => config.platform &&
                    config.platform.indexOf(process.platform) > -1)
                .sort((left, right) => {
                    const lName = left.name.ko.trim();
                    const rName = right.name.ko.trim();

                    if (lName > rName) {
                        return 1;
                    } else if (lName < rName) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .forEach((config) => this.allHardwareList.push(config));
        } catch (e) {
            console.error('error occurred while reading module json files');
        }
    }

    notifyHardwareListChanged() {
        this.router &&
        this.router.sendEventToMainWindow('hardwareListChanged');
    }
};
