class JsonHandler {
    id: string;
    data: any;

    constructor(id: string) {
        this.id = id;
        this.data = {
            version: 0x01,
            network: 0x00,
            protocol: 'json',
        };

        const data = this.data;
        let str = id.slice(0, 2); // company id
        data.company = parseInt(str, 16) & 0xff;
        str = id.slice(2, 4); // model id
        data.model = parseInt(str, 16) & 0xff;
        str = id.slice(4, 6); // variation id
        data.variation = parseInt(str, 16) & 0xff;
    }

    encode() {
        return this.data;
    }

    decode(data: any) {
        try {
            this.data = JSON.parse(data);
        } catch (e) {
            // nothing to do
        }
    }

    e(key: any) {
        const data = this.data;
        if (data) {
            const value = data[key];
            if (value != undefined) {
                return true;
            }
        }
        return false;
    }

    read(key: any) {
        const data = this.data;
        if (data) {
            const value = data[key];
            if (value != undefined) {
                return value;
            }
        }
        return 0;
    }

    write(key: any, value: any) {
        const data = this.data;
        if (data) {
            data[key] = value;
            return true;
        }
        return false;
    }
}

export const create: (string: string) => JsonHandler = (id: string) => new JsonHandler(id);
