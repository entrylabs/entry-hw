
// LCD 라이브러리
#include <inttypes.h>
#include "Print.h" 
#include <Wire.h>




// 서보 라이브러리
#include <Servo.h>
#include <SoftwareSerial.h>

// commands
#define LCD_CLEARDISPLAY 0x01
#define LCD_RETURNHOME 0x02
#define LCD_ENTRYMODESET 0x04
#define LCD_DISPLAYCONTROL 0x08
#define LCD_CURSORSHIFT 0x10
#define LCD_FUNCTIONSET 0x20
#define LCD_SETCGRAMADDR 0x40
#define LCD_SETDDRAMADDR 0x80

// flags for display entry mode
#define LCD_ENTRYRIGHT 0x00
#define LCD_ENTRYLEFT 0x02
#define LCD_ENTRYSHIFTINCREMENT 0x01
#define LCD_ENTRYSHIFTDECREMENT 0x00

// flags for display on/off control
#define LCD_DISPLAYON 0x04
#define LCD_DISPLAYOFF 0x00
#define LCD_CURSORON 0x02
#define LCD_CURSOROFF 0x00
#define LCD_BLINKON 0x01
#define LCD_BLINKOFF 0x00

// flags for display/cursor shift
#define LCD_DISPLAYMOVE 0x08
#define LCD_CURSORMOVE 0x00
#define LCD_MOVERIGHT 0x04
#define LCD_MOVELEFT 0x00

// flags for function set
#define LCD_8BITMODE 0x10
#define LCD_4BITMODE 0x00
#define LCD_2LINE 0x08
#define LCD_1LINE 0x00
#define LCD_5x10DOTS 0x04
#define LCD_5x8DOTS 0x00

// flags for backlight control
#define LCD_BACKLIGHT 0x08
#define LCD_NOBACKLIGHT 0x00

#define En B00000100  // Enable bit
#define Rw B00000010  // Read/Write bit
#define Rs B00000001  // Register select bit

class LiquidCrystal_I2C : public Print {
public:
  LiquidCrystal_I2C(uint8_t lcd_Addr,uint8_t lcd_cols,uint8_t lcd_rows);
  void begin(uint8_t cols, uint8_t rows, uint8_t charsize = LCD_5x8DOTS );
  void clear();
  void home();
  void noDisplay();
  void display();
  void noBlink();
  void blink();
  void noCursor();
  void cursor();
  void scrollDisplayLeft();
  void scrollDisplayRight();
  void printLeft();
  void printRight();
  void leftToRight();
  void rightToLeft();
  void shiftIncrement();
  void shiftDecrement();
  void noBacklight();
  void backlight();
  void autoscroll();
  void noAutoscroll(); 
  void createChar(uint8_t, uint8_t[]);
  void createChar(uint8_t location, const char *charmap);
  // Example:   const char bell[8] PROGMEM = {B00100,B01110,B01110,B01110,B11111,B00000,B00100,B00000};
  
  void setCursor(uint8_t, uint8_t); 
#if defined(ARDUINO) && ARDUINO >= 100
  virtual size_t write(uint8_t);
#else
  virtual void write(uint8_t);
#endif
  void command(uint8_t);
  void init();

////compatibility API function aliases
void blink_on();            // alias for blink()
void blink_off();                 // alias for noBlink()
void cursor_on();                 // alias for cursor()
void cursor_off();                // alias for noCursor()
void setBacklight(uint8_t new_val);       // alias for backlight() and nobacklight()
void load_custom_character(uint8_t char_num, uint8_t *rows);  // alias for createChar()
void printstr(const char[]);

////Unsupported API functions (not implemented in this library)
uint8_t status();
void setContrast(uint8_t new_val);
uint8_t keypad();
void setDelay(int,int);
void on();
void off();
uint8_t init_bargraph(uint8_t graphtype);
void draw_horizontal_graph(uint8_t row, uint8_t column, uint8_t len,  uint8_t pixel_col_end);
void draw_vertical_graph(uint8_t row, uint8_t column, uint8_t len,  uint8_t pixel_col_end);
   

private:
  void init_priv();
  void send(uint8_t, uint8_t);
  void write4bits(uint8_t);
  void expanderWrite(uint8_t);
  void pulseEnable(uint8_t);
  uint8_t _Addr;
  uint8_t _displayfunction;
  uint8_t _displaycontrol;
  uint8_t _displaymode;
  uint8_t _numlines;
  uint8_t _cols;
  uint8_t _rows;
  uint8_t _backlightval;
};

#include <inttypes.h>
#if defined(ARDUINO) && ARDUINO >= 100

#include "Arduino.h"

#define printIIC(args)  Wire.write(args)
inline size_t LiquidCrystal_I2C::write(uint8_t value) {
  send(value, Rs);
  return 1;
}

#else
#include "WProgram.h"

#define printIIC(args)  Wire.send(args)
inline void LiquidCrystal_I2C::write(uint8_t value) {
  send(value, Rs);
}

#endif



// When the display powers up, it is configured as follows:
//
// 1. Display clear
// 2. Function set: 
//    DL = 1; 8-bit interface data 
//    N = 0; 1-line display 
//    F = 0; 5x8 dot character font 
// 3. Display on/off control: 
//    D = 0; Display off 
//    C = 0; Cursor off 
//    B = 0; Blinking off 
// 4. Entry mode set: 
//    I/D = 1; Increment by 1
//    S = 0; No shift 
//
// Note, however, that resetting the Arduino doesn't reset the LCD, so we
// can't assume that its in that state when a sketch starts (and the
// LiquidCrystal constructor is called).

LiquidCrystal_I2C::LiquidCrystal_I2C(uint8_t lcd_Addr,uint8_t lcd_cols,uint8_t lcd_rows)
{
  _Addr = lcd_Addr;
  _cols = lcd_cols;
  _rows = lcd_rows;
  _backlightval = LCD_NOBACKLIGHT;
}

void LiquidCrystal_I2C::init(){
  init_priv();
}

void LiquidCrystal_I2C::init_priv()
{
  Wire.begin();
  _displayfunction = LCD_4BITMODE | LCD_1LINE | LCD_5x8DOTS;
  begin(_cols, _rows);  
}

void LiquidCrystal_I2C::begin(uint8_t cols, uint8_t lines, uint8_t dotsize) {
  if (lines > 1) {
    _displayfunction |= LCD_2LINE;
  }
  _numlines = lines;

  // for some 1 line displays you can select a 10 pixel high font
  if ((dotsize != 0) && (lines == 1)) {
    _displayfunction |= LCD_5x10DOTS;
  }

  // SEE PAGE 45/46 FOR INITIALIZATION SPECIFICATION!
  // according to datasheet, we need at least 40ms after power rises above 2.7V
  // before sending commands. Arduino can turn on way befer 4.5V so we'll wait 50
  delay(50); 
  
  // Now we pull both RS and R/W low to begin commands
  expanderWrite(_backlightval); // reset expanderand turn backlight off (Bit 8 =1)
  delay(1000);

    //put the LCD into 4 bit mode
  // this is according to the hitachi HD44780 datasheet
  // figure 24, pg 46
  
    // we start in 8bit mode, try to set 4 bit mode
   write4bits(0x03 << 4);
   delayMicroseconds(4500); // wait min 4.1ms
   
   // second try
   write4bits(0x03 << 4);
   delayMicroseconds(4500); // wait min 4.1ms
   
   // third go!
   write4bits(0x03 << 4); 
   delayMicroseconds(150);
   
   // finally, set to 4-bit interface
   write4bits(0x02 << 4); 


  // set # lines, font size, etc.
  command(LCD_FUNCTIONSET | _displayfunction);  
  
  // turn the display on with no cursor or blinking default
  _displaycontrol = LCD_DISPLAYON | LCD_CURSOROFF | LCD_BLINKOFF;
  display();
  
  // clear it off
  clear();
  
  // Initialize to default text direction (for roman languages)
  _displaymode = LCD_ENTRYLEFT | LCD_ENTRYSHIFTDECREMENT;
  
  // set the entry mode
  command(LCD_ENTRYMODESET | _displaymode);
  
  home();
  
}

/********** high level commands, for the user! */
void LiquidCrystal_I2C::clear(){
  command(LCD_CLEARDISPLAY);// clear display, set cursor position to zero
  delayMicroseconds(2000);  // this command takes a long time!
}

void LiquidCrystal_I2C::home(){
  command(LCD_RETURNHOME);  // set cursor position to zero
  delayMicroseconds(2000);  // this command takes a long time!
}

void LiquidCrystal_I2C::setCursor(uint8_t col, uint8_t row){
  int row_offsets[] = { 0x00, 0x40, 0x14, 0x54 };
  if ( row > _numlines ) {
    row = _numlines-1;    // we count rows starting w/0
  }
  command(LCD_SETDDRAMADDR | (col + row_offsets[row]));
}

// Turn the display on/off (quickly)
void LiquidCrystal_I2C::noDisplay() {
  _displaycontrol &= ~LCD_DISPLAYON;
  command(LCD_DISPLAYCONTROL | _displaycontrol);
}
void LiquidCrystal_I2C::display() {
  _displaycontrol |= LCD_DISPLAYON;
  command(LCD_DISPLAYCONTROL | _displaycontrol);
}

// Turns the underline cursor on/off
void LiquidCrystal_I2C::noCursor() {
  _displaycontrol &= ~LCD_CURSORON;
  command(LCD_DISPLAYCONTROL | _displaycontrol);
}
void LiquidCrystal_I2C::cursor() {
  _displaycontrol |= LCD_CURSORON;
  command(LCD_DISPLAYCONTROL | _displaycontrol);
}

// Turn on and off the blinking cursor
void LiquidCrystal_I2C::noBlink() {
  _displaycontrol &= ~LCD_BLINKON;
  command(LCD_DISPLAYCONTROL | _displaycontrol);
}
void LiquidCrystal_I2C::blink() {
  _displaycontrol |= LCD_BLINKON;
  command(LCD_DISPLAYCONTROL | _displaycontrol);
}

// These commands scroll the display without changing the RAM
void LiquidCrystal_I2C::scrollDisplayLeft(void) {
  command(LCD_CURSORSHIFT | LCD_DISPLAYMOVE | LCD_MOVELEFT);
}
void LiquidCrystal_I2C::scrollDisplayRight(void) {
  command(LCD_CURSORSHIFT | LCD_DISPLAYMOVE | LCD_MOVERIGHT);
}

// This is for text that flows Left to Right
void LiquidCrystal_I2C::leftToRight(void) {
  _displaymode |= LCD_ENTRYLEFT;
  command(LCD_ENTRYMODESET | _displaymode);
}

// This is for text that flows Right to Left
void LiquidCrystal_I2C::rightToLeft(void) {
  _displaymode &= ~LCD_ENTRYLEFT;
  command(LCD_ENTRYMODESET | _displaymode);
}

// This will 'right justify' text from the cursor
void LiquidCrystal_I2C::autoscroll(void) {
  _displaymode |= LCD_ENTRYSHIFTINCREMENT;
  command(LCD_ENTRYMODESET | _displaymode);
}

// This will 'left justify' text from the cursor
void LiquidCrystal_I2C::noAutoscroll(void) {
  _displaymode &= ~LCD_ENTRYSHIFTINCREMENT;
  command(LCD_ENTRYMODESET | _displaymode);
}

// Allows us to fill the first 8 CGRAM locations
// with custom characters
void LiquidCrystal_I2C::createChar(uint8_t location, uint8_t charmap[]) {
  location &= 0x7; // we only have 8 locations 0-7
  command(LCD_SETCGRAMADDR | (location << 3));
  for (int i=0; i<8; i++) {
    write(charmap[i]);
  }
}

//createChar with PROGMEM input
void LiquidCrystal_I2C::createChar(uint8_t location, const char *charmap) {
  location &= 0x7; // we only have 8 locations 0-7
  command(LCD_SETCGRAMADDR | (location << 3));
  for (int i=0; i<8; i++) {
        write(pgm_read_byte_near(charmap++));
  }
}

// Turn the (optional) backlight off/on
void LiquidCrystal_I2C::noBacklight(void) {
  _backlightval=LCD_NOBACKLIGHT;
  expanderWrite(0);
}

void LiquidCrystal_I2C::backlight(void) {
  _backlightval=LCD_BACKLIGHT;
  expanderWrite(0);
}



/*********** mid level commands, for sending data/cmds */

inline void LiquidCrystal_I2C::command(uint8_t value) {
  send(value, 0);
}


/************ low level data pushing commands **********/

// write either command or data
void LiquidCrystal_I2C::send(uint8_t value, uint8_t mode) {
  uint8_t highnib=value&0xf0;
  uint8_t lownib=(value<<4)&0xf0;
       write4bits((highnib)|mode);
  write4bits((lownib)|mode); 
}

void LiquidCrystal_I2C::write4bits(uint8_t value) {
  expanderWrite(value);
  pulseEnable(value);
}

void LiquidCrystal_I2C::expanderWrite(uint8_t _data){                                        
  Wire.beginTransmission(_Addr);
  printIIC((int)(_data) | _backlightval);
  Wire.endTransmission();   
}

void LiquidCrystal_I2C::pulseEnable(uint8_t _data){
  expanderWrite(_data | En);  // En high
  delayMicroseconds(1);   // enable pulse must be >450ns
  
  expanderWrite(_data & ~En); // En low
  delayMicroseconds(50);    // commands need > 37us to settle
} 


// Alias functions

void LiquidCrystal_I2C::cursor_on(){
  cursor();
}

void LiquidCrystal_I2C::cursor_off(){
  noCursor();
}

void LiquidCrystal_I2C::blink_on(){
  blink();
}

void LiquidCrystal_I2C::blink_off(){
  noBlink();
}

void LiquidCrystal_I2C::load_custom_character(uint8_t char_num, uint8_t *rows){
    createChar(char_num, rows);
}

void LiquidCrystal_I2C::setBacklight(uint8_t new_val){
  if(new_val){
    backlight();    // turn backlight on
  }else{
    noBacklight();    // turn backlight off
  }
}

void LiquidCrystal_I2C::printstr(const char c[]){
  //This function is not identical to the function used for "real" I2C displays
  //it's here so the user sketch doesn't have to be changed 
  print(c);
}


// unsupported API functions
void LiquidCrystal_I2C::off(){}
void LiquidCrystal_I2C::on(){}
void LiquidCrystal_I2C::setDelay (int cmdDelay,int charDelay) {}
uint8_t LiquidCrystal_I2C::status(){return 0;}
uint8_t LiquidCrystal_I2C::keypad (){return 0;}
uint8_t LiquidCrystal_I2C::init_bargraph(uint8_t graphtype){return 0;}
void LiquidCrystal_I2C::draw_horizontal_graph(uint8_t row, uint8_t column, uint8_t len,  uint8_t pixel_col_end){}
void LiquidCrystal_I2C::draw_vertical_graph(uint8_t row, uint8_t column, uint8_t len,  uint8_t pixel_row_end){}
void LiquidCrystal_I2C::setContrast(uint8_t new_val){}

  

LiquidCrystal_I2C lcd(0x27,16,2);  // set the LCD address to 0x27 for a 16 chars and 2 line display



SoftwareSerial mySerial(3, 2); // RX, TX

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
#define LCD 9
#define SOUND_IN 10
#define MOTOR_LEFT 11
#define MOTOR_RIGHT 12


// 상태 상수
#define GET 1
#define SET 2
#define RESET 3

// Motor 제어
#define PHASE_B_L     8
#define PHASE_A_R     7
#define ENABLE_B_L    6
#define ENABLE_A_R    5

// PHASE : LOW,   ENABLE : PWM --> OUT1 : PWM, OUT2 : LOW
// PHASE : HIGH,  ENABLE : PWM --> OUT1 : LOW, OUT2 : PWM

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

// 전역변수 선언 시작
Servo servos[8];  

//울트라 소닉 포트
int trigPin = 7;
int echoPin = 8;

// 사운드
// #define SOUND_IN  A2

//포트별 상태
#define MAX_ANALOG_PIN 8
#define MAX_DIGITAL_PIN 14
int analogs[8]={0,0,0,0,0,0,0,0};
int digitals[14]={0,0,0,0,0,0,0,0,0,0,0,0,0,0};
int servo_pins[8]={0,0,0,0,0,0,0,0};

// 울트라소닉 최종 값
float lastUltrasonic = 0;

// 버퍼
char buffer[52];
unsigned char prevc=0;

byte index = 0;
byte dataLen;

double lastTime = 0.0;
double currentTime = 0.0;

uint8_t command_index = 0;

boolean isStart = false;
boolean isUltrasonic = false;
boolean isLeftMotormode = false;
boolean isRightMotormode = false;
boolean isSoundInmode = false;
int sound_input_pin_no = 2;

const int sound_max9812_sampleWindow = 50; // Sample window width in mS (50 mS = 20Hz)
unsigned int sound_max9812_sample;
unsigned int sound_max9812_peak = 0;   // peak-to-peak level
// 전역변수 선언 종료

void setup(){
  Serial.begin(115200);
  
  // set the data rate for the SoftwareSerial port
  mySerial.begin(115200);    
  
  initPorts();

  lcd.init();  
  lcd.backlight();  
  
  delay(200);

  
}

void initPorts() {
  for (int pinNumber = 0; pinNumber < 14; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
}

void loop()
{
  //mySerial.write("b");
  //delay(1000);  

  while (Serial.available()) 
  {
    if (Serial.available() > 0) 
    {
      char serialRead = Serial.read();
      setPinValue(serialRead&0xff);
      //mySerial.write("a");
    }    
  }
  
  delay(1);
  sendPinValues();
  isSoundInmode = false;
  delay(1);

  //mySerial.write("a");

}

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
          delay(50);
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
            delay(50);
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
      runModule(device);
      callOK();
    }
    break;
    case RESET:{
      callOK();
    }
    break;
  }
}

void runModule(int device) {
  //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
  int port = readBuffer(6);
  int pin = port;

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
    case LCD:{
      int line = readBuffer(6);  // Line
      int col = readBuffer(7);  // Col

      lcd.setCursor(1,1);
      lcd.print("123456789");      
    }
    break;
    case MOTOR_LEFT:{
      int direction = readBuffer(7);
      int speed = readBuffer(9);

      pinMode(13,OUTPUT);
      digitalWrite(13, HIGH);

      pinMode(PHASE_B_L, OUTPUT);  
      pinMode(ENABLE_B_L, OUTPUT);      

      if( speed == 0 )
      {
        isLeftMotormode = false;
        analogWrite(ENABLE_B_L, speed);        
      }
      else
      {
        isLeftMotormode = true;
  
        // forward
        if( direction == 0 )
        {
          // Left forward
          digitalWrite(PHASE_B_L, LOW);
          analogWrite(ENABLE_B_L, speed);        
        }
        else
        {
          // Left backward
          digitalWrite(PHASE_B_L, HIGH);
          analogWrite(ENABLE_B_L, speed);        
        }
      }
    }
    break;
   case MOTOR_RIGHT:{
      int direction = readBuffer(7);
      int speed = readBuffer(9);

      pinMode(PHASE_A_R, OUTPUT);  
      pinMode(ENABLE_A_R, OUTPUT);        

      if( speed == 0 )
      {
        isLeftMotormode = false;
        analogWrite(ENABLE_A_R, speed);        
      }
      else
      {
        isRightMotormode = true;
  
        // forward
        if( direction == 0 )
        {
          // Right forward
          digitalWrite(PHASE_A_R, HIGH);
          analogWrite(ENABLE_A_R, speed);        
        }
        else
        {
          // Right backward
          digitalWrite(PHASE_A_R, LOW);
          analogWrite(ENABLE_A_R, speed);        
        }
      }
    }
    break;    
    case SOUND_IN:{
      isSoundInmode = true;

       unsigned long startMillis= millis();  // Start of sample window       
     
       unsigned int signalMax = 0;
       unsigned int signalMin = 1024;

       pinMode(pin, INPUT);  
       sound_input_pin_no = pin;
     
       // collect data for 50 mS
       while (millis() - startMillis < sound_max9812_sampleWindow)
       {
          sound_max9812_sample = analogRead(pin);
          if (sound_max9812_sample < 1024)  // toss out spurious readings
          {
             if (sound_max9812_sample > signalMax)
             {
                signalMax = sound_max9812_sample;  // save just the max levels
             }
             else if (sound_max9812_sample < signalMin)
             {
                signalMin = sound_max9812_sample;  // save just the min levels
             }
          }
       }
       sound_max9812_peak = signalMax - signalMin;  // max - min = peak-peak amplitude      
    }
    break;    

  }
}

void sendPinValues() {  
  int pinNumber = 0;
  for (pinNumber = 0; pinNumber < MAX_DIGITAL_PIN; pinNumber++) {
    if(digitals[pinNumber] == 0) {
      sendDigitalValue(pinNumber);
      callOK();
    }
  }
  for (pinNumber = 0; pinNumber < MAX_ANALOG_PIN; pinNumber++) {
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

#define PHASE_B_L     8
#define PHASE_A_R     7
#define ENABLE_B_L    6
#define ENABLE_A_R    5

void sendDigitalValue(int pinNumber) 
{
    
  pinMode(pinNumber,INPUT);
  writeHead();
  sendFloat(digitalRead(pinNumber));  
  writeSerial(pinNumber);
  writeSerial(DIGITAL);
  writeEnd();
}

void sendAnalogValue(int pinNumber) 
{    
  writeHead();  

  if( isSoundInmode == true && sound_input_pin_no == pinNumber)
  {
    sendFloat(sound_max9812_peak);
  }
  else  
  {
    sendFloat(analogRead(pinNumber));  
  }

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
