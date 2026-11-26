/**********************************************************************************
 * The following software may be included in this software : orion_firmware.ino
 * from http://www.makeblock.cc/
 * This software contains the following license and notice below:
 * CC-BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)
 * Author : Ander, Mark Yan
 * Updated : Ander, Mark Yan
 * Date : 01/09/2016
 * Description : Firmware for Makeblock Electronic modules with Scratch.
 * Refactored with millis() for non-blocking operation.
 * Copyright (C) 2013 - 2016 Maker Works Technology Co., Ltd. All right reserved. 
 **********************************************************************************/
#include <Servo.h>
#include <Adafruit_NeoPixel.h>

#define ALIVE 0
#define DIGITAL 1
#define ANALOG 2
#define PWM 3
#define SERVO_PIN 4
#define TONE 5
#define PULSEIN 6
#define ULTRASONIC 7
#define TIMER 8
#define NEOPIXEL_INIT 9
#define NEOPIXEL_COLOR 10
#define NEOPIXEL_BRIGHTNESS 11
#define NEOPIXEL_SHIFT 12
#define NEOPIXEL_ROTATE 13
// Added for firmware-side blinking
#define NEOPIXEL_BLINK 14
#define NEOPIXEL_BLINK_STOP 15

#define NEOPIXEL_PIN 9
#define NEOPIXEL_COUNT 4

#define GET 1
#define SET 2
#define RESET 3

// val Union
union{
  byte byteVal[4];
  float floatVal;
  long longVal;
}val;

// valShort Union
union{
  byte byteVal[2];
  short shortVal;
}valShort;

Servo servos[8];
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
boolean neopixelInitialized = true;

int trigPin = 13;
int echoPin = 12;

int analogs[8]={0,0,0,0,0,0,0,0};
int digitals[14]={0,0,0,0,0,0,0,0,0,1,0,0,0,0};
int servo_pins[8]={0,0,0,0,0,0,0,0};

float lastUltrasonic = 0;

// Buffer
char buffer[52];
unsigned char prevc=0;

byte index = 0;
byte dataLen;

double lastTime = 0.0;
double currentTime = 0.0;

uint8_t command_index = 0;
uint32_t neoPixelColors[4] = {0,0,0,0};

boolean isStart = false;
boolean isUltrasonic = false;

// --- 변수 추가: Non-blocking 타이머용 ---
unsigned long previousSensorTime = 0;
// sendPinValues() 함수를 실행할 간격 (밀리초)
// 중요: pulseIn() 등 blocking 함수가 있으므로 간격을 100ms로 늘림
const unsigned long sensorInterval = 100;

unsigned long previousBlinkUpdateTime = 0;
// 네오픽셀 깜박이기 업데이트 간격 (명령 밀림 방지를 위해 빈도 제한)
const unsigned long blinkUpdateInterval = 10; // 10ms마다 체크 (초당 100회)
// ---

// --- NeoPixel Blink State (millis 기반 비동기 무한 깜박이기) ---
typedef struct {
  boolean active;
  uint8_t r;
  uint8_t g;
  uint8_t b;
  boolean isOn;       // 현재 ON 상태인가
  unsigned long interval;    // 토글 간격(ms)
  unsigned long lastMillis;  // 마지막 토글 시각
  uint8_t startIdx;   // LED 시작 인덱스 (포함)
  uint8_t endIdx;     // LED 끝 인덱스 (포함)
} BlinkState;

BlinkState blinkLeft  = { false, 0, 0, 0, false, 500, 0, 2, 3 };
BlinkState blinkRight = { false, 0, 0, 0, false, 500, 0, 0, 1 };

void blinkApplyRange(BlinkState *s, boolean on) {
  uint32_t color = on ? strip.Color(s->r, s->g, s->b) : 0;
  for (uint8_t i = s->startIdx; i <= s->endIdx; i++) {
    strip.setPixelColor(i, color);
    neoPixelColors[i] = color;
  }
  strip.show();
}

void startBlink(BlinkState *s, uint8_t r, uint8_t g, uint8_t b, unsigned long intervalMs, unsigned long syncTime = 0) {
  // 이미 진행 중이면 색/간격만 갱신하고 현재 상태 유지
  if (s->active) {
    s->r = r; s->g = g; s->b = b;
    s->interval = (intervalMs < 50) ? 50 : intervalMs;
    blinkApplyRange(s, s->isOn);
    return;
  }

  // 새로 시작 (즉시 켜기)
  s->r = r; s->g = g; s->b = b;
  s->interval = (intervalMs < 50) ? 50 : intervalMs;
  s->lastMillis = (syncTime > 0) ? syncTime : millis();
  s->active = true;
  s->isOn = true;
  blinkApplyRange(s, true);
}

void stopBlink(BlinkState *s) {
  // STOP 명령: 즉시 LED 끄기 및 상태 리셋
  s->active = false;
  s->isOn = false;
  // LED 강제 끄기
  blinkApplyRange(s, false);
}

void resetBlinkStates() {
  // 모든 깜박이기 상태 초기화 (연결 끊김 시 호출)
  stopBlink(&blinkLeft);
  stopBlink(&blinkRight);
}

void updateBlinkStates() {
  unsigned long now = millis();
  // Left
  if (blinkLeft.active && (now - blinkLeft.lastMillis >= blinkLeft.interval)) {
    blinkLeft.lastMillis = now;
    blinkLeft.isOn = !blinkLeft.isOn;
    blinkApplyRange(&blinkLeft, blinkLeft.isOn);
  }
  // Right
  if (blinkRight.active && (now - blinkRight.lastMillis >= blinkRight.interval)) {
    blinkRight.lastMillis = now;
    blinkRight.isOn = !blinkRight.isOn;
    blinkApplyRange(&blinkRight, blinkRight.isOn);
  }
}

void setup(){
  Serial.begin(57600);
  initPorts();
  
  // Initialize NeoPixel before serial communication starts
  strip.begin();
  strip.clear();
  strip.show();
  
  delay(200); // 셋업 중의 딜레이는 허용
}

void initPorts() {
  for (int pinNumber = 0; pinNumber < 14; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
  // 깜박이기 상태도 초기화
  resetBlinkStates();
}

// ===== 수정된 loop() 함수 =====
void loop(){
  // 1. 시리얼 수신을 최우선 처리 (명령 밀림 방지)
  // 버퍼가 비워질 때까지 최대한 빠르게 읽고 처리
  // 한 loop() 사이클에서 여러 명령을 처리할 수 있도록 충분히 반복
  int processedBytes = 0;
  while (Serial.available() && processedBytes < 200) {
    char serialRead = Serial.read();
    setPinValue(serialRead&0xff);
    processedBytes++;
  }
  
  // 2. 네오픽셀 깜박이기 상태 업데이트 (빈도 제한)
  unsigned long currentMillis = millis();
  if (currentMillis - previousBlinkUpdateTime >= blinkUpdateInterval) {
    previousBlinkUpdateTime = currentMillis;
    updateBlinkStates();
  }
  
  // 3. 센서 값 전송을 주기적으로 확인 (Non-blocking)
  // pulseIn() 등 blocking 함수가 있으므로 간격을 넉넉히 설정
  if (currentMillis - previousSensorTime >= sensorInterval) {
    previousSensorTime = currentMillis; // 다음 주기를 위해 시간 갱신
    sendPinValues();
  }

  // 기존 delay() 호출 제거
  /*
  delay(15);
  sendPinValues();
  delay(10);
  */
}
// ===== loop() 함수 수정 끝 =====


void setPinValue(unsigned char c) {
  if(c==0x55&&isStart==false){
    if(prevc==0xff){
      index=1;
      isStart = true;
    }    
  } else {    
    prevc = c;
    if(isStart) {
      if(index==2){
        dataLen = c; 
      } else if(index>2) {
        dataLen--;
      }
      
      writeBuffer(index,c);
    }
  }
    
  index++;
  
  if(index>51) {
    index=0; 
    isStart=false;
  }
    
  if(isStart&&dataLen==0&&index>3){ 
    isStart = false;
    parseData(); 
    index=0;
  }
}

unsigned char readBuffer(int index){
  return buffer[index]; 
}

void parseData() {
  isStart = false;
  int idx = readBuffer(3);
  command_index = (uint8_t)idx;
  int action = readBuffer(4);
  int device = readBuffer(5);
  int port = readBuffer(6);
  switch(action){
    case GET:{
      if(device == ULTRASONIC){
        if(!isUltrasonic) {
          setUltrasonicMode(true);
          trigPin = readBuffer(6);
          echoPin = readBuffer(7);
          digitals[trigPin] = 1;
          digitals[echoPin] = 1;
          pinMode(trigPin, OUTPUT);
          pinMode(echoPin, INPUT);
          delay(50); // 핀 모드 변경 시 안정화를 위한 딜레이 (유지)
        } else {
          int trig = readBuffer(6);
          int echo = readBuffer(7);
          if(trig != trigPin || echo != echoPin) {
            trigPin = trig;
            echoPin = echo;
            digitals[trigPin] = 1;
            digitals[echoPin] = 1;
            pinMode(trigPin, OUTPUT);          
            pinMode(echoPin, INPUT);
            delay(50); // 핀 모드 변경 시 안정화를 위한 딜레이 (유지)
          }
        }
      } else if(port == trigPin || port == echoPin) {
        setUltrasonicMode(false);
        digitals[port] = 0;
      } else {
        digitals[port] = 0;
      }
    }
    break;
    case SET:{
      runModule(device, port);
      callOK();
    }
    break;
    case RESET:{
      // 연결 끊김 시 모든 상태 초기화
      resetBlinkStates();
      // 네오픽셀 끄기
      strip.clear();
      strip.show();
      callOK();
    }
    break;
  }
}

void runModule(int device, int pin) {
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa

  if(pin == trigPin || pin == echoPin) {
    setUltrasonicMode(false);
  }
  
  switch(device){
    case DIGITAL:{      
      setPortWritable(pin);
      int v = readBuffer(7);
      digitalWrite(pin,v);
    }
    break;
    case PWM:{
      setPortWritable(pin);
      int v = readBuffer(7);
      analogWrite(pin,v);
    }
    break;
    case TONE:{
      setPortWritable(pin);
      int hz = readShort(7);
      int ms = readShort(9);
      if(ms>0) {
        tone(pin, hz, ms);
      } else {
        noTone(pin);
      }
    }
    break;
    case SERVO_PIN:{
      setPortWritable(pin);
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
    case NEOPIXEL_INIT: {
      setPortWritable(9);
      if (!neopixelInitialized) {
        strip.begin();
        strip.clear();
        strip.show();
        for(int i=0;i<4;i++){
          neoPixelColors[i] = 0;
        }
        neopixelInitialized = true;
      }
      // 깜박이기 동작이 있었다면 모두 중지
      stopBlink(&blinkLeft);
      stopBlink(&blinkRight);
      break;
    }
    case NEOPIXEL_BLINK: {
      setPortWritable(9);
      uint8_t side = readBuffer(7);   // 255: 전체, 0: 왼쪽, 1: 오른쪽
      uint8_t count = readBuffer(8); // 호환성 유지용으로 수신만, 사용하지 않음 (무한 깜박임)
      uint8_t r = readBuffer(9);
      uint8_t g = readBuffer(10);
      uint8_t b = readBuffer(11);
      unsigned long interval = (unsigned long)readShort(12);
      if (interval < 50) interval = 50;
      
      // side == 255(or legacy 2) => 전체
      if (side == 2) {
        unsigned long syncTime = millis(); // 양쪽 동기화를 위한 공통 시각
        startBlink(&blinkLeft, r, g, b, interval, syncTime);
        startBlink(&blinkRight, r, g, b, interval, syncTime);
      } else if (side == 0) {
        startBlink(&blinkLeft, r, g, b, interval);
      } else {
        startBlink(&blinkRight, r, g, b, interval);
      }
      break;
    }
    case NEOPIXEL_BLINK_STOP: {
      setPortWritable(9);
      uint8_t side = readBuffer(7);  // 255: 전체, 0: 왼쪽, 1: 오른쪽
      if (side == 2) {
        stopBlink(&blinkLeft);
        stopBlink(&blinkRight);
      } else if (side == 0) {
        stopBlink(&blinkLeft);
      } else {
        stopBlink(&blinkRight);
      }
      break;
    }
    case NEOPIXEL_COLOR: {
      setPortWritable(9);
      int num = readBuffer(7);
      
      // num이 254이면 범위 LED 설정 (RANGE 명령)
      if (num == 254) {
        int start = readBuffer(8);
        int end = readBuffer(9);
        int r = readBuffer(10);
        int g = readBuffer(11);
        int b = readBuffer(12);
        
        if(end > 3) end = 3;
        if(start < 0) start = 0;
        strip.fill(strip.Color(r,g,b), start, end-start+1);
        for(int i=start;i<=end;i++){
          neoPixelColors[i] = strip.Color(r,g,b);
        }
      }
      // num이 255이면 모든 LED를 같은 색으로 설정 (ALL 명령)
      else if (num == 255) {
        int r = readBuffer(8);
        int g = readBuffer(9);
        int b = readBuffer(10);
        
        strip.fill(strip.Color(r, g, b), 0, 4);
        for(int i=0;i<4;i++){
          neoPixelColors[i] = strip.Color(r,g,b);
        }
      }
      // 개별 LED 설정
      else {
        int r = readBuffer(8);
        int g = readBuffer(9);
        int b = readBuffer(10);
        
        strip.setPixelColor(num, strip.Color(r, g, b));
        neoPixelColors[num] = strip.Color(r,g,b);
      }
      strip.show();
      neopixelInitialized = false;
      break;
    }
    case NEOPIXEL_BRIGHTNESS: {
      setPortWritable(9);
      int brightness = readShort(7);
      if (brightness < 0) brightness = 0;
      if (brightness > 255) brightness = 255;
      strip.setBrightness(brightness);
      strip.show();
      break;
    }

    case NEOPIXEL_SHIFT: {
      setPortWritable(9);
      int direction = (int8_t)readBuffer(7); // 1: 오른쪽, -1: 왼쪽
      int steps = readBuffer(8);
      int isRotate = readBuffer(9); // 0: shift, 1: rotate
      
      // steps 범위 체크
      if (steps < 0) steps = 0;
      if (steps > NEOPIXEL_COUNT) steps = NEOPIXEL_COUNT;
      
      // 현재 LED 색상을 임시 배열에 저장
      uint32_t tempColors[NEOPIXEL_COUNT];
      for (int i = 0; i < NEOPIXEL_COUNT; i++) {
        tempColors[i] = strip.getPixelColor(i);
      }
      
      // 모든 LED 초기화
      strip.clear();
      
      // 1번(idx 0)이 오른쪽 끝, 4번(idx 3)이 왼쪽 끝
      if (direction > 0) {
        // 오른쪽으로: 색상이 1번 방향으로 이동 (인덱스 감소)
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          int newPos = i - steps;
          if (isRotate == 1) {
            // 회전: 순환
            newPos = (newPos + NEOPIXEL_COUNT) % NEOPIXEL_COUNT;
            strip.setPixelColor(newPos, tempColors[i]);
          } else {
            // 이동: 범위 체크
            if (newPos >= 0) {
              strip.setPixelColor(newPos, tempColors[i]);
            }
          }
        }
      } else {
        // 왼쪽으로: 색상이 4번 방향으로 이동 (인덱스 증가)
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          int newPos = i + steps;
          if (isRotate == 1) {
            // 회전: 순환
            newPos = newPos % NEOPIXEL_COUNT;
            strip.setPixelColor(newPos, tempColors[i]);
          } else {
            // 이동: 범위 체크
            if (newPos < NEOPIXEL_COUNT) {
              strip.setPixelColor(newPos, tempColors[i]);
            }
          }
        }
      }
      
      strip.show();
      neopixelInitialized = false;
      break;
    }

    case NEOPIXEL_ROTATE: {
      setPortWritable(9);
      int direction = (int8_t)readBuffer(7);
      int steps = readBuffer(8);
      
      if (steps < 0) steps = 0;
      if (steps > NEOPIXEL_COUNT) steps %= NEOPIXEL_COUNT;
      
      uint32_t tempColors[NEOPIXEL_COUNT];
      
      // 1번(idx 0)이 오른쪽 끝, 4번(idx 3)이 왼쪽 끝
      if (direction > 0) {
        // 오른쪽으로 회전: 색상이 1번 방향으로 이동 (인덱스 감소)
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          int newPos = (i - steps + NEOPIXEL_COUNT) % NEOPIXEL_COUNT;
          tempColors[newPos] = neoPixelColors[i];
        }
      } else {
        // 왼쪽으로 회전: 색상이 4번 방향으로 이동 (인덱스 증가)
        for (int i = 0; i < NEOPIXEL_COUNT; i++) {
          int newPos = (i + steps) % NEOPIXEL_COUNT;
          tempColors[newPos] = neoPixelColors[i];
        }
      }

      strip.clear();
      for (int i = 0; i < NEOPIXEL_COUNT; i++) {
        neoPixelColors[i] = tempColors[i];
        strip.setPixelColor(i, neoPixelColors[i]);
      }
      strip.show();
      

      neopixelInitialized = false;
      break;
    }
  }
}

void sendPinValues() {  
  int pinNumber = 0;
  for (pinNumber = 0; pinNumber < 14; pinNumber++) {
    if(digitals[pinNumber] == 0) {
      sendDigitalValue(pinNumber);
      callOK();
    }
  }
  for (pinNumber = 0; pinNumber < 8; pinNumber++) {
    if(analogs[pinNumber] == 0) {
      sendAnalogValue(pinNumber);
      callOK();
    }
  }
  
  if(isUltrasonic) {
    sendUltrasonic();  
    callOK();
  }
}

void setUltrasonicMode(boolean mode) {
  isUltrasonic = mode;
  if(!mode) {
    lastUltrasonic = 0;
  }
}

void sendUltrasonic() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  //
  // *** 주의: pulseIn()은 blocking 함수입니다. ***
  // 최대 30000 마이크로초(30ms) 동안 여기서 대기할 수 있습니다.
  float value = pulseIn(echoPin, HIGH, 30000) / 29.0 / 2.0;

  if(value == 0) {
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

void sendDigitalValue(int pinNumber) {
  pinMode(pinNumber,INPUT);
  writeHead();
  sendFloat(digitalRead(pinNumber));  
  writeSerial(pinNumber);
  writeSerial(DIGITAL);
  writeEnd();
}

void sendAnalogValue(int pinNumber) {
  writeHead();
  sendFloat(analogRead(pinNumber));  
  writeSerial(pinNumber);
  writeSerial(ANALOG);
  writeEnd();
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

void setPortWritable(int pin) {
  if(digitals[pin] == 0) {
    digitals[pin] = 1;
    pinMode(pin, OUTPUT);
  } 
}

void callOK(){
  writeSerial(0xff);
  writeSerial(0x55);
  writeEnd();
}

void callDebug(char c){
  writeSerial(0xff);
  writeSerial(0x55);
  writeSerial(c);
  writeEnd();
}
