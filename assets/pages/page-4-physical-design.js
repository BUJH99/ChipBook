function syncPart4Groups(activeKey) {
    const coreGroupEl = document.getElementById('part4-core-group');
    if (coreGroupEl) {
        coreGroupEl.hidden = !['floorplan', 'pnr'].includes(activeKey);
    }

    const tailGroupEl = document.getElementById('part4-tail-group');
    if (tailGroupEl) {
        tailGroupEl.hidden = !['signoff', 'design-kit'].includes(activeKey);
    }
}

window.GuidebookPage.initActionSectionPage({
    defaultKey: 'floorplan',
    panelSelector: '[data-part4-panel]',
    panelKeyDataset: 'part4Panel',
    titleAttribute: 'data-guidebook-toc-title',
    currentHeader: {
        shellId: 'part4-current-shell',
        labelId: 'part4-current-label',
        mode: 'static',
    },
    syncGroups: ({ activeKey }) => {
        syncPart4Groups(activeKey);
    },
});
