'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildAssets } = require('./build_assets.cjs');

test('checking a changed source detects a stale bundle without rewriting it', async () => {
    const qa = path.resolve(__dirname, '../.artifacts/qa');
    fs.mkdirSync(qa, { recursive: true });
    const fixture = fs.mkdtempSync(path.join(qa, 'asset-build-'));
    try {
        fs.mkdirSync(path.join(fixture, 'source'));
        const source = path.join(fixture, 'source/entry.js');
        fs.writeFileSync(source, 'console.log("first");\n');
        const options = { repoRoot: fixture, config: { bundles: [{ entry: 'source/entry.js', output: 'assets/entry.js' }] }, log() {} };
        await buildAssets(options);
        const output = path.join(fixture, 'assets/entry.js');
        const previous = fs.readFileSync(output);
        assert.equal(await buildAssets({ ...options, checkOnly: true }), true);
        fs.writeFileSync(source, 'console.log("second");\n');
        assert.equal(await buildAssets({ ...options, checkOnly: true }), false);
        assert.deepEqual(fs.readFileSync(output), previous);
        await buildAssets(options);
        assert.notDeepEqual(fs.readFileSync(output), previous);
        const good = fs.readFileSync(output);
        options.config.bundles.push({ entry: 'source/missing.js', output: 'assets/missing.js' });
        fs.writeFileSync(source, 'console.log("third");\n');
        await assert.rejects(buildAssets(options));
        assert.deepEqual(fs.readFileSync(output), good, 'a failed batch must preserve the last good bundles');
    } finally {
        if (!path.resolve(fixture).startsWith(qa + path.sep)) throw new Error('Unsafe test cleanup');
        fs.rmSync(fixture, { recursive: true, force: true });
    }
});
