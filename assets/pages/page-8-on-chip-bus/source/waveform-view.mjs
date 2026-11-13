import { syncPageHeight, getSelectedWaveType } from './shared.mjs';
import { waveData } from './wave-catalog.mjs';
import { axiLiteSingleWaveMeta, axiStreamTimingWaveMeta, axiFullTimingWaveMeta, timingAnalysisData } from './timing-metadata.mjs';
const axiLiteSingleRefs = {
  buttons: Array.from(document.querySelectorAll('.axi-lite-single-btn')),
  kicker: document.getElementById('axi-lite-single-kicker'),
  title: document.getElementById('axi-lite-single-title'),
  description: document.getElementById('axi-lite-single-description'),
};

const axiStreamTimingRefs = {
  buttons: Array.from(document.querySelectorAll('.axi-stream-timing-btn')),
  kicker: document.getElementById('axi-stream-timing-kicker'),
  title: document.getElementById('axi-stream-timing-title'),
  description: document.getElementById('axi-stream-timing-description'),
};

const axiFullTimingRefs = {
  buttons: Array.from(document.querySelectorAll('.axi-full-timing-btn')),
  kicker: document.getElementById('axi-full-timing-kicker'),
  title: document.getElementById('axi-full-timing-title'),
  description: document.getElementById('axi-full-timing-description'),
  points: document.getElementById('axi-full-timing-points'),
  footnote: document.getElementById('axi-full-timing-footnote'),
};

const axiLiteDependencyRefs = {
  buttons: Array.from(document.querySelectorAll('.axi-lite-dep-btn')),
  panels: Array.from(document.querySelectorAll('[data-axi-lite-dep-panel]')),
};

let activeAxiLiteSingleWave = 'axi_lite_write_single';
let activeAxiStreamTimingWave = 'axis_basic_transfer';
let activeAxiFullTimingWave = 'axi_full_write_dependency';
let activeAxiLiteDependencyPanel = 'write';
const timingAnalysisTargets = {
  apb: document.getElementById('apb-timing-analysis-list'),
  ahb: document.getElementById('ahb-timing-analysis-list'),
  ahbArb: document.getElementById('ahb-arb-timing-analysis-list'),
  axi: document.getElementById('axi-timing-analysis-list'),
};

function renderWaveDromToContainer(sourceJson, containerId, targetIndex) {
  if (typeof WaveDrom === 'undefined') return;
  const container = document.getElementById(containerId);
  const diagramMinWidth = Number(sourceJson?.config?.diagramMinWidth || 0);
  if (container) {
    container.innerHTML = '';
    container.style.minWidth = diagramMinWidth ? `${diagramMinWidth}px` : '0';
    container.style.width = diagramMinWidth ? `${diagramMinWidth}px` : '100%';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
  }
  WaveDrom.RenderWaveForm(targetIndex, sourceJson, 'WaveDrom_Display_');
  const svg = container?.querySelector('svg');
  if (svg) {
    svg.style.width = diagramMinWidth ? `${diagramMinWidth}px` : '100%';
    svg.style.maxWidth = diagramMinWidth ? 'none' : '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
  }
  window.setTimeout(syncPageHeight, 60);
}

function updateTimingAnalysis(section, type) {
  const target = timingAnalysisTargets[section];
  const items = timingAnalysisData[section]?.[type];
  if (!target || !items) return;

  target.innerHTML = items.map((item) => `<li>- ${item}</li>`).join('');
}

function renderWaveDrom(type) {
  const sourceJson = waveData[type];
  const isAHB = type.startsWith('ahb_');
  const isAXI = type.startsWith('axi_');
  const section = isAHB ? 'ahb' : isAXI ? 'axi' : 'apb';
  updateTimingAnalysis(section, type);
  let targetIndex = 0;
  if (isAHB) targetIndex = 1;
  if (isAXI) targetIndex = 2;
  renderWaveDromToContainer(sourceJson, 'WaveDrom_Display_' + targetIndex, targetIndex);
}

function renderAhbArbWaveDrom(type) {
  const sourceJson = waveData[type];
  if (!sourceJson) return;
  updateTimingAnalysis('ahbArb', type);
  renderWaveDromToContainer(sourceJson, 'WaveDrom_Display_3', 3);
}

function renderSupplementalWaveforms(section) {
  if (section === 'axi-lite') {
    const sourceJson = waveData[activeAxiLiteSingleWave];
    const meta = axiLiteSingleWaveMeta[activeAxiLiteSingleWave];
    if (sourceJson) {
      renderWaveDromToContainer(sourceJson, 'WaveDrom_Display_4', 4);
    }
    if (meta) {
      if (axiLiteSingleRefs.kicker) axiLiteSingleRefs.kicker.textContent = meta.kicker;
      if (axiLiteSingleRefs.title) axiLiteSingleRefs.title.textContent = meta.title;
      if (axiLiteSingleRefs.description) axiLiteSingleRefs.description.innerHTML = meta.description;
    }
    axiLiteSingleRefs.buttons.forEach((button) => {
      const isActive = button.dataset.wave === activeAxiLiteSingleWave;
      button.className = isActive
        ? 'axi-lite-single-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap bg-white text-blue-600 shadow-sm border border-gray-200'
        : 'axi-lite-single-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 hover:text-gray-900';
      button.setAttribute('aria-pressed', String(isActive));
    });
    return;
  }

  if (section === 'axi-stream') {
    const sourceJson = waveData[activeAxiStreamTimingWave];
    const meta = axiStreamTimingWaveMeta[activeAxiStreamTimingWave];
    if (sourceJson) {
      renderWaveDromToContainer(sourceJson, 'WaveDrom_Display_6', 6);
    }
    if (meta) {
      if (axiStreamTimingRefs.kicker) axiStreamTimingRefs.kicker.textContent = meta.kicker;
      if (axiStreamTimingRefs.title) axiStreamTimingRefs.title.textContent = meta.title;
      if (axiStreamTimingRefs.description) axiStreamTimingRefs.description.innerHTML = meta.description;
    }
    axiStreamTimingRefs.buttons.forEach((button) => {
      const isActive = button.dataset.wave === activeAxiStreamTimingWave;
      button.className = isActive
        ? 'axi-stream-timing-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap bg-white text-cyan-600 shadow-sm border border-gray-200'
        : 'axi-stream-timing-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 hover:text-gray-900';
      button.setAttribute('aria-pressed', String(isActive));
    });
    return;
  }

  if (section === 'axi-full') {
    const sourceJson = waveData[activeAxiFullTimingWave];
    const meta = axiFullTimingWaveMeta[activeAxiFullTimingWave];
    if (sourceJson) {
      renderWaveDromToContainer(sourceJson, 'WaveDrom_Display_7', 7);
    }
    if (meta) {
      if (axiFullTimingRefs.kicker) axiFullTimingRefs.kicker.textContent = meta.kicker;
      if (axiFullTimingRefs.title) axiFullTimingRefs.title.textContent = meta.title;
      if (axiFullTimingRefs.description) axiFullTimingRefs.description.innerHTML = meta.description;
      if (axiFullTimingRefs.points) {
        axiFullTimingRefs.points.innerHTML = meta.points.map((item) => `<li>- ${item}</li>`).join('');
      }
      if (axiFullTimingRefs.footnote) {
        const footnote = (meta.footnote || '').trim();
        axiFullTimingRefs.footnote.innerHTML = footnote;
        axiFullTimingRefs.footnote.classList.toggle('hidden', !footnote);
        axiFullTimingRefs.footnote.setAttribute('aria-hidden', String(!footnote));
      }
    }
    axiFullTimingRefs.buttons.forEach((button) => {
      const isActive = button.dataset.wave === activeAxiFullTimingWave;
      button.className = isActive
        ? 'axi-full-timing-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap bg-white text-blue-600 shadow-sm border border-gray-200'
        : 'axi-full-timing-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 hover:text-gray-900';
      button.setAttribute('aria-pressed', String(isActive));
    });
  }
}

function renderAxiLiteDependencyPanel(panelKey = 'write') {
  activeAxiLiteDependencyPanel = panelKey === 'read' ? 'read' : 'write';

  axiLiteDependencyRefs.panels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.axiLiteDepPanel !== activeAxiLiteDependencyPanel);
  });

  axiLiteDependencyRefs.buttons.forEach((button) => {
    const isActive = button.dataset.axiLiteDep === activeAxiLiteDependencyPanel;
    button.className = isActive
      ? 'axi-lite-dep-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap bg-white text-blue-600 shadow-sm border border-gray-200'
      : 'axi-lite-dep-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 hover:text-gray-900';
    button.setAttribute('aria-pressed', String(isActive));
  });

  window.setTimeout(syncPageHeight, 40);
}
const waveBtns = document.querySelectorAll('.wave-btn');
waveBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    waveBtns.forEach((b) => {
      b.className = 'wave-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 hover:text-gray-900';
    });
    btn.className = 'wave-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap bg-white text-blue-600 shadow-sm border border-gray-200';
    renderWaveDrom(btn.getAttribute('data-wave'));
  });
});

const ahbWaveBtns = document.querySelectorAll('.ahb-wave-btn');
ahbWaveBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    ahbWaveBtns.forEach((b) => {
      b.className = 'ahb-wave-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 hover:text-gray-900';
    });
    btn.className = 'ahb-wave-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap bg-white text-green-600 shadow-sm border border-gray-200';
    renderWaveDrom(btn.getAttribute('data-wave'));
  });
});

const ahbArbWaveBtns = document.querySelectorAll('.ahb-arb-wave-btn');
ahbArbWaveBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    ahbArbWaveBtns.forEach((b) => {
      b.className = 'ahb-arb-wave-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 hover:text-gray-900';
    });
    btn.className = 'ahb-arb-wave-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap bg-white text-green-600 shadow-sm border border-gray-200';
    renderAhbArbWaveDrom(btn.getAttribute('data-wave'));
  });
});

const axiWaveBtns = document.querySelectorAll('.axi-wave-btn');
axiWaveBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    axiWaveBtns.forEach((b) => {
      b.className = 'axi-wave-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-500 hover:text-gray-900';
    });
    btn.className = 'axi-wave-btn px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap bg-white text-blue-600 shadow-sm border border-gray-200';
    renderWaveDrom(btn.getAttribute('data-wave'));
  });
});

axiLiteDependencyRefs.buttons.forEach((button) => {
  button.addEventListener('click', () => {
    renderAxiLiteDependencyPanel(button.dataset.axiLiteDep || 'write');
  });
});

axiLiteSingleRefs.buttons.forEach((button) => {
  button.addEventListener('click', () => {
    activeAxiLiteSingleWave = button.dataset.wave || 'axi_lite_write_single';
    renderSupplementalWaveforms('axi-lite');
  });
});

axiStreamTimingRefs.buttons.forEach((button) => {
  button.addEventListener('click', () => {
    activeAxiStreamTimingWave = button.dataset.wave || 'axis_basic_transfer';
    renderSupplementalWaveforms('axi-stream');
  });
});

axiFullTimingRefs.buttons.forEach((button) => {
  button.addEventListener('click', () => {
    activeAxiFullTimingWave = button.dataset.wave || 'axi_full_write_dependency';
    renderSupplementalWaveforms('axi-full');
  });
});

export function renderProtocolWaveforms(section) {
  if (section === 'apb') renderWaveDrom(getSelectedWaveType('.wave-btn', 'write_nowait'));
  if (section === 'ahb') {
    renderWaveDrom(getSelectedWaveType('.ahb-wave-btn', 'ahb_single'));
    renderAhbArbWaveDrom(getSelectedWaveType('.ahb-arb-wave-btn', 'ahbarb_grant_nowait'));
  }
  if (section === 'axi-lite') {
    renderWaveDrom(getSelectedWaveType('.axi-wave-btn', 'axi_valid_before'));
    renderAxiLiteDependencyPanel(activeAxiLiteDependencyPanel);
  }
  if (section.startsWith('axi-')) renderSupplementalWaveforms(section);
}
