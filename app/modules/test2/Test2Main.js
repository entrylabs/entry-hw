const BaseModule = require('../baseModule');

class Test2Main extends BaseModule {
    constructor() {
        super();
        this.test = true;
    }
}

module.exports = new Test2Main();
