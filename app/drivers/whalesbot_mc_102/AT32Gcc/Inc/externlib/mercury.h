#include "whalesbot.h"

#ifndef EXTERNLIB_MERCURY_H_
#define EXTERNLIB_MERCURY_H_

#ifdef EXTERNLIB_MERCURY_H_
//此功能只在用SCRATCH或流程图和C编辑状态下（GCC状态下），才进行编译
//针对流程图相关函数的兼容


//反转电机-和SCRATCH相同
//reverse_motor

//设置电机-和SCRATCH相同
//set_motor

//设置电机-高级-时间
//流程图代码自行处理


//设置电机-高级-距离-函数库已实现
//void set_motor_ad(int channels, int distance, int ch1_speed, int ch2_speed, int ch3_speed, int ch4_speed);

//停止电机-和SCRATCH相同
//set_motor

//显示-函数库已实现
//Printf

//指示灯/电磁铁-函数库已实现
//setDO

//声音-流程图和Scratch函数做等效替换，参数对应：sound_hi...
#define PlaySpeech play_sound

//数码管-显示模式-流程图和Scratch函数做等效替换(关闭数码管也使用此函数)
#define set_disp_normal display_digital_tube

//数码管-比分模式-流程图和Scratch函数做等效替换
#define set_disp_score display_digital_tube_score

//彩灯-流程图和Scratch等效替换
#define Set_Rgb_Color set_RGB

//点阵屏表情-流程图和Scratch等效替换
#define disp_emoji display_emotion

//点阵屏表情-流程图和Scratch等效替换,图像编号+1以适配流程图软件生成的代码
#define disp_symble(port,index) display_symbol(port,index+1)

//点阵屏表情-流程图和Scratch等效替换
#define disp_custom display_custom

//读数-函数库已实现
//read_number


//舵机-函数库已实现
//servo_ctrl

//播放动作-函数库已实现
//play_page,quit_page,stop_page

//麦轮-函数库已实现
//mecanum_wheel_ctrl,mecanum_wheel_turn

//亮度/地面灰度/火焰/红外测距/电位器/磁敏-流程图和Scratch等效替换
#define JY_AI getAI

//触动开关-流程图和Scratch等效替换
#define switch_state touch_switch_pressed

//温度，湿度：函数库已实现
//get_temperature，get_humidity

//超声-流程图和Scratch等效替换
#define get_ultra_distance get_ultrasonic_distance

//5灰度-流程图和Scratch等效替换
#define get_Gray get_integrated_grayscale

//控制器按钮
#define button_state button_pressed

//计时器-函数库已实现
//seconds，reset_time
//流程图对接的系统函数
#define reset_time resettime

//录音机模块-不可用

//人体红外-函数库已实现
//human_infrared_value

//气压-函数库已实现
//get_pressure

//手势识别-函数库已实现
//get_gesture

//激光-函数库已实现
//get_tof

//陀螺-函数库已实现
//gyroscope

//旋转编码器-函数库已实现
//magnetic_encoder


//随机数-流程图和Scratch等效替换
#define rng random_number

//读取舵机角度-流程图和Scratch等效替换
#define read_servo_angle ReadServoaAngle





#endif
#endif
