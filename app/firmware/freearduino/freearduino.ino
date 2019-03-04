#include"dht.h"
#include"AFMotor_v1r1.h"
#include"NeoSWSerial.h"
#include"SoftwareServo.h"
#include"AnalogReadFast.h"

#define USE_SOFTWARESERIAL      1

#define SENSORVALUE_US_DIST     12
#define SENSORVALUE_DHT_HUMI    15
#define SENSORVALUE_DHT_TEMP    16

#define STATE_OFF 0
#define STATE_WAIT 1
#define STATE_RUN 2
#define STATE_LOCK 3

#define SERVO_MAX 4
#define WAIT_DELAY 10000   // wait for release locked pin and flag
#define SEND_DELAY 50    // wait for send signal to entry
#define DHT_DELAY 500     // wait for read DHT11 sensor
#define US_DELAY 50      // wait for read ultrasonic sensor
#define SERVO_REFRESH_DELAY 50 // wait for SoftwareServo refresh call

NeoSWSerial *bSerial;

char remainData;
int pinState[20] = {STATE_OFF};
int digitalReadValue[14] = {0};
int analogReadValue[6] = {0};
int digitalReadValue2[14] = {0};
int analogReadValue2[6] = {0};
char digitalEncoded[4] = {0};
int sendPhase = 1;
int pwm[6] = {3, 5, 6, 9, 10, 11};
unsigned long sendTimer = 0;
unsigned long readTimer = 0;

AF_DCMotor motor[4] = {AF_DCMotor(1), AF_DCMotor(2), AF_DCMotor(3), AF_DCMotor(4)};
int motorPin[4] = {11, 3, 5, 6};
int motorSpeed[4] = {200, 200, 200, 200};
unsigned long motorLastUsed[5];
bool motorFlag = false;

SoftwareServo servo[SERVO_MAX];
int servoPin[SERVO_MAX] = {0};
int servoValue[SERVO_MAX] = {0};
int servoNext = 1;
unsigned long servoLastUsed = 0;
unsigned long servoTimer = 0;
bool servoFlag = false;

dht DHT;
int dhtPin = 0;
unsigned long dhtLastUsed = 0;
unsigned long dhtTimer = 0;
bool dhtFlag = false;

int trigPin = 0;
int echoPin = 0;
int distance;
unsigned long usLastUsed = 0;
unsigned long usTimer = 0;
bool usFlag = false;

void setup() {
  if (USE_SOFTWARESERIAL) {
    bSerial = new NeoSWSerial(A4, A5);
    bSerial->begin(9600);
  }
  else {
    Serial.begin(9600);
    Serial.flush();
  }
  initPin();
  delay(100);
}

void initPin() {
  if (USE_SOFTWARESERIAL) {
    pinState[18] = pinState[19] = STATE_LOCK;
  }
  detachServo();
}

void loop() {
  if (USE_SOFTWARESERIAL) {
    while (bSerial->available()) {
      if (bSerial->available() > 0) {
        char c = bSerial->read();
        updateData(c);
      }
    }
  }
  else {
    while (Serial.available()) {
      if (Serial.available() > 0) {
        char c = Serial.read();
        updateData(c);
      }
    }
  }

  if (motorFlag) {
    if (pinState[motorPin[0]] >= STATE_RUN && millis() - motorLastUsed[0] >= WAIT_DELAY) {
      pinState[motorPin[0]] = STATE_WAIT;
    }
    if (pinState[motorPin[1]] >= STATE_RUN && millis() - motorLastUsed[1] >= WAIT_DELAY) {
      pinState[motorPin[1]] = STATE_WAIT;
    }
    if (pinState[motorPin[2]] >= STATE_RUN && millis() - motorLastUsed[2] >= WAIT_DELAY) {
      pinState[motorPin[2]] = STATE_WAIT;
    }
    if (pinState[motorPin[3]] >= STATE_RUN && millis() - motorLastUsed[3] >= WAIT_DELAY) {
      pinState[motorPin[3]] = STATE_WAIT;
    }
    if (millis() - motorLastUsed[4] >= WAIT_DELAY) {
      pinState[4] = pinState[7] = pinState[8] = pinState[12] = STATE_WAIT;
      motorFlag = false;
    }
  }

  if (servoFlag) {
    if (millis() - servoLastUsed >= WAIT_DELAY)
      detachServo();
    else if (millis() - servoTimer >= SERVO_REFRESH_DELAY) {
      servoTimer = millis();
      SoftwareServo::refresh();
    }
  }

  if (dhtFlag) {
    if (millis() - dhtLastUsed >= WAIT_DELAY * 3) {
      dhtFlag = false;
      pinState[dhtPin] = STATE_WAIT;
      dhtPin = 0;
      sendSensorValue(SENSORVALUE_DHT_HUMI, 0);
      sendSensorValue(SENSORVALUE_DHT_TEMP, 0);
    }
    else if (millis() - dhtTimer >= DHT_DELAY) {
      dhtTimer = millis();
      DHT.read11(dhtPin);
    }
  }

  if (usFlag) {
    if (millis() - usLastUsed >= WAIT_DELAY * 3) {
      usFlag = false;
      pinState[trigPin] = pinState[echoPin] = STATE_WAIT;
      trigPin = echoPin = 0;
      sendSensorValue(SENSORVALUE_US_DIST, 0);
    }
    else if (millis() - usTimer >= US_DELAY) {
      usTimer = millis();
      distance = ultraSonicRead(trigPin, echoPin);
      if(!distance) distance = 1023;
    }
  }

  if (millis() - sendTimer >= SEND_DELAY) {
    sendTimer = millis();
    collectData();
    if (USE_SOFTWARESERIAL) {
      sendData(sendPhase++);
      if(sendPhase>3) sendPhase = 1;
    }
    else {
      sendData(1);
      sendData(2);
      sendData(3);
    }
  }
}

void updateData (char c) {
  if ((remainData>>7) && !(c>>7)) {
    int port = (remainData >> 1) & 63;
    
    if (port == 1) {
      int offset = (((remainData & 1) << 1) | (c >> 6)) * 6 + 2;
      for (int i=0; i<6; i++) {
        if ( (c<<i)&1 && pinState[i+offset] < STATE_RUN ) {
            pinState[i+offset] = STATE_WAIT;
            setPortReadable(i+offset);
          }
      }
    }
    if (port >= 2 && port <= 19) {
      int value  =  ((remainData & 1) << 7) + c;
      if (value == 199 || value == 200) {
        if (pinState[port] < STATE_RUN) {
          setPortWritable(port);
          digitalWrite(port,value-199);
        }
      }
      if (value >= 1 && value <= 181) {
        if (!servoFlag) servoFlag = true;
        writeServo(port, value-1);
      }
      if (value == 201) {
        dhtLastUsed = millis();
        if (pinState[value] < STATE_RUN) {
          if (dhtPin != port) {
            pinState[dhtPin] = STATE_WAIT;
            dhtPin = port;
          }
          pinState[dhtPin] = STATE_RUN;
          if (!dhtFlag) {
            dhtFlag = true;
            DHT.read11(dhtPin);
            sendSensorValue(SENSORVALUE_DHT_HUMI, (int)DHT.humidity);
            sendSensorValue(SENSORVALUE_DHT_TEMP, (int)DHT.temperature);
          }
        }
      }
      if (value == 202 || value == 203) {
        usLastUsed = millis();
        if (pinState[port] < STATE_RUN) {
          if (value == 202 && trigPin != port) {
            pinState[trigPin] = STATE_WAIT;
            trigPin = value;
          }
          if (value == 203 && echoPin != port) {
            pinState[echoPin] = STATE_WAIT;
            echoPin = value;
          }
          pinState[port] = STATE_RUN;
          if(!usFlag) {
            usFlag = true;
            distance = ultraSonicRead(trigPin, echoPin);
            sendSensorValue(SENSORVALUE_US_DIST, (int)distance);
          }
        }
      }
    }
    if (port >= 20 && port <= 25) {
      int value  =  ((remainData & 1) << 1) | c;
      if (pinState[pwm[port]] < STATE_RUN) {
          setPortWritable(pwm[port]);
          digitalWrite(pwm[port],value);
        }
    }
    if (port >= 26 && port <= 30) {
      if (port == 26) {
        int number = ((remainData & 1) << 1) | (c >> 6);
        int value = c & 63;
        if (!motorFlag) {
          motorFlag = true;
          pinState[4] = pinState[7] = pinState[8] = pinState[12] = STATE_LOCK;
        }
        if (pinState[motorPin[number]] <= STATE_WAIT) {
          motor[number].ready();
          motor[number].setSpeed(motorSpeed[number]);
        }
        motor[number].run(value);
        pinState[motorPin[number]] = STATE_RUN;
        motorLastUsed[number] = motorLastUsed[4] = millis();
      }
      else {
        int number = port-27;
        int value = ((remainData & 1) << 1) | c;
        if (motorSpeed[number] != value) {
          motorSpeed[number] = value;
          motor[number].setSpeed(value);
        }
        pinState[motorPin[number]] = STATE_RUN;
        motorLastUsed[number] = motorLastUsed[4] = millis();
      }
    }
    remainData = 0;
  }
  else if (c>>7)
    remainData = c;
  else
    remainData = 0;
}

void sendData(int phase) {
  if (phase == 1) {
    sendDigitalValues();
    if (dhtFlag) {
      sendSensorValue(SENSORVALUE_DHT_TEMP, (int)DHT.temperature);
      sendSensorValue(SENSORVALUE_DHT_HUMI, (int)DHT.humidity);
    }
    if (usFlag)
      sendSensorValue(SENSORVALUE_US_DIST, (int)distance);
  }
  if (phase == 2) {
    for (int pinNumber = 14; pinNumber < 20; pinNumber++) {
      sendAnalogValue(pinNumber, 0);
    }
  }
  if (phase == 3) {
    for (int pinNumber = 14; pinNumber < 20; pinNumber++) {
      sendAnalogValue(pinNumber, 1);
    }
  }
}

void collectData() {
  for (int i=0; i<4; i++) {
    digitalEncoded[i] = 0;
  }
  for (int i = 2; i < 14; i++) {
    if (pinState[i] >= STATE_RUN || isPortWritable(i)) {
      digitalReadValue[i] = 0;
      digitalReadValue2[i] = 0;
    }
    else {
      digitalReadValue[i] = digitalRead(i);
      pinMode(i, INPUT_PULLUP);
      digitalReadValue2[i] = digitalRead(i);
      pinMode(i, INPUT);
    }
    if (i < 8) {
      digitalEncoded[0] |= (digitalReadValue[i] & 1) << (i - 2);
      digitalEncoded[1] |= (digitalReadValue2[i] & 1) << (i - 2);
    }
    else {
      digitalEncoded[2] |= (digitalReadValue[i] & 1) << (i - 8);
      digitalEncoded[3] |= (digitalReadValue2[i] & 1) << (i - 8);
    }  
  }
  for (int i = 14; i < 20; i++) {
    if (pinState[i] >= STATE_RUN || isPortWritable(i)) {
      analogReadValue[i - 14] = 0;
      analogReadValue2[i - 14] = 0;
    }
    else {
      analogReadValue[i - 14] = analogReadFast(i);
      pinMode(i, INPUT_PULLUP);
      analogReadValue2[i] = analogReadFast(i);
      pinMode(i, INPUT);
    }
  }
}

void sendDigitalValues() {
  char buf[8] = {0};
  buf[0] = B11111110;
  buf[1] = B00000000 | digitalEncoded[0];
  buf[2] = B11111110;
  buf[3] = B01000000 | digitalEncoded[1];
  buf[4] = B11111111;
  buf[5] = B00000000 | digitalEncoded[2];
  buf[6] = B11111111;
  buf[7] = B01000000 | digitalEncoded[3];
  if (USE_SOFTWARESERIAL) {
    bSerial->write(buf[0]);
    bSerial->write(buf[1]);
    bSerial->write(buf[2]);
    bSerial->write(buf[3]);
    bSerial->write(buf[4]);
    bSerial->write(buf[5]);
    bSerial->write(buf[6]);
    bSerial->write(buf[7]);
  }
  else {
    Serial.write(buf[0]);
    Serial.write(buf[1]);
    Serial.write(buf[2]);
    Serial.write(buf[3]);
    Serial.write(buf[4]);
    Serial.write(buf[5]);
    Serial.write(buf[6]);
    Serial.write(buf[7]);
  }
}

void sendAnalogValue(int pinNumber, int pullup) {
  char buf[2] = {0};
  int value;

  if (!pullup) {
    value = analogReadValue[pinNumber - 14];
  }
  else {
    pinNumber+=6;
    value = analogReadValue2[pinNumber - 14];
  }

  buf[0] = B10000000 | ((pinNumber - 14 & B1111) << 3) | ((value >> 7) & B111);
  buf[1] = value & B01111111;

  if (USE_SOFTWARESERIAL) {
    bSerial->write(buf[0]);
    bSerial->write(buf[1]);
  }
  else {
    Serial.write(buf[0]);
    Serial.write(buf[1]);
  }
}

void sendSensorValue(int sensor, int value) {
  char buf[2] = {0};

  if (sensor < 15)
    buf[0] = B10000000 | ((sensor & B1111) << 3) | (value >> 7 & B111);
  else
    buf[0] = B11111000 | (sensor - 15 & B111);
  buf[1] = B00000000 | (value & B01111111);
  if (USE_SOFTWARESERIAL) {
    bSerial->write(buf[0]);
    bSerial->write(buf[1]);
  }
  else {
    Serial.write(buf[0]);
    Serial.write(buf[1]);
  }
}

void setPortReadable (int port) {
  if (isPortWritable(port))
    pinMode(port, INPUT);
}

void setPortWritable (int port) {
  if (!isPortWritable(port))
    pinMode(port, OUTPUT);
}

boolean isPortWritable (int port) {
  if (port > 13)
    return bitRead(DDRC, port - 14);
  else if (port > 7)
    return bitRead(DDRB, port - 8);
  else
    return bitRead(DDRD, port);
}

void writeServo(int port, int value) {
  int n = 0;
  for (int i = 0; i < SERVO_MAX; i++) {
    if (port == servoPin[i]) {
      n = i;
      break;
    }
  }
  if (!n) {
    if (servoNext == SERVO_MAX)
      servoNext = 0;
    pinState[servoPin[servoNext]] = STATE_WAIT;
    servo[servoNext].detach();
    servoPin[servoNext] = port;
    n = servoNext++;
    servo[n].attach(port);
  }
  if (value != servoValue[n]) {
    servo[n].write(value);
    servoValue[n] = value;
  }
  pinState[servoPin[n]] = STATE_RUN;
  servoLastUsed = millis();
}

void detachServo() {
  for (int i = 0; i < SERVO_MAX; i++) {
    servo[i].detach();
    servoPin[i] = 0;
    servoValue[i] = -1;
    pinState[servoPin[i]] = STATE_WAIT;
  }
  servoFlag = false;
}

int ultraSonicRead(int trig, int echo) {
  pinMode(echo, INPUT);
  pinMode(trig, OUTPUT);
  digitalWrite(trig, LOW);
  digitalWrite(echo, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  return pulseIn(echo, HIGH, 9000) * 17 / 100;
}
