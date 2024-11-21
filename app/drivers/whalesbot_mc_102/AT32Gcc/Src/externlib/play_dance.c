#include "whalesbot.h"

#ifdef GCC_CODE//此功能只在GCC状态下，才进行编译

#include "dance_data.h"//舞蹈动作位置

/*
1.将Scratch编译的LD文件，放开FLASH大小到512K
2.升级UPDATE.BIN到1.3.1（放开下载程序大小只有256k的限制）
3.dance_data.h放到编译目录下
*/

//舞蹈文件数据，来自dance_data.h
#define Dance_MOTOR_COUNT   18 //电机个数
static const int RGB_COUNT   = 3; //灯光个数
static uint8_t s_chCmdBuffer[128] = {0};




static int PlayDance(int frame_index,uint16_t defaultsped)
{
    __IO int i=0;
    __IO int id=0;
    __IO uint16_t sendangle= 0;//舵机角度
    __IO uint16_t sendspeed= defaultsped;//舵机速度
    __IO int startindex=frame_index*(Dance_MOTOR_COUNT +RGB_COUNT);//本帧所在数据起始位置
    int chValidServoNumber1 = 0;
    //int chValidServoNumber1=0;
    //ThreadSuspendAll();
    if(frame_index >= sizeof(dance_data)/2/(Dance_MOTOR_COUNT +RGB_COUNT)-1)
    {
        return 0;//播放完毕
    }
    //if(frame_index>0)
    //{
        //Printf2UartPC("frame_index=%d\n",frame_index);
    //}
    // 总线发送头
    //ThreadSuspendAll();
    s_chCmdBuffer[0] = 0xff;
    s_chCmdBuffer[1] = 0xff;
    s_chCmdBuffer[2] = 0xfe;
    s_chCmdBuffer[4] = 0x83;
    s_chCmdBuffer[5] = 0x1e;
    s_chCmdBuffer[6] = 0x04;
	for(i = 0; i < Dance_MOTOR_COUNT; i ++) 
	{        
        id=id+1;
        chValidServoNumber1++;
        //if(frame_index>0)
        //{
            //Printf2UartPC("%d,",dance_data[startindex + i]);
        //}
        Printf("S%d=%d",0,dance_data[startindex + 0]);
        //获取动作角度
        s_chCmdBuffer[7 + 5 * i] = id;                // 舵机ID编号
        sendangle = dance_data[startindex + i]; // 保持舵机角度顺时针角度增加
        sendangle = 1024 - sendangle;
        
        // 当前时间的目标角度
        s_chCmdBuffer[7 + 5 * i + 1] = (uint8_t)(sendangle & 0x000000ff); //(uint16_t)((int)s_tServoSingleActionFilling[k].fPositionCurrent);
        s_chCmdBuffer[7 + 5 * i + 2] = (uint8_t)((sendangle / 256) & 0x000000ff);
        // 当前时间的速度（最大值）
        s_chCmdBuffer[7 + 5 * i + 3] = (uint8_t)(sendspeed & 0x00ff);
        s_chCmdBuffer[7 + 5 * i + 4] = (uint8_t)((sendspeed / 256) & 0x000000ff);
    }
    // 数据包长度
    s_chCmdBuffer[3] = 5 * chValidServoNumber1 + 4;
    // 计算当前数据包校验码
    s_chCmdBuffer[3 + s_chCmdBuffer[3]] = calchecksum((uint8_t *)&s_chCmdBuffer);
    // 发送数据包
    UartPort485_Sendbytes(s_chCmdBuffer, s_chCmdBuffer[3] + 4);
    UartPC_Sendbytes(s_chCmdBuffer, s_chCmdBuffer[3] + 4);
    //ThreadResumeAll();
    return 1;
}


//调用此函数进行舞蹈动作的播放
void play_dance()
{
    //uint8_t chstate=0;
    __IO int frameindex=0;
    //play_sound(sound_concerned);
	PO16_WriteRegister(0xfe, 19, 60); //P
    PO16_WriteRegister(0xfe, 24, 1); //力矩使能
    play_sound(sound_hi);
	reset_timer();


    while(1)
    {
        //reset_timer();
        //显示帧号
        Printf("Dance\n-Frame=%d,%.2f\n",frameindex,seconds());
        //播放
        /*if(PlayDance(frameindex,1023)==0)
            break;//播放完毕*/
        PlayDance(frameindex,1023);
        frameindex++;

        if (frameindex >= 2)
            frameindex=0;
        wait(0.01);
    }



    while(true)
    {    
		reset_timer();
        //2秒恢复初始动作
        while(1)
        {
            PlayDance(0,100);//慢速的播放动作0,初始动作
            wait(0.03);
            if(seconds() > 2.0)
                break;
        }
        //等待按键按下
        wait_keyup(KEY_LEFT);
        wait(1.0);
        frameindex=0;
        while(1)
        {
            //reset_timer();
            //显示帧号
            Printf("Dance\n-Frame=%d,%.2f\n",frameindex,seconds());
            //播放
            /*if(PlayDance(frameindex,1023)==0)
                break;//播放完毕*/
            PlayDance(frameindex,1023);
            frameindex++;

            if (frameindex >= 2)
                frameindex=0;
            //等待指定的帧间隔
            /*while (true)
            {
                if(seconds() > (float)((int)interval)/1000.0f)
                    break;
                wait(0.001);
            }*/
            //wait(0.032);
            wait(2.0);
            //等待433或者蓝牙发送启动舞蹈指令
            if(getKey(KEY_ENTER)== true)
                break;
        }
        play_sound(sound_bye);
        wait(1.0);
    }
}





#endif