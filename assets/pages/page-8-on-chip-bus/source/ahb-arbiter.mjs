import { syncPageHeight } from './shared.mjs';
function restartAhbDescriptionAnimations() {
  const pulseNodes = Array.from(document.querySelectorAll('.ahb-arb-pulse'));
  const lockNodes = Array.from(document.querySelectorAll('.ahb-arb-lock-badge'));

  pulseNodes.forEach((node, index) => {
    node.style.setProperty('--ahb-delay', `${(index % 4) * 0.14}s`);
    node.style.animationName = 'none';
    void node.offsetWidth;
    node.style.animationName = '';
  });

  lockNodes.forEach((node, index) => {
    node.style.setProperty('--ahb-delay', `${0.12 + (index % 2) * 0.16}s`);
    node.style.animationName = 'none';
    void node.offsetWidth;
    node.style.animationName = '';
  });
}
const internalArbiterRefs = {
  req0: document.getElementById('arbiter-logic-req0'),
  req1: document.getElementById('arbiter-logic-req1'),
  gnt0: document.getElementById('arbiter-logic-gnt0'),
  gnt1: document.getElementById('arbiter-logic-gnt1'),
  win: document.getElementById('arbiter-logic-win'),
  hmaster: document.getElementById('arbiter-logic-hmaster'),
  master0: document.getElementById('arbiter-logic-master0'),
  master1: document.getElementById('arbiter-logic-master1'),
  master0State: document.getElementById('arbiter-logic-master0-state'),
  master1State: document.getElementById('arbiter-logic-master1-state'),
  txtReq0: document.getElementById('arbiter-logic-txt-req0'),
  txtReq1: document.getElementById('arbiter-logic-txt-req1'),
  txtGnt0: document.getElementById('arbiter-logic-txt-gnt0'),
  txtGnt1: document.getElementById('arbiter-logic-txt-gnt1'),
  txtWin: document.getElementById('arbiter-logic-txt-win'),
  txtHmaster: document.getElementById('arbiter-logic-txt-hmaster'),
  priorityBox: document.getElementById('arbiter-logic-priority-box'),
  ctrlBox: document.getElementById('arbiter-logic-ctrl-box'),
  mux: document.getElementById('arbiter-logic-mux'),
  muxM0: document.getElementById('arbiter-logic-mux-m0'),
  muxM1: document.getElementById('arbiter-logic-mux-m1'),
  muxOut: document.getElementById('arbiter-logic-mux-out'),
  desc: document.getElementById('arbiter-internal-desc'),
  flowChips: Array.from(document.querySelectorAll('.arbiter-internal-flow-chip[data-flow-stage]')),
  stepButtons: Array.from(document.querySelectorAll('[data-arbiter-step]')),
};
let internalArbiterStateIndex = 0;
let internalArbiterIntervalId = null;
let internalArbiterInitialized = false;
let internalArbiterSelectedStepIndex = 0;
function setInternalArbiterLine(element, state = '') {
  if (!element) return;
  const mappedState = state === 'is-req'
    ? 'signal-req'
    : state === 'is-compare'
      ? 'signal-req'
      : state === 'is-gnt'
        ? 'signal-gnt'
        : state === 'is-master'
          ? 'signal-master'
          : '';
  element.setAttribute('class', ['signal-line', mappedState].filter(Boolean).join(' '));
}

function setInternalArbiterMuxPath(element, isActive = false) {
  if (!element) return;
  element.setAttribute('class', `mux-path${isActive ? ' active' : ''}`);
}

function setInternalArbiterTextColor(element, color = '#64748B') {
  if (!element) return;
  element.style.fill = color;
}

function setInternalArbiterMasterTone(element, tone = '') {
  if (!element) return;
  element.classList.remove('is-requesting', 'is-granted');
  if (tone) {
    element.classList.add(`is-${tone}`);
  }
}

function setInternalArbiterMasterStateText(element, text = 'IDLE') {
  if (!element) return;
  element.textContent = text;
}

function activateInternalArbiterBox(element, toneClass) {
  if (!element) return;
  element.classList.add('arbiter-internal-box-active', toneClass);
  element.classList.add('arb-box-active');
}

function syncInternalArbiterFlowStages(activeStages = []) {
  const stageSet = new Set(activeStages);
  internalArbiterRefs.flowChips.forEach((chip) => {
    chip.classList.toggle('is-active', stageSet.has(chip.dataset.flowStage));
  });
}

function syncInternalArbiterStepButtons(activeStepIndex) {
  internalArbiterRefs.stepButtons.forEach((button) => {
    const buttonStep = Number(button.dataset.arbiterStep);
    button.classList.toggle('is-active', buttonStep === activeStepIndex);
    button.setAttribute('aria-pressed', String(buttonStep === activeStepIndex));
  });
}

function resetInternalArbiterAnimation() {
  if (!internalArbiterRefs.desc) return;

  ['req0', 'req1', 'gnt0', 'gnt1', 'win', 'hmaster'].forEach((key) => {
    setInternalArbiterLine(internalArbiterRefs[key]);
  });
  setInternalArbiterMuxPath(internalArbiterRefs.muxM0, false);
  setInternalArbiterMuxPath(internalArbiterRefs.muxM1, false);
  setInternalArbiterMasterTone(internalArbiterRefs.master0);
  setInternalArbiterMasterTone(internalArbiterRefs.master1);
  setInternalArbiterMasterStateText(internalArbiterRefs.master0State, 'IDLE');
  setInternalArbiterMasterStateText(internalArbiterRefs.master1State, 'IDLE');
  syncInternalArbiterFlowStages([]);

  [internalArbiterRefs.priorityBox, internalArbiterRefs.ctrlBox].forEach((box) => {
    box?.classList.remove('arbiter-internal-box-active', 'arb-box-active', 'is-priority', 'is-control');
  });

  internalArbiterRefs.mux?.classList.remove('is-active');
  internalArbiterRefs.muxOut?.classList.remove('is-active');

  [internalArbiterRefs.txtReq0, internalArbiterRefs.txtReq1, internalArbiterRefs.txtGnt0, internalArbiterRefs.txtGnt1, internalArbiterRefs.txtWin, internalArbiterRefs.txtHmaster]
    .forEach((element) => setInternalArbiterTextColor(element));

  if (internalArbiterRefs.txtWin) {
    internalArbiterRefs.txtWin.textContent = 'Eval';
  }

  internalArbiterRefs.desc.className = 'arbiter-internal-desc';
  internalArbiterRefs.desc.textContent = 'IDLE: 버스 요청 대기 중...';
}

function applyInternalArbiterAnimationStep(nextStep = 0) {
  if (!internalArbiterRefs.desc) return;

  internalArbiterStateIndex = ((nextStep % 5) + 5) % 5;
  resetInternalArbiterAnimation();

  switch (internalArbiterStateIndex) {
    case 1:
      syncInternalArbiterFlowStages(['request', 'compare']);
      setInternalArbiterMasterTone(internalArbiterRefs.master0, 'requesting');
      setInternalArbiterMasterStateText(internalArbiterRefs.master0State, 'REQ');
      setInternalArbiterLine(internalArbiterRefs.req0, 'is-req');
      setInternalArbiterLine(internalArbiterRefs.win, 'is-compare');
      setInternalArbiterTextColor(internalArbiterRefs.txtReq0, '#F59E0B');
      setInternalArbiterTextColor(internalArbiterRefs.txtWin, '#F59E0B');
      if (internalArbiterRefs.txtWin) {
        internalArbiterRefs.txtWin.textContent = 'M0 Win';
      }
      activateInternalArbiterBox(internalArbiterRefs.priorityBox, 'is-priority');
      internalArbiterRefs.desc.className = 'arbiter-internal-desc is-request';
      internalArbiterRefs.desc.textContent = '[Step 1] Master 0가 HBUSREQ0를 올리면 Priority Logic이 활성 요청을 비교해 winner를 M0로 결정합니다.';
      break;
    case 2:
      syncInternalArbiterFlowStages(['grant', 'select']);
      setInternalArbiterMasterTone(internalArbiterRefs.master0, 'granted');
      setInternalArbiterMasterStateText(internalArbiterRefs.master0State, 'GNT');
      setInternalArbiterLine(internalArbiterRefs.gnt0, 'is-gnt');
      setInternalArbiterLine(internalArbiterRefs.hmaster, 'is-master');
      setInternalArbiterTextColor(internalArbiterRefs.txtGnt0, '#22C55E');
      setInternalArbiterTextColor(internalArbiterRefs.txtHmaster, '#3B82F6');
      activateInternalArbiterBox(internalArbiterRefs.ctrlBox, 'is-control');
      setInternalArbiterMuxPath(internalArbiterRefs.muxM0, true);
      internalArbiterRefs.mux?.classList.add('is-active');
      internalArbiterRefs.muxOut?.classList.add('is-active');
      internalArbiterRefs.desc.className = 'arbiter-internal-desc is-grant';
      internalArbiterRefs.desc.textContent = '[Step 2] Control FSM이 HGRANT0와 HMASTER=0을 출력하고 MUX가 Master 0 Addr/Data 경로를 연결합니다.';
      break;
    case 3:
      syncInternalArbiterFlowStages(['request', 'compare']);
      setInternalArbiterMasterTone(internalArbiterRefs.master1, 'requesting');
      setInternalArbiterMasterStateText(internalArbiterRefs.master1State, 'REQ');
      setInternalArbiterLine(internalArbiterRefs.req1, 'is-req');
      setInternalArbiterLine(internalArbiterRefs.win, 'is-compare');
      setInternalArbiterTextColor(internalArbiterRefs.txtReq1, '#F59E0B');
      setInternalArbiterTextColor(internalArbiterRefs.txtWin, '#F59E0B');
      if (internalArbiterRefs.txtWin) {
        internalArbiterRefs.txtWin.textContent = 'M1 Win!';
      }
      activateInternalArbiterBox(internalArbiterRefs.priorityBox, 'is-priority');
      internalArbiterRefs.desc.className = 'arbiter-internal-desc is-request';
      internalArbiterRefs.desc.textContent = '[Step 3] Master 1의 HBUSREQ1이 들어오면 Priority Logic이 더 높은 우선순위를 감지해 winner를 M1로 갱신합니다.';
      break;
    case 4:
      syncInternalArbiterFlowStages(['grant', 'select']);
      setInternalArbiterMasterTone(internalArbiterRefs.master1, 'granted');
      setInternalArbiterMasterStateText(internalArbiterRefs.master1State, 'GNT');
      setInternalArbiterLine(internalArbiterRefs.gnt1, 'is-gnt');
      setInternalArbiterLine(internalArbiterRefs.hmaster, 'is-master');
      setInternalArbiterTextColor(internalArbiterRefs.txtGnt1, '#22C55E');
      setInternalArbiterTextColor(internalArbiterRefs.txtHmaster, '#3B82F6');
      activateInternalArbiterBox(internalArbiterRefs.ctrlBox, 'is-control');
      setInternalArbiterMuxPath(internalArbiterRefs.muxM1, true);
      internalArbiterRefs.mux?.classList.add('is-active');
      internalArbiterRefs.muxOut?.classList.add('is-active');
      internalArbiterRefs.desc.className = 'arbiter-internal-desc is-switch';
      internalArbiterRefs.desc.textContent = '[Step 4] HGRANT1과 HMASTER=1이 적용되면 MUX 선택이 바뀌고 버스 소유권이 Master 1로 넘어갑니다.';
      break;
    default:
      break;
  }

  syncInternalArbiterStepButtons(internalArbiterStateIndex);
  window.setTimeout(syncPageHeight, 40);
}

function startInternalArbiterAnimation() {
  if (!internalArbiterRefs.desc) return;
  const cadence = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 3600 : 2800;
  window.clearInterval(internalArbiterIntervalId);
  internalArbiterIntervalId = window.setInterval(() => {
    applyInternalArbiterAnimationStep(internalArbiterStateIndex + 1);
  }, cadence);
}

function initializeInternalArbiterAnimation(restart = false, initialStep = internalArbiterSelectedStepIndex) {
  if (!internalArbiterRefs.desc) return;
  if (internalArbiterInitialized && !restart) return;

  internalArbiterInitialized = true;
  window.clearInterval(internalArbiterIntervalId);
  internalArbiterSelectedStepIndex = ((Number(initialStep) || 0) % 5 + 5) % 5;
  internalArbiterStateIndex = internalArbiterSelectedStepIndex;
  applyInternalArbiterAnimationStep(internalArbiterSelectedStepIndex);
  startInternalArbiterAnimation();
}
internalArbiterRefs.stepButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const stepIndex = Number(button.dataset.arbiterStep || 0);
    initializeInternalArbiterAnimation(true, stepIndex);
  });
});

export function start() {
  restartAhbDescriptionAnimations();
  initializeInternalArbiterAnimation();
  startInternalArbiterAnimation();
}
export function stop() {
  window.clearInterval(internalArbiterIntervalId);
  internalArbiterIntervalId = null;
}
