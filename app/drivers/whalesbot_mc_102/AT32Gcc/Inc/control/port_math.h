/*
 * port_math.H
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 *      说明：scratch接口的数学相关函数
 */
#ifndef CONTROL_PORT_MATH_H_
#define CONTROL_PORT_MATH_H_

#ifdef CONTROL_PORT_MATH_H_


//限幅,限制浮点变量amt在lwo~high之间
float constrainf(float amt, float low, float high);

//限幅,限制政协变量amt在lwo~high之间
int constrain(int amt, int low, int high);


//整形变量的取绝对值
int abs(int value);

//4舍5入
float math_round(float value);

//随机数
int random_number(int min, int max);


//取余数
int math_modulus(int valuea,int valueb);

//绝对值
float math_abs(float value);


//向下取整
float math_floor(float value);

//向上取整
float math_ceiling(float value);

//平方根
float math_sqrt(float value);

//sin (n:角度)
float math_sin(float value);

//cos (n:角度)
float math_cos(float value);

//tan (n:角度) 
float math_tan(float value);


//asin (返回值：角度)
float math_asin(float value);


//acos  (返回值：角度) 
float math_acos(float value);


//atan  (返回值：角度) 
float math_atan(float value);

//ln (以e 为底 n 的对数)
float math_ln(float value);

//log (以10 为底 n 的对数) 
float math_log(float value);

//e ^ (e 的 n 次方 ) 
float math_exp(float value);

//10 ^ (10 的 n 次方 )
float math_pow10(float value);


#endif
#endif