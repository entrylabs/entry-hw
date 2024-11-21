/*
 * internal_flash.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      功能说明：芯片内部flash操作函数
 */

#ifndef CONTROL_INTERNAL_FLASH_H_
#define CONTROL_INTERNAL_FLASH_H_


//编译使能
#ifdef CONTROL_INTERNAL_FLASH_H_

/*
内部FLASH扇区大小2K
外部SPI FLASH扇区大小4K
故此处每个下载缓存大小设置为4K
*/
#define FLASH_BUFF_LEN            (4*1024)//4k
//STM32芯片FLASH地址范围
//48K~512K，每2K一个扇区,为和缓存一致，故设置为4K
#define FLASH_INTERNAL_MIN  FLASH_BASE+(52*1024)//最小从48K开始
#define FLASH_INTERNAL_MAX  FLASH_BASE+((512-4)*1024)//最大(512-4)K

//定义各程序所在地址
#define PROGRAM_BOOT    FLASH_BASE//boot程序所在地址
#define PROGRAM_GCC     (FLASH_BASE + (52*1024)) //0x0800D000  GCC编译程序所在地址
#define PROGRAM_GUI     (FLASH_BASE + (256*1024))//0x08040000  用户操作界面所在地址
#define PROGRAM_USBMASS (FLASH_BASE + (384*1024))//0x08060000  U盘固件所在地址
#define EEPROM_ADDRESS  (FLASH_BASE +((508)*1024))//eeprom从508K开始

#define SOUND_ADDRESS           (FLASH_BASE + (416*1024))//0x08068000  声音录制所在地址
#define SOUND_FLASHLEN          (92*1024)//声音录制大小


#define RUNFILE_SOURCE_FILESYSTEM 1//指示当前运行的程序是通过U盘文件系统加载的
#define RUNFILE_SOURCE_DEBUG      2//指示当前运行程序是通过在线运行下载的

/*
内部FLASH扇区大小2K
外部SPI FLASH扇区大小4K
故此处每个下载缓存大小设置为4K
*/
extern uint8_t RamFlashBuffer[FLASH_BUFF_LEN];

//写数据到RamFlash缓存中，写满缓存再进行FLASH烧录
void WriteRamBuffer(int offset,uint8_t data);

//将RamBuffer数据存储到Address指定的地址
//int WriteRam2InternalFlash(uint32_t Address);

//计算Address地址上4K扇区中代码的CRC校验数值
uint32_t CrcCode(uint32_t Address);

//将数据写入FLASH
int WriteRam2Flash(uint32_t Address);

//将RamBuffer数据存储到Address指定的地址
int WriteRam2InternalFlash(uint32_t Address);

//判断ram缓存是否和FLASH一致
int IsRamSameAsInternalFlash(uint32_t Address);

#define EEPROM_MAX          1024//最大EEPROM数量是1024



//常用系统EEPROM地址
#define EEPROM_SYSTEM_START 500//系统EEPROM起始地址
#define EEPROM_SOUND        512//静音设置存储地址
#define EEPROM_ENCH         513//语言设置存储地址
#define EEPROM_GUIEE_SEL    514//当前设置的EEPROM地址，方便用户快速设置EE
#define EEPROM_GUIFILE_SEL  515//当前设置的FILE地址，方便用户快速设置FILE
#define EEPROM_COLOR        516//SPI液晶屏的颜色设置当前控制器颜色设定
#define EEPROM_CONTRAST     517//LCD12864灰度参数
#define EEPROM_AUTOOFF      518//自动关机
#define EEPROM_RUNFILE_SOU  519//指示当前运行的文件是通过U盘加载的，还是在线运行加载的
/*
dummy                       519~529
*/
#define EEPROM_BTNAME0      530//控制器蓝牙名称
#define EEPROM_BTNAME1      531//控制器蓝牙名称
#define EEPROM_BTNAME2      532//控制器蓝牙名称
#define EEPROM_BTNAME3      533//控制器蓝牙名称
#define EEPROM_BTNAME4      534//控制器蓝牙名称
#define EEPROM_BTNAME5      535//控制器蓝牙名称
#define EEPROM_BTNAME6      536//控制器蓝牙名称
#define EEPROM_BTNAME7      537//控制器蓝牙名称
#define EEPROM_BTNAME8      538//控制器蓝牙名称
#define EEPROM_BTNAME9      539//控制器蓝牙名称
#define EEPROM_BTNAME10     540//控制器蓝牙名称
#define EEPROM_BTNAME11     541//控制器蓝牙名称
#define EEPROM_BTNAME12     542//控制器蓝牙名称
#define EEPROM_BTNAME13     543//控制器蓝牙名称
#define EEPROM_BTNAME14     544//控制器蓝牙名称

/*
#define EEPROM_DUMMY       514~550//空
*/
//当前需要运行文件的名称
#define EEPROM_FILE0        550//运行文件名称
#define EEPROM_FILE1        551//运行文件名称
#define EEPROM_FILE2        552//运行文件名称
#define EEPROM_FILE3        553//运行文件名称
#define EEPROM_FILE4        554//运行文件名称
#define EEPROM_FILE5        555//运行文件名称
#define EEPROM_FILE6        556//运行文件名称
#define EEPROM_FILE7        557//运行文件名称
#define EEPROM_FILE8        558//运行文件名称
#define EEPROM_FILE9        559//运行文件名称

/*
#define EEPROM_DUMMY        559~569//空
*/
#define   EE_SERVOA_0_OFFSET              570//伺服电机角度0位误差补偿
#define   EE_SERVOA_1_OFFSET              571//伺服电机角度0位误差补偿
#define   EE_SERVOA_2_OFFSET              572//伺服电机角度0位误差补偿
#define   EE_SERVOA_3_OFFSET              573//伺服电机角度0位误差补偿
#define   EE_SERVOA_4_OFFSET              574//伺服电机角度0位误差补偿
#define   EE_SERVOA_5_OFFSET              575//伺服电机角度0位误差补偿
#define   EE_SERVOA_6_OFFSET              576//伺服电机角度0位误差补偿
#define   EE_SERVOA_7_OFFSET              577//伺服电机角度0位误差补偿
#define   EE_SERVOA_8_OFFSET              578//伺服电机角度0位误差补偿
#define   EE_SERVOA_9_OFFSET              579//伺服电机角度0位误差补偿
#define   EE_SERVOA_10_OFFSET             580//伺服电机角度0位误差补偿
#define   EE_SERVOA_11_OFFSET             581//伺服电机角度0位误差补偿
#define   EE_SERVOA_12_OFFSET             582//伺服电机角度0位误差补偿
#define   EE_SERVOA_13_OFFSET             583//伺服电机角度0位误差补偿
#define   EE_SERVOA_14_OFFSET             584//伺服电机角度0位误差补偿
#define   EE_SERVOA_15_OFFSET             585//伺服电机角度0位误差补偿
#define   EE_SERVOA_16_OFFSET             586//伺服电机角度0位误差补偿
#define   EE_SERVOA_17_OFFSET             587//伺服电机角度0位误差补偿
#define   EE_SERVOA_18_OFFSET             588//伺服电机角度0位误差补偿
#define   EE_SERVOA_19_OFFSET             589//伺服电机角度0位误差补偿
#define   EE_SERVOA_20_OFFSET             590//伺服电机角度0位误差补偿


//将EEPROM数据同步到缓存上，避免多次读取和写入flash。需要和SyncEEBufferToFlash成对使用
void SyncEEFlashToBuffer(void);

//将EEPROM缓存数据写入指定FLASH上。需要和SyncEEFlashToBuffer成对使用
int SyncEEBufferToFlash(void);

//将数据写入EE缓存区上指定地址：addr：0~1024，dat：int型
void WriteEEPROMBufffer(int addr, int dat);

//读取EEPROM缓存区上数据，addr数据范围最大EEPROM_MAX
int ReadEEPROM(int addr);

//将数据写入EE缓存区上指定地址，并同步到FLASH中：addr：0~1024，dat：int型
void WriteEEPROM(int addr, int dat);

//将运行程序文件名写入到EE上
int WriteEEPROM_FileName(char *filename);

//将蓝牙文件名称写入到EE上
int WriteEEPROM_BTName(char *BTname);

//读取运行程序名称
char *ReadEEPROM_FileName(void);

//将数据写入EE缓存区上指定地址，并同步到FLASH中：addr：0~1024，dat：int型
char *ReadEEPROM_BTName(void);

//清除录音相关FLASH空间
int ClearRecodeFlash(void);

//保存声音数据
int SaveSoundData(int index,uint32_t data);

#endif
#endif
