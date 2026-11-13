'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(embedded = false) {
    const events = new Map();
    const on = (name, callback) => { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(callback); };
    const off = (name, callback) => events.get(name)?.delete(callback);
    const emit = (name, event = {}) => [...(events.get(name) || [])].forEach(callback => callback(event));
    class Element {
        constructor() {
            this.isConnected = true;
            this.visible = true;
            this.hidden = false;
            this.dataset = {};
            this.style = {};
            this.classList = { add() {}, remove() {}, toggle() {} };
        }
        getClientRects() { return this.visible ? [{}] : []; }
        getBoundingClientRect() { return { top: 0, bottom: 1000, height: 1000 }; }
        closest() { return this.hidden ? this : null; }
    }
    const body = new Element();
    body.dataset.pageId = 'page-8';
    const document = {
        body, documentElement: new Element(), hidden: false, title: 'Fixture',
        querySelector: () => null, querySelectorAll: () => [],
        addEventListener: on,
    };
    const parentMessages = [];
    const timers = new Map();
    let sequence = 0;
    const window = {
        document, Node: Element, Element, location: { search: '' }, innerHeight: 900,
        addEventListener: on, removeEventListener: off,
        setTimeout: callback => { timers.set(++sequence, callback); return sequence; },
        clearTimeout: id => timers.delete(id),
        setInterval: callback => { timers.set(++sequence, callback); return sequence; },
        clearInterval: id => timers.delete(id),
        requestAnimationFrame: callback => { timers.set(++sequence, callback); return sequence; },
        cancelAnimationFrame: id => timers.delete(id),
        scrollTo() {},
    };
    window.self = window;
    window.top = embedded ? {} : window;
    window.parent = embedded ? { postMessage: message => parentMessages.push(message) } : window;
    const errors = [];
    const context = vm.createContext({ window, document, Element, URLSearchParams, console: { error: (...args) => errors.push(args) } });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/guidebook-page-common.js'), 'utf8'), context);
    return { api: window.GuidebookPage, document, window, Element, emit, errors, parentMessages };
}

test('features start once, pause on section/browser hiding, and resume without duplication', () => {
    const { api, Element, document, emit } = harness();
    const root = new Element();
    const calls = [];
    const unregister = api.registerLifecycle({ root, start: () => calls.push('start'), stop: () => calls.push('stop'), destroy: () => calls.push('destroy') });
    assert.deepEqual(calls, []);
    emit('DOMContentLoaded');
    api.syncActivity();
    assert.deepEqual(calls, ['start']);
    root.visible = false; api.syncActivity(); api.syncActivity();
    root.visible = true; api.syncActivity();
    document.hidden = true; emit('visibilitychange');
    document.hidden = false; emit('visibilitychange');
    unregister(); unregister(); api.syncActivity();
    assert.deepEqual(calls, ['start', 'stop', 'start', 'stop', 'start', 'stop', 'destroy']);
});

test('embedded activity follows its own parent, including opaque file origins', () => {
    const { api, window, Element, emit } = harness(true);
    let starts = 0, stops = 0;
    api.registerLifecycle({ root: new Element(), start: () => starts++, stop: () => stops++ });
    emit('DOMContentLoaded');
    assert.equal(starts, 0);
    const data = { type: 'adt:page-active', pageId: 'page-8', active: true };
    emit('message', { source: {}, origin: 'null', data });
    assert.equal(starts, 0);
    emit('message', { source: window.parent, origin: 'null', data });
    assert.equal(starts, 1);
    emit('message', { source: window.parent, origin: 'null', data: { ...data, active: false } });
    assert.equal(stops, 1);
});

test('one initializer failure does not prevent other features or page activity', () => {
    const { api, emit, errors } = harness();
    let initialized = false;
    api.registerInitializer(() => { throw new Error('isolated failure'); });
    api.registerInitializer(() => { initialized = true; });
    emit('DOMContentLoaded');
    assert.equal(initialized, true);
    assert.equal(errors.length, 1);
    assert.equal(api.isPageActive(), true);
});

test('embedded frame heights only accept their child and ignore inactive updates', () => {
    const { api, Element, emit } = harness();
    const panel = new Element(), frame = new Element();
    const sent = [];
    frame.contentWindow = { postMessage: message => sent.push(message) };
    frame.dataset.src = './live.html';
    frame.getAttribute = name => name === 'src' ? frame.src : null;
    frame.setAttribute = () => {};
    frame.addEventListener = () => {};
    frame.removeEventListener = () => {};
    api.attachEmbeddedFrame(frame, { root: panel });
    emit('DOMContentLoaded');
    assert.equal(frame.src, './live.html');
    assert.equal(sent.filter(message => message.type === 'chipbook:frame-active').at(-1).active, true);
    const data = { type: 'chipbook:frame-height', height: 1300 };
    emit('message', { source: {}, data });
    assert.equal(frame.style.height, undefined);
    emit('message', { source: frame.contentWindow, data });
    assert.equal(frame.style.height, '1300px');
    panel.visible = false; api.syncActivity();
    assert.equal(sent.filter(message => message.type === 'chipbook:frame-active').at(-1).active, false);
    emit('message', { source: frame.contentWindow, data: { ...data, height: 5000 } });
    assert.equal(frame.style.height, '1300px');
});

test('BFCache suspension stops work and restoration resumes it without destroying state', () => {
    const { api, Element, emit } = harness();
    const calls = [];
    api.registerLifecycle({ root: new Element(), start: () => calls.push('start'), stop: () => calls.push('stop'), destroy: () => calls.push('destroy') });
    emit('DOMContentLoaded');
    emit('pagehide', { persisted: true });
    emit('pageshow');
    emit('pagehide', { persisted: false });
    assert.deepEqual(calls, ['start', 'stop', 'start', 'stop', 'destroy']);
});

test('nested document viewport excludes the clipped area above a sticky host header', () => {
    const { api, Element, window, emit } = harness(true);
    const frame = new Element(), sent = [];
    frame.contentWindow = { postMessage: message => sent.push(message) };
    frame.dataset.src = './live.html';
    frame.getAttribute = name => name === 'src' ? frame.src : null;
    frame.setAttribute = () => {};
    frame.addEventListener = () => {};
    frame.removeEventListener = () => {};
    frame.getBoundingClientRect = () => ({ top: 200, bottom: 2200, height: 2000 });
    api.attachEmbeddedFrame(frame);
    emit('DOMContentLoaded');
    emit('message', { source: window.parent, origin: 'null', data: {
        type: 'adt:page-active', pageId: 'page-8', active: true,
        viewport: { top: 300, height: 700 },
    } });
    const viewport = sent.filter(message => message.type === 'chipbook:frame-viewport').at(-1);
    assert.equal(viewport.top, 100);
    assert.equal(viewport.height, 700);
});
