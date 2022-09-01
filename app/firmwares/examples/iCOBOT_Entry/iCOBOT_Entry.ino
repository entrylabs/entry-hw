/*
 2022.07.20.수요일 14:00:PM Entry Test Ver.1 
 Entry를 이용하여 i-COBOT을 구동시킬 수 있다.
 업로드 후 Entry 하드웨어 연결을 통해 i-COBOT 전용 블럭을 사용할 수 있다.
 자세한 내용은 첨부된 pdf 파일을 통해 확인할 수 있다.
*/

#include "SoftwareSerial.h"
#include "Adafruit_NeoPixel.h"
#include "DHT.h"
#include "AccelStepper.h"
#include "SimpleTimer.h"
SimpleTimer timer;

// SENSOR Type
#define ALIVE       0
#define SENSOR      1
#define MOTOR       2
#define BUZZER      3
#define RGBLED      4
#define TONE        5
#define TEMP        6
        
// Control Command
#define GET         1
#define SET         2
#define RESET       3

// val Union
union
{
  byte byteVal[4];
  float floatVal;
  long longVal;
}val;

// valShort Union
union
{
  byte byteVal[2];
  short shortVal;
}valShort;

//////////////////Motor 관련 변수///////////////////////////////
#define Left_Motor_A  4     // IN1 on the ULN2003 driver 1
#define Left_Motor_B  12     // IN2 on the ULN2003 driver 1
#define Left_Motor_C  5     // IN3 on the ULN2003 driver 1
#define Left_Motor_D  13     // IN4 on the ULN2003 driver 1

#define Right_Motor_A  17     // IN1 on the ULN2003 driver 2
#define Right_Motor_B  16     // IN2 on the ULN2003 driver 2
#define Right_Motor_C  14     // IN3 on the ULN2003 driver 2
#define Right_Motor_D  11     // IN4 on the ULN2003 driver 2

#define LEFT_MOTOR_FWD -10
#define LEFT_MOTOR_BWD 10
#define RIGHT_MOTOR_FWD 10
#define RIGHT_MOTOR_BWD -10

#define MOTOR_MAX_SPEED 10000.0

int motor_dirL = LEFT_MOTOR_FWD;
int motor_dirR = RIGHT_MOTOR_FWD;

int speedLeft = 600;        // stop speed
int speedRight = 600;       // stop speed

AccelStepper stepper_L(8, Left_Motor_D, Left_Motor_B, Left_Motor_C, Left_Motor_A);
AccelStepper stepper_R(8, Right_Motor_D, Right_Motor_B, Right_Motor_C, Right_Motor_A);

#define MOTOR_CW        2     // 정방향
#define MOTOR_CCW       1     // 역방향
#define MOTOR_STOP      3     // 정지
int motorSpeed = 600;
int motor_dir = 0;
int motor_angle = 0;
int ControlAngle = 0;


//Buzzer Set
#define BUZ_PORT    6
#define BUZZER_ON   1
#define BUZZER_OFF  0

// Temperature/Humidity
#define DHTTYPE     DHT11
#define _HUMID       0
#define _TEMP_F      1
#define _TEMP_C      2

//////////////////IR센서 관련 변수///////////////////////////////          
int IrPin = 15;
const int Side_Right_Ir    = A5;
const int Bottom_Right_Ir  = A3;
const int Bottom_Middle_Ir = A8;
const int Bottom_Left_Ir   = A1;
const int Side_Left_Ir     = A10;
const int Front_Ir         = A2;

int Front_Ir_Value         = 0;
int Side_Right_Ir_Value    = 0;
int Bottom_Right_Ir_Value  = 0;
int Bottom_Middle_Ir_Value = 0;
int Bottom_Left_Ir_Value   = 0;
int Side_Left_Ir_Value     = 0;

//////////////////조도센서 관련 변수///////////////////////////////
#define CdsPin A0
int Cds = 0;

//////////////////Sound센서 관련 변수///////////////////////////////
#define SoundPin A4
int Sound = 0;

// Temp Sensor
int dhtpin = 7;
int dhtmode = 0;


// Sensor State
int sensorpin = 0;

// Buzzer State
int BuzzerState = BUZZER_OFF;
long nowtime = 0;
long irtime = 0;


//////////////////LED 관련 변수///////////////////////////////
#define PinPix A9 // WS2812에 연결하는데 사용하는 pin 번호
#define NumPix 4 // 링에 연결되어 있는 WS2812 LED 갯수
Adafruit_NeoPixel Icobot_Leds = Adafruit_NeoPixel(NumPix, PinPix, NEO_GRB + NEO_KHZ800);

// RGB LED 모듈 
int BLED = 0;
int GLED = 0;
int RLED = 0;

// 버퍼
char buffer[52];
unsigned char prevc=0;

// Uart Comm.
byte index = 0;
byte dataLen;

// Time
double lastTime = 0.0;
double currentTime = 0.0;

// Exist flag
boolean isStart = false;
boolean isTempSensor = false;
boolean isLeftMotorMode = false;
boolean isRightMotorMode = false;
boolean isAngleLeftMode = false;
boolean isAngleRightMode = false;

// Comm. buffer
// buffer[4]   [5]  [6]   [7]   [8]
int cmdtype, device, port, mode, dir;

//
void setup()
{  
  Serial.begin(9600);
  Serial1.begin(9600);
  timer.setInterval(50, Timer_Run);
  
  Icobot_Leds.begin(); // Initialize the NeoPixel array in the Arduino's memory,
  Icobot_Leds.show(); // turn all pixels off, and upload to ring or string
  
  // 모터 설정
  stepper_L.setMaxSpeed(MOTOR_MAX_SPEED);
  stepper_R.setMaxSpeed(MOTOR_MAX_SPEED);
  
  pinMode(BUZ_PORT, OUTPUT);  // Buzzer 핀
  pinMode(IrPin, OUTPUT); 
  delay(200);
}

//
void loop()
{
  timer.run();
  while (Serial.available()) 
  {
    if (Serial.available() > 0) 
    {
      char serialRead = Serial.read();
      setPinValue(serialRead&0xff);
      Serial1.write(serialRead&0xff);
    }
  } 
  delay(1);
  if(isLeftMotorMode == true){
    Left_Motor_run(motor_dirL, speedLeft);
  }
  if(isRightMotorMode == true){
    Right_Motor_run(motor_dirR, speedRight);
  }
  if(isAngleLeftMode == true){
    Left_Angle_run(motor_dirL, motor_dirR, speedLeft, ControlAngle);
  }
  if(isAngleRightMode == true){
    Right_Angle_run(motor_dirL, motor_dirR, speedRight, ControlAngle);
  }
}

void Timer_Run(){
  sendPinValues();
}
void setPinValue(unsigned char c) 
{
  if(c == 0x55 && isStart == false)
  {
    if(prevc == 0xff)
    {
      index = 1;
      isStart = true;
    }    
  } 
  else 
  {     
    prevc = c;
    if(isStart) 
    {
      if(index == 2) dataLen = c; 
      else if(index > 2) dataLen--;
      writeBuffer(index, c);
    }
  }
  index++;
  
  if(index > 51) 
  {
    index = 0; 
    isStart = false;
  }
    
  if(isStart && dataLen == 0 && index > 3)
  {  
    isStart = false;
    parseData(); 
    index = 0;
  }
}

//
unsigned char readBuffer(int index)
{
  return buffer[index]; 
}

//
void parseData() 
{
  isStart = false;
  
  cmdtype = readBuffer(4);
  device = readBuffer(5);
  port = readBuffer(6);
  mode = readBuffer(7); 

  switch(cmdtype)
  {
    case GET:  
        if(device == TEMP) 
        {
          setTempHumidityMode(true);                  
          dhtpin = port;    
          dhtmode = mode;                   
        }
        else 
        {
          setTempHumidityMode(false);
        }
        break;
        
    case SET: 
        setTempHumidityMode(false);              
        runModule(device);
        callOK();
        break;
    
    case RESET:
        setTempHumidityMode(false);  
        callOK();
        break;
  }
}

//
void runModule(int device) 
{
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
  int hz = 0, ms = 0, v = 0;
  switch(device)
  { 
    case BUZZER:  
      setPortWritable(BUZ_PORT);
      if((BuzzerState == BUZZER_OFF) && (mode == 1)) 
      {
        tone(BUZ_PORT, 2000);
        BuzzerState = BUZZER_ON;
      }
      else if((BuzzerState == BUZZER_ON) && (mode == 0))
      { 
        noTone(BUZ_PORT);
        BuzzerState = BUZZER_OFF;              
      }
      break;
            
    case TONE:   
      setPortWritable(port);
      hz = readShort(7);
      ms = readShort(9);
      if(ms > 0){
        if(ms == 7)
        {
          tone(port, hz);
        }
        else{
          tone(port, hz, ms);
        }
      }
      else noTone(port);
      break;  
            
    case RGBLED: 
      RLED = readBuffer(7);
      GLED = readBuffer(8);
      BLED = readBuffer(9);
      LED_Run();
      break;   

    case MOTOR:
      mode = readShort(7);
      switch(mode)
      {
        case 0: 
                isLeftMotorMode = false;
                isRightMotorMode = false;
                stepper_L.stop(); //motor stop 
                stepper_L.disableOutputs(); //motor power disconnect, so motor led will turn off
                stepper_R.stop();
                stepper_R.disableOutputs();           
                break;   
        case 1: motor_dir = readShort(9);      // DC 모터 방향 설정하기
                if(motor_dir == MOTOR_CCW)      // 반시계 (역방향) 
                {
                  if(port == 1){
                    isLeftMotorMode = true;
                    motor_dirL = LEFT_MOTOR_BWD;
                  }
                  if(port == 2){
                    isLeftMotorMode = true;
                    isRightMotorMode = true;
                    motor_dirL = LEFT_MOTOR_BWD;
                    motor_dirR = RIGHT_MOTOR_BWD;   
                  }
                  if(port == 3){
                    isRightMotorMode = true;
                    motor_dirR = RIGHT_MOTOR_BWD;                     
                  }                       
                }
                else                            // 시계 (정방향)
                {
                  if(port == 1){
                    isLeftMotorMode = true;
                    motor_dirL = LEFT_MOTOR_FWD;
                  }
                  if(port == 2){
                    isLeftMotorMode = true;
                    isRightMotorMode = true;
                    motor_dirL = LEFT_MOTOR_FWD;
                    motor_dirR = RIGHT_MOTOR_FWD;   
                  }
                  if(port == 3){
                    isRightMotorMode = true;
                    motor_dirR = RIGHT_MOTOR_FWD;                     
                  }  
                }
                break;
        case 2: motorSpeed = readShort(9);     // DC 모터 속도 정하기  
                if(motorSpeed == 0) 
                {
                  if(port == 1){
                    isLeftMotorMode = false;
                    stepper_L.stop(); //motor stop 
                    stepper_L.disableOutputs(); //motor power disconnect, so motor led will turn off
                  }
                  if(port == 2){
                    isLeftMotorMode = false;
                    isRightMotorMode = false;
                    stepper_L.stop();
                    stepper_R.stop();
                    stepper_L.disableOutputs();
                    stepper_R.disableOutputs();    
                  }
                  if(port == 3){
                    isRightMotorMode = false;
                    stepper_R.stop();
                    stepper_R.disableOutputs();                          
                  }           
                }
                else 
                {
                  if(port == 1){
                    speedLeft = motorSpeed;   
                  }
                  if(port == 2){
                    speedLeft = motorSpeed;  
                    speedRight = motorSpeed;   
                  }
                  if(port == 3){
                    speedRight = motorSpeed;                     
                  }
                }
                break;
        case 3:   
                if(port == 1){
                  isLeftMotorMode = false;
                  stepper_L.stop(); //motor stop 
                  stepper_L.disableOutputs(); //motor power disconnect, so motor led will turn off
                }
                  if(port == 2){
                  isLeftMotorMode = false;
                  isRightMotorMode = false;
                  stepper_L.stop();
                  stepper_R.stop();
                  stepper_L.disableOutputs();  
                  stepper_R.disableOutputs();  
                  }
                if(port == 3){
                  isRightMotorMode = false;
                  stepper_R.stop();
                  stepper_R.disableOutputs();                          
                }           
                break;    
        case 4:   
                motor_angle = readShort(9);      // DC 모터 방향 설정하기
                isLeftMotorMode = false;
                isRightMotorMode = false; 
                stepper_L.setCurrentPosition(0);  
                stepper_R.setCurrentPosition(0);  
                switch(motor_angle)
                {
                  case 0: 
                        ControlAngle = 200;           
                        break;
                  case 1: 
                        ControlAngle = 300;          
                        break;
                  case 2: 
                        ControlAngle = 400;           
                        break;
                  case 3: 
                        ControlAngle = 600;          
                        break;
                  case 4: 
                        ControlAngle = 800;           
                        break;
                  case 5: 
                        ControlAngle = 900;          
                        break;
                  case 6: 
                        ControlAngle = 1000;           
                        break;
                  case 7: 
                        ControlAngle = 1200;          
                        break;
                }
                
                if(port == 1){
                  isAngleRightMode = true;
                  motor_dirL = LEFT_MOTOR_BWD;
                  motor_dirR = RIGHT_MOTOR_FWD;  
                }
                if(port == 3){
                  ControlAngle = 0 - ControlAngle;
                  motor_dirL = LEFT_MOTOR_FWD;
                  motor_dirR = RIGHT_MOTOR_BWD;  
                  isAngleLeftMode = true;
                }
                break;                     
      }
      break;   
  }
}

void LED_Run(){
  Icobot_Leds.begin(); // Initialize the NeoPixel array in the Arduino's memory,
  Icobot_Leds.show(); // turn all pixels off, and upload to ring or string

  Icobot_Leds.setPixelColor(0, RLED, GLED, BLED); 
  Icobot_Leds.setPixelColor(1, RLED, GLED, BLED); 
  Icobot_Leds.setPixelColor(2, RLED, GLED, BLED); 
  Icobot_Leds.setPixelColor(3, RLED, GLED, BLED);   
  Icobot_Leds.show();
}

void Left_Motor_run(int Ldir, int Lspeed)
{
  stepper_L.move(Ldir);
  stepper_L.setSpeed(Lspeed);
  stepper_L.runSpeedToPosition();
}

void Right_Motor_run(int Rdir, int Rspeed)
{
  stepper_R.move(Rdir);
  stepper_R.setSpeed(Rspeed);
  stepper_R.runSpeedToPosition();
}

void Left_Angle_run(int Ldir, int Rdir,int Lspeed, int Angle)
{
  stepper_L.move(Ldir);
  stepper_R.move(Rdir);
  stepper_L.setSpeed(Lspeed);
  stepper_R.setSpeed(Lspeed);
  stepper_L.runSpeedToPosition();
  stepper_R.runSpeedToPosition();
  if(stepper_L.currentPosition() == Angle){
    isAngleLeftMode = false;
    stepper_L.stop();
    stepper_L.disableOutputs();  
  }
}

void Right_Angle_run(int Ldir, int Rdir,int Rspeed, int Angle)
{
  stepper_L.move(Ldir);
  stepper_R.move(Rdir);
  stepper_L.setSpeed(Rspeed);
  stepper_R.setSpeed(Rspeed);
  stepper_L.runSpeedToPosition();
  stepper_R.runSpeedToPosition();
  if(stepper_R.currentPosition() == Angle){
    isAngleRightMode = false;
    stepper_R.stop();
    stepper_R.disableOutputs();  
  }
}

//
void setTempHumidityMode(boolean mode) 
{
  isTempSensor = mode;
  if(!mode) isTempSensor = 0;
}

//
void callOK()
{
  writeSerial(0xff);
  writeSerial(0x55);
  writeEnd();
}

int pinNumber = 0;
//
void sendPinValues() 
{  
    sendSensorValue(pinNumber);
    callOK();
    pinNumber++;
    if(pinNumber >= 8){
      pinNumber = 0;
    }
  if(isTempSensor) 
  {
    sendTempHumidity();  
    callOK();
  }  
}

//
void AnalogValue(){
  Cds = analogRead(CdsPin);
  Sound = analogRead(SoundPin);
}
//
void IRValue(){
  digitalWrite(IrPin, HIGH);
  if((millis() - irtime) > 100){
    Front_Ir_Value = analogRead(Front_Ir);
    Side_Left_Ir_Value = analogRead(Side_Left_Ir);
    Side_Right_Ir_Value = analogRead(Side_Right_Ir);  
    Bottom_Right_Ir_Value = analogRead(Bottom_Right_Ir);
    Bottom_Middle_Ir_Value = analogRead(Bottom_Middle_Ir);
    Bottom_Left_Ir_Value = analogRead(Bottom_Left_Ir);
    digitalWrite(IrPin, LOW); 
    irtime = millis();
  }
}

//
void sendSensorValue(int pinNum) 
{
  if((millis() - nowtime) > 100){
    AnalogValue();
    IRValue();
    nowtime = millis();
  }
    writeHead();
  switch(pinNum)
  {
    case 0: 
        sendFloat(Cds);
//        Serial1.print(Cds);
//        Serial1.print("  :  ");
        break;
    case 1: 
        sendFloat(Bottom_Left_Ir_Value);
//        Serial1.print(Bottom_Left_Ir_Value);
//        Serial1.print("  :  ");
        break;
    case 2: 
        sendFloat(Front_Ir_Value);
//        Serial1.print(Front_Ir_Value);
//        Serial1.print("  :  ");
        break;
    case 3: 
        sendFloat(Bottom_Right_Ir_Value);
//        Serial1.print(Bottom_Right_Ir_Value);
//        Serial1.print("  :  ");
        break;
    case 4: 
        sendFloat(Sound);
//        Serial1.print(Sound);
//        Serial1.print("  :  ");
        break;
    case 5: 
        sendFloat(Side_Right_Ir_Value);
//        Serial1.print(Side_Right_Ir_Value);
//        Serial1.print("  :  ");
        break;
    case 6: 
        sendFloat(Bottom_Middle_Ir_Value);
//        Serial1.print(Bottom_Middle_Ir_Value);
//        Serial1.print("  :  ");
        break;
    case 7: 
        sendFloat(Side_Left_Ir_Value);
//        Serial1.println(Side_Left_Ir_Value);
        break;
  }
  writeSerial(pinNum);
  writeSerial(SENSOR);
  writeEnd();
}

//
void sendTempHumidity()
{
  int value = 0;
  DHT dht(dhtpin, DHTTYPE);
  delay(1);

  switch(dhtmode)
  {
    case _HUMID: 
          value = dht.readHumidity();
          break;
    case _TEMP_F:
          value = dht.readTemperature();  
          value = value*(9/5)+32;
          break;
    case _TEMP_C:
          value = dht.readTemperature();   
          break;
  }

  writeHead();
  sendFloat(value);
  writeSerial(dhtpin);    
  writeSerial(dhtmode);  
  writeSerial(TEMP);
  writeEnd();  
}

//
void writeBuffer(int index,unsigned char c)
{
  buffer[index] = c;
}

//
void writeHead()
{
  writeSerial(0xff);
  writeSerial(0x55);
}

//
void writeEnd(){
  Serial.println();
}

//
void writeSerial(unsigned char c)
{
  Serial.write(c);
}

//
void sendString(String s)
{
  int l = s.length();
  writeSerial(4);
  writeSerial(l);
  for(int i=0;i<l;i++) writeSerial(s.charAt(i));
}

//
void sendFloat(float value)
{ 
  writeSerial(2);
  val.floatVal = value;
  writeSerial(val.byteVal[0]);
  writeSerial(val.byteVal[1]);
  writeSerial(val.byteVal[2]);
  writeSerial(val.byteVal[3]);
}

//
void sendShort(double value){
  writeSerial(3);
  valShort.shortVal = value;
  writeSerial(valShort.byteVal[0]);
  writeSerial(valShort.byteVal[1]);
}

//
short readShort(int idx)
{
  valShort.byteVal[0] = readBuffer(idx);
  valShort.byteVal[1] = readBuffer(idx+1);
  return valShort.shortVal; 
}

//
float readFloat(int idx)
{
  val.byteVal[0] = readBuffer(idx);
  val.byteVal[1] = readBuffer(idx+1);
  val.byteVal[2] = readBuffer(idx+2);
  val.byteVal[3] = readBuffer(idx+3);
  return val.floatVal;
}

//
long readLong(int idx)
{
  val.byteVal[0] = readBuffer(idx);
  val.byteVal[1] = readBuffer(idx+1);
  val.byteVal[2] = readBuffer(idx+2);
  val.byteVal[3] = readBuffer(idx+3);
  return val.longVal;
}

//
void setPortWritable(int pin) 
{
  pinMode(pin, OUTPUT);
}

//
void callDebug(char c)
{
  writeSerial(0xff);
  writeSerial(0x55);
  writeSerial(c);
  writeEnd();
}
