# 엔트리 하드웨어 연결 프로그램(entry-hw)
entry-hw는 엔트리 교육연구소에서 개발한 엔트리와 하드웨어를 연동하기 위한 프로그램  입니다. 엔트리 사이트에 접속하시면 엔트리를 사용한 블록코딩 환경과 하드웨어를 연동하는 모습을 확인해 볼 수 있습니다.

## 시작하기
entry-hw는 nwjs기반의 멀티플랫폼 어플리케이션 입니다.
entry-hw의 핵심기능 구현을 위해 몇가지 오픈소스 라이브러리를 사용합니다.
현재 엔트리 하드웨어 연결 프로그램은 Windows만 지원합니다.

### 써드파티 라이브러리
 * jQuery : http://jquery.com/download/ (MIT)
 * Node Serialport : https://github.com/voodootikigod/node-serialport (MIT)
 * WebSocket : https://github.com/theturtle32/WebSocket-Node (Apacahe 2.0)
 * Node localize : https://github.com/dfellis/node-localize (MIT)

### 하드웨어 추가하기321321
	1. .js 파일생성
	2. .json 파일생성
	3. 이미지 삽입
	4. 실행

`.js` 파일생성
```js
// 모듈 생성
function Module() {
    //초기설정
}

// 초기설정
Module.prototype.init = function(handler, config) {
};

// 초기 송신데이터(필수)
Module.prototype.requestInitialData = function() {
};

// 초기 수신데이터 체크(필수)
Module.prototype.checkInitialData = function(data, config) {
};

// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {
};

// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data) {
};

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function(handler) {
};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
};

// Web Socket 종료후 처리
Module.prototype.reset = function() {
};

// 이외 필요한 모듈이 있을경우 임의로 추가 가능
...

module.exports = new Module();
```

`.json` 파일생성
```json
{
    "id": "하드웨어ID(엔트리와 사전규약 필요. ex.'010101')",
    "name": {
        "en": "English Name",
        "ko": "한글명"
    },
    "icon" : "이미지(.png | .jpg | .gif ...)",
    "module": "모듈(.js)",
    "driver": {
        "win32-ia32": "윈도우32비트 하드웨어 드라이버",
        "win32-x64": "윈도우64비트 하드웨어 드라이버"
    },
    "reconnect" : "재접속 시도여부 (true | false)",
    "firmware": "펌웨어(board)",
    "entry": {
        "protocol": "데이터규격(json)"
    },
    "hardware": {
        "type": "타입(serial)",
        "control": "동작방식(slave | master)",
        "duration": "duration(32 ...)",
        "vendor": "하드웨어 벤더명(ex.Arduino)",
        "firmwarecheck": "펌웨어 자동체크여부 (true | false)",
        "baudRate": "baudRate(115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75, 50)",
        "parity" : "parity('none', 'even', 'mark', 'odd', 'space')",
        "dataBits" : "dataBits(8, 7, 6, 5)",
        "stopBits" : "stopBits(1, 2)",
        "bufferSize" : "bufferSize(255 ...)",
        "delimiter" : "delimiter(ex '\r')",
        "flowControl" : "flowControl(ex. 'hardware')"
    }
}
```
실행
```bash
nw.exe .
// 디버그 모드로 열고 싶을 경우엔
nw.exe . -debug
```

## Copyright and License

Entry-HW Copyright (c) 2015 Entry Labs.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
