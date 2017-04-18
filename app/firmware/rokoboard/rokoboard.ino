/*
 Roko Board V2.1 
 Changed motor pin number for Roko Board.
 30 November, 2013
 by Robokor and Byeon KyuYoung.

 HelloBoardV2
 Created 30 October. 2009
 by PINY and Song Hojun.

 Add multipule motor function on 15 Jan 2012
 by Kazuhiro Abe <abee@squeakland.jp>
 
 
*/

// Sensor <--> Analog port mapping
#define SoundSensor 0
#define LightSensor 1
#define Slider 2
#define ResistanceA 3
#define ResistanceB 4
#define ResistanceC 5
#define ResistanceD 6
#define Button 7

// motor port mapping
//#define PWM_PIN_A 9
//#define THISWAY_PIN_A 7
//#define THATWAY_PIN_A 8
//#define PWM_PIN_B 10
//#define THISWAY_PIN_B 5
//#define THATWAY_PIN_B 6
// motor port mapping
#define PWM_PIN_A 3
#define THISWAY_PIN_A 2
#define THATWAY_PIN_A 7
#define PWM_PIN_B 9
#define THISWAY_PIN_B 8
#define THATWAY_PIN_B 12

int sliderValue = 0;
int lightValue = 0;
int soundValue = 0;
int buttonValue = 0;
int resistanceAValue = 0;
int resistanceBValue = 0;
int resistanceCValue = 0;
int resistanceDValue = 0;

unsigned long lastIncommingMicroSec = 0;

uint8_t incomingByte;

const int sensorChannels = 8;
const int maxNumReadings = 30;

int smoothingValues[sensorChannels][maxNumReadings];
int smoothingIndex[sensorChannels];
int smoothingTotal[sensorChannels];

// motor variables
byte motorDirectionA = 0;
byte isMotorOnA = 0;
byte motorPowerA = 0;
byte motorDirectionB = 0;
byte isMotorOnB = 0;
byte motorPowerB = 0;

void setup() {
     setupSmoothing();  
     Serial.begin(38400);

     // set pin mode for motor
     pinMode(PWM_PIN_A, OUTPUT);
     pinMode(THISWAY_PIN_A, OUTPUT);
     pinMode(THATWAY_PIN_A, OUTPUT);
     pinMode(PWM_PIN_B, OUTPUT);
     pinMode(THISWAY_PIN_B, OUTPUT);
     pinMode(THATWAY_PIN_B, OUTPUT);
}

void setupSmoothing() {
     for(int i = 0; i < sensorChannels; i++) {
       for(int j = 0 ; j < maxNumReadings ; j++) {
         smoothingValues[i][j]=0;
       }
     smoothingTotal[i]=0;
     smoothingIndex[i]=0;
     }
}

void loop() {
    readSensors();
    
    if( Serial.available() > 0) {
        incomingByte = Serial.read();
        if (incomingByte >= 0x00) {
            // rotate motor
            motorPowerA = ((incomingByte >> 4) & B111) * 36;
            motorDirectionA = (incomingByte >> 7) & B1;
            isMotorOnA = motorPowerA > 0;
            analogWrite(PWM_PIN_A, motorPowerA);
            digitalWrite(THISWAY_PIN_A, motorDirectionA & isMotorOnA);
            digitalWrite(THATWAY_PIN_A, ~motorDirectionA & isMotorOnA);  
            motorPowerB = (incomingByte & B111) * 36;
            motorDirectionB = (incomingByte >> 3) & B1;
            isMotorOnB = motorPowerB > 0;
            analogWrite(PWM_PIN_B, motorPowerB);
            digitalWrite(THISWAY_PIN_B, motorDirectionB & isMotorOnB);
            digitalWrite(THATWAY_PIN_B, ~motorDirectionB & isMotorOnB);
        }  
    }

    delay(15);
    sendFirstSecondBytes(0, soundValue);
    sendFirstSecondBytes(1, lightValue);
    sendFirstSecondBytes(2, sliderValue);
    sendFirstSecondBytes(3, resistanceAValue);
    sendFirstSecondBytes(4, resistanceBValue);
    sendFirstSecondBytes(5, resistanceCValue);
    sendFirstSecondBytes(6, resistanceDValue);
    sendFirstSecondBytes(7, buttonValue);
    Serial.println();
    delay(10);
}

void readSensors() {
    sliderValue = readSlider();
    lightValue = readLight();
    soundValue = readSound();
    buttonValue = readButton();
    
    resistanceAValue = readResistance(ResistanceA);
    resistanceBValue = readResistance(ResistanceB);
    resistanceCValue = readResistance(ResistanceC);
    resistanceDValue = readResistance(ResistanceD);
}

int readButton() {
  return analogRead(Button);
}

int readResistance(int adc) {
  int value;
  value = analogRead(adc);
  value = smoothingValue(adc, value, 5);
  if (value == 1022) value = 1023;
  return value;
}

int readSlider() {
  int sliderValue;
  sliderValue = analogRead(Slider);
  //Serial.println(sliderValue);
  
  if(sliderValue >= 690)
    sliderValue = 690;
  sliderValue = map(sliderValue, 0, 690, 0, 1023);
  sliderValue = smoothingValue(Slider, sliderValue, 3);
  return sliderValue;
}

int readLight() {
  int light;
  light = analogRead(LightSensor);
  light = calibrateLightSensor(light);
  light = smoothingValue(LightSensor,light, 20);
  return light;
}

int calibrateLightSensor(int light) {
    // make s-curve
    int mid = 600;
    int mid2 = 900;
    if ( light < mid) {
        light = int(round((40.0/mid)*light));
    } else if (light < mid2) {
        light = int(round((mid2-40)/(mid2-float(mid))* light) - 1680);
    }
    light = constrain(light, 0, 1023);    
    return light;
}

int smoothingValue(int channel, int value, int numReadings) {
    int total;
    int index = smoothingIndex[channel];
    total = smoothingTotal[channel] - smoothingValues[channel][index];
    smoothingValues[channel][index] = value;
    smoothingTotal[channel] = total + value;
    smoothingIndex[channel]++;
    if(smoothingIndex[channel] >=numReadings) {
      smoothingIndex[channel]=0;
    }
    return int(round(smoothingTotal[channel] / (numReadings)));
}

int readSound() {
  int sound;
  sound = analogRead(SoundSensor);
  sound = smoothingValue(SoundSensor,sound, 20);
  // noise ceiling 
  if (sound < 60) { sound = 0; }
  return sound;
}

void sendFirstSecondBytes(byte channel, int value) {
      byte firstByte;
      byte secondByte;
      firstByte = (1 << 7) | (channel << 3) | (value >> 7);
      secondByte = value & 0b01111111 ;

      Serial.write(firstByte);
      Serial.write(secondByte);
}
