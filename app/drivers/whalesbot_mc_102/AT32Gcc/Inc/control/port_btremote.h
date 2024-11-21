/*
 * port_btremote.h
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 * 说明：遥控手柄协议解析
 */

#ifndef CONTROL_PORT_BTREMOTE_H_
#define CONTROL_PORT_BTREMOTE_H_

#ifdef CONTROL_PORT_BTREMOTE_H_


#define BTKEY     0
#define BTSTICK1  1
#define BTSTICK2  2
#define BTSTICK3  3
#define BTSTICK4  4


//初始化遥控手柄解析
void InitBTRemote(void);

//获取蓝牙遥控器键值
//ch:BT_KEY,BT_JOYSTICK_1,BT_JOYSTICK_2,BT_JOYSTICK_3,BT_JOYSTICK_4
int get_bt_remote_control(int ch);

//获取蓝牙遥控器名称
char *getBtName(void);

//获取蓝牙配对状态
int getbtstatus(void);

//获取蓝牙数据包
int getBTdata(int index);

//获取是否新收到一次蓝牙数据
int isNewBtData(void);


#endif
#endif