/*
 * usb_vbus.h
 *
 *  Created on: 2022年12月23日
 *      Author: Administrator
 */

#ifndef CONTROL_USB_VBUS_H_
#define CONTROL_USB_VBUS_H_

#ifdef CONTROL_USB_VBUS_H_



/*
USB管脚
VBUS_CHK   PD6 USB是否插入的检测
DPU_CTL    PB2 切换USB功能，低电平USB转串，高电平U盘MASS功能
 */

#define VBUS_CHK_PIN    GPIO_Pin_6
#define VBUS_CHK_PORT   GPIOD

#define DPU_CTL_PIN    GPIO_Pin_2
#define DPU_CTL_PORT   GPIOB

#define DP_PIN    GPIO_Pin_12
#define DP_PORT   GPIOA

#define DM_PIN    GPIO_Pin_11
#define DM_PORT   GPIOA

//初始化VBUS插入检测和功能切换
void Init_VBUS(void);

//获取USB线缆是否插入
int IsUSBConnect(void);

//切换USB模拟开关到USB Mass功能
//void DPU_CTL_ON(void);

//切换USB模拟开关到USB CH340上
//void DPU_CTL_OFF(void);


//dp dm管脚拉低
//void DPDM_LOW(void);

//切换USB从ch340切换到U盘模式
void USB2MASS(void);

#endif /* CONTROL_USB_VBUS_H_ */
#endif /* CONTROL_USB_VBUS_H_ */
