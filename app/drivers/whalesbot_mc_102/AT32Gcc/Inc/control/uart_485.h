/*
 * uart_485.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      说明：485串口初始化和中断处理
 */

#ifndef CONTROL_UART_485_H_
#define CONTROL_UART_485_H_


//编译使能
#ifdef CONTROL_UART_485_H_




/*
UART 485  ->  USART3
TXD      ->  PD8
RXD      ->  PD9
DIR      ->  PE2
BUAD     ->  500000(500KBPS)
*/
#define UART_Port485_TXD_PIN             GPIO_Pin_8
#define UART_Port485_TXD_PORT            GPIOD

#define UART_Port485_RXD_PIN             GPIO_Pin_9
#define UART_Port485_RXD_PORT            GPIOD

#define UART_Port485_REMAP               GPIO_FullRemap_USART3

#define UART_Port485_DIR_PIN             GPIO_Pin_2
#define UART_Port485_DIR_PORT            GPIOE

// PC串口编号
#define UART_Port485                     USART3
#define UART_Port485_BUAD_500K           500000
#define UART_Port485_BUAD_1M             1000000// 500000
//PC串口IRQ通道
#define UART_Port485_NVICCH              USART3_IRQn
//PC串口中断优先级,最高
#define UART_Port485_IRQ_PRIORITY        2
#define UART_Port485_IRQ_SUBPRIORITY     2


//初始化UART_PC串口
void InitUart_Port485(int Hardware);


//PC串口收到1个字节的中断回调函数
void UartPort485Rx_CallBack(void);

//设置PC串口接收回调
void setUartPort485_RxHandle(FunType RxHandle);

//设置PC串口发送回调，当发送完一个数据后，回调该函数
void setUartPotrt1_TxHandle(FunType TxHandle);



//PC串口发送数据
void UartPort485_Sendbyte(uint8_t data);

//PC串口发送数据len指定的字节数据
void UartPort485_Sendbytes(uint8_t *data,int len);

//计算总线通信校验码
__IO  uint8_t calchecksum(__IO uint8_t *data);

#endif
#endif


