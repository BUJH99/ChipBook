// A feature owns its timers. Deactivation cancels waits and background work.
export function createTaskScope(clock = globalThis) {
    let active = false;
    const timers = new Map();
    const aborted = () => Object.assign(new Error('Feature is inactive'), { name: 'AbortError' });
    const track = (promise) => { promise.catch(() => {}); return promise; };
    return {
        start() { active = true; },
        stop() {
            active = false;
            const pending = [...timers];
            timers.clear();
            pending.forEach(([id, reject]) => {
                clock.clearTimeout(id);
                clock.clearInterval(id);
                reject?.(aborted());
            });
        },
        isActive: () => active,
        clear(id) {
            clock.clearTimeout(id);
            clock.clearInterval(id);
            const reject = timers.get(id);
            timers.delete(id);
            reject?.(aborted());
        },
        delay(ms) {
            return track(new Promise((resolve, reject) => {
                if (!active) { reject(aborted()); return; }
                const id = clock.setTimeout(() => { timers.delete(id); resolve(); }, ms);
                timers.set(id, reject);
            }));
        },
        timeout(callback, ms) {
            if (!active) return 0;
            const id = clock.setTimeout(() => { timers.delete(id); callback(); }, ms);
            timers.set(id, null);
            return id;
        },
        interval(callback, ms) {
            if (!active) return 0;
            const id = clock.setInterval(callback, ms);
            timers.set(id, null);
            return id;
        },
        track,
    };
}
