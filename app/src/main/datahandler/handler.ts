import * as ByteArrayHandler from './bytearray';
import * as JsonHandler from './json';

class Handler {
    config: HardwareModuleOptions;
    sendHandler: any;
    receiveHandler: any;

    constructor(config: HardwareModuleOptions) {
        this.config = config;
        switch (config.entry.protocol) {
            case 'bytearray': {
                this.sendHandler = ByteArrayHandler.create(config.id, config.entry.bufferSize || config.entry.buffersize);
                break;
            }
            case 'json': {
                this.sendHandler = JsonHandler.create(config.id);
                break;
            }
        }
    }

    encode() {
        if (this.sendHandler) {
            return this.sendHandler.encode();
        }
    };

    decode(data: any, type: any) {
        if (type == 'binary') {
            if (data[1] != 0x00) {
                if (!this.receiveHandler) {
                    if (data[5] === 0x01) {
                        this.receiveHandler = ByteArrayHandler.create(this.config.id);
                    }
                }
                if (this.receiveHandler) {
                    this.receiveHandler.decode(data);
                }
            }
        } else if (type == 'utf8') {
            if (!this.receiveHandler) {
                this.receiveHandler = JsonHandler.create(this.config.id);
            }
            if (this.receiveHandler) {
                this.receiveHandler.decode(data);
            }
        }
    }

    e(arg: any) {
        if (this.receiveHandler) {
            return this.receiveHandler.e(arg);
        }
        return false;
    }

    read(arg: any) {
        if (this.receiveHandler) {
            return this.receiveHandler.read(arg);
        }
        return 0;
    }

    write(arg1: any, arg2: any) {
        if (this.sendHandler) {
            return this.sendHandler.write(arg1, arg2);
        }
        return false;
    }
}

export const create: (config: string) => Handler = (config: string) => new Handler(config);
