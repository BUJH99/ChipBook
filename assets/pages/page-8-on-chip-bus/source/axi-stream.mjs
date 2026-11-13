import { syncPageHeight } from './shared.mjs';
let active = false;
const axisStreamLabPacketPalette = [
  { hex: '#2563eb' },
  { hex: '#059669' },
  { hex: '#f59e0b' },
  { hex: '#ea580c' },
  { hex: '#dc2626' },
  { hex: '#9333ea' },
];

const axisStreamLabToneMap = {
  blue: '#2563eb',
  emerald: '#059669',
  amber: '#d97706',
  green: '#10b981',
  red: '#dc2626',
  slate: '#94a3b8',
};

function createAxisStreamLabDefaultSignals() {
  return {
    tvalid: false,
    tready: true,
    tlast: false,
    tuser: false,
    tkeep: [true, true, true, true],
    tstrb: [true, true, true, true],
    tid: 0,
    tdest: 0,
  };
}

const axisStreamLabState = {
  initialized: false,
  refs: null,
  signals: createAxisStreamLabDefaultSignals(),
  interconnectTready: true,
  fifo: [],
  maxFifo: 4,
  colorIndex: 0,
  clkCycle: 0,
  lastClockTick: 0,
  simSpeed: 1000,
  isPaused: false,
  rafId: 0,
  timeouts: new Set(),
  hubPulseToken: 0,
  routeToken: 0,
  routeColorHex: null,
  routeDest: null,
};

function hexToAxisStreamLabRgb(hex = '#3b82f6') {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  if (expanded.length !== 6) return '59, 130, 246';
  const value = Number.parseInt(expanded, 16);
  if (Number.isNaN(value)) return '59, 130, 246';
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function getAxisStreamLabThemeHexByColorIndex(colorIndex = 0) {
  return axisStreamLabPacketPalette[colorIndex]?.hex || axisStreamLabPacketPalette[0].hex;
}

function getAxisStreamLabResolvedHubColor() {
  if (axisStreamLabState.routeColorHex) {
    return axisStreamLabState.routeColorHex;
  }

  if (axisStreamLabState.fifo[0]) {
    return getAxisStreamLabThemeHexByColorIndex(axisStreamLabState.fifo[0].colorIndex);
  }

  return axisStreamLabPacketPalette[0].hex;
}

function getAxisStreamLabRefs() {
  if (axisStreamLabState.refs?.root?.isConnected) {
    return axisStreamLabState.refs;
  }

  const root = document.getElementById('axis-stream-channel-lab');
  if (!root) return null;

  axisStreamLabState.refs = {
    root,
    simArea: document.getElementById('axis-stream-lab-sim-area'),
    packetLane: document.getElementById('axis-stream-lab-packet-lane'),
    beam: document.getElementById('axis-stream-lab-beam-line'),
    clkCycle: document.getElementById('axis-stream-lab-clk-cycle'),
    txPulse: document.getElementById('axis-stream-lab-tx-pulse'),
    txStatusLabel: document.getElementById('axis-stream-lab-tx-status-label'),
    masterNode: document.getElementById('axis-stream-lab-master-node'),
    masterTreadyLed: document.getElementById('axis-stream-lab-master-tready-led'),
    masterTreadyText: document.getElementById('axis-stream-lab-master-tready-text'),
    switchNode: document.getElementById('axis-stream-lab-switch-node'),
    hubStatusText: document.getElementById('axis-stream-lab-hub-status-text'),
    resetButton: document.getElementById('axis-stream-lab-reset-sim'),
    pauseButton: document.getElementById('axis-stream-lab-toggle-pause'),
    pauseText: document.getElementById('axis-stream-lab-pause-text'),
    statusLed: document.getElementById('axis-stream-lab-status-led'),
    statusLabel: document.getElementById('axis-stream-lab-status-label'),
    bpWarning: document.getElementById('axis-stream-lab-bp-warning'),
    signalButtons: Array.from(root.querySelectorAll('[data-axis-sig]')),
    maskButtons: Array.from(root.querySelectorAll('[data-axis-mask]')),
    idButtons: Array.from(root.querySelectorAll('[data-axis-id]')),
    fifoSlots: Array.from(root.querySelectorAll('#axis-stream-lab-fifo-viz .axis-fifo-slot')),
    switchLeds: Array.from(root.querySelectorAll('.axis-switch-led')),
    slaveNodes: [0, 1, 2, 3].map((index) => document.getElementById(`axis-stream-lab-slave-node-${index}`)),
    valueEls: {
      tvalid: document.getElementById('axis-stream-lab-val-tvalid'),
      tready: document.getElementById('axis-stream-lab-val-tready'),
    },
  };

  return axisStreamLabState.refs;
}

function scheduleAxisStreamLabTimeout(callback, delay) {
  const timeoutId = window.setTimeout(() => {
    axisStreamLabState.timeouts.delete(timeoutId);
    callback();
  }, delay);
  axisStreamLabState.timeouts.add(timeoutId);
  return timeoutId;
}

function clearAxisStreamLabTimeouts() {
  axisStreamLabState.timeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  axisStreamLabState.timeouts.clear();
}

function setAxisStreamLabStatus(text, tone = 'slate') {
  const refs = getAxisStreamLabRefs();
  if (!refs?.statusLed || !refs.statusLabel) return;

  const color = axisStreamLabToneMap[tone] || axisStreamLabToneMap.slate;
  refs.statusLed.style.backgroundColor = color;
  refs.statusLabel.textContent = text;
  refs.statusLabel.style.color = color;
}

function updateAxisStreamLabSignalButtons() {
  const refs = getAxisStreamLabRefs();
  if (!refs) return;

  refs.signalButtons.forEach((button) => {
    const sig = button.dataset.axisSig;
    const tone = button.dataset.tone || 'blue';
    const isActive = Boolean(axisStreamLabState.signals[sig]);
    const led = button.querySelector('.axis-sig-btn__led');
    button.classList.toggle('is-active', isActive);

    if (led) {
      led.style.backgroundColor = isActive ? axisStreamLabToneMap[tone] : '#e2e8f0';
      led.style.boxShadow = isActive ? `0 0 12px ${axisStreamLabToneMap[tone]}55` : 'none';
    }

    const valueEl = refs.valueEls[sig];
    if (valueEl) {
      valueEl.textContent = isActive ? 'HIGH' : 'LOW';
      valueEl.style.color = isActive ? axisStreamLabToneMap[tone] : '#cbd5e1';
    }
  });
}

function updateAxisStreamLabBitButtons() {
  const refs = getAxisStreamLabRefs();
  if (!refs) return;

  refs.maskButtons.forEach((button) => {
    const maskType = button.dataset.axisMask;
    const bitIndex = Number(button.dataset.axisIndex);
    button.classList.toggle('is-active', Boolean(axisStreamLabState.signals[maskType]?.[bitIndex]));
  });

  refs.idButtons.forEach((button) => {
    const idType = button.dataset.axisId;
    const value = Number(button.dataset.axisValue);
    button.classList.toggle('is-active', axisStreamLabState.signals[idType] === value);
  });
}

function syncAxisStreamLabHubVisuals(colorHex = getAxisStreamLabResolvedHubColor()) {
  const refs = getAxisStreamLabRefs();
  if (!refs?.switchNode) return;

  const rgb = hexToAxisStreamLabRgb(colorHex);
  refs.switchNode.style.setProperty('--axis-hub-color', colorHex);
  refs.switchNode.style.setProperty('--axis-hub-rgb', rgb);

  if (refs.beam) {
    refs.beam.style.setProperty('--beam-color', colorHex);
    refs.beam.style.setProperty('--beam-rgb', rgb);
  }

  refs.switchNode.classList.toggle(
    'has-payload',
    axisStreamLabState.fifo.length > 0 || Boolean(axisStreamLabState.routeColorHex)
  );
  refs.switchNode.classList.toggle('is-routing', Boolean(axisStreamLabState.routeColorHex));
}

function pulseAxisStreamLabHub(colorHex, options = {}) {
  const { routing = false, duration = 900, destIndex = null } = options;
  const refs = getAxisStreamLabRefs();
  if (!refs?.switchNode) return;

  if (routing) {
    axisStreamLabState.routeColorHex = colorHex;
    axisStreamLabState.routeDest = destIndex;
  }

  syncAxisStreamLabHubVisuals(colorHex);
  updateAxisStreamLabFifoViz();

  refs.switchNode.classList.remove('is-energized');
  void refs.switchNode.offsetWidth;
  refs.switchNode.classList.add('is-energized');

  const pulseToken = ++axisStreamLabState.hubPulseToken;
  scheduleAxisStreamLabTimeout(() => {
    if (pulseToken === axisStreamLabState.hubPulseToken) {
      refs.switchNode?.classList.remove('is-energized');
    }
  }, Math.max(680, Math.min(duration, 1400)));

  if (routing) {
    const routeToken = ++axisStreamLabState.routeToken;
    scheduleAxisStreamLabTimeout(() => {
      if (routeToken === axisStreamLabState.routeToken) {
        axisStreamLabState.routeColorHex = null;
        axisStreamLabState.routeDest = null;
        updateAxisStreamLabFifoViz();
      }
    }, duration);
  }
}

function updateAxisStreamLabFifoViz() {
  const refs = getAxisStreamLabRefs();
  if (!refs) return;

  refs.fifoSlots.forEach((slot, index) => {
    const packet = axisStreamLabState.fifo[index];
    const colorHex = packet ? getAxisStreamLabThemeHexByColorIndex(packet.colorIndex) : null;

    slot.classList.toggle('is-full', Boolean(packet));
    slot.style.backgroundColor = colorHex || '#dbe3ee';
    slot.style.boxShadow = colorHex ? `0 0 12px ${colorHex}55` : 'none';
    slot.style.opacity = packet ? '1' : '0.55';
  });

  if (refs.hubStatusText) {
    refs.hubStatusText.textContent = `FIFO: ${axisStreamLabState.fifo.length}/${axisStreamLabState.maxFifo}`;
  }

  axisStreamLabState.interconnectTready = axisStreamLabState.fifo.length < axisStreamLabState.maxFifo;

  if (refs.masterTreadyLed && refs.masterTreadyText) {
    refs.masterTreadyLed.style.backgroundColor = axisStreamLabState.interconnectTready ? '#0f172a' : '#dc2626';
    refs.masterTreadyText.textContent = axisStreamLabState.interconnectTready ? 'Interconnect Ready' : 'FIFO FULL (BP)';
  }

  refs.masterNode?.classList.toggle('is-link-ready', axisStreamLabState.interconnectTready);
  refs.masterNode?.classList.toggle('is-link-blocked', !axisStreamLabState.interconnectTready);
  applyAxisStreamLabMasterState(deriveAxisStreamLabMasterState());

  if (refs.bpWarning) {
    refs.bpWarning.classList.toggle('is-visible', !axisStreamLabState.interconnectTready);
  }

  const resolvedHubColor = getAxisStreamLabResolvedHubColor();
  refs.switchLeds.forEach((led, index) => {
    const routedActive = axisStreamLabState.routeDest === index;
    const queuedPacket = axisStreamLabState.fifo.find((packet) => packet.tdest === index);
    const tone = routedActive
      ? (axisStreamLabState.routeColorHex || resolvedHubColor)
      : queuedPacket
        ? getAxisStreamLabThemeHexByColorIndex(queuedPacket.colorIndex)
        : '#334155';
    const isActive = routedActive || Boolean(queuedPacket);

    led.classList.toggle('is-active', isActive);
    led.classList.toggle('is-route-active', routedActive);
    led.style.backgroundColor = isActive ? tone : '#334155';
    led.style.boxShadow = isActive ? `0 0 14px ${tone}66` : 'none';
    led.style.opacity = isActive ? '1' : '0.72';
  });

  syncAxisStreamLabHubVisuals(resolvedHubColor);
}

function updateAxisStreamLabPauseButton() {
  const refs = getAxisStreamLabRefs();
  if (!refs?.pauseButton || !refs.pauseText || !refs.root) return;

  const pauseLabel = axisStreamLabState.isPaused ? 'Resume Engine' : 'Pause Engine';
  refs.pauseText.textContent = pauseLabel;
  refs.pauseButton.setAttribute('aria-label', pauseLabel);
  refs.pauseButton.setAttribute('title', pauseLabel);
  refs.pauseButton.classList.toggle('is-paused', axisStreamLabState.isPaused);
  refs.root.classList.toggle('is-paused', axisStreamLabState.isPaused);
}

function deriveAxisStreamLabMasterState({ handshake = false } = {}) {
  if (handshake) return 'driving';
  if (!axisStreamLabState.signals.tvalid) return 'idle';
  return axisStreamLabState.interconnectTready ? 'armed' : 'stalled';
}

function getAxisStreamLabMasterThemeHex(masterState = 'idle') {
  if (masterState === 'stalled') {
    return axisStreamLabToneMap.amber;
  }

  return getAxisStreamLabThemeHexByColorIndex(axisStreamLabState.colorIndex);
}

function applyAxisStreamLabMasterState(masterState = 'idle') {
  const refs = getAxisStreamLabRefs();
  if (!refs?.masterNode) return;

  const themeHex = getAxisStreamLabMasterThemeHex(masterState);
  refs.masterNode.style.setProperty('--axis-master-color', themeHex);
  refs.masterNode.style.setProperty('--axis-master-rgb', hexToAxisStreamLabRgb(themeHex));
  refs.masterNode.classList.remove('is-idle', 'is-armed', 'is-driving', 'is-stalled');
  refs.masterNode.classList.add(`is-${masterState}`);

  if (refs.txStatusLabel) {
    refs.txStatusLabel.textContent = ({
      idle: 'IDLE',
      armed: 'ARMED',
      driving: 'DRIVING',
      stalled: 'STALLED',
    })[masterState] || 'IDLE';
  }
}

function refreshAxisStreamLabUI() {
  const refs = getAxisStreamLabRefs();
  if (!refs) return;

  if (refs.clkCycle) {
    refs.clkCycle.textContent = `${axisStreamLabState.clkCycle.toFixed(1)}ns`;
  }

  applyAxisStreamLabMasterState(deriveAxisStreamLabMasterState());
  refs.masterNode?.classList.remove('is-bursting');
  refs.txPulse?.classList.remove('is-firing');
  updateAxisStreamLabSignalButtons();
  updateAxisStreamLabBitButtons();
  updateAxisStreamLabFifoViz();
  updateAxisStreamLabPauseButton();
  setAxisStreamLabStatus('Back-pressure Monitor Active', 'slate');
}

function resetAxisStreamLab(options = {}) {
  const keepPause = options.keepPause === true;
  const refs = getAxisStreamLabRefs();
  if (!refs) return;

  clearAxisStreamLabTimeouts();
  refs.packetLane.innerHTML = '';
  refs.beam.style.opacity = '0';
  refs.beam.classList.remove('is-active');
  refs.switchNode?.classList.remove('is-energized', 'is-routing');
  refs.slaveNodes.forEach((node) => node?.classList.remove('is-active'));

  axisStreamLabState.signals = createAxisStreamLabDefaultSignals();
  axisStreamLabState.interconnectTready = true;
  axisStreamLabState.fifo = [];
  axisStreamLabState.colorIndex = 0;
  axisStreamLabState.clkCycle = 0;
  axisStreamLabState.lastClockTick = 0;
  axisStreamLabState.hubPulseToken = 0;
  axisStreamLabState.routeToken = 0;
  axisStreamLabState.routeColorHex = null;
  axisStreamLabState.routeDest = null;
  if (!keepPause) {
    axisStreamLabState.isPaused = false;
  }

  refreshAxisStreamLabUI();
  window.setTimeout(syncPageHeight, 40);
}

function createAxisStreamLabPacketMarkup(packetData, mode = 'master') {
  const theme = axisStreamLabPacketPalette[packetData.colorIndex] || axisStreamLabPacketPalette[0];
  const shapeClass = `shape-${packetData.tid}`;

  if (mode === 'master') {
    return `
      <div class="axis-packet__body ${shapeClass}" style="--axis-packet-color:${theme.hex};">
        ${packetData.tuser ? '<div class="axis-packet__user-tag">U:0x0A</div>' : ''}
        <div class="axis-packet__headline mono">0x${packetData.data}</div>
        <div class="axis-packet__sub mono">TDEST:${packetData.tdest} / TID:${packetData.tid}</div>
      </div>
    `;
  }

  const bytesMarkup = [3, 2, 1, 0].map((index) => {
    const keep = packetData.tkeep[index];
    const strobe = packetData.tstrb[index];
    const byteData = packetData.data.substring((3 - index) * 2, (3 - index) * 2 + 2);
    const classes = [
      'axis-byte',
      keep ? '' : 'is-keep-off',
      keep && !strobe ? 'is-strobe-off' : '',
    ].filter(Boolean).join(' ');
    return `<div class="${classes}">${byteData}</div>`;
  }).join('');

  return `
    <div class="axis-packet__body ${shapeClass}" style="--axis-packet-color:${theme.hex};">
      ${packetData.tuser ? '<div class="axis-packet__user-tag">U:0x0A</div>' : ''}
      <div class="axis-packet__route-tag">ID:${packetData.tid} D:${packetData.tdest}</div>
      <div class="axis-packet__bytes">${bytesMarkup}</div>
      <div class="axis-packet__headline mono">0x${packetData.data}</div>
      ${packetData.tlast ? '<div class="axis-packet__last-tag">TLAST</div>' : ''}
    </div>
  `;
}

function flashAxisStreamLabSlave(targetId) {
  const refs = getAxisStreamLabRefs();
  const slave = refs?.slaveNodes?.[targetId];
  if (!slave) return;
  slave.classList.add('is-active');
  scheduleAxisStreamLabTimeout(() => {
    slave.classList.remove('is-active');
  }, 620);
}

function fireAxisStreamLabTxPulse() {
  const refs = getAxisStreamLabRefs();
  if (!refs?.txPulse) return;
  refs.masterNode?.classList.remove('is-bursting');
  void refs.masterNode?.offsetWidth;
  refs.masterNode?.classList.add('is-bursting');
  refs.txPulse.classList.add('is-firing');
  scheduleAxisStreamLabTimeout(() => {
    refs.txPulse?.classList.remove('is-firing');
    refs.masterNode?.classList.remove('is-bursting');
  }, 320);
}

function driveAxisStreamLabMasterPacket() {
  const refs = getAxisStreamLabRefs();
  if (!refs?.packetLane || !refs.packetLane.clientWidth) return;

  const dataVal = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
  const packetData = {
    data: dataVal,
    tid: axisStreamLabState.signals.tid,
    tdest: axisStreamLabState.signals.tdest,
    tuser: axisStreamLabState.signals.tuser,
    tlast: axisStreamLabState.signals.tlast,
    tkeep: [...axisStreamLabState.signals.tkeep],
    tstrb: [...axisStreamLabState.signals.tstrb],
    colorIndex: axisStreamLabState.colorIndex,
  };

  const laneRect = refs.packetLane.getBoundingClientRect();
  const masterRect = refs.masterNode?.getBoundingClientRect();
  const startX = masterRect
    ? Math.max(88, masterRect.right - laneRect.left - 20)
    : 104;
  const switchX = refs.packetLane.clientWidth * 0.75 - 76;
  const packet = document.createElement('div');
  packet.className = 'axis-packet';
  packet.style.left = `${startX}px`;
  packet.style.marginTop = '-30px';
  packet.innerHTML = createAxisStreamLabPacketMarkup(packetData, 'master');
  refs.packetLane.appendChild(packet);

  window.requestAnimationFrame(() => {
    packet.style.transform = `translate3d(${switchX - startX}px, 0, 0)`;
  });

  scheduleAxisStreamLabTimeout(() => {
    packet.remove();
    axisStreamLabState.fifo.push(packetData);
    updateAxisStreamLabFifoViz();
    pulseAxisStreamLabHub(getAxisStreamLabThemeHexByColorIndex(packetData.colorIndex), { duration: 820 });
  }, 1000);

  if (axisStreamLabState.signals.tlast) {
    axisStreamLabState.colorIndex = (axisStreamLabState.colorIndex + 1) % axisStreamLabPacketPalette.length;
  }
}

function popAxisStreamLabInterconnectPacket() {
  const refs = getAxisStreamLabRefs();
  if (!refs?.packetLane || axisStreamLabState.fifo.length === 0) return;
  if (!refs.packetLane.clientWidth || !refs.packetLane.clientHeight) return;

  const packetData = axisStreamLabState.fifo.shift();
  const slave = refs.slaveNodes[packetData.tdest];
  if (!slave) {
    updateAxisStreamLabFifoViz();
    return;
  }

  updateAxisStreamLabFifoViz();

  const startX = refs.packetLane.clientWidth * 0.75 - 76;
  const packet = document.createElement('div');
  packet.className = 'axis-packet';
  packet.style.left = `${startX}px`;
  packet.style.marginTop = '-34px';
  packet.innerHTML = createAxisStreamLabPacketMarkup(packetData, 'detail');
  refs.packetLane.appendChild(packet);

  const canvasRect = refs.simArea.getBoundingClientRect();
  const hubRect = refs.switchNode.getBoundingClientRect();
  const slaveRect = slave.getBoundingClientRect();
  const x1 = hubRect.left + hubRect.width / 2 - canvasRect.left;
  const y1 = hubRect.top + hubRect.height / 2 - canvasRect.top;
  const x2 = slaveRect.left + slaveRect.width / 2 - canvasRect.left;
  const y2 = slaveRect.top + slaveRect.height / 2 - canvasRect.top;
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const theme = axisStreamLabPacketPalette[packetData.colorIndex] || axisStreamLabPacketPalette[0];
  const beamRgb = hexToAxisStreamLabRgb(theme.hex);

  refs.beam.style.setProperty('--beam-color', theme.hex);
  refs.beam.style.setProperty('--beam-rgb', beamRgb);
  refs.beam.style.width = `${distance}px`;
  refs.beam.style.left = `${x1}px`;
  refs.beam.style.top = `${y1}px`;
  refs.beam.style.transform = `rotate(${angle}deg)`;
  refs.beam.style.opacity = '0.6';
  refs.beam.classList.add('is-active');
  pulseAxisStreamLabHub(theme.hex, {
    routing: true,
    duration: 1260,
    destIndex: packetData.tdest,
  });

  window.requestAnimationFrame(() => {
    const laneRect = refs.packetLane.getBoundingClientRect();
    const packetRect = packet.getBoundingClientRect();
    const targetCenterX = slaveRect.left + slaveRect.width / 2 - laneRect.left;
    const targetCenterY = slaveRect.top + slaveRect.height / 2 - laneRect.top;
    const startCenterX = packetRect.left + packetRect.width / 2 - laneRect.left;
    const startCenterY = packetRect.top + packetRect.height / 2 - laneRect.top;
    const deltaX = targetCenterX - startCenterX;
    const deltaY = targetCenterY - startCenterY;
    packet.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
  });

  scheduleAxisStreamLabTimeout(() => {
    packet.style.opacity = '0';
    refs.beam.style.opacity = '0';
    refs.beam.classList.remove('is-active');
    flashAxisStreamLabSlave(packetData.tdest);
    scheduleAxisStreamLabTimeout(() => {
      packet.remove();
    }, 360);
  }, 1200);
}

function toggleAxisStreamLabPause() {
  axisStreamLabState.isPaused = !axisStreamLabState.isPaused;
  if (!axisStreamLabState.isPaused && active && !axisStreamLabState.rafId) axisStreamLabState.rafId = window.requestAnimationFrame(runAxisStreamLabLoop);
  updateAxisStreamLabPauseButton();
}

function handleAxisStreamLabResize() {
  const refs = getAxisStreamLabRefs();
  if (!refs?.beam) return;
  refs.beam.style.opacity = '0';
  refs.beam.classList.remove('is-active');
  window.setTimeout(syncPageHeight, 20);
}

function bindAxisStreamLabEvents() {
  const refs = getAxisStreamLabRefs();
  if (!refs || refs.root.dataset.axisLabBound === 'true') return;

  refs.signalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const sig = button.dataset.axisSig;
      axisStreamLabState.signals[sig] = !axisStreamLabState.signals[sig];
      updateAxisStreamLabSignalButtons();
      applyAxisStreamLabMasterState(deriveAxisStreamLabMasterState());
    });
  });

  refs.maskButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const maskType = button.dataset.axisMask;
      const bitIndex = Number(button.dataset.axisIndex);
      axisStreamLabState.signals[maskType][bitIndex] = !axisStreamLabState.signals[maskType][bitIndex];
      updateAxisStreamLabBitButtons();
    });
  });

  refs.idButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const idType = button.dataset.axisId;
      const value = Number(button.dataset.axisValue);
      axisStreamLabState.signals[idType] = value;
      updateAxisStreamLabBitButtons();
    });
  });

  refs.resetButton?.addEventListener('click', () => {
    resetAxisStreamLab();
  });

  refs.pauseButton?.addEventListener('click', () => {
    toggleAxisStreamLabPause();
  });

  refs.root.dataset.axisLabBound = 'true';
  window.addEventListener('resize', handleAxisStreamLabResize, { passive: true });
}

function initializeAxiStreamChannelLab(forceRefresh = false) {
  const refs = getAxisStreamLabRefs();
  if (!refs) return;

  bindAxisStreamLabEvents();

  if (!axisStreamLabState.initialized) {
    axisStreamLabState.initialized = true;
    resetAxisStreamLab();
  } else if (forceRefresh) {
    refreshAxisStreamLabUI();
  }
}

function runAxisStreamLabLoop(timestamp) {
  axisStreamLabState.rafId = 0;
  if (!active || axisStreamLabState.isPaused) return;
  const refs = getAxisStreamLabRefs();
  if (!refs) {
    return;
  }

  if (!axisStreamLabState.lastClockTick) {
    axisStreamLabState.lastClockTick = timestamp;
  }

  const elapsed = timestamp - axisStreamLabState.lastClockTick;

  if (!axisStreamLabState.isPaused && elapsed > axisStreamLabState.simSpeed) {
    axisStreamLabState.lastClockTick = timestamp;
    axisStreamLabState.clkCycle += 1.0;

    if (refs.clkCycle) {
      refs.clkCycle.textContent = `${axisStreamLabState.clkCycle.toFixed(1)}ns`;
    }

    if (axisStreamLabState.signals.tready && axisStreamLabState.fifo.length > 0) {
      popAxisStreamLabInterconnectPacket();
    }

    const masterHandshake = axisStreamLabState.signals.tvalid && axisStreamLabState.interconnectTready;

    if (masterHandshake) {
      driveAxisStreamLabMasterPacket();
      applyAxisStreamLabMasterState('driving');
      fireAxisStreamLabTxPulse();
    } else {
      applyAxisStreamLabMasterState(deriveAxisStreamLabMasterState());
    }

    if (masterHandshake) {
      setAxisStreamLabStatus('Transfer Active', 'green');
    } else if (!axisStreamLabState.interconnectTready) {
      setAxisStreamLabStatus('Back-pressure Stalled', 'red');
    } else if (!axisStreamLabState.signals.tready && axisStreamLabState.fifo.length > 0) {
      setAxisStreamLabStatus('Sink Waiting', 'amber');
    } else {
      setAxisStreamLabStatus('Ready', 'blue');
    }
  } else if (axisStreamLabState.isPaused) {
    axisStreamLabState.lastClockTick = timestamp;
  }

  axisStreamLabState.rafId = window.requestAnimationFrame(runAxisStreamLabLoop);
}

export function start() {
  active = true;
  initializeAxiStreamChannelLab(true);
  axisStreamLabState.lastClockTick = 0;
  if (!axisStreamLabState.isPaused && !axisStreamLabState.rafId) {
    axisStreamLabState.rafId = window.requestAnimationFrame(runAxisStreamLabLoop);
  }
}
export function stop() {
  active = false;
  window.cancelAnimationFrame(axisStreamLabState.rafId);
  axisStreamLabState.rafId = 0;
  clearAxisStreamLabTimeouts();
  const refs = getAxisStreamLabRefs();
  if (refs) {
    refs.packetLane.replaceChildren();
    refs.beam.style.opacity = '0';
    refs.switchNode?.classList.remove('is-energized', 'is-routing');
    refs.slaveNodes.forEach(node => node?.classList.remove('is-active'));
  }
  axisStreamLabState.hubPulseToken++;
  axisStreamLabState.routeToken++;
  axisStreamLabState.routeDest = null;
}
