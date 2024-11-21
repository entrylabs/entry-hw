/*
 * systemtimer.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      功能说明：系统定时器
 */

#ifndef CONTROL_SYSTEMTIMER_H_
#define CONTROL_SYSTEMTIMER_H_


//编译使能
#ifdef CONTROL_SYSTEMTIMER_H_





//1ms定时器回调函数
void System_1ms_CallBack(void);

//等待延时
void sleep(__IO float second);

//定时器回调函数个数
#define TIMER_CALLBACK_MAX 30

//设置定时器回调函数
void setTimerHandle(FunTypeNoPara TimerHandle,int mseconds);

//获取系统时钟
float seconds(void);
#define timer seconds//scratch对接名称
//复位系统时间
void resettime(void);
#define reset_timer resettime//scratch对接名称

//初始化SystemTick计时器
void InitSystemTimer(void);

//关闭定时器回调
void DeInitTimerCallBack(void);

#define DELAY_TIM  TIM2

//延时等待us
void sleep_us(__IO int us);

//设置微秒倒计时器
void setstoptime_us(__IO int us);

//等待微秒倒计时完成
void waitstoptime_us(void);

#endif
#endif
