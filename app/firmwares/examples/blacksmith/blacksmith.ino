/**********************************************************************************
   The following software may be included in this software : orion_firmware.ino
   from http://www.makeblock.cc/
   This software contains the following license and notice below:
   CC-BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)
   Author : Ander, Mark Yan
   Updated : Ander, Mark Yan
   Date : 01/09/2016
   Description : Firmware for Makeblock Electronic modules with Scratch.
   Copyright (C) 2013 - 2016 Maker Works Technology Co., Ltd. All right reserved.
 **********************************************************************************/

#include <Servo.h>            //헤더 호출
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include "U8glib.h"

// Module Constant //핀설정
#define ALIVE 0
#define DIGITAL 1
#define ANALOG 2
#define PWM 3
#define SERVO_PIN 4
#define TONE 5
#define PULSEIN 6
#define ULTRASONIC 7
#define TIMER 8
#define READ_BLUETOOTH 9
#define WRITE_BLUETOOTH 10
#define LCD 11
#define RGBLED 12
#define DCMOTOR 13
#define OLED 14

// State Constant
#define GET 1
#define SET 2
#define MODULE 3
#define RESET 4

Servo servos[8];
Servo sv;
LiquidCrystal_I2C lcd(0x27, 16, 2);
SoftwareSerial softSerial(2, 3);
U8GLIB_SSD1306_128X64 oled(U8G_I2C_OPT_NONE);

// val Union        //??
union {
  byte byteVal[4];
  float floatVal;
  long longVal;
} val;

// valShort Union       //??
union {
  byte byteVal[2];
  short shortVal;
} valShort;

int analogs[6] = {0, 0, 0, 0, 0, 0};   // 아날로그 디지털 핀 값저장
int digitals[14] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int servo_pins[8] = {0, 0, 0, 0, 0, 0, 0, 0};

// Ultrasonic             //초음파 센서
float lastUltrasonic = 0;
int trigPin = 13;
int echoPin = 12;

// bluetooth                //블루투스
String makeBtString;
int softSerialRX = 2;
int softSerialTX = 3;

// LCD
String lastLcdDataLine0;
String lastLcdDataLine1;

// Buffer
char buffer[52];
unsigned char prevc = 0;
byte index = 0;
byte dataLen;

double lastTime = 0.0;
double currentTime = 0.0;

uint8_t command_index = 0;

boolean isStart = false;
boolean isUltrasonic = false;
boolean isBluetooth = false;
// End Public Value

void setup() {                            //초기화
  Serial.begin(115200);                   //시리얼 115200
  softSerial.begin(9600);                 //블루투스 9600
  initPorts();
  initLCD();
  delay(200);
}

void initPorts() {                          //디지털 포트 초기화(4~14)
  for (int pinNumber = 4; pinNumber < 14; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
}

void initLCD() {                          //lcd 초기화
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Blacksmith Board");
  lcd.setCursor(6, 1);
  lcd.print("with Entry");
}

void loop() {                    //반복 시리얼 값 , 블루투스 값 받기
  while (Serial.available()) {
    if (Serial.available() > 0) {
      char serialRead = Serial.read();
      setPinValue(serialRead & 0xff);
    }
  }
  while (softSerial.available()) {
    if (softSerial.available() > 0) {
      char softSerialRead = softSerial.read();
      makeBtString += softSerialRead;
    }
  }
  delay(15);
  sendPinValues();                    //핀 값보내기
  delay(10);
}

void setPinValue(unsigned char c) {
  if (c == 0x55 && isStart == false) {
    if (prevc == 0xff) {
      index = 1;
      isStart = true;
    }
  } else {
    prevc = c;
    if (isStart) {
      if (index == 2) {
        dataLen = c;
      } else if (index > 2) {
        dataLen--;
      }
      writeBuffer(index, c);
    }
  }

  index++;

  if (index > 51) {
    index = 0;
    isStart = false;
  }

  if (isStart && dataLen == 0 && index > 3) {
    isStart = false;
    parseData();
    index = 0;
  }
}

unsigned char readBuffer(int index) {
  return buffer[index];
}

void parseData() {
  isStart = false;
  int idx = readBuffer(3);
  command_index = (uint8_t)idx;
  int action = readBuffer(4);
  int device = readBuffer(5);
  int port = readBuffer(6);

  switch (action) {
    case GET: {
        if (device == ULTRASONIC) {
          if (!isUltrasonic) {
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
            if (trig != trigPin || echo != echoPin) {
              trigPin = trig;
              echoPin = echo;
              digitals[trigPin] = 1;
              digitals[echoPin] = 1;
              pinMode(trigPin, OUTPUT);
              pinMode(echoPin, INPUT);
              delay(50);
            }
          }
        }
        else if (device == READ_BLUETOOTH) {
          softSerial.begin(9600);
          pinMode(softSerialRX, INPUT);
          if (!isBluetooth) {
            setBluetoothMode(true);
          }
        }
        else if (device == WRITE_BLUETOOTH) {
          softSerial.begin(9600);
          pinMode(softSerialTX, OUTPUT);
          if (!isBluetooth) {
            setBluetoothMode(true);
          }
        }
        else if (port == trigPin || port == echoPin) {
          setUltrasonicMode(false);
          digitals[port] = 0;
        }
        else if (device != READ_BLUETOOTH && port == softSerialRX ) {
          softSerial.end();
          setBluetoothMode(false);
          digitals[port] = 0;
        }
        else if (device != WRITE_BLUETOOTH && port == softSerialTX) {
          softSerial.end();
          setBluetoothMode(false);
          digitals[port] = 0;
        }
        else {
          digitals[port] = 0;
        }
      }
      break;
    case SET: {
        runSet(device);
        callOK();
      }
      break;
    case MODULE: {
        runModule(device);
        callOK();
      }
    case RESET: {
        callOK();
      }
      break;
  }
}

void runSet(int device) {
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa

  int port = readBuffer(6);
  unsigned char pin = port;
  if (pin == trigPin || pin == echoPin) {
    setUltrasonicMode(false);
  }
  switch (device) {
    case DIGITAL: {
        setPortWritable(pin);
        int v = readBuffer(7);
        digitalWrite(pin, v);
      }
      break;
    case PWM: {
        setPortWritable(pin);
        int v = readBuffer(7);
        analogWrite(pin, v);
      }
      break;
    case TONE: {
        setPortWritable(pin);
        int hz = readShort(7);
        int ms = readShort(9);
        if (ms > 0) {
          tone(pin, hz, ms);
        } else {
          noTone(pin);
        }
      }
      break;
    case SERVO_PIN: {
        setPortWritable(pin);
        int v = readBuffer(7);
        if (v >= 0 && v <= 180) {
          byte rg[]={TCCR1A,TCCR1B,OCR1A,TIMSK1};
          delay(5);
          sv = servos[searchServoPin(pin)];
          sv.attach(pin);
          sv.write(v);
          delay(100);
          sv.detach();
          TCCR1A=rg[0];
          TCCR1B=rg[1];
          TIMSK1=rg[3];
          OCR1A=rg[2];
        }
      }
      break;
    case TIMER: {
        lastTime = millis() / 1000.0;
      }
      break;
    case RGBLED: {
        // 지정된 색깔을 제대로 표현하기 위해 강제로 3회 반복 함
        //if (pin == 3 || pin == 8 || pin == 9) rgbLedVer2(pin);
        //else
        rgbLedVer1(pin);
        delay(10);
        //if (pin == 3 || pin == 8 || pin == 9) rgbLedVer2(pin);
        //else
        rgbLedVer1(pin);
        delay(10);
        //if (pin == 3 || pin == 8 || pin == 9) rgbLedVer2(pin);
       // else
       rgbLedVer1(pin);
        delay(10);
      }
      break;
    case DCMOTOR: {
        int directionPort = readBuffer(7);
        int speedPort = readBuffer(9);
        int directionValue = readBuffer(11);
        int speedValue = readBuffer(13);
        setPortWritable(directionPort);
        setPortWritable(speedPort);
        digitalWrite(directionPort, directionValue);
        analogWrite(speedPort, speedValue);
      }
      break;
    default:
      break;
  }
}

void runModule(int device) {
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
  //head head                        pinNUM
  //                                      A/D

  int port = readBuffer(6);
  unsigned char pin = port;
  switch (device) {
    case LCD: {
        String makeLcdString;
        int arrayNum = 7;
        for (int i = 0; i < 17; i++) {
          char lcdRead = readBuffer(arrayNum);
          if (lcdRead > 0) makeLcdString += lcdRead;
          arrayNum += 2;
        }
        if (makeLcdString.equals(lastLcdDataLine0) == false || makeLcdString.equals(lastLcdDataLine1) == false)
        {
          lcd.setCursor(0, pin);
          lcd.print("                ");
        }
        lcd.setCursor(0, pin);
        if (readBuffer(7) == 1) {
          int lcdInt = readShort(9);
          lcd.print(lcdInt);
        }
        else {
          lcd.print(makeLcdString);
        }
        if (pin == 0) lastLcdDataLine0 = makeLcdString;
        else if (pin == 1) lastLcdDataLine1 = makeLcdString;
      }
      break;
    case OLED: {
        int x = readBuffer(7);
        int y = readBuffer(9);
        String makeOledString;
        int arrayNum = 11;
        for (int i = 0; i < 17; i++) {
          char oledRead = readBuffer(arrayNum);
          if (oledRead > 0) makeOledString += oledRead;
          arrayNum += 2;
        }

        if (readBuffer(11) == 1) {
          int oledInt = readShort(13);
          oled.firstPage();
          do {
            oled.setFont(u8g_font_unifont);
            oled.setPrintPos(x, y);
            oled.print(oledInt);
          } while (oled.nextPage());
        }
        else {
          oled.firstPage();
          do {
            oled.setFont(u8g_font_unifont);
            oled.setPrintPos(x, y);
            oled.print(makeOledString);
          } while (oled.nextPage());
        }
      }
      break;
    case WRITE_BLUETOOTH: {
        char softSerialTemp[32];
        int arrayNum = 7;
        for (int i = 0; i < 17; i++) {
          softSerialTemp[i] = readBuffer(arrayNum);
          arrayNum += 2;
        }
        softSerial.write(softSerialTemp);
      }
      break;
    default:
      break;
  }
}

void sendPinValues() {   //핀 값 보내기
  int pinNumber = 0;
  for (pinNumber = 4; pinNumber < 14; pinNumber++) {
    if (digitals[pinNumber] == 0) {
      sendDigitalValue(pinNumber);
      callOK();
    }
  }
  for (pinNumber = 0; pinNumber < 6; pinNumber++) {
    if (analogs[pinNumber] == 0) {
      sendAnalogValue(pinNumber);
      callOK();
    }
  }

  if (isUltrasonic) {
    sendUltrasonic();
    callOK();
  }

  if (isBluetooth) {
    sendBluetooth();
    callOK();
  }
}

void setUltrasonicMode(boolean mode) {
  isUltrasonic = mode;
  if (!mode) {
    lastUltrasonic = 0;
  }
}

void setBluetoothMode(boolean mode) {
  isBluetooth = mode;
  if (!mode) {
    makeBtString = "";
  }
}

void sendUltrasonic() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  float value = pulseIn(echoPin, HIGH, 30000) / 29.0 / 2.0;

  if (value == 0) {
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

void sendBluetooth() {
  writeHead();
  sendString(makeBtString);
  writeSerial(softSerialRX);
  writeSerial(READ_BLUETOOTH);
  writeEnd();
  makeBtString = "";
}

void sendDigitalValue(int pinNumber) {
  pinMode(pinNumber, INPUT);
  writeHead();
  sendFloat(digitalRead(pinNumber));
  writeSerial(pinNumber);
  writeSerial(DIGITAL);
  writeEnd();
}

void sendAnalogValue(int pinNumber) {
  float prevData, lpfData, measurement;
  float alpha = 0.1;
  bool firstRun = true;

  for (int i = 0; i < 20; i++) {
    measurement = analogRead(pinNumber);
    if (firstRun == true) {
      prevData = measurement;
      firstRun = false;
    }
    lpfData = alpha * prevData + (1 - alpha) * measurement ;
    prevData = lpfData;
  }

  writeHead();
  sendFloat((int)lpfData);
  writeSerial(pinNumber);
  writeSerial(ANALOG);
  writeEnd();
}

void writeBuffer(int index, unsigned char c) {
  buffer[index] = c;
}

void writeHead() {
  writeSerial(0xff);
  writeSerial(0x55);
}

void writeEnd() {
  Serial.println();
}

void writeSerial(unsigned char c) {
  Serial.write(c);
}

void sendString(String s) {
  int l = s.length();
  writeSerial(4);
  writeSerial(l);
  for (int i = 0; i < l; i++) {
    writeSerial(s.charAt(i));
  }
}

void sendFloat(float value) {
  writeSerial(2);
  val.floatVal = value;
  writeSerial(val.byteVal[0]);
  writeSerial(val.byteVal[1]);
  writeSerial(val.byteVal[2]);
  writeSerial(val.byteVal[3]);
}

void sendShort(double value) {
  writeSerial(3);
  valShort.shortVal = value;
  writeSerial(valShort.byteVal[0]);
  writeSerial(valShort.byteVal[1]);
}

short readShort(int idx) {
  valShort.byteVal[0] = readBuffer(idx);
  valShort.byteVal[1] = readBuffer(idx + 1);
  return valShort.shortVal;
}

float readFloat(int idx) {
  val.byteVal[0] = readBuffer(idx);
  val.byteVal[1] = readBuffer(idx + 1);
  val.byteVal[2] = readBuffer(idx + 2);
  val.byteVal[3] = readBuffer(idx + 3);
  return val.floatVal;
}

long readLong(int idx) {
  val.byteVal[0] = readBuffer(idx);
  val.byteVal[1] = readBuffer(idx + 1);
  val.byteVal[2] = readBuffer(idx + 2);
  val.byteVal[3] = readBuffer(idx + 3);
  return val.longVal;
}

int searchServoPin(int pin) {
  for (int i = 0; i < 8; i++) {
    if (servo_pins[i] == pin) {
      return i;
    }
    if (servo_pins[i] == 0) {
      servo_pins[i] = pin;
      return i;
    }
  }
  return 0;
}

void setPortWritable(int pin) {
  if (digitals[pin] == 0) {
    digitals[pin] = 1;
    pinMode(pin, OUTPUT);
  }
}

void callOK() {          //상태 확인용
  writeSerial(0xff);     //테일
  writeSerial(0x55);    //테일2
  writeEnd();           //다음줄로 넘기기
}

void callDebug(char c) {
  writeSerial(0xff);
  writeSerial(0x55);
  writeSerial(c);
  writeEnd();
}

void rgbLedVer1(int pin) {
  cli();
  byte color[3] = {0};
  byte colorBuff[3][8] = {0};
  setPortWritable(pin);
  color[0] = readBuffer(9);   // green
  color[1] = readBuffer(7);   // red
  color[2] = readBuffer(11);  // blue

  for (int i = 0; i < 3; i++) {
    for (int j = 7; j >= 0; j--) {
      colorBuff[i][j] = (color[i] >> j ) & 0x01;
    }
  }
  if (2 <= pin && pin <= 7) {
    if (pin == 3) PORTD &= ~B00001000;
    else if (pin == 4) PORTD &= ~B00010000;
    else if (pin == 5) PORTD &= ~B00100000;
    else if (pin == 6) PORTD &= ~B01000000;
    else if (pin == 7) PORTD &= ~B10000000;
    for (register unsigned char i = 0; i < 85; i++) // 80 us
    {
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
    }
    for (int i = 0; i < 3; i++) {
      for (int j = 7; j >= 0; j--) {
        if (colorBuff[i][j] == 1) {
          if (pin == 3) PORTD |= B00001000;
          else if (pin == 4) PORTD |= B00010000;
          else if (pin == 5) PORTD |= B00100000;
          else if (pin == 6) PORTD |= B01000000;
          else if (pin == 7) PORTD |= B10000000;
          for (register unsigned char i = 0; i < 26; i++) // 25 us
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
          if (pin == 3) PORTD &= ~B00001000;
          else if (pin == 4) PORTD &= ~B00010000;
          else if (pin == 5) PORTD &= ~B00100000;
          else if (pin == 6) PORTD &= ~B01000000;
          else if (pin == 7) PORTD &= ~B10000000;
          for (register unsigned char i = 0; i < 25; i++) // 25 us
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
        }
        else {
          if (pin == 3) PORTD |= B00001000;
          else if (pin == 4) PORTD |= B00010000;
          else if (pin == 5) PORTD |= B00100000;
          else if (pin == 6) PORTD |= B01000000;
          else if (pin == 7) PORTD |= B10000000;
          for (register unsigned char i = 0; i < 15; i++) // 15 us
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
          if (pin == 3) PORTD &= ~B00001000;
          else if (pin == 4) PORTD &= ~B00010000;
          else if (pin == 5) PORTD &= ~B00100000;
          else if (pin == 6) PORTD &= ~B01000000;
          else if (pin == 7) PORTD &= ~B10000000;
          for (register unsigned char i = 0; i < 14; i++) // 15 us
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
        }
      }
    }
    if (pin == 3) PORTD |= B00001000;
    else if (pin == 4) PORTD |= B00010000;
    else if (pin == 5) PORTD |= B00100000;
    else if (pin == 6) PORTD |= B01000000;
    else if (pin == 7) PORTD |= B10000000;
  } // if(2 <= pin && pin <= 7)
  else if (8 <= pin && pin <= 13) {
    if (pin == 8) PORTB &= ~B00000001;
    else if (pin == 9) PORTB &= ~B00000010;
    else if (pin == 10) PORTB &= ~B00000100;
    else if (pin == 11) PORTB &= ~B00001000;
    else if (pin == 12) PORTB &= ~B00010000;
    else if (pin == 13) PORTB &= ~B00100000;
    for (register unsigned char i = 0; i < 85; i++)
    {
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
    }
    for (int i = 0; i < 3; i++) {
      for (int j = 7; j >= 0; j--) {
        if (colorBuff[i][j] == 1) {
          if (pin == 8) PORTB |= B00000001;
          else if (pin == 9) PORTB |= B00000010;
          else if (pin == 10) PORTB |= B00000100;
          else if (pin == 11) PORTB |= B00001000;
          else if (pin == 12) PORTB |= B00010000;
          else if (pin == 13) PORTB |= B00100000;
          for (register unsigned char i = 0; i < 26; i++)
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
          if (pin == 8) PORTB &= ~B00000001;
          else if (pin == 9) PORTB &= ~B00000010;
          else if (pin == 10) PORTB &= ~B00000100;
          else if (pin == 11) PORTB &= ~B00001000;
          else if (pin == 12) PORTB &= ~B00010000;
          else if (pin == 13) PORTB &= ~B00100000;
          for (register unsigned char i = 0; i < 25; i++)
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
        }
        else {
          if (pin == 8) PORTB |= B00000001;
          else if (pin == 9) PORTB |= B00000010;
          else if (pin == 10) PORTB |= B00000100;
          else if (pin == 11) PORTB |= B00001000;
          else if (pin == 12) PORTB |= B00010000;
          else if (pin == 13) PORTB |= B00100000;
          for (register unsigned char i = 0; i < 15; i++)
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
          if (pin == 8) PORTB &= ~B00000001;
          else if (pin == 9) PORTB &= ~B00000010;
          else if (pin == 10) PORTB &= ~B00000100;
          else if (pin == 11) PORTB &= ~B00001000;
          else if (pin == 12) PORTB &= ~B00010000;
          else if (pin == 13) PORTB &= ~B00100000;
          for (register unsigned char i = 0; i < 14; i++)
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
        }
      }
    }
    if (pin == 8) PORTB |= B00000001;
    else if (pin == 9) PORTB |= B00000010;
    else if (pin == 10) PORTB |= B00000100;
    else if (pin == 11) PORTB |= B00001000;
    else if (pin == 12) PORTB |= B00010000;
    else if (pin == 13) PORTB |= B00100000;
  } // if(8 <= pin && pin <= 13)
  sei();
}

/*
// 대장장이 주니어 3, 8, 9 번핀 작동 함수
void rgbLedVer2(int pin) {
  byte color[3] = {0};
  byte colorBuff[3][8] = {0};
  setPortWritable(pin);
  color[0] = readBuffer(9);   // green
  color[1] = readBuffer(7);   // red
  color[2] = readBuffer(11);  // blue
  if (color[0] > 254) color[0] = 254; // 255 일 경우 오동작이 자주 됨
  if (color[1] > 254) color[1] = 254; // 255 일 경우 오동작이 자주 됨
  if (color[2] > 254) color[2] = 254; // 255 일 경우 오동작이 자주 됨
  for (int i = 0; i < 3; i++) {
    for (int j = 7; j >= 0; j--) {
      colorBuff[i][j] = (color[i] >> j ) & 0x01;
    }
  }
  if (2 <= pin && pin <= 7) {
    if (pin == 3) PORTD &= ~B00001000;
    for (register unsigned char i = 0; i < 85; i++) // 80 us
    {
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
    }
    for (int i = 0; i < 3; i++) {
      for (int j = 7; j >= 0; j--) {
        if (colorBuff[i][j] == 1) {
          if (pin == 3) PORTD |= B00001000;
          for (register unsigned char i = 0; i < 27; i++) // 25 us
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
          if (pin == 3) PORTD &= ~B00001000;
          for (register unsigned char i = 0; i < 26; i++) // 25 us
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
        }
        else {
          if (pin == 3) PORTD |= B00001000;
          for (register unsigned char i = 0; i < 16; i++) // 15 us
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
          if (pin == 3) PORTD &= ~B00001000;
          for (register unsigned char i = 0; i < 15; i++) // 15 us
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
        }
      }
    }
    if (pin == 3) PORTD |= B00001000;
  } // if(2 <= pin && pin <= 7)

  else if (8 <= pin && pin <= 13) {
    if (pin == 8) PORTB &= ~B00000001;
    else if (pin == 9) PORTB &= ~B00000010;
    for (register unsigned char i = 0; i < 85; i++)
    {
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
      asm volatile(" PUSH R0 ");
      asm volatile(" POP R0 ");
    }
    for (int i = 0; i < 3; i++) {
      for (int j = 7; j >= 0; j--) {
        if (colorBuff[i][j] == 1) {
          if (pin == 8) PORTB |= B00000001;
          else if (pin == 9) PORTB |= B00000010;
          for (register unsigned char i = 0; i < 27; i++)
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
          if (pin == 8) PORTB &= ~B00000001;
          else if (pin == 9) PORTB &= ~B00000010;
          for (register unsigned char i = 0; i < 26; i++)
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
        }
        else {
          if (pin == 8) PORTB |= B00000001;
          else if (pin == 9) PORTB |= B00000010;
          for (register unsigned char i = 0; i < 16; i++)
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
          if (pin == 8) PORTB &= ~B00000001;
          else if (pin == 9) PORTB &= ~B00000010;
          for (register unsigned char i = 0; i < 15; i++)
          {
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
            asm volatile(" PUSH R0 ");
            asm volatile(" POP R0 ");
          }
        }
      }
    }
    if (pin == 8) PORTB |= B00000001;
    else if (pin == 9) PORTB |= B00000010;
  } // if(8 <= pin && pin <= 13)
}
*/
