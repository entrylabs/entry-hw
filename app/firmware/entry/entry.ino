
#include <SoftwareServo.h>
#include <SoftwareSerial.h>

#define sRX 13
#define sTX 12

SoftwareServo servo1;

int servoPin = 6;
char remainData;
const int M_SIZE=20;
int iii=0;
int rotation=2000;
int DC_ON=0; // if DC motor is use or not use:1, not;0
int mdata[M_SIZE];

int sound_offset=0;
int cds1_offset=0;
int cds2_offset=0;

void setup(){
  initPorts();
  cal_offset();
  servo1.attach(servoPin);

  Serial.begin(57600);
  
  while(1){
    if (Serial.read()) break;
  }
}

void initPorts () {
  for (int pinNumber = 0; pinNumber < 12; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
  digitalWrite(0, HIGH);
  digitalWrite(1, HIGH);
  pinMode(12,INPUT);
  pinMode(13,OUTPUT);
}

void loop() {
  while (Serial.available()) {
      char c = Serial.read();
      updateDigitalPort(c);
  } 

 if(rotation>1000){
    rotation=0;
    sendPinValues();
    Serial.flush();
    servo1.refresh();
 }
 rotation++;
}

void cal_offset(){
  int aaa=0;
  for(int i=0;i<30;i++){
    aaa=cal_sound();
  }
  sound_offset=cal_sound(); //Calculate the Offset from 300
  cds1_offset=analogRead(A1);
  cds2_offset=analogRead(A4);
}

//Made by Sang Bin Yim 20150423
int cal_sound(){ //calculate the moving average of the sound input 
  if(sound_offset==0)  mdata[iii]= analogRead(A0);
  else mdata[iii]=sound_offset-analogRead(A0);
  iii++;
  if(iii>=M_SIZE) iii=0;
  
  int sensorValue=0;
  for(int i=0; i<M_SIZE; i++){
    sensorValue+=abs(mdata[i]); //Moving Average
  }
  sensorValue=sensorValue/M_SIZE; 
  
  return sensorValue;  
}


void sendPinValues() {
  int pinNumber = 0;
  for (pinNumber = 0; pinNumber < 6; pinNumber++) {
    sendAnalogValue(pinNumber);
    mydelay_us(500);
  }
  for (pinNumber = 0; pinNumber < 12; pinNumber++) {
    if (!isPortWritable(pinNumber))  sendDigitalValue(pinNumber);
  }
}

void updateDigitalPort (char c) {
  // first data
  if (c>>7) {
    // is output
    if ((c>>6) & 1) {
      // is data end at this chunk
      if ((c>>5) & 1) {
        int port = (c >> 1) & B1111;
        setPortWritable(port);
        
        if (c & 1){
          if(port==7) {
            DC_ON = 1; // Set DC motor is USED
          }
          digitalWrite(port, HIGH);
        }
        else{
          if(port==7){
            DC_ON = 0; // Set DC motor is not USED
          }
          digitalWrite(port, LOW);
        }
      }
      else {
        remainData = c;
      }
    } else {
      int port = (c >> 1) & B1111;
      if((DC_ON==0) || (port!=3 && port!=9 && port!=10 && port!=11)) setPortReadable(port);
      else setPortWritable(port);

    }
  } else {
    int port = (remainData >> 1) & B1111;
    int value = ((remainData & 1) << 7) + (c & B1111111);
    setPortWritable(port);
    if(port==servoPin){
      servo1.write(value);
    }
    else if(port==3 || port==9 || port==10 || port==11) 
    {
      if(value>150) analogWrite(port, 150);
      else  analogWrite(port, value);
    }

    remainData = 0;
  }
}

void sendAnalogValue(int pinNumber) {
  int value;
  if(pinNumber==0) value = cal_sound(); //Modified by Sang Bin Yim 20150423
  else if(pinNumber==1) {value=analogRead(pinNumber); value=value-cds1_offset+100;}
  else if(pinNumber==4) {value=analogRead(pinNumber); value=value-cds2_offset+100;}
  else value = analogRead(pinNumber); //Modified by Sang Bin Yim 20150423
  
  Serial.write(B11000000
               | ((pinNumber & B111)<<3)
               | ((value>>7) & B111));
  Serial.write(value & B1111111);
}

void sendDigitalValue(int pinNumber) {
  if (digitalRead(pinNumber) == HIGH) {
    Serial.write(B10000000
                 | ((pinNumber & B1111)<<2)
                 | (B1));
  } else {
    Serial.write(B10000000
               | ((pinNumber & B1111)<<2));
  }
}

void setPortReadable (int port) {
  if(port==6) return;
  if (isPortWritable(port)) {
    pinMode(port, INPUT);
  }
}

void setPortWritable (int port) {
  if((DC_ON==0) && (port==3 || port==8 || port==9 || port==10 || port==11)) return;
  if(port>13) return;
  if(port==6) return;

  if (!isPortWritable(port)) {
    pinMode(port, OUTPUT);
  }
}

boolean isPortWritable (int port) {
  if (port > 7)
    return bitRead(DDRB, port - 8);
  else
    return bitRead(DDRD, port);
}

void mydelay_us(unsigned int time_us)
{
    register unsigned int i;
 
    for(i = 0; i < time_us; i++)          /* 4 cycle +        */
    {
      asm volatile(" PUSH  R0 ");       /* 2 cycle +        */
      asm volatile(" POP   R0 ");       /* 2 cycle +        */
      asm volatile(" PUSH  R0 ");       /* 2 cycle +        */
      asm volatile(" POP   R0 ");       /* 2 cycle +        */
      asm volatile(" PUSH  R0 ");       /* 2 cycle +        */
      asm volatile(" POP   R0 ");       /* 2 cycle    =  16 cycle   */
    }
}
