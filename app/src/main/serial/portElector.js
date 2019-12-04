class PortElector {
    /**
     * @param ports {string[]}
     */
    constructor(ports) {
        if (!ports || !(ports instanceof Array)) {
            throw new Error('port array must be present');
        }

        /**
         * @type {string[]}
         */
        this.ports = ports;

        /**
         * @type {{port: string, connector: Object}}
         */
        this.connectors = {};
    }

    _generateInitializePromises() {

    }

    _runAsMster() {

    }
}
