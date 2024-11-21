/*
 * digouput.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      说明：数字输出功能
 */

#ifndef CONTROL_DIGOUPUT_H_
#define CONTROL_DIGOUPUT_H_


//编译使能
#ifdef CONTROL_DIGOUPUT_H_


//端口编号
#define P1      1
#define P2      2
#define P3      3
#define P4      4
#define P5      5
#define P6      6
#define P7      7
#define P8      8
#define P9      9
#define P10     10
#define P11     11
#define P12     12
#define P13     13
#define P14     14
#define P15     15
#define P16     16
#define P17     17
#define P18     18
#define P19     19
#define P20     20

//数字输出端口
/*
DIG1  ->  PE12
DIG2  ->  PB15
DIG3  ->  PA6()
DIG4  ->  PB7() 注：PB7 T4C2，当开启FSMC后，T4C2和FSMC_NAVD冲突，无法输出T4C2_PWM,故DIG4和PWM_PC_2对调
DIG5  ->  PE11(T1C2)
DIG6  ->  PE13(T1C3)
DIG7  ->  PE14(T1C4)
DIG8  ->  PD13
DIG9  ->  PD12
DIG10 ->  PD10
*/
#define DIG1_PIN    GPIO_Pin_12
#define DIG1_PORT	GPIOE

#define DIG2_PIN    GPIO_Pin_15
#define DIG2_PORT	GPIOB

#define DIG3_PIN    GPIO_Pin_6
#define DIG3_PORT	GPIOA

#define DIG4_PIN    GPIO_Pin_7
#define DIG4_PORT	GPIOB

#define DIG5_PIN    GPIO_Pin_11
#define DIG5_PORT	GPIOE

#define DIG6_PIN    GPIO_Pin_13
#define DIG6_PORT	GPIOE

#define DIG7_PIN    GPIO_Pin_14
#define DIG7_PORT	GPIOE

#define DIG8_PIN    GPIO_Pin_13
#define DIG8_PORT	GPIOD

#define DIG9_PIN    GPIO_Pin_12
#define DIG9_PORT	GPIOD

#define DIG10_PIN   GPIO_Pin_10
#define DIG10_PORT	GPIOD






//初始化DO端口
void InitDo(int Hardware);

//设置DO输出
void SetDO(int Port,int State);
//DO端口开关状态定义
#define switch_on   true
#define switch_off  false
//SetDO的2个等效函数
#define set_light SetDO//设置DO口上的灯光，switch_on/switch_off
#define set_magnet SetDO//设置DO口上的电磁铁，switch_on/switch_off



//设置DO输出反转
void ToggleDO(int Port);


//根据位使能，设置DO端口状态
void setDO(int Channel, int State);


#endif /* CONTROL_DIGOUPUT_H_ */
#endif /* CONTROL_DIGOUPUT_H_ */
