/*
 * port_pwmservo.h
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 */

#ifndef CONTROL_PORT_PWMSERVO_H_
#define CONTROL_PORT_PWMSERVO_H_

#ifdef CONTROL_PORT_PWMSERVO_H_


//最大的舵机个数
#define MAXSERVOACOUNT      P10

#define W_PWM_PSC_VAL       1200
#define W_PWM_PRD_VAL	    (2000 - 1)
//#define W_PWM_WID_VAL       1000


#define TIM_SERVO           TIM1
#define TIM_SERVO_REMAP     GPIO_FullRemap_TIM1




/*伺服PWM舵机连接到P5,P6,P7
P5 -> PE11
P6 -> P13
P7 -> PE14
*/




//设置PWM舵机角度,PORT:P5/P6/P7,Speed:10-100,Angle:0-180
void SetServo(int Port,int Speed,int Angle);

//伺服电机初始化
void ServoInit(void);









#endif
#endif
