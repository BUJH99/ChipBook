const part1SectionHeaderMeta = {
    'landscape-primary': {
        style: 'titleline',
        icon: '🗂️',
    },
    'landscape-domains': {
        text: 'Industry Domains',
        style: 'titleline',
        icon: '🏭',
    },
    'value-chain-primary': {
        style: 'titleline',
        icon: '🔗',
    },
    'future-tech-primary': {
        style: 'titleline',
        icon: '🚀',
    },
};

const part1TabMeta = {
    landscape: {
        copy: '',
    },
    'value-chain': {
        copy: '',
    },
    'future-tech': {
        copy: '',
    }
};

function renderPart1SectionHeads() {
    const classMap = {
        kicker: 'part1-section-kicker',
        titleline: 'part1-section-titleline',
    };

    document.querySelectorAll('[data-part1-section-head]').forEach((container) => {
        const meta = part1SectionHeaderMeta[container.dataset.part1SectionHead];
        if (!meta) return;

        const title = meta.text || container.closest('[data-part1-panel]')?.getAttribute('data-guidebook-toc-title');
        container.classList.add('part1-section-head');
        container.setAttribute('data-guidebook-toc-title', title);
        container.replaceChildren();

        const line = document.createElement('div');
        line.className = classMap[meta.style] || classMap.kicker;
        if (meta.icon) {
            line.classList.add('part1-section-line');

            const icon = document.createElement('span');
            icon.className = 'part1-section-icon';
            icon.textContent = meta.icon;
            line.appendChild(icon);

            const text = document.createElement('span');
            text.textContent = title;
            line.appendChild(text);
        } else {
            line.textContent = title;
        }
        container.appendChild(line);
    });
}

function applyPart1CurrentHeader() {
    const shellEl = document.getElementById('part1-current-shell');
    if (!shellEl) return;

    shellEl.style.setProperty('--part1-tab-accent', '#2563eb');
}

function updatePart1GroupVisibility() {
    if (document.body.dataset.curriculumMode) return;
    document.querySelectorAll('[data-part1-panel-group]').forEach((group) => {
        const hasVisibleChild = Array.from(group.querySelectorAll('[data-part1-panel]')).some((panel) => !panel.hidden);
        group.hidden = !hasVisibleChild;
    });
}

window.GuidebookPage.initActionSectionPage({
    defaultKey: 'landscape',
    panelSelector: '[data-part1-panel]',
    panelKeyDataset: 'part1Panel',
    titleAttribute: 'data-guidebook-toc-title',
    currentHeader: {
        shellId: 'part1-current-shell',
        labelId: 'part1-current-label',
        copyId: 'part1-current-copy',
        mode: 'static',
        apply: ({ shell }) => {
            shell.style.setProperty('--part1-tab-accent', '#2563eb');
        },
        getCopy: ({ activeKey }) => part1TabMeta[activeKey]?.copy || '',
    },
    beforeInit: () => {
        renderPart1SectionHeads();
    },
    syncGroups: () => {
        updatePart1GroupVisibility();
    },
});
