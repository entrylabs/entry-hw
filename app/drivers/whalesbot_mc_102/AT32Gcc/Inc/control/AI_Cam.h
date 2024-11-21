
/*
初始化图像模块。，黑底白线，白线阈值，道路宽度，巡线基准1为最低端线，依次向上
chPort：默认2（图像模块端口编号2~11）
lane_color：默认0（白底黑线），1（黑底白线）
imgValue：默认190，黑白线阈值0~255
lane_width:默认280，车道宽度.
lane:默认1。基准线，1（下红线)，2(中间红线)，3（上红线）
*/
void Init_lane(int chPort,int lane_color,int imgValue,int lane_width,int lane);

/*
读取图像模块全部数据
chPort：图像模块端口编号2~11
*/
void get_AI_lane_value(int chPort);


/*
AI寻路到路口
k:0(看到第二个人形横道停，默认),1(看到第一个人形横道停)
s:速度，默认45
t:时间默认0，（k为1时不起作用）为看到人行横道时再向前走t秒
*/
void patr_road1(int  k,int  s, float t);  

/*
转弯
a：偏移值，默认为0
dj_a：左电机速度，默认0
dj_b：右电机速度，默认为0
*/
void patr_turn1( int a,int dj_a,int dj_b);

/*
AI巡路计时
s：速度，默认45
t：实际，默认0
*/
void patr_time1(int  s, float t);

/*
AI寻路
s:速度，默认45
*/
void patr_XL(int s);


/*
AI寻路到路口
k:0(看到第二个人形横道停，默认),1(看到第一个人形横道停)
s:速度，默认45
t:时间默认0，（k为1时不起作用）为看到人行横道时再向前走t秒
*/
void patr_road2(int  k,int  s, float t);  

/*
转弯
a：偏移值，默认为0
dj_a：左电机速度，默认0
dj_b：右电机速度，默认为0
*/
void patr_turn2( int a,int dj_a,int dj_b);

/*
AI巡路计时
s：速度，默认45
t：实际，默认0
*/
void patr_time2(int  s, float t);

/*
AI巡线
s：速度，默认45
t：实际，默认0
*/
void patr_XX(int s);




/*
获取AI图像模块寄存器数据
chPort：端口编号（2~11）
reg_addr：图像模块寄存器地址
*/
int AI_get(int chPort, int reg_addr);


/*
设置AI图像模块寄存器数据
chPort：端口编号（2~11）
reg_addr：图像模块寄存器地址
data:需要存储到图像模块对应寄存器数据
*/
void AI_set(int chPort, int reg_addr, int data);



/*
图像识别
chPort：端口编号（1~10）
*/
int get_AI_image(int chPort);

#define get_image get_AI_image
/*
声音识别，暂不支持
chPort：端口编号（1~10）
*/
int get_AI_voice(int chPort);

/*********************************************************/
/*                 图像识别-图像ID定义                      */
/*********************************************************/
typedef enum AI_Image_ID
{
    AI_image_0 = 32,	//0
    AI_image_1 = 16,	//1
    AI_image_2 = 28,	//2
    AI_image_3 = 26,	//3
    AI_image_4 = 9,	//4
    AI_image_5 = 8,	//5
    AI_image_6 = 24,	//6
    AI_image_7 = 23,	//7
    AI_image_8 = 7,	//8
    AI_image_9 = 15,	//9
    AI_image_up        = 30,	//上
    AI_image_down      = 5,	//下
    AI_image_rabbit    = 21,	//兔子
    AI_image_right     = 22,	//右
    AI_image_turnright = 31,	//右转
    AI_image_goat      = 10,	//山羊
    AI_image_left      = 12,	//左
    AI_image_turnleft  = 29,	//左转
    AI_image_peach     = 18,	//桃子
    AI_image_pear      = 19,	//梨
    AI_image_cherry    = 2,	//樱桃
    AI_image_cattle    = 17,	//牛
    AI_image_dog       = 4,	//狗
    AI_image_pig       = 20,	//猪
    AI_image_monkey    = 13,	//猴子
    AI_image_tiger     = 27,	//老虎
    AI_image_mouse     = 14,	//老鼠
    AI_image_apple     = 0,	//苹果
    AI_image_snake     = 25,	//蛇
    AI_image_banana    = 1,	//香蕉
    AI_image_horse     = 11,	//马
    AI_image_chicken   = 3,	//鸡
    AI_image_dragon    = 6		//龙
}AI_Image_ID;



/*********************************************************/
/*                 声音识别-声音ID定义                      */
/*********************************************************/
typedef enum AI_Voice_ID
{
    AI_voice_stop      = 9,	//停止
    AI_voice_forward   = 1,	//前进
    AI_voice_turnright = 4,	//右转
    AI_voice_backward  = 2,	//后退
    AI_voice_startup   = 8,	//启动
    AI_voice_singsong  = 5,	//唱首歌
    AI_voice_turnleft  = 3,	//左转
    AI_voice_start     = 7,	//开始
    AI_voice_lightoff  = 12,	//请关灯
    AI_voice_lighton   = 11,	//请开灯
    AI_voice_dance     = 6,		//跳支舞
    AI_voice_turnaround  = 1		//转圈
}AI_Voice_ID;