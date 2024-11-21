/*
 * port_i2c.H
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 *      说明：i2c端口操作
 */
#ifndef CONTROL_PORT_I2C_H_
#define CONTROL_PORT_I2C_H_

#ifdef CONTROL_PORT_I2C_H_













/*
P1  I2C
    SCL PD2
    SDA PC12 
*/
#define SCL_P1_PIN        GPIO_Pin_2
#define SCL_P1_PORT       GPIOD
#define SDA_P1_PIN        GPIO_Pin_12
#define SDA_P1_PORT       GPIOC

/*
P2 I2C
    SCL PC11
    SDA PC10 
*/
#define SCL_P2_PIN        GPIO_Pin_11
#define SCL_P2_PORT       GPIOC
#define SDA_P2_PIN        GPIO_Pin_10
#define SDA_P2_PORT       GPIOC

/*
P3,4,5,6,7,8,9,10
    SCL     PB10
    SDA     PB11
    ICHA     PB12
    ICHB     PB13
    ICHC     PB14
*/
#define SCL_PX_PIN        GPIO_Pin_10
#define SCL_PX_PORT       GPIOB
#define SDA_PX_PIN        GPIO_Pin_11
#define SDA_PX_PORT       GPIOB

#define ICHA_PIN        GPIO_Pin_12
#define ICHA_PORT       GPIOB
#define ICHB_PIN        GPIO_Pin_13
#define ICHB_PORT       GPIOB
#define ICHC_PIN        GPIO_Pin_14
#define ICHC_PORT       GPIOB


//初始化I2C端口
void I2C_InitX(void);


#define OPTADDWIDTH_U8              0//单字节I2C寄存器地址
#define OPTADDWIDTH_U16             1//2字节I2C寄存器地址
#define MAX_I2C_RETRY_COUNT         1//5


__IO int i2c_read(__IO int Port, __IO uint8_t chDeviceAdd, __IO uint8_t chOptAddWidth, __IO uint16_t hwOptAdd, __IO uint16_t hwOptLength, __IO uint8_t *pchBuff);

__IO int i2c_write(__IO int Port, __IO uint8_t chDeviceAdd, __IO uint8_t chOptAddWidth, __IO uint16_t hwOptAdd, __IO uint16_t hwOptLength, __IO uint8_t *pchBuff);

//设置I2C收发的延时等待时间
void SetI2C_Clock(int newclock);

#ifdef SYSCLK_FREQ_72MHz   
    #define I2C_DELAY_HOLD              80
#endif
#ifdef  SYSCLK_FREQ_240MHz
    #ifdef GUI_CODE//gui运行在非零等待区，故此延时数据
        #define I2C_DELAY_HOLD              200
    #else//gcc 是零等待FLASH，故需要更多延时
        #define I2C_DELAY_HOLD              400
    #endif
#endif




#endif /* CONTROL_PORT_AI_H_ */
#endif