'use strict';
const assert = require('node:assert/strict');
const { createState, transition, ERASED, DATA, READ_ERROR } = require('../assets/nand-ssd-visuals.js');
let state = createState();
const originalPages = [...state.pages];
const programmed = transition(state, 'page-program');
assert.equal(programmed.pages[2], '10100110');
assert.deepEqual(programmed.pages.filter((_,i)=>i!==2), originalPages.filter((_,i)=>i!==2));
assert.deepEqual(state.pages, originalPages, 'transition must not mutate the previous model');
assert.deepEqual(transition(programmed, 'page-program').pages, programmed.pages, 'written pages cannot be overwritten without erase');
assert.ok(transition(programmed, 'block-erase').pages.every(page => page === ERASED));
assert.equal(transition(state,'page-select',8).selectedPage, 2, 'invalid selection must be ignored');
state = transition(state,'cell-power');
assert.equal(state.programmed,true);
assert.equal(transition(state,'cell-erase').programmed,true,'power off retains charge');
state = transition(state,'cell-power');
state = transition(state,'cell-erase');
assert.equal(state.programmed,false);
assert.equal(transition(transition(state,'cell-power'),'cell-program').programmed,false,'power off prevents program');
assert.equal([...DATA].filter((bit,i)=>bit!==READ_ERROR[i]).length,1);
assert.equal(transition(state,'ecc-correct').corrected,true);
assert.equal(transition(state,'ftl-update').remapped,true);
let wearState = createState();
for (let i=0;i<80;i++) {
  const previous = wearState;
  wearState = transition(previous,'wear-next');
  assert.equal(previous.wear[wearState.wearTarget],Math.min(...previous.wear),'only an eligible least-worn block should be selected');
  assert.equal(wearState.wear.reduce((a,b)=>a+b), previous.wear.reduce((a,b)=>a+b)+1);
  assert.ok(wearState.wear.every((count,i)=>count>=previous.wear[i]),'wear is never undone');
}
assert.equal(transition(state,'ssd-step',3).ssdStep,3);
assert.equal(transition(state,'ssd-step',4).ssdStep,0,'unknown stages are ignored');
assert.equal(transition(transition(state,'ssd-step',3),'ssd-reset').ssdStep,0);
console.log('PASS: page scope, erase scope, power retention, one-bit example, mapping, cumulative wear, and SSD stages');

