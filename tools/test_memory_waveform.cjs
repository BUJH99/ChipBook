const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../assets/memory-waveform-core.js');
const model = require('../assets/memory-fail-model.js');
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`);
const linear = (x, y) => ({ x, y, interpolation: 'linear' });
const step = (x, y, end) => ({ x, y, interpolation: 'step', end });

test('cursor interpolation, gaps, repeated timestamps and exact endpoint semantics', () => {
    const t = linear([0, 1, 1, 3, 4], [0, 2, 8, 10, NaN]);
    near(core.valueAt(t, 0.5), 1);
    assert.equal(core.valueAt(t, 1), 8);
    near(core.valueAt(t, 2), 9);
    assert.ok(Number.isNaN(core.valueAt(t, -1)));
    assert.ok(Number.isNaN(core.valueAt(t, 3.5)));
    assert.ok(Number.isNaN(core.valueAt(t, 5)));
    assert.equal(core.valueAt(step([2, 5], ['X', 1], 10), 9), 1);
    assert.ok(Number.isNaN(core.valueAt(step([2], [1], 10), 1)));
});
test('irregular samples use time weighting, not arithmetic sample averages', () => {
    const t = linear([0, 1, 4], [0, 2, 2]);
    const s = core.statistics(t, 0, 4);
    near(s.mean, 1.75); near(s.rms, Math.sqrt(10 / 3)); near(s.coverage, 1);
    near(core.statistics(t, 4, 0).mean, s.mean);
    assert.equal(core.statistics(t, 2, 2).mean, null);
    assert.equal(core.statistics(t, 2, 2).coverage, null);
});
test('instantaneous jumps do not smear the interval ending at a repeated timestamp', () => {
    const t = linear([0, 1, 1, 2], [0, 0, 1, 1]);
    near(core.statistics(t, 0, 1).mean, 0);
    near(core.statistics(t, 1, 2).mean, 1);
    near(core.statistics(t, 0, 2).mean, 0.5);
});
test('missing and X/Z durations are excluded from mean, RMS and coverage', () => {
    const t = step([0, 2, 4, 6], [1, 'X', 'Z', 0], 8);
    const s = core.statistics(t, 0, 8);
    near(s.coverage, 0.5); near(s.mean, 0.5); near(s.rms, Math.sqrt(0.5));
    const g = core.statistics(linear([0, 1, 2, 3], [2, 2, NaN, 2]), 0, 3);
    near(g.coverage, 1 / 3); near(g.mean, 2);
});
test('10–90% edges interpolate analog crossings and do not invent digital rise times', () => {
    const result = core.edgeTimes(linear([0, 1, 2], [0, 1, 0]), 0, 2);
    near(result.rise, 0.8); near(result.fall, 0.8);
    assert.equal(core.edgeTimes(step([0, 1], [0, 1], 2), 0, 2).rise, null);
    assert.equal(core.edgeTimes(linear([0, 1, 2], [0, NaN, 1]), 0, 2).rise, null);
});
test('pixel envelope retains an isolated spike and a missing-data break', () => {
    const x = Array.from({ length: 10000 }, (_, i) => i), y = x.map(() => 0);
    y[5123] = 99; y[5301] = -37; y[5421] = NaN;
    const points = core.envelope(linear(x, y), 0, 9999, 100);
    assert.ok(points.some(p => p[1] === 99)); assert.ok(points.some(p => p[1] === -37));
    assert.ok(points.some(p => Number.isNaN(p[1]))); assert.ok(points.length < 605);
    assert.ok(points.every((p, i) => !i || p[0] >= points[i - 1][0]));
});
test('CSV handles BOM, quoted names, scientific values, duplicate times, units and empty samples', () => {
    const s = core.parseCSV('\uFEFF# scope export\r\n"time[ns]","Q, probe[V]",WL[logic]\r\n0,1e-3,0\r\n1,,X\r\n1,1.2,Z\r\n2,0,1\r\n', 'probe.csv');
    assert.equal(s.xUnit, 'ns'); assert.equal(s.channels[0].name, 'Q, probe');
    near(core.valueAt(s.channels[0].traces[0], 0), 0.001);
    assert.ok(Number.isNaN(core.valueAt(s.channels[0].traces[0], 0.5)));
    assert.equal(core.valueAt(s.channels[1].traces[0], 1), 'Z');
    assert.equal(s.channels[1].traces[0].interpolation, 'step');
    assert.equal(core.parseCSV('time;Q\n0;1\n2;0').xUnit, 'unit unspecified');
    assert.equal(core.parseCSV('t(ps)\tV(q)\n0\t0\n10\t1').channels[0].unit, 'V');
    assert.equal(core.parseCSV('t[ns]\t"probe,with,commas[V]"\n0\t0\n1\t1').channels[0].name, 'probe,with,commas');
});
test('CSV rejects time reversal, missing headers, malformed cells and unmatched quotes', () => {
    assert.throws(() => core.parseCSV('t,Q\n1,1\n0,2'), /오름차순/);
    assert.throws(() => core.parseCSV('t,Q\n0,1\n1,hello'), /해석할 수 없는/);
    assert.throws(() => core.parseCSV('t,Q\n0,1\n1,2,3'), /열 개수/);
    assert.throws(() => core.parseCSV('t,Q\n0,"1\n1,2'), /큰따옴표/);
    assert.throws(() => core.parseCSV('t,Q\n1,0\n1,1'), /서로 다른/);
    assert.throws(() => core.parseCSV('0,0\n1,1\n2,2'), /헤더/);
});
const vcdFixture = `$date example $end
$timescale 10 ps $end
$scope module tb $end
$var wire 1 ! clk $end
$var reg 8 " data [7:0] $end
$var real 1 # voltage $end
$var wire 1 ! alias_clk $end
$upscope $end
$enddefinitions $end
$dumpvars
0!
b0 "
r0.5 #
$end
#1
1!
b11110000 "
#2
x!
bx "
r1.5 #
#3
z!
b10xz "
#4
0!
#5
`;
test('VCD preserves timescale, hierarchy, vector width, aliases, real, X and Z', () => {
    const s = core.parseVCD(vcdFixture, 'sample.vcd');
    assert.deepEqual(s.domain, [0, 50]); assert.equal(s.xUnit, 'ps');
    assert.equal(s.channels[1].name, 'tb.data[7:0]');
    assert.equal(core.valueAt(s.channels[0].traces[0], 20), 'X');
    assert.equal(core.valueAt(s.channels[0].traces[0], 30), 'Z');
    assert.equal(core.valueAt(s.channels[1].traces[0], 0), '00000000');
    assert.equal(core.valueAt(s.channels[1].traces[0], 25), 'xxxxxxxx');
    assert.equal(core.valueAt(s.channels[1].traces[0], 35), '000010xz');
    assert.equal(core.valueAt(s.channels[2].traces[0], 45), 1.5);
    assert.equal(s.channels[0].traces[0].x, s.channels[3].traces[0].x);
    assert.equal(core.busFormat('1'.repeat(64)), '0xFFFFFFFFFFFFFFFF');
    assert.equal(core.busFormat('0001', 'bin'), '0001');
    assert.equal(core.busFormat('10xz'), '10XZ');
});
test('VCD rejects unsafe timestamps, backwards time, width overflow and undefined codes', () => {
    assert.throws(() => core.parseVCD(vcdFixture + '#9007199254740992'), /범위/);
    assert.throws(() => core.parseVCD(vcdFixture + '#1'), /역행/);
    assert.throws(() => core.parseVCD(vcdFixture + 'b111111111 "'), /벡터 폭/);
    assert.throws(() => core.parseVCD(vcdFixture + '1?'), /정의되지/);
    assert.throws(() => core.parseVCD(vcdFixture.replace('10 ps', '2 ns')), /timescale/);
});
test('CSV export preserves cursor boundaries, duplicate jumps, bus widths and unknowns', () => {
    const s = core.parseCSV('t[ns],Q[V]\n0,0\n1,0\n1,1\n2,1');
    const exported = core.exportCSV(s, s.channels, 0.5, 1.5);
    const imported = core.parseCSV(exported);
    assert.deepEqual(Array.from(imported.channels[0].traces[0].x), [0.5, 1, 1, 1.5]);
    near(core.statistics(imported.channels[0].traces[0], 0.5, 1.5).mean, 0.5);
    assert.equal(core.valueAt(core.parseCSV(core.exportCSV(s, s.channels, 1, 2)).channels[0].traces[0], 1), 1);
    const v = core.parseVCD(vcdFixture);
    const roundTrip = core.parseCSV(core.exportCSV(v, v.channels, 0, 50));
    assert.equal(roundTrip.channels[1].kind, 'bus');
    assert.equal(core.valueAt(roundTrip.channels[1].traces[0], 25), 'xxxxxxxx');
    assert.equal(core.valueAt(roundTrip.channels[0].traces[0], 30), 'Z');
    s.channels[0].name = '=SUM(1,2)';
    assert.ok(core.exportCSV(s, s.channels, 0, 2).includes("'=SUM"));
});
test('every model profile stays synchronized with the circuit at off-grid cursor positions', () => {
    for (const lesson of model.lessons) for (const mitigation of [false, true]) for (const mode of lesson.id === 'dram-hard-soft' ? ['hard', 'soft'] : ['hard']) {
        const s = core.modelSource(model, lesson, mitigation, mode);
        assert.equal(s.kind, 'model'); assert.deepEqual(s.domain, [0, 1]);
        assert.ok(s.channels.length >= 4); assert.ok(s.channels.some(c => c.threshold));
        for (const c of s.channels) for (const t of c.traces) for (const x of [0, 0.123456, 0.32, 0.627193, 1]) {
            const side = t.role === 'vulnerable' ? 'vulnerable' : 'normal';
            const state = model.sample(lesson.id, x, mitigation, mode)[side];
            const raw = typeof c.key === 'function' ? c.key(state) : state[c.key];
            const actual = core.valueAt(t, x);
            if (raw === null || raw === undefined) assert.ok(Number.isNaN(actual)); else near(actual, Number(raw));
        }
        assert.ok(s.channels.every(c => c.unit !== 'V' && c.unit !== 'mA'));
        assert.equal(s.xUnit, lesson.id === 'sram-aging' ? 'S/Smax' : 't/T');
    }
});
test('100,000 CSV rows retain a narrow peak in raw measurements and decimation', () => {
    const csv = 't[ns],Q[V]\n' + Array.from({ length: 100000 }, (_, i) => i + ',' + (i === 45678 ? 2.4 : 0)).join('\n');
    const s = core.parseCSV(csv), t = s.channels[0].traces[0];
    assert.equal(core.valueAt(t, 45678), 2.4);
    assert.equal(core.statistics(t, 45000, 46000).max, 2.4);
    assert.ok(core.envelope(t, 0, 99999, 700).some(p => p[1] === 2.4));
});
