export function attachStableView(ctx) {
    const {
        els, state, setText, setStage, setBadge,
        paintLine, paintRect, paintNode, setPathStroke, paintGateLines,
        clearMotion, setChargeVisual, defaultHelper,
    } = ctx;
    const renderSramStable = () => {
        clearMotion();
        paintLine(els.wlLine, '#c4b5fd', 3);
        paintLine(els.blLine, state.storeBit === null ? '#94a3b8' : '#60a5fa', 3.2);
        paintLine(els.blbLine, state.storeBit === null ? '#94a3b8' : '#60a5fa', 3.2);
        paintGateLines('#cbd5e1', 0.95);
        paintRect(els.accessLeft, '#e2e8f0', '#cbd5e1');
        paintRect(els.accessRight, '#e2e8f0', '#cbd5e1');
        setPathStroke(els.loopTop, '#2563eb', state.storeBit === null ? 0.55 : 0.95);
        setPathStroke(els.loopBottom, '#16a34a', state.storeBit === null ? 0.55 : 0.95);

        if (state.storeBit === null) {
            setStage('idle');
            setBadge('Idle', false);
            defaultHelper();
            setText(els.log, 'Idle. SRAM holds a written value stably through its internal feedback loop.');
            setText(els.storeValue, 'None');
            setText(els.lineState, 'Floating (Z)');
            setText(els.detailState, 'Q=? / QB=?');
            setText(els.cellValue, 'Stored: none');
            setText(els.blValue, 'Z');
            setText(els.blbValue, 'Z');
            paintNode(els.qNode, '#cbd5e1');
            paintNode(els.qbNode, '#cbd5e1');
            setText(els.qLabel, 'Q');
            setText(els.qbLabel, 'QB');
            return;
        }

        const bit = state.storeBit;
        const complement = bit === '1' ? '0' : '1';
        setStage('done');
        setBadge('Hold');
        defaultHelper();
        setText(
            els.log,
            bit === '1'
                ? 'The cell is currently holding Q=1 / QB=0 through its internal feedback loop.'
                : 'The cell is currently holding Q=0 / QB=1 through its internal feedback loop.'
        );
        setText(els.storeValue, bit);
        setText(els.lineState, 'BL=1 / BLB=1');
        setText(els.detailState, `Q=${bit} / QB=${complement}`);
        setText(els.cellValue, `Stored: ${bit}`);
        setText(els.blValue, '1');
        setText(els.blbValue, '1');
        paintNode(els.qNode, bit === '1' ? '#2563eb' : '#cbd5e1', bit === '1' ? '#1d4ed8' : '#94a3b8');
        paintNode(els.qbNode, bit === '0' ? '#2563eb' : '#cbd5e1', bit === '0' ? '#1d4ed8' : '#94a3b8');
        setText(els.qLabel, `Q=${bit}`);
        setText(els.qbLabel, `QB=${complement}`);
    };

    const renderDramStable = () => {
        clearMotion();
        paintLine(els.wlLine, '#c4b5fd', 3);
        paintLine(els.blLine, '#94a3b8', 3.2);
        paintGateLines('#d8b4fe', 0.95);
        paintRect(els.accessLeft, '#f3e8ff', '#d8b4fe');
        setText(els.blValue, 'Z');
        setChargeVisual(state.charge);

        if (!state.hasCompleted && state.charge === 0) {
            setStage('idle');
            setBadge('Idle', false);
            defaultHelper();
            setText(els.log, 'Idle. DRAM gradually leaks charge over time, so the stored state weakens unless it is refreshed.');
            setText(els.lineState, 'Floating (Z)');
            setText(els.detailState, 'Charge decay');
            return;
        }

        setStage('done');
        if (state.charge >= 35) {
            setBadge('Leakage');
            setText(els.lineState, 'Floating (Z)');
            setText(els.detailState, `Leaked to ${state.charge}%`);
            setText(
                els.log,
                state.charge >= 70
                    ? `${state.charge}% charge remains, so the cell still holds a stable '1' state.`
                    : `Only ${state.charge}% charge remains, so the next read or refresh will need the sense amp to restore it soon.`
            );
        } else {
            setBadge(state.charge > 0 ? 'Weak' : 'Zero');
            setText(els.lineState, 'Floating (Z)');
            setText(els.detailState, state.charge > 0 ? `Weak charge ${state.charge}%` : '0 state held');
            setText(
                els.log,
                state.charge > 0
                    ? `Charge has fallen to ${state.charge}% and is now weak. If refreshed now, it may collapse to 0.`
                    : 'The capacitor is currently discharged and holding a 0 state.'
            );
        }
    };
    Object.assign(ctx, { renderSramStable, renderDramStable });
}
