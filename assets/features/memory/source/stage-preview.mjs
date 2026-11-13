export function attachStagePreview(ctx) {
    const {
        root, kind, els, state, setText,
        toggleClass, getOperationKey, setStage, setBadge, paintLine,
        paintRect, setPathStroke, paintGateLines, clearMotion, setChargeVisual,
        resolveSramPreviewBit, resolveDramPreviewCharge, paintSramNodes,
    } = ctx;
    const renderSramStagePreview = (stage) => {
        const operationKey = getOperationKey();
        const currentBit = state.storeBit;
        const previewBit = operationKey === 'read'
            ? (state.storeBit ?? (root.dataset.writeValue || '1'))
            : resolveSramPreviewBit();
        const complement = previewBit === '1' ? '0' : '1';
        const currentComplement = currentBit === null ? null : currentBit === '1' ? '0' : '1';

        clearMotion();
        paintLine(els.wlLine, '#c4b5fd', 3);
        paintLine(els.blLine, currentBit === null ? '#94a3b8' : '#60a5fa', 3.2);
        paintLine(els.blbLine, currentBit === null ? '#94a3b8' : '#60a5fa', 3.2);
        paintGateLines('#cbd5e1', 0.95);
        paintRect(els.accessLeft, '#e2e8f0', '#cbd5e1');
        paintRect(els.accessRight, '#e2e8f0', '#cbd5e1');
        setPathStroke(els.loopTop, '#2563eb', currentBit === null ? 0.55 : 0.95);
        setPathStroke(els.loopBottom, '#16a34a', currentBit === null ? 0.55 : 0.95);
        setStage(stage);

        if (stage === 'idle') {
            setBadge('Idle');
            setText(els.helper, 'Idle preview: the wordline stays low and the cell quietly keeps its current state.');
            if (currentBit === null) {
                setText(els.log, 'Idle state. No bit is stored yet, so the internal nodes remain neutral.');
                setText(els.storeValue, 'None');
                setText(els.lineState, 'Floating (Z)');
                setText(els.detailState, 'Q=? / QB=?');
                setText(els.cellValue, 'Stored: none');
                setText(els.blValue, 'Z');
                setText(els.blbValue, 'Z');
                paintSramNodes(null);
                toggleClass(els.blLine, 'memory-flow-live', true);
                toggleClass(els.blbLine, 'memory-flow-live', true);
                return;
            }

            setText(els.log, `Idle state. Q=${currentBit} / QB=${currentComplement} is maintained by the internal feedback loop.`);
            setText(els.storeValue, currentBit);
            setText(els.lineState, 'BL=1 / BLB=1');
            setText(els.detailState, `Q=${currentBit} / QB=${currentComplement}`);
            setText(els.cellValue, `Stored: ${currentBit}`);
            setText(els.blValue, '1');
            setText(els.blbValue, '1');
            paintSramNodes(currentBit);
            toggleClass(els.qNode, 'memory-pulse-live', true);
            toggleClass(els.qbNode, 'memory-pulse-live', true);
            return;
        }

        if (operationKey === 'read') {
            const readBit = previewBit;
            const readComplement = complement;
            const previewNote = state.storeBit === null
                ? `No stored value exists yet, so this preview assumes a cell storing ${readBit}.`
                : '';

            if (stage === 'slot-a') {
                setBadge('Precharge');
                setText(els.helper, 'Read step 1: precharge BL and BLB high to create the read reference point.');
                setText(els.log, `${previewNote} Before reading, BL and BLB are both driven high so we can observe which side droops first.`.trim());
                setText(els.storeValue, state.storeBit === null ? `Sample ${readBit}` : readBit);
                setText(els.lineState, 'BL=1 / BLB=1');
                setText(els.detailState, 'Read precharge');
                setText(els.cellValue, state.storeBit === null ? `Sample stored bit: ${readBit}` : `Stored: ${readBit}`);
                setText(els.blValue, '1');
                setText(els.blbValue, '1');
                paintLine(els.blLine, '#60a5fa', 3.2);
                paintLine(els.blbLine, '#60a5fa', 3.2);
                paintSramNodes(readBit);
                toggleClass(els.blLine, 'memory-flow-live', true);
                toggleClass(els.blbLine, 'memory-flow-live', true);
                return;
            }

            if (stage === 'slot-b') {
                setBadge('Differential');
                setText(els.helper, 'Read step 2: when WL rises, the stored node creates a tiny differential voltage on the bitline pair.');
                setText(els.log, `${previewNote} Once WL turns on, the stored ${readBit} makes ${readBit === '1' ? 'BLB' : 'BL'} droop slightly, creating a small differential voltage.`.trim());
                setText(els.storeValue, state.storeBit === null ? `Sample ${readBit}` : readBit);
                setText(els.lineState, readBit === '1' ? 'BL holds / BLB droops' : 'BL droops / BLB holds');
                setText(els.detailState, `Q=${readBit} / QB=${readComplement}`);
                setText(els.cellValue, state.storeBit === null ? `Sample stored bit: ${readBit}` : `Stored: ${readBit}`);
                setText(els.blValue, readBit === '1' ? '1' : '0.8');
                setText(els.blbValue, readBit === '1' ? '0.8' : '1');
                paintLine(els.wlLine, '#8b5cf6', 4.2);
                paintGateLines('#8b5cf6', 1, true);
                paintRect(els.accessLeft, '#ddd6fe', '#8b5cf6');
                paintRect(els.accessRight, '#ddd6fe', '#8b5cf6');
                paintLine(readBit === '1' ? els.blLine : els.blbLine, '#2563eb', 3.4);
                paintLine(readBit === '1' ? els.blbLine : els.blLine, '#f59e0b', 3.4);
                paintSramNodes(readBit);
                toggleClass(els.wlLine, 'memory-flow-live', true);
                toggleClass(els.blLine, 'memory-flow-live', true);
                toggleClass(els.blbLine, 'memory-flow-live', true);
                toggleClass(els.qNode, 'memory-pulse-live', true);
                toggleClass(els.qbNode, 'memory-pulse-live', true);
                return;
            }

            if (stage === 'slot-c') {
                setBadge('Sense');
                setText(els.helper, 'Read step 3: the sense amp amplifies the tiny delta, while the SRAM latch itself stays unchanged.');
                setText(els.log, `${previewNote} The sense amp resolves the small voltage delta into a full logic value, but the SRAM latch state is preserved.`.trim());
                setText(els.storeValue, state.storeBit === null ? `Sample ${readBit}` : readBit);
                setText(els.lineState, 'Sense complete');
                setText(els.detailState, `Read ${readBit} / state preserved`);
                setText(els.cellValue, state.storeBit === null ? `Sample stored bit: ${readBit}` : `Stored: ${readBit}`);
                setText(els.blValue, '1');
                setText(els.blbValue, '1');
                paintLine(els.wlLine, '#c4b5fd', 3);
                paintLine(els.blLine, '#60a5fa', 3.2);
                paintLine(els.blbLine, '#60a5fa', 3.2);
                paintGateLines('#cbd5e1', 0.95);
                paintRect(els.accessLeft, '#e2e8f0', '#cbd5e1');
                paintRect(els.accessRight, '#e2e8f0', '#cbd5e1');
                paintSramNodes(readBit);
                toggleClass(els.loopTop, 'memory-flow-live', true);
                toggleClass(els.loopBottom, 'memory-flow-live', true);
                toggleClass(els.qNode, 'memory-pulse-live', true);
                toggleClass(els.qbNode, 'memory-pulse-live', true);
                return;
            }

            setBadge('Read Done');
            setText(els.helper, 'Read done: the cell still keeps its original latch state after the read.');
            setText(els.log, `${previewNote} Even after the read finishes, Q=${readBit} / QB=${readComplement} remains unchanged.`.trim());
            setText(els.storeValue, state.storeBit === null ? `Sample ${readBit}` : readBit);
            setText(els.lineState, 'State held');
            setText(els.detailState, `Q=${readBit} / QB=${readComplement}`);
            setText(els.cellValue, state.storeBit === null ? `Sample stored bit: ${readBit}` : `Stored: ${readBit}`);
            setText(els.blValue, '1');
            setText(els.blbValue, '1');
            paintLine(els.blLine, '#60a5fa', 3.2);
            paintLine(els.blbLine, '#60a5fa', 3.2);
            paintSramNodes(readBit);
            toggleClass(els.loopTop, 'memory-flow-live', true);
            toggleClass(els.loopBottom, 'memory-flow-live', true);
            toggleClass(els.qNode, 'memory-pulse-live', true);
            toggleClass(els.qbNode, 'memory-pulse-live', true);
            return;
        }

        if (stage === 'slot-a') {
            setBadge('Write Drive');
            setText(els.helper, `Write step 1: drive the bitline pair to BL=${previewBit}, BLB=${complement}.`);
            setText(els.log, `The write driver first forces BL=${previewBit} and BLB=${complement} to prepare the cell for a state change.`);
            setText(els.storeValue, currentBit === null ? 'Pending' : currentBit);
            setText(els.lineState, `BL=${previewBit} / BLB=${complement}`);
            setText(els.detailState, `Write ${previewBit} drive`);
            setText(els.cellValue, currentBit === null ? `Pending write ${previewBit}` : `Stored: ${currentBit}`);
            setText(els.blValue, previewBit);
            setText(els.blbValue, complement);
            paintLine(els.blLine, previewBit === '1' ? '#2563eb' : '#fb7185', 3.4);
            paintLine(els.blbLine, complement === '1' ? '#2563eb' : '#fb7185', 3.4);
            paintSramNodes(currentBit);
            toggleClass(els.blLine, 'memory-flow-live', true);
            toggleClass(els.blbLine, 'memory-flow-live', true);
            return;
        }

        if (stage === 'slot-b') {
            setBadge('WL Enable');
            setText(els.helper, 'Write step 2: raising WL turns on the access transistors, and the internal nodes follow the new bitline values.');
            setText(els.log, `As WL turns on, the internal nodes start resolving toward Q=${previewBit} / QB=${complement}.`);
            setText(els.storeValue, currentBit === null ? 'Switching' : currentBit);
            setText(els.lineState, `BL=${previewBit} / BLB=${complement}`);
            setText(els.detailState, 'WL high / access ON');
            setText(els.cellValue, `Resolving to ${previewBit}`);
            setText(els.blValue, previewBit);
            setText(els.blbValue, complement);
            paintLine(els.wlLine, '#8b5cf6', 4.2);
            paintLine(els.blLine, previewBit === '1' ? '#2563eb' : '#fb7185', 3.4);
            paintLine(els.blbLine, complement === '1' ? '#2563eb' : '#fb7185', 3.4);
            paintGateLines('#8b5cf6', 1, true);
            paintRect(els.accessLeft, '#ddd6fe', '#8b5cf6');
            paintRect(els.accessRight, '#ddd6fe', '#8b5cf6');
            paintSramNodes(previewBit);
            toggleClass(els.wlLine, 'memory-flow-live', true);
            toggleClass(els.blLine, 'memory-flow-live', true);
            toggleClass(els.blbLine, 'memory-flow-live', true);
            toggleClass(els.qNode, 'memory-pulse-live', true);
            toggleClass(els.qbNode, 'memory-pulse-live', true);
            return;
        }

        if (stage === 'slot-c') {
            setBadge('Latch Hold');
            setText(els.helper, 'Write step 3: after WL falls again, the cross-coupled inverters lock in the new state.');
            setText(els.log, `The new Q=${previewBit} / QB=${complement} state is now held stably by the feedback loop.`);
            setText(els.storeValue, previewBit);
            setText(els.lineState, 'Feedback hold');
            setText(els.detailState, `Q=${previewBit} / QB=${complement}`);
            setText(els.cellValue, `Stored: ${previewBit}`);
            setText(els.blValue, '1');
            setText(els.blbValue, '1');
            paintLine(els.blLine, '#60a5fa', 3.2);
            paintLine(els.blbLine, '#60a5fa', 3.2);
            paintSramNodes(previewBit);
            toggleClass(els.loopTop, 'memory-flow-live', true);
            toggleClass(els.loopBottom, 'memory-flow-live', true);
            toggleClass(els.qNode, 'memory-pulse-live', true);
            toggleClass(els.qbNode, 'memory-pulse-live', true);
            return;
        }

        setBadge(`Write ${previewBit} Done`);
        setText(els.helper, `Write done: the SRAM cell now holds ${previewBit} without refresh.`);
        setText(els.log, `After the write completes, the SRAM cell stably holds Q=${previewBit} / QB=${complement}.`);
        setText(els.storeValue, previewBit);
        setText(els.lineState, 'Stable hold');
        setText(els.detailState, `Q=${previewBit} / QB=${complement}`);
        setText(els.cellValue, `Stored: ${previewBit}`);
        setText(els.blValue, '1');
        setText(els.blbValue, '1');
        paintLine(els.blLine, '#60a5fa', 3.2);
        paintLine(els.blbLine, '#60a5fa', 3.2);
        paintSramNodes(previewBit);
        toggleClass(els.loopTop, 'memory-flow-live', true);
        toggleClass(els.loopBottom, 'memory-flow-live', true);
        toggleClass(els.qNode, 'memory-pulse-live', true);
        toggleClass(els.qbNode, 'memory-pulse-live', true);
    };
    const renderDramStagePreview = (stage) => {
        const operationKey = getOperationKey();
        const previewCharge = operationKey === 'write1'
            ? 100
            : operationKey === 'write0'
                ? 0
                : resolveDramPreviewCharge();
        const previewBit = previewCharge >= 35 ? '1' : '0';
        const sharedCharge = Math.max(previewCharge - 8, 0);

        clearMotion();
        paintLine(els.wlLine, '#c4b5fd', 3);
        paintLine(els.blLine, '#94a3b8', 3.2);
        paintGateLines('#d8b4fe', 0.95);
        paintRect(els.accessLeft, '#f3e8ff', '#d8b4fe');
        setStage(stage);

        if (stage === 'idle') {
            setBadge('Idle');
            setText(els.helper, 'Idle preview: the capacitor slowly leaks charge over time.');
            setText(els.log, previewCharge > 0
                ? `Idle state. ${previewCharge}% charge remains, so it still reads as '${previewBit}', but it will weaken with time.`
                : 'Idle state. The capacitor is already discharged and remains at 0.');
            setText(els.lineState, 'Floating (Z)');
            setText(els.detailState, previewCharge > 0 ? `Charge decay ${previewCharge}%` : '0 state held');
            setText(els.blValue, 'Z');
            setChargeVisual(previewCharge);
            toggleClass(els.chargeFill, 'memory-pulse-live', true);
            toggleClass(els.chargeValue, 'memory-pulse-live', true);
            toggleClass(els.cellValue, 'memory-pulse-live', true);
            return;
        }

        if (operationKey === 'write1' || operationKey === 'write0') {
            const target = operationKey === 'write1' ? '1' : '0';
            const midCharge = target === '1' ? 58 : 8;

            if (stage === 'slot-a') {
                setBadge(`Write ${target} Drive`);
                setText(els.helper, target === '1'
                    ? 'Write step 1: drive the bitline high to prepare the cell for charging.'
                    : 'Write step 1: drive the bitline low to prepare the cell for discharging.');
                setText(els.log, `The write driver strongly drives BL=${target}. The capacitor does not change until WL turns on.`);
                setText(els.lineState, `BL=${target}`);
                setText(els.detailState, `Write ${target} drive`);
                setText(els.blValue, target);
                setChargeVisual(state.hasCompleted ? state.charge : 0);
                paintLine(els.blLine, target === '1' ? '#2563eb' : '#fb7185', 3.4);
                toggleClass(els.blLine, 'memory-flow-live', true);
                return;
            }

            if (stage === 'slot-b') {
                setBadge(target === '1' ? 'Cell Charge' : 'Cell Discharge');
                setText(els.helper, 'Write step 2: when WL turns on, the capacitor follows the bitline level and charge moves.');
                setText(els.log, target === '1'
                    ? 'As WL rises, charge enters the capacitor and the cell charges toward a 1 state.'
                    : 'As WL rises, charge leaves the capacitor and the cell discharges toward a 0 state.');
                setText(els.lineState, target === '1' ? 'Charge entering cell' : 'Charge leaving cell');
                setText(els.detailState, 'WL high / capacitor follows BL');
                setText(els.blValue, target);
                setChargeVisual(midCharge);
                paintLine(els.wlLine, '#8b5cf6', 4.2);
                paintLine(els.blLine, target === '1' ? '#2563eb' : '#fb7185', 3.4);
                paintGateLines('#8b5cf6', 1, true);
                paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
                toggleClass(els.wlLine, 'memory-flow-live', true);
                toggleClass(els.blLine, 'memory-flow-live', true);
                toggleClass(els.chargeFill, 'memory-pulse-live', true);
                toggleClass(els.chargeValue, 'memory-pulse-live', true);
                return;
            }

            if (stage === 'slot-c') {
                setBadge('Level Restore');
                setText(els.helper, 'Write step 3: the final restore settles the capacitor at its target level.');
                setText(els.log, target === '1'
                    ? 'After restore completes, the capacitor is driven close to 100%, confirming a 1 state.'
                    : 'After restore completes, the capacitor is driven to 0%, confirming a 0 state.');
                setText(els.lineState, 'Sense amp restore');
                setText(els.detailState, target === '1' ? 'Restored to 100%' : 'Restored to 0%');
                setText(els.blValue, target);
                setChargeVisual(target === '1' ? 100 : 0);
                paintLine(els.wlLine, '#8b5cf6', 4.2);
                paintLine(els.blLine, target === '1' ? '#2563eb' : '#fb7185', 3.4);
                paintGateLines('#8b5cf6', 1, true);
                paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
                toggleClass(els.wlLine, 'memory-flow-live', true);
                toggleClass(els.blLine, 'memory-flow-live', true);
                toggleClass(els.refreshText, 'is-visible', true);
                toggleClass(els.chargeFill, 'memory-pulse-live', true);
                toggleClass(els.chargeValue, 'memory-pulse-live', true);
                return;
            }

            setBadge(`Write ${target} Done`);
            setText(els.helper, `Write done: the capacitor is left in the ${target === '1' ? 'charged' : 'discharged'} state.`);
            setText(els.log, target === '1'
                ? 'Write 1 is complete, and the capacitor remains fully charged.'
                : 'Write 0 is complete, and the capacitor remains discharged.');
            setText(els.lineState, 'Charge held');
            setText(els.detailState, target === '1' ? '100% charge held' : '0 state held');
            setText(els.blValue, 'Z');
            setChargeVisual(target === '1' ? 100 : 0);
            toggleClass(els.chargeFill, 'memory-pulse-live', true);
            toggleClass(els.chargeValue, 'memory-pulse-live', true);
            toggleClass(els.cellValue, 'memory-pulse-live', true);
            return;
        }

        if (stage === 'slot-a') {
            setBadge('Precharge');
            setText(els.helper, 'Step 1: set the bitline near 1/2 VDD to create the sensing reference.');
            setText(els.log, 'The bitline is first aligned near 1/2 VDD to create the reference point for charge sharing.');
            setText(els.lineState, 'BL = 1/2 VDD');
            setText(els.detailState, operationKey === 'refresh' ? 'Refresh precharge' : 'Read precharge');
            setText(els.blValue, '0.5');
            setChargeVisual(previewCharge);
            paintLine(els.blLine, '#a78bfa', 3.4);
            toggleClass(els.blLine, 'memory-flow-live', true);
            toggleClass(els.chargeValue, 'memory-pulse-live', true);
            return;
        }

        if (stage === 'slot-b') {
            setBadge(operationKey === 'refresh' ? 'Charge Detect' : 'Charge Sharing');
            setText(els.helper, operationKey === 'refresh'
                ? 'Step 2: sense the remaining cell charge and check whether a 1 can still be restored.'
                : 'Step 2: when WL rises, the capacitor shares charge with the bitline and creates a tiny voltage delta.');
            setText(els.log, operationKey === 'refresh'
                ? (previewBit === '1'
                    ? 'Enough charge remains to still detect a 1, so the next restore phase can recover it.'
                    : 'The remaining charge is too weak, or already gone, so the cell has tilted toward 0.')
                : (previewBit === '1'
                    ? 'The remaining charge pulls the bitline slightly above 0.5V.'
                    : 'Too little charge remains, so the bitline tilts slightly below 0.5V.'));
            setText(els.lineState, previewBit === '1' ? 'BL = 0.5 + dV' : 'BL = 0.5 - dV');
            setText(els.detailState, operationKey === 'refresh' ? 'Weak charge detect' : 'Charge sharing');
            setText(els.blValue, previewBit === '1' ? '0.5+dV' : '0.5-dV');
            setChargeVisual(sharedCharge);
            paintLine(els.blLine, '#a78bfa', 3.4);
            paintLine(els.wlLine, '#8b5cf6', 4.2);
            paintGateLines('#8b5cf6', 1, true);
            paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
            toggleClass(els.blLine, 'memory-flow-live', true);
            toggleClass(els.wlLine, 'memory-flow-live', true);
            toggleClass(els.chargeFill, 'memory-pulse-live', true);
            toggleClass(els.chargeValue, 'memory-pulse-live', true);
            return;
        }

        if (stage === 'slot-c') {
            const restoredCharge = previewBit === '1' ? 100 : 0;
            setBadge(operationKey === 'refresh' ? 'Charge Restore' : 'Sense & Restore');
            setText(els.helper, operationKey === 'refresh'
                ? 'Step 3: drive the detected value back to full level to extend retention.'
                : 'Step 3: the sense amp amplifies the tiny delta, then restores the detected value back into the cell.');
            setText(els.log, previewBit === '1'
                ? (operationKey === 'refresh'
                    ? 'Using the detected 1, the capacitor is filled again to complete the refresh.'
                    : 'The sense amp confirms a 1, then refills the capacitor to restore the read value.')
                : (operationKey === 'refresh'
                    ? 'The sensed result is 0, so the cell remains in the 0 state after restore.'
                    : 'The cell reads as 0, and after restore it still settles at 0.'));
            setText(els.lineState, 'Sense amp restore');
            setText(els.detailState, previewBit === '1' ? 'Restored to 100%' : 'Restored to 0%');
            setText(els.blValue, previewBit);
            setChargeVisual(restoredCharge);
            paintLine(els.blLine, previewBit === '1' ? '#2563eb' : '#fb7185', 3.4);
            paintLine(els.wlLine, '#8b5cf6', 4.2);
            paintGateLines('#8b5cf6', 1, true);
            paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
            toggleClass(els.blLine, 'memory-flow-live', true);
            toggleClass(els.wlLine, 'memory-flow-live', true);
            toggleClass(els.refreshText, 'is-visible', true);
            toggleClass(els.chargeFill, 'memory-pulse-live', true);
            toggleClass(els.chargeValue, 'memory-pulse-live', true);
            return;
        }

        const finalCharge = previewBit === '1' ? 100 : 0;
        setBadge(operationKey === 'refresh' ? 'Refresh Done' : 'Read Done');
        setText(els.helper, operationKey === 'refresh'
            ? 'Refresh done: check the charge state after restore has completed.'
            : 'Read done: check the cell state after the destructive read has been restored.');
        setText(els.log, finalCharge > 0
            ? `${operationKey === 'refresh' ? 'After refresh' : 'After read and restore'}, the capacitor is fully charged again and holds a 1 state.`
            : `${operationKey === 'refresh' ? 'The refresh result' : 'The read result'} leaves the cell in the 0 state.`);
        setText(els.lineState, 'Charge held');
        setText(els.detailState, finalCharge > 0 ? '100% charge held' : '0 state held');
        setText(els.blValue, 'Z');
        setChargeVisual(finalCharge);
        toggleClass(els.chargeFill, 'memory-pulse-live', true);
        toggleClass(els.chargeValue, 'memory-pulse-live', true);
        toggleClass(els.cellValue, 'memory-pulse-live', true);
    };
    const runStagePreview = (stage) => {
        state.previewStage = stage;
        root.dataset.previewStage = stage;
        if (kind === 'sram') {
            renderSramStagePreview(stage);
        } else {
            renderDramStagePreview(stage);
        }
    };
    Object.assign(ctx, { renderSramStagePreview, renderDramStagePreview, runStagePreview });
}
