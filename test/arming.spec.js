'use strict';
const assert = require('assert');
const hamster = require('../app/modules/hamster_s.js');

// 케이스 A: arming과 시리얼 쓰기가 동시에 걸린 상태. 첫 패킷은 반드시 정지 "모터" 패킷("10")이어야 함
// (시리얼 early-return으로 토큰이 새면 안 됨)
hamster.reset();
hamster.justConnected = true;             // arming (connect()가 세우는 값)
hamster.port.serial = true;               // 시리얼 모드 가정
hamster.command.serialWritten = true;     // 시리얼 쓰기 대기
hamster.motoring.writeSerial = [1, 0x41]; // len=1 + 데이터 1바이트
hamster.motoring.leftWheel = 100;         // "서버가 첫 write 전에 이동 명령"
hamster.motoring.rightWheel = 100;
hamster.motoring.motionType = 1;          // 전진

const first = hamster.requestLocalData();
assert.strictEqual(typeof first, 'string', 'requestLocalData must return a string');
assert.ok(first.startsWith('10'), 'first packet MUST be a motor packet ("10..."), not serial ("2...")');
assert.strictEqual(hamster.justConnected, false, 'gate must clear justConnected after first call');
assert.strictEqual(hamster.motoring.leftWheel, 0, 'first packet must force leftWheel=0');
assert.strictEqual(hamster.motoring.rightWheel, 0, 'first packet must force rightWheel=0');
assert.strictEqual(hamster.motoring.motionType, 0, 'first packet must force motionType=0 (stop)');

// 케이스 B: 2회차는 게이트 미작동(정상값 유지)
hamster.motoring.leftWheel = 50;
hamster.requestLocalData();
assert.strictEqual(hamster.motoring.leftWheel, 50, 'second packet must keep normal value (gate fires once)');

console.log('arming.spec OK');
