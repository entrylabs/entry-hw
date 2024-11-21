/*
 * port_motor.h
 *
 *  Created on: 2023年1月4日
 *      Author: Administrator
 */

#ifndef CONTROL_PORT_MOTOR_H_
#define CONTROL_PORT_MOTOR_H_

#ifdef CONTROL_PORT_MOTOR_H_

//电机端口编号
#define PMOTOR_MAX      10//电机通道个数

#define PA              1
#define PB              2
#define PC              3
#define PD              4

//电机端口
#define MotorAll        0 //表示所有电机
#define A               PA//为兼容过去代码，PA=A等效
#define B               PB//为兼容过去代码，PB=B等效
#define C               PC//为兼容过去代码，PC=C等效
#define D               PD//为兼容过去代码，PD=D等效

//电机运行方向
#define move_forward    1
#define move_backward   2
#define move_turnleft   3
#define move_turnright  4

//返回端口码盘计数值,Port: PA,PB,PC,PD...
int getEncoder_Pos(int Port);

//返回端口码盘速度值（10ms内测量的码盘数）,Port: PA,PB,PC,PD...
int getEncoder_Speed(int Port);

//初始化电机
void InitMotor(int Hardware);

//获取电机通道个数,和硬件相关
int getMotorCount(void);

//设置开环电机功率.Port: PA,PB,PC,PD   speed(-100~100)
void set_motor_open(int Port, int speed);

//设置开环电机MOS管全部释放
void set_motor_free(int Port);

//设置电机闭环速度，Port:PA,PB,PC,PD,.... . speed：-100~100
void set_motor(__IO int Port,__IO int Speed);

/*
设置单电机以指定速度，转过指定角度
Port:PA,PB,PC,PD
speed:-100~100
angle：电机转过的角度
*/
void set_motor_angle(__IO int Port, __IO int speed,__IO int angle);

/*
设置双电机以指定速度，转过指定角度
Port1/Port2:PA,PB,PC,PD
speed1/speed2:-100~100
angle：电机转过的角度
*/
void set_dual_motor_angle(int Port1, int speed1, int Port2, int speed2, int angle);

//设置电机旋转反向，Port:PA,PB,PC,PD
void reverse_motor(__IO int Port);

//获取电机码盘数值
int motor_encoder(int Port);

//重置码盘数据
void reset_motor_encoder(int Port);

/*
移动:
move_type：前进/后退/左转/右转 move_forward,move_backward,move_turnleft,move_turnright
speed: 功率百分比 -100~100
*/
void move(int move_type, int speed);

/*
移动时间:
move_type：前进/后退/左转/右转 move_forward,move_backward,move_turnleft,move_turnright
speed: 功率百分比 -100~100
time：移动时间，单位秒
*/
void move_time(int move_type, int speed, float time);

/*
停止电机
*/
void stop_move(void);


/*
设置电机闭环速度
Port:PA,PB,PC,PD
speed：-100~100
此函数已在固件库中实现，故此处不需要声明
*/
//void set_motor(int Port,int Speed);

/*
设置双电机时间以指定时间，指定功率运行
PortA/PortB:PA,PB,PC,PD
motor1_speed/motor2_speed:-100~100
time：移动时间，单位秒
*/
void set_dual_motor_time(int PortA, int motor1_speed, int PortB, int motor2_speed, float time);


/*
关闭电机
Port:PA,PB,PC,PD，MotorAll
*/
void off_motor(int Port);

/*
设置单电机时间以指定时间，指定功率运行
Port:PA,PB,PC,PD
speed:-100~100
time：移动时间，单位秒
*/
void set_motor_time(int Port, int speed, float time);
        
#define	omni_turnright   1
#define omni_turnleft    0

//设置麦克拉姆全向轮旋转
//sel_right_left:omni_turnright/omni_turnleft向左或者向右运动
//speed:0~100
void mecanum_wheel_turn(__IO int sel_right_left,__IO int speed);

//设置麦克拉姆轮运动
//speed:0~100
//Angle：0~360
void mecanum_wheel_ctrl(__IO int speed,__IO int Angle);

//设置麦克拉姆轮运动
//全向速度speed:0~100
//全向指向角度Angle：0~360
//自旋力turnspeed:-100~100
void mecanum_wheel_ctrl_turn(__IO int speed,__IO int Angle,__IO int turnspeed);

//设置全向轮运动
//speed:0~100
//Angle：0~360
void omni_wheel_ctrl(__IO int speed,__IO int Angle);

//设置全向轮旋转
void omni_wheel_turn(int iDirection,int iSpeed);

//设置全向轮停止
void omni_wheel_stop(void);

//设置电机-高级-距离
void set_motor_ad(int channels, int distance, int ch1_speed, int ch2_speed, int ch3_speed, int ch4_speed);

struct Motortype{
	int MotorModel;        //电机的模式（开环还是闭环）
	int ReverseFlag;       //电机闭环模式下，是否反向电机输出
	// 速度闭环用户设定
	int GoalSpeed;         //用户设定的电机速度（转速rpm）
	int MovingSpeed;       //设定电机的转速
	int PresentSpeed;      //当前电机的速度rpm
	//PID计算时所使用的变量
	int SetPoint;  //目标转速值
	int Error;     //当前误差转速
	int dError;    //当前微分误差转速
	int LastError; // Error[-1]
	int PrevError; // Error[-2]
	int SumError;  // 误差累计
	int SumErrorTimeout;//堵转计时
	int SumErrorRecoverTimeout;//堵转保护恢复时间
	int BattError;//根据电池电压限制电机功率
	//最终输出功率
	int outlast;   //最终输出的电机功率
};


extern struct Motortype Motor[];//此处需要设置最多的产品线使用的电机通道数，从1开始，故0设置为空
/*
编码器
ENC_PA_A    PE4
ENC_PA_B    PE5

ENC_PB_A    PE0     
ENC_PB_B    PE1

ENC_PC_A    PE6
ENC_PC_B    PD3

ENC_PD_A    PA14    SWDCLK
ENC_PD_B    PA13    SWDIO
*/
//enc a
#define ENC_PA_A_PORT   GPIOE
#define ENC_PA_A_PIN    GPIO_Pin_4
#define ENC_PA_A_EXSRC  GPIO_PortSourceGPIOE
#define ENC_PA_A_EXPIN  GPIO_PinSource4
#define ENC_PA_A_LINE   EXTI_Line4

#define ENC_PA_B_PORT   GPIOE
#define ENC_PA_B_PIN    GPIO_Pin_5
#define ENC_PA_B_EXSRC  GPIO_PortSourceGPIOE
#define ENC_PA_B_EXPIN  GPIO_PinSource5
#define ENC_PA_B_LINE   EXTI_Line5

#define ENC_PA_A        GPIO_ReadInputDataBit(ENC_PA_A_PORT,ENC_PA_A_PIN)
#define ENC_PA_B        GPIO_ReadInputDataBit(ENC_PA_B_PORT,ENC_PA_B_PIN)

//enc b
#define ENC_PB_A_PORT   GPIOE
#define ENC_PB_A_PIN    GPIO_Pin_0
#define ENC_PB_A_EXSRC  GPIO_PortSourceGPIOE
#define ENC_PB_A_EXPIN  GPIO_PinSource0
#define ENC_PB_A_LINE   EXTI_Line0

#define ENC_PB_B_PORT   GPIOE
#define ENC_PB_B_PIN    GPIO_Pin_1
#define ENC_PB_B_EXSRC  GPIO_PortSourceGPIOE
#define ENC_PB_B_EXPIN  GPIO_PinSource1
#define ENC_PB_B_LINE   EXTI_Line1

#define ENC_PB_A        GPIO_ReadInputDataBit(ENC_PB_A_PORT,ENC_PB_A_PIN)
#define ENC_PB_B        GPIO_ReadInputDataBit(ENC_PB_B_PORT,ENC_PB_B_PIN)

//ENC B
#define ENC_PC_A_PORT   GPIOE
#define ENC_PC_A_PIN    GPIO_Pin_6
#define ENC_PC_A_EXSRC  GPIO_PortSourceGPIOE
#define ENC_PC_A_EXPIN  GPIO_PinSource6
#define ENC_PC_A_LINE   EXTI_Line6

#define ENC_PC_B_PORT   GPIOD
#define ENC_PC_B_PIN    GPIO_Pin_3
#define ENC_PC_B_EXSRC  GPIO_PortSourceGPIOD
#define ENC_PC_B_EXPIN  GPIO_PinSource3
#define ENC_PC_B_LINE   EXTI_Line3

#define ENC_PC_A        GPIO_ReadInputDataBit(ENC_PC_A_PORT,ENC_PC_A_PIN)
#define ENC_PC_B        GPIO_ReadInputDataBit(ENC_PC_B_PORT,ENC_PC_B_PIN)
//ENC D
#define ENC_PD_A_PORT   GPIOA
#define ENC_PD_A_PIN    GPIO_Pin_14
#define ENC_PD_A_EXSRC  GPIO_PortSourceGPIOA
#define ENC_PD_A_EXPIN  GPIO_PinSource14
#define ENC_PD_A_LINE   EXTI_Line14

#define ENC_PD_B_PORT   GPIOA
#define ENC_PD_B_PIN    GPIO_Pin_13
#define ENC_PD_B_EXSRC  GPIO_PortSourceGPIOA
#define ENC_PD_B_EXPIN  GPIO_PinSource13
#define ENC_PD_B_LINE   EXTI_Line13

#define ENC_PD_A        GPIO_ReadInputDataBit(ENC_PD_A_PORT,ENC_PD_A_PIN)
#define ENC_PD_B        GPIO_ReadInputDataBit(ENC_PD_B_PORT,ENC_PD_B_PIN)


//IRQN
#define ENC_PA_A_IRQn   EXTI4_IRQn
#define ENC_PA_B_IRQn   EXTI9_5_IRQn

#define ENC_PB_A_IRQn   EXTI0_IRQn
#define ENC_PB_B_IRQn   EXTI1_IRQn

#define ENC_PC_A_IRQn   EXTI9_5_IRQn
#define ENC_PC_B_IRQn   EXTI3_IRQn

#define ENC_PD_A_IRQn   EXTI15_10_IRQn
#define ENC_PD_B_IRQn   EXTI15_10_IRQn

//码盘外部中断的优先级，优先级配置较低
#define ENC_IRQPreemptionPrioritn       2
#define ENC_IRQSubPriority              2

/*
PWM_PA_1    PC6 T8C1
PWM_PA_2    PC7 T8C2

PWM_PB_1    PC8 T8C3
PWM_PB_2    PC9 T8C4

PWM_PC_1    PB6 T4C1
PWM_PC_2    PA7 T3C2   注：PB7 T4C2，当开启FSMC后，T4C2和FSMC_NAVD冲突，无法输出T4C2_PWM，,故DIG4和PWM_PC_2对调

PWM_PD_1    PB8 T4C3
PWM_PD_2    PB9 T4C4
*/
//pwm pin
#define PWM_PA_1_PORT   GPIOC
#define PWM_PA_1_PIN    GPIO_Pin_6
#define PWM_PA_2_PORT   GPIOC
#define PWM_PA_2_PIN    GPIO_Pin_7

#define PWM_PB_1_PORT   GPIOC
#define PWM_PB_1_PIN    GPIO_Pin_8    
#define PWM_PB_2_PORT   GPIOC
#define PWM_PB_2_PIN    GPIO_Pin_9

#define PWM_PC_1_PORT   GPIOB
#define PWM_PC_1_PIN    GPIO_Pin_6
#define PWM_PC_2_PORT   GPIOA
#define PWM_PC_2_PIN    GPIO_Pin_7

#define PWM_PD_1_PORT   GPIOB
#define PWM_PD_1_PIN    GPIO_Pin_8
#define PWM_PD_2_PORT   GPIOB
#define PWM_PD_2_PIN    GPIO_Pin_9



//产生PWM的定时器
#define TIM_A_B         TIM8
#define TIM_C1_D        TIM4
#define TIM_C2         	TIM3

//进行10msPID闭环计算的定时器和中断配置
#define TIM_PID                         TIM6
#define TIM_PID_IRQN                    TIM6_IRQn
#define TIM_PID_IRQPreemptionPrioritn   2
#define TIM_PID_IRQSubPriority          2

#define ENC_CENT_VAL    32768
#define ENC_CW          1   //正转
#define ENC_CCW         -1  //反转


//电机默认PID参数
#define PID_TIMES           1000//计算时，在中断中，故此处PID数据*1000后，进行整形计算
//用于速度闭环的PID参数
#define D_P                 80//150//默认80 50（硬），300（软）最慢
#define D_I                 3//10//默认3，1（硬)~50(软)  I计算时用的是1/I.I不可是0，避免堵转保护失效
#define D_D                 0//默认0

//设置电机PID参数,P:默认150 50（硬），300（软）最慢. I//默认10，1（硬)~50(软) ，避免堵转保护失效.D:默认0
void SetMotorPID(int pid_p,int pid_i,int pid_d);

#define PID_OPEN       false
#define PID_COSE       true

#define MOTOR_SPEED_PERTCENTAGE 100//设置电机转速的%Z最大数值

#define MOTOR_SUMERR_TIME           200//5ms*200=2s电机堵转超过2秒，进行速度保护
#define MOTOR_SUMERR_TIMERECOVER    400//5ms*400=4s电机恢复时间4秒
#define MOTOR_SUMERR_RUN        10//堵转时，以此功率进行开环运转，直到恢复
#define MOTOR_SUMERR_SPEED      5//当误差sum满幅时，如果电机速度小于此阈值，可认为时堵转状态
#endif /* CONTROL_PORT_MOTOR_H_ */
#endif /* CONTROL_PORT_MOTOR_H_ */
