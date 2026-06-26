'use strict';
const assert = require('assert');
const cfg = require('../app/modules/hamster_s.json');
const hw = cfg.hardware;

// 신형 동글 자동인식 보강
assert.ok(hw.vendor.includes('Robomation'), 'vendor must include "Robomation" (mac 대비)');
assert.strictEqual(hw.pnpId, 'USB\\VID_1915&PID_521A', 'pnpId must match nRF52 dongle VID/PID');
assert.strictEqual(hw.lostTimer, 3000, 'lostTimer must be 3000ms');

// 버전(업데이트 전파 트리거) — semver 형식
assert.ok(/^\d+\.\d+\.\d+$/.test(cfg.version || ''), 'top-level version must be semver');

// 구형 CP210x 회귀 가드: 기존 vendor 유지
assert.ok(hw.vendor.includes('Silicon Lab'), 'must keep "Silicon Lab" for CP210x');
assert.ok(hw.vendor.includes('Microsoft'), 'must keep "Microsoft" (현재 신형이 이걸로 매칭됨)');

console.log('config.spec OK');
