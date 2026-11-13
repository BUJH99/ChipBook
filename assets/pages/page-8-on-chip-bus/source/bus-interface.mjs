import { syncPageHeight } from './shared.mjs';
const busInterfaceLabInsights = {
  mmio: [
    { icon: 'share-2', title: 'Unified Fabric', text: '모든 컴포넌트가 동일한 AXI 인터페이스를 사용합니다.' },
    { icon: 'maximize', title: 'Address Decoding', text: '인터커넥트가 주소에 따라 경로를 자동 분배합니다.' },
    { icon: 'fast-forward', title: 'AXI Pipelining', text: 'I/O 접근 시에도 AXI의 throughput 이점을 그대로 활용합니다.' },
  ],
  pmio: [
    { icon: 'alert-triangle', title: 'Hard-Wired Path', text: 'ISA에 종속된 전용 배선으로 유연성이 크게 떨어집니다.' },
    { icon: 'layers', title: 'Bus Complexity', text: 'I/O 전용 버스와 decode 로직이 늘어나며 하드웨어 리소스를 더 소모합니다.' },
    { icon: 'lock', title: 'Legacy Block', text: '현대 SoC 관점에서는 인터커넥트를 우회하는 구조가 확장성과 재사용성에 불리합니다.' },
  ],
};

const busInterfaceLabModeContent = {
  mmio: {
    status: 'AXI Interconnect가 중앙 허브 역할을 수행합니다. 모든 주소와 데이터는 인터커넥트를 통해 직교 라우팅됩니다.',
    hubSubtitle: 'Active: Decoder Hub',
    softwareDesc: '소프트웨어는 I/O를 단순 메모리 접근으로 인식합니다. 인터커넥트가 물리적 주소를 찾아 신호를 라우팅합니다.',
    codeLines: [
      '<span class="bus-interface-lab__code-keyword">#define</span> UART_BASE <span class="bus-interface-lab__code-number">0x40001000</span>',
      '<span class="bus-interface-lab__code-type">volatile uint32_t</span>* reg = UART_BASE;',
      '*reg = <span class="bus-interface-lab__code-char">\'A\'</span>; <span class="bus-interface-lab__code-comment">// Through AXI Fabric</span>',
    ],
    map: { mem: '75%', gap: '0%', io: '25%', gapLabel: '' },
    lines: `
      <path d="M 180 225 L 600 225" stroke="#CBD5E1" stroke-width="2" fill="none" opacity="0.3"></path>
      <path d="M 400 225 L 400 125 L 600 125" stroke="#CBD5E1" stroke-width="2" fill="none" opacity="0.3"></path>
      <path d="M 400 225 L 400 325 L 600 325" stroke="#CBD5E1" stroke-width="2" fill="none" opacity="0.3"></path>

      <path d="M 180 225 L 400 225" stroke="#3B82F6" stroke-width="4" fill="none" class="bus-interface-lab__address-pulse"></path>
      <path d="M 400 225 L 400 125 L 600 125" stroke="#94A3B8" stroke-width="3" fill="none" class="bus-interface-lab__data-flow" opacity="0.4"></path>
      <path d="M 400 225 L 400 325 L 600 325" stroke="#10B981" stroke-width="3" fill="none" class="bus-interface-lab__data-flow" opacity="0.6"></path>
    `,
    sequence: [
      { path: 'M 180 225 L 400 225 L 400 125 L 600 125', fill: '#3B82F6' },
      { path: 'M 180 225 L 400 225 L 400 325 L 600 325', fill: '#10B981' },
    ],
  },
  pmio: {
    status: 'I/O 전용 버스가 인터커넥트 하드웨어 영역을 우회합니다. 블록 아래에 가려진 bypass 경로를 통해 슬레이브로 직접 연결됩니다.',
    hubSubtitle: 'Hidden Bypass',
    softwareDesc: 'ISA 전용 명령어 OUT이 실행될 때만 전용 버스가 활성화됩니다. 소프트웨어 이식성과 fabric 일관성이 떨어집니다.',
    codeLines: [
      '<span class="bus-interface-lab__code-keyword">mov</span> dx, <span class="bus-interface-lab__code-number">0x3F8</span>',
      '<span class="bus-interface-lab__code-keyword">mov</span> al, <span class="bus-interface-lab__code-char">\'A\'</span>',
      '<span class="bus-interface-lab__code-type">out</span> dx, al <span class="bus-interface-lab__code-comment">; Dedicated I/O Logic</span>',
    ],
    map: { mem: '50%', gap: '40%', io: '10%', gapLabel: 'Reserved' },
    lines: `
      <path d="M 180 210 L 400 210 L 400 125 L 600 125" stroke="#3B82F6" stroke-width="3" fill="none" opacity="0.2"></path>
      <path d="M 180 240 L 400 240 L 400 325 L 600 325" stroke="#10B981" stroke-width="4" fill="none" class="bus-interface-lab__address-pulse"></path>
    `,
    sequence: [
      { path: 'M 180 210 L 400 210 L 400 125 L 600 125', fill: '#94A3B8' },
      { path: 'M 180 240 L 400 240 L 400 325 L 600 325', fill: '#10B981' },
    ],
  },
};

const busInterfaceLabState = {
  initialized: false,
  activeMode: 'mmio',
  timerId: 0,
  packetStep: 0,
  refs: null,
};

function getBusInterfaceLabRefs() {
  if (busInterfaceLabState.refs?.root?.isConnected) {
    return busInterfaceLabState.refs;
  }

  const root = document.getElementById('bus-interface-lab');
  if (!root) return null;

  busInterfaceLabState.refs = {
    root,
    buttons: Array.from(root.querySelectorAll('[data-bus-interface-mode]')),
    dynamicLines: document.getElementById('bus-interface-lab-dynamic-lines'),
    packet: document.getElementById('bus-interface-lab-packet'),
    packetMotion: document.getElementById('bus-interface-lab-packet-motion'),
    statusText: document.getElementById('bus-interface-lab-status-text'),
    hubGroup: document.getElementById('bus-interface-lab-hub-group'),
    hubSubtitle: document.getElementById('bus-interface-lab-hub-subtitle'),
    codeBlock: document.getElementById('bus-interface-lab-code-block'),
    softwareDesc: document.getElementById('bus-interface-lab-software-desc'),
    insightContainer: document.getElementById('bus-interface-lab-insights'),
    addrMem: document.getElementById('bus-interface-lab-addr-mem'),
    addrGap: document.getElementById('bus-interface-lab-addr-gap'),
    addrIo: document.getElementById('bus-interface-lab-addr-io'),
  };

  return busInterfaceLabState.refs;
}

function stopBusInterfaceVisualization() {
  if (busInterfaceLabState.timerId) {
    window.clearInterval(busInterfaceLabState.timerId);
    busInterfaceLabState.timerId = 0;
  }
}

function renderBusInterfaceLabInsights(mode) {
  const refs = getBusInterfaceLabRefs();
  if (!refs?.insightContainer) return;

  refs.insightContainer.innerHTML = (busInterfaceLabInsights[mode] || []).map((item, index) => `
    <div class="bus-interface-lab__insight" style="animation-delay: ${index * 100}ms;">
      <div class="bus-interface-lab__insight-icon"><i data-lucide="${item.icon}"></i></div>
      <div>
        <div class="bus-interface-lab__insight-title">${item.title}</div>
        <div class="bus-interface-lab__insight-text">${item.text}</div>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

function startBusInterfaceLabPacketAnimation(sequence) {
  const refs = getBusInterfaceLabRefs();
  if (!refs?.packet || !refs.packetMotion || !sequence?.length) return;

  stopBusInterfaceVisualization();
  busInterfaceLabState.packetStep = 0;
  refs.packet.style.visibility = 'visible';

  const animatePacket = () => {
    const step = sequence[busInterfaceLabState.packetStep % sequence.length];
    refs.packet.setAttribute('fill', step.fill);
    refs.packet.style.filter = `drop-shadow(0 0 4px ${step.fill})`;
    refs.packetMotion.setAttribute('path', step.path);
    refs.packetMotion.beginElement();
    busInterfaceLabState.packetStep += 1;
  };

  animatePacket();
  busInterfaceLabState.timerId = window.setInterval(animatePacket, 2000);
}

function renderBusInterfaceLabMode(mode = 'mmio') {
  const refs = getBusInterfaceLabRefs();
  const content = busInterfaceLabModeContent[mode];
  if (!refs || !content) return;

  busInterfaceLabState.activeMode = mode;

  refs.buttons.forEach((button) => {
    const isActive = button.dataset.busInterfaceMode === mode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  refs.statusText.textContent = content.status;
  refs.hubSubtitle.textContent = content.hubSubtitle;
  refs.hubGroup.classList.toggle('is-inactive', mode === 'pmio');

  refs.addrMem.style.width = content.map.mem;
  refs.addrGap.style.width = content.map.gap;
  refs.addrGap.textContent = content.map.gapLabel;
  refs.addrIo.style.width = content.map.io;

  refs.codeBlock.innerHTML = content.codeLines.map((line) => `<div>${line}</div>`).join('');
  refs.softwareDesc.textContent = content.softwareDesc;
  refs.dynamicLines.innerHTML = content.lines;

  renderBusInterfaceLabInsights(mode);
  startBusInterfaceLabPacketAnimation(content.sequence);
  window.setTimeout(syncPageHeight, 20);
}

function bindBusInterfaceLabEvents() {
  const refs = getBusInterfaceLabRefs();
  if (!refs || refs.root.dataset.busInterfaceBound === 'true') return;

  refs.buttons.forEach((button) => {
    button.addEventListener('click', () => {
      renderBusInterfaceLabMode(button.dataset.busInterfaceMode || 'mmio');
    });
  });

  refs.root.dataset.busInterfaceBound = 'true';
}

function initializeBusInterfaceVisualization(forceRefresh = false) {
  const refs = getBusInterfaceLabRefs();
  if (!refs) return;

  bindBusInterfaceLabEvents();

  if (!busInterfaceLabState.initialized || forceRefresh) {
    busInterfaceLabState.initialized = true;
    renderBusInterfaceLabMode(busInterfaceLabState.activeMode);
  }
}

export function start() { initializeBusInterfaceVisualization(true); }
export { stopBusInterfaceVisualization as stop };
