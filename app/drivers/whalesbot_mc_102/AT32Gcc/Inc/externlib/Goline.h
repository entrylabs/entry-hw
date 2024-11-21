/*
巡线库
*/
/*********************************************************/
/*                   巡线                                 */
/*********************************************************/
#define   OneGray  0
#define   FiveGray 1


//巡线初始化 集成灰度
void patrol_integrated_initialization(int left_motor_id, int left_motor_speed, int right_motor_id, int right_motor_speed);

//巡线初始化 单灰度
void patrol_single_initialization(int left_motor_id, int left_motor_speed, int right_motor_id, int right_motor_speed, int p1, int p2, int p3, int p4, int p5);

//巡线 环境采集
void patrol_ambient_detection();

//巡线 巡线速度
void patrol_speed(int speed);

//巡线 按时巡线
#define   intersection_left    0 //左侧
#define   intersection_T       1  //T字/十字路口
#define   intersection_right   2 //右侧
void patrol_road(int intersection_type ,int speed, float time);
//巡线 按时巡线
void patrol_time(int speed, float time);


//巡线 巡线转弯
#define turn_left     0  //左侧
#define turn_center   1  //中间
#define turn_right    2 //右侧
void patrol_turn(int  turn_type, int left_speed, int right_speed);

//巡线 启动电机-时间
void start_motor_time(int left_speed, int right_speed, float time);
//启动电机-流程图使用
void motor_time(int dj_a, int dj_b, float time);


//巡线 启动电机-角度
void start_motor_angle(int left_speed, int right_speed, int angle);
void motor_ds(int dj_a, int dj_b, int ds);

//巡线 启动电机-传感器
#define compare_less_than        1
#define compare_greater_than     2
#define compare_equal            3
#define compare_not_equal        4
void start_motor_sensor(int left_speed, int right_speed, int sensor_port_id, int compare_opt, int compare_value);
void motor_sensor(int dj_a, int dj_b, int s_id, int a, int s);

//巡线 启动按钮
void patrol_button();


//麦克纳姆轮巡线初始化 集成灰度
void patrol_init_mecanum_wheel_integrated(int left_back_speed, int right_back_speed, int left_front_speed, int right_front_speed);

//麦克纳姆轮巡线初始化 单灰度
void patrol_init_mecanum_wheel_single(int left_back_speed, int right_back_speed, int left_front_speed, int right_front_speed, int p1, int p2, int p3, int p4, int p5);

//5灰度初始化-流程图使用
void patr_init(int gl_a, int gl_b, int dl, int dr, int a1, int a2, int a3, int a4, int a5, int type);

//麦克纳姆轮巡线初始化-流程图使用
void patr_Mecanum_wheel_init(int gl_a,int gl_b,int gl_c,int gl_d,int a1,int a2,int a3,int a4,int a5,int type);

//黑白检测-流程图使用
void patr_environmental_acquiment(void);

//巡线路口-流程图使用
void patr_road(int k, int s, float t);

//巡线计时-流程图使用
void patr_time(int s, float t);

//转弯-流程图使用
void patr_turn(int a, int dj_a, int dj_b);



//按钮启动-流程图使用
void patr_button();

//巡线-流程图使用
void Zx(int s, int l);

//巡线初始化 全向轮  集成灰度
void patrol_omni_wheel_integrated_init(int motorA_speed, int motorB_speed, int motorC_speed, int motorD_speed);

//巡线初始化 全向轮  单灰度
void patrol_omni_wheel_single_init(int motorA_speed, int motorB_speed, int motorC_speed, int motorD_speed, int p1, int p2, int p3, int p4, int p5);





//#endif


