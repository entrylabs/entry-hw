/*
 * main.h
 *
 *  Created on: Sep 30, 2022
 *      Author: Administrator
 */
#ifndef MAIN_H_
#define MAIN_H_


//根据用于选择库的编译项和特性
//#define BOOT_CODE         //此代码作为BOOT升级和启动功能
//#define GUI_CODE          //此代码作为界面操作功能

#define GCC_CODE            //此代码作为用户的GCC编译



/*
版本变更记录
2023-11-9：ver103 ：  1.增加英文声音以及英文声音,同步变更AT32GCC和GUI界面
				      2.调整SPI 速率 div4（原DIV8)

2023-12-20:VER104 :   1.增加格式化U盘功能
2024-02-22:VER105 :   1.GUI APP编程巡线时，加入延时返回数据和巡线电机强制设置，避免丢包或者不动作
2024-03-11:VER106 :   1.增加1002的黑白屏幕的支持
2024-04-12:ver107 :   1.增加声控蓝牙模块支持
					  2.修复902 softV1上的ADC参考电压BUG
					  3.902/102固件加入新LOGO
					  4."Global"文字改为“Language”
					  2024-07-25
					  5.在巡线库中，增加P1,P2端口自动识别5灰度，使得P2端口也可作为5灰度接口使用
					  6.自动识别传感器时，加入线程屏蔽逻辑，避免卡死在传感器识别状态
					  7.自动识别5灰度时，优化识别逻辑，使得N76版本5灰度，在管脚信号不良时，也识别出来
					  8.文件系统中，屏蔽了隐藏文件显示
*/



//此数据放置于Appware_InfoFlash字段，地址：0x0x080x01e4
#define VER				107//101//软件版本号
#define NAME0           'M'
#define NAME1           'C'
#define NAME2           'x'
#define NAME3           '0'
#define NAME4           '2'
#define NAME5           'P'


#ifdef BOOT_CODE
	//BOOT 和USB MASS需要使用72Mhz（boot跳转到USB部分目前只能72Mhz）
	#define SYSCLK_FREQ_72MHz   72000000
#else
	//GUI 和GCC使用240Mhz
	#define SYSCLK_FREQ_240MHz  240000000
#endif


//芯片型号，勿删
#define STM32F10X_HD
//系统头文件，勿删
//C语言基本函数
#include "stdint.h"
#include "string.h"
#include "stdio.h"
#include "stdlib.h"
#include "stdarg.h"
#include "stdbool.h"
#include "math.h"
//硬件相关函数,勿删
#include "stm32f10x_lib.h"




//硬件相关功能头文件，通过注释或打开，可选择相应功能是否编译到bin中
//GUI BOOT GCC共用代码
#include "digoutput.h"//DO端口
#include "program_run.h"//程序间跳转功能
#include "bps.h"//系统相关函数，杂项函数
#include "power_key.h"//按钮和电源控制管脚
#include "uart_pc.h"//和PC机通信的USB->串口
#include "internal_flash.h"//内部FLASH读写函数
#include "devicename.h"//获取硬件PCB板上跳线电阻选则的软件和硬件版本
#include "systemtimer.h"//系统定时器，SystemTick操作
#include "lcd_128x64.h"//128x64黑白液晶
#include "spi_lcd.h"//SPI液晶
#include "lcd.h"//针对不同硬件，提供统一的LCD操作函数
#include "spi_flash.h"//外部flash读写操作
#include "usb_vbus.h"//USB插入检测，功能切换
//BOOT功能特有代码
#ifdef BOOT_CODE
    #include "boot_updateflash.h"//BOOT更新内部FLASH，如果是用户程序，则关闭此选项
	//#include "beep_simple.h"//IO控制器的简单蜂鸣器，提供下载提示
#else
	//GCC GUI公用代码
	#include "port_AI.h"//模拟端口
	#include "port_motor.h"//电机相关
    #include "uart_pc_debug.h"//GUI或者GCC程序下，PC串口通信
	#include "battery.h"//电池电量检测和保护
	#include "thread.h"//GCC代码有多线程切换功能
	#include "beep_wav.h"//wav格式声音播放
	#include "port_i2c.h"//I2C功能
	#include "port_i2c_sensor.h"//I2C外接传感器操作
	#include "uart_p1.h"//PORT1端口上的串口
	#include "uart_p2.h"//PORT2端口上的串口
	#include "port_uart_5gray.h"//P1,P2上的5灰度传感器操作
	#include "uart_485.h"//485/ttl 舵机总线串口初始化
	#include "uart_bt.h"//蓝牙串口初始化
	#include "port_485servo.h"//485/ttl总线伺服电机操作
	#include "port_btremote.h"//遥控手柄协议解析
	#include "port_i2c_dot8x8.h"//I2C的8X8蓝色点阵操作
	#include "port_AI_sensor.h"//AI端口上对应传感器操作
	#include "port_math.h"//数学相关的接口函数
	#include "port_i2c_spl06.h"//气压传感器相关操作
	#include "port_pwmservo.h"//PWM舵机
#endif
#ifdef GUI_CODE//界面特有代码
	#include "gui_main.h"//用户界面操作
	#include "bt_run.h"//蓝牙解释执行相关
	#include "play_page.h"//动作页执行库
	#include "bt_goline.h"//蓝牙APP使用的走线逻辑
#endif
#ifdef GCC_CODE//GCC部分特有代码
	#include "whalesbot.h"//给SCRATCH编程界面使用的头文件
#endif

#endif /* MAIN_H_ */
