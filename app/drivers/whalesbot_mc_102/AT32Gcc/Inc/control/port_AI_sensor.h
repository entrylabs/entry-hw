/*
 * port_AI_sensor.H
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 *      说明：ai端口对应传感器操作
 */
#ifndef CONTROL_PORT_AI_SENSOR_H_
#define CONTROL_PORT_AI_SENSOR_H_

#ifdef CONTROL_PORT_AI_SENSOR_H_




//返回对应Port端口上的触碰开关返回数据
int touch_switch_pressed(int Port);


//麦克风音量
int get_sound_volume(int Port);

//返回普通红外测距距离数据
int get_infrared_distance(int Port);

//红外检测到障碍物
int obstacle_infrared_detected(int Port);

//返回单灰度数值
int get_single_grayscale(int Port);

//单灰度 检测到 (黑线，白线)
int single_grayscale_detected(int Port, int line_type);

//获取环境光返回值
int get_ambient_light(int Port);

//火焰传感器
int get_flame(int Port);

//磁敏传感器
int magnetic_detected(int Port);


#define key_enter  	KEY_ENTER
#define key_left  	KEY_LEFT
#define key_right  	KEY_RIGHT

//按键
int button_pressed(int key_id);

//返回人体红外传感器数据(true有人，fasle无人)
int human_infrared_value(int Port);

//返回触摸开关(true触摸按下，fasle无触摸)
int touch_button(int Port);



#define MAGNETIC_CH_CURRENT 0//磁编码器当前值
#define MAGNETIC_CH_SUM     1//磁编码器累加值
#define MAGNETIC_CH_SPEED   2//磁编码器速度值
//返回磁旋转编码器结果（0~4096）
int magnetic_encoder(int Port,int ch);

//磁编码器重新开始计数
void magnetic_encoder_reset(int Port);





#endif
#endif