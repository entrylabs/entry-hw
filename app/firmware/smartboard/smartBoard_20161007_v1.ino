#include "VarSpeedServo.h"

#define SERVO_A 9
#define SERVO_B 10
#define SERVO_C 11
#define DC_A 5
#define DC_B 6   //

int remainData;
int sound_offset = 0;
int cds_offset = 0;
int vr_offset = 0;
const int M_SIZE=20;
int iii=0;
int mdata[M_SIZE];

unsigned long previousMillis = 0;        // will store last time LED was updated
const long interval = 15;           // interval at which to blink (milliseconds)

VarSpeedServo myServo[3];
int myServoCurrentValue[3] = { 90, 90, 90 };
int myServoPreviousValue[3] = { 90, 90, 90 };
int myServoSpeed[3] = { 44, 44, 44 };
int myServoState[3] = { 0, 0, 0 };   //0 is PWM. 1 is RC Servo Motor
const int myServoPin[3] = { SERVO_A, SERVO_B, SERVO_C };

void setup(){
  Serial.begin(9600);
  Serial.flush();
  cal_offset();
  delay(100);
  initPorts();
  delay(800);
  analogWrite(DC_A, 0);   //DC motor stop. once more...
  analogWrite(DC_B, 0);
  delay(100);
}

void initPorts () {
  for (int pinNumber = 0; pinNumber < 13; pinNumber++) {
    if( (pinNumber != SERVO_A) && (pinNumber != SERVO_B) && (pinNumber != SERVO_C) ) {  pinMode(pinNumber, OUTPUT); digitalWrite(pinNumber, LOW); }
  }

  for (int pinNumber = 12; pinNumber < 16; pinNumber++) {
    pinMode(pinNumber, INPUT_PULLUP);
  }
}

void loop() {
  unsigned long currentMillis = millis();
  
  while (Serial.available()) {
    if (Serial.available() > 0) {
      char c = Serial.read();
      updateDigitalPort(c);
    }
  }
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    sendPinValues();
  }
}

void cal_offset(){
  int aaa=0;
  for(int i=0;i<30;i++){
    aaa=cal_sound();
  }
  sound_offset=cal_sound(); //Calculate the Offset from 300
  cds_offset=analogRead(A4);
  vr_offset=analogRead(A5);
}

//Made by Sang Bin Yim 20150423, Thx for your Coading...20160830
int cal_sound(){ //calculate the moving average of the sound input 
  if(sound_offset==0)  mdata[iii]= analogRead(A3);
  else mdata[iii]=sound_offset-analogRead(A3);
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
  for (pinNumber = 0; pinNumber < 16; pinNumber++) {
      if ( pinNumber == SERVO_A || pinNumber == SERVO_B || pinNumber == SERVO_C );
      else if( pinNumber == DC_A || pinNumber == DC_B );
      else sendDigitalValue(pinNumber);
  }
  for (pinNumber = 2; pinNumber < 6; pinNumber++) {
      sendAnalogValue(pinNumber);
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
        if( (port != SERVO_A) && (port != SERVO_B) && (port != SERVO_C) ) {
          setPortWritable(port);
          if (c & 1) {
            digitalWrite(port, HIGH);
          } else {
            digitalWrite(port, LOW);
          }
        } else {
          if( c & 1 ) {
            if( port == myServoPin[port-9] && myServoState[port-9] == 0 ) { myServo[port-9].attach(port); myServo[port-9].write(90, myServoSpeed[port-9]), myServoState[port-9] = 1; }
          } else {
            if( port == myServoPin[port-9] && myServoState[port-9] == 0 ) digitalWrite(port, LOW);
          }
        }
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
    
    if( (port != SERVO_A) && (port != SERVO_B) && (port != SERVO_C) ) {
      setPortWritable(port);
      analogWrite(port, value);
    } else {
        if( port == myServoPin[port-9] && myServoState[port-9] == 0 ) {
            setPortWritable(port);
            analogWrite(port, value);
        } else if ( port == myServoPin[port-9] && myServoState[port-9] == 1 ) {
          if( value > 0 && value < 185 ) { myServo[port-9].write(value, myServoSpeed[port-9]); }
          else if( value > 185 && value < 253 ) myServoSpeed[port-9] = (value-180)<<2;
          else if( value == 253 ) myServoSpeed[port-9] = 255;
        }
    }
    remainData = 0;
  }
}

void sendAnalogValue(int pinNumber) {
  int value;
  //Modified by Sang Bin Yim 20150423, Thx for your Coading...
  switch(pinNumber) {
    case 3: value = cal_sound();  break;
    default:
      value = analogRead(pinNumber);
    break;
  }
  if(pinNumber == 3 ) value = cal_sound();
  else value = analogRead(pinNumber);
  
  Serial.write(B11000000
               | ((pinNumber & B111)<<3)
               | ((value>>7) & B111));
  Serial.write(value & B1111111);
}

void sendDigitalValue(int pinNumber) {
  if (digitalRead(pinNumber) == HIGH) {
    if( pinNumber == 12 || pinNumber == 13 || pinNumber == 14 || pinNumber == 15 ) 
    Serial.write(B10000000
                 | ((pinNumber & B1111)<<2));
    else {
    Serial.write(B10000000
                 | ((pinNumber & B1111)<<2)
                 | (B1));
    }
  } else {
    if( pinNumber == 12 || pinNumber == 13 || pinNumber == 14 || pinNumber == 15 ) 
    Serial.write(B10000000
                 | ((pinNumber & B1111)<<2)
                 | (B1));
    else {
    Serial.write(B10000000
                 | ((pinNumber & B1111)<<2));
    }
  }
}

void setPortReadable (int port) {
  if (port == SERVO_A || port == SERVO_B || port == SERVO_C ) return;
  if (isPortWritable(port)) {
    pinMode(port, INPUT);
  }
}

void setPortWritable (int port) {
  if ( port == 12 || port == 13 || port == 14 || port == 15 ) return;
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
