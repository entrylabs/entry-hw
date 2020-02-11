const _ = require('lodash');
const BaseModule = require('./baseModule');


/***************************************************************************************
 *  기본 클래스
 ***************************************************************************************/

class byrobot_base extends BaseModule
{

    /***************************************************************************************
     *  클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
     ***************************************************************************************/
    // #region Constructor

    constructor()
    {
        super();

        this.log("BYROBOT_BASE - constructor()");

        this.createCRC16Array();

        this.serialport = undefined;
        this.isConnect  = false;


        /***************************************************************************************
         *  드론, 조종기에 전달하는 명령
         ***************************************************************************************/

        /*
            대상 장치로부터 수신 받는 데이터는 모두 _updated 변수를 최상단에 붙임.
            업데이트 된 경우 _updated를 1로 만들고 entry로 전송이 끝나면 다시 0으로 변경
        */
        
        // Entry -> Device
        this.DataType =
        {
            // 전송 버퍼
            BUFFER_CLEAR                : 'buffer_clear',
        
            // 전송 대상
            TARGET                      : 'target',

            // Light Manaul
            LIGHT_MANUAL_FLAGS          : 'light_manual_flags',
            LIGHT_MANUAL_BRIGHTNESS     : 'light_manual_brightness',

            // Light Mode
            LIGHT_MODE_MODE             : 'light_mode_mode',
            LIGHT_MODE_INTERVAL         : 'light_mode_interval',

            // Light Event
            LIGHT_EVENT_EVENT           : 'light_event_event',
            LIGHT_EVENT_INTERVAL        : 'light_event_interval',
            LIGHT_EVENT_REPEAT          : 'light_event_repeat',

            // Light Color
            LIGHT_COLOR_R               : 'light_color_r',
            LIGHT_COLOR_G               : 'light_color_g',
            LIGHT_COLOR_B               : 'light_color_b',

            // 화면 전체 지우기
            DISPLAY_CLEAR_ALL_PIXEL     : 'display_clear_all_pixel',

            // 선택 영역 지우기
            DISPLAY_CLEAR_X             : 'display_clear_x',
            DISPLAY_CLEAR_Y             : 'display_clear_y',
            DISPLAY_CLEAR_WIDTH         : 'display_clear_width',
            DISPLAY_CLEAR_HEIGHT        : 'display_clear_height',
            DISPLAY_CLEAR_PIXEL         : 'display_clear_pixel',

            // 선택 영역 반전
            DISPLAY_INVERT_X            : 'display_invert_x',
            DISPLAY_INVERT_Y            : 'display_invert_y',
            DISPLAY_INVERT_WIDTH        : 'display_invert_width',
            DISPLAY_INVERT_HEIGHT       : 'display_invert_height',

            // 화면에 점 찍기
            DISPLAY_DRAW_POINT_X        : 'display_draw_point_x',
            DISPLAY_DRAW_POINT_Y        : 'display_draw_point_y',
            DISPLAY_DRAW_POINT_PIXEL    : 'display_draw_point_pixel',

            // 화면에 선 그리기
            DISPLAY_DRAW_LINE_X1        : 'display_draw_line_x1',
            DISPLAY_DRAW_LINE_Y1        : 'display_draw_line_y1',
            DISPLAY_DRAW_LINE_X2        : 'display_draw_line_x2',
            DISPLAY_DRAW_LINE_Y2        : 'display_draw_line_y2',
            DISPLAY_DRAW_LINE_PIXEL     : 'display_draw_line_pixel',
            DISPLAY_DRAW_LINE_LINE      : 'display_draw_line_line',

            // 화면에 사각형 그리기
            DISPLAY_DRAW_RECT_X         : 'display_draw_rect_x',
            DISPLAY_DRAW_RECT_Y         : 'display_draw_rect_y',
            DISPLAY_DRAW_RECT_WIDTH     : 'display_draw_rect_width',
            DISPLAY_DRAW_RECT_HEIGHT    : 'display_draw_rect_height',
            DISPLAY_DRAW_RECT_PIXEL     : 'display_draw_rect_pixel',
            DISPLAY_DRAW_RECT_FLAGFILL  : 'display_draw_rect_flagfill',
            DISPLAY_DRAW_RECT_LINE      : 'display_draw_rect_line',

            // 화면에 원 그리기
            DISPLAY_DRAW_CIRCLE_X           : 'display_draw_circle_x',
            DISPLAY_DRAW_CIRCLE_Y           : 'display_draw_circle_y',
            DISPLAY_DRAW_CIRCLE_RADIUS      : 'display_draw_circle_radius',
            DISPLAY_DRAW_CIRCLE_PIXEL       : 'display_draw_circle_pixel',
            DISPLAY_DRAW_CIRCLE_FLAGFILL    : 'display_draw_circle_flagfill',

            // 화면에 문자열 쓰기
            DISPLAY_DRAW_STRING_X           : 'display_draw_string_x',
            DISPLAY_DRAW_STRING_Y           : 'display_draw_string_y',
            DISPLAY_DRAW_STRING_FONT        : 'display_draw_string_font',
            DISPLAY_DRAW_STRING_PIXEL       : 'display_draw_string_pixel',
            DISPLAY_DRAW_STRING_STRING      : 'display_draw_string_string',

            // 화면에 문자열 정렬하여 그리기
            DISPLAY_DRAW_STRING_ALIGN_X_START   : 'display_draw_string_align_x_start',
            DISPLAY_DRAW_STRING_ALIGN_X_END     : 'display_draw_string_align_x_end',
            DISPLAY_DRAW_STRING_ALIGN_Y         : 'display_draw_string_align_y',
            DISPLAY_DRAW_STRING_ALIGN_ALIGN     : 'display_draw_string_align_align',
            DISPLAY_DRAW_STRING_ALIGN_FONT      : 'display_draw_string_align_font',
            DISPLAY_DRAW_STRING_ALIGN_PIXEL     : 'display_draw_string_align_pixel',
            DISPLAY_DRAW_STRING_ALIGN_STRING    : 'display_draw_string_align_string',

            // Buzzer
            BUZZER_MODE     : 'buzzer_mode',
            BUZZER_VALUE    : 'buzzer_value',
            BUZZER_TIME     : 'buzzer_time',

            // Vibrator
            VIBRATOR_MODE   : 'vibrator_mode',
            VIBRATOR_ON     : 'vibrator_on',
            VIBRATOR_OFF    : 'vibrator_off',
            VIBRATOR_TOTAL  : 'vibrator_total',

            // Control::Quad8
            CONTROL_QUAD8_ROLL      : 'control_quad8_roll',
            CONTROL_QUAD8_PITCH     : 'control_quad8_pitch',
            CONTROL_QUAD8_YAW       : 'control_quad8_yaw',
            CONTROL_QUAD8_THROTTLE  : 'control_quad8_throttle',
            
            // Control::Position
            CONTROL_POSITION_X                   : 'control_position_x',
            CONTROL_POSITION_Y                   : 'control_position_y',
            CONTROL_POSITION_Z                   : 'control_position_z',
            CONTROL_POSITION_VELOCITY            : 'control_position_velocity',
            CONTROL_POSITION_HEADING             : 'control_position_heading',
            CONTROL_POSITION_ROTATIONAL_VELOCITY : 'control_position_rotational_velocity',

            // Command
            COMMAND_COMMAND         : 'command_command',
            COMMAND_OPTION          : 'command_option',

            // Motor
            MOTORSINGLE_TARGET      : 'motorsingle_target',
            MOTORSINGLE_ROTATION    : 'motorsingle_rotation',     // direction -> rotation
            MOTORSINGLE_VALUE       : 'motorsingle_value',
        };
    

        // -- JSON Objects ----------------------------------------------------------------
        // Device -> Entry 

        // Ack
        this.ack =
        {
            _updated            : 1,
            ack_systemTime      : 0,    // u64
            ack_dataType        : 0,    // u8
            ack_crc16           : 0,    // u16
        };


        // Joystick
        this.joystick = 
        {
            _updated                    : 1,
            joystick_left_x             : 0,    // s8
            joystick_left_y             : 0,    // s8
            joystick_left_direction     : 0,    // u8
            joystick_left_event         : 0,    // u8
            joystick_right_x            : 0,    // s8
            joystick_right_y            : 0,    // s8
            joystick_right_direction    : 0,    // u8
            joystick_right_event        : 0,    // u8
        };


        // Button
        this.button = 
        {
            _updated            : 1,
            button_button       : 0,    // u16
            button_event        : 0,    // u8
        };


        // State
        this.state = 
        {
            _updated                : 1,
            state_modeSystem        : 0,    // u8
            state_modeFlight        : 0,    // u8
            state_modeControlFlight : 0,    // u8
            state_modeMovement      : 0,    // u8
            state_headless          : 0,    // u8
            state_sensorOrientation : 0,    // u8
            state_battery           : 0,    // u8
        };


        // InformationAssembledForEntry
        this.informationAssembledForEntry =
        {
            _updated                                    : 1,
            informationAssembledForEntry_angleRoll      : 0,    // s16
            informationAssembledForEntry_anglePitch     : 0,    // s16
            informationAssembledForEntry_angleYaw       : 0,    // s16
            informationAssembledForEntry_positionX      : 0,    // s16
            informationAssembledForEntry_positionY      : 0,    // s16
            informationAssembledForEntry_positionZ      : 0,    // s16
            informationAssembledForEntry_rangeHeight    : 0,    // s16
            informationAssembledForEntry_altitude       : 0,    // float
        };


        // 변수 초기화
        this.clearVariable();

        this.targetDevice           = 0;            // 연결 대상 장치 DeviceType
        this.targetDeviceID         = undefined;    // 연결 대상 장치의 ID
    }

    // #endregion Constructor



    /***************************************************************************************
     *  Entry 기본 함수
     ***************************************************************************************/
    // #region Base Functions for Entry

    /*
        초기설정

        최초에 커넥션이 이루어진 후의 초기 설정.
        handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
        config 은 module.json 오브젝트입니다.
    */
    init(handler, config)
    {
        super.init(handler, config);
        
        this.log("BYROBOT_BASE - init()");
        this.resetData();
    }


    /*
        초기 송신데이터(필수)

        연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
        requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
        이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData(serialport)
    {
        //if (this.isConnect == false)
        {
            this.isConnect = true;
            this.serialport = serialport;
        }

        //this.log("BYROBOT_BASE - requestInitialData(0x" + this.targetDevice.toString(16).toUpperCase() + ")");
        return this.reservePing(this.targetDevice);
    }


    /*
        초기 수신데이터 체크(필수)
        연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
     */
    checkInitialData(data, config)
    {
        this.log("BYROBOT_BASE - checkInitialData()");
        return this.checkInitialAck(data, config); 
    }


    /*
        주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    */
    validateLocalData(data)
    {
        //this.log("BYROBOT_BASE - validateLocalData()");
        return true;
    }


    /*
        하드웨어에 전달할 데이터
        
        하드웨어 기기에 전달할 데이터를 반환합니다.
        slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData()
    {
        //this.log("BYROBOT_BASE - requestLocalData()");
        return this.transferToDevice();
    }


    /*
        하드웨어에서 온 데이터 처리
    */
    handleLocalData(data)
    {
        //this.log("BYROBOT_BASE - handleLocalData()");
        this.receiverForDevice(data);
    }


    /*
        엔트리로 전달할 데이터
    */
    requestRemoteData(handler)
    {
        //this.log("BYROBOT_BASE - requestRemoteData()");
        this.transferToEntry(handler);
    }


    /*
        엔트리에서 받은 데이터에 대한 처리
    */
    handleRemoteData(handler)
    {
        //this.log("BYROBOT_BASE - handleRemoteData()");
        this.handlerForEntry(handler);
    }


    connect()
    {
        this.log("BYROBOT_BASE - connect()");
    }


    disconnect(connect)
    {
        this.log("BYROBOT_BASE - disconnect()");

        connect.close();

        this.isConnect  = false;
        this.serialport = undefined;
    }


    /*
        Web Socket 종료후 처리
    */
    reset()
    {
        this.log("BYROBOT_BASE - reset()");
        this.resetData();
    }

    // #endregion Base Functions for Entry



    /***************************************************************************************
     *  데이터 리셋
     ***************************************************************************************/
    // #region Data Reset

    resetData()
    {
        // -- JSON Objects ----------------------------------------------------------------
        // Device -> Entry 

        // Ack
        this.clearAck();
        
        // State
        this.clearState();

        // Joystick
        this.clearJoystick();

        // Button
        this.clearButton();

        // InformationAssembledForEntry
        this.clearInformationAssembledForEntry();

        // 변수 초기화
        this.clearVariable();
    }
    
    clearVariable()
    {
        // -- Control -----------------------------------------------------------------
        this.controlWheel           = 0;        // 
        this.controlAccel           = 0;        // 
        this.controlRoll            = 0;        // 
        this.controlPitch           = 0;        // 
        this.controlYaw             = 0;        // 
        this.controlThrottle        = 0;        // 

        // -- Hardware ----------------------------------------------------------------
        this.bufferReceive          = [];       // 데이터 수신 버퍼
        this.bufferTransfer         = [];       // 데이터 송신 버퍼

        this.dataType               = 0;        // 수신 받은 데이터의 타입
        this.dataLength             = 0;        // 수신 받은 데이터의 길이
        this.from                   = 0;        // 송신 장치 타입
        this.to                     = 0;        // 수신 장치 타입
        this.indexSession           = 0;        // 수신 받은 데이터의 세션
        this.indexReceiver          = 0;        // 수신 받은 데이터의 세션 내 위치
        this.dataBlock              = [];       // 수신 받은 데이터 블럭
        this.crc16Calculated        = 0;        // CRC16 계산 결과
        this.crc16Received          = 0;        // CRC16 수신값
        this.crc16Transfered        = 0;        // 전송한 데이터의 crc16

        this.maxTransferRepeat      = 3;        // 최대 반복 전송 횟수
        this.countTransferRepeat    = 0;        // 반복 전송 횟수
        this.dataTypeLastTransfered = 0;        // 마지막으로 전송한 데이터의 타입

        this.timeReceive            = 0;        // 데이터를 전송 받은 시각
        this.timeTransfer           = 0;        // 예약 데이터를 전송한 시각
        this.timeTransferNext       = 0;        // 전송 가능한 다음 시간
        this.timeTransferInterval   = 30;       // 최소 전송 시간 간격

        this.countReqeustDevice     = 0;        // 장치에 데이터를 요청한 횟수 카운트
    }

    // #endregion Data Reset



    /***************************************************************************************
     *  데이터 업데이트
     ***************************************************************************************/
    // #region Data Update

    clearAck()
    {
        this.ack._updated       = false;
        this.ack.ack_systemTime = 0;
        this.ack.ack_dataType   = 0;
        this.ack.ack_crc16      = 0;
    }

    getUint64(dataview, byteOffset, littleEndian)
    {
        // split 64-bit number into two 32-bit (4-byte) parts
        const left =  dataview.getUint32(byteOffset, littleEndian);
        const right = dataview.getUint32(byteOffset+4, littleEndian);

        // combine the two 32-bit values
        const combined = littleEndian? left + 2**32*right : 2**32*left + right;

        if (!Number.isSafeInteger(combined))
        {
            console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
        }

        return combined;
    }

    updateAck()
    {
        this.log("BYROBOT_BASE - updateAck()");

        if ( this.dataBlock != undefined && this.dataBlock.length == 11 )
        {
            let array = Uint8Array.from(this.dataBlock);
            let view  = new DataView(array.buffer);

            this.ack._updated       = true;
            this.ack.ack_systemTime = this.getUint64(view, 0, true);
            this.ack.ack_dataType   = view.getUint8(8);
            this.ack.ack_crc16      = view.getUint16(9, true);

            return true;
        }

        return false;
    }


    clearState()
    {
        this.state._updated                 = false;
        this.state.state_modeSystem         = 0;
        this.state.state_modeFlight         = 0;
        this.state.state_modeControlFlight  = 0;
        this.state.state_modeMovement       = 0;
        this.state.state_headless           = 0;
        this.state.state_sensorOrientation  = 0;
        this.state.state_battery            = 0;
    }

    updateState()
    {
        this.log("BYROBOT_BASE - updateState()");

        if ( this.dataBlock != undefined && this.dataBlock.length == 7 )
        {
            let array = Uint8Array.from(this.dataBlock);
            let view  = new DataView(array.buffer);

            this.state._updated                 = true;
            this.state.state_modeSystem         = view.getUint8(0);
            this.state.state_modeFlight         = view.getUint8(1);
            this.state.state_modeControlFlight  = view.getUint8(2);
            this.state.state_modeMovement       = view.getUint8(3);
            this.state.state_headless           = view.getUint8(4);
            this.state.state_sensorOrientation  = view.getUint8(5);
            this.state.state_battery            = view.getUint8(6);

            return true;
        }
        
        return false;
    }


    clearButton()
    {
        this.button._updated            = false;
        this.button.button_button      = 0;
        this.button.button_event       = 0;
    }

    updateButton()
    {
        this.log("BYROBOT_BASE - updateButton() - length : " + this.dataBlock.length);
        if ( this.dataBlock != undefined && this.dataBlock.length == 3 )
        {
            let array = Uint8Array.from(this.dataBlock);
            let view  = new DataView(array.buffer);

            this.button._updated           = true;
            this.button.button_button      = view.getUint16(0, true);
            this.button.button_event       = view.getUint8(2);

            return true;
        }
        
        return false;
    }


    clearJoystick()
    {
        this.joystick._updated                   = false;
        this.joystick.joystick_left_x            = 0;
        this.joystick.joystick_left_y            = 0;
        this.joystick.joystick_left_direction    = 0;
        this.joystick.joystick_left_event        = 0;
        this.joystick.joystick_right_x           = 0;
        this.joystick.joystick_right_y           = 0;
        this.joystick.joystick_right_direction   = 0;
        this.joystick.joystick_right_event       = 0;
    }

    updateJoystick()
    {
        if ( this.dataBlock != undefined && this.dataBlock.length == 8 )
        {
            let array = Uint8Array.from(this.dataBlock);
            let view  = new DataView(array.buffer);

            this.joystick._updated                   = true;
            this.joystick.joystick_left_x            = view.getInt8(0);
            this.joystick.joystick_left_y            = view.getInt8(1);
            this.joystick.joystick_left_direction    = view.getUint8(2);
            this.joystick.joystick_left_event        = view.getUint8(3);
            this.joystick.joystick_right_x           = view.getInt8(4);
            this.joystick.joystick_right_y           = view.getInt8(5);
            this.joystick.joystick_right_direction   = view.getUint8(6);
            this.joystick.joystick_right_event       = view.getUint8(7);

            return true;
        }

        return false;
    }


    clearInformationAssembledForEntry()
    {
        this.informationAssembledForEntry._updated                                  = false;
        this.informationAssembledForEntry.informationAssembledForEntry_angleRoll    = 0;
        this.informationAssembledForEntry.informationAssembledForEntry_anglePitch   = 0;
        this.informationAssembledForEntry.informationAssembledForEntry_angleYaw     = 0;
        this.informationAssembledForEntry.informationAssembledForEntry_positionX    = 0;
        this.informationAssembledForEntry.informationAssembledForEntry_positionY    = 0;
        this.informationAssembledForEntry.informationAssembledForEntry_positionZ    = 0;
        this.informationAssembledForEntry.informationAssembledForEntry_rangeHeight  = 0;
        this.informationAssembledForEntry.informationAssembledForEntry_altitude     = 0;
    }

    updateInformationAssembledForEntry()
    {
        if ( this.dataBlock != undefined && this.dataBlock.length == 18 )
        {
            let array = Uint8Array.from(this.dataBlock);
            let view  = new DataView(array.buffer);

            this.informationAssembledForEntry._updated                                  = true;
            this.informationAssembledForEntry.informationAssembledForEntry_angleRoll    = view.getInt16(0, true);
            this.informationAssembledForEntry.informationAssembledForEntry_anglePitch   = view.getInt16(2, true);
            this.informationAssembledForEntry.informationAssembledForEntry_angleYaw     = view.getInt16(4, true);
            this.informationAssembledForEntry.informationAssembledForEntry_positionX    = view.getInt16(6, true) / 100.0;
            this.informationAssembledForEntry.informationAssembledForEntry_positionY    = view.getInt16(8, true) / 100.0;
            this.informationAssembledForEntry.informationAssembledForEntry_positionZ    = view.getInt16(10, true) / 100.0;
            this.informationAssembledForEntry.informationAssembledForEntry_rangeHeight  = view.getInt16(12, true) / 100.0;
            this.informationAssembledForEntry.informationAssembledForEntry_altitude     = view.getFloat32(14, true);

            return true;
        }
        
        return false;
    }

    // #endregion Data Update



    /***************************************************************************************
     *  Communciation - 초기 연결 시 장치 확인
     ***************************************************************************************/
    // #region check Ack for first connection

    checkInitialAck(data, config)
    {
        this.receiverForDevice(data);

        if( this.targetDeviceID == undefined )
        {
            return false;
        }

        if( this.ack._updated )
        {
            config.id = this.targetDeviceID;
            return true;
        }

        return false;
    }
    // #endregion check Ack for first connection



    /***************************************************************************************
     *  Communciation - Entry로부터 받은 데이터를 장치에 전송
     ***************************************************************************************/
    // #region Data Transfer to Device from Entry

    read(handler, dataType, defaultValue = 0)
    {
        return handler.e(dataType) ? handler.read(dataType) : defaultValue;
    }

    /*
        Entry에서 받은 데이터 블럭 처리
        Entry에서 수신 받은 데이터는 bufferTransfer에 바로 등록

        * entryjs에서 변수값을 entry-hw로 전송할 때 절차

            1. Entry.hw.setDigitalPortValue("", value) 명령을 사용하여 지정한 변수의 값을 등록
            2. Entry.hw.update() 를 사용하여 등록된 값 전체 전달
            3. delete Entry.hw.sendQueue[""] 를 사용하여 전달한 값을 삭제

            위와 같은 절차로 데이터를 전송해야 1회만 전송 됨.
            Entry.hw.update를 호출하면 등록된 값 전체를 한 번에 즉시 전송하는 것으로 보임
    */
    handlerForEntry(handler)
    {
        if( this.bufferTransfer == undefined )
        {
            this.bufferTransfer = [];
        }

        // Buffer Clear
        if( handler.e(this.DataType.BUFFER_CLEAR) )
        {
            this.bufferTransfer = [];
        }

        let target = this.read(handler, this.DataType.TARGET, 0xFF);

        // Light Manual
        if( handler.e(this.DataType.LIGHT_MANUAL_FLAGS)       &&
            handler.e(this.DataType.LIGHT_MANUAL_BRIGHTNESS)  )
        {
            let flags       = this.read(handler, this.DataType.LIGHT_MANUAL_FLAGS);
            let brightness  = this.read(handler, this.DataType.LIGHT_MANUAL_BRIGHTNESS);

            let dataArray = this.reserveLightManual(target, flags, brightness);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - LightManual", dataArray);
        }


        // LightModeColor
        if(         handler.e(this.DataType.LIGHT_MODE_MODE)      &&
                    handler.e(this.DataType.LIGHT_MODE_INTERVAL)  &&
                    handler.e(this.DataType.LIGHT_COLOR_R)        &&
                    handler.e(this.DataType.LIGHT_COLOR_G)        &&
                    handler.e(this.DataType.LIGHT_COLOR_B)        )
        {
            let mode        = this.read(handler, this.DataType.LIGHT_MODE_MODE);
            let interval    = this.read(handler, this.DataType.LIGHT_MODE_INTERVAL);
            let r           = this.read(handler, this.DataType.LIGHT_COLOR_R);
            let g           = this.read(handler, this.DataType.LIGHT_COLOR_G);
            let b           = this.read(handler, this.DataType.LIGHT_COLOR_B);
            
            let dataArray = this.reserveLightModeColor(target, mode, interval, r, g, b);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - LightModeColor", dataArray);
        }
        // LightMode
        else if(    handler.e(this.DataType.LIGHT_MODE_MODE)      &&
                    handler.e(this.DataType.LIGHT_MODE_INTERVAL)  )
        {
            let mode        = this.read(handler, this.DataType.LIGHT_MODE_MODE);
            let interval    = this.read(handler, this.DataType.LIGHT_MODE_INTERVAL);

            let dataArray = this.reserveLightMode(target, mode, interval);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - LightMode", dataArray);
        }
        

        // LightEventColor
        if(         handler.e(this.DataType.LIGHT_EVENT_EVENT)     &&
                    handler.e(this.DataType.LIGHT_EVENT_INTERVAL)  &&
                    handler.e(this.DataType.LIGHT_EVENT_REPEAT)    &&
                    handler.e(this.DataType.LIGHT_COLOR_R)         &&
                    handler.e(this.DataType.LIGHT_COLOR_G)         &&
                    handler.e(this.DataType.LIGHT_COLOR_B)         )
        {
            let event       = this.read(handler, this.DataType.LIGHT_EVENT_EVENT);
            let interval    = this.read(handler, this.DataType.LIGHT_EVENT_INTERVAL);
            let repeat      = this.read(handler, this.DataType.LIGHT_EVENT_REPEAT);
            let r           = this.read(handler, this.DataType.LIGHT_COLOR_R);
            let g           = this.read(handler, this.DataType.LIGHT_COLOR_G);
            let b           = this.read(handler, this.DataType.LIGHT_COLOR_B);

            let dataArray = this.reserveLightEventColor(target, event, interval, repeat, r, g, b);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - LightEventColor", dataArray);
        }
        // LightEvent
        else if(    handler.e(this.DataType.LIGHT_EVENT_EVENT)     &&
                    handler.e(this.DataType.LIGHT_EVENT_INTERVAL)  &&
                    handler.e(this.DataType.LIGHT_EVENT_REPEAT)    )
        {
            let event       = this.read(handler, this.DataType.LIGHT_EVENT_EVENT);
            let interval    = this.read(handler, this.DataType.LIGHT_EVENT_INTERVAL);
            let repeat      = this.read(handler, this.DataType.LIGHT_EVENT_REPEAT);

            let dataArray = this.reserveLightEvent(target, event, interval, repeat);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - LightEvent", dataArray);
        }


        // 화면 전체 지우기
        if( handler.e(this.DataType.DISPLAY_CLEAR_ALL_PIXEL) )
        {
            let pixel   = this.read(handler, this.DataType.DISPLAY_CLEAR_ALL_PIXEL);

            let dataArray = this.reserveDisplayClearAll(target, pixel);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayClearAll", dataArray);
        }


        // 선택 영역 지우기
        if( handler.e(this.DataType.DISPLAY_CLEAR_WIDTH)  ||
            handler.e(this.DataType.DISPLAY_CLEAR_HEIGHT) )
        {
            let x       = this.read(handler, this.DataType.DISPLAY_CLEAR_X);
            let y       = this.read(handler, this.DataType.DISPLAY_CLEAR_Y);
            let width   = this.read(handler, this.DataType.DISPLAY_CLEAR_WIDTH);
            let height  = this.read(handler, this.DataType.DISPLAY_CLEAR_HEIGHT);
            let pixel   = this.read(handler, this.DataType.DISPLAY_CLEAR_PIXEL);

            let dataArray = this.reserveDisplayClear(target, x, y, width, height, pixel);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayClear", dataArray);
        }


        // 선택 영역 반전
        if( handler.e(this.DataType.DISPLAY_INVERT_WIDTH)  ||
            handler.e(this.DataType.DISPLAY_INVERT_HEIGHT) )
        {
            let x       = this.read(handler, this.DataType.DISPLAY_INVERT_X);
            let y       = this.read(handler, this.DataType.DISPLAY_INVERT_Y);
            let width   = this.read(handler, this.DataType.DISPLAY_INVERT_WIDTH);
            let height  = this.read(handler, this.DataType.DISPLAY_INVERT_HEIGHT);

            let dataArray = this.reserveDisplayInvert(target, x, y, width, height);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayInvert", dataArray);
        }


        // 화면에 점 찍기
        if( handler.e(this.DataType.DISPLAY_DRAW_POINT_X)      ||
            handler.e(this.DataType.DISPLAY_DRAW_POINT_Y)      ||
            handler.e(this.DataType.DISPLAY_DRAW_POINT_PIXEL)  )
        {
            let x       = this.read(handler, this.DataType.DISPLAY_DRAW_POINT_X);
            let y       = this.read(handler, this.DataType.DISPLAY_DRAW_POINT_Y);
            let pixel   = this.read(handler, this.DataType.DISPLAY_DRAW_POINT_PIXEL);
            
            let dataArray = this.reserveDisplayDrawPoint(target, x, y, pixel);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayDrawPoint", dataArray);
        }


        // 화면에 선 그리기
        if( handler.e(this.DataType.DISPLAY_DRAW_LINE_X1)  ||
            handler.e(this.DataType.DISPLAY_DRAW_LINE_Y1)  ||
            handler.e(this.DataType.DISPLAY_DRAW_LINE_X2)  ||
            handler.e(this.DataType.DISPLAY_DRAW_LINE_Y2)  )
        {
            let x1      = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_X1);
            let y1      = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_Y1);
            let x2      = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_X2);
            let y2      = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_Y2);
            let pixel   = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_PIXEL);
            let line    = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_LINE);
            
            let dataArray = this.reserveDisplayDrawLine(target, x1, y1, x2, y2, pixel, line);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayDrawLine", dataArray);
        }

        
        // 화면에 사각형 그리기
        if( handler.e(this.DataType.DISPLAY_DRAW_RECT_WIDTH)   ||
            handler.e(this.DataType.DISPLAY_DRAW_RECT_HEIGHT)  )
        {
            let x           = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_X);
            let y           = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_Y);
            let width       = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_WIDTH);
            let height      = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_HEIGHT);
            let pixel       = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_PIXEL);
            let flagfill    = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_FLAGFILL);
            let line        = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_LINE);

            let dataArray = this.reserveDisplayDrawRect(target, x, y, width, height, pixel, flagfill, line);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayDrawRect", dataArray);
        }


        // 화면에 원 그리기
        if( handler.e(this.DataType.DISPLAY_DRAW_CIRCLE_RADIUS) )
        {
            let x        = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_X);
            let y        = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_Y);
            let radius   = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_RADIUS);
            let pixel    = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_PIXEL);
            let flagfill = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_FLAGFILL);

            let dataArray = this.reserveDisplayDrawCircle(target, x, y, radius, pixel, flagfill);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayDrawCircle", dataArray);
        }


        // 화면에 문자열 쓰기
        if( handler.e(this.DataType.DISPLAY_DRAW_STRING_STRING) )
        {
            let x       = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_X);
            let y       = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_Y);
            let font    = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_FONT);
            let pixel   = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_PIXEL);
            let string  = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_STRING);

            let dataArray = this.reserveDisplayDrawString(target, x, y, font, pixel, string);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayDrawString", dataArray);
        }


        // 화면에 문자열 정렬하여 그리기
        if( handler.e(this.DataType.DISPLAY_DRAW_STRING_ALIGN_STRING) )
        {
            let x_start = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_X_START);
            let x_end   = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_X_END);
            let y       = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_Y);
            let align   = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_ALIGN);
            let font    = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_FONT);
            let pixel   = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_PIXEL);
            let string  = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_STRING);

            let dataArray = this.reserveDisplayDrawStringAlign(target, x_start, x_end, y, align, font, pixel, string);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - DisplayDrawStringAlign", dataArray);
        }


        // Command
        if( handler.e(this.DataType.COMMAND_COMMAND) )
        {
            let command = this.read(handler, this.DataType.COMMAND_COMMAND);
            let option  = this.read(handler, this.DataType.COMMAND_OPTION);

            switch( command )
            {
            case 0x01:  // CommandType::Stop
                {
                    // 정지 명령 시 조종 입력 값 초기화
                    this.controlRoll        = 0;
                    this.controlPitch       = 0;
                    this.controlYaw         = 0;
                    this.controlThrottle    = 0;
                }
                break;
            }

            let dataArray = this.reserveCommand(target, command, option);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - Command" + command + ", option: " + option, dataArray);
        }


        // Control
        if( handler.e(this.DataType.CONTROL_QUAD8_ROLL)     ||
            handler.e(this.DataType.CONTROL_QUAD8_PITCH)    ||
            handler.e(this.DataType.CONTROL_QUAD8_YAW)      ||
            handler.e(this.DataType.CONTROL_QUAD8_THROTTLE) )
        {
            let roll     = this.read(handler, this.DataType.CONTROL_QUAD8_ROLL,     this.controlRoll);
            let pitch    = this.read(handler, this.DataType.CONTROL_QUAD8_PITCH,    this.controlPitch);
            let yaw      = this.read(handler, this.DataType.CONTROL_QUAD8_YAW,      this.controlYaw);
            let throttle = this.read(handler, this.DataType.CONTROL_QUAD8_THROTTLE, this.controlThrottle);

            let dataArray = this.reserveControlQuad8(target, roll, pitch, yaw, throttle);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - ControlQuad8", dataArray);
        }


        // Control
        if( handler.e(this.DataType.CONTROL_POSITION_X)                   ||
            handler.e(this.DataType.CONTROL_POSITION_Y)                   ||
            handler.e(this.DataType.CONTROL_POSITION_Z)                   ||
            handler.e(this.DataType.CONTROL_POSITION_VELOCITY)            ||
            handler.e(this.DataType.CONTROL_POSITION_HEADING)             ||
            handler.e(this.DataType.CONTROL_POSITION_ROTATIONAL_VELOCITY) )
        {
            let x                   = this.read(handler, this.DataType.CONTROL_POSITION_X);
            let y                   = this.read(handler, this.DataType.CONTROL_POSITION_Y);
            let z                   = this.read(handler, this.DataType.CONTROL_POSITION_Z);
            let velocity            = this.read(handler, this.DataType.CONTROL_POSITION_VELOCITY);
            let heading             = this.read(handler, this.DataType.CONTROL_POSITION_HEADING);
            let rotationalVelocity  = this.read(handler, this.DataType.CONTROL_POSITION_ROTATIONAL_VELOCITY);

            let dataArray = this.reserveControlPosition(target, x, y, z, velocity, heading, rotationalVelocity);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - ControlPosition", dataArray);
        }


        // MotorSingle
        if( handler.e(this.DataType.MOTORSINGLE_TARGET) )
        {
            let targetMotor = this.read(handler, this.DataType.MOTORSINGLE_TARGET);
            let rotation    = this.read(handler, this.DataType.MOTORSINGLE_ROTATION);
            let value       = this.read(handler, this.DataType.MOTORSINGLE_VALUE);

            let dataArray = this.reserveMotorSingle(target, targetMotor, rotation, value);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - MotorSingle", dataArray);
        }


        // Buzzer
        if( handler.e(this.DataType.BUZZER_MODE) )
        {
            let mode     = this.read(handler, this.DataType.BUZZER_MODE);
            let value    = this.read(handler, this.DataType.BUZZER_VALUE);
            let time     = this.read(handler, this.DataType.BUZZER_TIME);

            let dataArray = this.reserveBuzzer(target, mode, value, time);
            this.bufferTransfer.push(dataArray);
            this.log("BYROBOT_BASE - Transfer_To_Device - Buzzer - mode: " + mode + ", value: " + value + ", time: " + time, dataArray);
        }


        // Vibrator
        if( handler.e(this.DataType.VIBRATOR_ON) )
        {
            let mode   = this.read(handler, this.DataType.VIBRATOR_MODE);
            let on     = this.read(handler, this.DataType.VIBRATOR_ON);
            let off    = this.read(handler, this.DataType.VIBRATOR_OFF);
            let total  = this.read(handler, this.DataType.VIBRATOR_TOTAL);

            let dataArray = this.reserveVibrator(target, mode, on, off, total);
            this.bufferTransfer.push(dataArray);

            this.log("BYROBOT_BASE - Transfer_To_Device - Vibrator", dataArray);
        }
    }


    // 전송 데이터 배열 생성
    // https://cryingnavi.github.io/javascript-typedarray/
    createTransferBlock(dataType, to, dataBuffer)
    {
        let dataBlock   = new ArrayBuffer(2 + 4 + dataBuffer.byteLength + 2);  // Start Code + Header + Data + CRC16
        let view        = new DataView(dataBlock);
        let dataArray   = new Uint8Array(dataBuffer);

        // Start Code
        {
            view.setUint8(0, 0x0A);
            view.setUint8(1, 0x55);
        }

        // Header
        {
            view.setUint8(2, dataType);                 // Data Type
            view.setUint8(3, dataBuffer.byteLength);    // Data Length
            view.setUint8(4, 0x82);                     // From (네이버 엔트리)
            view.setUint8(5, to);                       // To
        }

        // Data
        {
            for(let i=0; i<dataArray.length; i++)
            {
                view.setUint8((2 + 4 + i), dataArray[i]);
            }
        }

        // CRC16
        {
            let indexStart  = 2;
            let totalLength = 4 + dataArray.length; // 
            let crc16       = 0;

            for(let i=0; i<totalLength; i++)
            {
                crc16 = this.calcCRC16(view.getUint8(indexStart + i), crc16);
            }
            view.setUint16((2 + 4 + dataArray.length), crc16, true);
        }
        
        this.log("BYROBOT_BASE - createTransferBlock() - ", Array.from(new Uint8Array(dataBlock)))
        return Array.from(new Uint8Array(dataBlock));
    }


    // 값 추출
    getByte(value, index)
    {
        return ((value >> (index << 3)) & 0xff);
    }


    // #endregion Data Transfer to Device from Entry



    /***************************************************************************************
     *  Communciation - 장치로부터 받은 데이터를 Entry에 전송
     ***************************************************************************************/
    // #region Data Transfer to Entry from Device

    // Entry에 데이터 전송
    transferToEntry(handler)
    {
        // Joystick
        {
            let joystick = this.joystick;
            if( joystick._updated )
            {
                for(let key in joystick)
                {
                    handler.write(key, joystick[key]);
                }

                joystick._updated = false;
            }
        }

        // Button
        {
            let button = this.button;
            if( button._updated )
            {
                for(let key in button)
                {
                    handler.write(key, button[key]);
                }

                button._updated = false;
            }
        }

        // State
        {
            let state = this.state;
            if( state._updated )
            {
                for(let key in state)
                {
                    handler.write(key, state[key]);
                }

                state._updated = false;
            }
        }
    
        // InformationAssembledForEntry
        {
            let informationAssembledForEntry = this.informationAssembledForEntry;
            if( informationAssembledForEntry._updated )
            {
                for(let key in informationAssembledForEntry)
                {
                    handler.write(key, informationAssembledForEntry[key]);
                }
    
                informationAssembledForEntry._updated = false;
            }
        }

        // Entry-hw information
        {
            if( this.bufferTransfer == undefined )
            {
                this.bufferTransfer = [];
            }

            handler.write("entryhw_countTransferReserved", this.bufferTransfer.length);
        }
    }
    
    // #endregion Data Transfer to Entry from Device



    /***************************************************************************************
     *  Communciation - 장치로부터 받은 데이터를 검증
     ***************************************************************************************/
    // #region Data Receiver from Device

    // 장치로부터 받은 데이터 배열 처리
    receiverForDevice(dataArray)
    {
        this.log("BYROBOT_BASE - receiverForDevice() - " + dataArray.length, dataArray);

        if( dataArray == undefined || dataArray.length == 0 )
        {
            return;
        }

        let i = 0;

        // 버퍼로부터 데이터를 읽어 하나의 완성된 데이터 블럭으로 변환
        for(let i=0; i<dataArray.length; i++)
        {
            let data            = dataArray[i];
            
            let flagContinue    = true;
            let flagSessionNext = false;
            let flagComplete    = false;
            
            switch(this.indexSession)
            {
            case 0: // Start Code
                {               
                    switch( this.indexReceiver )
                    {
                    case 0:
                        if( data != 0x0A )
                        {
                            continue;
                        }
                        break;
                    
                    case 1:
                        if( data != 0x55 )
                        {
                            flagContinue = false;
                        }
                        else
                        {
                            flagSessionNext = true;
                        }
                        break;
                    }
                }
                break;

            case 1: // Header
                {
                    switch( this.indexReceiver )
                    {
                    case 0:
                        {
                            this.dataType = data;
                            this.crc16Calculated = this.calcCRC16(data, 0);
                        }
                        break;
                    
                    case 1:
                        {
                            this.dataLength = data;
                            this.crc16Calculated = this.calcCRC16(data, this.crc16Calculated);
                        }
                        break;
                    
                    case 2:
                        {
                            this.from = data;
                            this.crc16Calculated = this.calcCRC16(data, this.crc16Calculated);
                        }
                        break;
                    
                    case 3:
                        {
                            this.to = data;
                            this.crc16Calculated = this.calcCRC16(data, this.crc16Calculated);
                            this.dataBlock = [];        // 수신 받은 데이터 블럭
                            if( this.dataLength == 0 )
                            {
                                this.indexSession++;    // 데이터의 길이가 0인 경우 바로 CRC16으로 넘어가게 함
                            }
                            flagSessionNext = true;
                        }
                        break;
                    }
                }
                break;

            case 2: // Data
                {
                    this.dataBlock.push(data);
                    this.crc16Calculated = this.calcCRC16(data, this.crc16Calculated);
                    
                    if( this.indexReceiver == this.dataLength - 1 )
                    {
                        flagSessionNext = true;
                    }
                }
                break;

            case 3: // CRC16
                {
                    switch( this.indexReceiver )
                    {
                    case 0:
                        {
                            this.crc16Received = data;
                        }
                        break;
                    
                    case 1:
                        {
                            this.crc16Received = this.crc16Received + (data << 8);
                            flagComplete = true;
                        }
                        break;
                    }
                }
                break;

            default:
                {
                    flagContinue = false;
                }
                break;
            }

            // 데이터 전송 완료 처리
            if( flagComplete )
            {
                this.log("BYROBOT_BASE - Receiver - CRC16 - Calculated : " + this.crc16Calculated.toString(16).toUpperCase() + ", Received : " + this.crc16Received.toString(16).toUpperCase());
                if( this.crc16Calculated == this.crc16Received )
                {
                    this.handlerForDevice();
                }

                flagContinue = false;
            }

            // 데이터 처리 결과에 따라 인덱스 변수 처리
            if( flagContinue )
            {
                if( flagSessionNext )
                {
                    this.indexSession++;
                    this.indexReceiver = 0;             
                }
                else
                {
                    this.indexReceiver++;
                }
            }
            else
            {
                this.indexSession       = 0;        // 수신 받는 데이터의 세션
                this.indexReceiver      = 0;        // 수신 받는 데이터의 세션 내 위치
            }
        }
    }
    
    // #endregion Data Receiver from Device



    /***************************************************************************************
     *  Communciation - 장치로부터 받은 데이터 수신 처리
     ***************************************************************************************/
    // #region Data Handler for received data from Device

    // 장치로부터 받은 데이터 블럭 처리
    handlerForDevice()
    {
        // skip 할 대상만 case로 등록
        switch( this.dataType )
        {
        case 0x02:  break;      // Ack
        case 0x40:  break;      // State (0x40)
        case 0x41:  break;      // 
        case 0x42:  break;      // 
        case 0x43:  break;      // 
        case 0x44:  break;      // 
        case 0x45:  break;      // 
        case 0x70:  break;      // 
        case 0x71:  break;      // 
        case 0xA1:  break;      // 

        default:
            {
                this.log("BYROBOT_BASE - handlerForDevice() - From: " + this.from + " - To: " + this.to + " - Type: " + this.dataType + " - ", this.dataBlock);
            }
            break;
        }

        this.timeReceive = (new Date()).getTime();

        // 상대측에 정상적으로 데이터를 전달했는지 확인
        switch( this.dataType )
        {
        case 0x02:  // Ack
            {
                if( this.updateAck() )
                {
                    // ping에 대한 ack는 로그 출력하지 않음
                    //if( this.ack.dataType != 0x01 )
                    {
                        this.log("BYROBOT_BASE - handlerForDevice() - Ack - From: " + this.from + " - SystemTime: " + this.ack.ack_systemTime + " - DataType: " + this.ack.ack_dataType + " - Repeat: " + this.countTransferRepeat + " - CRC16 Transfer: " + this.crc16Transfered + " - CRF16 Ack: " + this.ack.ack_crc16);
                    }

                    // 마지막으로 전송한 데이터에 대한 응답을 받았다면 
                    if( this.bufferTransfer         != undefined         &&
                        this.bufferTransfer.length  > 0                  &&
                        this.dataTypeLastTransfered == this.ack.dataType &&
                        this.crc16Transfered        == this.ack.crc16    )
                    {
                        this.bufferTransfer.shift();
                        this.countTransferRepeat = 0;
                    }
                }
            }
            break;

        default:
            {
                // 마지막으로 요청한 데이터를 받았다면 
                if( this.bufferTransfer         != undefined     &&
                    this.bufferTransfer.length  > 0              &&
                    this.dataTypeLastTransfered == this.dataType )
                {
                    this.bufferTransfer.shift();
                    this.countTransferRepeat = 0;
                    
                    this.log("BYROBOT_BASE - handlerForDevice() - Response - From: " + this.from + " - DataType: " + this.dataType);
                }
            }
            break;
        }

        // 데이터 업데이트
        switch( this.dataType )
        {
        case 0x40:  // State
            {
                this.log("BYROBOT_BASE - handlerForDevice() - Received - State - 0x40");
                this.updateState();
            }
            break;


        case 0x70:  // Button
            {
                this.log("BYROBOT_BASE - handlerForDevice() - Received - Button - 0x70");
                this.updateButton();
            }
            break;


        case 0x71:  // Joystick
            {
                this.log("BYROBOT_BASE - handlerForDevice() - Received - Joystick - 0x71");
                this.updateJoystick();
            }
            break;


        case 0xA1:  // Information Assembled For Entry 자주 갱신되는 데이터 모음(엔트리)
            {
                this.log("BYROBOT_BASE - handlerForDevice() - Received - InformationAssembledForEntry - 0xA1");
                this.updateInformationAssembledForEntry();
            }
            break;


        default:
            break;
        }
    }


    // #endregion Data Receiver for received data from Device



    /***************************************************************************************
     *  Communciation - 데이터를 장치로 전송(주기적으로 호출됨)
     ***************************************************************************************/
    // #region Data Transfer

    // 장치에 데이터 전송
    transferToDevice()
    {
        let now = (new Date()).getTime();

        if( now < this.timeTransferNext )
        {
            return null;
        }
        
        this.timeTransferNext = now + this.timeTransferInterval;

        if( this.bufferTransfer == undefined )
        {
            this.bufferTransfer = [];
        }

        this.countReqeustDevice++;

        if( this.bufferTransfer.length == 0 )
        {
            // 예약된 요청이 없는 경우 데이터 요청 등록(현재는 자세 데이터 요청)
            switch( this.targetDevice )
            {
            case 0x10:
                {
                    switch( this.countReqeustDevice % 6 )
                    {
                    case 0:    return this.reservePing(0x10);              // 드론
                    case 2:    return this.reservePing(0x20);              // 조종기
                    case 4:    return this.reserveRequest(0x10, 0x40);     // 드론
                    default:   return this.reserveRequest(0x10, 0xA1);     // 드론, 자주 갱신되는 데이터 모음(엔트리)
                    }
                }
                break;

            default:
                {
                    return this.reservePing(this.targetDevice);
                }
                break;
            }
        }
        else
        {
            // 예약된 요청이 있는 경우
            switch( this.targetDevice )
            {
            case 0x10:
                {
                    switch (this.countReqeustDevice % 3)
                    {
                        case 1:     return this.reserveRequest(0x10, 0xA1);     // 드론, 자주 갱신되는 데이터 모음(엔트리)
                        default:    break;
                    }
                }
                break;

            default:
                {
                    switch( this.countReqeustDevice % 10 )
                    {
                    case 0:     return this.reservePing(this.targetDevice);
                    default:    break;
                    }
                }
                break;
            }
        }

        // 예약된 데이터 전송 처리
        let arrayTransfer = this.bufferTransfer[0];             // 전송할 데이터 배열(첫 번째 데이터 블럭 전송)
        if( arrayTransfer[2] == 0x04 )
        {
            this.dataTypeLastTransfered = arrayTransfer[6];     // 요청한 데이터의 타입(Request인 경우)
        }
        else
        {
            this.dataTypeLastTransfered = arrayTransfer[2];     // 전송한 데이터의 타입(이외의 모든 경우)
        }
        this.countTransferRepeat++;
        this.timeTransfer = (new Date()).getTime();

        this.crc16Transfered = (arrayTransfer[arrayTransfer.length - 1] << 8) | (arrayTransfer[arrayTransfer.length - 2]);

        //this.log("BYROBOT_BASE - transferToDevice - Repeat: " + this.countTransferRepeat, this.bufferTransfer[0]);

        // maxTransferRepeat 이상 전송했음에도 응답이 없는 경우엔 다음으로 넘어감
        if( this.countTransferRepeat >= this.maxTransferRepeat)
        {
            this.bufferTransfer.shift();
            this.countTransferRepeat = 0;
        }

        return arrayTransfer;
    }

    // #endregion Data Transfer



    /***************************************************************************************
     *  Communciation - 장치 전송용 데이터 배열 생성
     ***************************************************************************************/
    // #region Data Transfer Functions for Device

    /*
    // Ping (데이터 배열 직접 생성)
    reservePing(target)
    {
        let dataArray = [];

        // Start Code
        dataArray.push(0x0A);           // Data Type (UpdateLookupTarget)
        dataArray.push(0x55);           // Data Length
        
        let dataLength = 8;             // 데이터의 길이

        // Header
        dataArray.push(0x01);           // Data Type (UpdateLookupTarget)
        dataArray.push(dataLength);     // Data Length
        dataArray.push(0x82);           // From
        dataArray.push(target);           // To

        // Data Array
        dataArray.push(0x00);           // systemTime
        dataArray.push(0x00);
        dataArray.push(0x00);
        dataArray.push(0x00);
        dataArray.push(0x00)
        dataArray.push(0x00);
        dataArray.push(0x00);
        dataArray.push(0x00);

        // CRC16
        {
            let indexStart  = 2;
            let totalLength = 4 + 8; // 
            let crc16       = 0;

            for(let i=0; i<totalLength; i++)
            {
                crc16 = this.calcCRC16(dataArray[indexStart + i], crc16);
            }
            dataArray.push(this.getByte(crc16, 0));
            dataArray.push(this.getByte(crc16, 1));
        }

        //this.log("BYROBOT_BASE - reservePing()", dataArray);
        
        return dataArray;
    }
    // */

    //*
    // Ping
    reservePing(target)
    {
        let dataArray   = new ArrayBuffer(8);
        let view        = new DataView(dataArray);

        view.setUint32(0, 0, true);
        view.setUint32(4, 0, true);

        this.log("BYROBOT_BASE - reservePing() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x01, target, dataArray);
    }
    // */


    // 데이터 요청
    reserveRequest(target, dataType)
    {
        let dataArray   = new ArrayBuffer(1);
        let view        = new DataView(dataArray);

        view.setUint8(0, dataType);

        this.log("BYROBOT_BASE - reserveRequest() - Target: 0x" + target.toString(16).toUpperCase() + " - DataType: 0x", dataType.toString(16).toUpperCase());
        return this.createTransferBlock(0x04, target, dataArray);
    }


    // Light Manual
    reserveLightManual(target, flag, brightness)
    {
        let dataArray   = new ArrayBuffer(3);
        let view        = new DataView(dataArray);

        view.setUint16  (0, flag, true);
        view.setUint8   (2, brightness);

        this.log("BYROBOT_BASE - reserveLightManual() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x20, target, dataArray);
    }


    // LightModeColor
    reserveLightModeColor(target, mode, interval, r, g, b)
    {
        let dataArray   = new ArrayBuffer(6);
        let view        = new DataView(dataArray);

        view.setUint8   (0, mode);
        view.setUint16  (1, interval, true);
        view.setUint8   (3, r);
        view.setUint8   (4, g);
        view.setUint8   (5, b);

        this.log("BYROBOT_BASE - reserveLightModeColor() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x21, target, dataArray);
    }


    // LightMode
    reserveLightMode(target, mode, interval)
    {
        let dataArray   = new ArrayBuffer(3);
        let view        = new DataView(dataArray);

        view.setUint8   (0, mode);
        view.setUint16  (1, interval, true);

        this.log("BYROBOT_BASE - reserveLightMode() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x21, target, dataArray);
    }


    // LightEventColor
    reserveLightEventColor(target, event, interval, repeat, r, g, b)
    {
        let dataArray   = new ArrayBuffer(7);
        let view        = new DataView(dataArray);

        view.setUint8   (0, event);
        view.setUint16  (1, interval, true);
        view.setUint8   (3, repeat);
        view.setUint8   (4, r);
        view.setUint8   (5, g);
        view.setUint8   (6, b);

        this.log("BYROBOT_BASE - reserveLightEventColor() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x22, target, dataArray);
    }


    // LightEvent
    reserveLightEvent(target, event, interval, repeat)
    {
        let dataArray   = new ArrayBuffer(4);
        let view        = new DataView(dataArray);

        view.setUint8   (0, event);
        view.setUint16  (1, interval, true);
        view.setUint8   (3, repeat);

        this.log("BYROBOT_BASE - reserveLightEvent() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x22, target, dataArray);
    }


    // DisplayClearAll
    reserveDisplayClearAll(target, pixel)
    {
        let dataArray   = new ArrayBuffer(1);
        let view        = new DataView(dataArray);

        view.setUint8   (0, pixel);

        this.log("BYROBOT_BASE - reserveDisplayClearAll() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x80, target, dataArray);
    }


    // DisplayClear
    reserveDisplayClear(target, x, y, width, height, pixel)
    {
        let dataArray   = new ArrayBuffer(9);
        let view        = new DataView(dataArray);

        view.setInt16   (0, x, true);
        view.setInt16   (2, y, true);
        view.setInt16   (4, width, true);
        view.setInt16   (6, height, true);
        view.setUint8   (8, pixel);

        this.log("BYROBOT_BASE - reserveDisplayClear() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x80, target, dataArray);
    }


    // DisplayInvert
    reserveDisplayInvert(target, x, y, width, height)
    {
        let dataArray   = new ArrayBuffer(8);
        let view        = new DataView(dataArray);

        view.setInt16   (0, x, true);
        view.setInt16   (2, y, true);
        view.setInt16   (4, width, true);
        view.setInt16   (6, height, true);

        this.log("BYROBOT_BASE - reserveDisplayInvert() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x81, target, dataArray);
    }


    // DisplayDrawPoint
    reserveDisplayDrawPoint(target, x, y, pixel)
    {
        let dataArray   = new ArrayBuffer(5);
        let view        = new DataView(dataArray);

        view.setInt16   (0, x, true);
        view.setInt16   (2, y, true);
        view.setUint8   (4, pixel);

        this.log("BYROBOT_BASE - reserveDisplayDrawPoint() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x82, target, dataArray);
    }


    // DisplayDrawLine
    reserveDisplayDrawLine(target, x1, y1, x2, y2, pixel, line)
    {
        let dataArray   = new ArrayBuffer(10);
        let view        = new DataView(dataArray);

        view.setInt16   (0, x1, true);
        view.setInt16   (2, y1, true);
        view.setInt16   (4, x2, true);
        view.setInt16   (6, y2, true);
        view.setUint8   (8, pixel);
        view.setUint8   (9, line);

        this.log("BYROBOT_BASE - reserveDisplayDrawLine() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x83, target, dataArray);
    }


    // DisplayDrawRect
    reserveDisplayDrawRect(target, x, y, width, height, pixel, flagFill, line)
    {
        let dataArray   = new ArrayBuffer(11);
        let view        = new DataView(dataArray);

        view.setInt16   (0, x, true);
        view.setInt16   (2, y, true);
        view.setInt16   (4, width, true);
        view.setInt16   (6, height, true);
        view.setUint8   (8, pixel);
        view.setUint8   (9, flagFill);
        view.setUint8   (10, line);

        this.log("BYROBOT_BASE - reserveDisplayDrawRect() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x84, target, dataArray);
    }


    // DisplayDrawCircle
    reserveDisplayDrawCircle(target, x, y, radius, pixel, flagFill)
    {
        let dataArray   = new ArrayBuffer(8);
        let view        = new DataView(dataArray);

        view.setInt16   (0, x, true);
        view.setInt16   (2, y, true);
        view.setInt16   (4, radius, true);
        view.setUint8   (6, pixel);
        view.setUint8   (7, flagFill);

        this.log("BYROBOT_BASE - reserveDisplayDrawCircle() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x85, target, dataArray);
    }


    // DisplayDrawString
    reserveDisplayDrawString(target, x, y, font, pixel, string)
    {
        let byteArrayString = this.stringToAsciiByteArray(string);

        let dataArray   = new ArrayBuffer(6 + byteArrayString.length);
        let view        = new DataView(dataArray);

        view.setInt16   (0, x, true);
        view.setInt16   (2, y, true);
        view.setUint8   (4, font);
        view.setUint8   (5, pixel);

        for (let i = 0; i < byteArrayString.length; i++)
        {
            view.setUint8((6 + i), byteArrayString[i]);
        }

        this.log("BYROBOT_BASE - reserveDisplayDrawString() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x86, target, dataArray);
    }


    // DisplayDrawString
    reserveDisplayDrawStringAlign(target, x_start, x_end, y, align, font, pixel, string)
    {
        let byteArrayString = this.stringToAsciiByteArray(string);

        let dataArray   = new ArrayBuffer(9 + byteArrayString.length);
        let view        = new DataView(dataArray);

        view.setInt16   (0, x_start, true);
        view.setInt16   (2, x_end, true);
        view.setInt16   (4, y, true);
        view.setUint8   (6, align);
        view.setUint8   (7, font);
        view.setUint8   (8, pixel);

        for (let i = 0; i < byteArrayString.length; i++)
        {
            view.setUint8((9 + i), byteArrayString[i]);
        }

        this.log("BYROBOT_BASE - reserveDisplayDrawStringAlign() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x87, target, dataArray);
    }


    // Command
    reserveCommand(target, command, option)
    {
        let dataArray   = new ArrayBuffer(2);
        let view        = new DataView(dataArray);

        view.setUint8   (0, command);
        view.setUint8   (1, option);

        this.log("BYROBOT_BASE - reserveCommand() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x11, target, dataArray);
    }


    // ControlQuad8
    reserveControlQuad8(target, roll, pitch, yaw, throttle)
    {
        let dataArray   = new ArrayBuffer(4);
        let view        = new DataView(dataArray);

        view.setInt8   (0, roll);
        view.setInt8   (1, pitch);
        view.setInt8   (2, yaw);
        view.setInt8   (3, throttle);
        
        this.controlRoll        = roll;
        this.controlPitch       = pitch;
        this.controlYaw         = yaw;
        this.controlThrottle    = throttle;

        this.log("BYROBOT_BASE - reserveControlQuad8() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x10, target, dataArray);
    }


    // ControlPosition
    reserveControlPosition(target, x, y, z, velocity, heading, rotationalVelocity)
    {
        let dataArray   = new ArrayBuffer(20);
        let view        = new DataView(dataArray);

        view.setFloat32 (0,  x, true);
        view.setFloat32 (4,  y, true);
        view.setFloat32 (8,  z, true);
        view.setFloat32 (12, velocity, true);
        view.setInt16   (16, heading, true);
        view.setInt16   (18, rotationalVelocity, true);

        this.log("BYROBOT_BASE - reserveControlPosition() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x10, target, dataArray);
    }


    // MotorSingle
    reserveMotorSingle(target, motor, rotation, value)
    {
        let dataArray   = new ArrayBuffer(4);
        let view        = new DataView(dataArray);

        view.setUint8   (0, motor);
        view.setUint8   (1, rotation);
        view.setInt16   (2, value);

        this.log("BYROBOT_BASE - reserveMotorSingle() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x61, target, dataArray);
    }


    // Buzzer
    reserveBuzzer(target, mode, value, time)
    {
        let dataArray   = new ArrayBuffer(5);
        let view        = new DataView(dataArray);

        view.setUint8   (0, mode);
        view.setUint16  (1, value, true);
        view.setUint16  (3, time, true);

        this.log("BYROBOT_BASE - reserveBuzzer() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x62, target, dataArray);
    }


    // Vibrator
    reserveVibrator(target, mode, on, off, total)
    {
        let dataArray   = new ArrayBuffer(7);
        let view        = new DataView(dataArray);

        view.setUint8   (0, mode);
        view.setUint16  (1, on, true);
        view.setUint16  (3, off, true);
        view.setUint16  (5, total, true);

        this.log("BYROBOT_BASE - reserveVibrator() - Target: 0x" + target.toString(16).toUpperCase());
        return this.createTransferBlock(0x63, target, dataArray);
    }


    // #endregion Data Transfer Functions for Device



    /***************************************************************************************
     *  자바스크립트 바이너리 핸들링
     *  http://mohwa.github.io/blog/javascript/2015/08/31/binary-inJS/
     ***************************************************************************************/
    // #region Functions for Binary Handling




    /***************************************************************************************
     *  CRC16
     ***************************************************************************************/
    // #region CRC16

    /*
    * Copyright 2001-2010 Georges Menie (www.menie.org)
    * All rights reserved.
    * Redistribution and use in source and binary forms, with or without
    * modification, are permitted provided that the following conditions are met:
    *
    *     * Redistributions of source code must retain the above copyright
    *       notice, this list of conditions and the following disclaimer.
    *     * Redistributions in binary form must reproduce the above copyright
    *       notice, this list of conditions and the following disclaimer in the
    *       documentation and/or other materials provided with the distribution.
    *     * Neither the name of the University of California, Berkeley nor the
    *       names of its contributors may be used to endorse or promote products
    *       derived from this software without specific prior written permission.
    *
    * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
    * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    * DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
    * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    */
    createCRC16Array()
    {
        this.log("BYROBOT_BASE - createCRC16Array()");

        this.crc16table =
        [
            0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
            0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
            0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
            0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
            0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
            0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
            0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
            0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
            0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
            0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
            0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
            0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
            0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
            0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
            0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
            0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
            0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
            0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
            0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
            0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
            0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
            0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
            0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
            0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
            0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
            0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
            0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
            0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
            0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
            0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
            0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
            0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
        ];
    }

    calcCRC16(data, crc)
    {
        if( data > 255 )
        {
            throw new RangeError();
        }

        let index   = ((crc>>8) ^ data) & 0x00FF;
        let crcNext = ((crc<<8) & 0xFFFF) ^ this.crc16table[index];

        return crcNext;
    }
    // #endregion CRC16



    /***************************************************************************************
     *  로그 출력
     ***************************************************************************************/
    // #region Functions for log

    log(message, data = undefined)
    {
        // 로그를 출력하지 않으려면 아래 주석을 활성화 할 것
        //*
        let strInfo = "";

        switch( typeof data )
        {
        case "object":
            {
                strInfo = " - [ " + this.convertByteArrayToHexString(data) + " ]";
                console.log(message + " - " + (typeof data) + strInfo);
            }
            break;

        default:
            {
                console.log(message);
            }
            break;
        }
        // */
    }


    // 바이트 배열을 16진수 문자열로 변경 
    convertByteArrayToHexString(data)
    {
        let strHexArray = "";
        let strHex;

        if( typeof data == "object" && data.length > 1 )
        {
            for(let i=0; i<data.length; i++)
            {
                strHex = data[i].toString(16).toUpperCase();
                strHexArray += " ";
                if( strHex.length == 1 )
                {
                    strHexArray += "0";
                }
                strHexArray += strHex;
            }
            strHexArray = strHexArray.substr(1, strHexArray.length - 1);
        }
        else
        {
            strHexArray = data.toString();
        }
        
        return strHexArray;
    }


    // 입력받은 문자열 처리
    // https://stackoverflow.com/questions/6226189/how-to-convert-a-string-to-bytearray
    stringToAsciiByteArray(str)
    {
        let bytes = [];
        for(let i=0; i<str.length; i++)
        {
            let charCode = str.charCodeAt(i);
            if( charCode > 0xFF )  // char > 1 byte since charCodeAt returns the UTF-16 value
            {
                // throw new Error('Character ' + String.fromCharCode(charCode) + ' can\'t be represented by a US-ASCII byte.');
                continue;
            }
            bytes.push(charCode);
        }
        return bytes;
    }

    // #endregion Functions for log

}


module.exports = byrobot_base;

