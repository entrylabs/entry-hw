/*
 * power_key.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      功能说明：电源按钮，左右按钮功能
 */
#ifndef CONTROL_POWER_KEY_H_
#define CONTROL_POWER_KEY_H_


//编译使能
#ifdef CONTROL_POWER_KEY_H_


//电源控制管脚，通过此管脚锁定整机电源
/*
PWR_CTL -> PE15
*/
#define PWR_CTL_PIN      GPIO_Pin_15
#define PWR_CTL_PORT     GPIOE


//按钮管脚
/*
KEY_ESC         -> PC15
KEY_LEFT        -> PC13
KEY_RIGHT       -> PC14
KEY_ENTER       -> PA8
*/
#define KEY_ESC_PIN      GPIO_Pin_15
#define KEY_ESC_PORT     GPIOC

#define KEY_LEFT_PIN      GPIO_Pin_13
#define KEY_LEFT_PORT     GPIOC

#define KEY_RIGHT_PIN      GPIO_Pin_14
#define KEY_RIGHT_PORT     GPIOC

#define KEY_ENTER_PIN      GPIO_Pin_8
#define KEY_ENTER_PORT     GPIOA

//按钮类型:KeyName
#define KEY_Dummy           0
#define KEY_ESC             1
#define KEY_LEFT            2
#define KEY_RIGHT           3
#define KEY_ENTER           4


//初始化电源锁定管脚
void InitPowerCtrl(void);

//电源打开，上电
void PowerCtrl_On(void);

//电源关闭，掉电，整机关机
void PowerCtrl_Off(void);

//关闭电源，整机彻底关闭。（结合看门狗等操作）
//只关闭电源管脚，不进行看门狗操作，整机可能会异常重启
void PowerOffSytem(void);

//初始化按钮
void InitKeys(int Hardware);

//返回ESC按钮是否按下,false:未按。true：按下
int getKey(int KeyName);

//等待按钮是否抬起，可避免误操作，KeyName:KEY_ESC,KEY_LEFT,KEY_RIGHT,KEY_ENTER
void wait_keyup(int KeyName);

//等待按钮是否按下，可避免误操作，KeyName:KEY_ESC,KEY_LEFT,KEY_RIGHT,KEY_ENTER
void wait_keydown(int KeyName);

//等待按1次按钮
void wait_keyclick(int keyname);

#define KEYPOWEROFF_TIME 10//10*100ms,长按电源按钮1秒后关机
//长按关机检测,每100ms检测1次
void PowerOffCheck_100ms_CallBack(void);

//指示102控制器enter按钮是否退出程序，此功能在巡线检测黑白线时使用
void enterkey_exitprogram(int enable);


#endif
#endif
