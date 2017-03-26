#include <SoftwareServo.h>
#include <SoftwareSerial.h>

#define sRX 13
#define sTX 12

SoftwareServo servo1;
SoftwareSerial SerialB(sTX,sRX);

int servoPin = 6;
char remainData;
const int M_SIZE=20;
const int M_DELAY=100;
int iii=0;
int rotation=1000;
int analogcount=0;
int DC_ON=0; // if DC motor is use or not use:1, not;0
int mdata[M_SIZE];
int analogValue[6];

int sound_offset=0;
int cds1_offset=0;
int cds2_offset=0;


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

int analogReadPin(int apin){
  analogRead(apin);
  mydelay_us(M_DELAY);
  return analogRead(apin);
}

//Made by Sang Bin Yim 20150423
int cal_sound(){ //calculate the moving average of the sound input 
  if(sound_offset==0) { mdata[iii]= analogReadPin(A0);}
  else{ mdata[iii]= sound_offset-analogReadPin(A0);}
  iii++;
  if(iii>=M_SIZE) iii=0;
  
  int sensorValue=0;
  for(int i=0; i<M_SIZE; i++){
    sensorValue+=abs(mdata[i]); //Moving Average
  }
  sensorValue=sensorValue/M_SIZE; 
  
  return sensorValue;  
}

void cal_offset(){
  int aaa=0;
  for(int i=0;i<30;i++){
    aaa=cal_sound();
  }
  sound_offset=cal_sound(); //Calculate the Offset from 300
  cds1_offset= analogReadPin(A1);
  cds2_offset= analogReadPin(A4);
}

boolean isPortWritable (int port) {
  if (port > 7)
    return bitRead(DDRB, port - 8);
  else
    return bitRead(DDRD, port);
}

void setPortReadable (int port) {
//  if(port>11 || port==6) return;
  if (isPortWritable(port)) {
    pinMode(port, INPUT);
  }
}

void setPortWritable (int port) {
//  if(port>11 || port==6) return;
//  if((DC_ON==0) && (port==3 || port==8 || port==9 || port==10 || port==11)) return;
  if (!isPortWritable(port)) {
    pinMode(port, OUTPUT);
  }
}

void updateDigitalPort (char c) {
  // first data
  if (c>>7) {
    if ((c>>6) & 1) {// is output
      // is data end at this chunk
      if ((c>>5) & 1) { // Get port LED(2~5), Motor(9~11)
        int port = (c >> 1) & B1111;
        int oflag = 0;
                        
        if (c & 1){ //Check On/Off
          if(port==7) { DC_ON = 1; }// Set DC motor is USED
          oflag=1;
        }else{
          if(port==7){ DC_ON=0; } // Set DC motor is not USED
          oflag=0;
        }

        //2~5,7 Always D Out, 6 PWM out, 8 Input, 9~11 MOn/PWM OUT, MOff/D in
        
        if(port>=2 && port<=7){ // Always D Out 2~7 except 6[PWM]
          if(port != 6){// 6 is PWM OUTPUT
            //if(port == 3){
            //  if(DC_ON==0) digitalWrite(port, oflag); // only d out for LED_G when M Off              
            //}else 
            digitalWrite(port, oflag);
          }
        }else if(port>=9 && port<=11){
          if(DC_ON==1) setPortWritable(port);
          else setPortReadable(port);
          digitalWrite(port, oflag);
        }

        //if(port==3) digitalWrite(2, LOW);
        
      }
      else { // if it has next data value
        remainData = c;
      }
    } else { //is input SWitch only for digital dont touch >11
      int port = (c >> 1) & B1111; //Get port
      if((DC_ON==0) && (port>=9 && port<=11)) setPortReadable(port);//M Off -> SW input
    }
  } else {//if packet has data value PWM Outs only 3, 6, 9, 10, 11
    if(remainData==0) return; //Error
    
    int port = (remainData >> 1) & B1111; //get port
    int value = ((remainData & 1) << 7) + (c & B1111111);    
    if(port==servoPin){
      servo1.write(value);
    }else if(port==3 || port==9 || port==10 || port==11) 
    {
      if(DC_ON == 1){
        setPortWritable(port);
        if(value>150) analogWrite(port, 150); // cut off Maximum value
        else  analogWrite(port, value);
      }
    }
    remainData = 0;
  }
}


void readAnalogValue(int pinNumber) {
  int value=0;  
  
  if(pinNumber==0) value = cal_sound(); //Modified by Sang Bin Yim 20150423
  else if(pinNumber==1) {value=analogReadPin(pinNumber); value=100+value-cds1_offset;}
  else if(pinNumber==4) {value=analogReadPin(pinNumber); value=100+value-cds2_offset;}
  else {value = analogReadPin(pinNumber);}//Modified by Sang Bin Yim 20150423
  
  analogValue[pinNumber]=value;
}

void sendAnalogValue(int pinNumber) {
  int value;
  value=analogValue[pinNumber];
  
  SerialB.write(B11000000
               | ((pinNumber & B111)<<3)
               | ((value>>7) & B111));
  SerialB.write(value & B1111111);
}

void sendDigitalValue(int pinNumber) {
  if (digitalRead(pinNumber) == HIGH) {
      SerialB.write(B10000000
                   | ((pinNumber & B1111)<<2)
                   | (B1));
   } else {
      SerialB.write(B10000000
                 | ((pinNumber & B1111)<<2));
  }
}

void sendPinValues() {
  int pinNumber = 0;
  for (pinNumber = 0; pinNumber < 6; pinNumber++) { //Send Analog Inputs
    sendAnalogValue(pinNumber);
  }
  for (pinNumber = 8; pinNumber < 12; pinNumber++) { // Send Only Switch Inputs
    if (!isPortWritable(pinNumber))  sendDigitalValue(pinNumber);
  }
}

void initPorts () {
  for (int pinNumber = 2; pinNumber < 12; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
  pinMode(8, INPUT); // Always Input for SW1
  pinMode(12,INPUT);
  pinMode(13,OUTPUT);
}

void setup(){
  initPorts();
  cal_offset();
  servo1.attach(servoPin);
 
  SerialB.begin(9600);
  
  mydelay_us(50000);
  SerialB.print("AT\r\n");
  mydelay_us(50000);
  SerialB.print("AT+NAMESensorRobot\r\n");
  mydelay_us(50000);
  SerialB.print("AT+RESET\r\n");
  mydelay_us(50000);
  SerialB.print("AT+BAUD7\r\n");
  mydelay_us(50000);
  SerialB.begin(57600);
  mydelay_us(50000);
  
  for(int i=0;i<6; i++){
    analogValue[i]=0; //Initialize analog Value
  }
  
}


void loop() {
  
  while (SerialB.available()) {
      unsigned char c = SerialB.read();
      //if(c == -1) continue;
      updateDigitalPort(c);
  } 

//  if(DC_ON) digitalWrite(2, HIGH);
//  else digitalWrite(2, LOW);

  if((analogcount % 20) ==0){ readAnalogValue(analogcount/20);}
  analogcount++;
  if(analogcount>=120) {analogcount=0;}

  if(rotation>1000){
    rotation=0;
    sendPinValues();
    //SerialB.flush();
    servo1.refresh(); 
  }
  rotation++;
}


