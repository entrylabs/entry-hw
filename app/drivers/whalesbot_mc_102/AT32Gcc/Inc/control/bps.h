/*
 * digouput.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      说明：杂项功能
 */

#ifndef CONTROL_BSP_H_
#define CONTROL_BSP_H_


//编译使能
#ifdef CONTROL_BSP_H_

//位操作
#define BIT0    0x01
#define BIT1    0x02
#define BIT2    0x04
#define BIT3    0x08
#define BIT4    0x10
#define BIT5    0x20
#define BIT6    0x40
#define BIT7    0x80

//TRUE FALSE 定义
#define TRUE    1
#define true    1
#define True    1
#define FALSE   0
#define false   0
#define False   0

//数学常亮
#define PI      3.1415926f

//定义回调函数
typedef void(*FunType)(int);
typedef void(*FunTypeNoPara)();
//空回调函数
__IO void DummyCall(uint8_t DummyPara);
//空回调函数
__IO void DummyCall_Nopara();





//初始化机器人各项硬件
void bsp_init(void);

//关闭所有RCC设备
void RCC_Disable(void);
//启动所有RCC设备
void RCC_Enable(void);

//指示是否是上电重启
int IsPowerOnReset(void);

//判断是否到指定帧数
#define RATE_1000_HZ 	1000
#define RATE_DO_EXECUTE(RATE_HZ, TICK) ((TICK % (RATE_1000_HZ / RATE_HZ)) == 0)


#endif /* CONTROL_BSP_H_ */
#endif /* CONTROL_BSP_H_ */
