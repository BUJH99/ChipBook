import { createMemoryContext } from './context.mjs';
import { attachStableView } from './stable-view.mjs';
import { attachStagePreview } from './stage-preview.mjs';
import { attachActions } from './actions.mjs';
import { initNandLab } from './nand-operation.mjs';

const run = (action) => Promise.resolve().then(action).catch(error => {
    if (error.name !== 'AbortError') console.error('Memory lab failed:',error);
});
window.GuidebookPage.registerInitializer(() => {
    document.querySelectorAll('[data-memory-lab]').forEach(root => {
        if (root.dataset.memoryReady === 'true') return;
        root.dataset.memoryReady = 'true';
        const ctx = createMemoryContext(root);
        if (!ctx) return;
        attachStableView(ctx);
        attachStagePreview(ctx);
        attachActions(ctx);
        const {
        buttons, stageChips, kind, state, tasks,
        clamp, renderDramStable,
    } = ctx;
        buttons.forEach(button => button.addEventListener('click', () => {
            if (state.running) return;
            ctx.clearStagePreview();
            const action = button.dataset.memoryAction || 'read';
            const value = button.dataset.memoryValue || root.dataset.writeValue || '1';
            run(() => kind === 'sram' ? ctx.runSramAction(action,value) : ctx.runDramAction(action,value));
        }));
        stageChips.forEach(chip => chip.addEventListener('click', () => {
            if (state.running) return;
            const stage = chip.dataset.memoryStageChip || 'idle';
            if (state.previewStage === stage) { ctx.clearStagePreview(); ctx.renderStableState(); }
            else ctx.runStagePreview(stage);
        }));
        const decay = () => {
            if (state.running || state.previewStage || !root.isConnected || state.charge <= 0) {
                if (!state.previewStage && state.hasCompleted && state.charge <= 0 && !state.running) {
                    state.charge = 0;
                    renderDramStable();
                }
                return;
            }
            state.charge = clamp(
                state.charge - (state.charge > 70 ? 6 : state.charge > 35 ? 4 : 2),
                0,
                100
            );
            renderDramStable();
        };
        window.GuidebookPage.registerLifecycle({
            root,
            start() { tasks.start(); if (kind === 'dram') tasks.interval(decay,2400); },
            stop() {
                state.sequence++;
                tasks.stop();
                ctx.clearMotion();
                ctx.clearStagePreview();
                ctx.setRunning(false);
                ctx.setButtonsDisabled(false);
                ctx.renderStableState();
            },
            destroy() { tasks.stop(); },
        });
        ctx.setButtonStates('idle',root.dataset.writeValue || '1');
        ctx.renderStableState();
    });
    initNandLab();
});
