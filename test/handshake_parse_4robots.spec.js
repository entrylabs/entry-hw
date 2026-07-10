'use strict';
// 로봇 4종(albertschool/albertai/uoalbert/zerone) 핸드세이크 파싱 회귀 테스트.
// 모델바이트와 주소 형식 검사를 통과하면 수용하고, 불일치는 재폴링으로 처리한다.
// 이름 변경, 콤마 포함 이름, CR/LF 프레임은 기존보다 넓게 수용한다.
// 단 주소 뒤에 필드가 더 붙은 프레임은 기존 코드는 수용했지만 새 코드는 거부 후 재폴링한다(아래 테스트로 문서화).
// 주소 첫 12자 hex 검사로 잘못된 주소 연결을 방지한다. 불일치는 undefined(재폴링)로만 처리하고 false(영구거부)는 쓰지 않는다.
const assert = require('assert');

const albertschool = require('../app/modules/albertschool.js');
const albertai     = require('../app/modules/albertai.js');
const uoalbert     = require('../app/modules/uoalbert.js');
const zerone       = require('../app/modules/zerone.js');

// 성공: checkInitialData 가 true 반환 + id/address 세팅 (4종 모두 return-true 방식)
function okT(mod, input, label, expectId, expectAddr) {
  const cfg = {};
  const r = mod.checkInitialData(input, cfg);
  assert.strictEqual(r, true, label + ' must handshake-OK (got ' + r + ')');
  assert.strictEqual(cfg.id, expectId, label + ' id');
  assert.strictEqual(mod.address, expectAddr, label + ' address');
}
// 소프트 실패: 불일치 시 반드시 undefined(재폴링). false 면 실패로 간주(영구거부 방지).
function softFail(mod, input, label) {
  const cfg = {};
  const r = mod.checkInitialData(input, cfg);
  assert.strictEqual(r, undefined, label + ' must soft-fail with undefined (got ' + r + ')');
  assert.strictEqual(cfg.id, undefined, label + ' must not set config.id on soft-fail');
}

// ===== albertschool (05 -> 0205) =====
okT(albertschool, 'FF01,Albert School,05,01,A1B2C3D4E5F6', 'albertschool canonical', '020501', 'A1B2C3D4E5F6');
okT(albertschool, 'FF01,My Robot,05,01,A1B2C3D4E5F6', 'albertschool renamed', '020501', 'A1B2C3D4E5F6');
okT(albertschool, 'FF01,My,Robot,05,01,A1B2C3D4E5F6', 'albertschool comma-in-name', '020501', 'A1B2C3D4E5F6');
okT(albertschool, 'FF01,알버트\n스쿨,05,01,A1B2C3D4E5F6\r\n', 'albertschool LF-in-name+CRLF term', '020501', 'A1B2C3D4E5F6');
softFail(albertschool, 'FF01,name,0A,01,A1B2C3D4E5F6', 'albertschool wrong model');
softFail(albertschool, 'FF01,Albert School,05,01,A1B2C3D4E5F6,extra', 'albertschool trailing field (C1: OLD accepted, NEW soft-rejects)');
softFail(albertschool, 'FF01,name,05', 'albertschool partial frame');
softFail(albertschool, null, 'albertschool null');
softFail(albertschool, 12345, 'albertschool non-string');
softFail(albertschool, 'FF01,Albert School,05,01,ZZZZZZZZZZZZ', 'albertschool non-hex address');

// ===== albertai (0A -> 020A) =====
okT(albertai, 'FF01,Albert AI,0A,02,B1C2D3E4F5A6', 'albertai canonical', '020A02', 'B1C2D3E4F5A6');
okT(albertai, 'FF01,My Robot,0A,02,B1C2D3E4F5A6', 'albertai renamed', '020A02', 'B1C2D3E4F5A6');
okT(albertai, 'FF01,My,Robot,0A,02,B1C2D3E4F5A6', 'albertai comma-in-name', '020A02', 'B1C2D3E4F5A6');
okT(albertai, 'FF01,알버트\nAI,0A,02,B1C2D3E4F5A6\r\n', 'albertai LF-in-name+CRLF term', '020A02', 'B1C2D3E4F5A6');
softFail(albertai, 'FF01,name,05,02,B1C2D3E4F5A6', 'albertai wrong model');
softFail(albertai, 'FF01,Albert AI,0A,02,B1C2D3E4F5A6,extra', 'albertai trailing field (C1: OLD accepted, NEW soft-rejects)');
softFail(albertai, 'FF01,name,0A', 'albertai partial frame');
softFail(albertai, null, 'albertai null');
softFail(albertai, 12345, 'albertai non-string');
softFail(albertai, 'FF01,Albert AI,0A,02,ZZZZZZZZZZZZ', 'albertai non-hex address');

// ===== uoalbert (07 -> 0207) =====
okT(uoalbert, 'FF01,UO Albert,07,03,C1D2E3F4A5B6', 'uoalbert canonical', '020703', 'C1D2E3F4A5B6');
okT(uoalbert, 'FF01,My Robot,07,03,C1D2E3F4A5B6', 'uoalbert renamed', '020703', 'C1D2E3F4A5B6');
okT(uoalbert, 'FF01,My,Robot,07,03,C1D2E3F4A5B6', 'uoalbert comma-in-name', '020703', 'C1D2E3F4A5B6');
okT(uoalbert, 'FF01,UO\n알버트,07,03,C1D2E3F4A5B6\r\n', 'uoalbert LF-in-name+CRLF term', '020703', 'C1D2E3F4A5B6');
softFail(uoalbert, 'FF01,name,05,03,C1D2E3F4A5B6', 'uoalbert wrong model');
softFail(uoalbert, 'FF01,UO Albert,07,03,C1D2E3F4A5B6,extra', 'uoalbert trailing field (C1: OLD accepted, NEW soft-rejects)');
softFail(uoalbert, 'FF01,name,07', 'uoalbert partial frame');
softFail(uoalbert, null, 'uoalbert null');
softFail(uoalbert, 12345, 'uoalbert non-string');
softFail(uoalbert, 'FF01,UO Albert,07,03,ZZZZZZZZZZZZ', 'uoalbert non-hex address');

// ===== zerone (0F -> 020F) =====
okT(zerone, 'FF01,Zerone,0F,04,D1E2F3A4B5C6', 'zerone canonical', '020F04', 'D1E2F3A4B5C6');
okT(zerone, 'FF01,My Robot,0F,04,D1E2F3A4B5C6', 'zerone renamed', '020F04', 'D1E2F3A4B5C6');
okT(zerone, 'FF01,My,Robot,0F,04,D1E2F3A4B5C6', 'zerone comma-in-name', '020F04', 'D1E2F3A4B5C6');
okT(zerone, 'FF01,제\n론,0F,04,D1E2F3A4B5C6\r\n', 'zerone LF-in-name+CRLF term', '020F04', 'D1E2F3A4B5C6');
softFail(zerone, 'FF01,name,05,04,D1E2F3A4B5C6', 'zerone wrong model');
softFail(zerone, 'FF01,Zerone,0F,04,D1E2F3A4B5C6,extra', 'zerone trailing field (C1: OLD accepted, NEW soft-rejects)');
softFail(zerone, 'FF01,name,0F', 'zerone partial frame');
softFail(zerone, null, 'zerone null');
softFail(zerone, 12345, 'zerone non-string');
softFail(zerone, 'FF01,Zerone,0F,04,ZZZZZZZZZZZZ', 'zerone non-hex address');

console.log('handshake_parse_4robots.spec OK');
