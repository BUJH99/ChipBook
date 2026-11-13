'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('esbuild');

function validateHtml(text, filename) {
    let count = 0;
    for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        const attrs = match[1], code = match[2];
        if (/\bsrc\s*=/i.test(attrs) || !code.trim()) continue;
        const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1].toLowerCase() || '';
        const name = `${filename}:inline-${++count}`;
        if (type === 'text/babel' || type === 'text/jsx') {
            esbuild.transformSync(code, { loader: 'jsx', sourcefile: name, logLevel: 'silent' });
        } else if (type === 'module') {
            esbuild.transformSync(code, { loader: 'js', sourcefile: name, logLevel: 'silent' });
        } else if (!type || type === 'text/javascript' || type === 'application/javascript') {
            new vm.Script(code, { filename: name });
        }
    }
    return count;
}
function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}
function main() {
    const root = path.resolve(__dirname, '..');
    let count = 0;
    for (const file of walk(path.join(root, 'assets'))) {
        if (file.endsWith('.js')) { new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }); count++; }
        if (file.endsWith('.mjs')) { esbuild.transformSync(fs.readFileSync(file, 'utf8'), { loader: 'js', sourcefile: file, logLevel: 'silent' }); count++; }
    }
    for (const file of process.argv.slice(2)) count += validateHtml(fs.readFileSync(file, 'utf8'), file);
    console.log(`[ok] ${count} scripts, including live-document inline JS/JSX`);
}
module.exports = { validateHtml };
if (require.main === module) {
    try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
