#ifndef EXTERNLIB_PLAY_PAGE_H_
#define EXTERNLIB_PLAY_PAGE_H_

#ifdef EXTERNLIB_PLAY_PAGE_H_

#define     MOTOR_COUNT                     20  //总线上舵机总数

//动作页数据描述
struct play_page_action
{
    //page 数据
    uint16_t page;//页编号
    uint16_t nextpage;//下页编号
    uint16_t exitpage;//退出页
    uint16_t repeat;//重复次数
    uint16_t totalaction;//总的action个数
    //步骤数据
    uint16_t action;//步骤编号
    uint16_t steptime;//执行时间
    uint16_t waittime;//等待时间
    //舵机角度
    uint16_t motor_angle[MOTOR_COUNT];
};










//启动舵机动作页调试功能
void InitPageDebug(void);



/*
播放动作页
page：动作页编号，1~127
*/
void play_page(int page);

/*
退出动作页，退出后会判断是否有退出页，有退出页情况下会执行退出页。无退出页则停止
*/
int quit_page(void);

/*
停止动作页，会强行停止当前动作页执行
*/
int stop_page(void);

//批量设置舵机
void ServoaBatchSetAngle(int i_Angle[MOTOR_COUNT] ,int i_Speed[MOTOR_COUNT]);

//获取当前播放动作页编号
int getplay_page_index(void);

//获取当前动作页播放的状态
int IsPagePlaying(void);

//获取当前动作页播放的步骤编号
int getplay_page_action(void);

//获取当前动作页播放的播放的重复次数
int getplay_page_repeat(void);

//通过上位机启动伺服电机调试指令
void StartServoDebug(void);

//指示是否处于舵机调试状态
int IsServoaDebug(void);



//初始化一个10ms定时器，中断优先级1，1，进行动作页播放计算
void InitServoMotionTimer(void);

//动作页播放定时器
//进行10ms计算的定时器和中断配置
#define TIM_PLAYPAGE                         TIM5
#define TIM_PLAYPAGE_IRQN                    TIM5_IRQn
#define TIM_PLAYPAGE_IRQPreemptionPrioritn   1
#define TIM_PLAYPAGE_IRQSubPriority          1




#endif
#endif