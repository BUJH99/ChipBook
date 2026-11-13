window.GuidebookPage.registerInitializer(() => {
    const root = document.querySelector('[data-part5-panel="mos-basics"]');
    if (!root || !window.katex) return;
    root.querySelectorAll('[data-katex]').forEach(node => {
        window.katex.render(node.dataset.katex, node, { throwOnError: false, output: 'html' });
    });
});
