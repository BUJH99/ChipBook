export function attachActions(ctx) {
    const {
        wait, kind, els, state, setText,
        toggleClass, setButtonsDisabled, setButtonStates, setStage, setBadge,
        setRunning, paintLine, paintRect, paintNode, paintGateLines,
        setChargeVisual, ensureCurrent, resolveDramBit, renderSramStable, renderDramStable,
    } = ctx;
    const finishAction = () => {
        setRunning(false);
        setButtonsDisabled(false);
        if (kind === 'sram') {
            renderSramStable();
        } else {
            renderDramStable();
        }
    };

    const runSramAction = async (action, writeValue) => {
        const token = ++state.sequence;
        setRunning(true);
        setButtonsDisabled(true);
        setButtonStates(action, writeValue);

        if (action === 'read' && state.storeBit === null) {
            setStage('slot-a');
            setBadge('Read');
            setText(els.helper, 'Write a value first, then compare how the read operation behaves.');
            setText(els.log, 'No stored bit exists yet, so a differential read cannot be generated. Write a value first.');
            setText(els.lineState, 'BL=1 / BLB=1');
            setText(els.detailState, 'No valid cell state');
            setText(els.blValue, '1');
            setText(els.blbValue, '1');
            paintLine(els.blLine, '#60a5fa', 3.2);
            paintLine(els.blbLine, '#60a5fa', 3.2);
            toggleClass(els.blLine, 'memory-flow-live', true);
            toggleClass(els.blbLine, 'memory-flow-live', true);
            await wait(600);
            if (!ensureCurrent(token)) return;
            finishAction();
            return;
        }

        if (action === 'write') {
            const target = writeValue;
            const complement = target === '1' ? '0' : '1';

            setStage('slot-a');
            setBadge('Write');
            setText(els.helper, `Write ${target}: first drive the bitline pair to BL=${target}, BLB=${complement}.`);
            setText(els.log, 'The write driver first forces the bitline pair to the target and complement values to prepare the latch for flipping.');
            setText(els.lineState, `BL=${target} / BLB=${complement}`);
            setText(els.detailState, `Write ${target} drive`);
            setText(els.blValue, target);
            setText(els.blbValue, complement);
            paintLine(els.blLine, target === '1' ? '#2563eb' : '#fb7185', 3.4);
            paintLine(els.blbLine, complement === '1' ? '#2563eb' : '#fb7185', 3.4);
            toggleClass(els.blLine, 'memory-flow-live', true);
            toggleClass(els.blbLine, 'memory-flow-live', true);
            await wait(540);
            if (!ensureCurrent(token)) return;

            setStage('slot-b');
            setText(els.helper, 'When WL rises, the access transistors turn on and the internal nodes follow the new bitline values.');
            setText(els.log, 'As WL rises and the access transistors turn on, the internal Q / QB nodes start flipping toward the new data.');
            setText(els.detailState, 'WL high / access ON');
            setText(els.cellValue, `Resolving to ${target}`);
            paintLine(els.wlLine, '#8b5cf6', 4.2);
            toggleClass(els.wlLine, 'memory-flow-live', true);
            paintGateLines('#8b5cf6', 1, true);
            paintRect(els.accessLeft, '#ddd6fe', '#8b5cf6');
            paintRect(els.accessRight, '#ddd6fe', '#8b5cf6');
            paintNode(els.qNode, target === '1' ? '#2563eb' : '#cbd5e1', target === '1' ? '#1d4ed8' : '#94a3b8');
            paintNode(els.qbNode, target === '0' ? '#2563eb' : '#cbd5e1', target === '0' ? '#1d4ed8' : '#94a3b8');
            setText(els.qLabel, `Q=${target}`);
            setText(els.qbLabel, `QB=${complement}`);
            await wait(620);
            if (!ensureCurrent(token)) return;

            state.storeBit = target;
            state.hasCompleted = true;
            setStage('slot-c');
            setText(els.helper, 'Even after WL falls again, the cross-coupled inverter feedback keeps the new state locked in.');
            setText(els.log, 'After the bitlines return, the internal feedback loop locks the value. That is why SRAM does not need refresh.');
            setText(els.lineState, 'Feedback hold');
            setText(els.detailState, `Q=${target} / QB=${complement}`);
            setText(els.storeValue, target);
            setText(els.cellValue, `Stored: ${target}`);
            setText(els.blValue, '1');
            setText(els.blbValue, '1');
            paintLine(els.wlLine, '#c4b5fd', 3);
            paintLine(els.blLine, '#60a5fa', 3.2);
            paintLine(els.blbLine, '#60a5fa', 3.2);
            paintGateLines('#cbd5e1', 0.95);
            toggleClass(els.wlLine, 'memory-flow-live', false);
            toggleClass(els.blLine, 'memory-flow-live', false);
            toggleClass(els.blbLine, 'memory-flow-live', false);
            paintRect(els.accessLeft, '#e2e8f0', '#cbd5e1');
            paintRect(els.accessRight, '#e2e8f0', '#cbd5e1');
            toggleClass(els.loopTop, 'memory-flow-live', true);
            toggleClass(els.loopBottom, 'memory-flow-live', true);
            await wait(620);
            if (!ensureCurrent(token)) return;
            finishAction();
            return;
        }

        const readBit = state.storeBit;
        const readComplement = readBit === '1' ? '0' : '1';
        const droopLine = readBit === '1' ? els.blbLine : els.blLine;
        const holdLine = readBit === '1' ? els.blLine : els.blbLine;
        const droopLabel = readBit === '1' ? els.blbValue : els.blValue;
        const holdLabel = readBit === '1' ? els.blValue : els.blbValue;

        setStage('slot-a');
        setBadge('Read');
        setText(els.helper, 'Read step 1: precharge BL/BLB high, then open WL to create a tiny voltage difference.');
        setText(els.log, 'Before reading, both BL and BLB are precharged high. Then we observe which side the stored value pulls down slightly.');
        setText(els.lineState, 'BL=1 / BLB=1');
        setText(els.detailState, 'Read precharge');
        setText(els.blValue, '1');
        setText(els.blbValue, '1');
        paintLine(els.blLine, '#60a5fa', 3.2);
        paintLine(els.blbLine, '#60a5fa', 3.2);
        toggleClass(els.blLine, 'memory-flow-live', true);
        toggleClass(els.blbLine, 'memory-flow-live', true);
        await wait(520);
        if (!ensureCurrent(token)) return;

        setStage('slot-b');
        setText(els.helper, 'Read step 2: when WL rises, the stored node creates a tiny differential voltage on the bitline pair.');
        setText(els.log, `As WL rises, the stored ${readBit} makes ${readBit === '1' ? 'BLB' : 'BL'} droop slightly, so the sense amp can detect the difference.`);
        setText(els.lineState, readBit === '1' ? 'BL holds / BLB droops' : 'BL droops / BLB holds');
        setText(els.detailState, `Q=${readBit} / QB=${readComplement}`);
        paintLine(els.wlLine, '#8b5cf6', 4.2);
        toggleClass(els.wlLine, 'memory-flow-live', true);
        paintGateLines('#8b5cf6', 1, true);
        paintRect(els.accessLeft, '#ddd6fe', '#8b5cf6');
        paintRect(els.accessRight, '#ddd6fe', '#8b5cf6');
        paintLine(holdLine, '#2563eb', 3.4);
        paintLine(droopLine, '#f59e0b', 3.4);
        setText(holdLabel, '1');
        setText(droopLabel, '0.8');
        await wait(620);
        if (!ensureCurrent(token)) return;

        setStage('slot-c');
        setText(els.helper, 'Read step 3: the sense amp amplifies the tiny voltage delta, but the SRAM latch state is not disturbed.');
        setText(els.log, 'The sense amp resolves the small voltage difference into a clear value, while the cell latch keeps its original state. SRAM read is non-destructive.');
        setText(els.lineState, 'Sense complete');
        setText(els.detailState, `Read ${readBit} / state preserved`);
        setText(els.cellValue, `Stored: ${readBit}`);
        paintLine(els.wlLine, '#c4b5fd', 3);
        paintGateLines('#cbd5e1', 0.95);
        paintRect(els.accessLeft, '#e2e8f0', '#cbd5e1');
        paintRect(els.accessRight, '#e2e8f0', '#cbd5e1');
        toggleClass(els.wlLine, 'memory-flow-live', false);
        toggleClass(els.loopTop, 'memory-flow-live', true);
        toggleClass(els.loopBottom, 'memory-flow-live', true);
        state.hasCompleted = true;
        await wait(620);
        if (!ensureCurrent(token)) return;
        finishAction();
    };

    const runDramAction = async (action, writeValue) => {
        const token = ++state.sequence;
        const startingCharge = state.charge;
        const sensedBit = resolveDramBit();

        setRunning(true);
        setButtonsDisabled(true);
        setButtonStates(action, writeValue);

        if (action === 'write') {
            const target = writeValue;
            const targetCharge = target === '1' ? 100 : 0;

            setStage('slot-a');
            setBadge('Write');
            setText(
                els.helper,
                target === '1'
                    ? 'Write 1: drive BL high to prepare charging the capacitor.'
                    : 'Write 0: drive BL low to prepare discharging the capacitor.'
            );
            setText(els.log, 'The write driver strongly drives the bitline to the target level. The capacitor does not change until WL turns on.');
            setText(els.lineState, `BL=${target}`);
            setText(els.detailState, `Write ${target} drive`);
            setText(els.blValue, target);
            paintLine(els.blLine, target === '1' ? '#2563eb' : '#fb7185', 3.4);
            toggleClass(els.blLine, 'memory-flow-live', true);
            await wait(520);
            if (!ensureCurrent(token)) return;

            setStage('slot-b');
            setText(els.helper, 'When WL rises, the capacitor follows the bitline level through the access transistor and charge moves.');
            setText(
                els.log,
                target === '1'
                    ? 'As WL rises, charge enters the capacitor and the cell charges toward a 1 state.'
                    : 'As WL rises, charge leaves the capacitor and the cell discharges toward a 0 state.'
            );
            setText(els.lineState, target === '1' ? 'Charge entering cell' : 'Charge leaving cell');
            setText(els.detailState, 'WL high / capacitor follows BL');
            paintLine(els.wlLine, '#8b5cf6', 4.2);
            toggleClass(els.wlLine, 'memory-flow-live', true);
            paintGateLines('#8b5cf6', 1, true);
            paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
            setChargeVisual(target === '1' ? 58 : 8);
            await wait(620);
            if (!ensureCurrent(token)) return;

            state.charge = targetCharge;
            state.hasCompleted = true;
            setStage('slot-c');
            setText(els.helper, 'In the final restore phase, the DRAM cell charge settles to its target level.');
            setText(
                els.log,
                target === '1'
                    ? 'The restore phase drives the remaining charge all the way up, leaving the capacitor close to 100%.'
                    : 'The restore phase confirms the low level and finishes with the capacitor at 0.'
            );
            setText(els.lineState, 'Sense amp restore');
            setText(els.detailState, `Restored to ${targetCharge}%`);
            paintGateLines('#8b5cf6', 1, true);
            toggleClass(els.refreshText, 'is-visible', true);
            setChargeVisual(targetCharge);
            await wait(620);
            if (!ensureCurrent(token)) return;
            finishAction();
            return;
        }

        if (action === 'read') {
            setStage('slot-a');
            setBadge('Read');
            setText(els.helper, 'Read step 1: precharge the bitline near 1/2 VDD, then sense a tiny voltage difference.');
            setText(els.log, 'BL is first aligned near 1/2 VDD. DRAM read starts by measuring a very small voltage difference from that point.');
            setText(els.lineState, 'BL = 1/2 VDD');
            setText(els.detailState, 'Read precharge');
            setText(els.blValue, '0.5');
            paintLine(els.blLine, '#a78bfa', 3.4);
            toggleClass(els.blLine, 'memory-flow-live', true);
            await wait(520);
            if (!ensureCurrent(token)) return;

            setStage('slot-b');
            setText(els.helper, 'Read step 2: when WL rises, the capacitor charge mixes with the bitline and nudges it slightly above or below 0.5V.');
            setText(
                els.log,
                sensedBit === '1'
                    ? 'The remaining charge pulls the bitline slightly above 0.5V. The difference is tiny, but still enough for the sense amp to detect.'
                    : 'Very little charge remains, so the bitline tilts slightly below 0.5V. A weak cell can be judged as 0 at this point.'
            );
            setText(els.lineState, sensedBit === '1' ? 'BL = 0.5 + dV' : 'BL = 0.5 - dV');
            setText(els.detailState, 'Charge sharing');
            setText(els.blValue, sensedBit === '1' ? '0.5+dV' : '0.5-dV');
            paintLine(els.wlLine, '#8b5cf6', 4.2);
            toggleClass(els.wlLine, 'memory-flow-live', true);
            paintGateLines('#8b5cf6', 1, true);
            paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
            setChargeVisual(Math.max(startingCharge - 10, 0));
            await wait(620);
            if (!ensureCurrent(token)) return;

            state.charge = sensedBit === '1' ? 100 : 0;
            state.hasCompleted = true;
            setStage('slot-c');
            setText(els.helper, 'Read step 3: because DRAM read is destructive, the sense amp must immediately restore the detected value.');
            setText(
                els.log,
                sensedBit === '1'
                    ? 'The sense amp confirms a 1 and immediately refills the capacitor with charge.'
                    : startingCharge > 0
                        ? 'The charge was too weak, so the cell was judged as 0. After restore, it still settles at 0.'
                        : 'The cell read as 0, and after restore the 0 state is written back unchanged.'
            );
            setText(els.lineState, 'Sense amp restore');
            setText(els.detailState, sensedBit === '1' ? 'Read 1 -> restore 100%' : 'Read 0 -> restore 0%');
            paintGateLines('#8b5cf6', 1, true);
            toggleClass(els.refreshText, 'is-visible', true);
            setChargeVisual(state.charge);
            await wait(620);
            if (!ensureCurrent(token)) return;
            finishAction();
            return;
        }

        setStage('slot-a');
        setBadge('Refresh');
        setText(els.helper, 'Refresh step 1: start from precharge so the weakened charge can be read again.');
        setText(els.log, 'Refresh also follows the sequence precharge -> charge sharing -> restore. The key is whether enough charge still remains.');
        setText(els.lineState, 'BL = 1/2 VDD');
        setText(els.detailState, 'Refresh precharge');
        setText(els.blValue, '0.5');
        paintLine(els.blLine, '#a78bfa', 3.4);
        toggleClass(els.blLine, 'memory-flow-live', true);
        await wait(500);
        if (!ensureCurrent(token)) return;

        setStage('slot-b');
        setText(els.helper, 'Refresh step 2: sense the remaining charge. If it is too weak, a stored 1 can no longer survive.');
        setText(
            els.log,
            sensedBit === '1'
                ? 'Enough charge remains to still detect a 1, so the sense amp can restore the original full level.'
                : startingCharge > 0
                    ? 'The charge is already too weak at refresh time and has tilted toward 0. In this case, refresh cannot rescue the 1.'
                    : 'The cell is already discharged to 0, so refresh only reconfirms that 0 state.'
        );
        setText(els.lineState, sensedBit === '1' ? 'BL = 0.5 + dV' : 'BL = 0.5 - dV');
        setText(els.detailState, 'Weak charge detect');
        setText(els.blValue, sensedBit === '1' ? '0.5+dV' : '0.5-dV');
        paintLine(els.wlLine, '#8b5cf6', 4.2);
        toggleClass(els.wlLine, 'memory-flow-live', true);
        paintGateLines('#8b5cf6', 1, true);
        paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
        setChargeVisual(Math.max(startingCharge - 6, 0));
        await wait(580);
        if (!ensureCurrent(token)) return;

        state.charge = sensedBit === '1' ? 100 : 0;
        state.hasCompleted = true;
        setStage('slot-c');
        setText(els.helper, 'Refresh step 3: drive the detected value back to full level to extend retention.');
        setText(
            els.log,
            sensedBit === '1'
                ? 'Refresh succeeds: the sense amp restores the weakened charge back close to 100%.'
                : 'The refresh result is still 0. Once the data is gone, refresh only reinforces that lost state.'
        );
        setText(els.lineState, 'Refresh restore');
        setText(els.detailState, sensedBit === '1' ? 'Charge restored to 100%' : '0 state held');
        paintGateLines('#8b5cf6', 1, true);
        toggleClass(els.refreshText, 'is-visible', true);
        setChargeVisual(state.charge);
        await wait(620);
        if (!ensureCurrent(token)) return;
        finishAction();
    };
    Object.assign(ctx, { finishAction, runSramAction, runDramAction });
}
