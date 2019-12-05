const BaseModule = require('./baseModule');

class Test extends BaseModule {
    checkInitialData(data) {
        return true;
    }
}

module.exports = new Test();
