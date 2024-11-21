/*
 * uart_p2.h
 *
 *  Created on: 2022年12月6日
 *      Author: Administrator
 *      说明：P2串口初始化和中断处理
 */

#ifndef CONTROL_UART_P2_H_
#define CONTROL_UART_P2_H_


//编译使能
#ifdef CONTROL_UART_P2_H_




/*
UART P2  ->  UART4
TXD      ->  PC10
RXD      ->  Pc11
BUAD     ->  115200
*/
#define UART_Port2_TXD_PIN             GPIO_Pin_10
#define UART_Port2_TXD_PORT            GPIOC

#define UART_Port2_RXD_PIN             GPIO_Pin_11
#define UART_Port2_RXD_PORT            GPIOC
// PC串口编号
#define UART_Port2                     UART4
#define UART_Port2_BUAD                115200
//PC串口IRQ通道
#define UART_Port2_NVICCH              UART4_IRQn
//PC串口中断优先级,最高
#define UART_Port2_IRQ_PRIORITY        1
#define UART_Port2_IRQ_SUBPRIORITY     1

#define UART_Port2_PRINTBUFFERLEN      196//uart pc每次最多可打印的数据长度

//初始化UART_PC串口
void InitUart_Port2(void);


//PC串口收到1个字节的中断回调函数
void UartPort2Rx_CallBack(void);

//设置PC串口接收回调
void setUartPort2_RxHandle(FunType RxHandle);

//设置PC串口发送回调，当发送完一个数据后，回调该函数
void setUartPotrt1_TxHandle(FunType TxHandle);



//PC串口发送数据
void UartPort2_Sendbyte(uint8_t data);

//PC串口发送数据len指定的字节数据
void UartPort2_Sendbytes(uint8_t *data,int len);



#endif
#endif


