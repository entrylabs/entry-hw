
#include "Arduino.h"

// LCD 라이브러리
#include "LiquidCrystal_I2C.h"

#include <inttypes.h>
#include "Print.h" 

// 서보 라이브러리
#include <Servo.h>
//#include <SoftwareSerial.h>  

//LiquidCrystal_I2C lcd(0x3f,16,2);  // set the LCD address to 0x27 for a 16 chars and 2 line display
LiquidCrystal_I2C lcd(0x27,16,2);  // set the LCD address to 0x27 for a 16 chars and 2 line display
// SoftwareSerial mySerial(3, 2); // RX, TX

// 동작 상수
#define ALIVE 0
#define DIGITAL 1
#define ANALOG 2
#define PWM 3
#define SERVO_PIN 4
#define TONE 5
#define PULSEIN 6
#define ULTRASONIC 7
#define TIMER 8
#define LCD 9
#define LCD_COMMAND 10

// 여기서부터 구현 해야 함
#define SOUND_IN 11
#define MOTOR_LEFT 12
#define MOTOR_RIGHT 13


// 상태 상수
#define GET 1
#define SET 2
#define RESET 3

// Motor 제어
#define PHASE_B_L     8
#define PHASE_A_R     7
#define ENABLE_B_L    6
#define ENABLE_A_R    5

// PHASE : LOW,   ENABLE : PWM --> OUT1 : PWM, OUT2 : LOW
// PHASE : HIGH,  ENABLE : PWM --> OUT1 : LOW, OUT2 : PWM

// val Union
union{ 
  byte byteVal[4];
  float floatVal;
  long longVal;
}val;

// valShort Union
union{
  byte byteVal[2];
  short shortVal;
}valShort;

// 전역변수 선언 시작
Servo servos[8];  

//울트라 소닉 포트
int trigPin = 7;
int echoPin = 8;

// 사운드
// #define SOUND_IN  A2

//포트별 상태
#define MAX_ANALOG_PIN 8
#define MAX_DIGITAL_PIN 14
int analogs[8]={0,0,0,0,0,0,0,0};
int digitals[14]={0,0,0,0,0,0,0,0,0,0,0,0,0,0};
int servo_pins[8]={0,0,0,0,0,0,0,0};

// 울트라소닉 최종 값
float lastUltrasonic = 0;

// 버퍼
char buffer[52];
unsigned char prevc=0;

byte index = 0;
byte dataLen;

double lastTime = 0.0;
double currentTime = 0.0;

uint8_t command_index = 0;

boolean isStart = false;
boolean isUltrasonic = false;
boolean isLeftMotormode = false;
boolean isRightMotormode = false;
boolean isSoundInmode = false;
int sound_input_pin_no = 2;
boolean isOn = false;

const int sound_max9812_sampleWindow = 50; // Sample window width in mS (50 mS = 20Hz)
unsigned int sound_max9812_sample;
unsigned int sound_max9812_peak = 0;   // peak-to-peak level
// 전역변수 선언 종료


unsigned int lcd_val = 0;

void initPorts() {
  for (int pinNumber = 0; pinNumber < 14; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
}

void setup()
{
  initPorts();
  Serial.begin(115200);  
  // set the data rate for the SoftwareSerial port
  // mySerial.begin(115200);
  
  lcd.init(0x3f,16,2);
  //lcd.init(0x27,16,2);
  delay(700);

  
}

void loop()
{
  //mySerial.write("b");
  //delay(1000);  

#if 0
  if( isSoundInmode == false )
  {
    lcd.init(0x3f,16,2);
    //lcd.init();
    isSoundInmode = true;
    lcd.noBacklight();
  }  

  lcd.backlight();
  delay(1000);  
  lcd.print("123");
  delay(1000);  
  lcd.clear();  
#endif  
  


#if 1
  while (Serial.available()) 
  {
    if (Serial.available() > 0) 
    {
      char serialRead = Serial.read();
      setPinValue(serialRead&0xff);
      //mySerial.write("a");
    }        
  } 
  
  delay(1);
  sendPinValues();
  isSoundInmode = false;
  delay(1);

  //mySerial.write("a");
#endif

}

void setPinValue(unsigned char c) {
  if(c==0x55&&isStart==false){
    if(prevc==0xff){
      index=1;
      isStart = true;
    }    
  } else {    
    prevc = c;
    if(isStart) {
      if(index==2){
        dataLen = c; 
      } else if(index>2) {
        dataLen--;
      }
      
      writeBuffer(index,c);
    }
  }
    
  index++;
  
  if(index>51) {
    index=0; 
    isStart=false;
  }
    
  if(isStart&&dataLen==0&&index>3){  
    isStart = false;
    parseData(); 
    index=0;
  }
}

unsigned char readBuffer(int index){
  return buffer[index]; 
}

void parseData() {
  isStart = false;
  int idx = readBuffer(3);
  command_index = (uint8_t)idx;
  int action = readBuffer(4);
  int device = readBuffer(5);
  int port = readBuffer(6);

  /*
  lcd.clear();
  lcd.setCursor(0,0);

  lcd.print(readBuffer(4));
  lcd.print(",");
  lcd.print(readBuffer(5));
  lcd.print(",");
  lcd.print(readBuffer(6));
  lcd.print(",");
  lcd.print(readBuffer(7));
  lcd.print(",");
  lcd.print(readBuffer(8));
  lcd.print(",");
  lcd.print(readBuffer(9));
  lcd.print(",");
  lcd.print(readBuffer(10));
  */
  
 
  switch(action){
    case GET:{
      if(device == ULTRASONIC){
        if(!isUltrasonic) {
          setUltrasonicMode(true);
          trigPin = readBuffer(6);
          echoPin = readBuffer(7);
          digitals[trigPin] = 1;
          digitals[echoPin] = 1;
          pinMode(trigPin, OUTPUT);
          pinMode(echoPin, INPUT);
          delay(50);
        } else {
          int trig = readBuffer(6);
          int echo = readBuffer(7);
          if(trig != trigPin || echo != echoPin) {
            trigPin = trig;
            echoPin = echo;
            digitals[trigPin] = 1;
            digitals[echoPin] = 1;
            pinMode(trigPin, OUTPUT);            
            pinMode(echoPin, INPUT);
            delay(50);
          }
        }
      } else if(port == trigPin || port == echoPin) {
        setUltrasonicMode(false);
        digitals[port] = 0;
      } else {
        digitals[port] = 0;
      }
    }
    break;
    case SET:{
      runModule(device);
      callOK();
    }
    break;
    case RESET:{
      callOK();
    }
    break;
  }
}

void runModule(int device) {
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
  int port = readBuffer(6);
  int pin = port;

  if(pin == trigPin || pin == echoPin) {
    setUltrasonicMode(false);
  }
  
  switch(device){
    case DIGITAL:{      
      setPortWritable(pin);
      int v = readBuffer(7);
      digitalWrite(pin,v);
    }
    break;
    case PWM:{
      setPortWritable(pin);
      int v = readBuffer(7);
      analogWrite(pin,v);
    }
    break;
    case TONE:{
      setPortWritable(pin);
      int hz = readShort(7);
      int ms = readShort(9);
      if(ms>0) {
        tone(pin, hz, ms);
      } else {
        noTone(pin);
      }
    }
    break;
    case SERVO_PIN:{            
      setPortWritable(pin);
      int v = readBuffer(7);
      if(v>=0&&v<=180){
        Servo sv = servos[searchServoPin(pin)];
        sv.attach(pin);
        sv.write(v);
      }
    }
    break;
    case TIMER:{
      lastTime = millis()/1000.0; 
    }
    break;
    case LCD:{
      int line = readBuffer(7);  // Line
      int col = readBuffer(9);  // Col       

      // lcd.clear();
      lcd.setCursor(col,line);
    
      /*
      lcd.print(readBuffer(7)); // line
      lcd.print(",");     
      lcd.print(readBuffer(9)); // column
      lcd.print(",");     
      lcd.print(readBuffer(11)); // string  
      lcd.print(readBuffer(13)); // string
      lcd.print(readBuffer(15)); // string
      */
    
      char lcd_char[12];
      int lcd_string_start_num = 11;
      for (int i = 0; i < 17; i++) 
      {
        lcd_char[i] = readBuffer(lcd_string_start_num);
        lcd_string_start_num += 2;
        //lcd_char[i] = buffer[lcd_string_start_num];
        //lcd_string_start_num += 2;
      }      
      //lcd.print(buffer[11]);
      lcd.print(lcd_char);
    }
    break;
    case LCD_COMMAND:
    {
      int command = readBuffer(7);  // command   

      /*
      lcd.print(readBuffer(3)); // line 
      // 9:backlight on
      // 15: lcd_blue
      lcd.print(",");     
      lcd.print(readBuffer(4)); // column 2
      lcd.print(",");     
      lcd.print(readBuffer(5)); // string  10
      lcd.print(",");     
      lcd.print(readBuffer(6)); // string  0
      lcd.print(",");     
      lcd.print(readBuffer(7)); // string  3
      lcd.print(",");     
      lcd.print(readBuffer(8)); // string  0
      */
     

#if 1
      if( command == 0 )
      {
        //lcd.print("init1()"); 
        lcd.init(0x3f,16,2);
        //delay(1000);
        //lcd.init(0x3f,16,2);
        delay(10);
        lcd.backlight();
      }
      else if( command == 1 )
      {
        //lcd.print("init2()"); 
        lcd.init(0x27,16,2);
        //delay(1000);
        //lcd.init(0x27,16,2);
        delay(10);
        lcd.backlight();
      }
      else if( command == 2 )
      {        
        lcd.clear();
      }
      else if( command == 3 )
        lcd.backlight();
      else if( command == 4 )
        lcd.noBacklight();
#endif        
    }
    break;    
    case MOTOR_LEFT:{
      int direction = readBuffer(7);
      int speed = readBuffer(9);

      pinMode(13,OUTPUT);
      digitalWrite(13, HIGH);

      pinMode(PHASE_B_L, OUTPUT);  
      pinMode(ENABLE_B_L, OUTPUT);      

      if( speed == 0 )
      {
        isLeftMotormode = false;
        analogWrite(ENABLE_B_L, speed);        
      }
      else
      {
        isLeftMotormode = true;
  
        // forward
        if( direction == 0 )
        {
          // Left forward
          digitalWrite(PHASE_B_L, LOW);
          analogWrite(ENABLE_B_L, speed);        
        }
        else
        {
          // Left backward
          digitalWrite(PHASE_B_L, HIGH);
          analogWrite(ENABLE_B_L, speed);        
        }
      }
    }
    break;
   case MOTOR_RIGHT:{
      int direction = readBuffer(7);
      int speed = readBuffer(9);

      pinMode(PHASE_A_R, OUTPUT);  
      pinMode(ENABLE_A_R, OUTPUT);        

      if( speed == 0 )
      {
        isLeftMotormode = false;
        analogWrite(ENABLE_A_R, speed);        
      }
      else
      {
        isRightMotormode = true;
  
        // forward
        if( direction == 0 )
        {
          // Right forward
          digitalWrite(PHASE_A_R, HIGH);
          analogWrite(ENABLE_A_R, speed);        
        }
        else
        {
          // Right backward
          digitalWrite(PHASE_A_R, LOW);
          analogWrite(ENABLE_A_R, speed);        
        }
      }
    }
    break;    
    case SOUND_IN:{
      isSoundInmode = true;

       unsigned long startMillis= millis();  // Start of sample window       
     
       unsigned int signalMax = 0;
       unsigned int signalMin = 1024;

       pinMode(pin, INPUT);  
       sound_input_pin_no = pin;
     
       // collect data for 50 mS
       while (millis() - startMillis < sound_max9812_sampleWindow)
       {
          sound_max9812_sample = analogRead(pin);
          if (sound_max9812_sample < 1024)  // toss out spurious readings
          {
             if (sound_max9812_sample > signalMax)
             {
                signalMax = sound_max9812_sample;  // save just the max levels
             }
             else if (sound_max9812_sample < signalMin)
             {
                signalMin = sound_max9812_sample;  // save just the min levels
             }
          }
       }
       sound_max9812_peak = signalMax - signalMin;  // max - min = peak-peak amplitude      
    }
    break;    

  }
}

void sendPinValues() {  
  int pinNumber = 0;
  for (pinNumber = 0; pinNumber < MAX_DIGITAL_PIN; pinNumber++) {
    if(digitals[pinNumber] == 0) {
      sendDigitalValue(pinNumber);
      callOK();
    }
  }
  for (pinNumber = 0; pinNumber < MAX_ANALOG_PIN; pinNumber++) {
    if(analogs[pinNumber] == 0) {
      sendAnalogValue(pinNumber);
      callOK();
    }
  }
  
  if(isUltrasonic) {
    sendUltrasonic();  
    callOK();
  }
}

void setUltrasonicMode(boolean mode) {
  isUltrasonic = mode;
  if(!mode) {
    lastUltrasonic = 0;
  }
}

void sendUltrasonic() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  float value = pulseIn(echoPin, HIGH, 30000) / 29.0 / 2.0;

  if(value == 0) {
    value = lastUltrasonic;
  } else {
    lastUltrasonic = value;
  }
  writeHead();
  sendFloat(value);
  writeSerial(trigPin);
  writeSerial(echoPin);
  writeSerial(ULTRASONIC);
  writeEnd();
}

#define PHASE_B_L     8
#define PHASE_A_R     7
#define ENABLE_B_L    6
#define ENABLE_A_R    5

void sendDigitalValue(int pinNumber) 
{
    
  pinMode(pinNumber,INPUT);
  writeHead();
  sendFloat(digitalRead(pinNumber));  
  writeSerial(pinNumber);
  writeSerial(DIGITAL);
  writeEnd();
}

void sendAnalogValue(int pinNumber) 
{    
  writeHead();  

  if( isSoundInmode == true && sound_input_pin_no == pinNumber)
  {
    sendFloat(sound_max9812_peak);
  }
  else  
  {
    sendFloat(analogRead(pinNumber));  
  }

  writeSerial(pinNumber);
  writeSerial(ANALOG);    
  writeEnd();
}

void writeBuffer(int index,unsigned char c){
  buffer[index]=c;
}

void writeHead(){
  writeSerial(0xff);
  writeSerial(0x55);
}

void writeEnd(){
  Serial.println();
}

void writeSerial(unsigned char c){
  Serial.write(c);
}

void sendString(String s){
  int l = s.length();
  writeSerial(4);
  writeSerial(l);
  for(int i=0;i<l;i++){
    writeSerial(s.charAt(i));
  }
}

void sendFloat(float value){ 
  writeSerial(2);
  val.floatVal = value;
  writeSerial(val.byteVal[0]);
  writeSerial(val.byteVal[1]);
  writeSerial(val.byteVal[2]);
  writeSerial(val.byteVal[3]);
}

void sendShort(double value){
  writeSerial(3);
  valShort.shortVal = value;
  writeSerial(valShort.byteVal[0]);
  writeSerial(valShort.byteVal[1]);
}

short readShort(int idx){
  valShort.byteVal[0] = readBuffer(idx);
  valShort.byteVal[1] = readBuffer(idx+1);
  return valShort.shortVal; 
}

float readFloat(int idx){
  val.byteVal[0] = readBuffer(idx);
  val.byteVal[1] = readBuffer(idx+1);
  val.byteVal[2] = readBuffer(idx+2);
  val.byteVal[3] = readBuffer(idx+3);
  return val.floatVal;
}

long readLong(int idx){
  val.byteVal[0] = readBuffer(idx);
  val.byteVal[1] = readBuffer(idx+1);
  val.byteVal[2] = readBuffer(idx+2);
  val.byteVal[3] = readBuffer(idx+3);
  return val.longVal;
}

int searchServoPin(int pin){
  for(int i=0;i<8;i++){
    if(servo_pins[i] == pin){
      return i;
    }
    if(servo_pins[i]==0){
      servo_pins[i] = pin;
      return i;
    }
  }
  return 0;
}

void setPortWritable(int pin) {
  if(digitals[pin] == 0) {
    digitals[pin] = 1;
    pinMode(pin, OUTPUT);
  } 
}

void callOK(){
  writeSerial(0xff);
  writeSerial(0x55);
  writeEnd();
}

void callDebug(char c){
  writeSerial(0xff);
  writeSerial(0x55);
  writeSerial(c);
  writeEnd();
}
