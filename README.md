[![Build status](https://ci.appveyor.com/api/projects/status/5qp10j3j20xyf7c0/branch/build?svg=true)](https://ci.appveyor.com/project/kimorkim/entry-hw/branch/build)


![Entry Logo](app/src/renderer/images/logo.png)
---

## What is Entry Hardware
entry-hw는 엔트리와 하드웨어를 연동하기 위한 프로그램 입니다.  
엔트리 사이트에 접속하시면 엔트리를 사용한 블록코딩 환경과 하드웨어를 연동하는 모습을 확인해 볼 수 있습니다.

## Prerequisite

#### Node.js
Node.js 는 개발 전반을 위해 반드시 설치가 되어야하는 프레임워크입니다. 작업 전 가장 먼저 설치합니다.
> https://nodejs.org 
  
#### Yarn(optional)
엔트리 하드웨어는 yarn 을 통해 의존성을 관리 중입니다. npm 을 사용해도 문제는 없습니다.

#### Node-gyp
엔트리 하드웨어는 [node-serialport](https://github.com/node-serialport/node-serialport) 를 사용합니다.  
해당 라이브러리를 사용하기 위해서는 C++, python 빌드 환경과 [node-gyp](https://github.com/nodejs/node-gyp) 라이브러리가 필요합니다.  
빌드에 대한 자세한 사항은 [node-gyp#installation](https://github.com/nodejs/node-gyp#installation) 을 참고해 주세요.

먼저 빌드 환경을 구성해야 합니다.  
윈도우의 경우, 관리자 권한 명령 프롬프트에서
```bash
npm install --global --production windows-build-tools
```
로 한번에 설치할 수 있습니다. [Windows-Build-Tools](https://github.com/felixrieseberg/windows-build-tools) 를 참고해 주세요.

```bash
npm install --global node-gyp
```

## Entry Hardware Full Documentation

[Entry Docs](https://entrylabs.github.io/docs/guide/entry-hw/2016-05-01-getting_started.html)

## Copyright and License

The MIT License (MIT)

Copyright(c) 2018 CONNECT.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
