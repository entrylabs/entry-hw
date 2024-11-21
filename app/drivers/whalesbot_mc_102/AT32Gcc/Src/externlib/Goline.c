#include "whalesbot.h"
//此功能只在用SCRATCH或流程图和C编辑状态下（GCC状态下），才进行编译
//修改此文件和Goline.h文件，然后通过流程图/Scratch/C代码下载，可改变相关功能
#ifdef GCC_CODE

//巡线模块使用到的全局变量
//增加__IO static:避免编译器异常优化，避免本模块全局变量和其他c文件中的全局变量重名
__IO static int Pow_a = 0, Pow_b = 0,Pow_c = 0, Pow_d = 0;
__IO static int MA=0,MB=0,MC=0,MD=0;
__IO static int Hb1 = 0, Hb2 = 0, Hb3 = 0, Hb4 = 0, Hb5 = 0;
__IO static int Hb6 = 0, Hb7 = 0, Hb8 = 0, Hb9 = 0, Hb10 = 0;
__IO static int Cz1 = 0, Cz2 = 0, Cz3 = 0, Cz4 = 0, Cz5 = 0;
__IO static int Cz_2 = 0, Cz_4 = 0;
__IO static int A21 = 0, A31 = 0, A41 = 0;
__IO static int B2 = 0, B3 = 0, B4 = 0;
__IO static int flag = 0;
__IO static int flag1 = 0;
__IO static int flag2 = 0;
__IO static int js = 0;
__IO static int Qd = 0;
__IO static int DCL = 0, DCR = 0;
__IO static int A1 = 5, A2 = 4, A3 = 3, A4 = 2, A5 = 1;
__IO static int GrayType;
__IO static int Port = P1;
__IO static int wheel=0;
__IO static int SmType=0;
//__IO static int wh
/*
static void Debug(int line)
{
    Printf2UartPC("Line=%d",line);
}
*/

static int get_Gray(int idx)
{
    return get_integrated_grayscale(Port, idx);
}

static int JY_AI(int Channel)
{
    return getAI(Channel);
}


void patr_environmental_acquiment(void)
{
    int i = 0;
    int hb1 = 0;
    int hb2 = 0;
    int hb3 = 0;
    int hb4 = 0;
    int hb5 = 0;
    int hb6 = 0;
    int hb7 = 0;
    int hb8 = 0;
    int hb9 = 0;
    int hb10 = 0;
    //Debug(__LINE__);
    wait(0.01);
    //Debug(__LINE__);
    enterkey_exitprogram(false);//指示102控制器enter按钮是否退出程序，此功能在巡线检测黑白线时使用
    Printf("Check parameter\nvalues of gray\n1.YES>Enter key\n2.NO>L/R/ESC key");
    while (true)
    {
        if (getKey(KEY_ESC) == true)
        {
            wait_keyup(KEY_ESC);
            Program_Run(PROGRAM_GUI);
        }
        if (getKey(KEY_LEFT) == true)
        {
            wait_keyup(KEY_LEFT);
            Program_Run(PROGRAM_GUI);
        }
        if (getKey(KEY_RIGHT) == true)
        {
            wait_keyup(KEY_RIGHT);
            Program_Run(PROGRAM_GUI);
        }        
        if (getKey(KEY_ENTER) == true)
        {
            wait_keyup(KEY_ENTER);
            break; // 开始
        }   
    }
    //Debug(__LINE__);
    wait(0.5);
    Printf("Get parameter\n1.Sensors on\n>>>BLACK LINE<<<\n2.ENTER key");
    wait_keyclick(KEY_ENTER);
    if (GrayType == FiveGray)
    {
        hb1 = get_Gray(A1);
        hb2 = get_Gray(A2);
        hb3 = get_Gray(A3);
        hb4 = get_Gray(A4);
        hb5 = get_Gray(A5);
    }
    else
    {
        hb1 = JY_AI(A1);
        hb2 = JY_AI(A2);
        hb3 = JY_AI(A3);
        hb4 = JY_AI(A4);
        hb5 = JY_AI(A5);
    }
    for (i = 0; i < 25; i++)
    {
        if (GrayType == FiveGray)
        {
            hb1 = (get_Gray(A1) + hb1) / 2;
            hb2 = (get_Gray(A2) + hb2) / 2;
            hb3 = (get_Gray(A3) + hb3) / 2;
            hb4 = (get_Gray(A4) + hb4) / 2;
            hb5 = (get_Gray(A5) + hb5) / 2;
        }
        else
        {
            hb1 = (JY_AI(A1) + hb1) / 2;
            hb2 = (JY_AI(A2) + hb2) / 2;
            hb3 = (JY_AI(A3) + hb3) / 2;
            hb4 = (JY_AI(A4) + hb4) / 2;
            hb5 = (JY_AI(A5) + hb5) / 2;
        }
    }
    // wait_keyup(KEY_ENTER);
    wait(0.5);
    Printf("Get parameter\n1.Sensors on\n>>>WHITE LINE<<<\n2.ENTER key");
    wait_keyclick(KEY_ENTER);
    if (GrayType == FiveGray)
    {
        hb6 = get_Gray(A1);
        hb7 = get_Gray(A2);
        hb8 = get_Gray(A3);
        hb9 = get_Gray(A4);
        hb10 = get_Gray(A5);
    }
    else
    {
        hb6 = JY_AI(A1);
        hb7 = JY_AI(A2);
        hb8 = JY_AI(A3);
        hb9 = JY_AI(A4);
        hb10 = JY_AI(A5);
    }
    for (i = 0; i < 25; i++)
    {
        if (GrayType == FiveGray)
        {
            hb6 = (get_Gray(A1) + hb6) / 2;
            hb7 = (get_Gray(A2) + hb7) / 2;
            hb8 = (get_Gray(A3) + hb8) / 2;
            hb9 = (get_Gray(A4) + hb9) / 2;
            hb10 = (get_Gray(A5) + hb10) / 2;
        }
        else
        {
            hb6 = (JY_AI(A1) + hb6) / 2;
            hb7 = (JY_AI(A2) + hb7) / 2;
            hb8 = (JY_AI(A3) + hb8) / 2;
            hb9 = (JY_AI(A4) + hb9) / 2;
            hb10 = (JY_AI(A5) + hb10) / 2;
        }
    }
    wait(0.1);
    //先调用写缓存，最后调用1次真实的写入FLASH，避免多次写入
    WriteEEPROMBufffer(0, hb1);
    WriteEEPROMBufffer(1, hb2);
    WriteEEPROMBufffer(2, hb3);
    WriteEEPROMBufffer(3, hb4);
    WriteEEPROMBufffer(4, hb5);
    WriteEEPROMBufffer(5, hb6);
    WriteEEPROMBufffer(6, hb7);
    WriteEEPROMBufffer(7, hb8);
    WriteEEPROMBufffer(8, hb9);
    WriteEEPROMBufffer(9, hb10);
    WriteEEPROM(10, 0);
    // wait_keyclick(KEY_ENTER);
    wait(0.5);
    Printf("Press ENTER key");
    wait_keyclick(KEY_ENTER);
    hb1 = ReadEEPROM(0);
    hb2 = ReadEEPROM(1);
    hb3 = ReadEEPROM(2);
    hb4 = ReadEEPROM(3);
    hb5 = ReadEEPROM(4);
    hb6 = ReadEEPROM(5);
    hb7 = ReadEEPROM(6);
    hb8 = ReadEEPROM(7);
    hb9 = ReadEEPROM(8);
    hb10 = ReadEEPROM(9);
    Printf("Black=%d %d %d %d %d\nWhite=%d %d %d %d %d\n", hb1, hb2, hb3, hb4, hb5, hb6, hb7, hb8, hb9, hb10);
    wait(2.0);
    enterkey_exitprogram(true);//指示102控制器enter按钮是否退出程序，此功能在巡线检测黑白线时使用
    while (true)
    {
        wait(1.0);
    }
}

void patr_init(int gl_a, int gl_b, int dl, int dr, int a1, int a2, int a3, int a4, int a5, int type)
{
H:
    //Debug(__LINE__);
//先识别P1或者P2端口上是否连接了5灰度
    wait(0.1);
    if(getPortSensorType(P1)==GRAY5_PORT_Addr)
        Port = P1;
    else if (getPortSensorType(P2)==GRAY5_PORT_Addr)
        Port = P2;
    wait(0.1);

    Pow_a = gl_a;
    Pow_b = gl_b;
    DCL = dl;
    DCR = dr;
    GrayType = type;
    SmType=0;
    wheel=0;
    if (GrayType == FiveGray)
    {
        A1 = 1;
        A2 = 2;
        A3 = 3;
        A4 = 4;
        A5 = 5;
    }
    else
    {
        A1 = a1;
        A2 = a2;
        A3 = a3;
        A4 = a4;
        A5 = a5;
    }
    Hb1 = ReadEEPROM(0);
    Hb2 = ReadEEPROM(1);
    Hb3 = ReadEEPROM(2);
    Hb4 = ReadEEPROM(3);
    Hb5 = ReadEEPROM(4);
    Hb6 = ReadEEPROM(5);
    Hb7 = ReadEEPROM(6);
    Hb8 = ReadEEPROM(7);
    Hb9 = ReadEEPROM(8);
    Hb10 = ReadEEPROM(9);
    get_Gray(A1);
    wait(0.1);
    Cz1 = (Hb1 + Hb6) * 0.5;
    Cz2 = Hb2 - Hb7;
    Cz3 = Hb3 - Hb8;
    Cz4 = Hb4 - Hb9;
    Cz5 = (Hb5 + Hb10) * 0.5;
    Cz_2 = (Hb2 + Hb7) * 0.5;
    Cz_4 = (Hb4 + Hb9) * 0.5;
    Qd = 30;
    if (Hb1 == 4095 || Hb1 < 800)
    {
        patr_environmental_acquiment();
        goto H;
    }
    flag = 0;
    flag1 = 0;
    //Debug(__LINE__);
}


void patr_init_1(int gl_a , int gl_b,int gl_c , int gl_d, int a1,int a2,int a3,int a4,int a5,int type)
{
    //int mtype=1;
    //H:
    Pow_a=gl_a;
    Pow_b=gl_b;
    Pow_c=gl_c;
    Pow_d=gl_d;
    SmType=1;
    wheel=1;
	GrayType = type;
	 if(GrayType==FiveGray)
	 {
    A1=5;
    A2=4;
    A3=3;
    A4=2;
    A5=1;
	 }
	 else
	 {
	   A1=a1;
     A2=a2;
     A3=a3;
     A4=a4;
     A5=a5;
	 }
    Hb1= ReadEEPROM(0);
    Hb2= ReadEEPROM(1);
    Hb3= ReadEEPROM(2);
    Hb4= ReadEEPROM(3);
    Hb5= ReadEEPROM(4);
    Hb6= ReadEEPROM(5);
    Hb7= ReadEEPROM(6);
    Hb8= ReadEEPROM(7);
    Hb9= ReadEEPROM(8);
    Hb10= ReadEEPROM(9);
    wait(0.1);
    Cz1=(Hb1+Hb6)*0.5;
    Cz2=Hb2-Hb7;
    Cz3=Hb3-Hb8;
    Cz4=Hb4-Hb9;
    Cz5=(Hb5+Hb10)*0.5;
    Cz_2=(Hb2+Hb7)*0.5;
    Cz_4=(Hb4+Hb9)*0.5;
    Qd=30;
    //if(Hb1==4095||Hb1<800)
    {
       //patr_environmental_acquiment();
       //goto H;
    }
    flag=0;
    flag1=0;
}



void patr_Mecanum_wheel_init(int gl_a,int gl_b,int gl_c,int gl_d,int a1,int a2,int a3,int a4,int a5,int type)
{
    H:
//先识别P1或者P2端口上是否连接了5灰度
    wait(0.1);
    if(getPortSensorType(P1)==GRAY5_PORT_Addr)
        Port = P1;
    else if (getPortSensorType(P2)==GRAY5_PORT_Addr)
        Port = P2;
    wait(0.1);
    
	wheel=1;
    Pow_a=gl_a;
    Pow_b=gl_b;
	Pow_c=gl_c;
    Pow_d=gl_d;
    GrayType = type;
    if(GrayType==FiveGray)
    {
        A1=1;
        A2=2;
        A3=3;
        A4=4;
        A5=5;
    }
    else
    {
        A1=a1;
        A2=a2;
        A3=a3;
        A4=a4;
        A5=a5;
    }
    Hb1= ReadEEPROM(0);
    Hb2= ReadEEPROM(1);
    Hb3= ReadEEPROM(2);
    Hb4= ReadEEPROM(3);
    Hb5= ReadEEPROM(4);
    Hb6= ReadEEPROM(5);
    Hb7= ReadEEPROM(6);
    Hb8= ReadEEPROM(7);
    Hb9= ReadEEPROM(8);
    Hb10= ReadEEPROM(9);
    wait(0.1);
    Cz1=(Hb1+Hb6)*0.5;
    Cz2=Hb2-Hb7;
    Cz3=Hb3-Hb8;
    Cz4=Hb4-Hb9;
    Cz5=(Hb5+Hb10)*0.5;
    Cz_2=(Hb2+Hb7)*0.5;
    Cz_4=(Hb4+Hb9)*0.5;
    Qd=30;
    if(Hb1==4095||Hb1<800)
    {
        patr_environmental_acquiment();
        goto H;
    }
    flag=0;
    flag1=0;
}
static void yd(int dj_a, int dj_b)
{
    if(wheel==0)
	{	
        dj_a=Pow_a*dj_a/100;
		dj_b=Pow_b*dj_b/100;
		set_motor(DCL, dj_a);
		set_motor(DCR, dj_b);
	}
     else
	 {
		MA=Pow_a*dj_a/100;
		MB=Pow_b*dj_b/100;
		MC=Pow_c*dj_b/100;
		MD=Pow_d*dj_a/100;
		set_motor(1,MA);
		set_motor(2,-MB);
		set_motor(3,-MC);
		set_motor(4,MD); 
		flag=0;
		flag1=0;
		flag2=0; 
	 }	
}

void motor_time(int dj_a, int dj_b, float time)
{
if(wheel==0)
	{
		dj_a=Pow_a*dj_a/100;
		dj_b=Pow_b*dj_b/100;
		set_motor(DCL, dj_a);
		set_motor(DCR, dj_b);
		wait(time);
		set_motor(DCL, 0);
		set_motor(DCR, 0);
		flag=0;
		flag1=0;
		flag2=0;
	}
    else
	{

		MA=Pow_a*dj_a/100;
		MB=Pow_b*dj_b/100;
		MC=Pow_c*dj_b/100;
		MD=Pow_d*dj_a/100;
		set_motor(1,MA);
		set_motor(2,-MB);
		set_motor(3,-MC);
		set_motor(4,MD); 
		wait(time);
		set_motor(1,0);
		set_motor(2,0);
		set_motor(3,0);
		set_motor(4,0); 

		flag=0;
		flag1=0;
		flag2=0;
	}
}

void motor_ds(int dj_a, int dj_b, int ds)
{
    
	if(wheel==0)
	{
		int s1 = 0, s2 = 0, s3 = 0, s4 = 0;
		dj_a=Pow_a*dj_a/100;
		dj_b=Pow_b*dj_b/100;

		if (1 == DCL)
		s1 = dj_a;

		if (2 == DCL)
		s2 = dj_a;

		if (3 == DCL)
		s3 = dj_a;

		if (4 == DCL)
		s4 = dj_a;

		if (1 == DCR)
		s1 = dj_b;

		if (2 == DCR)
		s2 = dj_b;

		if (3 == DCR)
		s3 = dj_b;

		if (4 == DCR)
		s4 = dj_b;
		set_motor_ad((1 << (DCL-1)) | (1 <<( DCR-1)), ds, s1, s2, s3, s4);
		// set_motor_ad(15, ds, s1, s2, s3, s4);
		flag=0;
		flag1=0;
		flag2=0;
	}
	else
	{
		MA=Pow_a*dj_a/100;
		MB=Pow_b*dj_b/100;
		MC=Pow_c*dj_b/100;
		MD=Pow_d*dj_a/100;
		set_motor(1,MA);
		set_motor(2,-MB);
		set_motor(3,-MC);
		set_motor(4,MD); 
		//set_motor_ad(15, 1600, 11, 21, 33, 44);
		set_motor_ad(15, ds, MA, -MB, -MC, MD);
		
	}
}

static void motor_ds_angle(int dj_a, int dj_b, int angle)
{
    int32_t ds = (angle * 34 * 48) / 360;
    motor_ds(dj_a, dj_b, ds);
}

void motor_sensor(int dj_a, int dj_b, int s_id, int a, int s)
{
   if(wheel==0)
   {
			  dj_a=Pow_a*dj_a/100;
			dj_b=Pow_b*dj_b/100;
			set_motor(DCL, dj_a);
			set_motor(DCR, dj_b);
			if(a==1)
			{
				if(GrayType==FiveGray)
				{
					while(get_Gray(s_id)>s)
					{
					}
				}
				else
				{
					while(JY_AI(s_id)>s)
					{
					}
				}
			}
			else if(a==2)
			{
				if(GrayType==FiveGray)
				{
					while(get_Gray(s_id)<s)
					{
					}
				}
				else
				{
					while(JY_AI(s_id)<s)
					{
					}
				}
			}
			else if(a==3)
			{
				if(GrayType==FiveGray)
				{
					while(get_Gray(s_id)==s)
					{
					}
				}
				else
				{
					while(JY_AI(s_id)==s)
					{
					}
				}
			}
			else if(a==4)
			{
				if(GrayType==FiveGray)
				{
					while(get_Gray(s_id)!=s)
					{
					}
				}
				else
				{
					while(JY_AI(s_id)==s)
					{
					}
				}
			}
			set_motor(DCL, 0);
			set_motor(DCR, 0);
			flag=0;
			flag1=0;
			flag2=0;  
	   
   }
   else
   {
			MA=Pow_a*dj_a/100;
			MB=Pow_b*dj_b/100;
			MC=Pow_c*dj_b/100;
			MD=Pow_d*dj_a/100;
			set_motor(1,MA);
			set_motor(2,-MB);
			set_motor(3,-MC);
			set_motor(4,MD); 
			if(a==1)
			{
				if(GrayType==FiveGray)
				{
					while(get_Gray(s_id)>s)
					{
					}
				}
				else
				{
					while(JY_AI(s_id)>s)
					{
					}
				}
			}
			else if(a==2)
			{
				if(GrayType==FiveGray)
				{
					while(get_Gray(s_id)<s)
					{
					}
				}
				else
				{
					while(JY_AI(s_id)<s)
					{
					}
				}
			}
			else if(a==3)
			{
				if(GrayType==FiveGray)
				{
					while(get_Gray(s_id)==s)
					{
					}
				}
				else
				{
					while(JY_AI(s_id)==s)
					{
					}
				}
			}
			else if(a==4)
			{
				if(GrayType==FiveGray)
				{
					while(get_Gray(s_id)!=s)
					{
					}
				}
				else
				{
					while(JY_AI(s_id)==s)
					{
					}
				}
			}
		    set_motor(1,0);
		    set_motor(2,0);
		    set_motor(3,0);
		    set_motor(4,0); 
			flag=0;
			flag1=0;
			flag2=0;
	   
   }
}

void patr_button()
{
    Printf("Press ENTER key to continue.");
	while(!(button_pressed(key_enter)))
    {
        wait(0.01);
    }
    //wait_keyup(KEY_ENTER);
}

void patr_turn(int a, int dj_a, int dj_b)
{
    int hb1 = 0, hb2 = 0, hb3 = 0, hb4 = 0, hb5 = 0;
    hb1 = (Hb1 + Hb6) * 0.5;
    hb2 = (Hb2 + Hb7) * 0.5;
    hb3 = (Hb3 + Hb8) * 0.5;
    hb4 = (Hb4 + Hb9) * 0.5;
    hb5 = (Hb5 + Hb10) * 0.5;
    yd(dj_a, dj_b);
    if (dj_a < dj_b)
    {
        if (GrayType == FiveGray)
        {
            while (get_Gray(A1) < hb1)
            {
            }
            while (get_Gray(A2) < hb2)
            {
            }
            if (a == 1)
            {
                while (get_Gray(A3) < hb3)
                {
                }
            }
            if (a == 2)
            {
                while (get_Gray(A3) < hb3)
                {
                }
                while (get_Gray(A4) < hb4)
                {
                }
            }
        }
        else
        {
            while (JY_AI(A1) < hb1)
            {
            }
            while (JY_AI(A2) < hb2)
            {
            }
            if (a == 1)
            {
                while (JY_AI(A3) < hb3)
                {
                }
            }
            if (a == 2)
            {
                while (JY_AI(A3) < hb3)
                {
                }
                while (JY_AI(A4) < hb4)
                {
                }
            }
        }
    }
    else
    {
        if (GrayType == FiveGray)
        {
            while (get_Gray(A5) < hb5)
            {
            }
            while (get_Gray(A4) < hb4)
            {
            }
            if (a == 1)
            {
                while (get_Gray(A3) < hb3)
                {
                }
            }
            if (a == 0)
            {
                while (get_Gray(A3) < hb3)
                {
                }
                while (get_Gray(A2) < hb2)
                {
                }
            }
        }
        else
        {
            while (JY_AI(A5) < hb5)
            {
            }
            while (JY_AI(A4) < hb4)
            {
            }
            if (a == 1)
            {
                while (JY_AI(A3) < hb3)
                {
                }
            }
            if (a == 0)
            {
                while (JY_AI(A3) < hb3)
                {
                }
                while (JY_AI(A2) < hb2)
                {
                }
            }
        }
    }
    yd(-dj_a, -dj_b);
    wait(0.05);
    yd(0, 0);
    flag = 0;
    flag1 = 0;
    flag2 = 0;
}

void Zx(int s, int l)
{
    /*while(1)
    {
    if(GrayType==FiveGray){
    A21=get_Gray(A2);
    A31=get_Gray(A3);
    A41=get_Gray(A4);
    }
    else
    {
    A21=JY_AI(A2);
    A31=JY_AI(A3);
    A41=JY_AI(A4);
    }
    B2=(A21-Hb7)*100/Cz2;
    B3=(A31-Hb8)*100/Cz3;
    B4=(A41-Hb9)*100/Cz4;
    Printf("%d\n%d\n%d\n",B2,B3,B4);
    wait(0.2);
    }*/
    if (GrayType == FiveGray)
    {
        A21 = get_Gray(A2);
        A31 = get_Gray(A3);
        A41 = get_Gray(A4);
    }
    else
    {
        A21 = JY_AI(A2);
        A31 = JY_AI(A3);
        A41 = JY_AI(A4);
    }
    B2 = (A21 - Hb7) * 100 / Cz2;
    B3 = (A31 - Hb8) * 100 / Cz3;
    B4 = (A41 - Hb9) * 100 / Cz4;
    if (GrayType == FiveGray)
    {
        if (l == 0)
        {
            if (get_Gray(A1) > Cz1)
            {
                flag2 = 1;
                js = 0;
            }
            if (get_Gray(A5) > Cz5)
            {
                flag2 = 2;
                js = 0;
            }
        }
        else
        {
            if (get_Gray(A5) > Cz5)
            {
                flag2 = 2;
                js = 0;
            }
            if (get_Gray(A1) > Cz1)
            {
                flag2 = 1;
                js = 0;
            }
        }
    }
    else
    {
        if (l == 0)
        {
            if (JY_AI(A1) > Cz1)
            {
                flag2 = 1;
                js = 0;
            }
            if (JY_AI(A5) > Cz5)
            {
                flag2 = 2;
                js = 0;
            }
        }
        else
        {
            if (JY_AI(A5) > Cz5)
            {
                flag2 = 2;
                js = 0;
            }
            if (JY_AI(A1) > Cz1)
            {
                flag2 = 1;
                js = 0;
            }
        }
    }
    if (js >= 350)
    {
        flag2 = 0;
        js = 0;
    }
    if (B3 > 80 || (B3 >= B2 && B3 >= B4 && B3 > 20))
    {
        if (flag2 > 0)
        {
            js++;
        }
        if (js > 5000)
        {
            js = 5000;
        }
        if (B2 > B4 && B2 > 5)
        {
            /* if(B3>90)
            {
            yd(s,s);
            }
            else if(B3>80)
            {
            yd(s*0.95,s);
            }*/
            if (B3 > 80)
            {
                // yd(s,s);
                if ((B2 - B4) < 20)
                {
                    yd(s * 0.95, s);
                }
                else if ((B2 - B4) < 40)
                {
                    yd(s * 0.9, s);
                }
                else if ((B2 - B4) < 60)
                {
                    yd(s * 0.85, s);
                }
                else
                {
                    yd(s * 0.8, s);
                }
            }
            else if (B3 > 75)
            {
                yd(s * 0.85, s);
            }
            else if (B3 > 70)
            {
                yd(s * 0.80, s);
            }
            else if (B3 > 65)
            {
                yd(s * 0.75, s);
            }
            else if (B3 > 60)
            {
                yd(s * 0.70, s);
            }
            else if (B3 > 55)
            {
                yd(s * 0.65, s);
            }
            else if (B3 > 50)
            {
                yd(s * 0.60, s);
            }
            else if (B3 > 45)
            {
                yd(s * 0.55, s);
            }
            else if (B3 > 40)
            {
                yd(s * 0.50, s);
            }
            else if (B3 > 35)
            {
                yd(s * 0.45, s);
            }
            else
            {
                yd(s * 0.40, s);
            }
            flag = 3;
        }
        else if (B4 > B2 && B4 > 5)
        {
            /* if(B3>90)
            {
            yd(s,s);
            }
            else if(B3>80)
            {
            yd(s,s*0.95);
            }*/
            if (B3 > 80)
            {
                if ((B4 - B2) < 20)
                {
                    yd(s, s * 0.95);
                }
                else if ((B4 - B2) < 40)
                {
                    yd(s, s * 0.9);
                }
                else if ((B4 - B2) < 60)
                {
                    yd(s, s * 0.85);
                }
                else
                {
                    yd(s, s * 0.8);
                }
            }
            else if (B3 > 75)
            {
                yd(s, s * 0.85);
            }
            else if (B3 > 70)
            {
                yd(s, s * 0.80);
            }
            else if (B3 > 65)
            {
                yd(s, s * 0.75);
            }
            else if (B3 > 60)
            {
                yd(s, s * 0.70);
            }
            else if (B3 > 55)
            {
                yd(s, s * 0.65);
            }
            else if (B3 > 50)
            {
                yd(s, s * 0.60);
            }
            else if (B3 > 45)
            {
                yd(s, s * 0.55);
            }
            else if (B3 > 40)
            {
                yd(s, s * 0.50);
            }
            else if (B3 > 45)
            {
                yd(s, s * 0.45);
            }
            else
            {
                yd(s, s * 0.40);
            }
            flag = 3;
        }
        else
        {
            yd(s, s);
            flag = 0;
        }
    }
    else if (B2 > B4 && B2 > 25)
    {
        if (flag2 > 0)
        {
            js++;
        }
        if (js > 5000)
        {
            js = 5000;
        }
        if (B3 > 60)
        {
            yd(s * 0.70, s);
            flag = 3;
        }
        else if (B3 > 55)
        {
            yd(s * 0.65, s);
            flag = 3;
        }
        else if (B3 > 50)
        {
            yd(s * 0.60, s);
            flag = 3;
        }
        else if (B3 > 45)
        {
            yd(s * 0.55, s);
            flag = 3;
        }
        else if (B3 > 40)
        {
            yd(s * 0.50, s);
            flag = 3;
        }
        else if (B3 > 35)
        {
            yd(s * 0.45, s);
            flag = 3;
        }
        else if (B3 > 30)
        {
            yd(s * 0.40, s);
            flag = 3;
        }
        else if (B3 > 25)
        {
            yd(s * 0.35, s);
            flag = 1;
        }
        else if (B3 > 20)
        {
            yd(s * 0.30, s);
            flag = 1;
        }
        else if (B3 > 15)
        {
            yd(s * 0.25, s);
            flag = 1;
        }
        else if (B3 > 10)
        {
            yd(s * 0.20, s);
            flag = 1;
        }
        else if (B3 > 10)
        {
            yd(s * 0.15, s);
            flag = 1;
        }
        else if (B2 > 70)
        {
            yd(s * 0.10, s);
            flag = 1;
        }
        else if (B2 > 60)
        {
            yd(s * 0.05, s);
            flag = 1;
        }
        else if (B2 > 50)
        {
            yd(s * 0.0, s);
            flag = 1;
        }
        else if (B2 > 40)
        {
            yd(-s * 0.05, s);
            flag = 1;
        }
        else if (B2 > 20)
        {
            yd(-s * 0.10, s);
            flag = 1;
        }
    }
    else if (B4 > B2 && B4 > 25)
    {
        if (flag2 > 0)
        {
            js++;
        }
        if (js > 5000)
        {
            js = 5000;
        }
        if (B3 > 60)
        {
            yd(s, s * 0.70);
            flag = 3;
        }
        else if (B3 > 55)
        {
            yd(s, s * 0.65);
            flag = 3;
        }
        else if (B3 > 50)
        {
            yd(s, s * 0.60);
            flag = 3;
        }
        else if (B3 > 45)
        {
            yd(s, s * 0.55);
            flag = 3;
        }
        else if (B3 > 40)
        {
            yd(s, s * 0.5);
            flag = 3;
        }
        else if (B3 > 35)
        {
            yd(s, s * 0.45);
            flag = 3;
        }
        else if (B3 > 30)
        {
            yd(s, s * 0.40);
            flag = 3;
        }
        else if (B3 > 25)
        {
            yd(s, s * 0.35);
            flag = 2;
        }
        else if (B3 > 20)
        {
            yd(s, s * 0.30);
            flag = 2;
        }
        else if (B3 > 15)
        {
            yd(s, s * 0.25);
            flag = 2;
        }
        else if (B3 > 10)
        {
            yd(s, s * 0.20);
            flag = 2;
        }
        else if (B3 > 5)
        {
            yd(s, s * 0.15);
            flag = 2;
        }
        else if (B4 > 70)
        {
            yd(s, s * 0.10);
            flag = 2;
        }
        else if (B4 > 60)
        {
            yd(s, s * 0.05);
            flag = 2;
        }
        else if (B4 > 50)
        {
            yd(s, s * 0.0);
            flag = 2;
        }
        else if (B4 > 40)
        {
            yd(s, -s * 0.05);
            flag = 2;
        }
        else if (B4 > 20)
        {
            yd(s, -s * 0.10);
            flag = 2;
        }
    }
    else
    {
        if (flag2 == 1 && B2 < 5)
        {
            // yd(-s*0.4,s);
            yd(-s * 0.3, s);
            // flag=1;
        }
        else if (flag2 == 2 && B4 < 5)
        {
            // yd(s,-s*0.4);
            yd(s, -s * 0.3);
            // flag=2;
        }
        else if (flag == 1)
        {
            if (B2 > 10)
            {
                yd(-s * 0.15, s);
            }
            else if (B2 > 5)
            {
                yd(-s * 0.2, s);
            }
        }
        else if (flag == 2)
        {
            if (B4 > 10)
            {
                yd(s, -s * 0.15);
            }
            else if (B4 > 5)
            {
                yd(s, -s * 0.2);
            }
        }
        else
        {
            if (GrayType == FiveGray)
            {
                if (get_Gray(A1) > Cz1)
                {
                    // yd(-s*0.4,s);
                    yd(-s * 0.3, s);
                }
                else if (get_Gray(A5) > Cz5)
                {
                    // yd(s,-s*0.4);
                    yd(s, -s * 0.3);
                }
            }
            else
            {
                if (JY_AI(A1) > Cz1)
                {
                    // yd(-s*0.4,s);
                    yd(-s * 0.3, s);
                }
                else if (JY_AI(A5) > Cz5)
                {
                    // yd(s,-s*0.4);
                    yd(s, -s * 0.3);
                }
            }
        }
    }
}

void patr_road(int k, int s, float t)
{
    float t1 = -6000;
    float t5 = -5000;
    float t2 = 0.0;
    float t3 = 0.07;
    yd(s, s);
    t2 = seconds();
    if (GrayType == FiveGray)
    {
        if (flag1 == 0 && s > Qd)
        {
            Zx(Qd, k);
            while ((seconds() - t2) < 0.1 && get_Gray(A1) < Cz1 && get_Gray(A5) < Cz5)
            {
                Zx(Qd, k);
            }
        }
        if (k == 1)
        {
            while ((t1 - t5) > t3 || (t1 - t5) < -t3)
            {
                if (get_Gray(A1) > Cz1)
                    t1 = seconds();
                if (get_Gray(A5) > Cz5)
                    t5 = seconds();
                Zx(s, k);
            }
            while (get_Gray(A1) > Cz1 * 0.8 || get_Gray(A5) > Cz5 * 0.8)
            {
                Zx(s, k);
            }
        }
        else if (k == 0)
        {
            while (get_Gray(A1) < Cz1)
            {
                Zx(s, k);
            }
            while (get_Gray(A1) > Cz1 * 0.8)
            {
                Zx(s, k);
            }
        }
        else if (k == 2)
        {
            while (get_Gray(A5) < Cz5)
            {
                Zx(s, k);
            }
            while (get_Gray(A5) > Cz5 * 0.8)
            {
                Zx(s, k);
            }
        }
        else
        {
            while ((t1 - t5) > t3 || (t1 - t5) < -t3)
            {
                if (get_Gray(A2) > Cz_2)
                    t1 = seconds();
                if (get_Gray(A4) > Cz_4)
                    t5 = seconds();
                Zx(s, k);
            }
            while (get_Gray(A2) > Cz_2 * 0.8 || get_Gray(A4) > Cz_4 * 0.8)
            {
                yd(s, s);
            }
            while (get_Gray(A1) > Cz1 * 0.8 || get_Gray(A5) > Cz5 * 0.8)
            {
                yd(s, s);
            }
        }
    }
    else
    {
        if (flag1 == 0 && s > Qd)
        {
            Zx(Qd, k);
            while ((seconds() - t2) < 0.1 && JY_AI(A1) < Cz1 && JY_AI(A5) < Cz5)
            {
                Zx(Qd, k);
            }
        }
        if (k == 1)
        {
            while ((t1 - t5) > t3 || (t1 - t5) < -t3)
            {
                if (JY_AI(A1) > Cz1)
                    t1 = seconds();
                if (JY_AI(A5) > Cz5)
                    t5 = seconds();
                Zx(s, k);
            }
            while (JY_AI(A1) > Cz1 * 0.8 || JY_AI(A5) > Cz5 * 0.8)
            {
                Zx(s, k);
            }
        }
        else if (k == 0)
        {
            while (JY_AI(A1) < Cz1)
            {
                Zx(s, k);
            }
            while (JY_AI(A1) > Cz1 * 0.8)
            {
                Zx(s, k);
            }
        }
        else if (k == 2)
        {
            while (JY_AI(A5) < Cz5)
            {
                Zx(s, k);
            }
            while (JY_AI(A5) > Cz5 * 0.8)
            {
                Zx(s, k);
            }
        }
        else
        {
            while ((t1 - t5) > t3 || (t1 - t5) < -t3)
            {
                if (JY_AI(A2) > Cz_2)
                    t1 = seconds();
                if (JY_AI(A4) > Cz_4)
                    t5 = seconds();
                Zx(s, k);
            }
            while (JY_AI(A2) > Cz_2 * 0.8 || JY_AI(A4) > Cz_4 * 0.8)
            {
                yd(s, s);
            }
            while (JY_AI(A1) > Cz1 * 0.8 || JY_AI(A5) > Cz5 * 0.8)
            {
                yd(s, s);
            }
        }
    }
    yd(s, s);
    wait(t);
    yd(0, 0);
    flag1 = 1;
    // flag2=0;
}

void patr_time(int s, float t)
{
    float t1 = 0.0;
    yd(s, s);
    t1 = seconds();
    if (flag1 == 0 && s > Qd)
    {
        Zx(Qd, 1);
        while ((seconds() - t1) < 0.1 && (seconds() - t1) < t)
        {
            Zx(Qd, 1);
        }
    }
    while ((seconds() - t1) < t)
    {
        Zx(s, 1);
    }
    flag1 = 1;
    // flag2=0;
    yd(0, 0);
}

/*********************************************************/
/*                   巡线，开放给scratch调用               */
/*********************************************************/
//巡线初始化 集成灰度
void patrol_integrated_initialization(int left_motor_id, int left_motor_speed, int right_motor_id, int right_motor_speed)
{
    //Debug(__LINE__);
    patr_init(left_motor_speed, right_motor_speed, left_motor_id, right_motor_id,1,2,3,4,5,1);
}

//巡线初始化 单灰度
void patrol_single_initialization(int left_motor_id, int left_motor_speed, int right_motor_id, int right_motor_speed, int p1, int p2, int p3, int p4, int p5)
{
    patr_init(left_motor_speed, right_motor_speed, left_motor_id, right_motor_id, p1, p2, p3, p4, p5, 0);
}
//麦克纳姆轮巡线初始化 集成灰度
void patrol_init_mecanum_wheel_integrated(int left_back_speed, int right_back_speed, int left_front_speed, int right_front_speed)
{
    patr_Mecanum_wheel_init(left_back_speed, right_back_speed, left_front_speed, right_front_speed,1,2,3,4,5,1);
}

//麦克纳姆轮巡线初始化 单灰度
void patrol_init_mecanum_wheel_single(int left_back_speed, int right_back_speed, int left_front_speed, int right_front_speed, int p1, int p2, int p3, int p4, int p5)
{
    patr_Mecanum_wheel_init(left_back_speed, right_back_speed, left_front_speed, right_front_speed, p1, p2, p3, p4, p5, 0);
}

//巡线 环境采集
void patrol_ambient_detection()
{
    patr_environmental_acquiment();
}

//巡线 巡线速度
void patrol_speed(int speed)
{
    Zx(speed, 1);
}

//巡线 路口巡线
void patrol_road(int type ,int speed, float time)
{
    patr_road(type, speed, time);
}

//巡线 按时巡线
void patrol_time(int speed, float time)
{
    patr_time(speed, time);
}

//巡线 巡线转弯
void patrol_turn(int turn_type, int left_speed, int right_speed)
{
    patr_turn(turn_type, left_speed, right_speed);
}


//巡线 启动电机-时间
void start_motor_time(int left_speed, int right_speed, float time)
{
     motor_time(left_speed, right_speed, time);

}

//巡线 启动电机-角度
void start_motor_angle(int left_speed, int right_speed, int angle)
{
	motor_ds_angle(left_speed, right_speed, angle);
}

//巡线 启动电机-传感器
void start_motor_sensor(int left_speed, int right_speed, int sensor_port_id, int compare_opt, int compare_value)
{
    motor_sensor(left_speed, right_speed, sensor_port_id, compare_opt, compare_value);
}

//巡线 启动按钮
void patrol_button()
{
    patr_button();
}


//巡线初始化 全向轮  集成灰度
void patrol_omni_wheel_integrated_init(int motorA_speed, int motorB_speed, int motorC_speed, int motorD_speed)
{
    patr_Mecanum_wheel_init(motorA_speed, motorB_speed, motorC_speed, motorD_speed,1,2,3,4,5,1);
}

//巡线初始化 全向轮  单灰度
void patrol_omni_wheel_single_init(int motorA_speed, int motorB_speed, int motorC_speed, int motorD_speed, int p1, int p2, int p3, int p4, int p5)
{
    patr_Mecanum_wheel_init(motorA_speed, motorB_speed, motorC_speed, motorD_speed, p1, p2, p3, p4, p5, 0);
}


#endif