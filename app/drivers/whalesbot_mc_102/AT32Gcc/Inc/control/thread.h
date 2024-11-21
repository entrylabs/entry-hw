/*
 * thread.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      功能说明：多线程切换功能
 */

#ifndef CONTROL_THREAD_H_
#define CONTROL_THREAD_H_



//编译使能
#ifdef CONTROL_THREAD_H_


#define USER_TASK_LOW_PRORITY   1//任务优先级较低
#define USER_TASK_PRORITY_LEVEL 2//任务优先级较高，默认
#define HIGH_TASK_PRORITY_LEVEL 3//任务优先级较高，默认
#define USER_TASK_HEAP_SIZE     512

//线程中使用的延时函数
void wait(float seconds);

//恢复RTOS进行切换
void ThreadResumeAll(void);

//避免RTOS进行切换
void ThreadSuspendAll(void);

//结束运行线程
void ThreadDelete(void);

#ifndef BOOT_CODE//BOOT未启用操作系统，故此处跳过

//开启新线程
void ThreadStart(void * Func);

//开启新线程,使用用户设置的优先级
void ThreadStart_Prority(void * Func,int Prority_level,int HEAP_SIZE_level);

void vTaskStartScheduler( void );

//FreeRTOS切换操作，需要放到Systick中断中
void ThreadCallHandle(void);

#endif
#endif
#endif
