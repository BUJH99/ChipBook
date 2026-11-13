import { syncPageHeight } from './shared.mjs';
import { createTaskScope } from '../../../features/shared/source/task-scope.mjs';
const tasks = createTaskScope(window);
let oooRunToken = 0;

export async function runOoO() {
  const runToken = ++oooRunToken;
  const plane = document.getElementById('plane-ooo');
  const qFast = document.getElementById('q-ooo-fast');
  const qSlow = document.getElementById('q-ooo-slow');
  const msg = document.getElementById('ooo-msg');
  const slowProg = document.getElementById('slow-progress');
  const status = document.getElementById('ooo-master-status');
  const runBtn = document.getElementById('ooo-run-btn');
  const phaseKicker = document.getElementById('ooo-phase-kicker');
  const story = document.getElementById('ooo-story');
  const reorderPill = document.getElementById('ooo-reorder-pill');
  const issueOrderTrack = document.getElementById('ooo-issue-order');
  const returnOrderTrack = document.getElementById('ooo-return-order');
  const fastMeta = document.getElementById('ooo-fast-meta');
  const slowMeta = document.getElementById('ooo-slow-meta');
  const fastState = document.getElementById('ooo-fast-state');
  const slowState = document.getElementById('ooo-slow-state');
  const fastShell = document.getElementById('ooo-fast-shell');
  const slowShell = document.getElementById('ooo-slow-shell');
  const masterNode = document.getElementById('ooo-master-node');
  const slaveNode = document.getElementById('ooo-slave-node');

  if (
    !plane || !qFast || !qSlow || !msg || !slowProg || !status
    || !runBtn || !phaseKicker || !story || !reorderPill
    || !issueOrderTrack || !returnOrderTrack || !fastMeta || !slowMeta
    || !fastState || !slowState || !fastShell || !slowShell
    || !masterNode || !slaveNode
  ) return;

  const wait = tasks.delay;
  const isCurrentRun = () => runToken === oooRunToken;
  const issueOrder = [0, 1];
  const returnOrder = [];
  let issuedCount = 0;
  let slowProgressTimer = 0;

  plane.innerHTML = '';
  qFast.innerHTML = '';
  qSlow.innerHTML = '';
  slowProg.style.width = '0%';

  function setRunButtonState(disabled) {
    runBtn.disabled = disabled;
    runBtn.classList.toggle('opacity-60', disabled);
    runBtn.classList.toggle('pointer-events-none', disabled);
  }

  function showMsg(text) {
    msg.innerText = text;
    msg.style.opacity = 1;
    msg.style.transform = 'translate(-50%, -50%) scale(1.08)';
    tasks.timeout(() => {
      if (!isCurrentRun()) return;
      msg.style.opacity = 0;
      msg.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 1800);
  }

  function renderIssueOrder(activeId = null) {
    issueOrderTrack.innerHTML = issueOrder.map((id, index) => {
      const issuedClass = index < issuedCount ? 'is-issued' : '';
      const activeClass = id === activeId ? 'is-active' : '';
      return `<span class="ooo-order-chip ${issuedClass} ${activeClass}">ID:${id}</span>`;
    }).join('');
  }

  function renderReturnOrder(activeId = null) {
    const returnedMarkup = returnOrder.map((id) => {
      const activeClass = id === activeId ? 'is-active' : '';
      return `<span class="ooo-order-chip is-returned ${activeClass}">ID:${id}</span>`;
    }).join('');
    const pendingMarkup = Array.from({ length: Math.max(issueOrder.length - returnOrder.length, 0) }, () => (
      `<span class="ooo-order-chip is-pending">...</span>`
    )).join('');
    returnOrderTrack.innerHTML = `${returnedMarkup}${pendingMarkup}`;
  }

  function setPathState({
    fastHot = false,
    slowHot = false,
    fastLabel = 'Idle',
    slowLabel = 'Idle',
    fastText = '⚡ 대기',
    slowText = '⏱️ 대기',
  } = {}) {
    fastShell.classList.toggle('is-hot-fast', fastHot);
    slowShell.classList.toggle('is-hot-slow', slowHot);
    fastState.textContent = fastLabel;
    slowState.textContent = slowLabel;
    fastMeta.textContent = fastText;
    slowMeta.textContent = slowText;
  }

  function setPhase({ kicker, message, pill }) {
    phaseKicker.textContent = kicker;
    story.innerHTML = message;
    reorderPill.textContent = pill;
  }

  function getOoOGeometry() {
    const planeRect = plane.getBoundingClientRect();
    const masterRect = masterNode.getBoundingClientRect();
    const fastRect = fastShell.getBoundingClientRect();
    const slowRect = slowShell.getBoundingClientRect();
    const packetWidth = 96;

    return {
      requestX: plane.clientWidth / 2 - packetWidth / 2,
      responseX: plane.clientWidth / 2 - packetWidth / 2,
      masterLaunchY: masterRect.bottom - planeRect.top + 10,
      masterReceiveY: masterRect.bottom - planeRect.top - 34,
      fastQueueY: fastRect.top - planeRect.top + fastRect.height / 2 - 20,
      slowQueueY: slowRect.top - planeRect.top + slowRect.height / 2 - 20,
    };
  }

  function startSlowProgress() {
    tasks.clear(slowProgressTimer);
    let progress = 0;
    slowProg.style.width = '0%';
    slowProgressTimer = tasks.interval(() => {
      if (!isCurrentRun()) {
        tasks.clear(slowProgressTimer);
        return;
      }
      progress = Math.min(progress + 2, 94);
      slowProg.style.width = `${progress}%`;
      if (progress >= 94) tasks.clear(slowProgressTimer);
    }, 80);
  }

  function stopSlowProgress(finalValue = 0) {
    tasks.clear(slowProgressTimer);
    slowProg.style.width = `${finalValue}%`;
  }

  async function issueTransaction(id, isFast, geometry) {
    const color = isFast ? 'indigo' : 'slate';
    const targetY = isFast ? geometry.fastQueueY : geometry.slowQueueY;
    const qTarget = isFast ? qFast : qSlow;
    const req = document.createElement('div');
    req.className = `packet absolute left-1/2 -translate-x-1/2 w-24 h-10 border-2 border-${color}-600 bg-white flex flex-col items-center justify-center shadow-md rounded`;
    req.innerHTML = `<span class="text-[7px] font-black text-${color}-400 uppercase">ARID:${id}</span><span class="text-[9px] font-bold">REQ (${isFast ? 'SRAM' : 'DRAM'})</span>`;
    req.style.left = `${geometry.requestX}px`;
    req.style.top = `${geometry.masterLaunchY}px`;
    plane.appendChild(req);

    issuedCount += 1;
    renderIssueOrder(id);

    if (isFast) {
      status.innerText = 'Issue 0→1 / Fast ready';
      setPhase({
        kicker: '🆔 Issue Order',
        message: '🆔 Issue 0 → 1 · ⚡ SRAM 선완료 준비',
        pill: 'Issue 0 → 1 고정',
      });
      setPathState({
        fastHot: true,
        slowHot: true,
        fastLabel: 'Queued',
        slowLabel: 'Waiting',
        fastText: '⚡ SRAM 선완료 준비',
        slowText: '⏱️ DRAM 대기 유지',
      });
      showMsg('⚡ ID:1 enters the fast SRAM path');
    } else {
      status.innerText = 'Issue 0→? / Slow wait';
      setPhase({
        kicker: '⏱️ Slow Path',
        message: '🆔 ID:0 발행 · ⏱️ DRAM 대기 시작',
        pill: 'ID:0 DRAM 대기',
      });
      setPathState({
        slowHot: true,
        fastLabel: 'Idle',
        slowLabel: 'Queued',
        fastText: '⚡ 대기',
        slowText: '⏱️ DRAM 대기 시작',
      });
      startSlowProgress();
      showMsg('⏱️ ID:0 is routed to the slow DRAM path');
    }

    await wait(40);
    if (!isCurrentRun()) return;

    req.style.top = `${targetY}px`;
    req.style.opacity = '0';

    await wait(680);
    if (!isCurrentRun()) return;

    const qItem = document.createElement('div');
    qItem.className = `w-16 h-10 rounded-lg border-2 border-${color}-400 bg-${color}-50 flex items-center justify-center font-black text-xs text-${color}-700 shadow-inner`;
    qItem.innerText = `ID:${id}`;
    qTarget.appendChild(qItem);

    await wait(isFast ? 1300 : 5200);
    if (!isCurrentRun()) return;

    if (qItem.parentNode) qItem.remove();

    if (!isFast) {
      stopSlowProgress(100);
      await wait(160);
      if (!isCurrentRun()) return;
      stopSlowProgress(0);
    }

    returnOrder.push(id);
    renderReturnOrder(id);

    const resp = document.createElement('div');
    resp.className = 'packet absolute w-24 h-10 border-2 border-emerald-600 bg-emerald-50 flex flex-col items-center justify-center shadow-md rounded';
    resp.innerHTML = `<span class="text-[7px] font-black text-emerald-400">RID:${id}</span><span class="text-[9px] font-bold">DATA RETURN</span>`;
    resp.style.left = `${geometry.responseX}px`;
    resp.style.top = `${targetY}px`;
    plane.appendChild(resp);

    if (isFast) {
      status.innerText = 'Return 1→? / OoO';
      setPhase({
        kicker: '⚡ OoO Return',
        message: '⚡ ID:1 선복귀 · 📬 Return 1 → ?',
        pill: 'ID:1 first return',
      });
      setPathState({
        fastHot: true,
        slowHot: true,
        fastLabel: 'Done',
        slowLabel: 'Waiting',
        fastText: '⚡ 먼저 복귀',
        slowText: '⏱️ 아직 대기',
      });
      showMsg('🔀 ID:1 returned before ID:0');
    } else {
      status.innerText = 'Return 1→0 / Confirmed';
      setPhase({
        kicker: '🔀 Reorder Confirmed',
        message: '🆔 Issue 0 → 1 · 📬 Return 1 → 0',
        pill: 'Return 1 → 0 확정',
      });
      setPathState({
        fastLabel: 'Done',
        slowLabel: 'Done',
        fastText: '⚡ 먼저 복귀',
        slowText: '⏱️ 늦게 복귀',
      });
      showMsg('✅ Return order fixed as 1 → 0');
    }

    await wait(40);
    if (!isCurrentRun()) return;

    resp.style.top = `${geometry.masterReceiveY}px`;
    resp.style.opacity = '0';
  }

  setRunButtonState(true);
  renderIssueOrder();
  renderReturnOrder();
  setPathState();
  setPhase({
    kicker: '🔀 Reorder Ready',
    message: '🆔 Issue 0 → 1 · 📬 Return 대기',
    pill: 'Return Order 대기',
  });
  status.innerText = 'Issue 0→1 / Return ?';

  try {
    await wait(120);
    if (!isCurrentRun()) return;

    const geometry = getOoOGeometry();
    const slowPromise = tasks.track(issueTransaction(0, false, geometry));

    await wait(900);
    if (!isCurrentRun()) return;

    const fastPromise = tasks.track(issueTransaction(1, true, geometry));
    await Promise.all([slowPromise, fastPromise]);
    if (!isCurrentRun()) return;

    setPhase({
      kicker: '✅ Reorder Complete',
      message: '🆔 Issue 0 → 1 · 📬 Return 1 → 0',
      pill: 'OoO confirmed',
    });
    status.innerText = 'OoO confirmed';
  } finally {
    tasks.clear(slowProgressTimer);
    if (isCurrentRun()) {
      setRunButtonState(false);
    }
  }
}

export function start() { tasks.start(); }
export function stop() { oooRunToken++; tasks.stop();
  const button = document.getElementById('ooo-run-btn');
  if (button) { button.disabled = false; button.classList.remove('opacity-60', 'cursor-not-allowed'); }
}
