import { createTaskScope } from '../../shared/source/task-scope.mjs';
const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
export function createMemoryContext(root) {
    const tasks = createTaskScope(window);
    const wait = tasks.delay;
    const ctx = { root, tasks, wait, clamp };
    const buttons = Array.from(root.querySelectorAll('[data-memory-action]'));
    if (!buttons.length) return;

    const kind = root.dataset.memoryKind || 'sram';
    const els = {
        helper: root.querySelector('[data-memory-helper]'),
        storeValue: root.querySelector('[data-memory-store-value]'),
        lineState: root.querySelector('[data-memory-line-state]'),
        detailState: root.querySelector('[data-memory-detail-state]'),
        cellValue: root.querySelector('[data-memory-cell-value]'),
        blValue: root.querySelector('[data-memory-bl-value]'),
        blbValue: root.querySelector('[data-memory-blb-value]'),
        wlLine: root.querySelector('[data-memory-wl-line]'),
        blLine: root.querySelector('[data-memory-bl-line]'),
        blbLine: root.querySelector('[data-memory-blb-line]'),
        accessLeft: root.querySelector('[data-memory-access-left]'),
        accessRight: root.querySelector('[data-memory-access-right]'),
        qNode: root.querySelector('[data-memory-q-node]'),
        qbNode: root.querySelector('[data-memory-qb-node]'),
        qLabel: root.querySelector('[data-memory-q-label]'),
        qbLabel: root.querySelector('[data-memory-qb-label]'),
        loopTop: root.querySelector('[data-memory-loop-top]'),
        loopBottom: root.querySelector('[data-memory-loop-bottom]'),
        logBadge: root.querySelector('[data-memory-log-badge]'),
        log: root.querySelector('[data-memory-log]'),
        refreshText: root.querySelector('[data-memory-refresh-text]'),
        chargeFill: root.querySelector('[data-memory-charge-fill]'),
        chargeValue: root.querySelector('[data-memory-charge-value]')
    };
    const stageChips = Array.from(root.querySelectorAll('[data-memory-stage-chip]'));
    const gateLines = Array.from(root.querySelectorAll('[data-memory-gate-line]'));
    const state = {
        running: false,
        sequence: 0,
        hasCompleted: false,
        storeBit: null,
        charge: kind === 'dram' ? 0 : null,
        previewStage: null
    };

    const setText = (el, value) => {
        if (el) el.textContent = value;
    };
    const setAttr = (el, name, value) => {
        if (el) el.setAttribute(name, String(value));
    };
    const setStyle = (el, property, value) => {
        if (el) el.style[property] = value;
    };
    const toggleClass = (el, className, enabled) => {
        if (el) el.classList.toggle(className, Boolean(enabled));
    };
    const setButtonsDisabled = (disabled) => {
        buttons.forEach((button) => {
            button.disabled = disabled;
        });
        stageChips.forEach((chip) => {
            chip.disabled = disabled;
        });
    };
    const stageLabelSets = {
        sram: {
            idle: { idle: 'Idle', 'slot-a': 'Bitline Setup', 'slot-b': 'Wordline Enable', 'slot-c': 'State Hold', done: 'Done' },
            read: { idle: 'Idle', 'slot-a': 'Precharge', 'slot-b': 'Differential Develop', 'slot-c': 'Sense Amplify', done: 'Read Done' },
            write1: { idle: 'Idle', 'slot-a': 'Write 1 Drive', 'slot-b': 'Wordline Enable', 'slot-c': 'Latch Hold', done: 'Write 1 Done' },
            write0: { idle: 'Idle', 'slot-a': 'Write 0 Drive', 'slot-b': 'Wordline Enable', 'slot-c': 'Latch Hold', done: 'Write 0 Done' }
        },
        dram: {
            idle: { idle: 'Idle', 'slot-a': 'Precharge', 'slot-b': 'Charge Sharing', 'slot-c': 'Sense & Restore', done: 'Done' },
            read: { idle: 'Idle', 'slot-a': 'Precharge', 'slot-b': 'Charge Sharing', 'slot-c': 'Sense & Restore', done: 'Read Done' },
            write1: { idle: 'Idle', 'slot-a': 'Write 1 Drive', 'slot-b': 'Cell Charge', 'slot-c': 'Level Restore', done: 'Write 1 Done' },
            write0: { idle: 'Idle', 'slot-a': 'Write 0 Drive', 'slot-b': 'Cell Discharge', 'slot-c': 'Level Restore', done: 'Write 0 Done' },
            refresh: { idle: 'Idle', 'slot-a': 'Precharge', 'slot-b': 'Charge Detect', 'slot-c': 'Charge Restore', done: 'Refresh Done' }
        }
    };
    const getOperationKey = (action = root.dataset.action || 'idle', writeValue = root.dataset.writeValue || '1') => {
        if (action === 'write') return writeValue === '0' ? 'write0' : 'write1';
        return action;
    };
    const setStageLabels = (action = root.dataset.action || 'idle', writeValue = root.dataset.writeValue || '1') => {
        const operationKey = getOperationKey(action, writeValue);
        const labels = stageLabelSets[kind][operationKey] || stageLabelSets[kind].idle;
        stageChips.forEach((chip) => {
            setText(chip, labels[chip.dataset.memoryStageChip] || chip.textContent);
        });
    };
    const setButtonStates = (action, writeValue = root.dataset.writeValue || '1') => {
        root.dataset.op = action;
        root.dataset.action = action;
        root.dataset.writeValue = writeValue;
        setStageLabels(action, writeValue);
        buttons.forEach((button) => {
            const buttonAction = button.dataset.memoryAction;
            const buttonWriteValue = button.dataset.memoryValue || writeValue;
            const isActive = buttonAction === 'write'
                ? action === 'write' && buttonWriteValue === writeValue
                : buttonAction === action;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    };
    const setStage = (stage) => {
        const stageOrder = ['idle', 'slot-a', 'slot-b', 'slot-c', 'done'];
        const activeIndex = stageOrder.indexOf(stage);
        root.dataset.stage = stage;
        stageChips.forEach((chip) => {
            const chipIndex = stageOrder.indexOf(chip.dataset.memoryStageChip);
            chip.classList.toggle('is-active', chipIndex === activeIndex);
            chip.classList.toggle('is-done', chipIndex > 0 && chipIndex < activeIndex);
            chip.setAttribute('aria-pressed', chipIndex === activeIndex ? 'true' : 'false');
        });
    };
    const setBadge = (text, active = true) => {
        setText(els.logBadge, text);
        toggleClass(els.logBadge, 'is-active', active);
    };
    const setRunning = (running) => {
        state.running = running;
        root.dataset.running = running ? 'true' : 'false';
    };
    const paintLine = (el, stroke, width, opacity = 1) => {
        if (!el) return;
        setAttr(el, 'stroke', stroke);
        if (width) setAttr(el, 'stroke-width', width);
        setStyle(el, 'opacity', String(opacity));
    };
    const paintRect = (el, fill, stroke, opacity = 1) => {
        if (!el) return;
        setAttr(el, 'fill', fill);
        setAttr(el, 'stroke', stroke);
        setStyle(el, 'opacity', String(opacity));
    };
    const paintNode = (el, fill, stroke = '#94a3b8') => {
        if (!el) return;
        setAttr(el, 'fill', fill);
        setAttr(el, 'stroke', stroke);
        setAttr(el, 'stroke-width', '1.6');
    };
    const setPathStroke = (el, stroke, opacity = 1) => {
        if (!el) return;
        setAttr(el, 'stroke', stroke);
        setStyle(el, 'opacity', String(opacity));
    };
    const paintGateLines = (stroke, opacity = 1, active = false) => {
        gateLines.forEach((line) => {
            setAttr(line, 'stroke', stroke);
            setStyle(line, 'opacity', String(opacity));
            toggleClass(line, 'memory-gate-live', active);
        });
    };
    const clearMotion = () => {
        [els.wlLine, els.blLine, els.blbLine, els.loopTop, els.loopBottom].forEach((el) => {
            toggleClass(el, 'memory-flow-live', false);
        });
        gateLines.forEach((line) => {
            toggleClass(line, 'memory-gate-live', false);
        });
        [els.qNode, els.qbNode, els.chargeFill, els.chargeValue, els.cellValue].forEach((el) => {
            toggleClass(el, 'memory-pulse-live', false);
        });
        toggleClass(els.refreshText, 'is-visible', false);
    };
    const setChargeVisual = (charge) => {
        const normalized = clamp(Math.round(charge), 0, 100);
        const height = Math.round((normalized / 100) * 18);
        setAttr(els.chargeFill, 'height', height);
        setAttr(els.chargeFill, 'y', 158 - height);
        setText(els.chargeValue, `${normalized}%`);
        setText(els.cellValue, `Charge ${normalized}%`);
        setText(els.storeValue, `${normalized}%`);
    };
    const defaultHelper = () => {
        setText(
            els.helper,
            kind === 'sram'
                ? 'See bitline precharge, wordline enable, and latch hold behavior'
                : 'See 1T1C charge sharing and sense-and-restore behavior'
        );
    };
    const ensureCurrent = (token) => token === state.sequence && root.isConnected;
    const resolveDramBit = () => (state.charge >= 35 ? '1' : '0');
    const resolveSramPreviewBit = () => state.storeBit ?? (root.dataset.writeValue || '1');
    const resolveDramPreviewCharge = () => (
        state.hasCompleted
            ? state.charge
            : (root.dataset.writeValue || '1') === '1' ? 72 : 0
    );
    const paintSramNodes = (bit) => {
        if (bit === null) {
            paintNode(els.qNode, '#cbd5e1');
            paintNode(els.qbNode, '#cbd5e1');
            setText(els.qLabel, 'Q');
            setText(els.qbLabel, 'QB');
            return;
        }

        const complement = bit === '1' ? '0' : '1';
        paintNode(els.qNode, bit === '1' ? '#2563eb' : '#cbd5e1', bit === '1' ? '#1d4ed8' : '#94a3b8');
        paintNode(els.qbNode, bit === '0' ? '#2563eb' : '#cbd5e1', bit === '0' ? '#1d4ed8' : '#94a3b8');
        setText(els.qLabel, `Q=${bit}`);
        setText(els.qbLabel, `QB=${complement}`);
    };
    const clearStagePreview = () => {
        state.previewStage = null;
        delete root.dataset.previewStage;
    };
    const renderStableState = () => {
        if (kind === 'sram') {
            ctx.renderSramStable();
        } else {
            ctx.renderDramStable();
        }
    };
    return Object.assign(ctx, { buttons, kind, els, stageChips, gateLines, state, setText, setAttr, setStyle, toggleClass, setButtonsDisabled, stageLabelSets, getOperationKey, setStageLabels, setButtonStates, setStage, setBadge, setRunning, paintLine, paintRect, paintNode, setPathStroke, paintGateLines, clearMotion, setChargeVisual, defaultHelper, ensureCurrent, resolveDramBit, resolveSramPreviewBit, resolveDramPreviewCharge, paintSramNodes, clearStagePreview, renderStableState });
}
