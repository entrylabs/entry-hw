'use strict';
const assert = require('assert');
const hamster = require('../app/modules/hamster_s.js');

// 더럽혀진 상태를 만든 뒤 connect() 호출
hamster.reset();
hamster.motoring.leftWheel = 100;
hamster.motoring.rightWheel = 100;
hamster.justConnected = false;

assert.strictEqual(typeof hamster.connect, 'function', 'connect() hook must exist');
hamster.connect();

assert.strictEqual(hamster.motoring.leftWheel, 0, 'connect() must reset motoring (leftWheel=0)');
assert.strictEqual(hamster.motoring.rightWheel, 0, 'connect() must reset motoring (rightWheel=0)');
assert.strictEqual(hamster.justConnected, true, 'connect() must arm justConnected=true');

console.log('connect.spec OK');
