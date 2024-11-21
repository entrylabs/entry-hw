/*
 * uart_p1.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      说明：P1串口初始化和中断处理
 */

#ifndef CONTROL_UART_P1_H_
#define CONTROL_UART_P1_H_


//编译使能
#ifdef CONTROL_UART_P1_H_




/*
UART P1  ->  UART5
TXD      ->  PC12
RXD      ->  PD2
BUAD     ->  115200
*/
#define UART_PORT1_TXD_PIN             GPIO_Pin_12
#define UART_PORT1_TXD_PORT            GPIOC

#define UART_PORT1_RXD_PIN             GPIO_Pin_2
#define UART_PORT1_RXD_PORT            GPIOD
// PC串口编号
#define UART_PORT1                     UART5
#define UART_PORT1_BUAD                115200
//PC串口IRQ通道
#define UART_PORT1_NVICCH              UART5_IRQn
//PC串口中断优先级,最高
#define UART_PORT1_IRQ_PRIORITY        1
#define UART_PORT1_IRQ_SUBPRIORITY     1

#define UART_PORT1_PRINTBUFFERLEN      196//uart pc每次最多可打印的数据长度

//初始化UART_PC串口
void InitUart_Port1(void);


//PC串口收到1个字节的中断回调函数
void UartPort1Rx_CallBack(void);

//设置PC串口接收回调
void setUartPort1_RxHandle(FunType RxHandle);

//设置PC串口发送回调，当发送完一个数据后，回调该函数
void setUartPotrt1_TxHandle(FunType TxHandle);



//PC串口发送数据
void UartPort1_Sendbyte(uint8_t data);

//PC串口发送数据len指定的字节数据
void UartPort1_Sendbytes(uint8_t *data,int len);



#endif
#endif


