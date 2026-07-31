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
      2024/02/20 Fixed errors in final version ___  Saycheese...
     
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
#define LASER       13
        
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
int motorSpeed = 100;
int motor_dir = 0;

// Temp Sensor
int dhtPin = 0;
int dhtmode = 0;


// Buzzer State
int BuzzerState = BUZZER_OFF;

// Servo Motor Objects
Servo servos[8]; 
int angle; 
int servo_speed = 0;

// Ultrasonic Sensor
int trigPin=0;
int echoPin=0;

// RGB LED 모듈 
const int BLED = 13;
const int GLED = 12;
const int RLED = 11;

// Function/Pins
int analogs[6]={0,0,0,0,0,0};
int digitals[14]={0,0,0,0,0,0,0,0,0,0,0,0,0,0};
int servo_pins[8]={0,0,0,0,0,0,0,0};

// Variables
float lastUltrasonic[4] = {0, 0, 0, 0};

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

// Port Init
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

// Pin setting & Parse
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

// Read Buffer
unsigned char readBuffer(int index)
{
  return buffer[index]; 
}

// UltraSonic Setting
void setUltrasonicMode(boolean mode) 
{
  isUltrasonic = mode;
  if(!mode) lastUltrasonic[port] = 0;
}

// TempHumidity Setting
void setTempHumidityMode(boolean mode) 
{
  isTempSensor = mode;
  if(!mode) isTempSensor = 0;
}

//  Sevor Setting
void setServoMode(boolean mode) 
{
  isServoMode = mode;
  if(!mode) isServoMode = 0;
}

// Data Parsing
void parseData() 
{
  isStart = false;
  
  cmdtype = readBuffer(4);
  device = readBuffer(5);
  port = readBuffer(6);
  mode = readBuffer(7); 

  /*
  if(device == SERVO)
  {
    port += 2;
    setPortWritable(port);
    Servo sv = servos[searchServoPin(port)];

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
*/
  switch(cmdtype)
  {
    case GET:
        if(device == TEMP)          // Get TempHunidity Sensor value 
        {
          if (!isTempSensor) {
            setTempHumidityMode(true);
            dhtPin = port + 2;
            DHT  dht(dhtPin, DHT11);
            dht.begin();
          } else {
            if (dhtPin != port + 2){
              dhtPin = port + 2;
              DHT  dht(dhtPin, DHT11);
              dht.begin();
            }
          }
        }
        else if(device == SERVO) // Get Servor Angle  
        {

          if (!isServoMode){
             Servo sv = servos[searchServoPin(port+2)];
             angle = sv.read();
             delay(15);
          }
//          if (mode == 1) {
//            angle = servo_speed;
//            break;
//          }
//          setPortWritable(port);
          
//          setServoMode(true);
//          angle = sv.read();
        }
        else if(device == USONIC)  // Get Ultra Sonic Sensor Value 
        {
          setTempHumidityMode(false);          
          if(!isUltrasonic)       // Ultra Sonic Sensor init Setting 
          {
            setUltrasonicMode(true);
            trigPin = readBuffer(6) + 6;
            echoPin = readBuffer(6) + 2;
            digitals[trigPin] = 1;
            digitals[echoPin] = 1;
            pinMode(trigPin, OUTPUT);
            pinMode(echoPin, INPUT);
          } 
          else 
          {
            int trig = readBuffer(6) + 6;
            int echo = readBuffer(6) + 2;
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
            }
          }
        } 
        else
        {
          setTempHumidityMode(false);              
          setUltrasonicMode(false);
          setServoMode(false);    
          digitals[port] = 0;
        }      
        break;
        
    case SET:            // Run Module   
        runModule(device);
        callOK();
        break;
    
    case RESET:
        callOK();
        break;
  }
}

// SET 
void runModule(int device) 
{
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
  int hz = 0, ms = 0, v = 0;
  if(port == trigPin || port == echoPin) setUltrasonicMode(false);


  switch(device)
  { 
    case DIGITAL :
    case LASER:               // Digital Ouput Setting
    {  
      setPortWritable(port);
      digitalWrite(port, mode);
    } 
    break;   
    case RGBLED:            // RGBLED Ouput Setting R:11, G:12, B:13
    {
    setPortWritable(RLED);   
    setPortWritable(GLED); 
    setPortWritable(BLED);                          
    analogWrite(RLED, readBuffer(7));
    analogWrite(GLED, readBuffer(8));
    analogWrite(BLED, readBuffer(9));     
    }              
    break;   
    case MOTOR:            //  DC Motor Setting 
        {
          int motorPinA = readBuffer(6) + 2;
          int motorPinB = readBuffer(6) + 6;
          int motorPWM;
          pinMode(motorPinA, OUTPUT);      // CW
          pinMode(motorPinB, OUTPUT);      // CCW             
          digitalWrite(motorPinA, HIGH);
          digitalWrite(motorPinB, HIGH);
          setPortWritable(motorPinA);
          setPortWritable(motorPinB);     
          mode = readBuffer(7);
          switch(mode)
          {
            case 1: motor_dir = readBuffer(8);      // DC 모터 방향 설정하기
              if(motorPinA != 3){
                if(motor_dir == MOTOR_CCW)      // 반시계 (역방향) 
                { 
                  digitalWrite(motorPinA, LOW);
                  digitalWrite(motorPinB, HIGH);
                  analogWrite(motorPinB, motorSpeed);              
                }
                else                            // 시계 (정방향)
                {
                  digitalWrite(motorPinA, HIGH);
                  digitalWrite(motorPinB, LOW);
                  analogWrite(motorPinA, motorSpeed);            
                }
              }
              else  // Port 2의 역방향 설정 금지...
              {
                digitalWrite(motorPinA, LOW);
                digitalWrite(motorPinB, HIGH);
                analogWrite(motorPinA, motorSpeed);
              }
                  
              break;
            case 2: motorSpeed = readBuffer(8)*2.5;     // DC 모터 속도 정하기  
        
              if(motorSpeed == 0) 
              {
                digitalWrite(motorPinA, HIGH);
                digitalWrite(motorPinB, HIGH);             
              } //end of if(motorSpeed == 0) 
              else if(motorPinA != 3){
                if(motor_dir == MOTOR_CCW) 
                {
                  digitalWrite(motorPinA, LOW);
                  digitalWrite(motorPinB, HIGH);
                  analogWrite(motorPinB, motorSpeed);                         
                } else {
                  digitalWrite(motorPinA, HIGH);
                  digitalWrite(motorPinB, LOW);
                  analogWrite(motorPinA, motorSpeed); 
                } 
              } else {
                digitalWrite(motorPinA, HIGH);
                digitalWrite(motorPinB, LOW);
                analogWrite(motorPinA, motorSpeed);
              }  //end of if(motor_dir == MOTOR_CCW)  else   
              break;
            case 3: digitalWrite(motorPinA, HIGH);
                    digitalWrite(motorPinB, HIGH);          
                    break;                    
           }  // end of switch(mode)   
        }
        break;     
            
    case BUZZER:        // BUZZER Setting
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
            
    case TONE:           //  Launch tone menu with buzzer
            setPortWritable(port);
            hz = readShort(7);
            ms = readShort(9);
            if(ms > 0) tone(port, hz, ms);
            else noTone(port);
            break;

    case SERVO:         //  Launch Servo
          if(mode == 0 ) break;
          if (port == 1)
             port = 3;
          else
             port = 5;
          setPortWritable(port);  
          mode = readBuffer(7);
          Servo sv = servos[searchServoPin(port)];
          sv.attach(port); 
          
          // thinkboard_digital_set_servo_angle
          if (mode == 2)  
              angle = readBuffer(8);
          
          //  thinkboard_digital_set_servo_direction
          else if (mode == 3)  
          { 
            int direction = readBuffer(8);
            angle = sv.read();
            if (direction == 0)
            {
              angle = angle + 1;
              if (angle >  180)  angle = 180;
            } else {
              angle = angle - 1;
              if (angle < 0) angle = 0;
            } 
          } 

          // thinkboard_digital_set_servo_stop
          else if (mode == 4)  
             angle = 90;  

          // thinkboard_digital_set_servo_360_angle   
          else if (mode == 5)  
          { 
            servo_speed = readBuffer(8);
            angle = servo_speed;
            
          // thinkboard_digital_set_servo_360_stop
          } else if(mode == 6) 
             angle = 91;  
          sv.write(angle);
          delay(15);
          break;


    case TIMER:
            lastTime = millis()/1000.0; 
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

//   Digital Pin value Setting
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

// Get Ultra Sonic Sensor Value & Transfer
void sendUltrasonic() 
{
//  trigPin = 9;
//  echoPin = 5; 
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  unsigned long duration = pulseIn(echoPin, HIGH);
  float value = ((float) (340*duration) / 10000) / 2;

  lastUltrasonic[port] = value;

  writeHead();
  for (int i =0 ;i<4;i++){
    sendFloat(lastUltrasonic[i]);
  }  
  writeSerial(port);
  writeSerial(USONIC);
  writeEnd();

}

// Get TempHumidity Sensor Value & Transfer
void sendTempHumidity()
{
  int humi, temp;
  DHT dht(dhtPin, DHTTYPE);    
  delay(30);
  humi = dht.readHumidity();
  temp = dht.readTemperature();  

  writeHead();

  sendFloat(temp);
  sendFloat(humi);
  sendFloat(temp);
  sendFloat(humi);
  sendFloat(temp);
  sendFloat(humi);
  sendFloat(temp);
  sendFloat(humi);
  writeSerial(port);  
  writeSerial(dhtmode);
  writeSerial(TEMP);
  writeEnd();
}

// Get Servo angle Transfer
void sendServoAngle() 
{
  writeHead();
  sendFloat(angle); 
  writeSerial(port+2);  
  writeSerial(SERVO);
  writeEnd();
}

// Get Digital Pin Value & Transfer
void sendDigitalValue(int pinNumber) 
{
  pinMode(pinNumber,INPUT);
  writeHead();
  sendFloat(digitalRead(pinNumber));  
  writeSerial(pinNumber);
  writeSerial(DIGITAL);
  writeEnd();
}

// Get Anglog Pin Value(Light, Sound, variable resistance ... ) & Transfer
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

// transmission data head
void writeHead()
{
  writeSerial(0xff);
  writeSerial(0x55);
}

//  transmission data end
void writeEnd(){
  Serial.println();
}

// Charater Transfer
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

