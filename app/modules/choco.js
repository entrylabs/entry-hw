const _ = global.$;
const BaseModule = require('./baseModule');

class Choco extends BaseModule {
    /***************************************************************************************
     *  클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
     ***************************************************************************************/
    // #region Constructor
    constructor() {
        super();

        this.log('BASE - constructor()');
        
        this.crctab16 = new Uint16Array([
            0X0000, 0X1189, 0X2312, 0X329B, 0X4624, 0X57AD, 0X6536, 0X74BF,
            0X8C48, 0X9DC1, 0XAF5A, 0XBED3, 0XCA6C, 0XDBE5, 0XE97E, 0XF8F7,
            0X1081, 0X0108, 0X3393, 0X221A, 0X56A5, 0X472C, 0X75B7, 0X643E,
            0X9CC9, 0X8D40, 0XBFDB, 0XAE52, 0XDAED, 0XCB64, 0XF9FF, 0XE876,
            0X2102, 0X308B, 0X0210, 0X1399, 0X6726, 0X76AF, 0X4434, 0X55BD,
            0XAD4A, 0XBCC3, 0X8E58, 0X9FD1, 0XEB6E, 0XFAE7, 0XC87C, 0XD9F5,
            0X3183, 0X200A, 0X1291, 0X0318, 0X77A7, 0X662E, 0X54B5, 0X453C,
            0XBDCB, 0XAC42, 0X9ED9, 0X8F50, 0XFBEF, 0XEA66, 0XD8FD, 0XC974,
            0X4204, 0X538D, 0X6116, 0X709F, 0X0420, 0X15A9, 0X2732, 0X36BB,
            0XCE4C, 0XDFC5, 0XED5E, 0XFCD7, 0X8868, 0X99E1, 0XAB7A, 0XBAF3,
            0X5285, 0X430C, 0X7197, 0X601E, 0X14A1, 0X0528, 0X37B3, 0X263A,
            0XDECD, 0XCF44, 0XFDDF, 0XEC56, 0X98E9, 0X8960, 0XBBFB, 0XAA72,
            0X6306, 0X728F, 0X4014, 0X519D, 0X2522, 0X34AB, 0X0630, 0X17B9,
            0XEF4E, 0XFEC7, 0XCC5C, 0XDDD5, 0XA96A, 0XB8E3, 0X8A78, 0X9BF1,
            0X7387, 0X620E, 0X5095, 0X411C, 0X35A3, 0X242A, 0X16B1, 0X0738,
            0XFFCF, 0XEE46, 0XDCDD, 0XCD54, 0XB9EB, 0XA862, 0X9AF9, 0X8B70,
            0X8408, 0X9581, 0XA71A, 0XB693, 0XC22C, 0XD3A5, 0XE13E, 0XF0B7,
            0X0840, 0X19C9, 0X2B52, 0X3ADB, 0X4E64, 0X5FED, 0X6D76, 0X7CFF,
            0X9489, 0X8500, 0XB79B, 0XA612, 0XD2AD, 0XC324, 0XF1BF, 0XE036,
            0X18C1, 0X0948, 0X3BD3, 0X2A5A, 0X5EE5, 0X4F6C, 0X7DF7, 0X6C7E,
            0XA50A, 0XB483, 0X8618, 0X9791, 0XE32E, 0XF2A7, 0XC03C, 0XD1B5,
            0X2942, 0X38CB, 0X0A50, 0X1BD9, 0X6F66, 0X7EEF, 0X4C74, 0X5DFD,
            0XB58B, 0XA402, 0X9699, 0X8710, 0XF3AF, 0XE226, 0XD0BD, 0XC134,
            0X39C3, 0X284A, 0X1AD1, 0X0B58, 0X7FE7, 0X6E6E, 0X5CF5, 0X4D7C,
            0XC60C, 0XD785, 0XE51E, 0XF497, 0X8028, 0X91A1, 0XA33A, 0XB2B3,
            0X4A44, 0X5BCD, 0X6956, 0X78DF, 0X0C60, 0X1DE9, 0X2F72, 0X3EFB,
            0XD68D, 0XC704, 0XF59F, 0XE416, 0X90A9, 0X8120, 0XB3BB, 0XA232,
            0X5AC5, 0X4B4C, 0X79D7, 0X685E, 0X1CE1, 0X0D68, 0X3FF3, 0X2E7A,
            0XE70E, 0XF687, 0XC41C, 0XD595, 0XA12A, 0XB0A3, 0X8238, 0X93B1,
            0X6B46, 0X7ACF, 0X4854, 0X59DD, 0X2D62, 0X3CEB, 0X0E70, 0X1FF9,
            0XF78F, 0XE606, 0XD49D, 0XC514, 0XB1AB, 0XA022, 0X92B9, 0X8330,
            0X7BC7, 0X6A4E, 0X58D5, 0X495C, 0X3DE3, 0X2C6A, 0X1EF1, 0X0F78,
        ]);

        this.COMMAND_TYPE = {
            MOVE_FORWARD: 0x01,
            MOVE_BACKWARD: 0x02,
            TURN_LEFT: 0x03,
            TURN_RIGHT: 0x04,
            MOVE_LEFT_RIGHT: 0x05,
            ONOFF_REAR_LED: 0x06,
            SET_LED_COLOR: 0x07,
            PLAY_SOUND: 0x08,
            GET_FORWARD_SENSOR: 0x09,
            GET_BOTTOM_SENSOR: 0x0A,
            GET_LIGHT_SENSOR: 0x0B,
        };

        this.SEND_PACKET = {
            START: 0x7C,
            END: 0x7E,
        };

        this.cmdSeq = 0;
        this.serialport = undefined;
        this.isConnect = false;

        this.sendBuffers = [];
        this.rcvBuffers = [];
        this.cmdBuffers = [];
        this.executeCheckList = [];

        this.sensorData = {
          is_front_sensor : 0,
          is_bottom_sensor : 0,
          is_light_sensor : 0,
          front_sensor : 0,
          bottom_sensor : 0,
          light_sensor : 0,
        };
    }
    // #endregion Constructor

    /***************************************************************************************
     *  Entry 기본 함수
     ***************************************************************************************/
    // #region Base Functions for Entry
    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    setSerialPort(serialport) {
      this.log('BASE - setSerialPort()');
      this.serialport = serialport;
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData(serialport) {
        this.log('BASE - requestInitialData()');
        this.serialport = serialport;

        const cmdPing = this.makeData("ping");
        console.log(cmdPing);
        
        return cmdPing;
    };

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        return true;
    };

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    };

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
      this.log('BASE - requestLocalData()');
      const cmdPing = this.makeData("ping");
      if (this.sendBuffers.length > 0) {
          const cmd = this.sendBuffers.shift();
          if (cmd.length <6) {
              return cmdPing;
          }
          this.log(cmd);
          return cmd;
      }
      
      return cmdPing;
    };

    /**
     * 하드웨어에서 온 데이터 처리
     * @param {*} data 
     */
    handleLocalData(data) {
      this.log('BASE - handleLocalData()');
      this.log(data);
      this.rcvBuffers.push(...data);

      let startIdx = 0;
      let idx = this.rcvBuffers.indexOf(this.SEND_PACKET.END);
      if (idx < 0) { return; }
        
      if (this.rcvBuffers[0] != this.SEND_PACKET.START) {
          const trash = this.rcvBuffers.splice(0, idx + 1);
          return;
      } else if (idx < 10 && this.rcvBuffers.length < 11) {
          return;
      } else if (idx < 10 && this.rcvBuffers.length >= 11) {
          startIdx  = idx;
          idx = this.rcvBuffers.indexOf(this.SEND_PACKET.END, idx + 1);
      }
      const rcvData = this.rcvBuffers.splice(startIdx, idx + 1);
      this.cmdBuffers.push(rcvData);

      this.log(rcvData);  
      this.log('BASE - handleLocalData()--end');
    };

    /**
     * 엔트리로 전달할 데이터
     * @param {*} handler 
     */
    requestRemoteData(handler) {
      this.log('BASE - requestRemoteData()');
      this.log(handler.serverData);

      if (this.cmdBuffers.length > 0) {
          const data = this.cmdBuffers.shift();
          let raw_data = this.escape_decode(data.slice(1, data.length-1));

          let seqNo = raw_data.readUInt8(1);
          let sensor0 = raw_data.readUInt16LE(2);
          let sensor1 = raw_data.readUInt16LE(4);
          let sensor2 = raw_data.readUInt16LE(6);

          this.sensorData.front_sensor = sensor0;
          this.sensorData.bottom_sensor = sensor1;
          this.sensorData.light_sensor = sensor2;

          this.log(this.sensorData);
          handler.write('sensorData', this.sensorData);
          
          this.log(`BASE - requestRemoteData()---------1,seqNo:${seqNo}`);    
      
          const index = seqNo;
          const msgId = this.executeCheckList[index];
          this.log(`BASE - requestRemoteData()---------2, msgId:${msgId}`);    
          if (msgId === undefined || msgId === '') {
            return;
          }
          
          this.log(`BASE - requestRemoteData()---------3, msgId:${msgId}`);    
          
          handler.write('msg_id', msgId);
          this.executeCheckList[index] = '';
      }
      this.log('BASE - requestRemoteData()-------END');
    };

    /**
     * 엔트리에서 받은 데이터에 대한 처리
     * @param {*} handler 
     */
    handleRemoteData(handler) {
      this.log('BASE - handleRemoteData()');
      this.log(handler.serverData);
      
      const msgId = handler.serverData.msg_id;
      const msg = handler.serverData.msg;
      if (!msgId || this.executeCheckList.indexOf(msgId) >= 0) {
          return;
      }
      this.log(`BASE - handleRemoteData()---------1,index:${index},msg.id:${msg.id}`);    
      this.executeCheckList[this.cmdSeq] = msg.id;
      
      const sendData = this.makeData(msg);
      this.log(sendData);
      this.sendBuffers.push(sendData);
      this.log('BASE - handleRemoteData()-------END');
    }

    connect() {
        this.log('BASE - connect()');
        this.isConnect = true;        
    }


    disconnect(connect) {
        this.log('BASE - disconnect()');

        connect.close();

        this.isConnect = false;
        this.serialport = undefined;
    }

    /*
        Web Socket 종료후 처리
    */
    reset() {
        this.log('BASE - reset()');
        this.resetData();
    }
    // #endregion Base Functions for Entry
    

    /***************************************************************************************
     *  데이터 리셋
     ***************************************************************************************/
    resetData() {

    }


    /***************************************************************************************
     *  프로토롤 제어 함수
     ***************************************************************************************/
    sequenctNo() {
        if (this.cmdSeq < 254) this.cmdSeq = 0;
        else this.cmdSeq++;
        return this.cmdSeq;
    }

    cal_move_val(args) {
        let retval = 0;
        if (args.param2 === 'cm') {
            retval = parseInt(args.param1 * (10 / 15));
        } else {
            retval = args.param1 * 10;
        }
        if (retval < 0) retval = 0;
        if (retval > 990) retval = 990;
        return retval;
    }

    cal_turn_val(args) {
        let retval = 0;
        if (args.param2 === 'degree') {
            retval = args.param1 * 10;
        } else {
            retval = args.param1 * 10;
        }
        if (retval < 0) retval = 0;
        if (retval > 990) retval = 990;
        return retval;
    }

    /***************************************************************************************
     *  Protocol 데이터 생성
     ***************************************************************************************/
    makeData(msg) {
      let id = this.sequenctNo();
      let data = null;
      let crc = 0;
      let encodedCmd = [];

      let type = msg;
      let args = {};
      if(msg.type) {
        type = msg.type;
      }
      if(msg.data) {
        args = msg.data;
      }
      
      switch (type) {
          case "ping":
              data = Buffer.from([0x03, id]);
              crc = this.cal_crc16(data);
              encodedCmd = this.escape_encode(Buffer.concat([data, Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
              break;

          case "ready":
              data = Buffer.from([0x04, id]);
              crc = this.cal_crc16(data);
              encodedCmd = this.escape_encode(Buffer.concat([data, Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
              break;

          case this.COMMAND_TYPE.MOVE_FORWARD:
          case "move_fw":
              data = Buffer.from([0x05, id, this.cal_move_val(args)]);
              crc = this.cal_crc16(data);
              encodedCmd = this.escape_encode(Buffer.concat([data, Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
              break;

          case this.COMMAND_TYPE.MOVE_BACKWARD:
          case "move_bw":
              data = Buffer.from([0x06, id, this.cal_move_val(args)]);
              crc = this.cal_crc16(data);
              encodedCmd = this.escape_encode(Buffer.concat([data, Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
              break;

          case this.COMMAND_TYPE.TURN_LEFT:
          case "turn_left":
              if (args.params === 'degree') {
                  data = Buffer.from([0x0A, id, 0x01, this.cal_turn_val(args)]);
              } else {
                  data = Buffer.from([0x07, id, this.cal_turn_val(args)]);
              }
              crc = this.cal_crc16(data);
              encodedCmd = this.escape_encode(Buffer.concat([data, Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
              break;

          case this.COMMAND_TYPE.TURN_RIGHT:
          case "turn_right":
              if (args.params === 'degree') {
                  data = Buffer.from([0x0A, id, 0x00, this.cal_turn_val(args)]);
              } else {
                  data = Buffer.from([0x08, id, this.cal_turn_val(args)]);
              }
              crc = this.cal_crc16(data);
              encodedCmd = this.escape_encode(Buffer.concat([data, Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF])]));
              break;
      }

      let cmdData = Buffer.from([0x7C, ...encodedCmd, 0x7E]);
      console.log(cmdData);
      return cmdData;
  }
    

    /***************************************************************************************
     *  데이터 encoding
     ***************************************************************************************/
    escape_encode(data) {
        let buffer = Buffer.alloc(data.length * 2);
        let idx = 0;
        for (let d of data) {
            if (d === 0x7C) {
                buffer[idx] = 0x7D;
                buffer[idx + 1] = 0x5C;
                idx += 2;
            } else if (d === 0x7D) {
                buffer[idx] = 0x7D;
                buffer[idx + 1] = 0x5D;
                idx += 2;
            } else if (d === 0x7E) {
                buffer[idx] = 0x7D;
                buffer[idx + 1] = 0x5E;
                idx += 2;
            } else {
                buffer[idx] = d;
                idx++;
            }
        }
        return buffer.slice(0, idx);
    }

    /***************************************************************************************
     *  데이터 decoding
     ***************************************************************************************/
    escape_decode(data) {
        let buffer = Buffer.alloc(data.length);
        let idx = 0;
        for (let i = 0; i < data.length;) {
            if (data[i] === 0x7D) {
                buffer[idx++] = data[i + 1] ^ 0x20;
                i += 2;
            } else buffer[idx++] = data[i++];
        }
        return buffer.slice(0, idx);
    }

    /***************************************************************************************
     *  CRC 생성
     ***************************************************************************************/
    cal_crc16(data) {
        var res = 0x0ffff;

        for (let b of data) {
            res = ((res >> 8) & 0x0ff) ^ this.crctab16[(res ^ b) & 0xff];
        }

        return (~res) & 0x0ffff;
    }

    /***************************************************************************************
     *  로그 출력
     ***************************************************************************************/
    // #region Functions for log

    log(message, data = undefined) {
        // 로그를 출력하지 않으려면 아래 주석을 활성화 할 것
        //*
        let strInfo = '';

        switch (typeof data) {
            case 'object': {
                strInfo = ` - [ ${this.convertByteArrayToHexString(data)} ]`;
                console.log(`${message} - ${typeof data}${strInfo}`);
            }
            break;

        default: {
            console.log(message);
          }
          break;
        }
        // */
    }

    // 바이트 배열을 16진수 문자열로 변경
    convertByteArrayToHexString(data) {
        let strHexArray = '';
        let strHex;

        if (typeof data === 'object' && data.length > 1) {
            for (let i = 0; i < data.length; i++) {
                strHex = data[i].toString(16).toUpperCase();
                strHexArray += ' ';
                if (strHex.length === 1) {
                    strHexArray += '0';
                }
                strHexArray += strHex;
            }
            strHexArray = strHexArray.substr(1, strHexArray.length - 1);
        } else {
            strHexArray = data.toString();
        }

        return strHexArray;
    }
} // end of class

module.exports = new Choco();
