function Module() {
    this.digitalValue = new Array(14);
    this.analogValue = new Array(6);

    this.remoteDigitalValue = new Array(14);
    this.readablePorts = null;
    this.remainValue = null;
}

Module.prototype.init = function(handler, config) {};

Module.prototype.requestInitialData = function() {
    return null;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.handleRemoteData = function(handler) {
    this.readablePorts = handler.read('readablePorts');
    const digitalValue = this.remoteDigitalValue;
    for (let port = 0; port < 14; port++) {
        digitalValue[port] = handler.read(port);
    }
};

Module.prototype.requestLocalData = function() {
    const queryString = [];

    const readablePorts = this.readablePorts;
    if (readablePorts) {
        for (const i in readablePorts) {
            const query = (5 << 5) + (readablePorts[i] << 1);
            queryString.push(query);
        }
    }
    const readablePortsValues =
        (readablePorts && Object.values(readablePorts)) || [];
    const digitalValue = this.remoteDigitalValue;
    for (let port = 0; port < 14; port++) {
        if (readablePortsValues.indexOf(port) > -1) {
            continue;
        }
        const value = digitalValue[port];
        if (value === 255 || value === 0) {
            const query = (7 << 5) + (port << 1) + (value == 255 ? 1 : 0);
            queryString.push(query);
        } else if (value > 0 && value < 255) {
            let query = (6 << 5) + (port << 1) + (value >> 7);
            queryString.push(query);
            query = value & 127;
            queryString.push(query);
        }
    }
    return queryString;
};

Module.prototype.handleLocalData = function(data) {
    const pointer = 0;
    for (let i = 0; i < 32; i++) {
        let chunk;
        if (!this.remainValue) {
            chunk = data[i];
        } else {
            chunk = this.remainValue;
            i--;
        }
        if (chunk >> 7) {
            if ((chunk >> 6) & 1) {
                const nextChunk = data[i + 1];
                if (!nextChunk && nextChunk !== 0) {
                    this.remainValue = chunk;
                } else {
                    this.remainValue = null;

                    const port = (chunk >> 3) & 7;
                    this.analogValue[port] =
                        ((chunk & 7) << 7) + (nextChunk & 127);
                }
                i++;
            } else {
                const port = (chunk >> 2) & 15;
                this.digitalValue[port] = chunk & 1;
            }
        }
    }
};

Module.prototype.requestRemoteData = function(handler) {
    for (let i = 0; i < this.analogValue.length; i++) {
        const value = this.analogValue[i];
        handler.write('a${i}', value);
    }
    for (let i = 0; i < this.digitalValue.length; i++) {
        const value = this.digitalValue[i];
        handler.write(i, value);
    }
};

Module.prototype.reset = function() {};

module.exports = new Module();
