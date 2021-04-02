/* eslint-disable brace-style */
/* eslint-disable max-len */
/*jshint esversion: 6 */
const BaseModule = require('./baseModule');


/***************************************************************************************
 *
 *  기본 클래스
 *
 * - 송수신 데이터 정의 문서
 *   http://dev.byrobot.co.kr/documents/kr/products/e_drone/protocol/
 *
 * - 호환 제품군
 *   - XTS-65
 *   - SkyKick V2
 *   - E-DRONE
 *   - Coding Drone
 *   - Battle Drone
 *
 * - 마지막 업데이트
 *   - 2020.6.10
 *
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

        this.log('BYROBOT_BASE');
        this.log('BASE - constructor()');

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

            // BATTLE_IR_MESSAGE
            BATTLE_IR_MESSAGE           : 'battle_ir_message',

            // Light Manual
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
            BUZZER_MODE             : 'buzzer_mode',
            BUZZER_VALUE            : 'buzzer_value',
            BUZZER_TIME             : 'buzzer_time',

            // Vibrator
            VIBRATOR_MODE           : 'vibrator_mode',
            VIBRATOR_ON             : 'vibrator_on',
            VIBRATOR_OFF            : 'vibrator_off',
            VIBRATOR_TOTAL          : 'vibrator_total',

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
            state_controlSpeed      : 0,    // u8
            state_sensorOrientation : 0,    // u8
            state_battery           : 0,    // u8
        };


        // Motion
        this.motion =
        {
            _updated            : 1,
            motion_accelX       : 0,    // u16
            motion_accelY       : 0,    // u16
            motion_accelZ       : 0,    // u16
            motion_gyroRoll     : 0,    // u16
            motion_gyroPitch    : 0,    // u16
            motion_gyroYaw      : 0,    // u16
            motion_angleRoll    : 0,    // u16
            motion_anglePitch   : 0,    // u16
            motion_angleYaw     : 0,    // u16
        };


        // Range
        this.range =
        {
            _updated        : 1,
            range_left      : 0,    // u16
            range_front     : 0,    // u16
            range_right     : 0,    // u16
            range_rear      : 0,    // u16
            range_top       : 0,    // u16
            range_bottom    : 0,    // u16
        };


        // BattleIrMessage
        this.battleIrMessage =
        {
            _updated            : 1,
            battle_ir_message    : 0,    // u32
        };


        // CardColor
        this.cardColor =
        {
            _updated                    : 1,
            cardColor_frontHue          : 0,    // u16
            cardColor_frontSaturation   : 0,    // u16
            cardColor_frontValue        : 0,    // u16
            cardColor_frontLightness    : 0,    // u16
            cardColor_rearHue           : 0,    // u16
            cardColor_rearSaturation    : 0,    // u16
            cardColor_rearValue         : 0,    // u16
            cardColor_rearLightness     : 0,    // u16
            cardColor_frontColor        : 0,    // u8
            cardColor_rearColor         : 0,    // u8
            cardColor_card              : 0,    // u8
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

        this.log('BASE - init()');
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
        this.isConnect = true;
        this.serialport = serialport;

        //this.log(`BASE - requestInitialData(0x${this.targetDevice.toString(16).toUpperCase()})`);
        return this.reservePing(this.targetDevice);
    }


    /*
        초기 수신데이터 체크(필수)
        연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
     */
    checkInitialData(data, config)
    {
        this.log('BASE - checkInitialData()');
        return this.checkInitialAck(data, config);
    }


    /*
        주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    */
    validateLocalData(data)
    {
        //this.log("BASE - validateLocalData()");
        return true;
    }


    /*
        하드웨어에 전달할 데이터

        하드웨어 기기에 전달할 데이터를 반환합니다.
        slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData()
    {
        //this.log("BASE - requestLocalData()");
        return this.transferToDevice();
    }


    /*
        하드웨어에서 온 데이터 처리
    */
    handleLocalData(data)
    {
        //this.log("BASE - handleLocalData()");
        this.receiverForDevice(data);
    }


    /*
        엔트리로 전달할 데이터
    */
    requestRemoteData(handler)
    {
        //this.log("BASE - requestRemoteData()");
        this.transferToEntry(handler);
    }


    /*
        엔트리에서 받은 데이터에 대한 처리
    */
    handleRemoteData(handler)
    {
        //this.log("BASE - handleRemoteData()");
        this.handlerForEntry(handler);
    }


    connect()
    {
        this.log('BASE - connect()');
    }


    disconnect(connect)
    {
        this.log('BASE - disconnect()');

        connect.close();

        this.isConnect  = false;
        this.serialport = undefined;
    }


    /*
        Web Socket 종료후 처리
    */
    reset()
    {
        this.log('BASE - reset()');
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

        // Motion
        this.clearMotion();

        // Range
        this.clearRange();

        // BattleIrMessage
        this.clearBattleIrMessage();

        // Range
        this.clearCardColor();

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
        this.timeTransferInterval   = 20;       // 최소 전송 시간 간격

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

    updateAck()
    {
        //this.log("BASE - updateAck()");

        if (this.dataBlock != undefined && this.dataBlock.length == 11)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

            this.ack._updated       = true;
            this.ack.ack_systemTime = view.getBigUint64(0, true);
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
        this.state.state_controlSpeed       = 0;
        this.state.state_sensorOrientation  = 0;
        this.state.state_battery            = 0;
    }

    updateState()
    {
        //this.log(`BASE - updateState() - length : ${this.dataBlock.length}`);

        if (this.dataBlock != undefined && this.dataBlock.length == 8)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

            this.state._updated                 = true;
            this.state.state_modeSystem         = view.getUint8(0);
            this.state.state_modeFlight         = view.getUint8(1);
            this.state.state_modeControlFlight  = view.getUint8(2);
            this.state.state_modeMovement       = view.getUint8(3);
            this.state.state_headless           = view.getUint8(4);
            this.state.state_controlSpeed       = view.getUint8(5);
            this.state.state_sensorOrientation  = view.getUint8(6);
            this.state.state_battery            = view.getUint8(7);

            return true;
        }

        return false;
    }


    clearButton()
    {
        this.button._updated           = false;
        this.button.button_button      = 0;
        this.button.button_event       = 0;
    }

    updateButton()
    {
        //this.log(`BASE - updateButton() - length : ${this.dataBlock.length}`);

        if (this.dataBlock != undefined && this.dataBlock.length == 3)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

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
        //this.log(`BASE - updateJoystick() - length : ${this.dataBlock.length}`);

        if (this.dataBlock != undefined && this.dataBlock.length == 8)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

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


    clearMotion()
    {
        this.motion._updated            = false;
        this.motion.motion_accelX       = 0;
        this.motion.motion_accelY       = 0;
        this.motion.motion_accelZ       = 0;
        this.motion.motion_gyroRoll     = 0;
        this.motion.motion_gyroPitch    = 0;
        this.motion.motion_gyroYaw      = 0;
        this.motion.motion_angleRoll    = 0;
        this.motion.motion_anglePitch   = 0;
        this.motion.motion_angleYaw     = 0;
    }

    updateMotion()
    {
        this.log(`BASE - updateMotion() - length : ${this.dataBlock.length}`);

        if (this.dataBlock != undefined && this.dataBlock.length == 18)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

            //*
            this.motion._updated            = true;
            this.motion.motion_accelX       = view.getInt16(0, true);
            this.motion.motion_accelY       = view.getInt16(2, true);
            this.motion.motion_accelZ       = view.getInt16(4, true);
            this.motion.motion_gyroRoll     = view.getInt16(6, true);
            this.motion.motion_gyroPitch    = view.getInt16(8, true);
            this.motion.motion_gyroYaw      = view.getInt16(10, true);
            this.motion.motion_angleRoll    = view.getInt16(12, true);
            this.motion.motion_anglePitch   = view.getInt16(14, true);
            this.motion.motion_angleYaw     = view.getInt16(16, true);
            // */

            /*
            const kAccel  = (9.8f / 2048);          // 1g (중력가속도) = 9.8 m/s^2 로 만들기 위한 변환 상수
            const kGyro   = (2000.0f / 32767);      // 각 속도 (deg/s) 를 만들기 위한 변환 상수

            this.motion._updated            = true;
            this.motion.motion_accelX       = (view.getInt16(0, true) * kAccel).toFixed(2);
            this.motion.motion_accelY       = (view.getInt16(2, true) * kAccel).toFixed(2);
            this.motion.motion_accelZ       = (view.getInt16(4, true) * kAccel).toFixed(2);
            this.motion.motion_gyroRoll     = (view.getInt16(6, true) * kGyro).toFixed(2);
            this.motion.motion_gyroPitch    = (view.getInt16(8, true) * kGyro).toFixed(2);
            this.motion.motion_gyroYaw      = (view.getInt16(10, true) * kGyro).toFixed(2);
            this.motion.motion_angleRoll    = view.getInt16(12, true);
            this.motion.motion_anglePitch   = view.getInt16(14, true);
            this.motion.motion_angleYaw     = view.getInt16(16, true);
            // */

            return true;
        }

        return false;
    }


    clearRange()
    {
        this.range._updated       = false;
        this.range.range_left     = 0;
        this.range.range_front    = 0;
        this.range.range_right    = 0;
        this.range.range_rear     = 0;
        this.range.range_top      = 0;
        this.range.range_bottom   = 0;
    }

    updateRange()
    {
        this.log(`BASE - updateRange() - length : ${this.dataBlock.length}`);

        if (this.dataBlock != undefined && this.dataBlock.length == 12)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

            this.range._updated        = true;
            this.range.range_left      = view.getInt16(0, true) / 1000.0;
            this.range.range_front     = view.getInt16(2, true) / 1000.0;
            this.range.range_right     = view.getInt16(4, true) / 1000.0;
            this.range.range_rear      = view.getInt16(6, true) / 1000.0;
            this.range.range_top       = view.getInt16(8, true) / 1000.0;
            this.range.range_bottom    = view.getInt16(10, true) / 1000.0;

            return true;
        }

        return false;
    }


    clearBattleIrMessage()
    {
        this.battleIrMessage._updated            = false;
        this.battleIrMessage.battle_ir_message   = 0;
    }

    updateBattleIrMessage()
    {
        this.log(`BASE - updateBattleIrMessage() - length : ${this.dataBlock.length}`);

        if (this.dataBlock != undefined && this.dataBlock.length == 1)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

            this.battleIrMessage._updated            = true;
            this.battleIrMessage.battle_ir_message   = view.getUint8(0, true);

            return true;
        }

        return false;
    }


    clearCardColor()
    {
        this.cardColor._updated                     = false;
        this.cardColor.cardColor_frontHue           = 0;
        this.cardColor.cardColor_frontSaturation    = 0;
        this.cardColor.cardColor_frontValue         = 0;
        this.cardColor.cardColor_frontLightness     = 0;
        this.cardColor.cardColor_rearHue            = 0;
        this.cardColor.cardColor_rearSaturation     = 0;
        this.cardColor.cardColor_rearValue          = 0;
        this.cardColor.cardColor_rearLightness      = 0;
        this.cardColor.cardColor_frontColor         = 0;
        this.cardColor.cardColor_rearColor          = 0;
        this.cardColor.cardColor_card               = 0;
    }

    updateCardColor()
    {
        this.log(`BASE - updateCardColor() - length : ${this.dataBlock.length}`);

        if (this.dataBlock != undefined && this.dataBlock.length == 19)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

            this.cardColor._updated                     = true;
            this.cardColor.cardColor_frontHue           = view.getInt16(0, true);
            this.cardColor.cardColor_frontSaturation    = view.getInt16(2, true);
            this.cardColor.cardColor_frontValue         = view.getInt16(4, true);
            this.cardColor.cardColor_frontLightness     = view.getInt16(6, true);
            this.cardColor.cardColor_rearHue            = view.getInt16(8, true);
            this.cardColor.cardColor_rearSaturation     = view.getInt16(10, true);
            this.cardColor.cardColor_rearValue          = view.getInt16(12, true);
            this.cardColor.cardColor_rearLightness      = view.getInt16(14, true);
            this.cardColor.cardColor_frontColor         = view.getUint8(16, true);
            this.cardColor.cardColor_rearColor          = view.getUint8(17, true);
            this.cardColor.cardColor_card               = view.getUint8(18, true);
            
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
        //this.log(`BASE - updateInformationAssembledForEntry() - length : ${this.dataBlock.length}`);

        if (this.dataBlock != undefined && this.dataBlock.length == 18)
        {
            const array = Uint8Array.from(this.dataBlock);
            const view  = new DataView(array.buffer);

            this.informationAssembledForEntry._updated                                  = true;
            this.informationAssembledForEntry.informationAssembledForEntry_angleRoll    = view.getInt16(0, true);
            this.informationAssembledForEntry.informationAssembledForEntry_anglePitch   = view.getInt16(2, true);
            this.informationAssembledForEntry.informationAssembledForEntry_angleYaw     = view.getInt16(4, true);
            this.informationAssembledForEntry.informationAssembledForEntry_positionX    = view.getInt16(6, true) / 100.0;
            this.informationAssembledForEntry.informationAssembledForEntry_positionY    = view.getInt16(8, true) / 100.0;
            this.informationAssembledForEntry.informationAssembledForEntry_positionZ    = view.getInt16(10, true) / 100.0;
            this.informationAssembledForEntry.informationAssembledForEntry_rangeHeight  = view.getInt16(12, true) / 1000.0;
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

        if (this.targetDeviceID == undefined)
        {
            return false;
        }

        if (this.ack._updated)
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
        if (this.bufferTransfer == undefined)
        {
            this.bufferTransfer = [];
        }

        // Buffer Clear
        if (handler.e(this.DataType.BUFFER_CLEAR))
        {
            this.bufferTransfer = [];
        }

        const target = this.read(handler, this.DataType.TARGET, 0xFF);


        // BATTLE_IR_MESSAGE
        if (handler.e(this.DataType.BATTLE_IR_MESSAGE))
        {
            const irMessage = this.read(handler, this.DataType.BATTLE_IR_MESSAGE);

            const dataArray = this.reserveBattleIrMessage(target, irMessage);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - BattleIrMessage', dataArray);
        }


        // Light Manual
        if (handler.e(this.DataType.LIGHT_MANUAL_FLAGS)       &&
            handler.e(this.DataType.LIGHT_MANUAL_BRIGHTNESS))
        {
            const flags       = this.read(handler, this.DataType.LIGHT_MANUAL_FLAGS);
            const brightness  = this.read(handler, this.DataType.LIGHT_MANUAL_BRIGHTNESS);

            const dataArray = this.reserveLightManual(target, flags, brightness);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - LightManual', dataArray);
        }


        // LightModeColor
        if         (handler.e(this.DataType.LIGHT_MODE_MODE)      &&
                    handler.e(this.DataType.LIGHT_MODE_INTERVAL)  &&
                    handler.e(this.DataType.LIGHT_COLOR_R)        &&
                    handler.e(this.DataType.LIGHT_COLOR_G)        &&
                    handler.e(this.DataType.LIGHT_COLOR_B))
        {
            const mode        = this.read(handler, this.DataType.LIGHT_MODE_MODE);
            const interval    = this.read(handler, this.DataType.LIGHT_MODE_INTERVAL);
            const r           = this.read(handler, this.DataType.LIGHT_COLOR_R);
            const g           = this.read(handler, this.DataType.LIGHT_COLOR_G);
            const b           = this.read(handler, this.DataType.LIGHT_COLOR_B);

            const dataArray = this.reserveLightModeColor(target, mode, interval, r, g, b);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - LightModeColor', dataArray);
        }
        // LightMode
        else if    (handler.e(this.DataType.LIGHT_MODE_MODE)      &&
                    handler.e(this.DataType.LIGHT_MODE_INTERVAL))
        {
            const mode        = this.read(handler, this.DataType.LIGHT_MODE_MODE);
            const interval    = this.read(handler, this.DataType.LIGHT_MODE_INTERVAL);

            const dataArray = this.reserveLightMode(target, mode, interval);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - LightMode', dataArray);
        }


        // LightEventColor
        if         (handler.e(this.DataType.LIGHT_EVENT_EVENT)     &&
                    handler.e(this.DataType.LIGHT_EVENT_INTERVAL)  &&
                    handler.e(this.DataType.LIGHT_EVENT_REPEAT)    &&
                    handler.e(this.DataType.LIGHT_COLOR_R)         &&
                    handler.e(this.DataType.LIGHT_COLOR_G)         &&
                    handler.e(this.DataType.LIGHT_COLOR_B))
        {
            const event       = this.read(handler, this.DataType.LIGHT_EVENT_EVENT);
            const interval    = this.read(handler, this.DataType.LIGHT_EVENT_INTERVAL);
            const repeat      = this.read(handler, this.DataType.LIGHT_EVENT_REPEAT);
            const r           = this.read(handler, this.DataType.LIGHT_COLOR_R);
            const g           = this.read(handler, this.DataType.LIGHT_COLOR_G);
            const b           = this.read(handler, this.DataType.LIGHT_COLOR_B);

            const dataArray = this.reserveLightEventColor(target, event, interval, repeat, r, g, b);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - LightEventColor', dataArray);
        }
        // LightEvent
        else if    (handler.e(this.DataType.LIGHT_EVENT_EVENT)     &&
                    handler.e(this.DataType.LIGHT_EVENT_INTERVAL)  &&
                    handler.e(this.DataType.LIGHT_EVENT_REPEAT))
        {
            const event       = this.read(handler, this.DataType.LIGHT_EVENT_EVENT);
            const interval    = this.read(handler, this.DataType.LIGHT_EVENT_INTERVAL);
            const repeat      = this.read(handler, this.DataType.LIGHT_EVENT_REPEAT);

            const dataArray = this.reserveLightEvent(target, event, interval, repeat);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - LightEvent', dataArray);
        }


        // 화면 전체 지우기
        if (handler.e(this.DataType.DISPLAY_CLEAR_ALL_PIXEL))
        {
            const pixel   = this.read(handler, this.DataType.DISPLAY_CLEAR_ALL_PIXEL);

            const dataArray = this.reserveDisplayClearAll(target, pixel);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayClearAll', dataArray);
        }


        // 선택 영역 지우기
        if (handler.e(this.DataType.DISPLAY_CLEAR_WIDTH)  ||
            handler.e(this.DataType.DISPLAY_CLEAR_HEIGHT))
        {
            const x       = this.read(handler, this.DataType.DISPLAY_CLEAR_X);
            const y       = this.read(handler, this.DataType.DISPLAY_CLEAR_Y);
            const width   = this.read(handler, this.DataType.DISPLAY_CLEAR_WIDTH);
            const height  = this.read(handler, this.DataType.DISPLAY_CLEAR_HEIGHT);
            const pixel   = this.read(handler, this.DataType.DISPLAY_CLEAR_PIXEL);

            const dataArray = this.reserveDisplayClear(target, x, y, width, height, pixel);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayClear', dataArray);
        }


        // 선택 영역 반전
        if (handler.e(this.DataType.DISPLAY_INVERT_WIDTH)  ||
            handler.e(this.DataType.DISPLAY_INVERT_HEIGHT))
        {
            const x       = this.read(handler, this.DataType.DISPLAY_INVERT_X);
            const y       = this.read(handler, this.DataType.DISPLAY_INVERT_Y);
            const width   = this.read(handler, this.DataType.DISPLAY_INVERT_WIDTH);
            const height  = this.read(handler, this.DataType.DISPLAY_INVERT_HEIGHT);

            const dataArray = this.reserveDisplayInvert(target, x, y, width, height);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayInvert', dataArray);
        }


        // 화면에 점 찍기
        if (handler.e(this.DataType.DISPLAY_DRAW_POINT_X)      ||
            handler.e(this.DataType.DISPLAY_DRAW_POINT_Y)      ||
            handler.e(this.DataType.DISPLAY_DRAW_POINT_PIXEL))
        {
            const x       = this.read(handler, this.DataType.DISPLAY_DRAW_POINT_X);
            const y       = this.read(handler, this.DataType.DISPLAY_DRAW_POINT_Y);
            const pixel   = this.read(handler, this.DataType.DISPLAY_DRAW_POINT_PIXEL);

            const dataArray = this.reserveDisplayDrawPoint(target, x, y, pixel);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayDrawPoint', dataArray);
        }


        // 화면에 선 그리기
        if (handler.e(this.DataType.DISPLAY_DRAW_LINE_X1)  ||
            handler.e(this.DataType.DISPLAY_DRAW_LINE_Y1)  ||
            handler.e(this.DataType.DISPLAY_DRAW_LINE_X2)  ||
            handler.e(this.DataType.DISPLAY_DRAW_LINE_Y2))
        {
            const x1      = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_X1);
            const y1      = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_Y1);
            const x2      = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_X2);
            const y2      = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_Y2);
            const pixel   = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_PIXEL);
            const line    = this.read(handler, this.DataType.DISPLAY_DRAW_LINE_LINE);

            const dataArray = this.reserveDisplayDrawLine(target, x1, y1, x2, y2, pixel, line);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayDrawLine', dataArray);
        }


        // 화면에 사각형 그리기
        if (handler.e(this.DataType.DISPLAY_DRAW_RECT_WIDTH)   ||
            handler.e(this.DataType.DISPLAY_DRAW_RECT_HEIGHT))
        {
            const x           = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_X);
            const y           = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_Y);
            const width       = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_WIDTH);
            const height      = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_HEIGHT);
            const pixel       = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_PIXEL);
            const flagfill    = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_FLAGFILL);
            const line        = this.read(handler, this.DataType.DISPLAY_DRAW_RECT_LINE);

            const dataArray = this.reserveDisplayDrawRect(target, x, y, width, height, pixel, flagfill, line);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayDrawRect', dataArray);
        }


        // 화면에 원 그리기
        if (handler.e(this.DataType.DISPLAY_DRAW_CIRCLE_RADIUS))
        {
            const x        = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_X);
            const y        = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_Y);
            const radius   = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_RADIUS);
            const pixel    = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_PIXEL);
            const flagfill = this.read(handler, this.DataType.DISPLAY_DRAW_CIRCLE_FLAGFILL);

            const dataArray = this.reserveDisplayDrawCircle(target, x, y, radius, pixel, flagfill);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayDrawCircle', dataArray);
        }


        // 화면에 문자열 쓰기
        if (handler.e(this.DataType.DISPLAY_DRAW_STRING_STRING))
        {
            const x       = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_X);
            const y       = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_Y);
            const font    = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_FONT);
            const pixel   = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_PIXEL);
            const string  = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_STRING);

            const dataArray = this.reserveDisplayDrawString(target, x, y, font, pixel, string);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayDrawString', dataArray);
        }


        // 화면에 문자열 정렬하여 그리기
        if (handler.e(this.DataType.DISPLAY_DRAW_STRING_ALIGN_STRING))
        {
            const xStart  = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_X_START);
            const xEnd    = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_X_END);
            const y       = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_Y);
            const align   = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_ALIGN);
            const font    = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_FONT);
            const pixel   = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_PIXEL);
            const string  = this.read(handler, this.DataType.DISPLAY_DRAW_STRING_ALIGN_STRING);

            const dataArray = this.reserveDisplayDrawStringAlign(target, xStart, xEnd, y, align, font, pixel, string);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - DisplayDrawStringAlign', dataArray);
        }


        // Command
        if (handler.e(this.DataType.COMMAND_COMMAND))
        {
            const command = this.read(handler, this.DataType.COMMAND_COMMAND);
            const option  = this.read(handler, this.DataType.COMMAND_OPTION);

            switch (command)
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

            default:
                break;
            }

            const dataArray = this.reserveCommand(target, command, option);
            this.bufferTransfer.push(dataArray);
            this.log(`BASE - Transfer_To_Device - Command: ${command}, option: ${option}`, dataArray);
        }


        // Control
        if (handler.e(this.DataType.CONTROL_QUAD8_ROLL)     ||
            handler.e(this.DataType.CONTROL_QUAD8_PITCH)    ||
            handler.e(this.DataType.CONTROL_QUAD8_YAW)      ||
            handler.e(this.DataType.CONTROL_QUAD8_THROTTLE))
        {
            this.controlRoll     = this.read(handler, this.DataType.CONTROL_QUAD8_ROLL,     this.controlRoll);
            this.controlPitch    = this.read(handler, this.DataType.CONTROL_QUAD8_PITCH,    this.controlPitch);
            this.controlYaw      = this.read(handler, this.DataType.CONTROL_QUAD8_YAW,      this.controlYaw);
            this.controlThrottle = this.read(handler, this.DataType.CONTROL_QUAD8_THROTTLE, this.controlThrottle);

            const dataArray = this.reserveControlQuad8(target, this.controlRoll, this.controlPitch, this.controlYaw, this.controlThrottle);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - ControlQuad8', dataArray);
        }


        // Control
        if (handler.e(this.DataType.CONTROL_POSITION_X)                   ||
            handler.e(this.DataType.CONTROL_POSITION_Y)                   ||
            handler.e(this.DataType.CONTROL_POSITION_Z)                   ||
            handler.e(this.DataType.CONTROL_POSITION_VELOCITY)            ||
            handler.e(this.DataType.CONTROL_POSITION_HEADING)             ||
            handler.e(this.DataType.CONTROL_POSITION_ROTATIONAL_VELOCITY))
        {
            const x                   = this.read(handler, this.DataType.CONTROL_POSITION_X);
            const y                   = this.read(handler, this.DataType.CONTROL_POSITION_Y);
            const z                   = this.read(handler, this.DataType.CONTROL_POSITION_Z);
            const velocity            = this.read(handler, this.DataType.CONTROL_POSITION_VELOCITY);
            const heading             = this.read(handler, this.DataType.CONTROL_POSITION_HEADING);
            const rotationalVelocity  = this.read(handler, this.DataType.CONTROL_POSITION_ROTATIONAL_VELOCITY);

            const dataArray = this.reserveControlPosition(target, x, y, z, velocity, heading, rotationalVelocity);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - ControlPosition', dataArray);
        }


        // MotorSingle
        if (handler.e(this.DataType.MOTORSINGLE_TARGET))
        {
            const motor       = this.read(handler, this.DataType.MOTORSINGLE_TARGET);
            const value       = this.read(handler, this.DataType.MOTORSINGLE_VALUE);

            if (handler.e(this.DataType.MOTORSINGLE_ROTATION))
            {
                const rotation    = this.read(handler, this.DataType.MOTORSINGLE_ROTATION);

                const dataArray = this.reserveMotorSingleRV(target, motor, rotation, value);
                this.bufferTransfer.push(dataArray);
                this.log('BASE - Transfer_To_Device - MotorSingleRV', dataArray);
            }
            else
            {
                const dataArray = this.reserveMotorSingleV(target, motor, value);
                this.bufferTransfer.push(dataArray);
                this.log('BASE - Transfer_To_Device - MotorSingleV', dataArray);
            }
        }


        // Buzzer
        if (handler.e(this.DataType.BUZZER_MODE))
        {
            const mode     = this.read(handler, this.DataType.BUZZER_MODE);
            const value    = this.read(handler, this.DataType.BUZZER_VALUE);
            const time     = this.read(handler, this.DataType.BUZZER_TIME);

            const dataArray = this.reserveBuzzer(target, mode, value, time);
            this.bufferTransfer.push(dataArray);
            this.log(`BASE - Transfer_To_Device - Buzzer - mode: ${mode}, value: ${value}, time: ${time}`, dataArray);
        }


        // Vibrator
        if (handler.e(this.DataType.VIBRATOR_ON))
        {
            const mode   = this.read(handler, this.DataType.VIBRATOR_MODE);
            const on     = this.read(handler, this.DataType.VIBRATOR_ON);
            const off    = this.read(handler, this.DataType.VIBRATOR_OFF);
            const total  = this.read(handler, this.DataType.VIBRATOR_TOTAL);

            const dataArray = this.reserveVibrator(target, mode, on, off, total);
            this.bufferTransfer.push(dataArray);
            this.log('BASE - Transfer_To_Device - Vibrator', dataArray);
        }
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
            if (this.joystick._updated)
            {
                for (const key in this.joystick)
                {
                    handler.write(key, this.joystick[key]);
                }

                this.joystick._updated = false;
            }
        }

        // Button
        {
            if (this.button._updated)
            {
                for (const key in this.button)
                {
                    handler.write(key, this.button[key]);
                }

                this.button._updated = false;
            }
        }

        // State
        {
            if (this.state._updated)
            {
                for (const key in this.state)
                {
                    handler.write(key, this.state[key]);
                }

                this.state._updated = false;
            }
        }

        // Motion
        {
            if (this.motion._updated)
            {
                for (const key in this.motion)
                {
                    handler.write(key, this.motion[key]);
                }

                this.motion._updated = false;
            }
        }

        // Range
        {
            if (this.range._updated)
            {
                for (const key in this.range)
                {
                    handler.write(key, this.range[key]);
                }

                this.range._updated = false;
            }
        }

        // BattleIrMessage
        {
            if (this.battleIrMessage._updated)
            {
                for (const key in this.battleIrMessage)
                {
                    handler.write(key, this.battleIrMessage[key]);
                }

                this.battleIrMessage._updated = false;
            }
        }

        // CardColor
        {
            if (this.cardColor._updated)
            {
                for (const key in this.cardColor)
                {
                    handler.write(key, this.cardColor[key]);
                }

                this.cardColor._updated = false;
            }
        }

        // InformationAssembledForEntry
        {
            if (this.informationAssembledForEntry._updated)
            {
                for (const key in this.informationAssembledForEntry)
                {
                    handler.write(key, this.informationAssembledForEntry[key]);
                }

                this.informationAssembledForEntry._updated = false;
            }
        }

        // Entry-hw information
        {
            if (this.bufferTransfer == undefined)
            {
                this.bufferTransfer = [];
            }

            handler.write('entryhw_countTransferReserved', this.bufferTransfer.length);
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
        //this.log(`BASE - receiverForDevice() - Length : ${dataArray.length}`, dataArray);

        if (dataArray == undefined || dataArray.length == 0)
        {
            return;
        }

        const i = 0;

        // 버퍼로부터 데이터를 읽어 하나의 완성된 데이터 블럭으로 변환
        for (let i = 0; i < dataArray.length; i++)
        {
            const data          = dataArray[i];

            let flagContinue    = true;
            let flagSessionNext = false;
            let flagComplete    = false;

            switch (this.indexSession)
            {
            case 0: // Start Code
                {
                    switch (this.indexReceiver)
                    {
                    case 0:
                        if (data != 0x0A)
                        {
                            continue;
                        }
                        break;

                    case 1:
                        if (data != 0x55)
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
                    switch (this.indexReceiver)
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
                            if (this.dataLength == 0)
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

                    if (this.indexReceiver == this.dataLength - 1)
                    {
                        flagSessionNext = true;
                    }
                }
                break;

            case 3: // CRC16
                {
                    switch (this.indexReceiver)
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
            if (flagComplete)
            {
                //this.log(`BASE - Receiver - CRC16 - Calculated : ${this.crc16Calculated.toString(16).toUpperCase()}, Received : ${this.crc16Received.toString(16).toUpperCase()}`);
                if (this.crc16Calculated == this.crc16Received)
                {
                    this.handlerForDevice();
                }

                flagContinue = false;
            }

            // 데이터 처리 결과에 따라 인덱스 변수 처리
            if (flagContinue)
            {
                if (flagSessionNext)
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
        /*
        // log 출력을  skip 할 대상만 case로 등록
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
                this.log(`BASE - handlerForDevice() - From: ${this.from} - To: ${this.to} - Type: ${this.dataType} - `, this.dataBlock);
            }
            break;
        }
        // */

        this.timeReceive = (new Date()).getTime();

        // 상대측에 정상적으로 데이터를 전달했는지 확인
        switch (this.dataType)
        {
        case 0x02:  // Ack
            {
                if (this.updateAck())
                {
                    // ping에 대한 ack는 로그 출력하지 않음
                    //if( this.ack.dataType != 0x01 )
                    {
                        //this.log(`BASE - handlerForDevice() - Ack - From: ${this.from} - SystemTime: ${this.ack.ack_systemTime} - DataType: ${this.ack.ack_dataType} - Repeat: ${this.countTransferRepeat} - CRC16 Transfer: ${this.crc16Transfered} - CRF16 Ack: ${this.ack.ack_crc16}`);
                    }

                    // 마지막으로 전송한 데이터에 대한 응답을 받았다면
                    if (this.bufferTransfer         != undefined                &&
                        this.bufferTransfer.length  > 0                         &&
                        this.dataTypeLastTransfered == this.ack.ack_dataType    &&
                        this.crc16Transfered        == this.ack.ack_crc16)
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
                if (this.bufferTransfer         != undefined     &&
                    this.bufferTransfer.length  > 0              &&
                    this.dataTypeLastTransfered == this.dataType)
                {
                    this.bufferTransfer.shift();
                    this.countTransferRepeat = 0;

                    //this.log(`BASE - handlerForDevice() - Response - From: ${this.from} - DataType: ${this.dataType}`);
                }
            }
            break;
        }

        // 데이터 업데이트
        switch (this.dataType)
        {
        case 0x1F:  // Battle
            {
                //this.log("BASE - handlerForDevice() - Received - Battle - 0x1F");
                this.updateBattleIrMessage();
            }
            break;


        case 0x40:  // State
            {
                //this.log("BASE - handlerForDevice() - Received - State - 0x40");
                this.updateState();
            }
            break;


        case 0x70:  // Button
            {
                //this.log("BASE - handlerForDevice() - Received - Button - 0x70");
                this.updateButton();
            }
            break;


        case 0x71:  // Joystick
            {
                //this.log("BASE - handlerForDevice() - Received - Joystick - 0x71");
                this.updateJoystick();
            }
            break;


        case 0x44:  // Motion
            {
                //this.log("BASE - handlerForDevice() - Received - Motion - 0x44");
                this.updateMotion();
            }
            break;


        case 0x45:  // Range
            {
                //this.log("BASE - handlerForDevice() - Received - Range - 0x45");
                this.updateRange();
            }
            break;


        case 0x93:  // CardColor
            {
                //this.log("BASE - handlerForDevice() - Received - CardColor - 0x93");
                this.updateCardColor();
            }
            break;


        case 0xA1:  // Information Assembled For Entry 자주 갱신되는 데이터 모음(엔트리)
            {
                //this.log("BASE - handlerForDevice() - Received - InformationAssembledForEntry - 0xA1");
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
        const now = (new Date()).getTime();

        if (now < this.timeTransferNext)
        {
            return null;
        }

        this.timeTransferNext = now + this.timeTransferInterval;

        if (this.bufferTransfer == undefined)
        {
            this.bufferTransfer = [];
        }

        this.countReqeustDevice++;

        if (this.bufferTransfer.length == 0)
        {
            // 예약된 요청이 없는 경우 데이터 요청 등록(현재는 자세 데이터 요청)
            if (this.arrayRequestData == null)
            {
                return this.reservePing(this.targetDevice);
            }
            else
            {
                const index = (this.countReqeustDevice % ((this.arrayRequestData.length + 1) * 2));   // +1은 조종기에 ping, *2 는 자주 갱신되는 데이터 요청
                const indexArray = (index / 2).toFixed(0);

                if ((index & 0x01) == 0)
                {
                    if (indexArray < this.arrayRequestData.length)
                    {
                        return this.reserveRequest(this.targetDevice, this.arrayRequestData[indexArray]);    // 드론
                    }
                    else
                    {
                        return this.reservePing(0x20);  // 조종기
                    }
                }
                else
                {
                    return this.reserveRequest(this.targetDevice, 0xA1);     // 드론, 자주 갱신되는 데이터 모음(엔트리)
                }
            }
        }
        else
        {
            // 예약된 요청이 있는 경우
            if (this.arrayRequestData == null)
            {
                switch (this.countReqeustDevice % 10)
                {
                case 0:     return this.reservePing(this.targetDevice);
                default:    break;
                }
            }
            else
            {
                const index = (this.countReqeustDevice % ((this.arrayRequestData.length + 1) * 4));   // +1은 자주 갱신되는 데이터 요청, *4는 예약된 요청 데이터
                const indexArray = (index / 4).toFixed(0);

                if ((index & 0x03) == 0)
                {
                    if (indexArray < this.arrayRequestData.length)
                    {
                        return this.reserveRequest(this.targetDevice, this.arrayRequestData[indexArray]);    // 드론
                    }
                    else
                    {
                        return this.reserveRequest(this.targetDevice, 0xA1);     // 드론, 자주 갱신되는 데이터 모음(엔트리)
                    }
                }
            }
        }

        // 예약된 데이터 전송 처리
        const arrayTransfer = this.bufferTransfer[0];           // 전송할 데이터 배열(첫 번째 데이터 블럭 전송)
        if (arrayTransfer[2] == 0x04)
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

        //this.log(`BASE - transferToDevice - Repeat: ${this.countTransferRepeat}`, this.bufferTransfer[0]);

        // maxTransferRepeat 이상 전송했음에도 응답이 없는 경우엔 다음으로 넘어감
        if (this.countTransferRepeat >= this.maxTransferRepeat)
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

    // Ping
    reservePing(target)
    {
        const dataArray   = new ArrayBuffer(8);
        const view        = new DataView(dataArray);

        view.setUint32(0, 0, true);
        view.setUint32(4, 0, true);

        //this.log(`BASE - reservePing() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x01, target, dataArray);
    }


    // 데이터 요청
    reserveRequest(target, dataType)
    {
        const dataArray   = new ArrayBuffer(1);
        const view        = new DataView(dataArray);

        view.setUint8(0, this.fit(0, dataType, 0xFF));

        //this.log(`BASE - reserveRequest() - Target: 0x${target.toString(16).toUpperCase()} - DataType: 0x`, dataType.toString(16).toUpperCase());
        return this.createTransferBlock(0x04, target, dataArray);
    }


    // Command
    reserveCommand(target, command, option)
    {
        const dataArray   = new ArrayBuffer(2);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, command, 0xFF));
        view.setUint8   (1, this.fit(0, option, 0xFF));

        this.log(`BASE - reserveCommand() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x11, target, dataArray);
    }


    // Light Manual
    reserveLightManual(target, flag, brightness)
    {
        const dataArray   = new ArrayBuffer(3);
        const view        = new DataView(dataArray);

        view.setUint16  (0, this.fit(0, flag, 0xFFFF), true);
        view.setUint8   (2, this.fit(0, brightness, 0xFF));

        this.log(`BASE - reserveLightManual() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x20, target, dataArray);
    }


    // BattleIrMessage
    reserveBattleIrMessage(target, irMessage)
    {
        const dataArray   = new ArrayBuffer(1);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, irMessage, 0xFF), true);

        this.log(`BASE - reserveBattleIrMessage() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x1F, target, dataArray);
    }


    // LightModeColor
    reserveLightModeColor(target, mode, interval, r, g, b)
    {
        const dataArray   = new ArrayBuffer(6);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, mode, 0xFF));
        view.setUint16  (1, this.fit(0, interval, 0xFFFF), true);
        view.setUint8   (3, this.fit(0, r, 0xFF));
        view.setUint8   (4, this.fit(0, g, 0xFF));
        view.setUint8   (5, this.fit(0, b, 0xFF));

        this.log(`BASE - reserveLightModeColor() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x21, target, dataArray);
    }


    // LightMode
    reserveLightMode(target, mode, interval)
    {
        const dataArray   = new ArrayBuffer(3);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, mode, 0xFF));
        view.setUint16  (1, this.fit(0, interval, 0xFF), true);

        this.log(`BASE - reserveLightMode() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x21, target, dataArray);
    }


    // LightEventColor
    reserveLightEventColor(target, event, interval, repeat, r, g, b)
    {
        const dataArray   = new ArrayBuffer(7);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, event, 0xFF));
        view.setUint16  (1, this.fit(0, interval, 0xFFFF), true);
        view.setUint8   (3, this.fit(0, repeat, 0xFF));
        view.setUint8   (4, this.fit(0, r, 0xFF));
        view.setUint8   (5, this.fit(0, g, 0xFF));
        view.setUint8   (6, this.fit(0, b, 0xFF));

        this.log(`BASE - reserveLightEventColor() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x22, target, dataArray);
    }


    // LightEvent
    reserveLightEvent(target, event, interval, repeat)
    {
        const dataArray   = new ArrayBuffer(4);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, event, 0xFF));
        view.setUint16  (1, this.fit(0, interval, 0xFFFF), true);
        view.setUint8   (3, this.fit(0, repeat, 0xFF));

        this.log(`BASE - reserveLightEvent() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x22, target, dataArray);
    }


    // DisplayClearAll
    reserveDisplayClearAll(target, pixel)
    {
        const dataArray   = new ArrayBuffer(1);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, pixel, 0xFF));

        this.log(`BASE - reserveDisplayClearAll() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x80, target, dataArray);
    }


    // DisplayClear
    reserveDisplayClear(target, x, y, width, height, pixel)
    {
        const dataArray   = new ArrayBuffer(9);
        const view        = new DataView(dataArray);

        view.setInt16   (0, this.fit(-4096, x, 4095), true);
        view.setInt16   (2, this.fit(-4096, y, 4095), true);
        view.setInt16   (4, this.fit(-4096, width, 4095), true);
        view.setInt16   (6, this.fit(-4096, height, 4095), true);
        view.setUint8   (8, this.fit(0, pixel, 0xFF));

        this.log(`BASE - reserveDisplayClear() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x80, target, dataArray);
    }


    // DisplayInvert
    reserveDisplayInvert(target, x, y, width, height)
    {
        const dataArray   = new ArrayBuffer(8);
        const view        = new DataView(dataArray);

        view.setInt16   (0, this.fit(-4096, x, 4095), true);
        view.setInt16   (2, this.fit(-4096, y, 4095), true);
        view.setInt16   (4, this.fit(-4096, width, 4095), true);
        view.setInt16   (6, this.fit(-4096, height, 4095), true);

        this.log(`BASE - reserveDisplayInvert() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x81, target, dataArray);
    }


    // DisplayDrawPoint
    reserveDisplayDrawPoint(target, x, y, pixel)
    {
        const dataArray   = new ArrayBuffer(5);
        const view        = new DataView(dataArray);

        view.setInt16   (0, this.fit(-4096, x, 4095), true);
        view.setInt16   (2, this.fit(-4096, y, 4095), true);
        view.setUint8   (4, this.fit(0, pixel, 0xFF));

        this.log(`BASE - reserveDisplayDrawPoint() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x82, target, dataArray);
    }


    // DisplayDrawLine
    reserveDisplayDrawLine(target, x1, y1, x2, y2, pixel, line)
    {
        const dataArray   = new ArrayBuffer(10);
        const view        = new DataView(dataArray);

        view.setInt16   (0, this.fit(-4096, x1, 4095), true);
        view.setInt16   (2, this.fit(-4096, y1, 4095), true);
        view.setInt16   (4, this.fit(-4096, x2, 4095), true);
        view.setInt16   (6, this.fit(-4096, y2, 4095), true);
        view.setUint8   (8, this.fit(0, pixel, 0xFF));
        view.setUint8   (9, this.fit(0, line, 0xFF));

        this.log(`BASE - reserveDisplayDrawLine() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x83, target, dataArray);
    }


    // DisplayDrawRect
    reserveDisplayDrawRect(target, x, y, width, height, pixel, flagFill, line)
    {
        const dataArray   = new ArrayBuffer(11);
        const view        = new DataView(dataArray);

        view.setInt16   (0, this.fit(-4096, x, 4095), true);
        view.setInt16   (2, this.fit(-4096, y, 4095), true);
        view.setInt16   (4, this.fit(1, width, 4095), true);
        view.setInt16   (6, this.fit(1, height, 4095), true);
        view.setUint8   (8, this.fit(0, pixel, 0xFF));
        view.setUint8   (9, this.fit(0, flagFill, 0xFF));
        view.setUint8   (10, this.fit(0, line, 0xFF));

        this.log(`BASE - reserveDisplayDrawRect() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x84, target, dataArray);
    }


    // DisplayDrawCircle
    reserveDisplayDrawCircle(target, x, y, radius, pixel, flagFill)
    {
        const dataArray   = new ArrayBuffer(8);
        const view        = new DataView(dataArray);

        view.setInt16   (0, this.fit(-4096, x, 4095), true);
        view.setInt16   (2, this.fit(-4096, y, 4095), true);
        view.setInt16   (4, this.fit(1, radius, 4095), true);
        view.setUint8   (6, this.fit(0, pixel, 0xFF));
        view.setUint8   (7, this.fit(0, flagFill, 0xFF));

        this.log(`BASE - reserveDisplayDrawCircle() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x85, target, dataArray);
    }


    // DisplayDrawString
    reserveDisplayDrawString(target, x, y, font, pixel, string)
    {
        const byteArrayString = this.stringToAsciiByteArray(string);

        const dataArray   = new ArrayBuffer(6 + byteArrayString.length);
        const view        = new DataView(dataArray);

        view.setInt16   (0, this.fit(-4096, x, 4095), true);
        view.setInt16   (2, this.fit(-4096, y, 4095), true);
        view.setUint8   (4, this.fit(0, font, 0xFF));
        view.setUint8   (5, this.fit(0, pixel, 0xFF));

        for (let i = 0; i < byteArrayString.length; i++) {
            view.setUint8((6 + i), byteArrayString[i]);
        }

        this.log(`BASE - reserveDisplayDrawString() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x86, target, dataArray);
    }


    // DisplayDrawString
    reserveDisplayDrawStringAlign(target, xStart, xEnd, y, align, font, pixel, string)
    {
        const byteArrayString = this.stringToAsciiByteArray(string);

        const dataArray   = new ArrayBuffer(9 + byteArrayString.length);
        const view        = new DataView(dataArray);

        view.setInt16   (0, this.fit(-4096, xStart, 4095), true);
        view.setInt16   (2, this.fit(-4096, xEnd, 4095), true);
        view.setInt16   (4, this.fit(-4096, y, 4095), true);
        view.setUint8   (6, this.fit(0, align, 0xFF));
        view.setUint8   (7, this.fit(0, font, 0xFF));
        view.setUint8   (8, this.fit(0, pixel, 0xFF));

        for (let i = 0; i < byteArrayString.length; i++) {
            view.setUint8((9 + i), byteArrayString[i]);
        }

        this.log(`BASE - reserveDisplayDrawStringAlign() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x87, target, dataArray);
    }


    // ControlQuad8
    reserveControlQuad8(target, roll, pitch, yaw, throttle)
    {
        const dataArray   = new ArrayBuffer(4);
        const view        = new DataView(dataArray);

        view.setInt8   (0, this.fit(-120, roll, 120));
        view.setInt8   (1, this.fit(-120, pitch, 120));
        view.setInt8   (2, this.fit(-120, yaw, 120));
        view.setInt8   (3, this.fit(-120, throttle, 120));

        this.log(`BASE - reserveControlQuad8() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x10, target, dataArray);
    }


    // ControlPosition
    reserveControlPosition(target, x, y, z, velocity, heading, rotationalVelocity)
    {
        const dataArray   = new ArrayBuffer(20);
        const view        = new DataView(dataArray);

        view.setFloat32 (0,  x, true);
        view.setFloat32 (4,  y, true);
        view.setFloat32 (8,  z, true);
        view.setFloat32 (12, velocity, true);
        view.setInt16   (16, this.fit(-3600, heading, 3600), true);
        view.setInt16   (18, this.fit(-3600, rotationalVelocity, 3600), true);

        this.log(`BASE - reserveControlPosition() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x10, target, dataArray);
    }


    // MotorSingleRV
    reserveMotorSingleRV(target, motor, rotation, value)
    {
        const dataArray   = new ArrayBuffer(4);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, motor, 0xFF));
        view.setUint8   (1, this.fit(0, rotation, 0xFF));
        view.setInt16   (2, this.fit(-4095, value, 4095), true);

        this.log(`BASE - reserveMotorSingleRV() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x61, target, dataArray);
    }


    // MotorSingleV
    reserveMotorSingleV(target, motor, value)
    {
        const dataArray   = new ArrayBuffer(3);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, motor, 0xFF));
        view.setInt16   (1, this.fit(-4095, value, 4095), true);

        this.log(`BASE - reserveMotorSingleV() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x61, target, dataArray);
    }


    // Buzzer
    reserveBuzzer(target, mode, value, time)
    {
        const dataArray   = new ArrayBuffer(5);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, mode, 0xFF));
        view.setUint16  (1, this.fit(0, value, 0xFFFF), true);
        view.setUint16  (3, this.fit(0, time, 0xFFFF), true);

        this.log(`BASE - reserveBuzzer() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x62, target, dataArray);
    }


    // Vibrator
    reserveVibrator(target, mode, on, off, total)
    {
        const dataArray   = new ArrayBuffer(7);
        const view        = new DataView(dataArray);

        view.setUint8   (0, this.fit(0, mode, 0xFF));
        view.setUint16  (1, this.fit(0, on, 0xFFFF), true);
        view.setUint16  (3, this.fit(0, off, 0xFFFF), true);
        view.setUint16  (5, this.fit(0, total, 0xFFFF), true);

        this.log(`BASE - reserveVibrator() - Target: 0x${target.toString(16).toUpperCase()}`);
        return this.createTransferBlock(0x63, target, dataArray);
    }


    // 전송 데이터 배열 생성
    // https://cryingnavi.github.io/javascript-typedarray/
    createTransferBlock(dataType, to, dataBuffer)
    {
        const dataBlock   = new ArrayBuffer(2 + 4 + dataBuffer.byteLength + 2);  // Start Code + Header + Data + CRC16
        const view        = new DataView(dataBlock);
        const dataArray   = new Uint8Array(dataBuffer);

        // Start Code
        {
            view.setUint8(0, 0x0A);
            view.setUint8(1, 0x55);
        }

        // Header
        {
            view.setUint8(2, this.fit(0, dataType, 0xFF));              // Data Type
            view.setUint8(3, this.fit(0, dataBuffer.byteLength, 0xFF)); // Data Length
            view.setUint8(4, 0x82);                                     // From (네이버 엔트리)
            view.setUint8(5, this.fit(0, to, 0xFF));                    // To
        }

        // Data
        {
            for (let i = 0; i < dataArray.length; i++)
            {
                view.setUint8((2 + 4 + i), dataArray[i]);
            }
        }

        // CRC16
        {
            const indexStart  = 2;
            const totalLength = 4 + dataArray.length; //
            let crc16       = 0;

            for (let i = 0; i < totalLength; i++)
            {
                crc16 = this.calcCRC16(view.getUint8(indexStart + i), crc16);
            }
            view.setUint16((2 + 4 + dataArray.length), crc16, true);
        }

        //this.log("BASE - createTransferBlock() - ", Array.from(new Uint8Array(dataBlock)))
        return Array.from(new Uint8Array(dataBlock));
    }


    fit(min, value, max)
    {
        return Math.max(Math.min(value, max), min);
    }


    // 값 추출
    getByte(value, index)
    {
        return ((value >> (index << 3)) & 0xff);
    }


    // 문자열을 ASCII 바이트 배열로 변환
    // https://stackoverflow.com/questions/6226189/how-to-convert-a-string-to-bytearray
    stringToAsciiByteArray(str)
    {
        const bytes = [];
        for (let i = 0; i < str.length; i++)
        {
            const charCode = str.charCodeAt(i);
            if (charCode > 0xFF)  // char > 1 byte since charCodeAt returns the UTF-16 value
            {
                //throw new Error(`Character ${String.fromCharCode(charCode)} can't be represented by a US-ASCII byte.`);
                continue;
            }
            bytes.push(charCode);
        }
        return bytes;
    }

    // #endregion Data Transfer Functions for Device



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
        this.log('BASE - createCRC16Array()');

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
            0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0,
        ];
    }

    calcCRC16(data, crc)
    {
        if (data > 255)
        {
            throw new RangeError();
        }

        const index   = ((crc >> 8) ^ data) & 0x00FF;
        const crcNext = ((crc << 8) & 0xFFFF) ^ this.crc16table[index];

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
        let strInfo = '';

        switch (typeof data)
        {
        case 'object':
            {
                strInfo = ` - [ ${this.convertByteArrayToHexString(data)} ]`;
                console.log(`${message} - ${typeof data}${strInfo}`);
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
        let strHexArray = '';
        let strHex;

        if (typeof data == 'object' && data.length > 1)
        {
            for (let i = 0; i < data.length; i++)
            {
                strHex = data[i].toString(16).toUpperCase();
                strHexArray += ' ';
                if (strHex.length == 1)
                {
                    strHexArray += '0';
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

    // #endregion Functions for log
}


module.exports = byrobot_base;

