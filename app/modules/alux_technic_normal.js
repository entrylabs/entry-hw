const aluxTechnicBase = require('./alux_technic_base');

class AluxTechnicNormal extends aluxTechnicBase {
    constructor() { 
        super();

        this.target_sApp = 0x12;
    }
}

module.exports = new AluxTechnicNormal();
