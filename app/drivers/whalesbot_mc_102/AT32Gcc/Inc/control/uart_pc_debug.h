/*
 * uart_pc_debug.h
 *
 *  Created on: 2022年12月22日
 *      Author: Administrator
 */

#ifndef CONTROL_UART_PC_DEBUG_H_
#define CONTROL_UART_PC_DEBUG_H_



//串口调试功能指令
#define CMD_DEBUG_PING                 0x01
#define CMD_DEBUG_SERVO                0x02
#define CMD_DEBUG_DUMMY                0
//下载数据包长度
#define CMD_DEBUG_SEND_SIZE       FLASH_BUFF_LEN+8
#define CMD_DEBUG_REV_SIZE        FLASH_BUFF_LEN+8

//ping数据包长度
#define CMD_DEBUG_PING_SEND_SIZE       8
#define CMD_DEBUG_PING_REV_SIZE        10

#define CMD_DEBUG_PC_2_M32_HEAD0       0x55
#define CMD_DEBUG_PC_2_M32_HEAD1       0xAA
#define CMD_DEBUG_M32_2_PC_HEAD0       0x66
#define CMD_DEBUG_M32_2_PC_HEAD1       0xBB

//初始化PC串口调试功能
void InitPCDebug(void);

//PC通信串口回调，此函数响应PC通信指令，被回调到UartPC串口通信中断上
void uart_pc_debug_rx_callback(uint8_t data);

#endif /* CONTROL_UART_PC_DEBUG_H_ */
