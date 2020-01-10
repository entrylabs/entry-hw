#include <Wire.h>
// 서보 라이브러리
#include <Servo.h>
#include "I2C_LCD.h"

//핀
#define RGB_R_PIN 8
#define RGB_G_PIN 13
#define RGB_B_PIN 12

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
#define LCD_PRINT 9
#define LCD_CLEAR 10
#define LCD_INIT 11

#define FLOAT 2
#define SHORT 3

// 상태 상수
#define GET 1
#define SET 2
#define RESET 3

// val Union
union {
  byte byteVal[4];
  float floatVal;
  long longVal;
} val;

// valShort Union
union {
  byte byteVal[2];
  short shortVal;
} valShort;

typedef struct {
  int pin;
  int value;
} SoftwarePWM;

SoftwarePWM RGBLeds[3] = {
  {RGB_R_PIN, 0},
  {RGB_G_PIN, 255},
  {RGB_B_PIN, 0}
};

// 전역변수 선언 시작
Servo servos[8];

I2C_LCD lcd(0x20, 16, 2);

//울트라 소닉 포트
int trigPin = 13;
int echoPin = 12;

//포트별 상태
int analogs[6] = {0, 0, 0, 0, 0, 0};
int digitals[14] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int servo_pins[8] = {0, 0, 0, 0, 0, 0, 0, 0};

// 울트라소닉 최종 값
float lastUltrasonic = 0;

// 버퍼
char buffer[52];
unsigned char prevc = 0;

byte index = 0;
byte dataLen;

double lastTime = 0.0;
double currentTime = 0.0;

uint8_t command_index = 0;

const int CYCLE_LENGTH = 1000000 / 300;

boolean isStart = false;
boolean isUltrasonic = false;
// 전역변수 선언 종료
int lcdAddress = 0;


byte findI2CAddress() {
  byte error, address = 0, foundAddress;

  for (address = 1; address < 127; address++ ) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      foundAddress =  address;
    } else if (error == 4) {
      //      foundAddress =  address;
    }
  }
  return foundAddress;
}

void setup() {
  Wire.begin();
  Serial.begin(115200);

  initLCD();
  initPorts();
  delay(200);
}
void initLCD() {
  lcdAddress = findI2CAddress();
  lcd.setAddress(lcdAddress);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("CodingBox");
}
void initPorts() {
  for (int pinNumber = 0; pinNumber < 14; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
}

void loop() {
  while (Serial.available()) {
    if (Serial.available() > 0) {
      char serialRead = Serial.read();
      setPinValue(serialRead & 0xff);
    }
  }

  //  loopRGB();
  //  RGBLeds[2].value = map(analogRead(0), 0, 1024, 0, 255);

  delay(15);
  sendPinValues();
  delay(10);
}

void setPinValue(unsigned char c) {
  // 새로운 데이터 스트림이 들어올 경우, 새로운 데이터 스트림 처리를 위한 시작을 준비합니다.
  if (c == 0x55 && isStart == false) {
    if (prevc == 0xff) {
      index = 1;
      isStart = true;
    }
  } else {
    prevc = c;
    if (isStart) {
      //     두번째 index 데이터는 데이터길이므로, 데이터길이변수에 저장합니다.
      if (index == 2) {
        dataLen = c;
        //      index가 2이상일 경우 길이변수를 -1합니다.
      } else if (index > 2) {
        dataLen--;
      }

      writeBuffer(index, c);
    }
  }

  index++;

  // 버퍼 용량이상이 되면, 초기화합니다.
  if (index > 51) {
    index = 0;
    isStart = false;
  }

  // 시작중이고, 데이터길이가 0(모든 데이터를 읽었을 경우), index가 3이상(0,1 시작헤더, 2길이)일경우는 명령을 파싱합니다.
  if (isStart && dataLen == 0 && index > 3) {
    // 시작플래그를 비활성화합니다.
    isStart = false;
    // 버퍼에 저장된 데이터를 파싱합니다.
    parseData();
    // index를 초기화합니다.
    index = 0;
  }
}

unsigned char readBuffer(int index) {
  return buffer[index];
}

void loopRGB() {
  float dutyCycle;
  int onTime;
  int offTime;

  for (int i = 0; i < 3; i++) {
    dutyCycle = RGBLeds[i].value / 255.0;
    onTime = dutyCycle * CYCLE_LENGTH;
    offTime = CYCLE_LENGTH - onTime;

    if (onTime > 0) {
      digitalWrite(RGBLeds[i].pin, HIGH);
      delayMicroseconds(onTime);
    }
    digitalWrite(RGBLeds[i].pin, LOW);
    delayMicroseconds(offTime);
  }
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
              digitals[trigPin] = 0;
              digitals[echoPin] = 0;
              trigPin = trig;
              echoPin = echo;
              digitals[trigPin] = 1;
              digitals[echoPin] = 1;
              pinMode(trigPin, OUTPUT);
              pinMode(echoPin, INPUT);
              delay(50);
            }
          }
        } else if (port == trigPin || port == echoPin) {
          setUltrasonicMode(false);
          digitals[port] = 0;
        } else {
          setUltrasonicMode(false);
          digitals[port] = 0;
        }
      }
      break;
    case SET: {
        runModule(device);
        callOK();
      }
      break;
    case RESET: {
        lcd.clear();
        callOK();
      }
      break;
  }
}

void runModule(int device) {
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
  int port = readBuffer(6);
  int pin = port;

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
          Servo sv = servos[searchServoPin(pin)];
          sv.attach(pin);
          sv.write(v);
        }
      }
      break;
    case LCD_PRINT: {
        int row = readBuffer(7);
        int column = readBuffer(8);
        int len = readBuffer(9);
        String txt = readString(len, 10);

        lcd.setCursor(column, row);
        lcd.print(txt);
      }
      break;
    case LCD_CLEAR: {
        lcd.clear();
      }
      break;
    case LCD_INIT: {
        initLCD();
      }
      break;
    case TIMER: {
        lastTime = millis() / 1000.0;
      }
      break;
  }
}

/* 아두이노에서 엔트리로 데이터 전송아두이노에서 엔트리로 데이터 전송
    디지털, 아날로그, 초음파센서등 정보 전송
*/
void sendPinValues() {
  int pinNumber = 0;
  //디지털핀 상태 전송
  for (pinNumber = 0; pinNumber < 12; pinNumber++) {
    if (digitals[pinNumber] == 0) {
      sendDigitalValue(pinNumber);
      callOK();
    }
  }
  //아날로그핀 상태 전송
  for (pinNumber = 0; pinNumber < 6; pinNumber++) {
    if (analogs[pinNumber] == 0) {
      sendAnalogValue(pinNumber);
      callOK();
    }
  }
  // 초음파센서가 활성화 되어있을 겨우 초음파센서 데이터 전송
  if (isUltrasonic) {
    sendUltrasonic();
    callOK();
  }
}

void setUltrasonicMode(boolean mode) {
  isUltrasonic = mode;
  if (!mode) {
    lastUltrasonic = 0;
  }
}

/** 초음파센서 데이터 전송(엔트리->PC)
*/
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

/** 디지털 데이터 전송(엔트리->PC)
*/
void sendDigitalValue(int pinNumber) {
  pinMode(pinNumber, INPUT);
  writeHead();
  sendFloat(digitalRead(pinNumber));
  writeSerial(pinNumber);
  writeSerial(DIGITAL);
  writeEnd();
}

/** 아날로그 데이터 전송(엔트리->PC)
    헤드   헤드   데이터길이?   아날로그값 아날로그핀번호 타입  종단 바이트
    0xFF 0x55   2     xx        x     0x2    0x0A
*/
void sendAnalogValue(int pinNumber) {
  writeHead();
  sendFloat(analogRead(pinNumber));
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
  writeSerial(FLOAT);
  val.floatVal = value;
  writeSerial(val.byteVal[0]);
  writeSerial(val.byteVal[1]);
  writeSerial(val.byteVal[2]);
  writeSerial(val.byteVal[3]);
}

void sendShort(double value) {
  writeSerial(SHORT);
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

String readString(int len, int startIdx) {
  String str = "";

  for (int i = startIdx; i < (startIdx + len); i++) {
    str += (char) readBuffer(i);
  }

  return str;
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

void callOK() {
  writeSerial(0xff);
  writeSerial(0x55);
  writeEnd();
}

void callDebug(char c) {
  writeSerial(0xff);
  writeSerial(0x55);
  writeSerial(c);
  writeEnd();
}

