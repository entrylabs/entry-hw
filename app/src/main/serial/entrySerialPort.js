const SerialPort = require('@serialport/stream');
const Readline = require('@serialport/parser-readline'); // modify
const Delimiter = require('@serialport/parser-delimiter');

SerialPort.Binding = require('@serialport/bindings');

/**
 * 시리얼포트 객체를 생성한다.
 * 엔트리 하드웨어 모듈의 json 설정에 따라 기본설정을 주입한다.
 *
 * 단일객체이므로 사용시에는 generate 함수 하나만 사용한다.
 */
class EntrySerialPort {
    /**
     *
     * @param port {string} 포트명
     * @param hardwareOptions {Object} module.json#hardware property
     * @returns {Promise<SerialPort>}
     */
    generate(port, hardwareOptions) {
        return new Promise(((resolve, reject) => {
            const serialPort = new SerialPort(port, this._makeSerialPortOptions(hardwareOptions));

            const { delimiter, byteDelimiter } = hardwareOptions;
            if (delimiter) {
                serialPort.parser = serialPort.pipe(new Readline({ delimiter }));
            } else if (byteDelimiter) {
                serialPort.parser = serialPort.pipe(new Delimiter({
                    delimiter: byteDelimiter,
                    includeDelimiter: true,
                }));
            }

            serialPort.on('error', reject);
            serialPort.on('open', (error) => {
                serialPort.removeAllListeners('open');
                if (error) {
                    reject(error);
                } else {
                    resolve(serialPort);
                }
            });
        }));
    }

    _makeSerialPortOptions(serialPortOptions) {
        const _options = {
            autoOpen: true,
            baudRate: 9600,
            parity: 'none',
            dataBits: 8,
            stopBits: 1,
            bufferSize: 65536,
        };

        if (serialPortOptions.flowControl === 'hardware') {
            _options.rtscts = true;
        } else if (serialPortOptions.flowControl === 'software') {
            _options.xon = true;
            _options.xoff = true;
        }

        Object.assign(_options, serialPortOptions);
        return _options;
    }
}

module.exports = new EntrySerialPort();
