/*
 * beep_simple.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      功能说明：IO方式控制器蜂鸣器
 */

#ifndef CONTROL_BEEP_SIMPLE_H_
#define CONTROL_BEEP_SIMPLE_H_


//编译使能
#ifdef CONTROL_BEEP_SIMPLE_H_

/*
DAC OUT ->  PA5
*/
#define BEEP_PIN    GPIO_Pin_5
#define BEEP_PORT	GPIOA

//纯IO方式控制的蜂鸣器，初始化
void InitBeepSimple(void);

//蜂鸣器蜂鸣声指定的时间
void beep(float seconds);


#endif
#endif
