const {
	TelliotBase,
	Loglevel,
	TelliotEvent
} = require('./Telliot_Base');

class TelliotLite extends TelliotBase {
	constructor () {
		super();
	}

    // ��Ʈ�� �������� ����Ǿ����� ȣ���
    init(handler, config) {
		super.init(handler, config);
    }

    // ���� ����õ�(handshake) ���� �Ŀ� ȣ���
    setSerialPort(sp) {
		super.setSerialPort(sp);
    }

    // ���� ����õ��� ����̽��� ���� ������. checkInitialData �� ����Ǿ��ִٸ� �ʼ�
    requestInitialData() {
        return super.requestInitialData();
    }

    // ���� ����õ����� ����̽��� �����͸� �޾�, ���ϴ� �����Ͱ� �´��� �Ǵ��ϴ� ����
    // requestInitialData �� ����Ǿ��ִٸ� �ʼ�
    checkInitialData(data, config) {
        return super.checkInitialData(data, config);
    }

    // �ش� �Լ��� �����ϸ�, ����̽����� �����͸� �޾ƿ� �� validate �� ��ģ��. ������ �״�� ó���������� �����Ѵ�.	
    validateLocalData(data) {
        return super.validateLocalData(data);
    }
	
    // ����̽����� �����͸� �޾ƿ� ��, �������� �����͸� ������ ���� ȣ��Ǵ� ����. handler �� �����ϴ� ������ ���� ���� �� �ִ�.
    // handler.write(key, value) �� ������ ���� Entry.hw.portData ���� �޾ƺ� �� �ִ�.
    requestRemoteData(handler) {
		super.requestRemoteData(handler);
    }

    // ��Ʈ�� ���������� �� �����͸� ó���Ѵ�. handler.read �� �������� �����͸� �о�� �� �ִ�.
    // handler �� ���� Entry.hw.sendQueue �� ������ ���� ����.	
    handleRemoteData(handler) {
		super.handleRemoteData(handler);
    }

    // ����̽��� �����͸� ������ ����. control: slave �� ��� duration �ֱ⿡ ���� ����̽��� �����͸� ������.
    // return ������ ���۸� ��ȯ�ϸ� ����̽��� �����͸� ������, �Ƶ��̳��� ��� ���Ž� �ڵ带 ������ �ִ�.	
    requestLocalData() {
        return super.requestLocalData();
    }

	// ����̽����� �� �����͸� ó���ϴ� ����. ���⼭�� ó���� �����Ͱ� ���� ��ŵ�Ͽ���.
    handleLocalData(data) {
		super.handleLocalData(data);
    }

    // Ŀ���Ͱ� ���������� �� ȣ��Ǵ� ����, ��ĵ ���� Ȥ�� ����̽� ���� ������ ȣ��ȴ�.
    disconnect(connector) {
		super.disconnect(connector);
    }

    // ��Ʈ�� ���������� ���� ������ �������� �� �߻��ϴ� ����.
    reset() {
		super.reset();
    }
}

module.exports = new TelliotLite();