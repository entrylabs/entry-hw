/*
 * beep_wav.h
 *
 *  Created on: 2022年12月26日
 *      Author: Administrator
 *      彩色液晶屏驱动
 */

#ifndef CONTROL_SPI_LCD_H_
#define CONTROL_SPI_LCD_H_

#ifdef CONTROL_SPI_LCD_H_




//SPI液晶屏分辨率
#define SPI_LCD_WIDTH        160
#define SPI_LCD_HEIGHT       80
#define SPI_LCD_HEIGHT_LINE  SPI_LCD_HEIGHT/8

#define SPI_LCD_CHARHEIGHT   16//大字体的字高
#define PICASC16_WIDTH       8//字符宽度

#define  Color_MASK             3//彩色遮罩绘制

//初始化SPI液晶屏幕,硬件型号只有102的情况下，才会初始化此屏幕
void InitSPI_LCD();

//以指定颜色清屏幕
void SPILcd_Clear(uint16_t Color);

//将888颜色转换为565颜色
uint16_t RGB888ToRGB565(uint32_t n888Color);

//RAM缓存复制到SPI LCD上
void LCD_Ram2SPILCD(void);

//绘制字符串到缓存上
void LCDSPI_PutString2Buffer(uint8_t col, uint8_t page, char *s, uint8_t mode);

//绘制字符串到缓存上
void SPILCD_DrawStringToBuffer(int x_start,int y_start, char *s, uint8_t mode);

//在缓存区上绘制图像，x_start=0~127,y_start=0~64(需要8对齐),color:是否反向显示0：正常，1反色，2透明
void SPILCD_DrawPicToBuffer(int x_start,int y_start,const uint8_t *dat,uint8_t color);

//设置界面颜色
int SetLCD_Color(int ColorIndex);

//设置顶部TITLE可见性
void LCD_SPI_SetTitleVisable(int Visable);

//在缓存区上绘制图像，x_start=0~127,y_start=0~64(需要8对齐),color:是否反向显示0：正常，1反色，2透明
void SPILCD_DrawPicToMask(int x_start,int y_start,const uint8_t *dat,uint8_t color);


//以指定颜色清屏幕
void Lcd_FillColor(int cR,int cG,int cB);
/*
SPILCD_RESET    LCD_RESET   PE3
SPILCD_RS       LCD_A16     PD11
SPILCD_CS       LCD_NE1     PD7
*/
#define SPILCD_RST_PIN          GPIO_Pin_3
#define SPILCD_RST_PORT         GPIOE

#define SPILCD_RS_PIN          GPIO_Pin_11
#define SPILCD_RS_PORT         GPIOD

#define SPILCD_CS_PIN          GPIO_Pin_7
#define SPILCD_CS_PORT         GPIOD

#define SPILCD                 SPI1



#endif
#endif
