/* Responsive SVG waveform workbench. Cursor reads always use source samples. */
(function () {
    'use strict';
    const core = window.ChipBookWaveformCore;
    if (!core) return;
    let instance = 0;
    const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const paths = {
        minus: '<path d="M5 12h14"/>', plus: '<path d="M5 12h14M12 5v14"/>',
        fit: '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M8 12h8"/>',
        pan: '<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3"/>',
        signals: '<path d="M3 6h5l3 12 4-12h6M3 12h3m12 0h3"/>',
        import: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/>',
        export: '<path d="M12 15V3m-4 4 4-4 4 4M4 15v5h16v-5"/>',
        range: '<path d="M5 4v16M19 4v16M8 12h8m-6-2-2 2 2 2m4-4 2 2-2 2"/>',
        reset: '<path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/>'
    };
    const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
    function create(root, options) {
        const uid = 'wave-' + (++instance), query = s => root.querySelector(s);
        const button = (action, label, name, extra) => '<button type="button" data-wa-action="' + action + '" title="' + esc(label) + '" aria-label="' + esc(label) + '" ' + (extra || '') + '>' + (name ? icon(name) : '') + (name ? '<span>' + esc(label) + '</span>' : esc(label)) + '</button>';
        root.className = 'mf-wave-analyzer';
        root.innerHTML = '<div class="wa-heading"><div class="wa-title"><h5>WaveForm</h5><span class="wa-source-badge" data-wa-source></span></div><span class="wa-resolution" data-wa-resolution></span></div>' +
            '<div class="wa-toolbar" role="toolbar" aria-label="파형 분석 도구"><div class="wa-tools wa-cursor-tools">' +
            button('cursor-a', 'A', null, 'aria-pressed="false"') + button('cursor-b', 'B', null, 'aria-pressed="true"') + button('pan', '이동', 'pan', 'aria-pressed="false"') +
            '<span class="wa-separator"></span>' + button('zoom-in', '확대', 'plus', 'class="wa-square"') + button('zoom-out', '축소', 'minus', 'class="wa-square"') + button('fit', '전체', 'fit') + button('zoom-ab', 'A–B', 'range') + '</div>' +
            '<div class="wa-tools wa-file-tools">' + button('signals', '신호', 'signals', 'aria-expanded="false" aria-controls="' + uid + '-signals"') + button('import', '불러오기', 'import') +
            '<div class="wa-export-wrap">' + button('export', '내보내기', 'export', 'aria-expanded="false" aria-controls="' + uid + '-export"') +
            '<div class="wa-export-menu" id="' + uid + '-export" hidden>' + button('export-svg', '현재 화면 · SVG') + button('export-csv', 'A–B 원본 값 · CSV') + '</div></div></div></div>' +
            '<div class="wa-signals" id="' + uid + '-signals" hidden><div class="wa-signal-head"><label>신호 찾기 <input type="search" data-wa-search placeholder="이름 또는 계층 검색"></label><label>Bus 표시 <select data-wa-radix><option value="hex">HEX</option><option value="bin">BIN</option></select></label></div><div class="wa-signal-options" data-wa-signal-options></div><p>최대 12개 표시</p></div>' +
            '<input type="file" data-wa-file accept=".csv,.tsv,.txt,.vcd" hidden><div class="wa-file-context" data-wa-file-context hidden><span data-wa-filename></span>' + button('model', '모델로 돌아가기', 'reset') + '</div>' +
            '<div class="wa-error" data-wa-error role="alert" hidden></div>' +
            '<div class="wa-plot-shell"><div class="wa-legend" data-wa-legend></div><div class="wa-plot" data-wa-plot tabindex="0" role="group" aria-label="파형. A 또는 B 커서를 선택하고 클릭하거나 좌우 화살표로 이동. Shift는 큰 간격, Ctrl+휠은 확대. Home은 전체 보기."></div><div class="wa-plot-foot"><span data-wa-axis></span><span data-wa-view></span></div></div>' +
            '<div class="wa-readouts"><label class="wa-cursor-field is-a"><span>A</span><input data-wa-a type="number" step="any" aria-label="A 커서 위치"><small data-wa-xunit></small></label><label class="wa-cursor-field is-b"><span>B</span><input data-wa-b type="number" step="any" aria-label="B 커서 위치"><small data-wa-xunit></small></label><div class="wa-delta"><span>Δ |B − A|</span><strong data-wa-delta></strong></div></div>' +
            '<details class="wa-measurements" open><summary><span>Measurements <small>A / B / Δ</small></span></summary><div class="wa-table-wrap"><table><thead><tr><th scope="col">Signal</th><th scope="col">A</th><th scope="col">B</th><th scope="col">B − A</th><th scope="col">Unit</th></tr></thead><tbody data-wa-values></tbody></table></div>' +
            '<div class="wa-stat-head"><label>A–B 구간 통계 <select data-wa-stat-signal aria-label="구간 통계 신호"></select></label></div><div class="wa-stat-grid" data-wa-stats></div></details>' +
            '<p class="mf-sr-only" aria-live="polite" data-wa-live></p>';
        let source, modelData, fileData, visible = new Set(), view = [0, 1], a = 0.25, b = 0.58, active = 'b', radix = 'hex';
        let width = 800, geometry, layoutFrame = 0, cursorFrame = 0, statsTimer = 0, drag = null, disposed = false;
        let tableRows = [], cursorNodes, renderedPoints = 0, lastStatsAt = 0;
        const plot = query('[data-wa-plot]');
        query('[data-wa-action="import"]').title = 'CSV / TSV / VCD · 최대 20 MB, 64개 신호 · 로컬 파일 분석';
        const valueText = (channel, value) => channel.kind === 'bus' ? core.busFormat(value, radix) : core.format(value);
        const currentChannels = () => source ? source.channels.filter(c => visible.has(c.id)) : [];
        const timeText = x => core.format(x) + ' ' + source.xUnit;
        function say(text) { query('[data-wa-live]').textContent = text; }
        function error(text) { const el = query('[data-wa-error]'); el.textContent = text || ''; el.hidden = !text; if (text) say(text); }
        function setSource(next, progress) {
            source = next; error(''); view = next.domain.slice(); a = view[0] + (view[1] - view[0]) * 0.25;
            b = progress === undefined ? view[0] + (view[1] - view[0]) * 0.75 : progress;
            visible = new Set(next.channels.filter(c => c.visible).slice(0, 12).map(c => c.id));
            if (!visible.size) visible.add(next.channels[0].id);
            root.dataset.source = next.kind; root.dataset.format = next.format || 'MODEL';
            query('[data-wa-source]').textContent = next.kind === 'model' ? 'MODEL' : next.format;
            query('[data-wa-resolution]').textContent = next.channels.length + '개 신호';
            query('[data-wa-axis]').textContent = next.xLabel + ' [' + next.xUnit + ']';
            query('[data-wa-file-context]').hidden = next.kind !== 'file';
            query('[data-wa-filename]').textContent = next.name;
            root.querySelectorAll('[data-wa-xunit]').forEach(el => { el.textContent = next.xUnit; });
            ['a', 'b'].forEach(k => { query('[data-wa-' + k + ']').min = next.domain[0]; query('[data-wa-' + k + ']').max = next.domain[1]; });
            const overlapped = !next.channels.some(c => c.traces.some(t => t.role === 'vulnerable'));
            query('[data-wa-legend]').innerHTML = next.kind === 'model' ? '<span><i style="--trace:#2563eb"></i>정상 / 공통</span><span><i class="is-dashed" style="--trace:' + next.comparisonColor + '"></i>' + esc(next.comparisonLabel + (overlapped ? ' · 정상과 동일' : '')) + '</span><span><i class="is-threshold"></i>판정 기준</span>' : '<span>원본 파일 값</span><span><i class="is-unknown"></i>X / Z / no data</span>';
            query('[data-wa-stat-signal]').value = '';
            buildSignalPicker(); buildTable(); scheduleLayout();
            if (options.onSourceChange) options.onSourceChange(next.kind);
        }
        function buildSignalPicker() {
            query('[data-wa-signal-options]').innerHTML = source.channels.map(c => '<label data-wa-signal-row><input type="checkbox" data-wa-signal="' + c.id + '" ' + (visible.has(c.id) ? 'checked' : '') + '><span title="' + esc(c.name) + '">' + esc(c.name) + '</span><small>' + esc(c.unit) + '</small></label>').join('');
            query('[data-wa-search]').value = '';
        }
        function buildTable() {
            const list = currentChannels(), previous = query('[data-wa-stat-signal]').value;
            const traces = list.flatMap(c => c.traces.map(t => ({ c, t })));
            query('[data-wa-values]').innerHTML = traces.map(({ c, t }) => '<tr><th scope="row" title="' + esc(c.name + ' · ' + t.label) + '"><i style="--trace:' + t.color + '"></i><span>' + esc(c.name) + '</span><small>' + esc(t.label) + '</small></th><td></td><td></td><td></td><td>' + esc(c.unit) + '</td></tr>').join('');
            tableRows = traces.map((item, i) => ({ ...item, cells: query('[data-wa-values]').children[i].querySelectorAll('td') }));
            query('[data-wa-stat-signal]').innerHTML = traces.map(({ c, t }) => '<option value="' + t.id + '">' + esc(c.name + ' · ' + t.label) + '</option>').join('');
            const preferred = traces.find(({ c, t }) => c.threshold && t.role === 'vulnerable') || traces.find(({ c }) => c.threshold) || traces.find(({ c }) => c.kind === 'analog');
            if (traces.some(({ t }) => t.id === previous)) query('[data-wa-stat-signal]').value = previous;
            else if (preferred) query('[data-wa-stat-signal]').value = preferred.t.id;
            drawCursor(); updateStats();
        }
        function channelRange(c) {
            if (c.range) return c.range;
            if (c.kind !== 'analog') return [0, 1];
            let min = Infinity, max = -Infinity;
            c.traces.forEach(t => { for (const y of t.y) if (Number.isFinite(y)) { min = Math.min(min, y); max = Math.max(max, y); } });
            if (!Number.isFinite(min)) return [0, 1];
            if (min === max) { const pad = Math.abs(min) * 0.1 || 0.5; min -= pad; max += pad; }
            const pad = (max - min) * 0.08;
            c.range = [min - pad, max + pad]; return c.range;
        }
        function scheduleLayout() {
            if (!layoutFrame && !disposed) layoutFrame = requestAnimationFrame(() => { layoutFrame = 0; drawPlot(); });
        }
        function drawPlot() {
            if (!source || disposed) return;
            width = Math.max(160, Math.round(plot.getBoundingClientRect().width || width));
            const mobile = width < 560, left = mobile ? 81 : 124, right = width - 18, top = 43, lane = mobile ? 61 : 65;
            const channels = currentChannels(), bottom = top + channels.length * lane, height = bottom + 31, span = right - left;
            geometry = { left, right, top, bottom, width, height, span, lane };
            const px = x => left + (x - view[0]) / (view[1] - view[0]) * span;
            const grid = core.ticks(view[0], view[1], mobile ? 3 : 7);
            let svg = '<svg xmlns="http://www.w3.org/2000/svg" class="wa-svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-labelledby="' + uid + '-title ' + uid + '-desc"><title id="' + uid + '-title">' + esc(source.name + ' waveform') + '</title><desc id="' + uid + '-desc">' + esc((source.kind === 'model' ? 'MODEL' : source.format) + '. ' + source.xLabel + ' [' + source.xUnit + ']. ' + channels.map(c => c.name).join(', ')) + '</desc>' +
                '<rect width="100%" height="100%" fill="#ffffff"/><defs><clipPath id="' + uid + '-clip"><rect x="' + left + '" y="' + top + '" width="' + span + '" height="' + (bottom - top) + '"/></clipPath></defs>';
            grid.forEach(x => { svg += '<path d="M' + px(x) + ' ' + top + 'V' + bottom + '" stroke="#dce4ee" stroke-width=".7"/><text x="' + px(x) + '" y="' + (bottom + 21) + '" text-anchor="middle" fill="#62748e" font-size="11">' + core.format(x, 4) + '</text>'; });
            let lastLabel = -Infinity;
            source.events.filter(e => e.x >= view[0] && e.x <= view[1]).forEach(e => {
                const x = px(e.x), labelWidth = e.label.length * 8 + 12;
                svg += '<path d="M' + x + ' ' + (top - 3) + 'V' + bottom + '" stroke="#a3b1c5" stroke-width=".7" stroke-dasharray="3 5"/>';
                if (x - labelWidth / 2 > lastLabel) {
                    const labelX = core.clamp(x, left + labelWidth / 2, right - labelWidth / 2);
                    svg += '<text x="' + labelX + '" y="14" text-anchor="middle" fill="#66768e" font-size="10">' + esc(e.label) + '</text>';
                    lastLabel = labelX + labelWidth / 2 + 6;
                }
            });
            renderedPoints = 0;
            const lanes = [];
            channels.forEach((c, index) => {
                const yTop = top + index * lane, yBase = yTop + lane - 12, yHeight = lane - 22, range = channelRange(c);
                const py = y => yBase - (y - range[0]) / (range[1] - range[0]) * yHeight;
                lanes.push({ c, py, yTop });
                const label = c.name.length > (mobile ? 11 : 16) ? '…' + c.name.slice(mobile ? -10 : -15) : c.name;
                svg += '<path d="M8 ' + (yTop + lane) + 'H' + right + '" stroke="#e5eaf2" stroke-width=".7"/>' +
                    '<text x="12" y="' + (yTop + 20) + '" fill="#253a57" font-size="' + (mobile ? 10 : 12) + '" font-weight="600"><title>' + esc(c.name) + '</title>' + esc(label) + '</text><text x="12" y="' + (yTop + 37) + '" fill="#687a94" font-size="10">' + esc(c.unit) + '</text>';
                if (c.kind !== 'bus') {
                    [range[0], range[1]].forEach(v => { svg += '<text x="' + (left - 7) + '" y="' + (py(v) + 3) + '" text-anchor="end" fill="#687a94" font-size="10">' + core.format(v, 3) + '</text>'; });
                    svg += '<path d="M' + left + ' ' + yBase + 'H' + right + '" stroke="#d4deec" stroke-width=".6"/>';
                }
                if (c.threshold) {
                    const y = py(c.threshold.value);
                    svg += '<path d="M' + left + ' ' + y + 'H' + right + '" stroke="#b17a27" stroke-width=".8" stroke-dasharray="4 4"/><text x="' + (right - 4) + '" y="' + (y - 4) + '" text-anchor="end" fill="#916014" font-size="10">' + core.format(c.threshold.value) + ' · ' + esc(mobile ? '기준' : c.threshold.label) + '</text>';
                }
                c.traces.forEach(t => {
                    if (c.kind === 'bus') { svg += drawBus(t, c, px, yTop, lane, left, right); return; }
                    const points = core.envelope(t, view[0], view[1], Math.ceil(span)); renderedPoints += points.length;
                    let d = '', previous = null, unknownStart = null, unknownValue = null;
                    const unknowns = [];
                    points.forEach((p, j) => {
                        if (typeof p[1] === 'string') {
                            if (unknownStart === null || unknownValue !== p[1]) { if (unknownStart !== null) unknowns.push([unknownStart, p[0], unknownValue]); unknownStart = p[0]; unknownValue = p[1]; }
                        } else if (unknownStart !== null) { unknowns.push([unknownStart, p[0], unknownValue]); unknownStart = null; }
                        if (!Number.isFinite(p[1])) {
                            if (previous && t.interpolation === 'step') d += 'H' + px(p[0]).toFixed(2);
                            previous = null; return;
                        }
                        const x = px(p[0]).toFixed(2), y = py(p[1]).toFixed(2);
                        d += previous ? t.interpolation === 'step' ? 'H' + x + 'V' + y : 'L' + x + ' ' + y : 'M' + x + ' ' + y;
                        previous = p;
                        if (j === points.length - 1 && unknownStart !== null) unknowns.push([unknownStart, p[0], unknownValue]);
                    });
                    if (unknownStart !== null) unknowns.push([unknownStart, view[1], unknownValue]);
                    svg += '<path d="' + d + '" fill="none" stroke="' + t.color + '" stroke-width="1.8" vector-effect="non-scaling-stroke"' + (t.role === 'vulnerable' ? ' stroke-dasharray="6 3"' : '') + ' clip-path="url(#' + uid + '-clip)"/>';
                    unknowns.forEach(([x0, x1, v]) => {
                        const x = px(x0), w = px(x1) - x;
                        svg += '<rect x="' + x + '" y="' + (yTop + 12) + '" width="' + Math.max(0, w) + '" height="' + (lane - 24) + '" fill="#ba789b" opacity=".24"/>';
                        if (w > 14) svg += '<text x="' + (x + w / 2) + '" y="' + (yTop + 35) + '" text-anchor="middle" fill="#9b426a" font-size="11">' + esc(v) + '</text>';
                    });
                });
            });
            svg += '<g clip-path="url(#' + uid + '-clip)"><rect data-wa-window y="' + top + '" height="' + (bottom - top) + '" fill="#9389d5" opacity=".07"/><g data-wa-dots></g></g>' +
                '<g data-wa-cursor-a><path stroke="#8254c7" stroke-width="1" stroke-dasharray="4 3"/><rect y="23" width="22" height="18" rx="3" fill="#8555c8"/><text y="36" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">A</text></g>' +
                '<g data-wa-cursor-b><path stroke="#148b94" stroke-width="1"/><rect y="23" width="22" height="18" rx="3" fill="#268b93"/><text y="36" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">B</text></g></svg>';
            plot.innerHTML = svg;
            cursorNodes = { a: query('[data-wa-cursor-a]'), b: query('[data-wa-cursor-b]'), window: query('[data-wa-window]'), dots: query('[data-wa-dots]'), lanes };
            query('[data-wa-view]').textContent = core.format(view[0]) + ' — ' + core.format(view[1]) + ' · ' + core.format((source.domain[1] - source.domain[0]) / (view[1] - view[0]), 3) + '×';
            root.dataset.viewStart = view[0]; root.dataset.viewEnd = view[1]; root.dataset.visibleSignals = channels.length;
            root.dataset.renderedPoints = renderedPoints;
            drawCursor();
        }
        function drawBus(t, c, px, yTop, lane, left, right) {
            const pts = core.pointsIn(t, view[0], view[1]); let html = '', i = 0;
            while (i < pts.length - 1) {
                const x0 = Math.max(left, px(pts[i][0])); let end = i + 1;
                while (end < pts.length - 1 && px(pts[end][0]) - x0 < 5) end++;
                const x1 = Math.min(right, px(pts[end][0])), w = x1 - x0;
                const value = end > i + 1 ? '…' : valueText(c, pts[i][1]);
                const unknown = value === '—' || /[XZ]/.test(value);
                const top = yTop + 12, bottom = yTop + lane - 12, mid = (top + bottom) / 2, neck = Math.min(4, w / 2);
                if (w > 0) {
                    html += '<path d="M' + x0 + ' ' + mid + 'L' + (x0 + neck) + ' ' + top + 'H' + (x1 - neck) + 'L' + x1 + ' ' + mid + 'L' + (x1 - neck) + ' ' + bottom + 'H' + (x0 + neck) + 'Z" stroke="' + (unknown ? '#ad527f' : t.color) + '" stroke-width="1" fill="' + (unknown ? '#fbecf3' : '#eef5fd') + '"/>';
                    if (w > value.length * 6.7 + 10) html += '<text x="' + (x0 + w / 2) + '" y="' + (mid + 4) + '" fill="#354e6d" font-size="11" text-anchor="middle">' + esc(value) + '</text>';
                    renderedPoints++;
                }
                i = end;
            }
            return html;
        }
        function drawCursor() {
            if (!source) return;
            root.dataset.cursorA = a; root.dataset.cursorB = b; root.dataset.activeCursor = active;
            const fields = { a, b };
            for (const k of ['a', 'b']) {
                const field = query('[data-wa-' + k + ']');
                if (document.activeElement !== field) field.value = Number(fields[k].toPrecision(10));
            }
            query('[data-wa-delta]').textContent = timeText(Math.abs(b - a));
            tableRows.forEach(({ c, t, cells }) => {
                const va = core.valueAt(t, a), vb = core.valueAt(t, b);
                const values = [valueText(c, va), valueText(c, vb), c.kind !== 'bus' && Number.isFinite(va) && Number.isFinite(vb) ? core.format(vb - va) : '—'];
                values.forEach((v, j) => { if (cells[j].textContent !== v) cells[j].textContent = v; });
            });
            if (!cursorNodes || !geometry) return;
            const { left, right, span, top, bottom } = geometry, px = v => left + (v - view[0]) / (view[1] - view[0]) * span;
            ['a', 'b'].forEach(k => {
                const x = px(fields[k]), el = cursorNodes[k], inView = x >= left - 0.1 && x <= right + 0.1;
                el.style.display = inView ? '' : 'none';
                el.querySelector('path').setAttribute('d', 'M' + x + ' ' + top + 'V' + bottom);
                const labelX = core.clamp(x, left + 11, right - 11);
                el.querySelector('rect').setAttribute('x', labelX - 11); el.querySelector('text').setAttribute('x', labelX);
            });
            const start = core.clamp(Math.min(px(a), px(b)), left, right), end = core.clamp(Math.max(px(a), px(b)), left, right);
            cursorNodes.window.setAttribute('x', start); cursorNodes.window.setAttribute('width', end - start);
            let dots = '';
            cursorNodes.lanes.forEach(({ c, py }) => { if (c.kind === 'bus') return; c.traces.forEach(t => {
                for (const x of [a, b]) { const v = core.valueAt(t, x); if (Number.isFinite(v) && x >= view[0] && x <= view[1]) dots += '<circle cx="' + px(x) + '" cy="' + py(v) + '" r="2.6" fill="' + t.color + '" stroke="#ffffff" stroke-width="1"/>'; }
            }); });
            cursorNodes.dots.innerHTML = dots;
        }
        function updateStats() {
            clearTimeout(statsTimer); statsTimer = 0; lastStatsAt = performance.now();
            const item = tableRows.find(({ t }) => t.id === query('[data-wa-stat-signal]').value);
            if (!item) return;
            const { c, t } = item, panel = query('[data-wa-stats]');
            if (c.kind === 'bus') { panel.innerHTML = '<span class="wa-stat-empty">Bus는 A/B 표에서 비교</span>'; return; }
            const s = core.statistics(t, a, b), edges = c.kind === 'analog' ? core.edgeTimes(t, a, b) : { rise: null, fall: null };
            const stats = [['Min', s.min, c.unit], ['Max', s.max, c.unit], ['Mean', s.mean, c.unit], ['RMS', s.rms, c.unit], ['Coverage', s.coverage === null ? null : s.coverage * 100, '%'], ['Rise 10–90%', edges.rise, source.xUnit], ['Fall 90–10%', edges.fall, source.xUnit]];
            panel.innerHTML = stats.map(([label, value, unit]) => '<div><span>' + label + '</span><strong>' + core.format(value, 4) + '</strong><small>' + esc(unit) + '</small></div>').join('');
        }
        function deferStats() {
            if (!statsTimer) statsTimer = setTimeout(updateStats, Math.max(40, 180 - (performance.now() - lastStatsAt)));
        }
        function setCursor(value, commit) {
            if (!source) return;
            value = core.clamp(value, source.domain[0], source.domain[1]);
            if (active === 'a') a = value; else b = value;
            if (source.kind === 'model' && active === 'b' && options.onSeek) options.onSeek(b);
            drawCursor(); if (commit) updateStats(); else deferStats();
        }
        function setActive(which) {
            active = which; root.dataset.activeCursor = which;
            ['a', 'b'].forEach(k => query('[data-wa-action="cursor-' + k + '"]').setAttribute('aria-pressed', String(which === k)));
            query('[data-wa-action="pan"]').setAttribute('aria-pressed', String(which === 'pan'));
            plot.dataset.mode = which;
        }
        function setView(start, end) {
            const domain = source.domain, total = domain[1] - domain[0], length = core.clamp(end - start, total / 1e6, total);
            start = core.clamp(start, domain[0], domain[1] - length); view = [start, start + length]; scheduleLayout();
        }
        function zoom(factor, centre) {
            if (!source) return;
            if (centre === undefined) centre = (a + b) / 2 >= view[0] && (a + b) / 2 <= view[1] ? (a + b) / 2 : (view[0] + view[1]) / 2;
            const fraction = (centre - view[0]) / (view[1] - view[0]), length = (view[1] - view[0]) * factor;
            setView(centre - length * fraction, centre + length * (1 - fraction));
        }
        function download(content, mime, suffix) {
            const url = URL.createObjectURL(new Blob([content], { type: mime })), link = document.createElement('a');
            link.href = url; link.download = source.name.replace(/\.[^.]+$/, '').replace(/[^\w\-\u3131-\uD79D]+/g, '_').slice(0, 80) + '-' + suffix;
            document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
        }
        function exportSVG() {
            const svg = plot.querySelector('svg').cloneNode(true), ns = 'http://www.w3.org/2000/svg';
            const lines = [source.name + ' · ' + (source.kind === 'model' ? 'MODEL' : source.format),
                source.xLabel + ' [' + source.xUnit + '] · View ' + core.format(view[0]) + ' → ' + core.format(view[1]),
                'A = ' + timeText(a) + '   B = ' + timeText(b) + '   |B − A| = ' + timeText(Math.abs(b - a))];
            // Wrap the caption to the captured viewport, including exports from a phone.
            const wrapped = [];
            lines.forEach(text => {
                let line = '', length = 0;
                for (const char of text) {
                    const size = char.charCodeAt(0) > 255 ? 11 : 6.5;
                    if (line && length + size > width - 24) { wrapped.push(line); line = ''; length = 0; }
                    line += char; length += size;
                }
                if (line) wrapped.push(line);
            });
            const height = geometry.height + wrapped.length * 19 + 44;
            svg.setAttribute('height', height); svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
            svg.setAttribute('font-family', 'Arial, sans-serif');
            const style = document.createElementNS(ns, 'style'); style.textContent = 'text{font-family:Arial,sans-serif}'; svg.insertBefore(style, svg.firstChild);
            wrapped.forEach((text, i) => {
                const node = document.createElementNS(ns, 'text'); node.setAttribute('x', '12'); node.setAttribute('y', geometry.height + 20 + i * 19); node.setAttribute('fill', '#556b89'); node.setAttribute('font-size', '11'); node.textContent = text; svg.appendChild(node);
            });
            if (source.kind === 'model') {
                const legendY = height - 13;
                [['#2563eb', '정상 / 공통', 12, false], [source.comparisonColor, source.comparisonLabel, 125, true]].forEach(([color, label, x, dashed]) => {
                    const line = document.createElementNS(ns, 'path'); line.setAttribute('d', 'M' + x + ' ' + (legendY - 4) + 'h23'); line.setAttribute('stroke', color); line.setAttribute('stroke-width', '2'); if (dashed) line.setAttribute('stroke-dasharray', '5 3'); svg.appendChild(line);
                    const text = document.createElementNS(ns, 'text'); text.setAttribute('x', x + 29); text.setAttribute('y', legendY); text.setAttribute('fill', '#4b617e'); text.setAttribute('font-size', '11'); text.textContent = label; svg.appendChild(text);
                });
            }
            download('<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg), 'image/svg+xml;charset=utf-8', 'waveform.svg');
        }
        root.addEventListener('click', event => {
            const target = event.target.closest('[data-wa-action]'); if (!target) return;
            const action = target.dataset.waAction;
            if (action.startsWith('cursor-')) { setActive(action.slice(-1)); plot.focus({ preventScroll: true }); }
            else if (action === 'pan') { setActive('pan'); plot.focus({ preventScroll: true }); }
            else if (action === 'zoom-in') zoom(0.5);
            else if (action === 'zoom-out') zoom(2);
            else if (action === 'fit') setView(...source.domain);
            else if (action === 'zoom-ab') { if (a !== b) setView(Math.min(a, b), Math.max(a, b)); else say('A와 B의 위치가 같습니다. 커서를 이동해 구간을 지정하세요.'); }
            else if (action === 'signals') { const el = query('.wa-signals'); el.hidden = !el.hidden; target.setAttribute('aria-expanded', String(!el.hidden)); }
            else if (action === 'import') query('[data-wa-file]').click();
            else if (action === 'export') { const el = query('.wa-export-menu'); el.hidden = !el.hidden; target.setAttribute('aria-expanded', String(!el.hidden)); }
            else if (action === 'model' && modelData) setSource(modelData, options.getProgress ? options.getProgress() : 0.58);
            else if (action === 'export-svg') exportSVG();
            else if (action === 'export-csv') download(core.exportCSV(source, currentChannels(), a, b), 'text/csv;charset=utf-8', 'A-B.csv');
            if (action.startsWith('export-')) { query('.wa-export-menu').hidden = true; query('[data-wa-action="export"]').setAttribute('aria-expanded', 'false'); say('파형을 내보냈습니다.'); }
        });
        query('[data-wa-file]').addEventListener('change', async event => {
            const file = event.target.files[0]; if (!file) return;
            const trigger = query('[data-wa-action="import"]'); trigger.disabled = true; error(''); say('파일을 읽고 있습니다.');
            try {
                if (file.size > core.LIMITS.bytes) throw new Error('20 MB 이하의 CSV/TSV/VCD 파일을 선택해 주세요.');
                fileData = core.parseFile(await file.text(), file.name); setSource(fileData); say(file.name + ', ' + fileData.channels.length + '개 신호를 불러왔습니다.');
            } catch (err) { error(err.message || '파일을 읽을 수 없습니다.'); }
            finally { trigger.disabled = false; event.target.value = ''; }
        });
        query('[data-wa-signal-options]').addEventListener('change', event => {
            const input = event.target.closest('[data-wa-signal]'); if (!input) return;
            if (input.checked) { if (visible.size >= 12) { input.checked = false; say('동시에 표시할 수 있는 신호는 12개입니다.'); return; } visible.add(input.dataset.waSignal); }
            else { if (visible.size === 1) { input.checked = true; say('한 개 이상의 신호가 필요합니다.'); return; } visible.delete(input.dataset.waSignal); }
            buildTable(); scheduleLayout();
        });
        query('[data-wa-search]').addEventListener('input', event => {
            const term = event.target.value.toLocaleLowerCase(); root.querySelectorAll('[data-wa-signal-row]').forEach(el => { el.hidden = !el.textContent.toLocaleLowerCase().includes(term); });
        });
        query('[data-wa-radix]').addEventListener('change', event => { radix = event.target.value; scheduleLayout(); drawCursor(); });
        query('[data-wa-stat-signal]').addEventListener('change', updateStats);
        ['a', 'b'].forEach(k => {
            const field = query('[data-wa-' + k + ']');
            field.addEventListener('input', event => {
                const value = event.target.valueAsNumber;
                if (!source || !Number.isFinite(value) || value < source.domain[0] || value > source.domain[1]) return;
                setActive(k); setCursor(value, false);
            });
            field.addEventListener('change', event => {
                if (!event.target.value || !Number.isFinite(event.target.valueAsNumber)) { event.target.value = k === 'a' ? a : b; return; }
                setActive(k); setCursor(event.target.valueAsNumber, true); event.target.value = k === 'a' ? a : b;
            });
        });
        function position(event) {
            const rect = plot.getBoundingClientRect();
            return view[0] + core.clamp((event.clientX - rect.left - geometry.left) / geometry.span, 0, 1) * (view[1] - view[0]);
        }
        plot.addEventListener('pointerdown', event => {
            if (!geometry || event.button !== 0) return;
            const rect = plot.getBoundingClientRect(), x = event.clientX - rect.left;
            if (x < geometry.left || x > geometry.right) return;
            plot.focus({ preventScroll: true }); plot.setPointerCapture(event.pointerId);
            drag = { id: event.pointerId, x: event.clientX, view: view.slice(), pan: active === 'pan' || event.shiftKey };
            if (options.onInteraction) options.onInteraction();
            if (!drag.pan) setCursor(position(event), false);
            event.preventDefault();
        });
        plot.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.id) return;
            if (drag.pan) { const delta = (event.clientX - drag.x) / geometry.span * (drag.view[1] - drag.view[0]); setView(drag.view[0] - delta, drag.view[1] - delta); }
            else {
                drag.next = position(event);
                if (!cursorFrame) cursorFrame = requestAnimationFrame(() => { cursorFrame = 0; if (drag && drag.next !== undefined) setCursor(drag.next, false); });
            }
        });
        function finishDrag(event) {
            if (!drag || event.pointerId !== drag.id) return;
            if (!drag.pan) { if (drag.next !== undefined) setCursor(drag.next, true); else updateStats(); say(active.toUpperCase() + ' 커서 ' + timeText(active === 'a' ? a : b)); }
            drag = null; if (plot.hasPointerCapture(event.pointerId)) plot.releasePointerCapture(event.pointerId);
        }
        plot.addEventListener('pointerup', finishDrag); plot.addEventListener('pointercancel', finishDrag);
        plot.addEventListener('wheel', event => { if (!event.ctrlKey || !source) return; event.preventDefault(); zoom(event.deltaY > 0 ? 1.25 : 0.8, position(event)); }, { passive: false });
        plot.addEventListener('keydown', event => {
            if (!source) return;
            const step = (view[1] - view[0]) / (event.shiftKey ? 20 : 500);
            if (event.key === 'a' || event.key === 'b') setActive(event.key);
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                if (active === 'pan') { const offset = step * (event.key === 'ArrowLeft' ? -1 : 1) * 10; setView(view[0] + offset, view[1] + offset); }
                else { if (options.onInteraction) options.onInteraction(); setCursor((active === 'a' ? a : b) + step * (event.key === 'ArrowLeft' ? -1 : 1), true); }
            } else if (event.key === '+' || event.key === '=') zoom(0.5);
            else if (event.key === '-') zoom(2);
            else if (event.key === 'Home') setView(...source.domain);
            else return;
            event.preventDefault(); event.stopPropagation();
        });
        root.addEventListener('keydown', event => { if (event.key === 'Escape') { query('.wa-export-menu').hidden = true; query('[data-wa-action="export"]').setAttribute('aria-expanded', 'false'); } });
        document.addEventListener('pointerdown', event => { if (!event.target.closest('.wa-export-wrap')) { query('.wa-export-menu').hidden = true; query('[data-wa-action="export"]').setAttribute('aria-expanded', 'false'); } });
        const observer = new ResizeObserver(() => { const w = Math.round(plot.getBoundingClientRect().width); if (w > 0 && w !== width) scheduleLayout(); }); observer.observe(plot);
        return {
            setModel(next, progress) { modelData = next; setSource(next, progress); },
            updateProgress(progress) { if (source && source.kind === 'model') { b = progress; drawCursor(); deferStats(); } },
            destroy() { disposed = true; observer.disconnect(); cancelAnimationFrame(layoutFrame); cancelAnimationFrame(cursorFrame); clearTimeout(statsTimer); }
        };
    }
    window.ChipBookWaveform = { create };
}());
