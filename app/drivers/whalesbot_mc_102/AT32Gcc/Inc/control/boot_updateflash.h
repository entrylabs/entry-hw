/*
 * boot_updateflash.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      功能说明：芯片Boot下载功能，通过上位机串口进行下载固件更新
 */

#ifndef CONTROL_BOOT_UPDATEFLASH_H_
#define CONTROL_BOOT_UPDATEFLASH_H_


//编译使能
#ifdef CONTROL_BOOT_UPDATEFLASH_H_



//下载数据包长度
#define CMD_DOWNLOAD_SEND_SIZE       FLASH_BUFF_LEN+8
#define CMD_DOWNLOAD_REV_SIZE        FLASH_BUFF_LEN+8

//ping数据包长度
#define CMD_PING_SEND_SIZE       8
#define CMD_PING_REV_SIZE        10
//dw缓存区数据包大小
#define CMD_DW_REV_SIZE          8//回复数据长度
//复制Ram2Flash指令的数据包长度
#define CMD_RAM2FLASH_SEND_SIZE  11
#define CMD_RAM2FLASH_REV_SIZE   11
//将程序名称烧录到STM32上
#define CMD_SAVEFILENAME_SEND_SIZE  16
#define CMD_SAVEFILENAME_REV_SIZE  16
//指示运行指定地址的程序
#define CMD_RUNCODE_SEND_SIZE  11
#define CMD_RUNCODE_REV_SIZE   11
//cmd
#define CMD_DUMMY                0x00
#define CMD_PING                 0x01
#define CMD_WRITEBUFFER          0x10
#define CMD_RAM2FLASH            0x20
#define CMD_RAM2FLASH_SUCCESS    0x21
#define CMD_RAM2FLASH_FAIL       0x22
#define CMD_SAVEFILENAME            0x30
#define CMD_SAVEFILENAME_SUCCESS    0x31
#define CMD_SAVEFILENAME_FAIL       0x32
#define CMD_RUNCODE                 0x40
#define CMD_RUNCODE_SUCCESS         0x41
#define CMD_RUNCODE_FAIL            0x42
#define CMD_CRC                     0x50
#define CMD_CRC_SUCCESS             0x51
#define CMD_CRC_FAIL                0x52

#define CMD_PC_2_M32_HEAD0       0x55
#define CMD_PC_2_M32_HEAD1       0xAA
#define CMD_M32_2_PC_HEAD0       0x66
#define CMD_M32_2_PC_HEAD1       0xBB




//初始化BOOT更新内部FLASH功能
void InitBootUpdateFlash(void);


//BOOT下载的循环
void Bootloop(void);



#endif
#endif