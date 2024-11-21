/*
 * lcd_128x64.h
 *
 *  Created on: 2022年12月21日
 *      Author: Administrator
 */

#ifndef CONTROL_LCD_128X64_H_
#define CONTROL_LCD_128X64_H_


#ifdef CONTROL_LCD_128X64_H_



/*
LCD_NOE_RD      PD4
LCD_NW_WR       PD5
LCD_NE1         PD7
LCD_A16         PD11
LCD_D0          PD14
LCD_D1          PD15
LCD_D2          PD0
LCD_D3          PD1
LCD_D4          PE7
LCD_D5          PE8
LCD_D6          PE9
LCD_D7          PE10
LCD_RST         PE3
*/

#define LCD_RST_PIN          GPIO_Pin_3
#define LCD_RST_PORT         GPIOE

#define LCD_NOE_RD_PIN       GPIO_Pin_4
#define LCD_NOE_RD_PORT      GPIOD

#define LCD_NW_WR_PIN        GPIO_Pin_5
#define LCD_NW_WR_PORT       GPIOD

#define LCD_NE1_PIN          GPIO_Pin_7
#define LCD_NE1_PORT         GPIOD

#define LCD_A16_PIN          GPIO_Pin_11
#define LCD_A16_PORT         GPIOD

#define LCD_D0_PIN           GPIO_Pin_14
#define LCD_D0_PORT          GPIOD

#define LCD_D1_PIN           GPIO_Pin_15
#define LCD_D1_PORT          GPIOD

#define LCD_D2_PIN           GPIO_Pin_0
#define LCD_D2_PORT          GPIOD

#define LCD_D3_PIN           GPIO_Pin_1
#define LCD_D3_PORT          GPIOD

#define LCD_D4_PIN           GPIO_Pin_7
#define LCD_D4_PORT          GPIOE

#define LCD_D5_PIN           GPIO_Pin_8
#define LCD_D5_PORT          GPIOE

#define LCD_D6_PIN           GPIO_Pin_9
#define LCD_D6_PORT          GPIOE

#define LCD_D7_PIN           GPIO_Pin_10
#define LCD_D7_PORT          GPIOE



//	LCD	相关代码
//	宏定义
#define LCD12864_COMM_ADD		*((vu8*)0x60000000) 	//	NE1  A6   VET6
#define LCD12864_DATA_ADD		*((vu8*)0x60010000)   //*((vu8*)0x60000040) 	//	NE1  A16   VET6  //hgq

#define LCD12864_SendCMD(Cmd) 	LCD12864_COMM_ADD = Cmd
#define LCD12864_SendDAT(Dat) 	LCD12864_DATA_ADD = Dat
#define LCD12864_Read_Reg()		LCD12864_COMM_ADD	
#define LCD12864_Read_DAT()		LCD12864_DATA_ADD


//屏幕分辨率参数
#define LCD_WIDTH_X           128//屏幕宽度128像素
#define LCD_HEIGHT_Y          64//屏幕高度64像素
#define LCD_HEIGHT_Y_LINE     (LCD_HEIGHT_Y/8)//屏幕高度，因为是黑白点阵，故可用单bit表示一个像素点

#define LCD12864_CHARHEIGHT    8//小字体的字高
#define LCD12864_CHARWIDTH     6//8//小字体的字高

#define  Color_Black            1//反色绘制
#define  Color_White            0//常规显示
#define  Color_Transparent      2//透明绘制

//初始化128x64黑白屏幕,硬件型号为902的情况下，才会初始化黑白液晶
void InitLCD128X64();




//在缓存区上绘制图像，x_start=0~127,y_start=0~64(需要8对齐)
void LCD12864_DrawPicToBuffer(int x_statr,int y_start,const uint8_t *dat,uint8_t color);

//绘制字符串到缓存上,，x_start=0~127,y_start=0~64(需要8对齐)
void LCD12864_DrawStringToBuffer(int x_start,int y_start, char *s, uint8_t mode);



//RAM缓存复制到LCD上
void LCD12864_Ram2LCD(void);

//绘制字符串到缓存上
void LCD12864_PutString2Buffer(uint8_t col, uint8_t page, char *s, uint8_t mode);

//设置液晶屏灰度，返回当前灰度设置
int LCD12864Contrast(void);

#ifdef SYSCLK_FREQ_72MHz   
    #define FSMC_TIMER      2
    #define FSMC_WRITE_DIV  4
    #define FSMC_READ_DIV   15//72
#endif
#ifdef SYSCLK_FREQ_240MHz
    #define FSMC_TIMER      8//12//16//8//12
    #define FSMC_WRITE_DIV  16//15//30//15//15
    #define FSMC_READ_DIV   16//15//30//15
#endif




#endif /* CONTROL_LCD_128X64_H_ */
#endif /* CONTROL_LCD_128X64_H_ */
