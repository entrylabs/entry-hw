'use strict';

function Module()
{
  this.sp = null;     //serial port
  this.hw_controller =
  {
    fheader:    255, //0xff
    sheader:    85,  //0x55
    data_size:  0,
    index:      0,
    data:       [],
    tail:       10  //0x0a
  };

  this.entry_controller =
  {
    seq: 0,
    category: 0,
    action: 0,
    param_cnt: 0,
    paramA: 0,
    paramB: 0,
    paramC: 0,
    paramD: 0,
    modeA: 0, //1:RO, 2:RW, 3:WO
    modeB: 0
  };

  this.sendToEntry =
  {
    button0 : 0,
    button1 : 0,
    button2 : 0,
    button3 : 0,
    clap : 0,
    sound : 0,
    isPlaying : 0,
    pickup : 0,
    animation : 0,
    isDriving : 0,
    soundDirection : 0,
    barrier_front : 0,
    barrier_left : 0,
    barrier_right : 0,
    barrier_rear : 0
  };

  this.sensorInfo =
  {
    distance_left : 0,
    distance_right : 0,
    distance_rear : 0,
    wheel_left_l : 0,
    wheel_left_h : 0,
    wheel_left_d : 0,
    wheel_right_l : 0,
    wheel_right_h : 0,
    wheel_right_d : 0,
    wheel_distance_avg : 0
  };

  this.isfirst = true;    //최초 Dash로 부터 데이터를 받을 때 앞에 불필요한 stream 제거(header가 넘어 올때까지)
  this.isBuffering = 0;   //Dash로 부터 Random size로 받은 데이터 순차적으로 처리하기 위한 flag
  this.serialData_q = []; //Dash로 부터 받은 데이터 담는 배열
}

var DashCmd =
{
  CMD_SEQ       : 'seq',
  CMD_CATEGORY  : 'category',
  CMD_ACTION    : 'action',
  CMD_PARAM_CNT : 'param_cnt',
  CMD_PARAM_A   : 'paramA',
  CMD_PARAM_B   : 'paramB',
  CMD_PARAM_C   : 'paramC',
  CMD_PARAM_D   : 'paramD',
  CMD_MODE_A    : 'modeA',
  CMD_MODE_B    : 'modeB'
};

var isParsing = false; //websocket으로 받은 data 처리중
var isDebugging = false;  //디버깅 여부
var isDraing = true;    //Dash로 데이터 보내기 전에 false로 변경 다 보내고 다시 true
var sendBuffers = [];  //Dash로 보내는 데이터 담은 배열
var nowSeq = 0;   //entryjs에서 오는 블럭 번호
var compare_sensor_data = 0;  //움직이는 중인지 판별하기 위한 비교 데이터
var sensor_check_cnt = 0;   //정확도를 위해 정지 여부를 3번 체크 하도록 하는 변수
var wait_action = false;    //액션을 기다리는지 체크(예: 소리나는 방향 보기)

var barrier_distance_val = 5;  //장애물 거리 체크를 위한 센서 값

var DashCategoryCmd = {DRIVE:1, START:2, LOOK:3, LIGHT:4, SOUND:5, ANIMATION:6};
var DashActionCmd_Drive = {FORWARD:1, BACKWARD:2, TURN_CW:3, TURN_CCW:4, WHEEL:5, STOP:6};
var DashActionCmd_Start = {WHEN:1};
var DashActionCmd_Look = {LEFT:1, FORWARD:2, RIGHT:3, UP:4, STRAIGHT:5, DOWN:6, FORWARD_VOICE:7};
var DashActionCmd_Light = {ALL:1, LEFT_EAR:2, RIGHT_EAR:3, FRONT:4, TAIL: 5, EYE_PATTERN:6, TOP:7};
var DashActionCmd_Sound = {MY_SOUNDS:1, SAY:2};
var DashParamCmd_Sound_Say =
{
  //말
  HI:0, HUH:1, UHOH:2, OKAY:3, SIGHT:4, TADA:5, WEE:6, BYE:7,
  //동물
  HORSE:8, CAT:9, DOG:10, DINOSAUR:11, LION:12, GOAT:13, CROCODILE:14, ELEPHANT:15,
  //이동
  FIRESIREN:16, TRUCKHORN:17, CARENGINE:18, CARTIRESQUEEL:19, HELICOPTER:20, JETPLANE:21, BOAT:22, TRAIN:23,
  //이상한
  BEEPS:24, LASERS:25, GOBBLE:26, BUZZ:27, AYYAIYAI:28, SQUEEK:29
};


// 초기설정
Module.prototype.init = function(handler, config) {};

Module.prototype.setSerialPort = function(sp)
{
  if(isDebugging)  console.log("SJLEE LOG>>>>>>>>>>> setSerialPort");
  this.sp = sp;
};

// 초기 송신데이터(필수)
Module.prototype.requestInitialData = function()
{
  if(isDebugging)  console.log("SJLEE LOG>>>>>>>>>>> requestInitialData");
	return null;
};

// 초기 수신데이터 체크(필수)
Module.prototype.checkInitialData = function(data, config)
{
  if(isDebugging)  console.log("SJLEE LOG>>>>>>>>>>> checkInitialData");
  //받아서 설정
  return true;
};

Module.prototype.validateLocalData = function(data)
{
  return true;
};

// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data)
{
  if(data.length > 0)
  {
    var hw_controller = this.hw_controller;

    if(this.serialData_q == null) this.serialData_q = new Array();

    for(var i=0; i<data.length; i++)
    {
      if(this.isfirst && data[i] != hw_controller.fheader)
      {
        continue;
      }
      else
      {
        this.isfirst = false;
      }
      this.serialData_q.push(data[i]);
    }

    if(this.serialData_q.shift() == hw_controller.fheader || this.isBuffering > 0)
    {
      this.isBuffering = 1;
      if(this.serialData_q.length < 1) return;
    }
    else
    {
      this.isBuffering = 0;
      return;
    }

    if(this.serialData_q.shift() == hw_controller.sheader || this.isBuffering > 1)
    {
      this.isBuffering = 2;
      if(this.serialData_q.length < 1) return;
    }
    else
    {
      this.isBuffering = 0;
      return;
    }

    if(this.serialData_q[0]+2 >= this.serialData_q.length)  //size buffer length + tail char buffer length = 2
    {
      this.isBuffering = 3;
      return;
    }
    else
    {
      hw_controller.data_size = this.serialData_q.shift();
    }

    hw_controller.data = [];
    for(var i=0; i<hw_controller.data_size; i++)
    {
      //센서 데이터 처리
      if(isDebugging)  console.log(">>>>>>" + this.serialData_q[i]);
      hw_controller.data.push(this.serialData_q.shift());
    }

    if(this.serialData_q.shift() == hw_controller.tail)
    {
      hw_controller.index = hw_controller.data.shift();
      //Sensor 1
      if(hw_controller.index==1)
      {
        this.sendToEntry.button0 = (hw_controller.data[8] & 0x10);
        this.sendToEntry.button1 = (hw_controller.data[8] & 0x20);
        this.sendToEntry.button2 = (hw_controller.data[8] & 0x40);
        this.sendToEntry.button3 = (hw_controller.data[8] & 0x80);
        this.sendToEntry.clap = (hw_controller.data[11] & 0x1);
        this.sendToEntry.isPlaying = (hw_controller.data[11] & 0x2);
        this.sendToEntry.pickup = (hw_controller.data[11] & 0x4);
        this.sendToEntry.animation = (hw_controller.data[11] & 0x40);
        this.sendToEntry.soundDirection = hw_controller.data[15]==0x04;

        if (hw_controller.data[7] > 30) {
          this.sendToEntry.sound = 1;
        }
        else {
          this.sendToEntry.sound = 0;
        }

        if(wait_action && this.sendToEntry.soundDirection)
        {
          var sound_dr = (hw_controller.data[13]<<8) + hw_controller.data[12];
          sound_dr = ((sound_dr > 180)?sound_dr-360:sound_dr)*100;
          sendBuffers.push([0xff, 0x55, 0x04, 0x00, 0x06, (sound_dr&0xFF00)>>8, sound_dr&0xFF, 0x0a]);
          wait_action = false;
        }
      }
      //Sensor 2
      else if(hw_controller.index==2)
      {
        this.sensorInfo.distance_left = hw_controller.data[7];
        this.sensorInfo.distance_right = hw_controller.data[6];
        this.sensorInfo.distance_rear = hw_controller.data[8];
        this.sensorInfo.wheel_left_l = hw_controller.data[10];
        this.sensorInfo.wheel_left_h = hw_controller.data[11];
        this.sensorInfo.wheel_left_d = (this.sensorInfo.wheel_left_l+(this.sensorInfo.wheel_left_h*255))*7.85*3.14/1200;
        this.sensorInfo.wheel_right_l = hw_controller.data[14];
        this.sensorInfo.wheel_right_h = hw_controller.data[15];
        this.sensorInfo.wheel_right_d = (this.sensorInfo.wheel_right_l+(this.sensorInfo.wheel_right_h*255))*7.85*3.14/1200;
        this.sensorInfo.wheel_distance_avg = (this.sensorInfo.wheel_left_d+this.sensorInfo.wheel_right_d)/2;

        this.sendToEntry.barrier_front = ((this.sensorInfo.distance_left+this.sensorInfo.distance_right)/2)>barrier_distance_val;
        this.sendToEntry.barrier_left = this.sensorInfo.distance_right>barrier_distance_val;
        this.sendToEntry.barrier_right = this.sensorInfo.distance_left>barrier_distance_val;
        this.sendToEntry.barrier_rear = this.sensorInfo.distance_rear>barrier_distance_val;

        if(compare_sensor_data != this.sensorInfo.wheel_distance_avg)
        {
          this.sendToEntry.isDriving = 1;
          compare_sensor_data = this.sensorInfo.wheel_distance_avg;
        }
        else
        {
          if((sensor_check_cnt++) == 25)
          {
            this.sendToEntry.isDriving = 0;
            sensor_check_cnt = 0;
          }
        }
      }
    }
    this.isBuffering = 0;
  }
  return;
};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler)
{
  if(isDebugging)  console.log("SJLEE LOG>>>>>>>>>>> requestRemoteData");
  var sendToEntry = this.sendToEntry;

	for(var key in sendToEntry)
  {
		handler.write(key, sendToEntry[key]);
	}
  return;
};

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function(handler)
{
  var entry_controller = this.entry_controller;
  if(handler.e(DashCmd.CMD_SEQ))
  {
    entry_controller.seq = handler.read(DashCmd.CMD_SEQ);
    if(entry_controller.seq == 0)
    {
      // Entry 초기화.
      if (nowSeq != 0) {
        sendBuffers.push([0xFF, 0x55, 0x01, 0x07, 0x0A]);
      }
      nowSeq = 0;
    }
    else if(entry_controller.seq > 0 && !isParsing)
    {
      if(nowSeq == entry_controller.seq)  return;
      nowSeq = entry_controller.seq;
      isParsing = true;
      if(handler.e(DashCmd.CMD_CATEGORY))   entry_controller.category = handler.read(DashCmd.CMD_CATEGORY);
      if(handler.e(DashCmd.CMD_ACTION))     entry_controller.action = handler.read(DashCmd.CMD_ACTION);
      if(handler.e(DashCmd.CMD_PARAM_CNT))  entry_controller.param_cnt = handler.read(DashCmd.CMD_PARAM_CNT);
      if(handler.e(DashCmd.CMD_PARAM_A))    entry_controller.paramA = handler.read(DashCmd.CMD_PARAM_A);
      if(handler.e(DashCmd.CMD_PARAM_B))    entry_controller.paramB = handler.read(DashCmd.CMD_PARAM_B);
      if(handler.e(DashCmd.CMD_PARAM_C))    entry_controller.paramC = handler.read(DashCmd.CMD_PARAM_C);
      if(handler.e(DashCmd.CMD_PARAM_D))    entry_controller.paramD = handler.read(DashCmd.CMD_PARAM_D);
      if(handler.e(DashCmd.CMD_MODE_A))     entry_controller.modeA = handler.read(DashCmd.CMD_MODE_A);
      if(handler.e(DashCmd.CMD_MODE_B))     entry_controller.modeB = handler.read(DashCmd.CMD_MODE_B);

      if(isDebugging)  console.log(">>>>>>>> handleRemoteData data >> category : "+entry_controller.category+", Action : "+entry_controller.action + " / " + entry_controller.param_cnt + " / " + entry_controller.paramA + " / " + entry_controller.paramB + " / " + entry_controller.modeA);

      var buffer = this.getDashCommand(entry_controller.category, entry_controller.action, entry_controller.param_cnt, entry_controller.paramA, entry_controller.paramB, entry_controller.paramC, entry_controller.paramD);
      if (buffer.length)
      {
        buffer.unshift(this.hw_controller.fheader, this.hw_controller.sheader, buffer.length);
        buffer.push(0x0a);
        sendBuffers.push(buffer);
        if(isDebugging)  console.log(">>>>>>>>>>>>>>>>>" + sendBuffers);
      }
      isParsing = false;
    }
  }
  return;
};

Module.prototype.getDashCommand = function(c, a, cnt, pa, pb, pc, pd)
{
  var buffer = [0x00]; //header 넣어 주면됨 초기값으로
  switch (c)
  {
    // 움직임 액션
    case DashCategoryCmd.DRIVE:
      switch (a)
      {
        case DashActionCmd_Drive.FORWARD:
        case DashActionCmd_Drive.BACKWARD:
          var speed = 0;
          switch(pb) {
          case 1: // 매우 느리게, 17cm/s
            speed = 17;
            break;
          case 2: // 느리게, 22m/s
            speed = 22;
            break;
          case 3: // 보통, 27cm/s
            speed = 27;
            break;
          case 4: // 빠르게, 32cm/s
            speed = 32;
            break;
          case 5: // 매우 빠르게, 37cm/s
            speed = 37;
            break;
          }
          var time = parseInt((pa / speed) * 1000);
          pa = a == DashActionCmd_Drive.FORWARD ? pa * 10 : (pa * 10 * (-1)) + 0x4000;
          var c6 = (pa & 0xFF00) >> 8;
          var c1 = pa & 0xFF;
          var c4 = (time & 0xFF00) >> 8;
          var c5 = time & 0xFF;
          var c8 = a == DashActionCmd_Drive.FORWARD ? 0x80 : 0x81;
          buffer.push(0x23, c1, 0x00, 0x00, c4, c5, c6, 0x00, c8);
          if(isDebugging)  console.log(buffer);
          break;
        case DashActionCmd_Drive.TURN_CW:
        case DashActionCmd_Drive.TURN_CCW:
          var time = parseInt(pa / 30) * 100;
          var c4 = (time & 0xFF00) >> 8;
          var c5 = time & 0xFF;
          pa = a == DashActionCmd_Drive.TURN_CW ? pa = pa * -1: pa;
          var rawDegrees = parseInt(pa * 628 / 360);
          var c7 = rawDegrees > 0 ? 0x00 : 0xC0;
          rawDegrees = rawDegrees > 0 ? rawDegrees : 0x400 + rawDegrees;
          var c3 = rawDegrees & 0xFF;
          var c6 = ((rawDegrees & 0xFF00) >> 8) << 6;
          buffer.push(0x23, 0x00, 0x00, c3, c4, c5, c6, c7, 0x80);
          if(isDebugging)  console.log(buffer);
          break;
        case DashActionCmd_Drive.WHEEL:
          var left = 0;
          var right = 0;
          switch (pb) {
            case 1: // 매우 느리게, 17cm/s
              left = 17;
              break;
            case 2: // 느리게, 22m/s
              left = 22;
              break;
            case 3: // 보통, 27cm/s
              left = 27;
              break;
            case 4: // 빠르게, 32cm/s
              left = 32;
              break;
            case 5: // 매우 빠르게, 37cm/s
              left = 37;
              break;
          }
          switch (pd) {
            case 1: // 매우 느리게, 17cm/s
              right = 17;
              break;
            case 2: // 느리게, 22m/s
              right = 22;
              break;
            case 3: // 보통, 27cm/s
              right = 27;
              break;
            case 4: // 빠르게, 32cm/s
              right = 32;
              break;
            case 5: // 매우 빠르게, 37cm/s
              right = 37;
              break;
          }
          if (pa == 0x01) {
            left *= 30;
          }
          else if(pa == 0x02) {
            left *= (-30);
          }
          if(pc == 0x01) {
            right *= 30;
          }
          else if(pc == 0x02) {
            right *= (-30);
          }
          buffer.push(0x01, (left & 0xFF00) >> 8, left & 0xFF, (right & 0xFF00) >> 8, right & 0xff);
          break;
        case DashActionCmd_Drive.STOP:
          buffer.push(0x02, 0x00, 0x00, 0x00);
          break;
      }
      break;

    // 시작 액션
    case DashCategoryCmd.START:
      break;

    // 보기 액션4
    case DashCategoryCmd.LOOK:
      switch (a)
      {
        case DashActionCmd_Look.LEFT:
        case DashActionCmd_Look.RIGHT:
          if(pa > 120) return [];  //좌우 회전 각도는 120 ~ -120
          var angle = (a==DashActionCmd_Look.LEFT)?pa*100*-1:pa*100;
          buffer.push(0x06, (angle&0xFF00)>>8, angle&0xFF);
          break;
        case DashActionCmd_Look.FORWARD:
          buffer.push(0x06, 0x00, 0x00);
          break;
        case DashActionCmd_Look.UP:
          buffer.push(0x07, 0x08, 0xca);
          break;
        case DashActionCmd_Look.DOWN:
          buffer.push(0x07, 0xfd, 0x44);
          break;
        case DashActionCmd_Look.STRAIGHT:
          buffer.push(0x07, 0x00, 0x00);
          break;
        case DashActionCmd_Look.FORWARD_VOICE:
          wait_action = true;
          return [];
      }
      break;

    // LED 액션
    case DashCategoryCmd.LIGHT:
      switch (a)
      {
        case DashActionCmd_Light.TOP:
        case DashActionCmd_Light.TAIL:
          buffer.push((a==DashActionCmd_Light.TAIL)?0x04:0x0d, pa);
          break;
        case DashActionCmd_Light.EYE_PATTERN:
          switch(pa) {
          case 0x00:  buffer.push(0x08, 0xFF, 0x09, 0x00, 0x00); break;
          case 0x01:  buffer.push(0x08, 0xFF, 0x09, 0x09, 0xF2); break;
          case 0x02:  buffer.push(0x08, 0xFF, 0x09, 0x09, 0x72); break;
          case 0x03:  buffer.push(0x08, 0xFF, 0x09, 0x04, 0xE4); break;
          case 0x04:  buffer.push(0x08, 0xFF, 0x09, 0x08, 0x42); break;
          case 0x05:  buffer.push(0x08, 0xFF, 0x09, 0x0F, 0xFF); break;
          }
          break;
        case DashActionCmd_Light.ALL:
        case DashActionCmd_Light.LEFT_EAR:  buffer.push(0xb, pa, pb, pc); if(a==DashActionCmd_Light.LEFT_EAR) break;
        case DashActionCmd_Light.RIGHT_EAR: buffer.push(0xc, pa, pb, pc); if(a==DashActionCmd_Light.RIGHT_EAR) break;
        case DashActionCmd_Light.FRONT:     buffer.push(0x3, pa, pb, pc); break;
      }
      break;

    //소리 액션
    case DashCategoryCmd.SOUND:
      buffer.push(0x18, 0x53, 0x59, 0x53, 0x54);
      switch (a)
      {
        case DashActionCmd_Sound.MY_SOUNDS:
          switch(pa) {
            case 0:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x30);  break;
            case 1:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x31);  break;
            case 2:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x32);  break;
            case 3:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x33);  break;
            case 4:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x34);  break;
            case 5:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x35);  break;
            case 6:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x36);  break;
            case 7:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x37);  break;
            case 8:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x38);  break;
            case 9:  buffer.push(0x56, 0x4f, 0x49, 0x43, 0x45, 0x39);  break;
          }
          break;
        case DashActionCmd_Sound.SAY:
          switch (pa)
          {
            case DashParamCmd_Sound_Say.HI:             buffer.push(0x44, 0x41, 0x53, 0x48, 0x5f, 0x48, 0x49, 0x5f, 0x56, 0x4f);  break;
            case DashParamCmd_Sound_Say.HUH:            buffer.push(0x43, 0x55, 0x52, 0x49, 0x4f, 0x55, 0x53, 0x5f, 0x30, 0x34);  break;
            case DashParamCmd_Sound_Say.UHOH:           buffer.push(0x57, 0x48, 0x55, 0x48, 0x5f, 0x4f, 0x48, 0x5f, 0x32, 0x30);  break;
            case DashParamCmd_Sound_Say.OKAY:           buffer.push(0x42, 0x4f, 0x5f, 0x4f, 0x4b, 0x41, 0x59, 0x5f, 0x30, 0x33);  break;
            case DashParamCmd_Sound_Say.SIGHT:          buffer.push(0x42, 0x4f, 0x5f, 0x56, 0x37, 0x5f, 0x59, 0x41, 0x57, 0x4e);  break;
            case DashParamCmd_Sound_Say.TADA:           buffer.push(0x54, 0x41, 0x48, 0x5f, 0x44, 0x41, 0x48, 0x5f, 0x30, 0x31);  break;
            case DashParamCmd_Sound_Say.WEE:            buffer.push(0x45, 0x58, 0x43, 0x49, 0x54, 0x45, 0x44, 0x5f, 0x30, 0x31);  break;
            case DashParamCmd_Sound_Say.BYE:            buffer.push(0x42, 0x4f, 0x5f, 0x56, 0x37, 0x5f, 0x56, 0x41, 0x52, 0x49);  break;
            case DashParamCmd_Sound_Say.HORSE:          buffer.push(0x48, 0x4f, 0x52, 0x53, 0x45, 0x57, 0x48, 0x49, 0x4e, 0x32);  break;
            case DashParamCmd_Sound_Say.CAT:            buffer.push(0x46, 0x58, 0x5f, 0x43, 0x41, 0x54, 0x5f, 0x30, 0x31, 0x00);  break;
            case DashParamCmd_Sound_Say.DOG:            buffer.push(0x46, 0x58, 0x5f, 0x44, 0x4f, 0x47, 0x5f, 0x30, 0x32, 0x00);  break;
            case DashParamCmd_Sound_Say.DINOSAUR:       buffer.push(0x44, 0x49, 0x4e, 0x4f, 0x53, 0x41, 0x55, 0x52, 0x5f, 0x33);  break;
            case DashParamCmd_Sound_Say.LION:           buffer.push(0x46, 0x58, 0x5f, 0x4c, 0x49, 0x4f, 0x4e, 0x5f, 0x30, 0x31);  break;
            case DashParamCmd_Sound_Say.GOAT:           buffer.push(0x46, 0x58, 0x5f, 0x30, 0x33, 0x5f, 0x47, 0x4f, 0x41, 0x54);  break;
            case DashParamCmd_Sound_Say.CROCODILE:      buffer.push(0x43, 0x52, 0x4f, 0x43, 0x4f, 0x44, 0x49, 0x4c, 0x45, 0x00);  break;
            case DashParamCmd_Sound_Say.ELEPHANT:       buffer.push(0x45, 0x4c, 0x45, 0x50, 0x48, 0x41, 0x4e, 0x54, 0x5f, 0x30);  break;
            case DashParamCmd_Sound_Say.FIRESIREN:      buffer.push(0x58, 0x5f, 0x53, 0x49, 0x52, 0x45, 0x4e, 0x5f, 0x30, 0x32);  break;
            case DashParamCmd_Sound_Say.TRUCKHORN:      buffer.push(0x54, 0x52, 0x55, 0x43, 0x4b, 0x48, 0x4f, 0x52, 0x4e, 0x00);  break;
            case DashParamCmd_Sound_Say.CARENGINE:      buffer.push(0x45, 0x4e, 0x47, 0x49, 0x4e, 0x45, 0x5f, 0x52, 0x45, 0x56);  break;
            case DashParamCmd_Sound_Say.CARTIRESQUEEL:  buffer.push(0x54, 0x49, 0x52, 0x45, 0x53, 0x51, 0x55, 0x45, 0x41, 0x4c);  break;
            case DashParamCmd_Sound_Say.HELICOPTER:     buffer.push(0x48, 0x45, 0x4c, 0x49, 0x43, 0x4f, 0x50, 0x54, 0x45, 0x52);  break;
            case DashParamCmd_Sound_Say.JETPLANE:       buffer.push(0x41, 0x49, 0x52, 0x50, 0x4f, 0x52, 0x54, 0x4a, 0x45, 0x54);  break;
            case DashParamCmd_Sound_Say.BOAT:           buffer.push(0x54, 0x55, 0x47, 0x42, 0x4f, 0x41, 0x54, 0x5f, 0x30, 0x31);  break;
            case DashParamCmd_Sound_Say.TRAIN:          buffer.push(0x54, 0x52, 0x41, 0x49, 0x4e, 0x5f, 0x57, 0x48, 0x49, 0x53);  break;
            case DashParamCmd_Sound_Say.BEEPS:          buffer.push(0x42, 0x4f, 0x54, 0x5f, 0x43, 0x55, 0x54, 0x45, 0x5f, 0x30);  break;
            case DashParamCmd_Sound_Say.LASERS:         buffer.push(0x4c, 0x41, 0x53, 0x45, 0x52, 0x53, 0x00, 0x00, 0x00, 0x00);  break;
            case DashParamCmd_Sound_Say.GOBBLE:         buffer.push(0x47, 0x4f, 0x42, 0x42, 0x4c, 0x45, 0x5f, 0x30, 0x30, 0x31);  break;
            case DashParamCmd_Sound_Say.BUZZ:           buffer.push(0x55, 0x53, 0x5f, 0x4c, 0x49, 0x50, 0x42, 0x55, 0x5a, 0x5a);  break;
            case DashParamCmd_Sound_Say.AYYAIYAI:       buffer.push(0x43, 0x4f, 0x4e, 0x46, 0x55, 0x53, 0x45, 0x44, 0x5f, 0x31);  break;
            case DashParamCmd_Sound_Say.SQUEEK:         buffer.push(0x4f, 0x54, 0x5f, 0x43, 0x55, 0x54, 0x45, 0x5f, 0x30, 0x34);  break;
          }
          break;
      }
      break;
      case DashCategoryCmd.ANIMATION:
        buffer.push(0x26, 0x53, 0x59, 0x53, 0x54);  // 0x26 SYST
        switch(pa) {
        case 0x00:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x35, 0x5f, 0x30);  break;
        case 0x01:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x35, 0x5f, 0x34);  break;
        case 0x02:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x33, 0x5f, 0x33);  break;
        case 0x03:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x38, 0x5f, 0x34);  break;
        case 0x04:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x37, 0x5f, 0x30);  break;
        case 0x05:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x35, 0x5f, 0x35);  break;
        case 0x06:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x33, 0x5f, 0x30);  break;
        case 0x07:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x32, 0x5f, 0x33);  break;
        case 0x08:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x31, 0x32, 0x5f, 0x34);  break;
        case 0x09:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x32, 0x31, 0x5f, 0x34);  break;
        case 0x0A:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x31, 0x38, 0x5f, 0x30);  break;
        case 0x0B:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x32, 0x30, 0x5f, 0x30);  break;
        case 0x0C:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x30, 0x39, 0x5f, 0x30);  break;
        case 0x0D:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x31, 0x34, 0x5f, 0x30);  break;
        case 0x0E:  buffer.push(0x41, 0x31, 0x30, 0x30, 0x31, 0x36, 0x5f, 0x30);  break;
        }
      break;
  }
  return buffer;
};

// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function()
{
  if(isDebugging)  console.log("SJLEE LOG>>>>>>>>>>> requestLocalData");
  var entry_controller = this.entry_controller;


  if(isDraing && sendBuffers.length > 0)
  {
    var self = this;
    if(isDebugging)  console.log("SJLEE LOG>>>>>>>>>>> send Msg");
    isDraing = false;
    this.sp.write(sendBuffers.shift(), function()
    {
      if(self.sp)
      {
        self.sp.drain(function()
        {
          if(isDebugging)  console.log("SJLEE LOG>>>>>>>>>>> send Msg end");
          isDraing = true;
          sendBuffers = [];
        });
      }
    });
  }
  return null;
};

Module.prototype.afterConnect = function(that, cb)
{
  that.connected = true;
  if (cb)
  {
    cb('connected');
  }
};

Module.prototype.disconnect = function(connect)
{
  connect.close();
  if (this.sp)
  {
    delete this.sp;
  }
};

Module.prototype.reset = function()
{
	if(isDebugging)  console.log("SJLEE LOG DASH >> reset");
  var hw_controller = this.hw_controller;
  hw_controller.fheader = 255;
  hw_controller.sheader = 85;
  hw_controller.data_size = 0;
  hw_controller.index = 0;
  hw_controller.data = 0;
  hw_controller.tail = 10;

  var entry_controller = this.entry_controller;
  entry_controller.seq = 0;
  entry_controller.category = 0;
  entry_controller.action = 0;
  entry_controller.param_cnt = 0;
  entry_controller.paramA = 0;
  entry_controller.paramB = 0;
  entry_controller.paramC = 0;
  entry_controller.paramD = 0;
  entry_controller.modeA = 0;
  entry_controller.modeB = 0;

  isParsing = false;   //websocket으로 받은 data 처리중

  this.isfirst = true;    //최초 Dash로 부터 데이터를 받을 때 앞에 불필요한 stream 제거(header가 넘어 올때까지)

  this.isBuffering = 0;   //Dash로 부터 Random size로 받은 데이터 순차적으로 처리하기 위한 flag
  this.serialData_q = []; //Dash로 부터 받은 데이터 담는 배열

  isDraing = true;    //Dash로 데이터 보내기 전에 false로 변경 다 보내고 다시 true
  sendBuffers = [];  //Dash로 보내는 데이터 담은 배열
};

module.exports = new Module();
