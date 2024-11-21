/*
 * beep_wav.h
 *
 *  Created on: 2022年12月26日
 *      Author: Administrator
 */

#ifndef CONTROL_BEEP_WAV_H_
#define CONTROL_BEEP_WAV_H_

#ifdef CONTROL_BEEP_WAV_H_

//声音文件在SPI FLASH中的起始地址和长度
//通过pyVoice2Bin.py生成此地址清单
extern const uint32_t SoundAddress[];
//声音文件列表,通过pyVoice2Bin.py生成此地址清单
/*
#define CH_CheckFail 0//检测失败.wav
#define CH_CheckSuccess 1//检测成功.wav
#define CH_PushOneKey 2//请单击按键.wav
#define SOUND_INDEX_READ_NUMBER 3//读数为.wav
#define SOUND_INDEX_TICK 4//滴.wav
#define SOUND_INDEX_BRAKE 5//刹车.wav
#define SOUND_INDEX_TANK 6//坦克.wav
#define SOUND_INDEX_FIRE 7//开炮.wav
#define SOUND_INDEX_CAR_START 8//汽车发动.wav
#define SOUND_INDEX_CAR_HORN 9//汽车喇叭.wav
#define SOUND_INDEX_HELICOPTER 10//直升机.wav
#define SOUND_INDEX_COCK 11//公鸡.wav
#define SOUND_INDEX_DINOSAUR 12//恐龙.wav
#define SOUND_INDEX_COW 13//牛.wav
#define SOUND_INDEX_DOG 14//狗.wav
#define SOUND_INDEX_CAT 15//猫.wav
#define SOUND_INDEX_SHEEP 16//羊咩.wav
#define SOUND_INDEX_HORSE 17//马-奔跑.wav
#define SOUND_INDEX_BIRD 18//鸟.wav
#define SOUND_INDEX_DUCK 19//鸭.wav
#define CH_PowerOn 20//你好,小鲸.wav
#define SOUND_INDEX_WHISTLE 21//口哨.wav
#define SOUND_INDEX_WOW 22//哇呜.wav
#define SOUND_INDEX_LAUGHT 23//大笑.wav
#define SOUND_INDEX_HEART_BEAT 24//心跳.wav
#define SOUND_INDEX_HELLO 25//你好.wav
#define SOUND_INDEX_GOOD_BYE 26//再见.wav
#define SOUND_INDEX_WELCOME 27//欢迎.wav
#define SOUND_INDEX_PLEASE_TAKE_CARE 28//请多关照.wav
#define SOUND_INDEX_THANK_YOU 29//谢谢.wav
#define SOUND_INDEX_NUMBER_0 30//0.wav
#define SOUND_INDEX_NUMBER_1 31//1.wav
#define SOUND_INDEX_NUMBER_10 32//10.wav
#define SOUND_INDEX_NUMBER_2 33//2.wav
#define SOUND_INDEX_NUMBER_3 34//3.wav
#define SOUND_INDEX_NUMBER_4 35//4.wav
#define SOUND_INDEX_NUMBER_5 36//5.wav
#define SOUND_INDEX_NUMBER_6 37//6.wav
#define SOUND_INDEX_NUMBER_7 38//7.wav
#define SOUND_INDEX_NUMBER_8 39//8.wav
#define SOUND_INDEX_NUMBER_9 40//9.wav
#define SOUND_INDEX_PIANO_KEY0 41//gangqin_p0.wav
#define SOUND_INDEX_PIANO_KEY1 42//gangqin_p1.wav
#define SOUND_INDEX_PIANO_KEY2 43//gangqin_p2.wav
#define SOUND_INDEX_PIANO_KEY3 44//gangqin_p3.wav
#define SOUND_INDEX_PIANO_KEY4 45//gangqin_p4.wav
#define SOUND_INDEX_PIANO_KEY5 46//gangqin_p5.wav
#define SOUND_INDEX_PIANO_KEY6 47//gangqin_p6.wav
#define SOUND_INDEX_PIANO_KEY7 48//gangqin_p7.wav
*/
#define SOUND_Cancel3 0//Cancel3.wav
#define SOUND_Enter3 1//Enter3.wav
#define SOUND_KEY3 2//KEY3.wav
#define SOUND_KEY4 3//KEY4.wav
#define CH_CheckFail 4//检测失败.wav
#define CH_CheckSuccess 5//检测成功.wav
#define CH_PushOneKey 6//请单击按键.wav
#define SOUND_INDEX_READ_NUMBER 7//读数为.wav
#define SOUND_INDEX_TICK 8//滴.wav
#define SOUND_INDEX_BRAKE 9//刹车.wav
#define SOUND_INDEX_TANK 10//坦克.wav
#define SOUND_INDEX_FIRE 11//开炮.wav
#define SOUND_INDEX_CAR_START 12//汽车发动.wav
#define SOUND_INDEX_CAR_HORN 13//汽车喇叭.wav
#define SOUND_INDEX_HELICOPTER 14//直升机.wav
#define SOUND_INDEX_COCK 15//公鸡.wav
#define SOUND_INDEX_DINOSAUR 16//恐龙.wav
#define SOUND_INDEX_COW 17//牛.wav
#define SOUND_INDEX_DOG 18//狗.wav
#define SOUND_INDEX_CAT 19//猫.wav
#define SOUND_INDEX_SHEEP 20//羊咩.wav
#define SOUND_INDEX_HORSE 21//马-奔跑.wav
#define SOUND_INDEX_BIRD 22//鸟.wav
#define SOUND_INDEX_DUCK 23//鸭.wav
#define CH_PowerOn 24//你好,小鲸.wav
#define SOUND_INDEX_WHISTLE 25//口哨.wav
#define SOUND_INDEX_WOW 26//哇呜.wav
#define SOUND_INDEX_LAUGHT 27//大笑.wav
#define SOUND_INDEX_HEART_BEAT 28//心跳.wav
#define SOUND_INDEX_HELLO 29//你好.wav
#define SOUND_INDEX_GOOD_BYE 30//再见.wav
#define SOUND_INDEX_WELCOME 31//欢迎.wav
#define SOUND_INDEX_PLEASE_TAKE_CARE 32//请多关照.wav
#define SOUND_INDEX_THANK_YOU 33//谢谢.wav
#define SOUND_INDEX_NUMBER_0 34//0.wav
#define SOUND_INDEX_NUMBER_1 35//1.wav
#define SOUND_INDEX_NUMBER_10 36//10.wav
#define SOUND_INDEX_NUMBER_2 37//2.wav
#define SOUND_INDEX_NUMBER_3 38//3.wav
#define SOUND_INDEX_NUMBER_4 39//4.wav
#define SOUND_INDEX_NUMBER_5 40//5.wav
#define SOUND_INDEX_NUMBER_6 41//6.wav
#define SOUND_INDEX_NUMBER_7 42//7.wav
#define SOUND_INDEX_NUMBER_8 43//8.wav
#define SOUND_INDEX_NUMBER_9 44//9.wav
#define SOUND_INDEX_PIANO_KEY0 45//gangqin_p0.wav
#define SOUND_INDEX_PIANO_KEY1 46//gangqin_p1.wav
#define SOUND_INDEX_PIANO_KEY2 47//gangqin_p2.wav
#define SOUND_INDEX_PIANO_KEY3 48//gangqin_p3.wav
#define SOUND_INDEX_PIANO_KEY4 49//gangqin_p4.wav
#define SOUND_INDEX_PIANO_KEY5 50//gangqin_p5.wav
#define SOUND_INDEX_PIANO_KEY6 51//gangqin_p6.wav
#define SOUND_INDEX_PIANO_KEY7 52//gangqin_p7.wav

//和老版本scratch兼容编号
#define sound_hi            SOUND_INDEX_HELLO    //你好
#define sound_welcome       SOUND_INDEX_WELCOME    //欢迎
#define sound_thanks        SOUND_INDEX_THANK_YOU    //谢谢
#define sound_concerned     SOUND_INDEX_PLEASE_TAKE_CARE    //请多关照
#define sound_bye           SOUND_INDEX_GOOD_BYE    //再见
#define sound_duck          SOUND_INDEX_DUCK    //鸭
#define sound_bird          SOUND_INDEX_BIRD    //鸟
#define sound_cat           SOUND_INDEX_CAT  	//猫
#define sound_dog           SOUND_INDEX_DOG   	//狗
#define sound_cattle        SOUND_INDEX_COW   //牛
#define sound_cock          SOUND_INDEX_COCK   //公鸡
#define sound_airplane      SOUND_INDEX_HELICOPTER   //飞机
#define sound_horn          SOUND_INDEX_CAR_HORN   //汽车喇叭
#define sound_heartbeat     SOUND_INDEX_HEART_BEAT   //心跳
#define sound_laugh         SOUND_INDEX_LAUGHT   //大笑
#define sound_wow           SOUND_INDEX_WOW   //哇呜
#define sound_whistling     SOUND_INDEX_WHISTLE   //口哨
#define sound_piano_do      SOUND_INDEX_PIANO_KEY0   //钢琴1
#define sound_piano_re      SOUND_INDEX_PIANO_KEY1   //钢琴2
#define sound_piano_mi      SOUND_INDEX_PIANO_KEY2   //钢琴3
#define sound_piano_fa      SOUND_INDEX_PIANO_KEY3   //钢琴4
#define sound_piano_so      SOUND_INDEX_PIANO_KEY4   //钢琴5
#define sound_piano_la      SOUND_INDEX_PIANO_KEY5   //钢琴6
#define sound_piano_si      SOUND_INDEX_PIANO_KEY6   //钢琴7
#define sound_piano_DO      SOUND_INDEX_PIANO_KEY7   //钢琴8
#define sound_press_key     SOUND_INDEX_TICK   //按键音
//TODO:添加英文的声音
#define sound_hi_en 		SOUND_INDEX_HELLO    //你好
#define sound_welcome_en	SOUND_INDEX_WELCOME    //欢迎
#define sound_concerned_en	SOUND_INDEX_PLEASE_TAKE_CARE//请多关照
#define sound_thanks_en		SOUND_INDEX_THANK_YOU    //谢谢
#define sound_bye_en		SOUND_INDEX_GOOD_BYE     //再见










//DAC播放硬件相关，勿动
#define DAC_PIN         GPIO_Pin_5
#define DAC_PORT        GPIOA
#define DAC_CHANNEL     DAC_Channel_2
#define DAC_DELAY_TIM   TIM7
#define DAC_SAMPLERATE  8000//WAV文件采样率
#define WAV_LEN_OFFSET  40//WAV数据从第44字节开始
#define WAV_DATA_OFFSET 44//WAV数据从第44字节开始
#define WAV_SPI_ADDRESS_START 3*1024*1024//在SPI内部，声音文件存储在第3M的位置






struct WAV_HEADER
{
	//RIFF_HEADER
	char szRiffID[4];   // 'R','I','F','F'
	uint32_t dwRiffSize;
	char szRiffFormat[4]; // 'W','A','V','E'
	//WAVE_FORMAT
	char   szFmtID[4]; // 'f','m','t',' '
	uint32_t   dwFmtSize;
	uint16_t   AudioFormat;//音频格式
	uint16_t   NumChannels;//声道数
	uint32_t   SampleRate;//采样率
	uint32_t   ByteRate;//每秒数据字节数
	uint16_t   BlockAlign;//数据块对齐
	uint16_t   BitsPerSample;//采样位数
	//DATA_BLOCK
	char szDataID[4]; // 'd','a','t','a'
	uint32_t dwDataSize;//数据大小
};






//用DAC的方式播放WAV声音
void InitBeepWav(void);

/*
播放指定编号的声音
soundindex：SOUND_INDEX_READ_NUMBER.....
*/
void play_sound(__IO int soundindex);

//停止当前动作播放
void StopSound();

//兼容PAD发出的 77 68协议的声音编号，需要对应转换为本机声音编号
int getBTSoundIndex(int btindex);

//录音
void recorder(int Port);

//播放录音
void play_record(void);

//读数
void read_number(int value);


#define SOUND_VOL_DEFAULT 	2//常规情况下，音量
#define SOUND_VOL_USB 		6//当插入USB情况下，为了保证USB驱动可靠性，降低音量到6
//设置声音音量，1(最大)，2，3，4，5，6，7，8，9，10（最小)
void SetSoundVol(int vol);

//获取声音播放状态
int getSoundState(void);



#endif /* CONTROL_BEEP_WAV_H_ */
#endif /* CONTROL_BEEP_WAV_H_ */
