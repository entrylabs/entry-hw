/*
 * port_i2c_sensor.H
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 *      说明：i2c端口操作
 */
#ifndef CONTROL_PORT_I2C_SENSOR_H_
#define CONTROL_PORT_I2C_SENSOR_H_

#ifdef CONTROL_PORT_I2C_SENSOR_H_




//常规I2C设备地址
#define    CAMERA_IIC_Addr          0x54//K210传感器
#define    COLORSENSOR_IIC_Addr     0x44 //颜色传感器
#define    TOF_IIC_Addr             0x48 //激光TOF传感器
#define    ULTRA_IIC_Addr           0x55 //超声波传感器
#define    DISPLAY_IIC_Addr         0x52 //数码管
#define    SCREEN_IIC_Addr          0x51 //点阵屏
#define    RGB_IIC_Addr             0x30 //RGB灯光
#define    DUMMY_IIC_Addr           0xFE //无法识别的I2C端口传感器 
#define    DMP_IIC_Addr             0x56//陀螺
#define    GESTURE_IIC_Addr         0x60//手势识别
#define    HUMIDITY_IIC_Addr        0x43//温湿度
#define    PRESSURE_IIC_Addr        0x76//气压传感器（SPL06),气压传感器是纯硬件驱动，无单片机转接


//获取超声传感器读数
int get_ultrasonic_distance(int Port);

//获取I2C 颜色传感器颜色ID
int color_value(int Port);

//获取颜色传感器原始数据
#define COLOR_R 1//红色分量 （返回颜色传感器RGB数据）
#define COLOR_G 2//绿色分量
#define COLOR_B 3//蓝色分量
#define COLOR_H 4//色相 （返回颜色传感器HSV数据）
#define COLOR_S 5//饱和度
#define COLOR_V 6//明度
#define COLOR_LIGHT 7//亮值（灯光全开时的数值）
#define COLOR_DARK  8//暗值（灯光完全关闭时的数值，等效环境光）
float color_value_name(int Port,int type);

//设置颜色传感器背光，colorW：0灭，255亮
void color_bklight(int Port,int colorW);

//对颜色传感器进行判定
int color_detected(int chPort, int colorId);

//显示数码管数字
void display_digital_tube(int Port, int chNumber);

//数码管比分显示
void display_digital_tube_score(int Port, int score1, int score2);

//关闭数码管
void off_digital_tube(int Port);

//设置数码管背光灯亮灭
void digital_tube_bklight(int Port,int colorW);

//设置彩灯
void set_RGB(int Port,int colorR, int colorG, int colorB);


typedef enum Color_ID
{
    color_white  	= 1,	//白
    color_yellow  	= 2,	//黄
	color_purple  	= 3,	//紫
	color_cyan  	= 4,	//青
	color_red	  	= 5,	//红
	color_green  	= 6,	//绿
	color_blue  	= 7,	//蓝
	color_black  	= 8,	//黑
    color_backlight = 9,    //背光LED
    color_orange    = 10,   //橙色
}Color_ID;


//陀螺数据结构体
struct DMP
{
	//原始数据
    float accx;
    float accy;
    float accz;
    float gryox;
    float gryoy;
    float gryoz;
	float temp;

	//均值数据
    float accx_avg;
    float accy_avg;
    float accz_avg;
    float gryox_avg;
    float gryoy_avg;
    float gryoz_avg;
	float temp_avg;    
};
extern struct DMP myDMP;
//陀螺参数定义
#define DMPCH_DUMMY     0
#define DMPCH_ACC_X     1
#define DMPCH_ACC_Y     2
#define DMPCH_ACC_Z     3
#define DMPCH_GYPO_X    4
#define DMPCH_GYPO_Y    5
#define DMPCH_GYPO_Z    6
#define DMPCH_TEMP      7

//获取陀螺传感器数据
float gyroscope(int Port,int dmp_ch);

//设置陀螺传感器背光，status：0灭，255亮
void gyroscope_bklight(int Port,int colorW);

//设置彩灯RGB编号
void set_RGB_color(int Port, Color_ID color_id);

//设置彩灯************************************************************
void set_RGB_All(int Port,int colorR, int colorG, int colorB,int colorW);

//关闭彩色LED
void off_RGB_color(int Port);


#define GES_NONE            0//无
#define GES_UP              1//向上
#define GES_DOWM            2//向下
#define GES_LEFT            4//向左
#define GES_RIGHT           8//向右
#define GES_FORWARD         16//向前
#define GES_BACKWARD        32//向后
#define GES_CLOCKWISE       64//顺时针
#define GES_COUNT_CLOCKWISE 128//逆时针
#define GES_WAVE            256 //挥动

//获取手势识别结果
int get_gesture(int Port);

//设置手势传感器背光，colorW：0灭，255亮
void gesture_bklight(int Port,int colorW);

//获取温湿度传感器上，温度数据
float get_temperature(int Port);

//获取温湿度传感器上，湿度数据
float get_humidity(int Port);

//获取TOF测距传感器数据
int get_tof(int Port);

//设置tof背光，colorW：0灭，255亮
void tof_bklight(int Port,int colorW);


//识别端口上连接的传感器种类
//获取P1~P10端口上传感器种类
int getPortSensorType(int Port);


/*
获取AI图像模块数据
chPort：端口编号（1~10）
data_order：获取第几个结果数据（1,2,3...)
*/
int AI_read_value(int chPort, int data_order);




#endif
#endif
