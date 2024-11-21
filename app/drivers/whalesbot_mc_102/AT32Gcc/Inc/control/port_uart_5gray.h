/*
 * port_i2c_sensor.H
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 *      说明：i2c端口操作
 */
#ifndef CONTROL_PORT_UART_5GRAY_H_
#define CONTROL_PORT_UART_5GRAY_H_

#ifdef CONTROL_PORT_UART_5GRAY_H_

//5灰度类型标记
#define GRAY5_PORT_Addr  0xCC

//5灰度数据
#define GRAY_CHMAX  5 

//5灰度通道编号
#define GRAY_CH0   0//是无效通道编号
#define GRAY_CH1   1
#define GRAY_CH2   2
#define GRAY_CH3   3
#define GRAY_CH4   4
#define GRAY_CH5   5



//读取5灰度数据
//Port：P1,P2
//ch:5灰度上单个灰度通道编号1~5
int get_integrated_grayscale(int Port,int ch);


#define black_line 	1
#define white_line  2
//集成灰度 检测到 (黑线，白线)
//Port：P1,P2
//ch:5灰度上单个灰度通道编号1~5
//line_type:black_line/white_line
//返回：true/false
int integrated_grayscale_detected(int port,int ch, int line_type);




//返回端口是否连接了5灰度
int Is5GrayConnect(int Port);

//清除5灰度连接标志
void Reset5GrayConnect(int Port);

//返回是否串口中断
int Is5GrayInt(int Port);



#endif
#endif