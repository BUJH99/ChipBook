import * as stream from './axi-stream.mjs';
import * as bus from './bus-interface.mjs';
import * as arbiter from './ahb-arbiter.mjs';
import * as controls from './axi-controls.mjs';
import * as outstanding from './axi-outstanding.mjs';
import * as outOfOrder from './axi-out-of-order.mjs';
import { renderProtocolWaveforms } from './waveform-view.mjs';
import { renderSignals } from './axi-signals.mjs';
import { runAction } from './shared.mjs';

const actions = {
    runLock: controls.runLock,
    runProt: controls.runProt,
    runCache: controls.runCache,
    runQos: controls.runQos,
    runOutstanding: outstanding.runOutstanding,
    runOoO: outOfOrder.runOoO,
};
const labs = {
    bus,
    ahb: arbiter,
    'axi-stream': stream,
    'axi-full': {
        start() { controls.start(); outstanding.start(); outOfOrder.start(); renderSignals(); },
        stop() { controls.stop(); outstanding.stop(); outOfOrder.stop(); },
    },
};
const baseButtonClass = 'tab-btn flex min-w-max items-center gap-3 rounded-[16px] border px-4 py-3 text-sm font-semibold transition-all duration-200 whitespace-nowrap text-left lg:w-full lg:min-w-0 lg:px-4 lg:py-3.5 lg:text-base';

window.GuidebookPage.initActionSectionPage({
    defaultKey: 'amba',
    panelSelector: '[data-part8-panel]',
    panelKeyDataset: 'part8Panel',
    panelStateMode: 'class',
    panelActiveClass: 'active',
    buttonSelector: '.tab-btn',
    buttonKeyDataset: 'tab',
    buttonLabelSelector: '[data-tab-label]',
    currentHeader: { shellId: 'part8-current-shell', labelId: 'part8-current-label' },
    beforeInit() {
        window.lucide?.createIcons();
        document.querySelectorAll('[data-part8-panel]').forEach((root) => {
            const section = root.dataset.part8Panel;
            window.GuidebookPage.registerLifecycle({
                root,
                start() { renderProtocolWaveforms(section); labs[section]?.start(); },
                stop() { labs[section]?.stop(); },
            });
        });
        document.querySelectorAll('[data-bus-action]').forEach((button) => {
            const action = actions[button.dataset.busAction];
            if (action) button.addEventListener('click', () => runAction(action));
        });
    },
    applyButtonState({ button, isActive }) {
        button.className = `${baseButtonClass} ${isActive
            ? 'bg-[#3182F6] border-blue-200 text-white shadow-md shadow-blue-200/50'
            : 'border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`;
        button.setAttribute('aria-pressed', String(isActive));
        button.querySelector('svg')?.setAttribute('stroke-width', isActive ? '2.5' : '2');
    },
});
