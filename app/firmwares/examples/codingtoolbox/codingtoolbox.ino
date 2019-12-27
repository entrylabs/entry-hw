char remainData;

void setup(){
  Serial.begin(9600);
  Serial.flush();
  initPorts();
  delay(200);
}

void initPorts () {
  for (int pinNumber = 0; pinNumber < 14; pinNumber++) {
    pinMode(pinNumber, OUTPUT);
    digitalWrite(pinNumber, LOW);
  }
}

void loop() {
  while (Serial.available()) {
    if (Serial.available() > 0) {
      char c = Serial.read();
      updateDigitalPort(c);
    }
  } 
  delay(15);
  sendPinValues();
  delay(10);
}

void sendPinValues() {
  int pinNumber = 0;
  for (pinNumber = 0; pinNumber < 14; pinNumber++) {
      sendDigitalValue(pinNumber);
  }
  for (pinNumber = 0; pinNumber < 6; pinNumber++) {
      sendAnalogValue(pinNumber);
  }
  
}

void updateDigitalPort (char c) {
  // first data
  if (c>>7) {
    // is output
    if ((c>>6) & 1) {
      // is data end at this chunk
      if ((c>>5) & 1) {
        int port = (c >> 1) & B1111;
        setPortWritable(port);
        if (c & 1)
          digitalWrite(port, HIGH);
        else
          digitalWrite(port, LOW);
      }
      else {
        remainData = c;
      }
    } else {
      int port = (c >> 1) & B1111;
      setPortReadable(port);
    }
  } else {
    int port = (remainData >> 1) & B1111;
    int value = ((remainData & 1) << 7) + (c & B1111111);
    setPortWritable(port);
    analogWrite(port, value);
    remainData = 0;
  }
}

void sendAnalogValue(int pinNumber) {
  int value = analogRead(pinNumber);
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

void setPortReadable (int port) {
  if (isPortWritable(port)) {
    pinMode(port, INPUT);
  }
}

void setPortWritable (int port) {
  if (!isPortWritable(port)) {
    pinMode(port, OUTPUT);
  }
}

boolean isPortWritable (int port) {
  if (port > 7)
    return bitRead(DDRB, port - 8);
  else
    return bitRead(DDRD, port);
}
