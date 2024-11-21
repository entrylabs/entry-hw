/*
 * uart_pc.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      说明：PC通信串口初始化和中断处理
 */

#ifndef CONTROL_UART_PC_H_
#define CONTROL_UART_PC_H_


//编译使能
#ifdef CONTROL_UART_PC_H_




/*
UART PC  ->  USART1
TXD      ->  PA9
RXD      ->  PA10
BUAD     ->  1000000
*/
#define UART_PC_TXD_PIN             GPIO_Pin_9
#define UART_PC_TXD_PORT            GPIOA

#define UART_PC_RXD_PIN             GPIO_Pin_10
#define UART_PC_RXD_PORT            GPIOA
// PC串口编号
#define UART_PC                     USART1
#define UART_PC_BUAD                1000000
//PC串口IRQ通道
#define UART_PC_NVICCH              USART1_IRQn
//PC串口中断优先级,最高
#define UART_PC_IRQ_PRIORITY        0
#define UART_PC_IRQ_SUBPRIORITY     0

#define UART_PC_PRINTBUFFERLEN      196//uart pc每次最多可打印的数据长度

//初始化UART_PC串口
void InitUart_PC(void);


//PC串口收到1个字节的中断回调函数
void UartPCRx_CallBack(void);

//设置PC串口接收回调
void setUartPC_RxHandle(FunType RxHandle);

//设置PC串口发送回调，当发送完一个数据后，回调该函数
void setUartPC_TxHandle(FunType TxHandle);



//PC串口发送数据
void UartPC_Sendbyte(uint8_t data);

//PC串口发送数据len指定的字节数据
void UartPC_Sendbytes(uint8_t *data,int len);


//串口发送Printf
void Printf2UartPC(char *fmt,...);



//计算PC数据包的校验码
uint8_t checksum(uint8_t *data,int len);


#endif
#endif


