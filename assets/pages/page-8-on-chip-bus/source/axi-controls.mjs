import { syncPageHeight } from './shared.mjs';
import { createTaskScope } from '../../../features/shared/source/task-scope.mjs';
const tasks = createTaskScope(window);
let axiFullControlMathRendered = false;
let cacheToggle = false;

export function renderAxiFullControlMath(force = false) {
  const root = document.querySelector('.axi-full-control-showcase');
  if (!root || typeof renderMathInElement !== 'function') return;
  if (axiFullControlMathRendered && !force) return;

  renderMathInElement(root, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
  });

  axiFullControlMathRendered = true;
  tasks.timeout(syncPageHeight, 40);
}

function showAxiFullControlMsg(id, text, duration = 2000, icon = '<i data-lucide="info" class="w-5 h-5 mb-1 opacity-70"></i>') {
  const msg = document.getElementById(id);
  if (!msg) return;

  msg.innerHTML = `${icon}<br>${text}`;
  lucide.createIcons({ root: msg });
  msg.style.opacity = 1;
  msg.style.transform = 'translate(-50%, -50%) scale(1.1)';

  tasks.timeout(() => {
    msg.style.opacity = 0;
    msg.style.transform = 'translate(-50%, -50%) scale(0.95)';
  }, duration);
}

const sleep = tasks.delay;
let lockAnimationRunning = false;

export async function runLock() {
  if (lockAnimationRunning) return;

  const plane = document.getElementById('plane-lock');
  const mon = document.getElementById('exclusive-monitor');
  const mTable = document.getElementById('mon-table');
  const mValid = document.getElementById('mon-valid');
  const mAddr = document.getElementById('mon-addr');
  const mId = document.getElementById('mon-id');
  const monitorState = document.getElementById('lock-monitor-state');
  const monitorDetail = document.getElementById('lock-monitor-detail');
  const runBtn = document.getElementById('lock-run-btn');
  const m0 = document.getElementById('lock-m0');
  const m1 = document.getElementById('lock-m1');

  if (!plane || !mon || !mTable || !mValid || !mAddr || !mId || !monitorState || !monitorDetail || !runBtn || !m0 || !m1) return;

  lockAnimationRunning = true;
  runBtn.disabled = true;
  runBtn.classList.add('opacity-60', 'cursor-not-allowed');

  const lockPacketThemes = {
    amber: {
      border: '#f59e0b',
      background: '#fffbeb',
      text: '#92400e',
      chipBg: 'rgba(245, 158, 11, 0.16)',
      chipColor: '#b45309',
    },
    slate: {
      border: '#64748b',
      background: '#f8fafc',
      text: '#334155',
      chipBg: 'rgba(100, 116, 139, 0.14)',
      chipColor: '#475569',
    },
    rose: {
      border: '#e11d48',
      background: '#fff1f2',
      text: '#be123c',
      chipBg: 'rgba(225, 29, 72, 0.12)',
      chipColor: '#be123c',
    },
  };

  function setChip(node, label, state) {
    node.textContent = label;
    node.className = 'axlock-monitor-chip';
    node.classList.add(`is-${state}`);
  }

  function clearMasterState() {
    [m0, m1].forEach((node) => node.classList.remove('axlock-master-active', 'axlock-master-interloper'));
  }

  function setActiveMaster(which) {
    clearMasterState();
    if (which === 'm0') m0.classList.add('axlock-master-active');
    if (which === 'm1') m1.classList.add('axlock-master-interloper');
  }

  function resetLockScene() {
    plane.innerHTML = '';
    clearMasterState();
    mon.classList.remove('error-shake', 'monitor-locked', 'monitor-invalidated');
    mValid.innerText = '0';
    mValid.className = 'p-1 border-r border-slate-200 transition-colors text-slate-400';
    mAddr.innerText = '-';
    mAddr.className = 'p-1 border-r border-slate-200 transition-colors text-slate-400';
    mId.innerText = '-';
    mId.className = 'p-1 transition-colors text-slate-400';
    mTable.className = 'text-[10px] mono font-bold text-slate-400 border border-slate-200 bg-white transition-colors duration-300';
    setChip(monitorState, 'Idle', 'idle');
    monitorDetail.textContent = '대기 중: exclusive read가 들어오면 여기에 읽기 예약이 생깁니다.';
  }

  function createPkt(horizontalClass, top, themeKey, channel, title, subtitle) {
    const theme = lockPacketThemes[themeKey];
    const p = document.createElement('div');
    p.className = 'packet axlock-packet absolute z-20';
    p.innerHTML = `<span class="axlock-packet__channel">${channel}</span><span class="axlock-packet__title">${title}</span><span class="axlock-packet__subtitle">${subtitle}</span>`;
    p.style.top = top;
    p.style.borderColor = theme.border;
    p.style.background = theme.background;
    p.style.color = theme.text;
    p.style.setProperty('--axlock-packet-chip-bg', theme.chipBg);
    p.style.setProperty('--axlock-packet-chip-color', theme.chipColor);
    if (horizontalClass.startsWith('left-[')) {
      p.style.left = horizontalClass.slice(6, -1);
    } else if (horizontalClass.startsWith('right-[')) {
      p.style.right = horizontalClass.slice(7, -1);
    }
    return p;
  }

  try {
    resetLockScene();

    setActiveMaster('m0');

    const ar = createPkt('left-[60px]', '100px', 'amber', 'AR', 'ARLOCK=1', 'Exclusive Read @ 0x100');
    plane.appendChild(ar);

    await sleep(100);
    ar.style.top = '220px';
    ar.style.left = '50%';
    ar.style.transform = 'translateX(-50%)';

    await sleep(650);
    ar.style.opacity = 0;

    mon.classList.add('monitor-locked');
    mValid.innerText = '1';
    mValid.className = 'p-1 border-r border-slate-200 transition-colors text-emerald-600';
    mAddr.innerText = '0x100';
    mAddr.className = 'p-1 border-r border-slate-200 transition-colors text-amber-700';
    mId.innerText = 'M0';
    mId.className = 'p-1 transition-colors text-amber-700';
    mTable.className = 'text-[10px] mono font-bold text-slate-400 border border-amber-400 bg-amber-50 transition-colors duration-300';
    setChip(monitorState, 'Reservation Active', 'active');
    monitorDetail.textContent = 'M0의 exclusive read가 0x100에 대한 읽기 예약을 만들었습니다.';

    showAxiFullControlMsg('lock-msg', 'M0 Exclusive Read Accepted<br>Read Reservation Created', 1600, '<i data-lucide="lock" class="w-5 h-5 mb-1 text-amber-300"></i>');
    await sleep(1600);

    setActiveMaster('m1');

    const nW = createPkt('right-[60px]', '100px', 'slate', 'AW', 'AWLOCK=0', 'Normal Write @ 0x100');
    plane.appendChild(nW);

    await sleep(100);
    nW.style.top = '220px';
    nW.style.left = '50%';
    nW.style.right = 'auto';
    nW.style.transform = 'translateX(-50%)';

    await sleep(650);
    nW.style.opacity = 0;

    mon.classList.remove('monitor-locked');
    mon.classList.add('monitor-invalidated', 'error-shake');
    mValid.innerText = '0';
    mValid.className = 'p-1 border-r border-slate-200 transition-colors text-rose-600';
    mAddr.className = 'p-1 border-r border-slate-200 transition-colors text-slate-500';
    mId.className = 'p-1 transition-colors text-slate-500';
    mTable.className = 'text-[10px] mono font-bold text-slate-400 border border-rose-400 bg-rose-50 transition-colors duration-300';
    setChip(monitorState, 'Reservation Invalidated', 'invalid');
    monitorDetail.textContent = '다른 master의 normal write가 같은 주소를 갱신해 읽기 예약이 삭제되었습니다.';

    showAxiFullControlMsg('lock-msg', 'M1 Normal Write Committed<br>Read Reservation Cleared', 2100, '<i data-lucide="shield-alert" class="w-5 h-5 mb-1 text-rose-300"></i>');
    await sleep(2100);

    setActiveMaster('m0');

    const aw = createPkt('left-[60px]', '100px', 'amber', 'AW', 'AWLOCK=1', 'Exclusive Write @ 0x100');
    plane.appendChild(aw);

    await sleep(100);
    aw.style.top = '220px';
    aw.style.left = '50%';
    aw.style.transform = 'translateX(-50%)';

    await sleep(650);
    aw.style.opacity = 0;

    const resp = createPkt('left-[50%]', '220px', 'rose', 'B', 'BRESP=OKAY', 'Exclusive Fail / No Update');
    plane.appendChild(resp);
    resp.style.left = '50%';
    resp.style.transform = 'translateX(-50%)';

    await sleep(100);
    resp.style.top = '100px';
    resp.style.left = '60px';
    resp.style.transform = 'none';

    setChip(monitorState, 'Retry Required', 'invalid');
    monitorDetail.textContent = '읽기에서 만든 예약이 이미 사라져서 M0는 read부터 다시 시작해야 하며, 이번 write는 메모리를 갱신하지 못합니다.';

    showAxiFullControlMsg('lock-msg', 'BRESP=OKAY<br>Read Reservation Missing, Retry from Read', 2600, '<i data-lucide="x-circle" class="w-5 h-5 mb-1 text-rose-300"></i>');

    await sleep(2600);
    resp.style.opacity = 0;
  } finally {
    runBtn.disabled = false;
    runBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    lockAnimationRunning = false;
  }
}

export async function runProt() {
  const plane = document.getElementById('plane-prot');
  const tzcBlock = document.getElementById('tzc-block');
  const rowSec = document.getElementById('tz-row-sec');
  const rowNsec = document.getElementById('tz-row-nsec');
  const evalBox = document.getElementById('tz-eval-box');

  if (!plane || !tzcBlock || !rowSec || !rowNsec || !evalBox) return;

  plane.innerHTML = '';
  tzcBlock.classList.remove('firewall-active', 'error-shake');
  rowSec.classList.remove('tz-row-active');
  rowNsec.classList.remove('tz-row-active');
  evalBox.innerText = 'Waiting for Req...';
  evalBox.className = 'font-bold text-slate-700';

  function createProtPkt(horizontalClass, top, color, protBits, addrHex, isSecure) {
    const p = document.createElement('div');
    p.className = `packet absolute w-24 h-8 border-2 border-${color}-500 bg-${color}-50 text-${color}-800 flex flex-col items-center justify-center text-[8px] font-black rounded shadow-md z-20`;
    p.innerHTML = `<span class="tracking-tight">PROT:${protBits} (${isSecure ? 'S' : 'NS'})</span><span class="font-normal tracking-tight font-mono">ADDR:${addrHex}</span>`;
    p.style.top = top;
    if (horizontalClass.startsWith('left-[')) {
      p.style.left = horizontalClass.slice(6, -1);
    } else if (horizontalClass.startsWith('right-[')) {
      p.style.right = horizontalClass.slice(7, -1);
    }
    return p;
  }

  const req1 = createProtPkt('right-[60px]', '100px', 'slate', '010', '0x120', false);
  plane.appendChild(req1);

  await sleep(100);
  req1.style.top = '180px';
  req1.style.left = '50%';
  req1.style.right = 'auto';
  req1.style.transform = 'translateX(-50%)';

  await sleep(600);
  rowNsec.classList.add('tz-row-active');
  evalBox.innerHTML = '<span class="text-emerald-600">ADDR(0x120) in NS Region<br>-> Access Granted</span>';
  evalBox.className = 'font-bold text-emerald-700';
  showAxiFullControlMsg('prot-msg', 'Scenario 1: Normal Access OK', 1200, '<i data-lucide="check-circle" class="w-5 h-5 mb-1 text-emerald-300"></i>');

  await sleep(1000);
  req1.style.top = '300px';
  req1.style.left = 'calc(100% - 80px)';
  req1.style.transform = 'none';

  await sleep(600);
  req1.style.opacity = 0;
  rowNsec.classList.remove('tz-row-active');
  evalBox.innerText = 'Waiting for Req...';
  evalBox.className = 'font-bold text-slate-700';

  await sleep(500);

  const req2 = createProtPkt('left-[60px]', '100px', 'emerald', '000', '0x050', true);
  plane.appendChild(req2);

  await sleep(100);
  req2.style.top = '180px';
  req2.style.left = '50%';
  req2.style.transform = 'translateX(-50%)';

  await sleep(600);
  rowSec.classList.add('tz-row-active');
  evalBox.innerHTML = '<span class="text-emerald-600">ADDR(0x050) in Secure Region<br>PROT[1]==0 -> Access Granted</span>';
  evalBox.className = 'font-bold text-emerald-700';
  showAxiFullControlMsg('prot-msg', 'Scenario 2: Secure Access OK', 1200, '<i data-lucide="shield-check" class="w-5 h-5 mb-1 text-emerald-300"></i>');

  await sleep(1000);
  req2.style.top = '300px';
  req2.style.left = '80px';
  req2.style.transform = 'translateX(-50%)';

  await sleep(600);
  req2.style.opacity = 0;
  rowSec.classList.remove('tz-row-active');
  evalBox.innerText = 'Waiting for Req...';
  evalBox.className = 'font-bold text-slate-700';

  await sleep(500);

  const req3 = createProtPkt('right-[60px]', '100px', 'rose', '010', '0x050', false);
  plane.appendChild(req3);

  await sleep(100);
  req3.style.top = '180px';
  req3.style.left = '50%';
  req3.style.right = 'auto';
  req3.style.transform = 'translateX(-50%)';

  await sleep(600);
  rowSec.classList.add('tz-row-active');
  evalBox.innerHTML = '<span class="text-rose-600">ADDR(0x050) in Secure Region!<br>But PROT[1]==1 -> BLOCKED</span>';
  evalBox.className = 'font-bold text-rose-700';

  tzcBlock.classList.add('firewall-active', 'error-shake');
  req3.classList.add('error-shake');

  showAxiFullControlMsg('prot-msg', 'Scenario 3: Security Violation!<br>TZC Returns DECERR', 2000, '<i data-lucide="shield-alert" class="w-5 h-5 mb-1 text-rose-300"></i>');

  await sleep(1000);
  req3.innerHTML = '<span class="tracking-tight text-rose-600">DECERR</span><span class="font-normal tracking-tight font-mono text-rose-600">Blocked by TZC</span>';
  req3.classList.remove('error-shake');
  req3.style.top = '100px';
  req3.style.left = 'calc(100% - 120px)';
  req3.style.transform = 'none';

  await sleep(600);
  req3.style.opacity = 0;
  tzcBlock.classList.remove('firewall-active', 'error-shake');
  rowSec.classList.remove('tz-row-active');
  evalBox.innerText = 'Waiting for Req...';
  evalBox.className = 'font-bold text-slate-700';
}

export async function runCache() {
  const plane = document.getElementById('plane-cache');
  const cacheBlock = document.getElementById('cache-block');
  const cacheFill = document.getElementById('cache-dirty-fill');
  const cacheText = document.getElementById('cache-inner-text');
  const masterStatus = document.getElementById('master-cache-status');
  const ddrBlock = document.getElementById('ddr-block');
  const ddrStatus = document.getElementById('ddr-status');

  if (!plane || !cacheBlock || !cacheFill || !cacheText || !masterStatus || !ddrBlock || !ddrStatus) return;

  plane.innerHTML = '';
  cacheBlock.classList.remove('cache-dirty');
  cacheFill.style.width = '0%';
  cacheText.innerText = 'Line Empty';
  cacheText.classList.remove('text-blue-700');
  cacheText.classList.add('text-slate-400');
  masterStatus.innerText = 'WAITING';
  masterStatus.className = 'mt-0.5 text-[8px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-400';
  ddrBlock.classList.remove('ddr-writing');
  ddrStatus.innerText = 'IDLE';

  cacheToggle = !cacheToggle;
  const isCacheable = cacheToggle;

  function createPkt(text, color, top, left) {
    const p = document.createElement('div');
    p.className = `packet absolute w-24 h-6 border-2 flex items-center justify-center text-[8px] font-black rounded shadow-md z-30 ${color}`;
    p.innerText = text;
    p.style.top = top;
    p.style.left = left;
    plane.appendChild(p);
    return p;
  }

  const req = createPkt(
    isCacheable ? 'WRITE (BUFFERABLE)' : 'WRITE (DEVICE)',
    isCacheable ? 'border-blue-500 bg-blue-100 text-blue-800' : 'border-slate-500 bg-slate-100 text-slate-800',
    '70px',
    '50%'
  );
  req.style.transform = 'translateX(-50%)';

  await sleep(100);
  masterStatus.innerText = 'STALLED (WAITING RESP)';
  masterStatus.classList.replace('bg-slate-100', 'bg-rose-100');
  masterStatus.classList.replace('text-slate-400', 'text-rose-600');

  if (isCacheable) {
    req.style.top = '180px';
    req.style.left = '25%';

    await sleep(600);
    req.style.opacity = 0;

    cacheBlock.classList.add('cache-dirty');
    cacheFill.style.width = '100%';
    cacheText.innerText = 'Dirty Data';
    cacheText.classList.replace('text-slate-400', 'text-blue-700');

    const earlyResp = createPkt('BVALID (Early)', 'border-emerald-500 bg-emerald-100 text-emerald-800', '180px', '25%');
    earlyResp.style.transform = 'translateX(-50%)';

    await sleep(100);
    earlyResp.style.top = '70px';
    earlyResp.style.left = '50%';

    showAxiFullControlMsg('cache-msg', 'Early Response (BVALID)!<br>Master is now free.', 2000, '<i data-lucide="zap" class="w-5 h-5 mb-1 text-emerald-300"></i>');

    await sleep(600);
    earlyResp.style.opacity = 0;

    masterStatus.innerText = 'FREE / NEXT OP';
    masterStatus.classList.replace('bg-rose-100', 'bg-emerald-100');
    masterStatus.classList.replace('text-rose-600', 'text-emerald-700');

    await sleep(1000);

    showAxiFullControlMsg('cache-msg', 'Background Eviction<br>Cache Line Flush to DDR', 2500, '<i data-lucide="download" class="w-5 h-5 mb-1 text-blue-300"></i>');

    const evictReq = createPkt('EVICT TO DDR', 'border-slate-400 bg-slate-100 text-slate-600 border-dashed', '220px', '25%');
    evictReq.style.transform = 'translateX(-50%) scale(0.9)';

    await sleep(100);
    evictReq.style.top = '300px';

    await sleep(600);
    evictReq.style.opacity = 0;

    ddrBlock.classList.add('ddr-writing');
    ddrStatus.innerText = 'WRITING...';

    await sleep(800);
    ddrBlock.classList.remove('ddr-writing');
    ddrStatus.innerText = 'IDLE';

    cacheBlock.classList.remove('cache-dirty');
    cacheFill.style.width = '0%';
    cacheText.innerText = 'Line Empty';
    cacheText.classList.replace('text-blue-700', 'text-slate-400');
  } else {
    req.style.top = '120px';
    req.style.left = '75%';

    await sleep(300);
    req.style.top = '300px';

    await sleep(500);
    req.style.opacity = 0;

    ddrBlock.classList.add('ddr-writing');
    ddrStatus.innerText = 'WRITING...';
    showAxiFullControlMsg('cache-msg', 'Direct Memory Write.<br>Master is blocked.', 2000, '<i data-lucide="clock" class="w-5 h-5 mb-1 text-slate-300"></i>');

    await sleep(1500);

    ddrBlock.classList.remove('ddr-writing');
    ddrStatus.innerText = 'DONE';

    const lateResp = createPkt('BVALID (Late)', 'border-emerald-500 bg-emerald-100 text-emerald-800', '300px', '75%');
    lateResp.style.transform = 'translateX(-50%)';

    await sleep(100);
    lateResp.style.top = '70px';
    lateResp.style.left = '50%';

    await sleep(600);
    lateResp.style.opacity = 0;

    masterStatus.innerText = 'FREE / NEXT OP';
    masterStatus.classList.replace('bg-rose-100', 'bg-emerald-100');
    masterStatus.classList.replace('text-rose-600', 'text-emerald-700');
  }
}

export async function runQos() {
  const plane = document.getElementById('plane-qos');
  const arbiterStatus = document.getElementById('arbiter-status');
  const arbiterBox = document.getElementById('qos-arbiter');
  if (!plane || !arbiterStatus || !arbiterBox) return;

  plane.innerHTML = '';
  arbiterStatus.innerText = 'Waiting...';
  arbiterStatus.className = 'mt-3 px-3 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200';
  arbiterBox.classList.remove('arbiter-active');

  function createQosPacket(id, qos, isHigh, startTop) {
    const color = isHigh ? 'emerald' : 'slate';
    const pkt = document.createElement('div');
    pkt.className = `packet absolute w-[50px] h-9 border-2 border-${color}-500 bg-${color}-50 text-${color}-800 flex flex-col items-center justify-center rounded shadow-sm`;
    pkt.style.left = '120px';
    pkt.style.top = `${startTop}px`;
    pkt.innerHTML = `<span class="text-[9px] font-black leading-tight">QoS:${qos}</span><span class="text-[7px] leading-tight">ID:${id}</span>`;
    plane.appendChild(pkt);
    return pkt;
  }

  const dma1 = createQosPacket('D1', '0', false, 256);
  const dma2 = createQosPacket('D2', '0', false, 256);
  const dma3 = createQosPacket('D3', '0', false, 256);
  const disp = createQosPacket('LCD', 'F', true, 74);

  tasks.timeout(() => {
    dma1.style.left = 'calc(50% - 25px)';
    dma1.style.top = '172px';
  }, 100);

  await sleep(600);
  arbiterStatus.innerText = 'Routing D1 (0x0)';
  dma1.style.left = 'calc(100% - 90px)';

  tasks.timeout(() => {
    dma2.style.left = 'calc(50% - 25px)';
    dma2.style.top = '172px';
  }, 100);
  tasks.timeout(() => {
    disp.style.left = 'calc(50% - 25px)';
    disp.style.top = '172px';
  }, 200);

  await sleep(600);
  dma1.style.opacity = 0;

  arbiterStatus.innerText = 'Contention! F > 0';
  arbiterStatus.classList.replace('bg-slate-100', 'bg-emerald-100');
  arbiterStatus.classList.replace('text-slate-500', 'text-emerald-700');
  arbiterBox.classList.add('arbiter-active');
  showAxiFullControlMsg('qos-msg', 'Priority Hint Applied<br>QoS:F selected before QoS:0', 2000, '<i data-lucide="arrow-up-circle" class="w-5 h-5 mb-1 text-emerald-300"></i>');

  await sleep(800);
  arbiterStatus.innerText = 'Routing LCD (0xF)';
  disp.style.left = 'calc(100% - 90px)';

  tasks.timeout(() => {
    dma3.style.left = 'calc(50% - 25px)';
    dma3.style.top = '172px';
  }, 100);

  await sleep(600);
  disp.style.opacity = 0;

  arbiterStatus.innerText = 'Routing D2 (0x0)';
  arbiterStatus.classList.replace('bg-emerald-100', 'bg-slate-100');
  arbiterStatus.classList.replace('text-emerald-700', 'text-slate-500');
  arbiterBox.classList.remove('arbiter-active');

  dma2.style.left = 'calc(100% - 90px)';

  await sleep(600);
  dma2.style.opacity = 0;
  arbiterStatus.innerText = 'Routing D3 (0x0)';
  dma3.style.left = 'calc(100% - 90px)';

  await sleep(600);
  dma3.style.opacity = 0;
  arbiterStatus.innerText = 'Waiting...';
}

export function start() { tasks.start(); renderAxiFullControlMath(); }
export function stop() {
  tasks.stop();
  lockAnimationRunning = false;
  const button = document.getElementById('lock-run-btn');
  if (button) { button.disabled = false; button.classList.remove('opacity-60', 'cursor-not-allowed'); }
}
