#include <SoftwareServo.h>

SoftwareServo servo1;

int servoPin = 6;
const int M_SIZE=20;
int iii=0;
int rotation=1000;
int DC_ON=0; // if DC motor is use or not use:1, not;0
int mdata[M_SIZE];

int sound_offset=0;
int cds1_offset=0;
int cds2_offset=0;

//common
char remainData;
char mode;
#define mode_pin 8
#define Entry_Exp 1
#define Entry_Sen 0

//SAME
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

//on
void cal_offset(){
  int aaa=0;
  for(int i=0;i<30;i++){
    aaa=cal_sound();
  }
  sound_offset=cal_sound(); //Calculate the Offset from 300
  cds1_offset=analogRead(A1);
  cds2_offset=analogRead(A4);
}
//on

//d
void SensorBoard_updateDigitalPort (char c) {
  // first data
  if (c>>7) {
    // is output
    if ((c>>6) & 1) {
      // is data end at this chunk
      if ((c>>5) & 1) {
        int port = (c >> 1) & B1111;
        SensorBoard_setPortWritable(port);
        
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
     //is input
      int port = (c >> 1) & B1111;
      if((DC_ON==0) && (port == 8 || port == 9 || port == 10 || port ==11)) SensorBoard_setPortReadable(port);
//      else SensorBoard_setPortWritable(port);

    }
  } else {
    int port = (remainData >> 1) & B1111;
    int value = ((remainData & 1) << 7) + (c & B1111111);
    SensorBoard_setPortWritable(port);
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


//d
void SensorBoard_sendAnalogValue(int pinNumber) {
  int value=0;
  
  if(pinNumber==0) value = cal_sound(); //Modified by Sang Bin Yim 20150423
  else if(pinNumber==1) {value=analogRead(pinNumber); value=100+value-cds1_offset;}
  else if(pinNumber==4) {value=analogRead(pinNumber); value=100+value-cds2_offset;}
  else {value = analogRead(pinNumber);}//Modified by Sang Bin Yim 20150423
  
  Serial.write(B11000000
               | ((pinNumber & B111)<<3)
               | ((value>>7) & B111));
  Serial.write(value & B1111111);
}

void SensorBoard_sendPinValues() {
  int pinNumber = 0;
  for (pinNumber = 0; pinNumber < 6; pinNumber++) {
    SensorBoard_sendAnalogValue(pinNumber);
   // mydelay_us(500);
  }
  for (pinNumber = 8; pinNumber < 12; pinNumber++) {
    if (!isPortWritable(pinNumber))  sendDigitalValue(pinNumber);
  }
}


//same
void sendPinValues() {
  int pinNumber = 0;
  for (pinNumber = 0; pinNumber < 6; pinNumber++) {
    sendAnalogValue(pinNumber);
    mydelay_us(500);
  }
  for (pinNumber = 0; pinNumber < 12; pinNumber++) {
    if (!isPortWritable(pinNumber))
      sendDigitalValue(pinNumber);
  }
}
//diff
void updateDigitalPort (char c) {
  // first data
  if (c>>7) {
    // is output
    if ((c>>6) & 1) {
      // is data end at this chunk
      if ((c>>5) & 1) {
        int port = (c >> 1) & B1111;
        setPortWritable(port);
        if (c & 1)
          digitalWrite(port, HIGH);
        else
          digitalWrite(port, LOW);
      }
      else {
        remainData = c;
      }
    } else {
      int port = (c >> 1) & B1111;
      setPortReadable(port);
    }
  } else {
    int port = (remainData >> 1) & B1111;
    int value = ((remainData & 1) << 7) + (c & B1111111);
    setPortWritable(port);
    analogWrite(port, value);
    remainData = 0;
  }
}
//diff
void sendAnalogValue(int pinNumber) {
  int value;
  
  value = analogRead(pinNumber); //Modified by Sang Bin Yim 20150423
  
  Serial.write(B11000000
               | ((pinNumber & B111)<<3)
               | ((value>>7) & B111));
  Serial.write(value & B1111111);
}
//same
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
//diff
void setPortReadable (int port) {
  if (isPortWritable(port)) {
    pinMode(port, INPUT);
  }
}

//diff
void setPortWritable (int port) {
  if (!isPortWritable(port)) {
    pinMode(port, OUTPUT);
  }
}
//d
void SensorBoard_setPortReadable (int port) {
  if(port==6) return;
  if (isPortWritable(port)) {
    pinMode(port, INPUT);
  }
}
//diff
void SensorBoard_setPortWritable (int port) {
  if((DC_ON==0) && (port==3 || port==8 || port==9 || port==10 || port==11)) return;
  if(port>13) return;
  if(port==6) return;

  if (!isPortWritable(port)) {
    pinMode(port, OUTPUT);
  }
}
//same
boolean isPortWritable (int port) {
  if (port > 7)
    return bitRead(DDRB, port - 8);
  else
    return bitRead(DDRD, port);
}



//Entry_Exp
void initPorts () {
  for (int pinNumber = 0; pinNumber < 12; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
}

void SensorBoard_initPorts () {
  for (int pinNumber = 0; pinNumber < 14; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
  digitalWrite(0, HIGH);
  digitalWrite(1, HIGH);
 // pinMode(12,INPUT);
  //pinMode(13,OUTPUT);
}

void setup(){
  

  pinMode(mode_pin,INPUT_PULLUP);
  delay(1);
  if(digitalRead(mode_pin) == HIGH){
    //Extension
  initPorts();
  mode=Entry_Exp;
  }else{
    
  //SensorBoard V2
  SensorBoard_initPorts();
  cal_offset();
  servo1.attach(servoPin);

  mode=Entry_Sen;
  }
  
  //Common
  Serial.begin(57600);
  while(1){
    if (Serial.read()) break;
  }
}




void loop() {
    
    if(mode == Entry_Exp){
      //Entry_Exp
      while (Serial.available()) {
        if (Serial.available() > 0) {
          
          char c = Serial.read();
          if(c == -1) break;
          updateDigitalPort(c);
        }
      } 
      delay(15);
      sendPinValues();
      delay(10);
      
    }else{
      
      //sensorboard v2
              while (Serial.available()) {
              char c = Serial.read();
              SensorBoard_updateDigitalPort(c);
          } 
        
         if(rotation>1000){
            rotation=0;
             SensorBoard_sendPinValues();
       //     Serial.flush();
			servo1.refresh();

         }
       
      rotation++; 
    }
     
}

