#include <Servo.h>
#include <DHT.h>
#include <math.h>

// 초음파 센서 핀 정의
#define ULTRASONIC_TRIG_PIN A0 // 트리거 핀: A0
#define ULTRASONIC_ECHO_PIN A1 // 에코 핀: A1

// DHT11 센서 핀 정의
// 온습도 센서는 무조건 a2(analog channel 2)에 연결되어야 함
#define DHTPIN A2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

char remainData;
Servo servoMotor; // 서보 객체 생성

// 서보 모터 핀 번호 (디지털 핀 2)
const int SERVO_MOTOR = 2;

// 온습도 센서(DHT11) 데이터 갱신 주기 관련 전역 변수
unsigned long lastDHTTime = 0;
uint16_t lastDHTValue = 0;

// ─────────────────────────────────────────────
// 자동문(비동기) 상태 관리용 전역 변수
// ─────────────────────────────────────────────
bool autoDoorActive = false;        // 자동문 동작 중 여부
int autoDoorPhase = 0;              // 자동문 동작 단계
unsigned long autoDoorLastTime = 0; // 마지막 상태 전환 시각 (millis())

// ─────────────────────────────────────────────
// 초음파 센서 관련 전역 변수 (측정 주기 제한용)
// ─────────────────────────────────────────────
unsigned long lastUltrasonicTime = 0;
uint16_t lastUltrasonicValue = 0;

// ─────────────────────────────────────────────
// 초음파 센서 측정 함수 (cm 단위)
// ─────────────────────────────────────────────
uint16_t readUltrasonicSensor()
{
    long duration;

    // 트리거 핀 LOW로 안정화
    digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
    delayMicroseconds(2);

    // 트리거 핀을 HIGH로 10us 동안 유지하여 초음파 발사
    digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

    // 에코 핀에서 HIGH 펄스의 길이 측정 (타임아웃 30000us)
    duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000);
    if (duration == 0)
    {
        // 측정 실패 시 오류값 999 반환
        return 999;
    }

    // 거리(cm) = (duration * 0.034) / 2
    uint16_t distance = duration * 0.034 / 2;
    return distance;
}

// ─────────────────────────────────────────────
// setup()
// ─────────────────────────────────────────────
void setup()
{
    Serial.begin(9600);
    Serial.flush();

    // 초음파 센서 핀 모드 설정
    pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
    pinMode(ULTRASONIC_ECHO_PIN, INPUT);

    initPorts();

    // DHT 센서 초기화 (DHT 센서는 A2에 연결됨)
    dht.begin();

    // 서보 모터 초기화: 디지털 핀 2에 연결 후 기본값 90도로 설정 (멈춤 상태)
    servoMotor.attach(SERVO_MOTOR);
    servoMotor.write(90);

    delay(200);
}

// ─────────────────────────────────────────────
// initPorts()
//  - 서보 모터 핀는 제외하고 초기화 (DHT 센서는 아날로그 채널이므로 디지털 초기화 대상 아님)
// ─────────────────────────────────────────────
void initPorts()
{
    for (int pinNumber = 0; pinNumber < 14; pinNumber++)
    {
        if (pinNumber == SERVO_MOTOR)
        {
            continue; // 서보 모터 핀은 건너뜀
        }
        pinMode(pinNumber, OUTPUT);
        digitalWrite(pinNumber, LOW);
    }
}

// ─────────────────────────────────────────────
// loop()
//  - 시리얼 수신 → updateDigitalPort()로 처리
//  - 자동문 상태 업데이트 (non-blocking)
//  - pinValues 전송
// ─────────────────────────────────────────────
void loop()
{
    // 시리얼에 데이터가 있으면 읽어 처리
    while (Serial.available())
    {
        char c = Serial.read();
        updateDigitalPort(c);
    }

    // 자동문 상태 머신 업데이트
    if (autoDoorActive)
    {
        updateAutoDoor();
    }

    delay(15);
    sendPinValues();
    delay(10);
}

// ─────────────────────────────────────────────
// updateAutoDoor()
//  - 비동기로 LED와 서보 모터를 동시에 제어
// ─────────────────────────────────────────────
void updateAutoDoor()
{
    unsigned long now = millis();

    switch (autoDoorPhase)
    {
    case 1:
        if (now - autoDoorLastTime >= 1300)
        {
            servoMotor.write(90); // 서보 멈춤
            autoDoorPhase = 2;
            autoDoorLastTime = now;
        }
        break;

    case 2:
        if (now - autoDoorLastTime >= 10000)
        {
            servoMotor.write(180); // 반대 방향 회전 시작
            autoDoorPhase = 3;
            autoDoorLastTime = now;
        }
        break;

    case 3:
        if (now - autoDoorLastTime >= 1100)
        {
            servoMotor.write(90); // 서보 정지
            autoDoorActive = false;
            autoDoorPhase = 0;
        }
        break;
    }
}

// ─────────────────────────────────────────────
// updateDigitalPort()
//  - 시리얼로 수신된 명령(디지털/아날로그)을 해석해 핀에 반영
// ─────────────────────────────────────────────
void updateDigitalPort(char c)
{
    if (c >> 7)
    {
        // 상위 비트가 1인 경우
        if ((c >> 6) & 1)
        {
            // 디지털 쓰기
            if ((c >> 5) & 1)
            {
                int port = (c >> 1) & B1111;
                if (port == SERVO_MOTOR)
                {
                    // 서보 제어는 아래 아날로그 방식으로 처리
                }
                else
                {
                    setPortWritable(port);
                    if (c & 1)
                    {
                        digitalWrite(port, HIGH);
                    }
                    else
                    {
                        digitalWrite(port, LOW);
                    }
                }
            }
            else
            {
                remainData = c;
            }
        }
        else
        {
            // 디지털 읽기
            int port = (c >> 1) & B1111;
            setPortReadable(port);
        }
    }
    else
    {
        // 아날로그 값 처리
        int port = (remainData >> 1) & B1111;
        int value = ((remainData & 1) << 7) + (c & B1111111);

        if (port == SERVO_MOTOR)
        {
            setPortWritable(port);
            if (value == 1)
            {
                // open_door
                servoMotor.write(0);
                delay(1300);
                servoMotor.write(90);
            }
            else if (value == 2)
            {
                // close_door
                servoMotor.write(180);
                delay(1100);
                servoMotor.write(90);
            }
            else if (value == 3)
            {
                // auto_door (blocking 방식)
                servoMotor.write(0);
                delay(1300);
                servoMotor.write(90);
                delay(2000);
                servoMotor.write(180);
                delay(1100);
                servoMotor.write(90);
            }
            else if (value == 4)
            {
                // 자동문 - 논블로킹 방식
                digitalWrite(11, HIGH);
                digitalWrite(8, HIGH);
                digitalWrite(5, HIGH);
                digitalWrite(12, HIGH);
                digitalWrite(9, HIGH);
                digitalWrite(6, HIGH);
                digitalWrite(13, HIGH);
                digitalWrite(10, HIGH);
                digitalWrite(7, HIGH);

                autoDoorActive = true;
                autoDoorPhase = 1;
                autoDoorLastTime = millis();
                servoMotor.write(0);
            }
            else
            {
                servoMotor.write(90);
            }
        }
        else
        {
            setPortWritable(port);
            analogWrite(port, value);
        }
        remainData = 0;
    }
}

// ─────────────────────────────────────────────
// sendPinValues()
//  - 디지털/아날로그 값 전송
// ─────────────────────────────────────────────
void sendPinValues()
{
    for (int pinNumber = 0; pinNumber < 14; pinNumber++)
    {
        if (pinNumber == SERVO_MOTOR)
            continue;
        sendDigitalValue(pinNumber);
    }
    for (int pinNumber = 0; pinNumber < 6; pinNumber++)
    {
        sendAnalogValue(pinNumber);
    }
}

// ─────────────────────────────────────────────
// sendAnalogValue(), sendDigitalValue()
//  - 센서값을 시리얼로 전송
// ─────────────────────────────────────────────
void sendAnalogValue(int pinNumber)
{
    int value;

    if (pinNumber == 1)
    {
        // 초음파 센서: A1의 경우 주기를 제한하여 초음파 센서 측정값 사용
        if (millis() - lastUltrasonicTime >= 60)
        {
            lastUltrasonicValue = readUltrasonicSensor();
            lastUltrasonicTime = millis();
        }
        value = lastUltrasonicValue;
    }
    else if (pinNumber == 2)
    {
        // 온습도 센서: a2는 DHT11 센서로부터 온도와 습도를 결합한 값을 전송
        if (millis() - lastDHTTime >= 2000)
        { // 최소 2초 간격
            int temperature = (int)round(dht.readTemperature());
            int humidity = (int)round(dht.readHumidity());
            if (isnan(temperature) || isnan(humidity))
            {
                lastDHTValue = 0; // 읽기 실패 시 0 전송
            }
            else
            {
                // (온도×100 + 습도)를 5로 나눈 값
                lastDHTValue = (uint16_t)round((temperature * 100.0 + humidity) / 5.0);
            }
            lastDHTTime = millis();
        }
        value = lastDHTValue;
    }
    else
    {
        value = analogRead(pinNumber);
    }

    // 아날로그 데이터 전송 (2바이트)
    Serial.write(0xC0 | ((pinNumber & 0x07) << 3) | ((value >> 7) & 0x07));
    Serial.write(value & 0x7F);
}

void sendDigitalValue(int pinNumber)
{
    if (isPortWritable(pinNumber))
    {
        // 출력 모드
        Serial.write(0x80 | ((pinNumber & 0x0F) << 2));
    }
    else
    {
        // 입력 모드
        if (digitalRead(pinNumber) == HIGH)
        {
            Serial.write(0x80 | ((pinNumber & 0x0F) << 2) | 0x01);
        }
        else
        {
            Serial.write(0x80 | ((pinNumber & 0x0F) << 2));
        }
    }
}

// ─────────────────────────────────────────────
// setPortReadable(), setPortWritable()
// ─────────────────────────────────────────────
void setPortReadable(int port)
{
    if (isPortWritable(port))
    {
        pinMode(port, INPUT);
    }
}

void setPortWritable(int port)
{
    if (!isPortWritable(port))
    {
        pinMode(port, OUTPUT);
    }
}

boolean isPortWritable(int port)
{
    if (port > 7)
    {
        return bitRead(DDRB, port - 8);
    }
    else
    {
        return bitRead(DDRD, port);
    }
}
