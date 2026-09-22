const aluxTechnicBase = require('./alux_technic_base');

class AluxTechnicPower extends aluxTechnicBase {
    constructor() { 
        super();

        this.target_sApp = 0x22;
    }
}

module.exports = new AluxTechnicPower();