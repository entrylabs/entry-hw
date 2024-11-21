/*
 * port_AI.h
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 */

#ifndef CONTROL_PORT_AI_H_
#define CONTROL_PORT_AI_H_

#ifdef CONTROL_PORT_AI_H_


/*
ABATT   ADC8    PB0 
A1      ADC10   PC0 
A2      ADC11   PC1 
A3      ADC12   PC2 
A4      ADC13   PC3 
A5      ADC0    PA0
A6      ADC1    PA1
A7      ADC14   PC4 
A8      ADC15   PC5
A9      ADC9    PB1
A10     ADC4    PA4
*/
#define ADC_PIN_MAX    11//11
#define BATT_INDEX     0
#define ADCBATT_PIN     GPIO_Pin_0
#define ADCBATT_PORT    GPIOB
#define ADCBATT_CH      ADC_Channel_8

#define ADC1_PIN        GPIO_Pin_0
#define ADC1_PORT       GPIOC
#define ADC1_CH         ADC_Channel_10

#define ADC2_PIN        GPIO_Pin_1
#define ADC2_PORT       GPIOC
#define ADC2_CH         ADC_Channel_11

#define ADC3_PIN        GPIO_Pin_2
#define ADC3_PORT       GPIOC
#define ADC3_CH         ADC_Channel_12

#define ADC4_PIN        GPIO_Pin_3
#define ADC4_PORT       GPIOC
#define ADC4_CH         ADC_Channel_13

#define ADC5_PIN        GPIO_Pin_0
#define ADC5_PORT       GPIOA
#define ADC5_CH         ADC_Channel_0

#define ADC6_PIN        GPIO_Pin_1
#define ADC6_PORT       GPIOA
#define ADC6_CH         ADC_Channel_1

#define ADC7_PIN        GPIO_Pin_4
#define ADC7_PORT       GPIOC
#define ADC7_CH         ADC_Channel_14

#define ADC8_PIN        GPIO_Pin_5
#define ADC8_PORT       GPIOC
#define ADC8_CH         ADC_Channel_15

#define ADC9_PIN        GPIO_Pin_1
#define ADC9_PORT       GPIOB
#define ADC9_CH         ADC_Channel_9

#define ADC10_PIN        GPIO_Pin_4
#define ADC10_PORT       GPIOA
#define ADC10_CH         ADC_Channel_4



#define ADCX 			ADC1
#define ADC_DR_ADDRESS 	((uint32_t)&ADC1->DR)//ADC1
#define ADC_DMA_CHANNEL DMA1_Channel1


//初始话ADC
void InitADC(int Hardware);



//获取模拟端口数据
int getAI(int Port);

//根据硬件，返回AI端口个数
int getAICount(void);

//返回经过模拟滤波的模拟数值
int getAI_Avg(int Port);


//返回经过峰峰值处理的模拟数值
int getAI_Max(int Port);

//返回ADC的原始采用数据
int getAI_Hardware(int Port);

#endif /* CONTROL_PORT_AI_H_ */
#endif
