'use strict';
const assert = require('assert');
const hamster = require('../app/modules/hamster_s.js');

// 핸드세이크 응답의 이름 필드(field[1])는 ASCII / 빈칸 / 한글 어느 것이든 올 수 있음.
// 어느 경우든 모델코드(0E)와 BT주소 파싱이 흔들리면 안 된다.
//
// 주의: 여기서 검사하는 cfg.id 는 checkInitialData 가 mutate 하는 "파서 레이어(=connector
// 의 nested hardware options)" 값이다. 에디터/서버에 전달되는 id 는 mainRouter 의 top-level
// config.id(= 등록값 020E01)로 별개다. 즉 cfg.id 단언은 파서 동작 검증용이지, 에디터가 보는
// 하드웨어 id 를 증명하는 게 아니다.
function check(input, label, expectId, expectAddr) {
  const cfg = {};
  const r = hamster.checkInitialData(input, cfg);
  assert.strictEqual(r, true, label + ' must handshake-OK (got ' + r + ')');
  assert.strictEqual(cfg.id, expectId, label + ' id');
  assert.strictEqual(hamster.address, expectAddr, label + ' address');
}

function checkFail(input, label) {
  const cfg = {};
  const r = hamster.checkInitialData(input, cfg);
  assert.notStrictEqual(r, true, label + ' must NOT handshake-OK (got ' + r + ')');
}

// 실제 캡처 포맷 (ASCII 이름)
check('FF01,Hamster-S,0E,00,534896FC3CC5', 'ASCII name', '020E00', '534896FC3CC5');
// 이름 없는 포맷
check('FF01,,0E,01,C62AFCA68AF1', 'empty name', '020E01', 'C62AFCA68AF1');
// 한글 이름
check('FF01,햄스터S,0E,00,534896FC3CC5', 'Korean name', '020E00', '534896FC3CC5');

// --- 사용자 임의 이름: 구조 깨짐(구분자 주입) ---
check('FF01,Robot, v2,0E,00,534896FC3CC5', 'comma in name', '020E00', '534896FC3CC5');
check('FF01,Hamster\rS,0E,00,534896FC3CC5\r', 'CR in name', '020E00', '534896FC3CC5');
check('FF01,Hamster\nS,0E,00,534896FC3CC5', 'LF in name', '020E00', '534896FC3CC5');
check('FF01,Hamster-S,0E,00,534896FC3CC5\r\n', 'CRLF terminator', '020E00', '534896FC3CC5');

// --- 다국어 이름 ---
check('FF01,机器人,0E,00,534896FC3CC5', 'Chinese', '020E00', '534896FC3CC5');
check('FF01,ロボット,0E,01,C62AFCA68AF1', 'Japanese', '020E01', 'C62AFCA68AF1');
check('FF01,Róbot ñandú,0E,00,534896FC3CC5', 'Spanish accents', '020E00', '534896FC3CC5');
check('FF01,🤖ロボ,0E,00,534896FC3CC5', 'emoji+JP', '020E00', '534896FC3CC5');
check('FF01,机器,人,0E,00,534896FC3CC5', 'CJK + comma', '020E00', '534896FC3CC5');

// --- 잘못된 입력: crash 없이 거부 ---
checkFail('FF01,name,FF,00,534896FC3CC5', 'wrong model');
checkFail('FF01,name,0E,00,123', 'short address');
checkFail('FF01,name,0E', 'partial frame');
checkFail('AB01,name,0E,00,534896FC3CC5', 'non-FF prefix');

// --- 구조 필드 손상: 보정하지 말고 반드시 거부 ---
checkFail('FF01,name,0\rE,00,534896FC3CC5', 'CR-corrupted model must NOT heal to 0E');
checkFail('FF01,name,0E,0\r0,534896FC3CC5', 'CR-corrupted variant');
checkFail('FF01,name,0E,XY,534896FC3CC5', 'non-hex variant');
checkFail('FF01,name,0E,,534896FC3CC5', 'empty variant');
checkFail('FF01,name,0E,00,534896FC3CC5junk', 'address suffix junk');
checkFail('FF01,name,0E,00,ZZZZZZZZZZZZ', 'non-hex address');

// --- 정책 고정 ---
// 소문자 hex 는 현재 정책상 받은 그대로 저장한다. 펌웨어는 대문자를 보내지만
// 정규식이 [a-f] 도 허용하므로 동작을 고정해 둔다.
check('FF01,name,0E,0a,abcdef012345', 'lowercase hex accepted verbatim', '020E0a', 'abcdef012345');
// 비문자열/널 입력: typeof 가드로 throw 없이 falsy 반환
checkFail(12345, 'non-string input (number)');
checkFail(null, 'null input');

console.log('handshake_parse.spec OK');
