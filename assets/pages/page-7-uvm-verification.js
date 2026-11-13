(() => {
    window.GuidebookPage.initActionSectionPage({
        defaultKey: 'sequence-diagram',
        panelSelector: '[data-page7-panel]',
        panelKeyDataset: 'page7Panel',
        panelStateMode: 'class',
        panelActiveClass: 'active',
        buttonSelector: '[data-page7-tab]',
        buttonKeyDataset: 'page7Tab',
        currentHeader: {
            shellId: 'part7-current-shell',
            labelId: 'part7-current-label',
        },
        beforeInit() {
            document.querySelectorAll('[data-page7-panel]').forEach((panel) => {
                const frame = panel.querySelector('[data-page7-source-frame]');
                if (frame) window.GuidebookPage.attachEmbeddedFrame(frame, { root: panel });
            });
        },
    });
})();
