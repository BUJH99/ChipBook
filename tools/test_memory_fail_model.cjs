'use strict';
const assert = require('node:assert/strict');
const model = require('../assets/memory-fail-model.js');
const at = (id, p = 1, mitigation = false, mode = 'hard') => model.sample(id, p, mitigation, mode);

assert.equal(model.lessons.length, 16, 'Every original failure lesson is represented');
assert.equal(new Set(model.lessons.map(item => item.id)).size, 16);
assert.equal(model.lessons.filter(item => item.family === 'DRAM').length, 8);
assert.equal(model.lessons.filter(item => item.family === 'SRAM').length, 8);

for (const lesson of model.lessons) {
    assert.equal(lesson.phases.length, 5, lesson.id);
    assert.equal(lesson.notes.length, 5, lesson.id);
    for (const mitigation of [false, true]) {
        for (const mode of lesson.id === 'dram-hard-soft' ? ['hard', 'soft'] : ['hard']) {
            const samples = model.waveforms(lesson.id, mitigation, mode, 400);
            for (const point of samples) {
                const state = at(lesson.id, point.t, mitigation, mode);
                for (const side of ['normal', 'vulnerable']) {
                    for (const quantity of ['q', 'qb', 'charge', 'metric', 'wl', 'bl', 'blb', 'stimulus']) {
                        assert.ok(Number.isFinite(state[side][quantity]), lesson.id + ': finite ' + quantity);
                        assert.ok(state[side][quantity] >= 0 && state[side][quantity] <= 1, lesson.id + ': bounded ' + quantity);
                    }
                }
                assert.equal(point.normal, state.normal.metric, 'Wave and normal circuit share a state');
                assert.equal(point.vulnerable, state.vulnerable.metric, 'Wave and vulnerable circuit share a state');
                assert.equal(point.stimulus, state.stimulus, 'Shared stimulus matches circuit time');
                assert.equal(point.normalStimulus, state.normal.stimulus, 'Reference stimulus remains distinguishable');
            }
        }
    }
}

assert.equal(at('dram-retention').normal.risk, false);
assert.equal(at('dram-retention').vulnerable.risk, true);
assert.equal(at('dram-retention', 1, true).vulnerable.risk, false);
assert.equal(at('dram-restore').vulnerable.bit, 1, 'Partial restore is not falsely shown as an immediate bit flip');
assert.ok(at('dram-restore').vulnerable.charge < at('dram-restore').normal.charge);
assert.ok(at('dram-restore', 1, true).vulnerable.charge >= 0.84);
assert.equal(at('dram-sense').vulnerable.bit, 1, 'Stored value is distinguished from incorrect readout');
assert.equal(at('dram-sense').vulnerable.output, 0);
assert.equal(at('dram-sense', 1, true).vulnerable.output, 1);
for (const p of [0.2, 0.35, 0.5, 0.75, 1]) assert.equal(at('dram-rowhammer', p).vulnerable.wl, 0, 'Hammered victim is not selected');
assert.equal(at('dram-rowhammer').vulnerable.risk, true);
assert.equal(at('dram-rowhammer', 1, true).vulnerable.risk, false);
assert.equal(at('dram-refresh').vulnerable.risk, true);
assert.equal(at('dram-refresh', 1, true).vulnerable.risk, false);
assert.equal(at('dram-write-recovery').vulnerable.bit, null, 'Incomplete write is shown as unconfirmed data');
assert.equal(at('dram-write-recovery', 1, true).vulnerable.bit, 1);
assert.equal(at('dram-vrt').vulnerable.risk, true);
assert.equal(at('dram-vrt', 1, true).vulnerable.risk, false);
assert.equal(at('dram-vrt', 0.5).normal.trap, 0, 'Stable-retention reference has no trap transition');
assert.equal(at('dram-hard-soft').vulnerable.bit, 0, 'Hard defect survives a correct rewrite');
assert.equal(at('dram-hard-soft', 1, true).vulnerable.defect, true, 'Repair routing does not erase original physical damage');
assert.equal(at('dram-hard-soft', 1, true).vulnerable.spare, true);
assert.equal(at('dram-hard-soft', 1, true).vulnerable.bit, 1);
assert.equal(at('dram-hard-soft', 1, false, 'soft').vulnerable.bit, 1, 'A deliberate rewrite can recover a soft data upset');

assert.equal(at('sram-read-upset').normal.bit, 0);
assert.equal(at('sram-read-upset').vulnerable.bit, 1, 'Destructive read leaves the latch flipped after WL turns off');
assert.equal(at('sram-read-upset').vulnerable.wl, 0);
assert.equal(at('sram-read-upset', 1, true).vulnerable.bit, 0);
assert.equal(at('sram-write-fail').normal.bit, 1);
assert.equal(at('sram-write-fail').vulnerable.bit, 0);
assert.equal(at('sram-write-fail', 1, true).vulnerable.bit, 1);
assert.equal(at('sram-half-select').normal.bit, 0);
assert.equal(at('sram-half-select').vulnerable.bit, 1);
assert.equal(at('sram-half-select', 1, true).vulnerable.bit, 0);
assert.equal(at('sram-half-select', 0.5).vulnerable.blb, 1, 'Half-selected victim is not driven with write data');
assert.equal(at('sram-hold').vulnerable.bit, null, 'Hold failure is indeterminate, not a fabricated deterministic zero');
assert.equal(at('sram-hold').vulnerable.wl, 0);
assert.equal(at('sram-hold', 1, true).vulnerable.bit, 1);
assert.equal(at('sram-slow').vulnerable.bit, 1, 'A slow read does not alter stored data');
assert.equal(at('sram-slow').vulnerable.valid, false, 'Signal arriving after sampling does not retroactively fix the read');
assert.equal(at('sram-slow', 1, true).vulnerable.valid, true);
assert.equal(at('sram-rtn', 0.55).vulnerable.risk, true);
assert.equal(at('sram-rtn', 0.55).vulnerable.bit, 0, 'RTN margin reduction is not presented as a guaranteed upset');
assert.equal(at('sram-rtn', 0.55, true).vulnerable.risk, false);
assert.equal(at('sram-aging').vulnerable.risk, true);
assert.equal(at('sram-aging').normal.metric, at('sram-aging', 0).normal.metric, 'Fresh reference remains an initial-condition baseline');
assert.equal(at('sram-aging').vulnerable.bit, 0, 'Aging margin loss does not fabricate a guaranteed bit flip');
assert.equal(at('sram-aging', 1, true).vulnerable.risk, false);
assert.equal(at('sram-ser').normal.bit, 1);
assert.equal(at('sram-ser').vulnerable.bit, 0, 'SEU remains after transient disappears');
assert.equal(at('sram-ser', 0.7, true).vulnerable.bit, 0, 'ECC does not directly rewrite the cell');
assert.equal(at('sram-ser', 0.7, true).vulnerable.output, 1, 'ECC first corrects readout');
assert.equal(at('sram-ser', 0.86, true).vulnerable.corrected, false, 'Scrub phase no longer claims the cell is awaiting rewrite');
assert.equal(at('sram-ser', 0.86, true).vulnerable.scrub, true);
assert.equal(at('sram-ser', 1, true).vulnerable.bit, 1, 'Scrub subsequently restores stored data');
assert.equal(at('sram-ser', 1, true).vulnerable.scrub, true);

assert.equal(at('sram-read-upset', -1).progress, 0);
assert.equal(at('sram-read-upset', 5).progress, 1);
assert.equal(at('sram-read-upset', NaN).progress, 0);
assert.throws(() => at('missing-mechanism'), RangeError);
console.log('PASS: 16 lessons, 34 comparison modes, shared waveform/circuit samples, and failure-specific recovery invariants.');
