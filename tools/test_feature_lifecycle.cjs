'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs');
const load = relative => import(pathToFileURL(path.join(__dirname, '..', relative)).href);

test('deactivation cancels timers and rejects pending actions; reactivation remains usable', async () => {
    const { createTaskScope } = await load('assets/features/shared/source/task-scope.mjs');
    const timers = new Map();
    let id = 0;
    const clock = {
        setTimeout: fn => { timers.set(++id, fn); return id; },
        setInterval: fn => { timers.set(++id, fn); return id; },
        clearTimeout: key => timers.delete(key), clearInterval: key => timers.delete(key),
    };
    const scope = createTaskScope(clock);
    await assert.rejects(scope.delay(10), { name: 'AbortError' });
    scope.start();
    const pending = scope.delay(1000);
    const rejected = assert.rejects(pending, { name: 'AbortError' });
    let fired = false;
    scope.timeout(() => { fired = true; }, 100);
    scope.interval(() => { fired = true; }, 100);
    scope.stop();
    await rejected;
    assert.equal(timers.size, 0);
    assert.equal(fired, false);
    scope.start();
    const completed = scope.delay(10);
    [...timers.values()][0]();
    await completed;
    assert.equal(scope.isActive(), true);
    scope.stop();
});

test('AHB burst addresses wrap inside their aligned window and increment independently', async () => {
    const model = await load('assets/pages/page-8-on-chip-bus/source/ahb-model.mjs');
    assert.deepEqual(model.createWrapAddresses(0x38, 4, 4), ['0x38', '0x3C', '0x30', '0x34']);
    assert.deepEqual(model.createIncrAddresses(0x38, 4, 4), ['0x38', '0x3C', '0x40', '0x44']);
    const catalog = await load('assets/pages/page-8-on-chip-bus/source/wave-catalog.mjs');
    for (const example of [...model.ahbHsizeExamples, ...model.ahbBurstExamples]) {
        assert.ok(catalog.waveData[example.key]?.signal.length, example.key);
    }
});

test('data-driven memory concept icons are declared and available for packaging', () => {
    const concepts = require('../assets/features/memory/memory-fail-concepts.js');
    const manifest = require('../pages/page-5-memory-device/source/page-build.json');
    const names = new Set(Object.values(concepts.stories).flatMap(story => story.flow.map(step => step[2])));
    for (const name of names) {
        assert.ok(manifest.runtimeAssets.includes(`../assets/icons/tabler/${name}.svg`), name);
        assert.ok(fs.existsSync(path.join(__dirname, `../assets/icons/tabler/${name}.svg`)), name);
    }
});

test('live-document script validation covers classic JavaScript and JSX', () => {
    const { validateHtml } = require('./check_scripts.cjs');
    assert.equal(validateHtml('<script>const ready = true;</script><script type="text/babel">const view = <div>UVM</div>;</script>', 'fixture.html'), 2);
    assert.throws(() => validateHtml('<script>const broken = ;</script>', 'bad.html'));
    assert.throws(() => validateHtml('<script type="text/babel">const bad = <div>;</script>', 'bad-jsx.html'));
});
