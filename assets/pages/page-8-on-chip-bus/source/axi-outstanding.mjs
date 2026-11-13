import { syncPageHeight } from './shared.mjs';
import { createTaskScope } from '../../../features/shared/source/task-scope.mjs';
const tasks = createTaskScope(window);
let outstandingRunToken = 0;

export async function runOutstanding() {
  const runToken = ++outstandingRunToken;
  const plane = document.getElementById('plane-out');
  const queue = document.getElementById('out-queue');
  const utilVal = document.getElementById('util-val');
  const depthVal = document.getElementById('depth-val');
  const status = document.getElementById('out-status');
  const phaseVal = document.getElementById('out-phase-val');
  const phaseKicker = document.getElementById('out-phase-kicker');
  const story = document.getElementById('out-story');
  const pipelinePill = document.getElementById('out-pipeline-pill');
  const issuedCount = document.getElementById('out-issued-count');
  const completeCount = document.getElementById('out-complete-count');
  const depthTrack = document.getElementById('out-depth-track');
  const addrLane = document.getElementById('out-addr-lane');
  const respLane = document.getElementById('out-resp-lane');
  const masterNode = document.getElementById('out-master-node');
  const slaveNode = document.getElementById('out-slave-node');

  if (
    !plane || !queue || !utilVal || !depthVal || !status
    || !phaseVal || !phaseKicker || !story || !pipelinePill
    || !issuedCount || !completeCount || !depthTrack
    || !addrLane || !respLane || !masterNode || !slaveNode
  ) return;

  plane.innerHTML = '';
  queue.innerHTML = '';

  const count = 4;
  let currentDepth = 0;
  let issued = 0;
  let retired = 0;
  let queueItemHeight = 34;

  const wait = tasks.delay;
  const isCurrentRun = () => runToken === outstandingRunToken;

  function setLaneState({ address = false, response = false } = {}) {
    addrLane.classList.toggle('is-address-active', address);
    respLane.classList.toggle('is-response-active', response);
  }

  function renderDepthTrack() {
    depthTrack.innerHTML = Array.from({ length: count }, (_, index) => {
      const stateClass = index < currentDepth ? 'is-filled' : '';
      const hotClass = index === currentDepth - 1 ? 'is-hot' : '';
      return `<span class="outstanding-depth-slot ${stateClass} ${hotClass}"></span>`;
    }).join('');
  }

  function calculateQueueItemHeight() {
    const queueStyles = window.getComputedStyle(queue);
    const paddingY = parseFloat(queueStyles.paddingTop || '0') + parseFloat(queueStyles.paddingBottom || '0');
    const gap = parseFloat(queueStyles.rowGap || queueStyles.gap || '0');
    const availableHeight = Math.max(queue.clientHeight - paddingY, 0);
    const fittedHeight = Math.floor((availableHeight - gap * (count - 1)) / count);
    return Math.max(26, fittedHeight);
  }

  function syncMetrics() {
    utilVal.innerText = `${Math.round((currentDepth / count) * 100)}%`;
    depthVal.innerText = `${currentDepth}/${count}`;
    issuedCount.innerText = String(issued);
    completeCount.innerText = String(retired);
    pipelinePill.innerHTML = `<span aria-hidden="true">📦</span><span>주소 선발행 ${currentDepth}개</span>`;
    renderDepthTrack();
  }

  function setNarrative({ phase, kicker, message, address = false, response = false }) {
    phaseVal.innerText = phase;
    phaseKicker.innerText = kicker;
    story.innerHTML = message;
    setLaneState({ address, response });
  }

  function getOutstandingPacketGeometry() {
    const planeRect = plane.getBoundingClientRect();
    const masterRect = masterNode.getBoundingClientRect();
    const slaveRect = slaveNode.getBoundingClientRect();
    const packetWidth = 80;

    return {
      issueX: plane.clientWidth / 3 - packetWidth / 2,
      responseX: plane.clientWidth * (2 / 3) - packetWidth / 2,
      masterLaunchY: masterRect.bottom - planeRect.top + 10,
      queueCaptureY: slaveRect.top - planeRect.top + slaveRect.height / 2 - 16,
      responseLaunchY: slaveRect.top - planeRect.top + slaveRect.height / 2 - 16,
      masterReceiveY: masterRect.bottom - planeRect.top - 30,
    };
  }

  syncMetrics();
  status.innerText = 'IDLE';
  setNarrative({
    phase: '준비',
    kicker: '🧩 준비',
    message: '🧩 준비 상태 · 선발행 대기',
  });

  await wait(90);
  if (!isCurrentRun()) return;

  const geometry = getOutstandingPacketGeometry();
  queueItemHeight = calculateQueueItemHeight();

  setNarrative({
    phase: '선발행',
    kicker: '🚀 선발행',
    message: '🚀 주소 선발행 · Queue 적재',
    address: true,
  });

  for (let i = 0; i < count; i += 1) {
    await wait(400);
    if (!isCurrentRun()) return;

    const ar = document.createElement('div');
    ar.className = 'packet absolute w-20 h-8 border-2 border-blue-600 bg-white flex flex-col items-center justify-center shadow-lg rounded';
    ar.innerHTML = `<span class="text-[7px] font-black text-blue-400">ARID:${i}</span><span class="text-[9px] font-bold">ADDR</span>`;
    ar.style.left = `${geometry.issueX}px`;
    ar.style.top = `${geometry.masterLaunchY}px`;
    plane.appendChild(ar);
    status.innerText = `ISSUING ARID:${i}`;
    story.innerHTML = `🚀 <strong>ARID:${i}</strong> 선발행 · Queue 적재 대기`;

    await wait(30);
    if (!isCurrentRun()) return;

    ar.style.top = `${geometry.queueCaptureY}px`;
    ar.style.opacity = '0';

    await wait(560);
    if (!isCurrentRun()) return;

    issued += 1;
    currentDepth += 1;
    syncMetrics();

    const qItem = document.createElement('div');
    qItem.className = 'w-full rounded-xl border border-blue-400 bg-gradient-to-r from-blue-600 to-blue-500 px-3 text-[10px] font-bold text-white mono shadow-inner flex items-center justify-between';
    qItem.style.height = `${queueItemHeight}px`;
    qItem.style.minHeight = `${queueItemHeight}px`;
    qItem.innerHTML = `<span>ID:${i}</span><span>QUEUED</span>`;
    queue.appendChild(qItem);
  }

  if (!isCurrentRun()) return;

  status.innerText = 'OUTSTANDING FULL';
  setNarrative({
    phase: '포화',
    kicker: '🧱 포화',
    message: `🧱 Outstanding <strong>${count}건</strong> · Latency 은닉`,
    address: true,
  });

  await wait(1100);
  if (!isCurrentRun()) return;

  setNarrative({
    phase: '회수',
    kicker: '📬 회수',
    message: '📬 RID 회수 · Depth 축소',
    response: true,
  });

  for (let i = 0; i < count; i += 1) {
    await wait(680);
    if (!isCurrentRun()) return;

    const retiringItem = queue.firstChild;
    if (retiringItem) {
      retiringItem.style.opacity = '0.45';
      retiringItem.style.transform = 'translateX(6px)';
      await wait(90);
      if (!isCurrentRun()) return;
      if (retiringItem.parentNode === queue) queue.removeChild(retiringItem);
    }

    currentDepth -= 1;
    retired += 1;
    syncMetrics();
    status.innerText = `RECEIVING RID:${i}`;
    story.innerHTML = `📬 <strong>RID:${i}</strong> 회수 · 잔여 <strong>${currentDepth}건</strong>`;

    const r = document.createElement('div');
    r.className = 'packet absolute w-20 h-8 border-2 border-emerald-600 bg-emerald-50 flex flex-col items-center justify-center shadow-lg rounded';
    r.innerHTML = `<span class="text-[7px] font-black text-emerald-400">RID:${i}</span><span class="text-[9px] font-bold">DATA</span>`;
    r.style.left = `${geometry.responseX}px`;
    r.style.top = `${geometry.responseLaunchY}px`;
    plane.appendChild(r);

    await wait(30);
    if (!isCurrentRun()) return;

    r.style.top = `${geometry.masterReceiveY}px`;
    r.style.opacity = '0';
  }

  if (!isCurrentRun()) return;

  setNarrative({
    phase: '완료',
    kicker: '✅ 완료',
    message: '📦 선발행 · ⏱️ 은닉 · 📬 회수 완료',
  });
  status.innerText = 'IDLE';
}

export function start() { tasks.start(); }
export function stop() { outstandingRunToken++; tasks.stop();
}
