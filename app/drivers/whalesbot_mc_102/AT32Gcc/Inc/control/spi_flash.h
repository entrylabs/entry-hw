/*
 * spi_flash.h
 *
 *  Created on: 2022年12月22日
 *      Author: Administrator
 */

#ifndef CONTROL_SPI_FLASH_H_
#define CONTROL_SPI_FLASH_H_

#ifdef CONTROL_SPI_FLASH_H_

#define SPI_FLASH_START_ADDRESS       0x0
#define SPI_FLASH_BLOCK_SIZE          0x1000//4k
#define SPI_FLASH_SIZE                4*1024*1024 //4M

#define sFLASH_CMD_WRITE          0x02  /*!< Write to Memory instruction */
#define sFLASH_CMD_WRSR           0x01  /*!< Write Status Register instruction */
#define sFLASH_CMD_WREN           0x06  /*!< Write enable instruction */
#define sFLASH_CMD_READ			  0x03  /*!< Read from Memory instruction */
#define sFLASH_CMD_RDSR			  0x05  /*!< Read Status Register instruction  */
#define sFLASH_CMD_RDID			  0x9F  /*!< Read identification */
#define sFLASH_CMD_SE			  0x20//4k erase //0xD8  /*!< Sector Erase instruction */
#define sFLASH_CMD_BE             0xC7  /*!< Bulk Erase instruction */
#define sFLASH_WIP_FLAG           0x01  /*!< Write In Progress (WIP) flag */


/*
SPI1(REMAP)
PA15(JTDI)  SPI1_NSS
PB3(JTDO)   SPI1_SCK
PB4(JNRST)  SPI1_MISO
PB5         SPI1_MOSI
*/

#define SPI_NSS_PIN     GPIO_Pin_15
#define SPI_NSS_PPRT    GPIOA

#define SPI_SCK_PIN     GPIO_Pin_3
#define SPI_SCK_PPRT    GPIOB

#define SPI_MISO_PIN     GPIO_Pin_4
#define SPI_MISO_PPRT    GPIOB

#define SPI_MOSI_PIN     GPIO_Pin_5
#define SPI_MOSI_PPRT    GPIOB

#define SPIFLASH        SPI1


#ifdef SYSCLK_FREQ_72MHz   
    #define SPI_BUAD_DIV SPI_BaudRatePrescaler_8//SPI_BaudRatePrescaler_16//SPI_BaudRatePrescaler_32// 72/32=2M
#endif
#ifdef  SYSCLK_FREQ_240MHz
    #define SPI_BUAD_DIV SPI_BaudRatePrescaler_4//SPI_BaudRatePrescaler_8/*SPI_BaudRatePrescaler_8*///SPI_BaudRatePrescaler_64//SPI_BaudRatePrescaler_128// 240/128=1.8M
#endif


#define sFLASH_DUMMY_BYTE           0xA5
#define sFLASH_SPI_PAGESIZE         0x100

#define FLASH_SPI_MAX               (4*1024*1024-4*1024)//4M-4K=0x3FF000
#define FLASH_SPI_MIN               (0)//0K


//从文件系统中获取的bin文件数量
#define  ROOTFILE	        0x3000//U盘文件ROOT地址
#define  MASS_MEMORY_START  0//U盘所在初始地址
#define  MAX_FILE_ENTRY     224 //文件最大个数
#define  FILE_NAME_LEN      10 //文件名长度
#define  GCC_MAXCODESIZE    204*1024//GCC运行程序文件最大长度208K
#define  DATABEGIN			0x7000//U盘数据区起始地址
#define  FAT1_ADDR			0x1000 //FAT1地址


//00000000(读写) 00000001(只读) 00000010(隐藏) 00000100(系统) 00001000(卷标)  00010000(目录) 00100000(归档)
#define FAT16_FILETYPE_RW         0x00//00000000(读写)
#define FAT16_FILETYPE_READONLY   0x01//00000001(只读)
#define FAT16_FILETYPE_HIDE       0x02//00000010(隐藏)
#define FAT16_FILETYPE_SYS        0x04//00000100(系统)
#define FAT16_FILETYPE_LABEL      0x08//00001000(卷标) 
#define FAT16_FILETYPE_DIR        0x10//00010000(目录)
#define FAT16_FILETYPE_ARCHIVE    0x20//00100000(归档)


//初始化外部SPI Flash管脚
void SPI_FLASH_Init(void);

//读取FLASH设备的ID编号
uint32_t sFLASH_ReadID(void);


//写入外部FLASH
void sFLASH_WriteBuffer(uint8_t* pBuffer, uint32_t WriteAddr, uint16_t NumByteToWrite);

//读取外部flash
void sFLASH_ReadBuffer(__IO uint8_t* pBuffer, __IO uint32_t ReadAddr, __IO uint16_t NumByteToRead);

//擦除spi flash扇区
void sFLASH_EraseSector(uint32_t SectorAddr);


//从U盘上更新文件名称,返回有效的文件个数
int UpdateFileName(void);

//获取U盘上文件名称
char *getFileName(int index);

//加载第index个文件
uint32_t LoadBin(int index);

//通过文件名，加载文件系统上的BIN文件，并执行
int LoadBinByName(char *filename);

void DiskFormat(void);
//获取U盘上文件偏移地址
//int getFileOffset(int index);

#endif /* CONTROL_SPI_FLASH_H_ */
#endif
