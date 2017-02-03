#include "VarSpeedServo.h"

#define SERVO_A 9
#define SERVO_B 10
#define SERVO_C 11
#define DC_A 5
#define DC_B 6   //

int remainData;
const int M_SIZE=20;
int iii=0;
int mdata[M_SIZE];

unsigned long previousMillis = 0;   
const long interval = 15;           // interval at which to blink (milliseconds)

VarSpeedServo myServo[3];
int myServoSpeed[3] = { 52, 52, 52 };
int myServoAngle[3] = { 12, 12, 12 };
const int myServoPin[3] = { SERVO_A, SERVO_B, SERVO_C };

void setup(){
  Serial.begin(9600);
  Serial.flush();
  initPorts();
  delay(200);
}

void initPorts () {
  for (int pinNumber = 0; pinNumber < 13; pinNumber++) {
    if( (pinNumber != SERVO_A) && (pinNumber != SERVO_B) && (pinNumber != SERVO_C) ) {  pinMode(pinNumber, OUTPUT); digitalWrite(pinNumber, LOW); }
    else { 
      myServo[pinNumber-9].attach(pinNumber); 
    }
  }

  for (int pinNumber = 12; pinNumber < 16; pinNumber++) {
    pinMode(pinNumber, INPUT_PULLUP);
  }
}

void loop() {
    while (Serial.available()) {
      if (Serial.available() > 0) {
        char c = Serial.read();
        updateDigitalPort(c);
      }
    }

   delay(10);
   sendPinValues();
   delay(10);
}

void sendPinValues() {
  int pinNumber = 0;
  for (pinNumber = 12; pinNumber < 16; pinNumber++) {
      sendDigitalValue(pinNumber);
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
        if( value == 253 ) myServoSpeed[port-9] = 255;
        if( value > 185 && value < 253 ) myServoSpeed[port-9] = (value-180)<<2;
        if( value > 0 && value <= 185 ) { 
          value = map(value, 1, 180, 12, 168);
          if(myServoAngle[port-9] != value ) {
            myServo[port-9].write(value, myServoSpeed[port-9]); 
            myServoAngle[port-9] = value;
          }
        }
    }
    remainData = 0;
  }
}

void sendAnalogValue(int pinNumber) {
  int value;
  value = analogRead(pinNumber);
  
  Serial.write(B11000000
               | ((pinNumber & B111)<<3)
               | ((value>>7) & B111));
  Serial.write(value & B1111111);
}

void sendDigitalValue(int pinNumber) {
  if (digitalRead(pinNumber) == HIGH) {
    Serial.write(B10000000
                 | ((pinNumber & B1111)<<2));
  } else {
    Serial.write(B10000000
                 | ((pinNumber & B1111)<<2)
                 | (B1));
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
