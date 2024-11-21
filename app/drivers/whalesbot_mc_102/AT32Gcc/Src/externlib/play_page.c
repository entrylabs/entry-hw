#include "whalesbot.h"

//#ifdef GCC_CODE//此功能只在GCC或者GUI状态下，才进行编译
#ifndef BOOT_CODE



#include "page_data.h"//动作页数据记录


#define     HID_DATA_LEN                    63   //调试工具每包数据大小
#define     SUB_CMD_SYNC_SERVO   			0x50 //舵机状态同步指令
#define     SUB_CMD_SYNC_SERVOOFFSET        0x51 //舵机误差回传指令

#define     ACTION_COUNT                    8    //每个动作包含的步骤最大数
#define     PAGE_COUNT                      128  //动作页最大数

//此函数每ms中断中调用，每10ms执行1次
#define     TIME_10MS 10

const int RS485_RETRY_COUNNT = 5;//485总线重试次数

#define     PWM_SERVO_ID0 17//2个PWM舵机需要特殊处理一下
#define     PWM_SERVO_ID1 18

static int i_ID[MOTOR_COUNT] = {0};//电机ID编号
static int b_SetTorque[MOTOR_COUNT] = {0};//力矩使能
static int i_SetAngle[MOTOR_COUNT] = {-1};//默认设置角度
static int b_SetTorque_old[MOTOR_COUNT] = {0};//力矩使能
static int i_SetAngle_old[MOTOR_COUNT] = {-1};//默认设置角度
static int i_SetSpeed[MOTOR_COUNT] = {10};//默认舵机速度
static int i_GetAngle[MOTOR_COUNT] = {0};//获取舵机角度
//static int i_GetError[MOTOR_COUNT] = {0};//获取舵机错误
//static int b_SetTorque_Read[MOTOR_COUNT]={0};
static int i_HIDStepTime=0;//HID舵机角度执行的时间，如果是0则直接发送速度角度到舵机，如果>0（单位10ms）则运行舵机角度增量控制算法
//舵机增量控制算法变量
static float i_SetAngleNow[MOTOR_COUNT] = {0};//当前设置角度
static float i_SetStepNow[MOTOR_COUNT] = {0};//当前设置速度
static int i_SetSpeedNow[MOTOR_COUNT] = {0};//当前设置速度

//static int i_ReadCountDebug[MOTOR_COUNT] = {0};//
//id变更设置
static int New_Change_ID_LOCK=0;
static int Old_Change_ID = 0;
static int New_Change_ID = 0;
//舵机偏移量微调
static int ChangeOffset_ID = 0;
static int ChangeOffset_Value = 0;
static int ChangeOffset_LOCK=0;
//数据收发缓存
static /*__IO*/ uint8_t s_chCmdBuffer[128] = {0};
//static int  time_tick_10ms=0;

//上下位机通信的数据包
static __IO int revindex=0;
/*static*/  uint8_t Receive_Buffer[HID_DATA_LEN*2];
static  uint8_t Transi_Buffer[HID_DATA_LEN*2];

//伺服舵机10ms中断处理使能
static int b10msEnable = false;

//指令
static const int   CMD_FIELD_TYPE                   = 0;
static const int   CMD_FIELD_PACKET_INDEX_LOW       = 1;
static const int   CMD_FIELD_PACKET_INDEX_HIGH      = 2;
static const int   CMD_FIELD_PACKET_LENGTH          = 3;
//static const int   CMD_ACK                          = 2;
static const int   SUB_CMD_OPT                      = 3;
static const int   CMD_INSTRUCTION0                  = 0x77;//指令
static const int   CMD_INSTRUCTION1                  = 0x68;//指令

//串口通信标志
static int UartNewRevFlag = false;

//动作页播放线程
__IO static int play_page_Thread_enable=false;
__IO static int play_page_index=0;//当前需要播放的动作页编号
__IO static int play_page_action=0;//当前播放的步骤号
__IO static int play_page_repeat=0;//当前播放的次数
__IO static int stop_flag=false;//停止动作页标记
__IO static int quit_flag=false;//退出动作页标记

#define PAGE_MAX   128
__IO static int PageIndexList[PAGE_MAX];//记录动作页每个Page所在的起始位置

//舵机角度限制,正常HID协议操作人形时，无法设置超过此角度的角度，防止舵机卡住
static uint16_t i_Servo_IDMinMax[]={
//	ID	,	角度小-180-180	,	角度大-180-180	,	角度小0-1023	,	角度大0-1023	
	0	,/*	-173 	,	-173 	,*/	0 	,	0 	,
	1	,/*	-45 	,	22 	,*/			68 	,	956 	,
	2	,/*	-22 	,	45 	,*/			68 	,	956 	,
	3	,/*	-110 	,	110 	,*/		68 	,	956 	,
	4	,/*	-110 	,	110 	,*/		68 	,	956 	,
	5	,/*	-124 	,	115 	,*/		68 	,	956 	,
	6	,/*	-115 	,	124 	,*/		68 	,	956 	,
	7	,/*	-110 	,	110 	,*/		68 	,	956 	,
	8	,/*	-110 	,	110 	,*/		68 	,	956 	,
	9	,/*	-100 	,	15 	,*/			68 	,	956 	,
	10	,/*	-15 	,	100 	,*/	68 	,	956 	,
	11	,/*	-118 	,	118 	,*/	68 	,	956 	,
	12	,/*	-118 	,	118 	,*/	68 	,	956 	,
	13	,/*	-120 	,	90 	,*/		68 	,	956 	,
	14	,/*	-90 	,	120 	,*/	68 	,	956 	,
	15	,/*	-120 	,	120 	,*/	68 	,	956 	,
	16	,/*	-120 	,	120 	,*/	68 	,	956 	,
	17	,/*	-150 	,	150 	,*/	68 	,	956 	,
	18	,/*	-150 	,	150 	,*/	68 	,	956 	,
	19	,/*	-150 	,	150 	,*/	68 	,	956 	,
	20	,/*	-150 	,	150 	,*/	68 	,	956 	,
};

//舵机角度误差补偿
static int i_Servo_Offset[]={
	/*1*/		512,
	/*2*/		512,
	/*3*/		512,
	/*4*/		512,
	/*5*/		512,
	/*6*/		512,
	/*7*/		512,
	/*8*/		512,
	/*9*/		512,
	/*10*/		512,
	/*11*/		512,
	/*12*/		512,
	/*13*/		512,
	/*14*/		512,
	/*15*/		512,
	/*16*/		512,
	/*17*/		512,
	/*18*/		512,
	/*19*/		512,
	/*20*/		512,
	/*21*/		512
};

//通过上位机启动伺服电机调试指令
__IO static int IsServoDebugStart=false;

//初始化动作页调试功能的所有全局变量
static void InitServoaBatch()
{
    int id = 0;
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        i_ID[id] = id + 1;       // ID初始化
        b_SetTorque[id] = 0;     // 力矩使能
        i_SetAngle[id] = -1;     // 默认设置角度
        b_SetTorque_old[id] = 0; // 力矩使能
        i_SetAngle_old[id] = -1; // 默认设置角度
        i_SetSpeed[id] = 10;     // 默认舵机速度
        i_GetAngle[id] = 0;      // 获取舵机角度
        // 舵机增量控制算法变量
        i_SetAngleNow[id] = -1;   // 当前设置角度
        i_SetSpeedNow[id] = 1023; // 当前设置速度

        i_Servo_Offset[id] = ReadEEPROM(EE_SERVOA_0_OFFSET + id);
        if (i_Servo_Offset[id] < 400 || i_Servo_Offset[id] > 600)
            i_Servo_Offset[id] = 512;
    }
}

//判断人形所有舵机角度设置都在角度范围内
static int assert_Angle_MinMax(int id, uint16_t Angle_0_1023)
{
	//上位机下发的是0~1023，转换为角度值，和限制值比较
	if(Angle_0_1023 < i_Servo_IDMinMax[id*3+1])//超过最小设置范围
		return i_Servo_IDMinMax[id*3+1];
	if(Angle_0_1023 > i_Servo_IDMinMax[id*3+2])//大于最大设置范围
		return i_Servo_IDMinMax[id*3+2];
	return Angle_0_1023;//正常范围内数据
}

//批量设置舵机
void ServoaBatchSetAngle(int i_Angle[MOTOR_COUNT] ,int i_Speed[MOTOR_COUNT])
{
    int k = 0;
    int byteindex = 0;
    int chValidServoNumber1 = 0;
    // 总线发送头
    s_chCmdBuffer[0] = 0xff;
    s_chCmdBuffer[1] = 0xff;
    s_chCmdBuffer[2] = 0xfe;
    s_chCmdBuffer[4] = 0x83;
    s_chCmdBuffer[5] = 0x1e;
    s_chCmdBuffer[6] = 0x04;
    int i_AngleAddOffset[MOTOR_COUNT];
    for (k = 0; k < MOTOR_COUNT; k++)
    {
        i_AngleAddOffset[k] = i_Angle[k] + (i_Servo_Offset[k] - 512);
        if (i_AngleAddOffset[k] > 1023)
            i_AngleAddOffset[k] = 1023;
        if (i_AngleAddOffset[k] < 0)
            i_AngleAddOffset[k] = 0;
    }

    for (k = 0; k < MOTOR_COUNT; k++)
    {
        // 遍历舵机ID
        if (b_SetTorque[k] == true) // 如果电机使能
        {
            chValidServoNumber1++;                                     // 使能舵机的个数计数
            s_chCmdBuffer[7 + 5 * byteindex] = i_ID[k];                // 舵机ID编号
            uint16_t sendangle = (uint16_t)((int)i_AngleAddOffset[k]); // 保持舵机角度顺时针角度增加
            sendangle = 1024 - assert_Angle_MinMax(i_ID[k], sendangle);
            uint16_t sendspeed = (uint16_t)((int)i_Speed[k]);
            if (sendspeed >= 1023)
                sendspeed = 1023;
            if (sendspeed < 0)
                sendspeed = 0;
            // 当前时间的目标角度
            s_chCmdBuffer[7 + 5 * byteindex + 1] = (u8)(sendangle & 0x000000ff); //(uint16_t)((int)s_tServoSingleActionFilling[k].fPositionCurrent);
            s_chCmdBuffer[7 + 5 * byteindex + 2] = (u8)((sendangle / 256) & 0x000000ff);
            // 当前时间的速度（最大值）
            s_chCmdBuffer[7 + 5 * byteindex + 3] = (u8)(sendspeed & 0x00ff);
            s_chCmdBuffer[7 + 5 * byteindex + 4] = (u8)((sendspeed / 256) & 0x000000ff);
            byteindex++;
        }
    }
    // 数据包长度
    s_chCmdBuffer[3] = 5 * chValidServoNumber1 + 4;
    // 计算当前数据包校验码
    s_chCmdBuffer[3 + s_chCmdBuffer[3]] = calchecksum((uint8_t *)&s_chCmdBuffer);
    // 发送数据包
    UartPort485_Sendbytes(s_chCmdBuffer, s_chCmdBuffer[3] + 4);
    
}

static void SaveEEOFFSET()
{
    int id = 0;
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        if (ReadEEPROM(EE_SERVOA_0_OFFSET + id) != i_Servo_Offset[id])
            WriteEEPROM(EE_SERVOA_0_OFFSET + id, i_Servo_Offset[id]);
    }
}


//计算上下位机通信的校验码
static uint8_t hid_packet_crc(uint8_t *pchBuff, uint8_t chLength)
{
    uint8_t i = 0;
    uint8_t chCheck = 0;
    for(i = 0; i < chLength-1; i ++)
    {
        chCheck += pchBuff[i];
    }
    return ~chCheck;
}

//以下是实时运行增量算法
static void HIDServoaBatchCrtl()
{
    int id = 1;
    //int i=0;
    // 回复数据
    Transi_Buffer[CMD_FIELD_TYPE]               = CMD_INSTRUCTION0;//CMD_ACK;
    Transi_Buffer[CMD_FIELD_PACKET_INDEX_LOW]   = CMD_INSTRUCTION1;//Receive_Buffer[CMD_FIELD_PACKET_INDEX_LOW];
    Transi_Buffer[CMD_FIELD_PACKET_INDEX_HIGH]  = Receive_Buffer[CMD_FIELD_PACKET_INDEX_HIGH];
    Transi_Buffer[CMD_FIELD_PACKET_LENGTH]      = 58;//HID_DATA_LEN - 6;
    Transi_Buffer[CMD_FIELD_PACKET_LENGTH + SUB_CMD_OPT] = SUB_CMD_SYNC_SERVO; // 舵机控制指令
    // 批量控制pchDes舵机
    // 获取上位机下发的舵机使能
    // 舵机使能状态,byte @ 7,8,9,10
    uint32_t byte0_31 = Receive_Buffer[7] + (Receive_Buffer[8] << 8) + (Receive_Buffer[9] << 16) + (Receive_Buffer[10] << 24);
    // 微调0位
    ChangeOffset_ID     = Receive_Buffer[11] - 1;
    ChangeOffset_Value  = Receive_Buffer[12];
    if ((ChangeOffset_ID >= 0 && ChangeOffset_ID <= MOTOR_COUNT) &&
        (ChangeOffset_Value > 0))
    {
        i_Servo_Offset[ChangeOffset_ID] = (ChangeOffset_Value - 100) + 512;
        ChangeOffset_LOCK = 1; // 记录变更
    }
    else if (ChangeOffset_ID == 254 - 1)
    {
        if (ChangeOffset_LOCK == 1) // 记录变更
        {
            SaveEEOFFSET();
            ChangeOffset_LOCK = 0; // 新老ID恢复为0，解除变更锁定
        }
    }
    else if ((ChangeOffset_ID == 0) && (ChangeOffset_Value == 0))
    {
        ChangeOffset_LOCK = 0; // 新老ID恢复为0，解除变更锁定
    }
    b10msEnable = false ;//避免舵机10ms中断
    // 更改舵机ID
    Old_Change_ID = Receive_Buffer[15];
    New_Change_ID = Receive_Buffer[16];
    if ((Old_Change_ID != New_Change_ID) &&
        (Old_Change_ID > 0 && Old_Change_ID <= MOTOR_COUNT) &&
        (New_Change_ID > 0 && New_Change_ID <= MOTOR_COUNT) &&
        (New_Change_ID_LOCK == 0))
    {
        servo_id_change(Old_Change_ID, New_Change_ID);
        New_Change_ID_LOCK = 1; // 锁定，防止重复更新ID
    }
    else if ((Old_Change_ID == 0) && (New_Change_ID == 0))
    {
        New_Change_ID_LOCK = 0; // 新老ID恢复为0，解除ID变更锁定
    }
    // 0~7舵机使能状态
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        if ((byte0_31 & 1) == 1)
            b_SetTorque[id] = 1;
        else
            b_SetTorque[id] = 0;
        byte0_31 = byte0_31 >> 1;
        // 如果新设置和旧数据不一致，则设置电机
        if (b_SetTorque[id] != b_SetTorque_old[id])
        {
            b_SetTorque_old[id] = b_SetTorque[id];
            // 使能电机
            if (b_SetTorque[id] == 1)
            {
                // 当前舵机角度=实际物理读取角度
                i_SetAngleNow[id] = (float)i_GetAngle[id];
                // 舵机使能
                if(IsPO16_Connect(i_ID[id])==true)
                {
                    set_servo_torque(i_ID[id],true);
                }
            }
            else
            { // 去使能电机
                if(IsPO16_Connect(i_ID[id])==true)
                {
                    set_servo_torque(i_ID[id],false);
                }
            }
        }
    }
    b10msEnable = true ;//开启舵机10ms中断
    // 获取舵机设置角度数据
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        // 记录目标角度
        i_SetAngle[id] = Receive_Buffer[17 + id * 2] + Receive_Buffer[17 + id * 2 + 1] * 256;
        // 记录误差值
        // i_SetAngle[id]+=(i_Servo_Offset[id]-512);
        if (i_SetAngle[id] > 1023)
            i_SetAngle[id] = 1023;
        if (i_SetAngle[id] < 0)
            i_SetAngle[id] = 0;
    }
    // 步骤执行时间
    i_HIDStepTime = (Receive_Buffer[13] + Receive_Buffer[14] * 256) * 10; // 此处单位是10ms
    // 批量设置舵机角度
    if (i_HIDStepTime <= 0)
    {
        i_HIDStepTime = 1000;//给默认时间1s
    }
    if(i_HIDStepTime >= 0)
    {
        // 如果有特定执行时间，则需要进行增量控制
        // 计算角度增量
        for (id = 0; id < MOTOR_COUNT; id++)
        {
            // 每10ms的角度增量=目标角度-初始角度
            // 如果上位机更新了角度数值，则重新计算间隔
            if (b_SetTorque[id] == 1)
            {
                if (i_SetAngle_old[id] != i_SetAngle[id])
                {
                    if (i_SetAngle_old[id] <= 0)             // 上电第一次执行
                        i_SetAngle_old[id] = i_SetAngle[id]; // 避免抖动
                    i_SetStepNow[id] = fabs(((float)(i_SetAngle[id] - i_SetAngleNow[id])) / (i_HIDStepTime / 10));
                    i_SetAngle_old[id] = i_SetAngle[id];
                }
            }
            else
            {
                i_SetAngleNow[id] = (float)i_GetAngle[id];// 当前舵机角度=实际物理读取角度
            }
        }
        // 增量控制算法，则直接在10ms中断中处理：HIDServoaBatchRun
    }
    // 批量回复舵机角度
    /*__IO int angtmp = 0;
    __IO int count = 0;
    //b10msEnable = false ;//避免舵机10ms中断
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        // 重复读取，防止误读
        angtmp = 0;
        if(IsPO16_Connect(i_ID[id])==true)
        {
            for (count = 0; count < RS485_RETRY_COUNNT; count++)
            {
                // 正常情况下的舵机角度反馈
                angtmp = angle_to_servo_value(-ReadServoaAngle(i_ID[id])); // 舵机当前角度,ID起始从1开始
                i_GetError[id] = 0;
                if (angtmp > 0)
                {
                    // 当前物理角度记录，保持舵机角度顺时针角度增加
                    i_GetAngle[id]=angtmp;
                    //i_GetError[id] = PO16_ReadStusError(i_ID[id]); // 错误状态
                    break;
                }
            }
            angtmp = angtmp + (512 - i_Servo_Offset[id]);
            if (i_GetError[id] > 0) // 如果电机有故障报警
            {
                angtmp = 0x1000 + i_GetError[id]; // 正常情况下，角度数据不会超过0x3ff;
            }
        }
        Transi_Buffer[17 + id * 2] = (uint8_t)(angtmp & 0x000000ff);
        Transi_Buffer[17 + id * 2 + 1] = (uint8_t)(angtmp >> 8 & 0x000000ff);
    }*/
    __IO int angtmp = 0;
    //b10msEnable = false ;//避免舵机10ms中断
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        angtmp = i_GetAngle[id];
        Transi_Buffer[17 + id * 2] = (uint8_t)(angtmp & 0x000000ff);
        Transi_Buffer[17 + id * 2 + 1] = (uint8_t)(angtmp >> 8 & 0x000000ff);
    }    
    //b10msEnable = true ;//避免舵机10ms中断
    Transi_Buffer[HID_DATA_LEN - 1] = hid_packet_crc(Transi_Buffer, HID_DATA_LEN);
    UartPC_Sendbytes(Transi_Buffer,HID_DATA_LEN);
}


static void HIDServoaBatchCrtlOffset()
{
    int id = 1;
    // 回复数据
    Transi_Buffer[CMD_FIELD_TYPE]               = CMD_INSTRUCTION0;//CMD_ACK;
    Transi_Buffer[CMD_FIELD_PACKET_INDEX_LOW]   = CMD_INSTRUCTION1;//Receive_Buffer[CMD_FIELD_PACKET_INDEX_LOW];
    Transi_Buffer[CMD_FIELD_PACKET_INDEX_HIGH]  = Receive_Buffer[CMD_FIELD_PACKET_INDEX_HIGH];
    Transi_Buffer[CMD_FIELD_PACKET_LENGTH]      = 58;//HID_DATA_LEN - 6;
    Transi_Buffer[CMD_FIELD_PACKET_LENGTH + SUB_CMD_OPT] = SUB_CMD_SYNC_SERVOOFFSET; // 舵机控制指令
    // 批量回复舵机角度
    int angtmp = 0;
    //int count = 0;
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        // 重复读取，防止误读
        angtmp = 0;
        // 正常情况下的舵机角度反馈
        angtmp = i_Servo_Offset[id]; // 舵机当前角度,ID起始从1开始
        Transi_Buffer[17 + id * 2] = (uint8_t)(angtmp & 0x000000ff);
        Transi_Buffer[17 + id * 2 + 1] = (uint8_t)(angtmp >> 8 & 0x000000ff);
    }
    Transi_Buffer[HID_DATA_LEN - 1] = hid_packet_crc(Transi_Buffer, HID_DATA_LEN);
    UartPC_Sendbytes(Transi_Buffer,HID_DATA_LEN);
}



//当舵机HID控制运行时间不为0，则进行舵机角度增量控制
int i_SetNow[MOTOR_COUNT] = {0};//当前设置速度
static void HIDServoaBatchRun()
{
	//如果HID设置时间为0，则跳过此步骤
	if(i_HIDStepTime <= 0)
	{   return; }
	if(i_HIDStepTime >= (30*1000))//30秒动作就屏蔽
	{   return; }
	//每10ms运行1次
	//以下是实时运行增量算法
	int needsync=false;
	int id=0;
	//将当前计算角度发送给舵机，速度设置最大值
	for(id = 0;id<MOTOR_COUNT;id++)
	{
		if(i_SetAngleNow[id]<=0)
		{
			//上电初次运行，则强制=最终设置角度，避免抖动
			i_SetAngleNow[id]=(float)i_SetAngle[id];
			needsync++;
		}
		//角度增量计算
		if((int)i_SetAngleNow[id]==(int)i_SetAngle[id])
		{
			//如果当前角度目标角度相等，则不再发送角度给舵机
			i_SetAngleNow[id]=(float)i_SetAngle[id];
		}	
		else if((float)i_SetAngle[id]>i_SetAngleNow[id])
		{				
			//当电机设置角度大于当前角度
			//到位判断
			if((float)i_SetAngle[id]-i_SetAngleNow[id]<i_SetStepNow[id])
			{
				//如果最终目标角度和计算角度误差小于增量，则设置成相等
				i_SetAngleNow[id]=(float)i_SetAngle[id];	
			}
			else
			{	
				i_SetAngleNow[id]+=i_SetStepNow[id];//计算当前增量	
			}
			needsync++;//当遍历所有电机，有需要刷新角度的，则需要发送同步命令	
		}
		else if((float)i_SetAngle[id]<i_SetAngleNow[id])
		{
			//当电机设置角度小于当前角度
			//到位判断
			if(i_SetAngleNow[id]-(float)i_SetAngle[id]<i_SetStepNow[id])
			{
				//如果最终目标角度和计算角度误差小于增量，则设置成相等
				i_SetAngleNow[id]=(float)i_SetAngle[id];		
			}	
			else
			{	
				i_SetAngleNow[id]-=i_SetStepNow[id];//计算当前增量	
			}	
			needsync++;//当遍历所有电机，有需要刷新角度的，则需要发送同步命令		
		}			
	}
	if(needsync>false)//有舵机角度需要更新
	{
		//将浮点角度转换为整形角度
		for(id = 0;id<MOTOR_COUNT;id++)
		{			
			i_SetNow[id]=(int)i_SetAngleNow[id];
		}
		//将角度数据发送到舵机上
		ServoaBatchSetAngle(i_SetNow,i_SetSpeedNow);
	}
}




//每5ms获取舵机角度
__IO int NowGetID = 0;
static void HIDServoaGetAngleSend()
{
    while(true)
    {
        NowGetID = NowGetID+1;
        if( NowGetID >= MOTOR_COUNT)
        {
            NowGetID=0;
            break;
        }        
        if(IsPO16_Connect(i_ID[NowGetID])==true)
            break;
    }
    //无等待的舵机指令发送,获取舵机角度
    if(IsPO16_Connect(i_ID[NowGetID])==true)
    {
        PO16_ReadRegister_NoWait(i_ID[NowGetID], 36);
    }
}

static void HIDServoaGetAngleRev()
{
    __IO int angtmp = 0;
    if(IsPO16_Connect(i_ID[NowGetID])==true)
    {
        //接收缓存数据校验码等正确
        if(ReadServoaAngle_NoWait_OK(i_ID[NowGetID]) == true)
        {
            // 正常情况下的舵机角度反馈
            angtmp = angle_to_servo_value(-ReadServoaAngle_NoWait(i_ID[NowGetID])); // 舵机当前角度,ID起始从1开始
            if (angtmp > 0)
            {
                // 当前物理角度记录，保持舵机角度顺时针角度增加
                i_GetAngle[NowGetID]=angtmp;
            }
        }
    } 
}


__IO int revdbg0=0;
__IO int revdbg1=0;

//PC连接的串口端口上的，每次串口接收到数据后执行
static void PlayPCComCallback(uint8_t data)
{
    //响应PING下载指令
    //uart_pc_debug_rx_callback(data);
    //响应舵机调试指令
    if ((revindex == 0) && (data == CMD_INSTRUCTION0))
    {
        revdbg0= CMD_INSTRUCTION0;
        Receive_Buffer[revindex]=CMD_INSTRUCTION0;
        revindex++;
    }
    else if ((revindex == 0) && (data == CMD_DEBUG_PC_2_M32_HEAD0))//收到上位机强制PING指令，则复位控制器
    {
        Receive_Buffer[revindex]=CMD_DEBUG_PC_2_M32_HEAD0;
        revindex++;
    }
    else if ((revindex == 1) && (data == CMD_INSTRUCTION1))
    {
        revdbg1= CMD_INSTRUCTION1;
        Receive_Buffer[revindex]=CMD_INSTRUCTION1;
        revindex++;
    } 
    else if ((revindex == 1) && (data == CMD_DEBUG_PC_2_M32_HEAD1))//收到上位机强制PING指令，则复位控制器
    {
        Receive_Buffer[revindex]=CMD_DEBUG_PC_2_M32_HEAD1;
        revindex++;
        if(Receive_Buffer[0]==CMD_DEBUG_PC_2_M32_HEAD0 && Receive_Buffer[1]==CMD_DEBUG_PC_2_M32_HEAD1)
        {
            Program_Reset();
        }
        else
        {
            //数据接收错误
            Receive_Buffer[0] =0;
            Receive_Buffer[1] =0;
            revindex=0;    
        }
    }       
    else if( (revindex >1) && (revindex <= HID_DATA_LEN-1) )
    {
        Receive_Buffer[revindex]=data;
        revindex++;  
        //已经完整接收到1包数据
        if(revindex == HID_DATA_LEN)
        {
            //校验码计算核对
            if(Receive_Buffer[HID_DATA_LEN-1] == hid_packet_crc(Receive_Buffer, HID_DATA_LEN))
            {
                //校验码正确,置新收数据标记，由HIDServoaBatchCrtl_Thread线程处理串口通信回复
                UartNewRevFlag=true;
            }
            else
            {
                //校验码错误
                Receive_Buffer[0] =0;
                Receive_Buffer[1] =0;
                revindex=0;
            }
        }
    }
    else
    {
        //数据接收错误
        Receive_Buffer[0] =0;
        Receive_Buffer[1] =0;
        revindex=0;         
    }
}






//舵机协议控制线程
static void HIDServoaBatchCrtl_Thread()
{
    b10msEnable = true;//10ms舵机中断处理启动
    wait(0.05);
    //初始化舵机角度，以当前物理角度为基础
    __IO int id=0;
    __IO int count=0;
    __IO int angtmp = 0;
    //set_servo_torque(0xfe,true);//力矩使能
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        // 重复读取，防止误读
        if (IsPO16_Connect(i_ID[id]) == true)
        {
            for (count = 0; count < RS485_RETRY_COUNNT; count++)
            {
                // 正常情况下的舵机角度反馈
                angtmp = angle_to_servo_value(-ReadServoaAngle(i_ID[id])); // 舵机当前角度,ID起始从1开始//PO16_ReadRegister(i_ID[id], 36); // 舵机当前角度,ID起始从1开始
                if (angtmp > 0)
                {
                    i_SetAngleNow[id] = angtmp;
                    i_SetAngle_old[id] = angtmp;
                    i_SetAngle[id]= angtmp; // 避免抖动
                    break;
                }
            }
        }
    }
    while (true)
    {
        //串口接收到新的数据包
        if(UartNewRevFlag == true)
        {
            UartNewRevFlag=false;//清除串口接收标记
            if (Receive_Buffer[CMD_FIELD_PACKET_LENGTH + SUB_CMD_OPT] == SUB_CMD_SYNC_SERVO) // 批量控制舵机协议
            {
                ThreadSuspendAll();
                HIDServoaBatchCrtl();
                ThreadResumeAll();
            }
            else if (Receive_Buffer[CMD_FIELD_PACKET_LENGTH + SUB_CMD_OPT] == SUB_CMD_SYNC_SERVOOFFSET) // 批量控制舵机协议
            {
                HIDServoaBatchCrtlOffset();
            }
            //清除串口接收缓存数据
            Receive_Buffer[0] =0;
            revindex=0;     
        }
        
        if( IsUSBConnect() == false   //在舵机调试状态下，拔去USB线，复位
            || getKey(KEY_ESC)==true //按下ESC按钮情况下
            || getKey(KEY_ENTER) == true //按下电源按钮
        )
        {
            Program_Reset();
        }
        wait(0.001);//1ms为间隔，释放CPU给主程序
    }
    ThreadDelete();
}


//获取当前动作页的数据
static int readpage(uint16_t *data,int pageindex,int actionindex)
{
    const int page_len=sizeof(struct play_page_action)/2;//27每个step的数据长度
    int i=0;
    if(PageIndexList[pageindex] == -1)
        return false;//此编号无效，读取失败
    for(i=0;i<page_len;i++)
    {
        //page从1开始
        data[i]=page_date[page_len*(PageIndexList[pageindex]+actionindex) + i];
    }
    return true;
}

//遍历整个数据包，获取每个动作页所在的偏移位置
static void InitPageListIndex()
{
    const int page_len=sizeof(struct play_page_action)/2;//27每个step的数据长度
    const int page_datalen=sizeof(page_date)/2;//数据包长度
    const int step_count=page_datalen/page_len;//总的步骤个数
    int i=0;
    //int page_index=1;
    int pageindextmp=0;
    int pageindextmpold=0;
    //Printf("page_len=%d,page_datalen=%d,step_count=%d",page_len,page_datalen,step_count);
    //清除page index编号
    for(i=0;i<PAGE_MAX;i++)
        PageIndexList[i]=-1;
        //获取每个Page所在起始步骤编号
    for (i=0;i<step_count;i++)//总是从第一步开始
    {
        pageindextmp = page_date[page_len*i];
        if(pageindextmp != pageindextmpold)
        {
            PageIndexList[pageindextmp]=i;
        }
        pageindextmpold=pageindextmp;
    }
}






//动作页播放线程
static struct play_page_action play_page_step;
static void play_page_Thread()
{
    __IO int id=0;
    __IO int action=0;
    __IO int repeat = 0;
    b10msEnable = true;//10ms舵机中断处理启动
    while (true)
    {
        //读取动作页
        if(readpage((uint16_t*) &play_page_step  ,   play_page_index,   action) == true)
        {
            // 如果有特定执行时间，则需要进行增量控制
            // 计算角度增量
            i_HIDStepTime=play_page_step.steptime;
            //外部观察步骤编号
            play_page_action=action;
            for (id = 0; id < MOTOR_COUNT; id++)
            {
                // 每10ms的角度增量=目标角度-初始角度
                // 如果上位机更新了角度数值，则重新计算间隔
                i_SetAngle[id]=play_page_step.motor_angle[id];
                i_SetStepNow[id] = fabs(((float)(i_SetAngle[id] - i_SetAngleNow[id])) / (i_HIDStepTime / 10));
            }
            //增量控制算法，则直接在10ms中断中处理：HIDServoaBatchRun          
            //等待当前action执行完毕
            if(play_page_step.steptime > 0)
                wait(   (float)( (int)play_page_step.steptime)   /1000.0f);
            if(play_page_step.waittime > 0)
                wait(   (float)( (int)play_page_step.waittime)   /1000.0f);
            //判断退出动作页
            if(stop_flag==true)//停止动作页标记
            {
                break;
            }
            //当前动作页+action已经跳到下页
            if(action+1 >= play_page_step.totalaction  )
            {
                if(quit_flag==true)//退出动作页标记
                {
                    repeat=0;//重复次数清零
                    play_page_repeat=repeat;//外部观察重复次数
                    play_page_index = play_page_step.exitpage;//指向退出页
                }
                else
                {
                    repeat ++;
                    if(repeat >= play_page_step.repeat)//重复次数运行完毕
                    {
                        repeat=0;//重复次数清零
                        play_page_index = play_page_step.nextpage;//指向下个动作页
                        if(play_page_step.nextpage == 0)//如果下页为0，则退出动作页播放
                        {
                            break;
                        }
                    }
                    play_page_repeat=repeat;//外部观察重复次数
                }
                action=0;//步骤清零
                play_page_action=action;//外部观察步骤编号
                i_HIDStepTime=0;//避免中断中电机控制
                continue;
            }
            action=action+1;          
        }
        else
        {
            wait(0.001);
            break;
        }
        wait(0.001);
    }
    action=0;//步骤清零
    play_page_action=action;//外部观察步骤编号
    play_page_repeat=repeat;//外部观察重复次数
    i_HIDStepTime=0;//避免中断中电机控制
    play_page_Thread_enable=false;//线程结束标记
    ThreadDelete();
    wait(0.05);
}


//初始化舵机起始角度
static void InitServoAngle()
{
    InitServoaBatch();   // 初始化中间变量
    InitPageListIndex(); // 初始化PAGE index编号，方便后续程序快速遍历
    set_servo_torque(0xfe,true);//力矩使能
    // 获取所有舵机初始角度角度
    __IO int angtmp = 0;
    __IO int count = 0;
    __IO int id=0;
    //wait(1.0);
    for (id = 0; id < MOTOR_COUNT; id++)
    {
        // 重复读取，防止误读
        if (IsPO16_Connect(i_ID[id]) == true)
        {
            for (count = 0; count < RS485_RETRY_COUNNT; count++)
            {
                // 正常情况下的舵机角度反馈
                angtmp = angle_to_servo_value(-ReadServoaAngle(i_ID[id])); // 舵机当前角度,ID起始从1开始//PO16_ReadRegister(i_ID[id], 36); // 舵机当前角度,ID起始从1开始
                if (angtmp > 0)
                {
                    i_SetAngleNow[id] = angtmp;
                    b_SetTorque[id] = true; // 电机使能
                    break;
                }
            }
        }
    }
}



extern __IO uint8_t BuffeRev[128];
void RevDebug()
{
    while (true)
    {
        //调试
        /*Printf("0-3=%d,%d,%d,%d\n4-7=%d,%d,%d,%d\n8-11=%d,%d,%d,%d\nang[0]=%d,a[1]=%d\nNowGetID=%d\n",
            BuffeRev[0],BuffeRev[1],BuffeRev[2],BuffeRev[3],
            BuffeRev[4],BuffeRev[5],BuffeRev[6],BuffeRev[7],
            BuffeRev[8],BuffeRev[9],BuffeRev[10],BuffeRev[11],
            i_GetAngle[0],i_GetAngle[1],NowGetID
        );*/
        Printf("0-3=%d,%d,%d,%d\n4-7=%d,%d,%d,%d\n60-63=%d,%d,%d,%d",
            revdbg0,revdbg1,Receive_Buffer[2],Receive_Buffer[3],
            Receive_Buffer[4],Receive_Buffer[5],Receive_Buffer[6],Receive_Buffer[7],
            Receive_Buffer[60],Receive_Buffer[61],Receive_Buffer[62],Receive_Buffer[63]
        );
        wait(0.1);
    }
}


//10ms舵机处理定时器回调
__IO int Servo1MS = 0;
void TIM5_IRQHandler(void)
{
    if (TIM_GetITStatus(TIM_PLAYPAGE, TIM_IT_Update) != RESET) 
	{
        TIM_ClearITPendingBit(TIM_PLAYPAGE, TIM_IT_Update);
        Servo1MS++;
        if(Servo1MS == 4)
        {
            //第3ms的时候，进行数据发送
            if(IsServoaDebug() == true && b10msEnable == true)//10ms舵机中断处理启动
            {
                HIDServoaGetAngleSend();
            }
        }
        else if(Servo1MS == 8  && b10msEnable == true )
        {
            //第6ms的时候，进行数据接收        
            if(IsServoaDebug() == true)
            {
                HIDServoaGetAngleRev();
            }           
        }
        if(Servo1MS >= 10  && b10msEnable == true)
        {
            //伺服舵机10ms/100帧动作页计算处理
            HIDServoaBatchRun();
            Servo1MS=0;
        }
    }
}



//初始化一个10ms定时器，中断优先级1，1，进行动作页播放计算
void InitServoMotionTimer()
{
    TIM_TimeBaseInitTypeDef         TIM_TimeBaseStructure;
    NVIC_InitTypeDef   NVIC_InitStructure;
	/* Time Base configuration */
    RCC_ClocksTypeDef RCC_ClocksStatus;
	/* TIM7 clock enable */
    RCC_GetClocksFreq(&RCC_ClocksStatus);
    TIM_TimeBaseStructInit(&TIM_TimeBaseStructure);

    TIM_TimeBaseStructure.TIM_Period 				= RCC_ClocksStatus.PCLK2_Frequency / 10000;//10K=1ms
	TIM_TimeBaseStructure.TIM_Prescaler             = 10*2;//1ms
	TIM_TimeBaseStructure.TIM_CounterMode           = TIM_CounterMode_Up;
	TIM_TimeBaseStructure.TIM_ClockDivision         = 0;
	TIM_TimeBaseInit(TIM_PLAYPAGE, &TIM_TimeBaseStructure);
	/* Enable the TIM gloabal Interrupt */
	NVIC_InitStructure.NVIC_IRQChannel = TIM_PLAYPAGE_IRQN;
	NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = TIM_PLAYPAGE_IRQPreemptionPrioritn;
	NVIC_InitStructure.NVIC_IRQChannelSubPriority = TIM_PLAYPAGE_IRQSubPriority;
	NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
	NVIC_Init(&NVIC_InitStructure);
	//中断允许
	TIM_ITConfig(TIM_PLAYPAGE, TIM_IT_Update, ENABLE);	
	//计数器开启
	TIM_Cmd(TIM_PLAYPAGE, ENABLE);
}


//通过上位机启动伺服电机调试指令
void StartServoDebug()
{
    IsServoDebugStart=true;
}

//指示是否处于舵机调试状态
int IsServoaDebug()
{
    return IsServoDebugStart;
}






//启动舵机动作页调试功能,此功能对接上位机动作页调试程序，常规gcc运行程序一般不启动此函数
void InitPageDebug()
{
    wait(1.0);
    //等待上位机启动伺服电机调试指令
    while(true)
    {
        if(IsServoDebugStart == true)
            break;
        wait(0.01);
    }
    InitPO16Servo();//初始化总线舵机
    setUartPC_RxHandle((FunType)PlayPCComCallback);//上位机通信回调设置
    //play_sound(SOUND_INDEX_TICK);
    //上位机发起伺服电机调试指令
    InitServoaBatch();//初始化舵机调试参数
    ThreadStart(HIDServoaBatchCrtl_Thread);//开启舵机控制协议响应线程
    //ThreadStart(RevDebug);//开启舵机控制协议响应线程
    while (true)
    {
        wait(0.01);
    }
}






/*
播放动作页
page：动作页编号，1~127
*/
__IO int IsFirstPlayPageInit=false;
void play_page(int page)
{
    stop_flag=false;//停止动作页标记
    quit_flag=false;//退出动作页标记
    play_page_index = page;
    //如果动作页未初始化，则先初始化动作页
    if(play_page_Thread_enable == false)
    {
        play_page_Thread_enable=true;
        if(IsFirstPlayPageInit == false)//伺服电机中断只需要初始化1次
        {
            IsFirstPlayPageInit=true;
            InitServoAngle();
        }
        ThreadStart(play_page_Thread);//开启舵机动作页播放线程
        wait(0.01);
    }
    wait(0.05);//等待线程处理
}

/*
退出动作页，退出后会判断是否有退出页，有退出页情况下会执行退出页。无退出页则停止
*/
int quit_page(void)
{
    while(1)
    {
        quit_flag=true;//退出动作页标记
        wait(0.01);
        if(play_page_Thread_enable == false)
            break;
    }
    return play_page_index;
}

/*
停止动作页，会强行停止当前动作页执行
*/
int stop_page(void)
{
    while(1)
    {
        stop_flag=true;//停止动作页标记
        wait(0.01);
        if(play_page_Thread_enable == false)
            break;
    }
    return play_page_index;
}

//获取当前动作页播放的状态
int IsPagePlaying()
{
    return play_page_Thread_enable;
}


//获取当前播放动作页编号
int getplay_page_index()
{
    return play_page_index;
}

//获取当前动作页播放的步骤编号
int getplay_page_action()
{
    return play_page_action+1;//步骤编号从1开始
}

//获取当前动作页播放的播放的重复次数
int getplay_page_repeat()
{
    return play_page_repeat+1;//重复次数从1开始
}



#endif