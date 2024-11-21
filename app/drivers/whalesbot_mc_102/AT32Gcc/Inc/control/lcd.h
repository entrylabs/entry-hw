/*
 * lcd.h
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 * 针对不同硬件，提供统一的LCD操作方式和函数
 */

#ifndef CONTROL_LCD_H_
#define CONTROL_LCD_H_

#ifdef CONTROL_LCD_H_



//LCD缓存
//RAM中屏幕缓存,此处需要使用屏幕分辨率大的缓存空间
extern uint8_t LCD_Buffer[SPI_LCD_WIDTH*SPI_LCD_HEIGHT_LINE];
extern uint8_t SPILCD_Buffer_ColorMask[SPI_LCD_WIDTH*SPI_LCD_HEIGHT_LINE];

//初始化液晶
void InitLCD(int Hardware);


//获取液晶屏宽度分辨率
int get_LCD_W(void);

//获取液晶屏高度分辨率
int get_LCD_H(void);

//获取LCD字符宽度
int get_LCD_CharH();

//获取LCD字符宽度
int get_LCD_CharW();

//RAM缓存清零
void LCD_ClearBuffer(void);

//在屏幕上绘制文字
void Printf(char *fmt,...);

#define printf Printf //printf和Printf等效

/*
在指定行上显示文本
line:0~8
fmt:要显示的文本，带参数
示例:show(0,"hi=%d",i)
*/
void show(int line, char* fmt, ...);


//绘制字符串到缓存上
void LCD_DrawStringToBuffer(int x_start,int y_start, char *s, uint8_t mode);

//在缓存区上绘制图像，x_start=0~127,y_start=0~64(需要8对齐),color:是否反向显示0：正常，1反色，2透明
void LCD_DrawPicToBuffer(int x_start,int y_start,const uint8_t *dat,uint8_t color);


//RAM缓存复制到LCD上
void LCD_Ram2LCD(void);

//关闭LCD屏幕
void LCD_Disable(void);

//清屏
void ClearLCD(void);

#endif
#endif

