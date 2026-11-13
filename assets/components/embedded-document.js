/* Self-measure live documents without accessing a parent iframe's origin. */
(() => {
    if (window.self === window.top) return;
    let requestedActive = false;
    let observing = false;
    let raf = 0;
    let lastHeight = 0;
    let lastModal = null;
    const post = (data) => window.parent.postMessage(data, '*');
    const measure = () => {
        raf = 0;
        if (!observing || !document.body) return;
        const body = document.body;
        const open = Array.from(document.querySelectorAll('dialog[open], [aria-modal="true"]'))
            .some(element => element.getClientRects().length > 0);
        if (open !== lastModal) {
            lastModal = open;
            post({ type: 'chipbook:frame-modal', open });
        }
        const bottom = Array.from(body.querySelectorAll('*')).reduce((height, element) => {
            if (!element.getClientRects().length) return height;
            return Math.max(height, element.getBoundingClientRect().bottom + window.scrollY);
        }, body.getBoundingClientRect().bottom + window.scrollY);
        const height = Math.ceil(Math.max(body.offsetHeight, bottom));
        if (height > 0 && height !== lastHeight) {
            lastHeight = height;
            post({ type: 'chipbook:frame-height', height });
        }
    };
    const schedule = () => {
        if (observing && !raf) raf = window.requestAnimationFrame(measure);
    };
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    const mutation = new MutationObserver(schedule);
    const sync = () => {
        const active = requestedActive && !document.hidden && Boolean(document.body);
        if (active === observing) return;
        observing = active;
        if (active) {
            resize?.observe(document.body);
            mutation.observe(document.body, {
                subtree: true, childList: true, characterData: true, attributes: true,
                attributeFilter: ['class', 'style', 'hidden', 'open', 'aria-expanded'],
            });
            lastHeight = 0;
            lastModal = null;
            schedule();
        } else {
            resize?.disconnect();
            mutation.disconnect();
            window.cancelAnimationFrame(raf);
            raf = 0;
        }
    };
    window.addEventListener('message', (event) => {
        if (event.source !== window.parent) return;
        const data = event.data;
        if (data?.type === 'chipbook:frame-viewport' && Number.isFinite(data.top) && Number.isFinite(data.height)) {
            const style = document.documentElement.style;
            [['--embedded-visible-top', data.top], ['--embedded-visible-height', data.height]].forEach(([name, value]) => {
                const next = `${Math.max(0, Math.round(value))}px`;
                if (style.getPropertyValue(name) !== next) style.setProperty(name, next);
            });
            return;
        }
        if (data?.type !== 'chipbook:frame-active') return;
        document.documentElement.classList.add('is-embedded-document');
        requestedActive = Boolean(event.data.active);
        sync();
    });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('DOMContentLoaded', () => {
        sync();
        document.fonts?.ready.then(schedule);
        post({ type: 'chipbook:frame-ready' });
    });
    window.addEventListener('pagehide', () => { requestedActive = false; sync(); });
    window.addEventListener('pageshow', () => post({ type: 'chipbook:frame-ready' }));
    post({ type: 'chipbook:frame-ready' });
})();
