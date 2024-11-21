/*
 * program_run.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      功能说明：程序跳转功能
 */
#ifndef CONTROL_PROGRAM_RUN_H_
#define CONTROL_PROGRAM_RUN_H_


//编译使能
#ifdef CONTROL_PROGRAM_RUN_H_









//芯片复位
void Program_Reset();


//运行指定地址的程序
//ProgramAddress: PROGRAM_BOOT,PROGRAM_GCC,PROGRAM_GUI,PROGRAM_USBMASS
void Program_Run(uint32_t ProgramAddress);




#define RAM_FLAG_UNKNOW         255//未知的RAM标记
#define RAM_FLAG_RUNUSBMASS     0x10//指示BOOT直接运行usb mass
#define RAM_FLAG_RUNGUI         0x20//指示BOOT直接运行GUI
#define RAM_FLAG_RUNGCC         0x40//指示BOOT直接运行gcc
#define RAM_FLAG_SHOWLOGO       0x30//指示gui显示开机LOGO和开机音频


//设置RAM标记
void SetRamFlag(uint8_t flag);

//清除RAM标记
void ResetRamFlag(void);

//获取有效RAM标记
uint8_t GetRamFlag(void);



#endif
#endif
