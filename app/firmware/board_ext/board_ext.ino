/**********************************************************************************
 * The following software may be included in this software : orion_firmware.ino
 * from http://www.makeblock.cc/
 * This software contains the following license and notice below:
 * CC-BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)
 * Author : Ander, Mark Yan
 * Updated : Ander, Mark Yan
 * Date : 01/09/2016
 * Description : Firmware for Makeblock Electronic modules with Scratch.
 * Copyright (C) 2013 - 2016 Maker Works Technology Co., Ltd. All right reserved. 
 **********************************************************************************/
#include <Servo.h>

Servo servos[8];  
char buffer[52];
byte index = 0;
byte dataLen;
unsigned char prevc=0;
boolean isAvailable = false;
boolean isStart = false;
char serialRead;

union{
  byte byteVal[4];
  float floatVal;
  long longVal;
}val;

union{
  byte byteVal[2];
  short shortVal;
}valShort;

#define ALIVE 0
#define DIGITAL 1
#define ANALOG 2
#define PWM 3
#define SERVO_PIN 4
#define TONE 5
#define PULSEIN 6
#define ULTRASONIC 7
#define TIMER 8

#define GET 1
#define SET 2
#define RESET 3

int analogs[6]={A0,A1,A2,A3,A4,A5};
int servo_pins[8]={0,0,0,0,0,0,0,0};
double lastTime = 0.0;
double currentTime = 0.0;
uint8_t command_index = 0;

void setup(){
  Serial.begin(115200);
}

void loop(){
  currentTime = millis()/1000.0-lastTime;
  readSerial();
  if(isAvailable){
    unsigned char c = serialRead&0xff;
    if(c==0x55&&isStart==false){
     if(prevc==0xff){
      index=1;
      isStart = true;
     }
    }else{
      prevc = c;
      if(isStart){
        if(index==2){
         dataLen = c; 
        }else if(index>2){
          dataLen--;
        }
        writeBuffer(index,c);
      }
    }
     index++;
     if(index>51){
      index=0; 
      isStart=false;
     }
     if(isStart&&dataLen==0&&index>3){ 
        isStart = false;
        parseData(); 
        index=0;
     }
  }
  //callOK();
}

unsigned char readBuffer(int index){
 return buffer[index]; 
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
void readSerial(){
  isAvailable = false;
  if(Serial.available()>0){
    isAvailable = true;
    serialRead = Serial.read();
  }
}

void parseData(){
  isStart = false;
  int idx = readBuffer(3);
  command_index = (uint8_t)idx;
  int action = readBuffer(4);
  int device = readBuffer(5);
  switch(action){
    case GET:{
      if(device != ULTRASONIC){
        writeHead();
        writeSerial(idx);
      }
      readSensor(device);
      writeEnd();
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

void callOK(){
  writeSerial(0xff);
  writeSerial(0x55);
  writeEnd();
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

void runModule(int device){
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
  int port = readBuffer(6);
  int pin = port;
  switch(device){
    case DIGITAL:{
      pinMode(pin,OUTPUT);
      int v = readBuffer(7);
      digitalWrite(pin,v);
    }
    break;
    case PWM:{
      pinMode(pin,OUTPUT);
      int v = readBuffer(7);
      analogWrite(pin,v);
    }
    break;
    case TONE:{
      pinMode(pin,OUTPUT);
      int hz = readShort(7);
      int ms = readShort(9);
      if(ms>0){
        tone(pin, hz, ms);
      }else{
        noTone(pin);
      }
    }
    break;
    case SERVO_PIN:{
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
  }
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

void readSensor(int device){
  /**************************************************
      ff 55 len idx action device port slot data a
      0  1  2   3   4      5      6    7    8
  ***************************************************/
  float value=0.0;
  int port,pin;
  port = readBuffer(6);
  pin = port;
  switch(device){
    case ALIVE: {
      sendString("ALIVE!");
      writeSerial(device);
    }
    break;
    case  DIGITAL:{
      pinMode(pin,INPUT);
      sendFloat(digitalRead(pin));
      writeSerial(pin);
      writeSerial(device);
    }
    break;
    case  ANALOG:{
      pin = analogs[pin];
      pinMode(pin,INPUT);
      sendFloat(analogRead(pin));
      writeSerial(pin);
      writeSerial(device);
    }
    break;
    case  PULSEIN:{
      int pw = readShort(7);
      pinMode(pin, INPUT);
      sendShort(pulseIn(pin,HIGH,pw));
      writeSerial(pin);
      writeSerial(device);
    }
    break;
    case ULTRASONIC:{
      int trig = readBuffer(6);
      int echo = readBuffer(7);
      pinMode(trig,OUTPUT);
      digitalWrite(trig,LOW);
      delayMicroseconds(2);
      digitalWrite(trig,HIGH);
      delayMicroseconds(10);
      digitalWrite(trig,LOW);
      pinMode(echo, INPUT);
      float value = pulseIn(echo,HIGH,30000)/58.0;
      writeHead();
      writeSerial(command_index);
      sendFloat(value);
      writeSerial(trig);
      writeSerial(echo);
      writeSerial(device);
    }
    break;
    case TIMER:{
     sendFloat((float)currentTime);
     writeSerial(device);
    }
    break;
  }
}

