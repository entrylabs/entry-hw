
#define tone_H
#include <Arduino.h>

class DFRobot_Tone
{
  public:
    DFRobot_Tone();
    ~DFRobot_Tone();
    void play(uint32_t pin, unsigned int frequency, unsigned long duration);
    void stop(uint32_t pin);
  private:
};



