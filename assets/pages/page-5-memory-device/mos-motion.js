(function initMosGraphMotion() {
    const root = document.querySelector('[data-part5-panel="mos-basics"]');
    if (!root || root.dataset.mosGraphMotionReady === 'true') return;

    const button = root.querySelector('[data-mos-animation-toggle]');
    const label = root.querySelector('[data-mos-animation-label]');
    const graphs = Array.from(root.querySelectorAll('svg[data-mos-graph]'));
    if (!button || graphs.length === 0) return;

    root.dataset.mosGraphMotionReady = 'true';

    const setPaused = (paused) => {
        root.dataset.mosGraphMotion = paused ? 'paused' : 'running';
        button.classList.toggle('is-paused', paused);
        button.setAttribute('aria-pressed', paused ? 'false' : 'true');
        button.setAttribute('aria-label', paused ? '그래프 애니메이션 재생' : '그래프 애니메이션 일시정지');
        label.textContent = paused ? '애니메이션 재생' : '애니메이션 일시정지';

        graphs.forEach((graph) => {
            if (paused && typeof graph.pauseAnimations === 'function') graph.pauseAnimations();
            if (!paused && typeof graph.unpauseAnimations === 'function') graph.unpauseAnimations();
        });
    };

    let userPaused = false;
    button.addEventListener('click', () => {
        userPaused = !userPaused;
        setPaused(userPaused);
    });
    setPaused(true);
    window.GuidebookPage.registerLifecycle({ root, start() { setPaused(userPaused); }, stop() { setPaused(true); } });
})();
