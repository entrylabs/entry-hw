/*
 * devicename.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      功能说明：获取硬件PCB板上跳线电阻选则的软件和硬件版本
 */

#ifndef CONTROL_DEVICENAME_H_
#define CONTROL_DEVICENAME_H_


//编译使能
#ifdef CONTROL_DEVICENAME_H_



//硬件版本配置管脚
#define HARD_UNKNOW     0
#define HARD_102        102
#define HARD_902        902
#define HARD_1002       1002
#define HARD_602        602
#define SOFT_V0         0
#define SOFT_V1         1
//此3管脚不影响屏幕情况下，上电判断电平后，确定硬件和软件版本
/*
HARD1 -> PD4
HARD2 -> PD5
HARD3 -> PD7
        HARD1   HARD2   SOFT3  
102     1       1       X
902     1       0       X
1002    0       0       X
602     0       1       X
*/
#define HARD1_PIN       GPIO_Pin_4
#define HARD1_PORT	    GPIOD

#define HARD2_PIN       GPIO_Pin_5
#define HARD2_PORT	    GPIOD

#define SOFT3_PIN       GPIO_Pin_7
#define SOFT3_PORT	    GPIOD


//初始化获取设备名称
void InitDeviceName(void);


//获取设备名称：HARD_102、HARD_902、HARD_1002、HARD_602
int getHARDWARE(void);

//获取设备软件管脚配置：SOFT_V0，SOFT_V1
int getSOFRWARE(void);




#endif
#endif
