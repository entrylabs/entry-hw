'use strict';
// 5종 로봇(hamster/turtle/brown/sally/cheese) 핸드세이크 파싱 회귀 테스트.
// 이름 필드(field[1])는 사용자가 바꿀 수 있는 가변값이라 콤마나 CR/LF 가 섞여도 모델/변형/주소
// 파싱이 흔들리면 안 된다. 실물 캡처 포맷 기준:
//   hamster FF01,Hamster,04,05,BA4A0461D9DA | turtle FF01,Turtle,09,02,4ED7EEBFD8F4
//   cheese  FF01,Cheese Stick,0D,05,FDA3ECEC3AC4 | (참조 hamster_s FF01,Hamster-S,0E,00,...)
// variant 는 항상 hex 2자리, 주소는 항상 hex 12자리, 주소 뒤 필드 없음(4개 패밀리 실측 확인).
const assert = require('assert');

const hamster = require('../app/modules/hamster.js');
const turtle  = require('../app/modules/turtle.js');
const brown   = require('../app/modules/brown.js');
const sally   = require('../app/modules/sally.js');
const cheese  = require('../app/modules/cheese.js');

// --- return-true 계열 (hamster, cheese): 성공 시 checkInitialData 가 true 반환 ---
function okT(mod, input, label, expectId, expectAddr) {
  const cfg = {};
  const r = mod.checkInitialData(input, cfg);
  assert.strictEqual(r, true, label + ' must handshake-OK (got ' + r + ')');
  assert.strictEqual(cfg.id, expectId, label + ' id');
  assert.strictEqual(mod.address, expectAddr, label + ' address');
}
function failT(mod, input, label) {
  const cfg = {};
  const r = mod.checkInitialData(input, cfg);
  assert.notStrictEqual(r, true, label + ' must NOT handshake-OK (got ' + r + ')');
}

// --- 상태머신 계열 (turtle, brown, sally): 성공 시 alignment.state=1 로 전이(반환 undefined) ---
function ensureState0(mod) {
  if (!mod.alignment) mod.alignment = {};
  mod.alignment.state = 0;
  mod.alignment.count = 0;
}
function okS(mod, input, label, expectId, expectAddr) {
  ensureState0(mod);
  const cfg = {};
  mod.checkInitialData(input, cfg);
  assert.strictEqual(mod.alignment.state, 1, label + ' must advance to state 1');
  assert.strictEqual(cfg.id, expectId, label + ' id');
  assert.strictEqual(mod.address, expectAddr, label + ' address');
}
function failS(mod, input, label) {
  ensureState0(mod);
  const cfg = {};
  const r = mod.checkInitialData(input, cfg);
  assert.strictEqual(mod.alignment.state, 0, label + ' must stay in state 0');
  assert.notStrictEqual(r, true, label + ' must NOT handshake-OK');
}

// ===== hamster (04 classic + 0E HamsterS, 둘 다 0204 프리픽스) =====
okT(hamster, 'FF01,Hamster,04,05,BA4A0461D9DA', 'hamster real capture', '020405', 'BA4A0461D9DA');
okT(hamster, 'FF01,Hamster-S,0E,00,534896FC3CC5', 'hamster via 0E branch', '020400', '534896FC3CC5');
okT(hamster, 'FF01,My,Robot,04,05,BA4A0461D9DA', 'hamster comma-in-name', '020405', 'BA4A0461D9DA');
okT(hamster, 'FF01,Ham\rster,04,05,BA4A0461D9DA\r', 'hamster CR-in-name+terminator', '020405', 'BA4A0461D9DA');
okT(hamster, 'FF01,햄스터,04,05,BA4A0461D9DA', 'hamster Korean name', '020405', 'BA4A0461D9DA');
assert.strictEqual(hamster.isHamsterS, false, 'hamster 04 -> isHamsterS false');
hamster.checkInitialData('FF01,x,0E,00,534896FC3CC5', {});
assert.strictEqual(hamster.isHamsterS, true, 'hamster 0E -> isHamsterS true');
failT(hamster, 'FF01,name,05,05,BA4A0461D9DA', 'hamster wrong model');
failT(hamster, 'FF01,name,04,5,BA4A0461D9DA', 'hamster 1-digit variant');
failT(hamster, 'FF01,name,04,05,BA4A0461D9DAjunk', 'hamster address suffix junk');
assert.strictEqual(hamster.checkInitialData('FF01,name,04', {}), undefined, 'hamster partial frame -> undefined');
failT(hamster, null, 'hamster null');
failT(hamster, 12345, 'hamster non-string');

// ===== turtle (09) =====
okS(turtle, 'FF01,Turtle,09,02,4ED7EEBFD8F4', 'turtle real capture', '020902', '4ED7EEBFD8F4');
okS(turtle, 'FF01,My,Turtle,09,02,4ED7EEBFD8F4', 'turtle comma-in-name', '020902', '4ED7EEBFD8F4');
okS(turtle, 'FF01,거북\n이,09,02,4ED7EEBFD8F4', 'turtle LF-in-name', '020902', '4ED7EEBFD8F4');
failS(turtle, 'FF01,name,08,02,4ED7EEBFD8F4', 'turtle wrong model');
failS(turtle, 'FF01,name,09,ZZ,4ED7EEBFD8F4', 'turtle non-hex variant');
ensureState0(turtle);
assert.strictEqual(turtle.checkInitialData('FF01,name,09', {}), undefined, 'turtle partial -> undefined');

// ===== brown (10/11 -> 0210) =====
okS(brown, 'FF01,Brown,10,03,AABBCCDDEEFF', 'brown model 10', '021003', 'AABBCCDDEEFF');
okS(brown, 'FF01,Brown,11,03,AABBCCDDEEFF', 'brown model 11 (0210 prefix)', '021003', 'AABBCCDDEEFF');
okS(brown, 'FF01,Br,own,10,03,AABBCCDDEEFF', 'brown comma-in-name', '021003', 'AABBCCDDEEFF');
failS(brown, 'FF01,name,12,03,AABBCCDDEEFF', 'brown wrong model');

// ===== sally (10/11 -> 0211) =====
okS(sally, 'FF01,Sally,11,07,112233445566', 'sally model 11', '021107', '112233445566');
okS(sally, 'FF01,Sally,10,07,112233445566', 'sally model 10 (0211 prefix)', '021107', '112233445566');
okS(sally, 'FF01,샐,리,11,07,112233445566', 'sally comma-in-name', '021107', '112233445566');

// ===== cheese (0D) =====
okT(cheese, 'FF01,Cheese Stick,0D,05,FDA3ECEC3AC4', 'cheese real capture', '020D05', 'FDA3ECEC3AC4');
okT(cheese, 'FF01,Cheese,Stick,0D,05,FDA3ECEC3AC4', 'cheese comma-in-name', '020D05', 'FDA3ECEC3AC4');
okT(cheese, 'FF01,치즈\r스틱,0D,05,FDA3ECEC3AC4\r\n', 'cheese CRLF', '020D05', 'FDA3ECEC3AC4');
failT(cheese, 'FF01,name,0C,05,FDA3ECEC3AC4', 'cheese wrong model');
failT(cheese, 'FF01,name,0D,,FDA3ECEC3AC4', 'cheese empty variant');
assert.strictEqual(cheese.checkInitialData('FF01,name,0D', {}), undefined, 'cheese partial -> undefined');
failT(cheese, null, 'cheese null');

console.log('handshake_parse_family.spec OK');
