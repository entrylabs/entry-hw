/*
 * port_i2c_sensor.H
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 *      说明：i2c端口操作
 */
#ifndef CONTROL_PORT_I2C_SPL06_H_
#define CONTROL_PORT_I2C_SPL06_H_

#ifdef CONTROL_PORT_I2C_SPL06_H_





//陀螺数据结构体
struct strPressure
{
    //传感器中获取的原始RAW数据
    __IO uint32_t Pressure;
	__IO uint32_t Temperature;
    //最终输出数据
    //气压，单位PA
    __IO float Correcting_Press;
	//温度，单位摄氏度
    __IO float Correcting_Temp;
	//海拔，单位米
    __IO float Actual_Altitude;
};
extern struct strPressure myPressure;



//判断气压传感器是否连接
int IsPressureConnect(int Port);


#define PRESSURE_CH_Press       0//气压通道
#define PRESSURE_CH_Temp        1//温度通道
#define PRESSURE_CH_Altitude    2//海拔高度通道

//获取气压传感器数据
float get_pressure(int Port,int ch);

#endif
#endif

