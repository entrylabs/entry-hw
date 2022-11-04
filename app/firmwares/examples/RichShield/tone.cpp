#include "tone.h"




#if defined(ARDUINO_ARCH_AVR)

DFRobot_Tone::DFRobot_Tone()
{
    
}

DFRobot_Tone::~DFRobot_Tone()
{
    
}

void DFRobot_Tone::play(uint32_t pin, unsigned int frequency, unsigned long duration)
{
  if(frequency == 0){
    digitalWrite(pin,LOW);
    return;
  }
  int period = 1000000.0 / frequency;
  int pulse = period / 2.0;
  pinMode(pin,OUTPUT);
  for (int i = 1; i <= ((duration * 1000.0) / period); i++ ) {
    digitalWrite(pin,HIGH);
    delayMicroseconds(pulse);
    digitalWrite(pin,LOW);
    delayMicroseconds(pulse);
  }
}

void DFRobot_Tone::stop(uint32_t pin)
{
    digitalWrite(pin,LOW);
}

#endif



