#include "Adafruit_NeoPixel.h"
#include "DHT.h"
#include "AccelStepper.h"

//////////////////Motor 관련 변수///////////////////////////////
#define Left_Motor_A  4     // IN1 on the ULN2003 driver 1
#define Left_Motor_B  12     // IN2 on the ULN2003 driver 1
#define Left_Motor_C  5     // IN3 on the ULN2003 driver 1
#define Left_Motor_D  13     // IN4 on the ULN2003 driver 1

#define Right_Motor_A  17     // IN1 on the ULN2003 driver 2
#define Right_Motor_B  16     // IN2 on the ULN2003 driver 2
#define Right_Motor_C  14     // IN3 on the ULN2003 driver 2
#define Right_Motor_D  11     // IN4 on the ULN2003 driver 2

#define LEFT_MOTOR_FWD -100
#define LEFT_MOTOR_BWD 100
#define RIGHT_MOTOR_FWD 100
#define RIGHT_MOTOR_BWD -100

#define MOTOR_MAX_SPEED 10000.0

int motor_dirL = LEFT_MOTOR_FWD;
int motor_dirR = RIGHT_MOTOR_FWD;

int speedLeft = 600;        // stop speed
int speedRight = 600;       // stop speed

AccelStepper stepper_L(8, Left_Motor_D, Left_Motor_B, Left_Motor_C, Left_Motor_A);
AccelStepper stepper_R(8, Right_Motor_D, Right_Motor_B, Right_Motor_C, Right_Motor_A);

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

// SENSOR Type
#define ALIVE       0
#define DIGITAL     1
#define ANALOG      2
#define BUZZER      3
#define SERVO       4
#define TONE        5
#define TEMP        6
#define USONIC      7
#define TIMER       8
#define RD_BT       9
#define WRT_BT      10
#define RGBLED      11
#define MOTOR       12
        
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

// DC Motor
#define MOTOR_CW        2     // 정방향
#define MOTOR_CCW       1     // 역방향
#define MOTOR_STOP      3     // 정지
int motorSpeed = 600;
int motor_dir = 0;

// Temp Sensor
int dhtpin = 7;
int dhtmode = 0;

// Buzzer State
int BuzzerState = BUZZER_OFF;

// Ultrasonic Sensor
int trigPin = 6;
int echoPin = 2;

//////////////////LED 관련 변수///////////////////////////////
#define PinPix A9 // WS2812에 연결하는데 사용하는 pin 번호
#define NumPix 4 // 링에 연결되어 있는 WS2812 LED 갯수
Adafruit_NeoPixel Icobot_Leds = Adafruit_NeoPixel(NumPix, PinPix, NEO_GRB + NEO_KHZ800);

// RGB LED 모듈 
int BLED = 0;
int GLED = 0;
int RLED = 0;

// Function/Pins
int analogs[6]={0,0,0,0,0,0};
int digitals[14]={0,0,0,0,0,0,0,0,0,0,0,0,0,0};

// Variables
float lastUltrasonic = 0;

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
boolean isUltrasonic = false;
boolean isTempSensor = false;
boolean isLeftMotorMode = false;
boolean isRightMotorMode = false;

// Comm. buffer
// buffer[4]   [5]  [6]   [7]   [8]
int cmdtype, device, port, mode, dir;

//
void setup()
{
  Serial.begin(115200);
  Serial1.begin(9600);
  
  initPorts();
  
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
void initPorts() 
{
  for (int pinNumber = 0; pinNumber < 14; pinNumber++) 
  {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
}

//
void loop()
{
  while (Serial.available()) 
  {
    if (Serial.available() > 0) 
    {
      char serialRead = Serial.read();
      setPinValue(serialRead&0xff);
      //Serial1.print(serialRead&0xff);
    }
  } 
  delay(15);
  sendPinValues();
  delay(10);
  if(isLeftMotorMode == true){
    Left_Motor_run(motor_dirL, speedLeft);
  }
  if(isRightMotorMode == true){
    Right_Motor_run(motor_dirR, speedRight);
  }
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
void setUltrasonicMode(boolean mode) 
{
  isUltrasonic = mode;
  if(!mode) lastUltrasonic = 0;
}

//
void setTempHumidityMode(boolean mode) 
{
  isTempSensor = mode;
  if(!mode) isTempSensor = 0;
}


//
void parseData() 
{
  isStart = false;
  
  cmdtype = readBuffer(4);
  device = readBuffer(5);
  port = readBuffer(6);
  mode = readBuffer(7); 

  //             
  switch(cmdtype)
  {
    case GET:
        if(device == TEMP) 
        {
//          Serial1.print("Start TEMP     ");
//          Serial1.println(dhtpin);
          setTempHumidityMode(true);                  
          dhtpin = port;                        
        }       
        else if(device == USONIC) 
        {
          setTempHumidityMode(false);          
          if(!isUltrasonic) 
          {
            setUltrasonicMode(true);
            trigPin = readBuffer(6);
            echoPin = readBuffer(7);
            digitals[trigPin] = 1;
            digitals[echoPin] = 1;
            pinMode(trigPin, OUTPUT);
            pinMode(echoPin, INPUT);
            delay(30);
          } 
          else 
          {
            int trig = readBuffer(6);
            int echo = readBuffer(7);
            if(trig != trigPin || echo != echoPin) 
            {
              digitals[trigPin] = 0;
              digitals[echoPin] = 0;
              trigPin = trig;
              echoPin = echo;
              digitals[trigPin] = 1;
              digitals[echoPin] = 1;
              pinMode(trigPin, OUTPUT);            
              pinMode(echoPin, INPUT);
              delay(30);
            }
          }
        } 
        else if(port == trigPin || port == echoPin) 
        {
          setTempHumidityMode(false);          
          setUltrasonicMode(false);
          digitals[port] = 0;
        } 
        else 
        {
          setTempHumidityMode(false);              
          setUltrasonicMode(false);        
          digitals[port] = 0;
        }      
        break;
        
    case SET:               
        runModule(device);
        callOK();
        break;
    
    case RESET:
        callOK();
        break;
  }
}

//
void runModule(int device) 
{
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
  int hz = 0, ms = 0, v = 0;
  if(port == trigPin || port == echoPin) setUltrasonicMode(false);

//  Serial1.print("device     ");
//  Serial1.println(device);
  switch(device)
  {
    case DIGITAL: 
      setPortWritable(port);
      digitalWrite(port, mode);
      break;
            
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
      if(ms > 0) tone(port, hz, ms);
      else noTone(port);
      break;
            
    case SERVO:
      break;
            
    case TIMER:
      lastTime = millis()/1000.0; 
      break;
            
    case RGBLED: 
      RLED = readBuffer(7);
      GLED = readBuffer(8);
      BLED = readBuffer(9);
      LED_Run();
      break;   

    case MOTOR:
      mode = readBuffer(7);
      switch(mode)
      {
        case 1: motor_dir = readBuffer(8);      // DC 모터 방향 설정하기
                if(motor_dir == MOTOR_CCW)      // 반시계 (역방향) 
                {
                  if(port == 1){
                    isLeftMotorMode = true;
                    motor_dirL = LEFT_MOTOR_BWD;
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
                  if(port == 3){
                    isRightMotorMode = true;
                    motor_dirR = RIGHT_MOTOR_FWD;                     
                  }  
                }
                break;
        case 2: motorSpeed = readBuffer(8);     // DC 모터 속도 정하기  
                if(motorSpeed == 0) 
                {
                  if(port == 1){
                    isLeftMotorMode = false;
                    stepper_L.stop(); //motor stop 
                    stepper_L.disableOutputs(); //motor power disconnect, so motor led will turn off
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
                    isLeftMotorMode = true;
                    speedLeft = motorSpeed*16;   
                  }
                  if(port == 3){
                    isRightMotorMode = true;
                    speedRight = motorSpeed*16;                     
                  }
                }
                break;
        case 3:   
                if(port == 1){
                  isLeftMotorMode = false;
                  stepper_L.stop(); //motor stop 
                  stepper_L.disableOutputs(); //motor power disconnect, so motor led will turn off
                }
                if(port == 3){
                  isRightMotorMode = false;
                  stepper_R.stop();
                  stepper_R.disableOutputs();                          
                }           
                break;                    
      }
      break;               
  }
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

void LED_Run(){
  Icobot_Leds.begin(); // Initialize the NeoPixel array in the Arduino's memory,
  Icobot_Leds.show(); // turn all pixels off, and upload to ring or string
  
  Icobot_Leds.setPixelColor(0, RLED, GLED, BLED); 
  Icobot_Leds.setPixelColor(1, RLED, GLED, BLED); 
  Icobot_Leds.setPixelColor(2, RLED, GLED, BLED); 
  Icobot_Leds.setPixelColor(3, RLED, GLED, BLED);   
  Icobot_Leds.show();
}
//
void callOK()
{
  writeSerial(0xff);
  writeSerial(0x55);
  writeEnd();
}

//
void sendPinValues() 
{  
  int pinNumber = 0;
  
  if(isLeftMotorMode == false && isRightMotorMode == false){
    for (pinNumber = 0; pinNumber < 12; pinNumber++) 
    {
      if(digitals[pinNumber] == 0) 
      {
        sendDigitalValue(pinNumber);
        callOK();
      }
    }
  }
  for (pinNumber = 0; pinNumber < 6; pinNumber++) 
  {
    if(analogs[pinNumber] == 0) 
    {
      sendAnalogValue(pinNumber);
      callOK();
    }
  }
  
  if(isUltrasonic) 
  {
    sendUltrasonic();  
    callOK();
  }

  if(isTempSensor) 
  {
    sendTempHumidity();  
    callOK();
  }
}

//
void sendUltrasonic() 
{
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  float value = pulseIn(echoPin, HIGH, 30000) / 29.0 / 2.0;

  if(value == 0) value = lastUltrasonic;
  else lastUltrasonic = value;

  writeHead();
  sendFloat(value);
  writeSerial(trigPin);
  writeSerial(echoPin);
  writeSerial(USONIC);
  writeEnd();
}

//
void sendTempHumidity()
{
  int value;   
  
  if(dhtpin == 4){
    DHT dht(7, DHTTYPE);  
    delay(30); 
    value = dht.readTemperature();    
//    Serial1.print("Temperature : "); 
//    Serial1.println(value);
  }
  else{
    DHT dht(7, DHTTYPE);   
    delay(30);
    value = dht.readHumidity();
//    Serial1.print("Humidity : "); 
//    Serial1.println(value); 
  }

  writeHead();
  sendFloat(value);
  writeSerial(dhtpin);    
  writeSerial(dhtmode);  
  writeSerial(TEMP);
  writeEnd();  
}

//
void sendDigitalValue(int pinNumber) 
{
  pinMode(pinNumber,INPUT);
  writeHead();
  sendFloat(digitalRead(pinNumber));  
  writeSerial(pinNumber);
  writeSerial(DIGITAL);
  writeEnd();
}

//
void sendAnalogValue(int pinNumber) 
{
  if(pinNumber == 0 || pinNumber == 4){
    writeHead();
    sendFloat(analogRead(pinNumber)); 
    writeSerial(pinNumber);
    writeSerial(ANALOG);
    writeEnd();
  }
  else{
    digitalWrite(IrPin, HIGH);
    delayMicroseconds(100);
    writeHead();
    sendFloat(analogRead(pinNumber)); 
    writeSerial(pinNumber);
    writeSerial(ANALOG);
    writeEnd();
    digitalWrite(IrPin, LOW); 
  }
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
  if(digitals[pin] == 0) 
  {
    digitals[pin] = 1;
    pinMode(pin, OUTPUT);
  } 
}

//
void callDebug(char c)
{
  writeSerial(0xff);
  writeSerial(0x55);
  writeSerial(c);
  writeEnd();
}
