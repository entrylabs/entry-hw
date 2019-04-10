#include <Wire.h>
#include "Adafruit_TCS34725.h"
#include "VarSpeedServo.h"
#include "Kalman.h"
#include "pitches.h"

#define SERVO_A 9
#define SERVO_B 10
#define SERVO_C 11
#define DC_A 5
#define DC_B 6   //

Adafruit_TCS34725 tcs = Adafruit_TCS34725(TCeS34725_INTEGRATIONTIME_50MS, TCS34725_GAIN_4X);

int remainData;
const int M_SIZE=20;
int iii=0;
int mdata[M_SIZE];

unsigned long previousMillis[3] = {0, 0, 0};   
const long interval = 40;           // interval at which to blink (milliseconds)
const long motorInterval = 2;
int melodyDelay = 0;

VarSpeedServo myServo[3];
int myServoSpeed[3] = { 52, 52, 52 };
int myServoAngle[3] = { 12, 12, 12 };
const int myServoPin[3] = { SERVO_A, SERVO_B, SERVO_C };

int myDCMotorControl[8] = { 0, 0, 0, 0, 0, 0, 0, 0 };
char wire = 0;   // 1 : RGB, 2 : GYRO, 2 : -, 3 : -, 4 : -

Kalman kalmanX; // Create the Kalman instances
Kalman kalmanY;

/* IMU Data */
int16_t accX, accY, accZ;
int16_t tempRaw;
int16_t gyroX, gyroY, gyroZ;

double accXangle, accYangle; // Angle calculate using the accelerometer
double temp; // Temperature
double gyroXangle, gyroYangle; // Angle calculate using the gyro
double compAngleX, compAngleY; // Calculate the angle using a complementary filter
double kalAngleX, kalAngleY; // Calculate the angle using a Kalman filter

uint32_t timer;
uint8_t i2cData[14]; // Buffer for I2C data
////////////////////////////

void setup(){
  Serial.begin(38400);
  Serial.flush();
  initPorts();
  
  if(gyroBegin()) {
    delay(100); // Wait for sensor to stabilize
    
    wire = 2;

    /* Set kalman and gyro starting angle */
    while (i2cRead(0x3B, i2cData, 6));
    accX = ((i2cData[0] << 8) | i2cData[1]);
    accY = ((i2cData[2] << 8) | i2cData[3]);
    accZ = ((i2cData[4] << 8) | i2cData[5]);
    // atan2 outputs the value of -π to π (radians) - see http://en.wikipedia.org/wiki/Atan2
    // We then convert it to 0 to 2π and then from radians to degrees
    accYangle = (atan2(accX, accZ) + PI) * RAD_TO_DEG;
    accXangle = (atan2(accY, accZ) + PI) * RAD_TO_DEG;
  
    kalmanX.setAngle(accXangle); // Set starting angle
    kalmanY.setAngle(accYangle);
    gyroXangle = accXangle;
    gyroYangle = accYangle;
    compAngleX = accXangle;
    compAngleY = accYangle;
  
    timer = micros();
  }
  else if (tcs.begin()) {
    wire = 1;
  }
  delay(500);
}

boolean gyroBegin() {
  Wire.begin();
  i2cData[0] = 7; // Set the sample rate to 1000Hz - 8kHz/(7+1) = 1000Hz
  i2cData[1] = 0x00; // Disable FSYNC and set 260 Hz Acc filtering, 256 Hz Gyro filtering, 8 KHz sampling
  i2cData[2] = 0x00; // Set Gyro Full Scale Range to ±250deg/s
  i2cData[3] = 0x00; // Set Accelerometer Full Scale Range to ±2g
  i2cWrite(0x19, i2cData, 4, false); // Write to all four registers at once
  i2cWrite(0x6B, 0x01, true); // PLL with X axis gyroscope reference and disable sleep mode
  i2cRead(0x75, i2cData, 1);
  if (i2cData[0] != 0x68) { // Read "WHO_AM_I" register
    return false; 
  }
  return true;
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
    unsigned long currentMillis = millis();
  
    while (Serial.available()) {
      if (Serial.available() > 0) {
        char c = Serial.read();
        updateDigitalPort(c);
      }
    }

   if (currentMillis - previousMillis[0] >= interval) {
    previousMillis[0] = currentMillis;
    sendPinValues();
    switch(wire) {
      case 0:
        sendEmptyData();
      break;
      case 1:
        sendRGBData();
        break;
      case 2:
        sendGyroData();
        break;
    }
   }

  if (currentMillis - previousMillis[1] >= motorInterval) {
    previousMillis[1] = currentMillis;
     
    if(myDCMotorControl[0] > myDCMotorControl[2] ) {
      analogWrite(5, myDCMotorControl[2]++);
    } else if(myDCMotorControl[0] < myDCMotorControl[2] ) {
      analogWrite(5, myDCMotorControl[2]--);
    } else {
      
    }
  
    if(myDCMotorControl[3] > myDCMotorControl[5] ) {
      analogWrite(6, myDCMotorControl[5]++);
    } else if(myDCMotorControl[3] < myDCMotorControl[5] ) {
      analogWrite(6, myDCMotorControl[5]--);
    } else {
      
    }
  }
/*
  if(currentMillis - previousMillis[2] >= melodyDelay && melodyDelay != 0) {
     previousMillis[2] = currentMillis;
    melodyDelay = 0;
    noTone(8);
  }
*/
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

void sendEmptyData() {
  Serial.write(B11000000
               | ((0 & B111)<<3)
               | ((0>>7) & B111));
  Serial.write(0 & B1111111);
  
  Serial.write(B11000000
               | ((1 & B111)<<3)
               | ((0>>7) & B111));
  Serial.write(0 & B1111111);

  Serial.write(B11000000
               | ((6 & B111)<<3)
               | ((0>>7) & B111));
  Serial.write(0 & B1111111);

  Serial.write(B11000000
               | ((7 & B111)<<3)
               | ((0>>7) & B111));
  Serial.write(0 & B1111111);
}

void sendRGBData() {
   uint16_t clear, red, green, blue, color, r, g, b;
   float average;
   tcs.getRawData(&red, &green, &blue, &clear);

  average = (red+green+blue)/3;
  r = fastf2i_round(red/average*100);
  g = fastf2i_round(green/average*100);
  b = fastf2i_round(blue/average*100);

  if ((r > 130) && (g < 105) && (b < 105)) {    //RED
    color = 1;
  }
//  else if ((r > 170) && (g >= 63) && (b < 70)) {    //ORANGE
//    color = 2;
//  }
//  else if ((r > 130) && (g > 95) && (b < 60)) {   //YELLOW
//    color = 3;
//  }
  else if ((r < 105) && (g > 125) && (b < 105)) {   //GREEN
    color = 2;
  }
  else if ((r < 105) && (g < 105) && (b > 130)) {   //BLUE
    color = 3;
  }
//  else if ((r > 80) && (g < 120) && (b > 100)) {     //DARK BLUE
//    color = 6;
//  }
//  else if ((r > 1.10) && (g < 1) && (b < 1)) {    //PURPLE
//    color = 7;
//  } 
  else {
    color = 0;
  }

  //Serial.print((int)r ); Serial.print(" "); Serial.print((int)g);Serial.print(" ");  Serial.println((int)b );

  Serial.write(B11000000
               | ((0 & B111)<<3)
               | ((color>>7) & B111));
  Serial.write(color & B1111111);
  
  Serial.write(B11000000
               | ((1 & B111)<<3)
               | ((r>>7) & B111));
  Serial.write(r & B1111111);

  Serial.write(B11000000
               | ((6 & B111)<<3)
               | ((g>>7) & B111));
  Serial.write(g & B1111111);

  Serial.write(B11000000
               | ((7 & B111)<<3)
               | ((b>>7) & B111));
  Serial.write(b & B1111111);
}

void sendGyroData() {
  while (i2cRead(0x3B, i2cData, 14));
  accX = ((i2cData[0] << 8) | i2cData[1]);
  accY = ((i2cData[2] << 8) | i2cData[3]);
  accZ = ((i2cData[4] << 8) | i2cData[5]);
  tempRaw = ((i2cData[6] << 8) | i2cData[7]);
  gyroX = ((i2cData[8] << 8) | i2cData[9]);
  gyroY = ((i2cData[10] << 8) | i2cData[11]);
  gyroZ = ((i2cData[12] << 8) | i2cData[13]);

  // atan2 outputs the value of -π to π (radians) - see http://en.wikipedia.org/wiki/Atan2
  // We then convert it to 0 to 2π and then from radians to degrees
  accXangle = (atan2(accY, accZ) + PI) * RAD_TO_DEG;
  accYangle = (atan2(accX, accZ) + PI) * RAD_TO_DEG;

  double gyroXrate = (double)gyroX / 131.0;
  double gyroYrate = -((double)gyroY / 131.0);
  gyroXangle += gyroXrate * ((double)(micros() - timer) / 1000000); // Calculate gyro angle without any filter
  gyroYangle += gyroYrate * ((double)(micros() - timer) / 1000000);


  compAngleX = (0.93 * (compAngleX + (gyroXrate * (double)(micros() - timer) / 1000000))) + (0.07 * accXangle); // Calculate the angle using a Complimentary filter
  compAngleY = (0.93 * (compAngleY + (gyroYrate * (double)(micros() - timer) / 1000000))) + (0.07 * accYangle);

  kalAngleX = kalmanX.getAngle(accXangle, gyroXrate, (double)(micros() - timer) / 1000000); // Calculate the angle using a Kalman filter
  if(kalAngleX < 0 ) kalAngleX = 0;
  if(kalAngleX > 360 ) kalAngleX = 360;
  kalAngleY = kalmanY.getAngle(accYangle, gyroYrate, (double)(micros() - timer) / 1000000);
  if(kalAngleY < 0 ) kalAngleY = 0;
  if(kalAngleY > 360 ) kalAngleY = 360;
  timer = micros();

  temp = ((double)tempRaw + 12412.0) / 340.0;

  Serial.write(B11000000
               | ((0 & B111)<<3)
               | ((map(kalAngleX, 0, 360, 0, 360)>>7) & B111));
  Serial.write(map(kalAngleX, 0, 360, 0, 360) & B1111111);
  
  Serial.write(B11000000
               | ((1 & B111)<<3)
               | ((map(kalAngleY, 0, 360, 0, 360)>>7) & B111));
  Serial.write(map(kalAngleY, 0, 360, 0, 360) & B1111111);

  Serial.write(B11000000
               | ((6 & B111)<<3)
               | ((map(gyroX,-32768,32767,0,1023)>>7) & B111));
  Serial.write(map(gyroX,-32768,32767,0,1023) & B1111111);

  Serial.write(B11000000
               | ((7 & B111)<<3)
               | ((map(gyroY,-32768,32767,0,1023)>>7) & B111));
  Serial.write(map(gyroY,-32768,32767,0,1023) & B1111111);
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
            if(port == 4) { if( myDCMotorControl[1] == 0 ) { myDCMotorControl[1] = 1; myDCMotorControl[2] = 0; digitalWrite(4, HIGH); } }
            else if(port == 5) { myDCMotorControl[0] = 255; }
            else { digitalWrite(port, HIGH); }
            if(port == 7) { if( myDCMotorControl[4] == 0 ) { myDCMotorControl[4] = 1; myDCMotorControl[5] = 0; digitalWrite(7, HIGH); } }
            else if(port == 6) { myDCMotorControl[3] = 255; }
            else { digitalWrite(port, HIGH); }
          } else {
            if(port == 4) { if( myDCMotorControl[1] == 1 ) { myDCMotorControl[1] = 0; myDCMotorControl[2] = 0; digitalWrite(4, LOW); } }
            else if(port == 5) { myDCMotorControl[0] = 0; }
            else { digitalWrite(port, LOW); }
            if(port == 7) { if( myDCMotorControl[4] == 1 ) { myDCMotorControl[4] = 0; myDCMotorControl[5] = 0; digitalWrite(7, LOW); } }
            else if(port == 6) { myDCMotorControl[3] = 0; }
            else { digitalWrite(port, LOW); }
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
      if( port != 5 && port != 6 ) {
        setPortWritable(port);
        analogWrite(port, value);
      } else {
        if( port == 5 ) myDCMotorControl[0] = value;
        if( port == 6 ) myDCMotorControl[3] = value;
      }
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
  if ( port == 12 || port == 13 || port == 14 ) return;
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

int fastf2i_round(float f)
{
#ifdef _WIN32
 int i;
 __asm
 {
  fld  f
  fistp i
 }
 return i;
#else
 return (int)(f + 0.5f);
#endif 
}
