/*
 * port_i2c_dot8x8.C
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 *      说明：I2C端口的8x8点阵操作
 */
#ifndef CONTROL_PORT_I2C_DOT8X8_H_
#define CONTROL_PORT_I2C_DOT8X8_H_

#ifdef CONTROL_PORT_I2C_DOT8X8_H_




typedef struct {
    uint8_t data[8]; 
}LedMaritx;




typedef enum LED_Symbol_ID
{
    LED_symbol_off              = 0,
    LED_symbol_question_mark    = 1,	// ?
    LED_symbol_exclamation      = 2, 	// !
    LED_symbol_dollar           = 3,	//$
    LED_symbol_RMB              = 4,	//￥
    LED_symbol_equal            = 5,	//=
    LED_symbol_plus             = 6, 	//+
    LED_symbol_minus            = 7, 	//-
    LED_symbol_multiplied       = 8, 	//X
    LED_symbol_divided          = 9, 	//÷
    LED_symbol_0                = 10,	//0
    LED_symbol_1 = 11,	//1
    LED_symbol_2 = 12,	//2
    LED_symbol_3 = 13,	//3
    LED_symbol_4 = 14,	//4
    LED_symbol_5 = 15,	//5
    LED_symbol_6 = 16,	//6
    LED_symbol_7 = 17,	//7
    LED_symbol_8 = 18,	//8
    LED_symbol_9 = 19,	//9
    LED_symbol_A = 20,	//A
    LED_symbol_B = 21,	//B
    LED_symbol_C = 22,	//C
    LED_symbol_D = 23,	//D
    LED_symbol_E = 24,	//E
    LED_symbol_F = 25,	//F
    LED_symbol_G = 26,	//G
    LED_symbol_H = 27,	//H
    LED_symbol_I = 28,	//I
    LED_symbol_J = 29,	//J
    LED_symbol_K = 30,	//K
    LED_symbol_L = 31,	//L
    LED_symbol_M = 32,	//M
    LED_symbol_N = 33,	//N
    LED_symbol_O = 34,	//O
    LED_symbol_P = 35,	//P
    LED_symbol_Q = 36,	//Q
    LED_symbol_R = 37,	//R
    LED_symbol_S = 38,	//S
    LED_symbol_T = 39,	//T
    LED_symbol_U = 40,	//U
    LED_symbol_V = 41,	//V
    LED_symbol_W = 42,	//W
    LED_symbol_X = 43,	//X
    LED_symbol_Y = 44,	//Y
    LED_symbol_Z = 45,	//Z
    LED_symbol_big_heart    = 46,	//大心
    LED_symbol_little_heart = 47,	//小心
    LED_symbol_forward      = 48,	//前进
    LED_symbol_backward     = 49,	//后退
    LED_symbol_turnleft     = 50,	//左转
    LED_symbol_turnright    = 51,	//右转
    LED_symbol_GO           = 52,	//GO
    LED_symbol_stop         = 53	//stop
}LED_Symbol_ID;


/*********************************************************/
/*                 LED 表情ID 定义                        */
/*********************************************************/
typedef enum LED_Emoji_ID
{
    LED_emoji_eye     = 1,	//大眼睛
    LED_emoji_smile   = 2,	//微笑
    LED_emoji_sad     = 3,	//悲伤
    LED_emoji_naughty = 4,	//调皮
    LED_emoji_surprised = 5,	//惊讶
    LED_emoji_flare   = 6,	//发怒
    LED_emoji_tears   = 7,	//流泪
    LED_emoji_avarice = 8,	//贪财
    LED_emoji_beckoning = 9,	//心动
    LED_emoji_anger   = 10,	//愤怒
    LED_emoji_dizzy   = 11,	//晕
    LED_emoji_grim    = 12	//冷酷
}LED_Emoji_ID;



//在Port指定的I2C端口上，显示8x8点阵
//Port：P1~P10
//SymboIndex:DicPictrue指定的图像编号
void display_symbol(int Port,LED_Symbol_ID SymboIndex);

//在Port指定的I2C端口上，显示8x8点阵
//Port：P1~P10
//symboldata:DicPictrue指定的图像编号
void display_custom(int Port,LedMaritx symboldata);

//关闭8x8LED
void off_LED(int Port);

/*
设置双点阵屏
Port1/Port2：2个点阵屏连接的端口。P1~P10
emotiom_id:播放的点阵图案序号:LED_emoji_eye...
*/
void display_emotion(int Port1,int Port2,LED_Emoji_ID emotiom_id);

// 关闭8x8LED
void display_bklight(int Port,LedMaritx symboldata,int colorW);

/*
关闭双点阵屏
Port1/Port2：2个点阵屏连接的端口。P1~P10
*/
void off_emotion(int Port1,int Port2);

#endif
#endif