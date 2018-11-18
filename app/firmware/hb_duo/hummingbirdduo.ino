#include <Hummingbird.h>

Hummingbird bird;
byte remainData;
byte misc_port;

void setup() {
  bird.init();
  init_analog();
  Serial.begin(9600);
  Serial.flush();
}

void init_analog(void)
{
  // ADMUX register
  // BIt 7,6 – Set voltage reference to AVcc (0b01)
  // Bit 5 – Set ADLAR bit for left adjust to do simple 8-bit reads
  // Bit 4 – X
  // Bit 3:0 – Sets the current channel, set here to ADC0
  ADMUX = 0x60;

  // ADC Status Register A
  // We’re only using the comparator right now, so just set ADC clock
  // Bit 7 – ADEN is cleared (Analog is only enabled when doing a read)
  // Bit 6 – We’ll start a conversion later
  // Bit 5 – Enable Auto Trigger
  // Bit 3 – No ADC Interrupt
  // Bit 2:0 – Set to create a clock divisor of 16, to make ADC clock \
               = 8,000,000/16 = 500,000 Hz
  ADCSRA = 0b10000100;

  // ADC Status Register B
  // Bit 7 – ADC High speed mode enabled; may be unnecessary
  // Bit 5 – Mux mode, cleared for single ended input
  // Bit 3:0 – Set interrupt mode, currently cleared
  ADCSRB = 0x00;

  // Digital input disable – disabling digital ins on ADC0, 1, 4, 5, 6
  DIDR0 = 0x73;
}

void loop() {
  static int Disable_Tx_Analog=0;
  // put your main code here, to run repeatedly:
  while (Serial.available()) {
    if (Serial.available() > 0) {
      char c = Serial.read();
      #if 0
      char stmp[16];
      if (c=='0') Disable_Tx_Analog=1-Disable_Tx_Analog;
      if (c=='1') bird.setLED(1,100); //LED1
      if (c=='2') bird.setLED(2,100); //LED2
      if (c=='3') bird.setLED(3,100); //LED3
      if (c=='4') bird.setLED(4,100); //LED4
      if (c=='5') bird.setTriColorLED(1,20,0,0);
      if (c=='6') bird.setTriColorLED(1,0,20,0);
      if (c=='7') bird.setTriColorLED(1,0,0,20);
      if (c=='a') bird.setServo(1,0);
      if (c=='b') bird.setServo(1,90);
      if (c=='c') bird.setServo(1,180);
      if (c=='d') bird.setMotor(1,10);
      if (c=='e') bird.setMotor(1,-10);
      if (c=='f') bird.setMotor(1,200);
      if (c=='g') bird.setMotor(1,-200);
      if (c=='i') bird.setVibration(1,80);
      if (c=='j') bird.setVibration(1,255);
      if (c=='l') {sprintf(stmp,"%d ",bird.readSensorValue(1)); Serial.print(stmp);}
      if (c=='m') {sprintf(stmp,"%d ",bird.readSensorValue(4)); Serial.print(stmp);}     
      #endif
      
      updateDigitalPort(c);
    }
  }
  if (Disable_Tx_Analog) return;
  delay(15);
  sendPinValues();
  delay(10);
}

void sendPinValues()
{
  int pin = 0;

  // read Analog Ports 0..3
  for (pin = 0; pin < 4; pin++)
    sendAnalogValue(pin);
}

void updateDigitalPort (char c) {
  // first data
  if (c & 0x80) {
    // is output
    if (c & 0x40) {
      // is data end at this chunk
      if (c & 0x20) {
        // for Digital write
        // 
        int port = (c >> 1) & B1111;
//        setPortWritable(port);
        if (c & 1)
          digitalWrite(port, HIGH);
        else
          digitalWrite(port, LOW);
      }
      else {
        remainData = c;
      }
    } else {
      misc_port = 1;
      remainData = c;
    }
  } else {
    int port = (remainData >> 1) & B1111;
    int value = ((remainData & 1) << 7) + (c & B1111111);
    if (misc_port) {
      switch (port) {
        case 0 : if (value&0x80) value=-value; bird.setMotor(1, 2*value); break; // motor1 velocity
        case 1 : if (value&0x80) value=-value; bird.setMotor(2, 2*value); break; // motor2 velocity
        case 2 : bird.setServo(1, value); break; // servo1 degree
        case 3 : bird.setServo(2, value); break; // servo2 degree
        case 4 : bird.setServo(3, value); break; // servo3 degree
        case 5 : bird.setServo(4, value); break; // servo4 degree
        default:
          break;
      }
      misc_port = 0;
    }
    else {
      static byte red1,green1,blue1;
      static byte red2,green2,blue2;
      switch(port) {
        case 2 : bird.setLED(1,value); break; // LED1 intensity
        case 3 : bird.setLED(2,value); break; // LED2 intensity
        case 0 : bird.setLED(3,value); break; // LED3 intensity
        case 1 : bird.setLED(4,value); break; // LED4 intensity
        case 7 : red1=value; break;           // 
        case 4 : green1=value; break;         //
        case 12: blue1=value; bird.setTriColorLED(1,red1,green1,blue1); break;
        case 5 : red2=value; break;
        case 6 : green2=value; break;
        case 11: blue2=value; bird.setTriColorLED(2,red2,green2,blue2); break;
        case 9 : bird.setVibration(1,2*value); break;
        case 10: bird.setVibration(2,2*value); break;
      }
    }
    remainData = 0;
  }
}

void sendAnalogValue(int pinNumber) {
  int value = bird.readSensorValue(pinNumber+1);
  Serial.write(B11000000
               | ((pinNumber & B111)<<3)
               | ((value>>7) & B111));
  Serial.write(value & B1111111);
}

void sendDigitalValue(int pinNumber) {
  if (digitalRead(pinNumber) == HIGH) {
    Serial.write(B10000000
                 | ((pinNumber & B1111)<<2)
                 | (B1));
  } else {
    Serial.write(B10000000
               | ((pinNumber & B1111)<<2));
  }
}

