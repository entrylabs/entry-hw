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

// 실제 캡처 포맷 (ASCII 이름)
check('FF01,Hamster-S,0E,00,534896FC3CC5', 'ASCII name', '020E00', '534896FC3CC5');
// 이름 없는 포맷
check('FF01,,0E,01,C62AFCA68AF1', 'empty name', '020E01', 'C62AFCA68AF1');
// 한글 이름
check('FF01,햄스터S,0E,00,534896FC3CC5', 'Korean name', '020E00', '534896FC3CC5');

console.log('handshake_parse.spec OK');
