/*
    Arduino Think Board Function Program
      Date : 2018/12/16~2019/01/20
      Author : J.C.LEE (NDSS)

            [Revision history]
      2018/12/16 Draft Version 1.00
      2018/12/17 Add Uart Test Code 1.01
      2018/12/18 Add Pin map, ADC/Port Test 1.02
      2018/12/19 Fixed bug about Pin map 1.03
      2018/12/22 Add Ultrasonic Sensor Test 1.04      
      2018/12/25 Add Entry UART Protocol 2.00 
      2018/12/31 Update for Buzzer OnOff 2.01       
	    2019/01/06 Add Temp/USonic Code 2.05
      2019/01/13 Add RGB/Servo Motor Control 2.06
      2019/01/14 Add Servo Motor Control SG90/180 support 
	    2019/01/15 Fixed bug on Servo Motor Setting
      2019/01/19 Final Version
     
*/

#include <SoftwareSerial.h>
#include <Servo.h>
#include <DHT.h>

//Buzzer Set
#define	BUZ_PORT		10
#define BUZZER_ON   1
#define BUZZER_OFF  0

//
// Temperature/Humidity
//
#define DHTTYPE     DHT11
#define _HUMID       0
#define _TEMP_F      1
#define _TEMP_C      2

// Servo Motor Default Min/Max
#define SERVO_MIN   600   
#define SERVO_MAX   2400

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
int motorSpeed = 127;
int motor_dir = 0;

// Temp Sensor
int dhtpin = 2;
int dhtmode = 0;

// Buzzer State
int BuzzerState = BUZZER_OFF;

// Servo Motor Objects
Servo servos[8]; 
Servo sv;
int angle; 

// Ultrasonic Sensor
int trigPin = 6;
int echoPin = 2;

// RGB LED 모듈 
const int BLED = 13;
const int GLED = 12;
const int RLED = 11;

// Function/Pins
int analogs[6]={0,0,0,0,0,0};
int digitals[14]={0,0,0,0,0,0,0,0,0,0,0,0,0,0};
int servo_pins[8]={0,0,0,0,0,0,0,0};

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
boolean isServoMode = false;

// Comm. buffer
// buffer[4]   [5]  [6]   [7]   [8]
int cmdtype, device, port, mode, dir;

//
void setup()
{
  Serial.begin(115200);
  initPorts();
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
    }
  } 
  
  delay(15);
  sendPinValues();
  delay(10);
}

//
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
void setServoMode(boolean mode) 
{
  isServoMode = mode;
  if(!mode) isServoMode = 0;
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
  if(device == SERVO)
  {
    setPortWritable(port);   
    sv = servos[searchServoPin(port)];

    switch(cmdtype)
    {
      case GET:
              if(mode < 2) sv.attach(port, SERVO_MIN, SERVO_MAX);
              else sv.attach(port);
              break;
      case SET:
              if(mode < 4) sv.attach(port, SERVO_MIN, SERVO_MAX);
              else sv.attach(port);      
              break;                    
    }   
  }

  //             
  switch(cmdtype)
  {
    case GET:
        if(device == TEMP) 
        {
          setTempHumidityMode(true);                  
          dhtpin = port;    
          dhtmode = mode;                          
        }
        else if(device == SERVO)
        {
          setServoMode(true);   
          angle = sv.read();   
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
          setServoMode(false);          
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
            if(mode == 0) break;
            dir = readBuffer(8);
            switch(mode)
            {
              case 1:              
              case 4: angle = readBuffer(8);
                      if(angle >= 0 && angle <= 180) 
                      {
                        sv.write(angle);  
                        delay(15);        
                      }
                      break;      
              case 2:                             
              case 5: angle = sv.read();  
                      if(dir == 1)       // LEFT(?�계 방향)
                      {
                        if(angle <= 0) return;                
                        sv.write(--angle);  
                        delay(15);                                                       
                      }
                      else              // RIGHT(반시�?방향) 
                      {
                        if(angle >= 180) return;
                        sv.write(++angle);
                        delay(15);  
                      }                      
                      break;    
              case 3:                                    
              case 6: sv.write(90);
                      delay(15);      
                      break;                   
            }
            break;
            
    case TIMER:
            lastTime = millis()/1000.0; 
            break;
            
    case RGBLED: 
            setPortWritable(port);   
            setPortWritable(port+1); 
            setPortWritable(port+2);                           
            analogWrite(RLED, readBuffer(7));
            analogWrite(GLED, readBuffer(8));
            analogWrite(BLED, readBuffer(9));                   
            break;   

    case MOTOR:
            setPortWritable(port);   
            setPortWritable(port+4);          
            pinMode(port+4, OUTPUT);      // CW
            pinMode(port, OUTPUT);        // CCW             
            digitalWrite(port+4, HIGH);
            digitalWrite(port, HIGH); 
                 
            mode = readBuffer(7);
            switch(mode)
            {
              case 1: motor_dir = readBuffer(8);      // DC 모터 방향 설정하기
                      if(motor_dir == MOTOR_CCW)      // 반시계 (역방향) 
                      {
                        digitalWrite(port+4, LOW);
                        analogWrite(port, motorSpeed);                         
                      }
                      else                            // 시계 (정방향)
                      {
                        digitalWrite(port, LOW);
                        analogWrite(port+4, motorSpeed);   
                      }
                      break;
              case 2: motorSpeed = readBuffer(8);     // DC 모터 속도 정하기  
                      if(motorSpeed == 0) 
                      {
                        digitalWrite(port+4, HIGH);
                        digitalWrite(port+4, HIGH);                      
                      }
                      else 
                      {
                        if(motor_dir == MOTOR_CCW) 
                        {
                          digitalWrite(port+4, LOW);
                          analogWrite(port, motorSpeed);                             
                        }
                        else 
                        {
                          digitalWrite(port, LOW);
                          analogWrite(port+4, motorSpeed); 
                        }
                      }           
                      break;
              case 3: digitalWrite(port+4, HIGH);
                      digitalWrite(port+4, HIGH);          
                      break;                    
            }
            break;               
  }
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
  for (pinNumber = 0; pinNumber < 12; pinNumber++) 
  {
    if(digitals[pinNumber] == 0) 
    {
      sendDigitalValue(pinNumber);
      callOK();
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

  if(isServoMode) 
  {
    sendServoAngle();  
    callOK();      
  } 
  
/*
 // for DEBUG
  if(dev == RGBLED)
  {
    writeHead();   
    writeSerial(r);
    writeSerial(g);
    writeSerial(b);
    writeSerial(pinNumber);  
    writeSerial(RGBLED);          
    writeSerial(0xff);
    writeSerial(0x55);    
    writeEnd();    
  }
     */
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
  DHT dht(dhtpin, DHTTYPE);    
  delay(30);

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
void sendServoAngle() 
{
  writeHead();
  sendFloat(angle); 
  writeSerial(port);  
  writeSerial(SERVO);
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
  writeHead();
  sendFloat(analogRead(pinNumber));  
  writeSerial(pinNumber);
  writeSerial(ANALOG);
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
int searchServoPin(int pin)
{
  for(int i=0;i<8;i++)
  {
    if(servo_pins[i] == pin) return i;

    if(servo_pins[i]==0)
    {
      servo_pins[i] = pin;
      return i;
    }
  }
  return 0;
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


