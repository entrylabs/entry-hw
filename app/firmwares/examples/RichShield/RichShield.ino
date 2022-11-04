/**********************************************************************************
   The following software may be included in this software : RichShield.ino
   from https://gorillacell.kr/
   This software contains the following license and notice below:
   CC-BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)
   Author : Remoted (Tae-Hwi Lee)
   Updated : Remoted (Tae-Hwi Lee)
   Date : 11/30/2020
   Update Date : 03/16/2021
   Description : Firmware for RichShield modules with Entry.
   Copyright (C) 2020 - 2024 SF Edu Co., Ltd. All right reserved.
 **********************************************************************************/

#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include "TM1637Display.h"
#include "DHT.h"
#include "OzOled.h"
#include <math.h>
#include <string.h>
#include "tone.h"
#include "Adafruit_NeoPixel.h"

#include <SPI.h>

#include "IR.h"
#include "IRread.h"

#define NUMPIXELS 8
Adafruit_NeoPixel pixels(NUMPIXELS, 13, NEO_GRB + NEO_KHZ800);



#define IR_RECEIVE_PIN 2

IRrecv irrecv_1(IR_RECEIVE_PIN);
decode_results results_1;

unsigned long key_value = 0;

DFRobot_Tone dfrTone;
int irData;

//-----------------------------------------------
// Module Constant //핀설정
#define ALIVE 0
#define DIGITAL 1
#define ANALOG 2
#define PWM 3
#define SERVO_PIN 4
#define TONE 5
#define PULSEIN 6
#define ULTRASONIC 7
#define IRREMOTE 8
#define READ_BLUETOOTH 9
#define WRITE_BLUETOOTH 10
#define LCD 11
#define DHT_Module 12
#define DCMOTOR 13
#define OLED 14
#define PIR 15
#define FND 16
#define IRREMOTE 19
#define RGB 18
#define DHT2 17


//--------------------------------------- Digital Sensor Above

// State Constant
#define GET 1
#define SET 2
#define MODULE 3
#define RESET 4

//--------------------------------------- FND1637 Display Below
#define CLK 5
#define DIO 4
TM1637Display fnd(CLK, DIO);

uint8_t data[] = {0xff, 0xff, 0xff, 0xff};
uint8_t blank[] = {0x00, 0x00, 0x00, 0x00};
uint8_t count[] = {0xff, 0xff, 0xff, 0xff};
/*   FND의 각 Segment 배열 위치 참조
  //      === A ===
  //      =       =
  //      F       B
  //      =       = 
  //      === G ===
  //      =       =
  //      E       C   
  //      =       =
  //      === D ===
  */
const uint8_t SEG_LOVE[] = {
    SEG_A | SEG_B | SEG_C | SEG_D | SEG_E | SEG_F | SEG_G, // Left Ribbon
    SEG_E | SEG_F | SEG_G,                                 // |-
    SEG_G | SEG_B | SEG_C,                                 //   -|
    SEG_A | SEG_B | SEG_C | SEG_D | SEG_E | SEG_F | SEG_G  // Right Ribbon
};

const uint8_t seg_hipen[] = {SEG_G, SEG_G, SEG_G, SEG_B | SEG_C};
//---------------------------------------------
Servo servos[8];
Servo sv;
LiquidCrystal_I2C lcd(0x20, 16, 2);

//---------------------------------------------
#define DHTPIN 12     // Digital pin connected to the DHT sensor
#define DHTTYPE DHT11 // DHT 11
DHT dht(DHTPIN, DHTTYPE);
//--------------------------------------------

SoftwareSerial softSerial(2, 3);
// Digital Pin 0, 1 used to serial-port binding, so it was not used.

// val Union        //??
union
{
  byte byteVal[4];
  float floatVal;
  long longVal;
} val;

union
{
  byte byteVal[8];
  float floatVal;
  long longVal;
} valExt;

// valShort Union       //??
union
{
  byte byteVal[2];
  short shortVal;
} valShort;

int analogs[6] = {0, 0, 0, 0, 0, 0}; // 아날로그 디지털 핀 값저장
int digitals[14] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int servo_pins[8] = {0, 0, 0, 0, 0, 0, 0, 0};

// Ultrasonic             //초음파 센서
float lastUltrasonic = 0;
int trigPin = 13;
int echoPin = 12;

// DHT                  // Humidity, Temperature
volatile int dhtModeVar = 0; //default value setting - Celcious
float lastDht = 0;

// IR
float lastIR = 0;

// bluetooth                //블루투스
String makeBtString;
int softSerialRX = 2;
int softSerialTX = 3;
unsigned long prev_time_BT = 0;

// LCD
String lastLcdDataLine0;
String lastLcdDataLine1;

// Buffer
char buffer[52]; // MAX Buffer size definition
unsigned char prevc = 0;
byte index = 0;
byte dataLen;

double lastTime = 0.0;
double currentTime = 0.0;

uint8_t command_index = 0;

boolean isStart = false;
boolean isUltrasonic = false;
boolean isBluetooth = false;
boolean isDHTSensor = false;
boolean isIRSensor = false;
// End Public Value

float _g_f_value;
byte OzOled_clear;

int fnd_display_str_cur = 1234;

byte start_flag=0;
byte fnd_show_cnt=0;
uint32_t fnd_show_tm=0;

void setup()
{                         //초기화
  start_flag = 0;
  Serial.begin(115200);   //  Serial BaudRate 9600 --
//  softSerial.begin(9600); //블루투스 9600
  initPorts();
//  initLCD();
  initOLED();
  pixels.begin();
  pixels.clear();
  pixels.show();
  FND_init();

  irrecv_1.enableIRIn();
  attachInterrupt(digitalPinToInterrupt(IR_RECEIVE_PIN), mode_change_isr, RISING);
  delay(200);
}

void loop()
{
  otime();

  //반복 시리얼 값 , 블루투스 값 받기  
  while (Serial.available())
  {
    if (Serial.available() > 0)
    {
      char serialRead = Serial.read();
      setPinValue(serialRead & 0xff);      
    }
  }

  sendPinValues(); //핀 값보내기
  
  get_irSensor();
}

void otime()
{
  if(start_flag==0){
    FND_init_show();
  }
  else if(start_flag==1){
    initLCD();
    start_flag=2;
  }
  else if(start_flag==2){
    initLCD_show();
    start_flag=3;
  }
}

void mode_change_isr()
{
  detachInterrupt(digitalPinToInterrupt(IR_RECEIVE_PIN));
    int t;
    static int tt=0;
    if (irrecv_1.decode(&results_1)){
        t = readIR(results_1.value);
        if(t!=-1){
          irData = t;
        }

        irrecv_1.resume();
    } 
  attachInterrupt(digitalPinToInterrupt(IR_RECEIVE_PIN), mode_change_isr, RISING);
}

void initPorts()
{ //디지털 포트 초기화(2~14)
  for (int pinNumber = 2; pinNumber < 14; pinNumber++)
  {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
}

void initLCD()
{ //lcd 초기화
  lcd.init();
  lcd.backlight();
  lcd.clear();
}

void initLCD_show()
{
  lcd.setCursor(0, 0);
  lcd.print("Hello RichShield");
  lcd.setCursor(0, 1);
  lcd.print("with Entry");
}

void initOLED()
{
  OzOled.init(0x3c);
}

void FND_turnOn()
{
  fnd.setBrightness(7, true); // turnOn
  //fnd.setSegments(data);
  //delay(500);
}

void FND_turnOff()
{
  fnd.setBrightness(7, false); // turnOff
}

void FND_Brightness_Controller(int depth)
{
  fnd.setBrightness(depth); // 0~7, Brightness Controlled
}

int hex2dec(char *hex)
{
  long long decimal = 0, base = 1;
  int i = 0, value, length;

  length = strlen(hex);
  for (i = length--; i >= 0; i--)
  {
    if (hex[i] >= '0' && hex[i] <= '9')
    {
      decimal += (hex[i] - 48) * base;
      base *= 16;
    }
    else if (hex[i] >= 'A' && hex[i] <= 'F')
    {
      decimal += (hex[i] - 55) * base;
      base *= 16;
    }
    else if (hex[i] >= 'a' && hex[i] <= 'f')
    {
      decimal += (hex[i] - 87) * base;
      base *= 16;
    }
  }
  return decimal;
}

int FND_Display(char *text_edit)
{
  char *ptr = strtok(text_edit, ","); //구분자는 콤마(,)입니다.
  char data[4] = "";
  int index = 0;

  while (ptr != NULL)
  {
    data[index++] = fnd.encodeDigit(hex2dec(ptr));

    ptr = strtok(NULL, ",");
  }
  fnd.setSegments(data); // 위 숫자 0~3의 배열값 한번에 출력

  return 0;
}

void FND_Display_and_zerofill(int nummeric, int power, int delayed_sec)
{
  fnd.showNumberDec(nummeric, power); // 출력 : ___0
  delay(delayed_sec);
}

void FND_init()
{
  for (int k = 0; k < 4; k++){
    data[k] = 0xff;
  }
}

void FND_init_show()
{
  if(fnd_show_cnt < 7)
  {
    if( (millis()-fnd_show_tm) >=100 ){
      fnd_show_tm = millis();
      fnd.setBrightness(fnd_show_cnt++);
      fnd.setSegments(data);
      //delay(100);
    }
  }
  else{
    fnd.setBrightness(3);      // 0~7, 밝기 조절
    fnd.setSegments(seg_hipen); // 하이펀 출력
    //delay(100);
    start_flag = 1;
  }

}


void setPinValue(unsigned char c)
{
  if (c == 0x55 && isStart == false)  {
    if (prevc == 0xff)    {
      index = 1;
      isStart = true;
    }
  }
  else  {
    prevc = c;
    if (isStart)    {
      if (index == 2)      {
        dataLen = c;
      }
      else if (index > 2)      {
        dataLen--;
      }
      writeBuffer(index, c);
    }
  }

  index++;

  if (index > 51)  {
    index = 0;
    isStart = false;
  }

  if (isStart && dataLen == 0 && index > 3)  {
    isStart = false;

    parseData();
    index = 0;
  }
}

unsigned char readBuffer(int index)
{
  return buffer[index];
}

void parseData()
{
  isStart = false;
  int idx = readBuffer(3); // 3rd argument read
  command_index = (uint8_t)idx;
  int action = readBuffer(4); // 4nd argument read
  int device = readBuffer(5); // 5th arguemnt read (device)
  int port = readBuffer(6);

  switch (action)
  {
  case GET:
  {
    if (device == ULTRASONIC)    {
      if (!isUltrasonic)      {
        setUltrasonicMode(true);
        trigPin = readBuffer(6);
        echoPin = readBuffer(7);
        digitals[trigPin] = 1;
        digitals[echoPin] = 1;
        pinMode(trigPin, OUTPUT);
        pinMode(echoPin, INPUT);
        delay(50);
      }
      else      {
        int trig = readBuffer(6);
        int echo = readBuffer(7);
        if (trig != trigPin || echo != echoPin)        {
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
    else if (device == READ_BLUETOOTH)    {
      softSerial.begin(9600);
      pinMode(softSerialRX, INPUT);
      if (!isBluetooth)      {
        setBluetoothMode(true);
      }
    }
    else if (device == WRITE_BLUETOOTH)    {
      softSerial.begin(9600);
      pinMode(softSerialTX, OUTPUT);
      if (!isBluetooth)      {
        setBluetoothMode(true);
      }
    }
    else if (device != READ_BLUETOOTH && port == softSerialRX)    {
      softSerial.end();
      setBluetoothMode(false);
      digitals[port] = 0;
    }
    else if (device != WRITE_BLUETOOTH && port == softSerialTX)    {
      softSerial.end();
      setBluetoothMode(false);
      digitals[port] = 0;
    }
    else if (device == DHT_Module)    {
      if (!isDHTSensor)      {
        setDhtSensorMode(true);   //if first, activate sensor_mode
        digitals[DHT_Module] = 1; // Do not activate digital-port mode, if not, connection was closed by Entry.
        delay(50);
      }
      else      {
        digitals[DHT_Module] = 1; // Do not activate digital-port mode, if not, connection was closed by Entry.
        delay(50);
      }
    }
    else if (device == IRREMOTE)    {
      if (!isIRSensor)      {
        setIRsensorMode(true);
        digitals[2] = 1;
        delay(50);
      }
      else      {
        digitals[2] = 1; // IR assigned digital-port number to 2, but Analog already take this defined.
        delay(50);
      }
    }
    else    {
      digitals[port] = 0;
    }
  }
  break;
  case SET:
  {
    runSet(device);
    callOK();
  }
  break;
  case MODULE:
  {
    runModule(device);
    callOK();
  }
  break;
  case RESET:
  {
    callOK();
  }
  break;
  }
}

void runSet(int device)
{
  int port = readBuffer(6);
  
  unsigned char pin = port;
  if (pin == trigPin || pin == echoPin)
  {
    setUltrasonicMode(false);
  }
  
  switch (device)
  {
  case DIGITAL:
  {
    setPortWritable(pin);
    int v = readBuffer(7);
    digitalWrite(pin, v);
    break;
  }
  case PWM:
  {
    setPortWritable(pin);
    int v = readBuffer(7);
    analogWrite(pin, v);
    break;
  }
  case RGB:
  {
    char num;
    int r, g, b;
    int rgb_index;
    int i;
    
    rgb_index = readBuffer(7);

    if(rgb_index==1){
      setPortWritable(pin);
      for(i=0;i<8;i++){
        pixels.setPixelColor(i, 0, 0, 0);
      }
      pixels.show();
    }
    else if(rgb_index==2){
      num = readBuffer(9);
      r = readBuffer(11); 
      g = readBuffer(13); 
      b = readBuffer(15);
      setPortWritable(pin);
      pixels.setPixelColor(num, r, g, b);    
    }
    else if(rgb_index==3){
      setPortWritable(pin);
      pixels.show();
    }
    break;
  }
  case SERVO_PIN:
  {
    setPortWritable(pin);
    int v = readBuffer(7);
    if (v >= 0 && v <= 180)
    {
      byte rg[] = {TCCR1A, TCCR1B, OCR1A, TIMSK1};
      delay(5);
      sv = servos[searchServoPin(pin)];
      sv.attach(pin);
      sv.write(v);
      delay(300);
      sv.detach();
      TCCR1A = rg[0];
      TCCR1B = rg[1];
      TIMSK1 = rg[3];
      OCR1A = rg[2];
    }
    break;
  }
  case DCMOTOR:
  {
    int directionPort = readBuffer(7);
    int speedPort = readBuffer(9);
    int directionValue = readBuffer(11);
    int speedValue = readBuffer(13);
    setPortWritable(directionPort);
    setPortWritable(speedPort);
    digitalWrite(directionPort, directionValue);
    analogWrite(speedPort, speedValue);
    break;
  }
  default:
    break;
  }
}

void runModule(int device)
{
  int port = readBuffer(6);
  unsigned char pin = port;

  switch (device)
  {
  case LCD:
  {
    String makeLcdString;
    String n_buffer;
    int lcdBlockIndex = readBuffer(7);
    int lcdI2cAddr = readBuffer(17);
    int arrayNum = 15;
    int row = readBuffer(9) - 1;
    int col = readBuffer(11) - 1;
    int direction = readBuffer(13);
    char buf[16];

    delayMicroseconds(20);

    if (lcdBlockIndex == 1)    {
      //lcd._Addr = lcdI2cAddr;
    }
    if (lcdBlockIndex == 2)    {
      for (int i = 0; i < 17; i++)      {
        char lcdRead = readBuffer(arrayNum);
        if (lcdRead >= 0x20 && lcdRead <0x80){
            makeLcdString += lcdRead;    
        }
        else{
          break;
        }
        arrayNum += 2;
      }
      
      n_buffer = makeLcdString;

        
      lcd.setCursor(col, row);
      if (readBuffer(15) == 1)      {
        int lcdInt = readShort(17);
        lcd.print(lcdInt);
      }
      else      {
          lcd.print(n_buffer);
      }  
    }
    else if (lcdBlockIndex == 3)    {
      lcd.clear();
    }
    else if (lcdBlockIndex == 4)    {
      if (direction == 1)
        lcd.scrollDisplayLeft();
      else
        lcd.scrollDisplayRight();
    }

    break;
  }
  case OLED:
  {
    String makeLcdString;
    String n_buffer;
    int lcdBlockIndex = readBuffer(6);
    int arrayNum = 11; // text0 Buffer assigned
    int row = readBuffer(7) - 1;
    int col = readBuffer(9) - 1;

    delayMicroseconds(20);

    if(OzOled_clear!=1){
      OzOled.clearDisplay();
      OzOled_clear = 1;
    }

    for (int i = 0; i < 17; i++)
    {
      char lcdRead = readBuffer(arrayNum);
      if (lcdRead > 0)
        makeLcdString += lcdRead;
      arrayNum += 2;
    }

    n_buffer = makeLcdString;

    if (readBuffer(11) == 1)
    {
      int datInt = readShort(13);
      OLED_Message(col, row, String(datInt, DEC));
    }
    else
    {
      OLED_Message(col, row, n_buffer);
    }
    break;
  }
  case WRITE_BLUETOOTH:
  {
    char softSerialTemp[32];
    int arrayNum = 7;
    for (int i = 0; i < 17; i++)    {
      softSerialTemp[i] = readBuffer(arrayNum);
      arrayNum += 2;
    }
    softSerial.write(softSerialTemp);
    break;
  }
  case FND:
  {
    String makeFndString;
    int fnd_Block_index = readBuffer(7);
    int fnd_brightness_lev = readBuffer(13);
    int fnd_onoff = readBuffer(15);
    int fnd_str_length = readBuffer(17);
    int fnd_display_str = 0;
    int fnd_delay_ms = readBuffer(27);

    delayMicroseconds(20);

    if (fnd_Block_index == 1)    {
      FND_Brightness_Controller(fnd_brightness_lev);
    }
    else if (fnd_Block_index == 2)    {
      if (fnd_onoff == 1)
        FND_turnOn();
      else
        FND_turnOff();
    }
    else if (fnd_Block_index == 3)    {
      if (fnd_str_length == 1)
        fnd_display_str = readBuffer(19);
      else if (fnd_str_length == 2)
        fnd_display_str = (readBuffer(19) * 10) + (readBuffer(21) * 1);
      else if (fnd_str_length == 3)
        fnd_display_str = (readBuffer(19) * 100) + (readBuffer(21) * 10) + (readBuffer(23) * 1);
      else if (fnd_str_length == 4)
        fnd_display_str = (readBuffer(19) * 1000) + (readBuffer(21) * 100) + (readBuffer(23) * 10) + (readBuffer(25) * 1);

    FND_Display_and_zerofill(fnd_display_str, fnd_onoff, (int)fnd_delay_ms * 1000);
    fnd_display_str_cur  = fnd_display_str;
    }
    break;
  }
  case DHT_Module:
  {
    int dhtBlockIndex = readBuffer(7);

    if (dhtBlockIndex == 0)    {
      dht.begin();
      if(readShort(7)==0){
        dhtModeVar = 0;
      }
      else if(readShort(7)==1){
        dhtModeVar = 1;
      }
      else if(readShort(7)==2){
        dhtModeVar = 2;
      }
    }
    else if (dhtBlockIndex == 1)    {
      int sensorMode = readBuffer(13);

      if (sensorMode == 0)
        dhtModeVar = 0; // Celcious Mode
      else
        dhtModeVar = 1; // Fahrenheit Mode
    }
    else if (dhtBlockIndex == 2)    {
      dhtModeVar = 2; //Humid Logic Line
    }
    break;
  }
  case TONE: {
      int hz = readShort(7);
      int ms = readShort(9);
      if (ms > 0) {
        dfrTone.play(pin, hz, ms);
      } else {
        dfrTone.stop(pin);
      }
        break;
    }  
  }
}

void sendPinValues()
{ //핀 값 보내기
  int pinNumber = 0;
  for (pinNumber = 3; pinNumber < 14; pinNumber++)  {
    if (digitals[pinNumber] == 0)    {
      sendDigitalValue(pinNumber);
      callOK();
    }
  }
  for (pinNumber = 0; pinNumber < 6; pinNumber++)  {
    if (analogs[pinNumber] == 0)    {
      sendAnalogValue(pinNumber);      
      callOK();
    }
  }

  if(irData!=-1){
    writeHead();
    sendFloat((float)irData);
    writeSerial(2);
    writeSerial(IRREMOTE);
    writeEnd();
    callOK();
  }    


  float t = dht.readTemperature();
  float f = dht.readTemperature(true);

  writeHead();
  sendFloat((float)(f));
  writeSerial(1);
  writeSerial(DHT2);
  writeEnd();
  callOK(); 
  
  if (isDHTSensor)  {
    float t = dht.readTemperature();
    float f = dht.readTemperature(true);
    float h = dht.readHumidity();

    if (isnan(t) || isnan(f) || isnan(h))
      return;
    else    {
      writeHead();
      if (dhtModeVar == 0)
        sendFloat(t);
      else if (dhtModeVar == 1)
        sendFloat(f);
      else if (dhtModeVar == 2)
        sendFloat(h); //2021-03-10 writed By Remoted

      writeSerial(pinNumber);
      writeSerial(DHT_Module);
      writeEnd();
    }
    callOK();
  }

  if (isIRSensor)  {
    unsigned int irRecvData = 0;
  }

  if (isUltrasonic)
  {
    sendUltrasonic();
    callOK();
  }

  if (isBluetooth && millis() - prev_time_BT < 300)
  {
    sendBluetooth();
    callOK();
  }
  else
  {
    makeBtString = "";
    prev_time_BT = millis();
  }
}

void setUltrasonicMode(boolean mode)
{
  isUltrasonic = mode;
  if (!mode)
  {
    lastUltrasonic = 0;
  }
}

void setBluetoothMode(boolean mode)
{
  isBluetooth = mode;
  if (!mode)
  {
    makeBtString = "";
  }
}

void setDhtSensorMode(boolean mode)
{
  isDHTSensor = mode;

  if (!mode)
    lastDht = 0;
}

void setIRsensorMode(boolean mode)
{
  isIRSensor = mode;

  if (!mode)
    lastIR = 0;
}
void sendUltrasonic()
{
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  float value = pulseIn(echoPin, HIGH, 30000) / 29.0 / 2.0;

  if (value == 0)
  {
    value = lastUltrasonic;
  }
  else
  {
    lastUltrasonic = value;
  }
  _g_f_value = (long)value;
  writeHead();
  sendFloat(value);
  writeSerial(trigPin);
  writeSerial(echoPin);
  writeSerial(ULTRASONIC);
  writeEnd();
}

void sendBluetooth()
{
  writeHead();
  sendString(makeBtString);
  writeSerial(softSerialRX);
  writeSerial(READ_BLUETOOTH);
  writeEnd();
}
void sendDigitalValue(int pinNumber)
{
  pinMode(pinNumber, INPUT);
  writeHead();
  sendFloat(digitalRead(pinNumber));
  writeSerial(pinNumber);
  writeSerial(DIGITAL);
  writeEnd();
}

void sendAnalogValue(int pinNumber)
{
  float prevData, lpfData, measurement;
  float alpha = 0.1;
  bool firstRun = true;

  for (int i = 0; i < 20; i++)
  {
    measurement = analogRead(pinNumber);
    if (firstRun == true)
    {
      prevData = measurement;
      firstRun = false;
    }
    lpfData = alpha * prevData + (1 - alpha) * measurement;
    prevData = lpfData;
  }

  writeHead();
  sendFloat((int)lpfData);
  writeSerial(pinNumber);
  writeSerial(ANALOG);
  writeEnd();
}

void get_irSensor()
{
    int t;
    static int tt=0;
    if (irrecv_1.decode(&results_1)){
        t = readIR(results_1.value);
        irrecv_1.resume();
        if(t!=-1){
          irData = t;
        }
    }     
}

void writeBuffer(int index, unsigned char c)
{
  buffer[index] = c;
}

void writeHead()
{
  writeSerial(0xff);
  writeSerial(0x55);
}

void writeEnd()
{
  Serial.println();
}

void writeSerial(unsigned char c)
{
  Serial.write(c);
}

void sendString(String s)
{
  int l = s.length();
  writeSerial(4);
  writeSerial(l);
  for (int i = 0; i < l; i++)
  {
    writeSerial(s.charAt(i));
  }
}

void sendFloat(float value)
{
  writeSerial(2);
  val.floatVal = value;
  writeSerial(val.byteVal[0]);
  writeSerial(val.byteVal[1]);
  writeSerial(val.byteVal[2]);
  writeSerial(val.byteVal[3]);
}

short readShort(int idx)
{
  valShort.byteVal[0] = readBuffer(idx);
  valShort.byteVal[1] = readBuffer(idx + 1);
  return valShort.shortVal;
}

int searchServoPin(int pin)
{
  for (int i = 0; i < 8; i++)
  {
    if (servo_pins[i] == pin)
    {
      return i;
    }
    if (servo_pins[i] == 0)
    {
      servo_pins[i] = pin;
      return i;
    }
  }
  return 0;
}

void setPortWritable(int pin)
{
  if (digitals[pin] == 0)
  {
    digitals[pin] = 1;
    pinMode(pin, OUTPUT);
  }
}

void callOK()
{
  writeSerial(0xff);
  writeSerial(0x55);
  writeEnd();
}

void OLED_Message(byte X, byte Y, String msg)
{
  OzOled.setCursorXY(X, Y);
  OzOled.printString((const char*)msg.c_str());
}
