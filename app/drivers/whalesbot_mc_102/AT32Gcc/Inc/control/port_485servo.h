/*
 * port_485SERVO.h
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 */

#ifndef CONTROL_PORT_485SERVO_H_
#define CONTROL_PORT_485SERVO_H_

#ifdef CONTROL_PORT_485SERVO_H_

#define SERVO_IDMAX    20//最大ID编号

//新老舵机兼容
#define SERVO_VER_OLD      8//低于此版本舵机，舵机内部软件存在BUG,导致2次读取间隔5ms以上

#define SERVO_9                9//9号伺服电机，软件版本范围17，18，19，20
#define SERVO_VER_OLD9_MAX     20//9号舵机老版本,0~4096舵机角度反馈，
#define SERVO_VER_OLD9_MIN     17//9号舵机老版本,0~4096舵机角度反馈

#define SERVO_9_NEW            91//9号伺服电机,新硬件版，软件版本21~30
#define SERVO_VER_NEW9_MAX     30//9号舵机新版,0~4096舵机角度反馈
#define SERVO_VER_NEW9_MIN     21//9号舵机新版,0~4096舵机角度反馈


#define SERVO_2                   2//2号舵机老版本，软件版本1~7
#define SERVO_VER_OLD2_MAX        7//2号舵机老版本，0~1023舵机角度反馈
#define SERVO_VER_OLD2_MIN        1//2号舵机老版本，0~1023舵机角度反馈

#define SERVO_NORMAL              100//后续新舵机

//舵机ID编号
#define S1 	            1
#define S2              2
#define S3              3
#define S4              4
#define S5              5
#define S6              6
#define S7              7
#define S8              8
#define S9              9
#define S10             10
#define S11             11
#define S12             12
#define S13             13
#define S14             14
#define S15             15
#define S16             16
#define S17             17
#define S18             18

#define SERVO_RECOUNT  4//舵机收发重试次数

//写总线舵机
int PO16_WriteRegister(int id, int Reg, int dat);

//读取舵机寄存器
int PO16_ReadRegister(int id, int Reg);


//发送舵机复位指令，使得舵机去使能
int Servo_Reset(int ID);


//搜索舵机，返回1成功
int Servo_Ping(int ID);

//设置舵机旋转模式
void PO16_EndlessMode(int id);

//设置舵机模式
void PO16_ServoMode(int id);


//读取舵机角度
int ReadServoaAngle(int id);

//设置舵机力矩使能
void set_servo_torque(int id,int enable);

//读取舵机内部软件版本
int ReadServoaVerion(int id);

//初始化总线舵机
//返回总线上所有舵机个数,并且切换总线新老版本舵机延时
int InitPO16Servo();

//获取已经连接到总线上的舵机ID编号
int getPO16_ConnectID(int index);

//设置舵机角度模式
void set_servo_angle(int id, int speed, int angle);

//将角度-150~150转换为舵机输入角度0~1023
int angle_to_servo_value(int p_angle);

//将角度1~100速度转换为舵机输入速度0~1023
int to_servo_speed(int p_speed);

//将角度-150~150速度转换为舵机输入速度0~1023
int servo_value_to_angle(int value1023);

//扫描舵机总线，并返回用户一个可用ID编号舵机
void Servo_IDscan(void);

//读取舵机错误状态
int PO16_ReadStusError(int id);

/*
设置当前总线上的舵机ID（注：此函数总线上只有1个舵机情况下才能正确操作)
nowid:当前舵机ID编号，S1~S18
newid:新需要写入的舵机编号，S1~S18
*/
void servo_id_change(int nowid,int newid);

/*设置舵机旋转模式，并以指定速度旋转
servo_id：S1~S18
speed:0~100
angle:-150~150
*/
void set_servo_rotation(int servo_id, int speed);


//返回总线上ID编号释是否在线
int IsPO16_Connect(int id);

//流程图使用的舵机控制函数
void servo_ctrl(int id ,int iSpeed,int iPos, int iMode);

//无等待的舵机指令发送
void PO16_ReadRegister_NoWait(int id, int Reg);

//无等待的读取舵机角度
int ReadServoaAngle_NoWait(int id);

//无等待的读取舵机角度
int ReadServoaAngle_NoWait_OK(int id);

//设置舵机力矩使能,快速设置
void set_servo_torque_fast(int id,int enable);

#endif
#endif

