/* ChipBook waveform data, local-file readers and measurements. No network I/O. */
(function (scope, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else scope.ChipBookWaveformCore = api;
}(typeof window === 'object' ? window : globalThis, function () {
    'use strict';
    const LIMITS = Object.freeze({ bytes: 20 * 1024 * 1024, rows: 100000, signals: 64, events: 600000, bits: 256 });
    const COLORS = ['#2563eb', '#a16207', '#7c3aed', '#0f8877', '#c83f74', '#036d99'];
    const finite = Number.isFinite;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function upperBound(xs, x) {
        let lo = 0, hi = xs.length;
        while (lo < hi) { const mid = (lo + hi) >>> 1; if (xs[mid] <= x) lo = mid + 1; else hi = mid; }
        return lo;
    }
    function valueAt(trace, x) {
        if (trace.compute) return trace.compute(x);
        const xs = trace.x, ys = trace.y;
        if (!xs.length || x < xs[0] || x > (trace.end === undefined ? xs[xs.length - 1] : trace.end)) return NaN;
        const i = upperBound(xs, x) - 1;
        if (trace.interpolation === 'step' || i === xs.length - 1 || xs[i] === x) return ys[i];
        if (!finite(ys[i]) || !finite(ys[i + 1])) return NaN;
        return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]);
    }
    function pointsIn(trace, a, b) {
        const points = [[a, valueAt(trace, a)]];
        for (let i = upperBound(trace.x, a); i < trace.x.length && trace.x[i] <= b; i++) points.push([trace.x[i], trace.y[i]]);
        if (b > a && points[points.length - 1][0] !== b) points.push([b, valueAt(trace, b)]);
        return points;
    }
    function statistics(trace, a, b) {
        if (a > b) [a, b] = [b, a];
        const pts = pointsIn(trace, a, b), vals = pts.map(p => p[1]).filter(finite);
        let min = Infinity, max = -Infinity, area = 0, square = 0, covered = 0;
        vals.forEach(v => { min = Math.min(min, v); max = Math.max(max, v); });
        for (let i = 1; i < pts.length; i++) {
            const dt = pts[i][0] - pts[i - 1][0], v0 = pts[i - 1][1];
            const v1 = trace.interpolation === 'step' ? v0 : pts[i][1];
            if (dt <= 0 || !finite(v0) || !finite(v1)) continue;
            area += dt * (v0 + v1) / 2;
            square += dt * (v0 * v0 + v0 * v1 + v1 * v1) / 3;
            covered += dt;
        }
        return { min: vals.length ? min : null, max: vals.length ? max : null,
            mean: covered ? area / covered : null, rms: covered ? Math.sqrt(Math.max(0, square / covered)) : null,
            coverage: b > a ? covered / (b - a) : null, duration: b - a, samples: pts.length };
    }
    // First complete 10→90% / 90→10% excursion, levels relative to this window's extrema.
    // Step/digital traces have no sampled analog edge duration, so do not report a fabricated rise time.
    function edgeTimes(trace, a, b) {
        if (trace.interpolation === 'step') return { rise: null, fall: null };
        if (a > b) [a, b] = [b, a];
        const stats = statistics(trace, a, b), pts = pointsIn(trace, a, b);
        if (stats.min === null || stats.max - stats.min < 1e-12) return { rise: null, fall: null };
        const low = stats.min + (stats.max - stats.min) * 0.1, high = stats.min + (stats.max - stats.min) * 0.9;
        let rising = null, falling = null, rise = null, fall = null;
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
            if (!finite(y0) || !finite(y1)) { rising = falling = null; continue; }
            const cross = level => x0 + (x1 - x0) * (level - y0) / (y1 - y0);
            if (y1 > y0) {
                if (y0 <= low && y1 > low) rising = cross(low);
                if (rising !== null && y0 < high && y1 >= high && rise === null) rise = cross(high) - rising;
                if (y1 >= high) falling = null;
            } else if (y1 < y0) {
                if (y0 >= high && y1 < high) falling = cross(high);
                if (falling !== null && y0 > low && y1 <= low && fall === null) fall = cross(low) - falling;
                if (y1 <= low) rising = null;
            }
        }
        return { rise, fall, low, high };
    }
    // Pixel buckets retain first/min/max/last and explicit gaps, instead of dropping every Nth point.
    function envelope(trace, a, b, pixels) {
        const pts = pointsIn(trace, a, b);
        if (pts.length <= pixels * 4 || b <= a) return pts;
        const out = [], count = Math.max(1, Math.floor(pixels));
        let start = 0;
        while (start < pts.length) {
            const bucket = Math.floor((pts[start][0] - a) / (b - a) * count);
            let end = start + 1;
            while (end < pts.length && Math.floor((pts[end][0] - a) / (b - a) * count) === bucket) end++;
            let min = start, max = start, gap = -1;
            for (let j = start; j < end; j++) {
                if (!finite(pts[j][1])) { gap = j; continue; }
                if (!finite(pts[min][1]) || pts[j][1] < pts[min][1]) min = j;
                if (!finite(pts[max][1]) || pts[j][1] > pts[max][1]) max = j;
            }
            const indexes = Array.from(new Set([start, min, max, end - 1].concat(gap >= 0 ? [gap] : []))).sort((x, y) => x - y);
            indexes.forEach(j => out.push(pts[j]));
            // A bucket containing missing samples is never bridged to its neighbour.
            if (gap >= 0 && finite(out[out.length - 1][1])) out.push([pts[end - 1][0], NaN]);
            start = end;
        }
        return out;
    }
    function ticks(a, b, count) {
        const raw = (b - a) / Math.max(2, count), power = Math.pow(10, Math.floor(Math.log10(raw)));
        const unit = raw / power, step = (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
        if (!finite(step) || step <= 0) return [a];
        const out = [];
        for (let i = Math.ceil(a / step); i * step <= b + step * 1e-8 && out.length < 30; i++) out.push(Number((i * step).toPrecision(12)));
        return out;
    }
    function format(value, digits) {
        if (value === null || value === undefined || (typeof value === 'number' && !finite(value))) return '—';
        if (typeof value === 'string') return value;
        if (value === 0) return '0';
        const n = Math.abs(value);
        return n >= 1e5 || n < 1e-3 ? value.toExponential(digits === undefined ? 3 : digits) : Number(value.toPrecision(digits === undefined ? 5 : digits)).toString();
    }
    function busFormat(value, radix) {
        if (typeof value !== 'string') return format(value);
        const v = value.toLowerCase();
        if (radix === 'bin' || /[xz]/.test(v)) return v.toUpperCase();
        return '0x' + BigInt('0b' + v).toString(16).toUpperCase().padStart(Math.ceil(v.length / 4), '0');
    }
    function modelSource(model, lesson, mitigation, mode) {
        const id = lesson.id;
        const digital = (name, key) => ({ name, key, kind: 'digital', unit: 'logic', interpolation: 'step' });
        const analog = (name, key, threshold, interpolation) => ({ name, key, kind: 'analog', unit: 'norm', threshold, interpolation: interpolation || 'linear' });
        const metric = name => analog(name, 'metric', { value: lesson.threshold, label: lesson.thresholdLabel });
        const q = () => analog('Q', 'q', { value: lesson.threshold, label: lesson.thresholdLabel });
        const wl = () => ({ ...analog('WL', 'wl'), interpolation: 'step' });
        const cell = () => metric(id === 'dram-rowhammer' ? 'Q_VICTIM' : 'Q_CELL');
        const margin = () => ({ ...analog('MARGIN', s => s.charge - lesson.threshold), range: [-0.5, 0.6], threshold: { value: 0, label: '전하 − 경계 (derived)' } });
        let specs;
        switch (id) {
        case 'sram-read-upset': case 'sram-write-fail': case 'sram-half-select':
            specs = [wl(), analog('BL', 'bl'), analog('BLB', 'blb', null, id === 'sram-write-fail' ? 'step' : 'linear'), q(), analog('QB', 'qb'), digital(id === 'sram-read-upset' ? 'DOUT' : 'DATA', id === 'sram-read-upset' ? 'output' : 'bit')]; break;
        case 'sram-hold': specs = [analog('VDD', 'vdd'), analog('Q', 'q'), analog('QB', 'qb'), metric('Q − QB'), wl()]; break;
        case 'sram-slow': specs = [wl(), metric('ΔBL'), digital('SA_EN', 'sense'), digital('DOUT', 'output'), analog('Q', 'q')]; break;
        case 'sram-rtn': specs = [digital('TRAP', 'trap'), { ...metric('MARGIN'), interpolation: 'step' }, analog('Q', 'q'), analog('QB', 'qb')]; break;
        case 'sram-aging': specs = [metric('MARGIN'), analog('BL', 'bl'), analog('Q', 'q'), wl()]; break;
        case 'sram-ser': specs = [analog('PARTICLE', 'particle'), q(), analog('QB', 'qb'), digital('DOUT', 'output'), digital('SCRUB', 'scrub'), wl()]; break;
        case 'dram-restore': specs = [wl(), digital('SA_EN', 'sense'), cell(), digital('PRE', 'pre')]; break;
        case 'dram-sense': specs = [wl(), { ...analog('ΔBL', s => s.bl - s.blb, null, 'step'), range: [0, 0.08] }, digital('SA_EN', 'sense'), metric('SA_OUT'), digital('DOUT', 'output')]; break;
        case 'dram-rowhammer': specs = [digital('ACT', 'act'), { ...wl(), name: 'WL_VICTIM' }, { ...cell(), interpolation: 'step' }, { ...margin(), interpolation: 'step' }, digital('DATA', 'bit')]; break;
        case 'dram-write-recovery': specs = [wl(), digital('DRIVE', 'drive'), cell(), digital('PRE', 'pre'), digital('DATA', 'bit')]; break;
        case 'dram-vrt': specs = [digital('TRAP', 'trap'), { ...wl(), name: 'REF' }, cell(), margin(), digital('DATA', 'bit')]; break;
        case 'dram-hard-soft': specs = [wl(), mode === 'soft' ? analog('PARTICLE', 'particle') : digital('DEFECT', 'defect'), { ...cell(), interpolation: 'step' }, digital('DOUT', 'output'), digital(mode === 'soft' ? 'SCRUB' : 'SPARE', mode === 'soft' ? 'scrub' : 'spare')]; break;
        default: specs = [{ ...wl(), name: 'REF' }, cell(), margin(), digital('DATA', 'bit')];
        }
        const knots = new Set(Array.from({ length: 2049 }, (_, i) => i / 2048));
        // Include model command boundaries and their left limits; sample the smooth segments separately.
        for (let i = 1; i < 100; i++) { knots.add(i / 100); knots.add(i / 100 - 1e-8); }
        for (let i = 0; i <= 12; i++) {
            [0.18 + i * 0.055, 0.18 + (i + 0.46) * 0.055].forEach(x => { if (x < 1) { knots.add(x); knots.add(Math.max(0, x - 1e-8)); } });
        }
        const xs = Float64Array.from(Array.from(knots).sort((a, b) => a - b));
        const states = Array.from(xs, x => model.sample(id, x, mitigation, mode));
        let cachedX, cachedState;
        const stateAt = x => { if (cachedX !== x) { cachedX = x; cachedState = model.sample(id, x, mitigation, mode); } return cachedState; };
        const channels = specs.map((spec, i) => {
            const read = s => { const v = typeof spec.key === 'function' ? spec.key(s) : s[spec.key]; return v === null || v === undefined ? NaN : Number(v); };
            const traces = ['normal', 'vulnerable'].map((side, j) => ({ id: 'm' + i + '-' + side, role: side,
                label: j ? (mitigation ? '개선' : id === 'sram-aging' ? '열화' : '취약') : '정상',
                color: j ? mitigation ? '#15845b' : '#d43e67' : '#2563eb', x: xs,
                y: Float64Array.from(states, s => read(s[side])), interpolation: spec.interpolation,
                compute: x => read(stateAt(x)[side]) }));
            const same = traces[0].y.every((v, n) => Object.is(v, traces[1].y[n]) || Math.abs(v - traces[1].y[n]) < 1e-10);
            if (same) { traces.length = 1; traces[0].label = '공통'; traces[0].role = 'common'; }
            return { ...spec, id: 'm' + i, range: spec.range || [0, 1], traces, visible: i < 5 };
        });
        const events = [];
        const event = (x, label, role) => events.push({ x, label, role: role || 'command' });
        if (id === 'dram-restore') { event(0.33, 'SA ↑'); event(mitigation ? 0.85 : 0.54, mitigation ? 'PRE' : 'PRE 취약'); if (!mitigation) event(0.85, 'PRE 정상'); }
        else if (id === 'dram-write-recovery') { event(0.41, '외부 쓰기 종료'); event(mitigation ? 0.84 : 0.51, 'PRE'); }
        else if (id === 'sram-slow') event(mitigation ? 0.87 : 0.62, 'SA ↑');
        else if (id === 'dram-sense') event(0.4, 'SA ↑');
        else if (id === 'sram-ser') { event(0.25, '입자 입력'); if (mitigation) { event(0.63, 'ECC'); event(0.82, 'Scrub'); } }
        else if (id === 'dram-hard-soft') { event(0.3, mode === 'soft' ? 'Upset' : 'Open'); event(0.68, '재기록'); }
        else if (id === 'sram-rtn' || id === 'dram-vrt') event(id === 'sram-rtn' ? 0.29 : 0.27, 'Trap ↑');
        else if (id === 'sram-aging') event(0.12, '누적 스트레스');
        else {
            const control = channels[0].traces[channels[0].traces.length - 1];
            for (let i = 1; i < control.y.length && events.length < 4; i++) if (control.y[i - 1] <= 0 && control.y[i] > 0) event(xs[i], specs[0].name + ' ↑');
        }
        return { kind: 'model', name: lesson.english, domain: [0, 1], xUnit: id === 'sram-aging' ? 'S/Smax' : 't/T',
            xLabel: id === 'sram-aging' ? '정규화 누적 스트레스' : '정규화 시간', channels, events,
            comparisonLabel: mitigation ? '개선 적용' : id === 'sram-aging' ? '열화' : '취약', comparisonColor: mitigation ? '#15845b' : '#d43e67',
            metadata: { points: xs.length, provenance: '모델 · 정규화', interpolation: '모델 샘플' } };
    }
    function csvRows(text, delimiter) {
        const rows = []; let row = [], cell = '', quoted = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '"') {
                if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
                else if (quoted || !cell.trim()) quoted = !quoted;
                else cell += c;
            } else if (c === delimiter && !quoted) { row.push(cell); cell = ''; }
            else if ((c === '\n' || c === '\r') && !quoted) {
                if (c === '\r' && text[i + 1] === '\n') i++;
                row.push(cell); if (row.some(v => v.trim()) && !row[0].trim().startsWith('#')) rows.push(row);
                row = []; cell = '';
                if (rows.length > LIMITS.rows + 1) throw new Error('CSV는 최대 100,000개 행까지 지원합니다. 분석 구간을 나누어 주세요.');
            } else cell += c;
        }
        if (quoted) throw new Error('CSV의 큰따옴표가 닫히지 않았습니다.');
        row.push(cell); if (row.some(v => v.trim()) && !row[0].trim().startsWith('#')) rows.push(row);
        return rows;
    }
    function headerInfo(raw) {
        const text = raw.trim(), m = text.match(/^(.*?)\s*\[([^\]]+)\]\s*$/) || text.match(/^(.*?)\s*\((s|ms|us|µs|ns|ps|fs|V|mV|A|mA|logic|bit)\)\s*$/);
        return { name: (m ? m[1] : text).trim(), unit: m ? m[2].trim() : /^v\(/i.test(text) ? 'V' : /^i\(/i.test(text) ? 'A' : '' };
    }
    function parseCSV(text, name) {
        text = text.replace(/^\uFEFF/, '');
        const first = text.split(/\r?\n/).find(line => line.trim() && !line.trim().startsWith('#')) || '';
        const choices = [',', '\t', ';'], counts = new Map(choices.map(c => [c, 0]));
        let inQuotes = false;
        for (let i = 0; i < first.length; i++) {
            if (first[i] === '"') { if (inQuotes && first[i + 1] === '"') i++; else inQuotes = !inQuotes; }
            else if (!inQuotes && counts.has(first[i])) counts.set(first[i], counts.get(first[i]) + 1);
        }
        const delimiter = choices.sort((a, b) => counts.get(b) - counts.get(a))[0];
        const rows = csvRows(text, delimiter);
        if (rows.length < 3 || rows[0].length < 2) throw new Error('시간 열과 신호 열이 있는 CSV/TSV 헤더 및 두 개 이상의 샘플이 필요합니다. 예: time[ns], Q[V]');
        const headers = rows.shift().map(headerInfo), time = headers.shift();
        if (!time.name || Number.isFinite(Number(time.name))) throw new Error('CSV 첫 행에 시간·신호 이름 헤더가 필요합니다. 예: time[ns], Q[V]');
        if (!headers.length || headers.length > LIMITS.signals) throw new Error('파일당 신호는 1–64개까지 지원합니다.');
        if (rows.length > LIMITS.rows) throw new Error('CSV는 최대 100,000개 행까지 지원합니다.');
        const xs = new Float64Array(rows.length), columns = headers.map(() => []);
        const numeric = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
        rows.forEach((row, i) => {
            if (row.length !== headers.length + 1) throw new Error((i + 2) + '행의 열 개수가 헤더와 다릅니다.');
            const rawX = row[0].trim(), x = Number(rawX);
            if (!numeric.test(rawX) || !finite(x) || (i && x < xs[i - 1])) throw new Error((i + 2) + '행: 시간은 유한한 숫자이며 오름차순이어야 합니다.');
            xs[i] = x;
            headers.forEach((h, j) => {
                const v = row[j + 1].trim(), logic = /^(logic|bit)$/i.test(h.unit), bus = h.unit.match(/^(\d+)-bit$/i);
                if (/^(|nan|na|n\/a|null)$/i.test(v)) columns[j].push(NaN);
                else if (bus && /^[01xz]+$/i.test(v) && v.length <= Number(bus[1]) && Number(bus[1]) <= LIMITS.bits) columns[j].push(v.toLowerCase().padStart(Number(bus[1]), /^[xz]/i.test(v) ? v[0].toLowerCase() : '0'));
                else if (logic && /^[xz]$/i.test(v)) columns[j].push(v.toUpperCase());
                else if (!bus && numeric.test(v) && finite(Number(v)) && (!logic || v === '0' || v === '1')) columns[j].push(Number(v));
                else throw new Error((i + 2) + '행 · ' + h.name + ': 해석할 수 없는 값 “' + v.slice(0, 30) + '”. 디지털 X/Z는 [logic] 헤더를 사용하세요.');
            });
        });
        if (xs[xs.length - 1] === xs[0]) throw new Error('서로 다른 시점이 두 개 이상 필요합니다.');
        if (!finite(xs[xs.length - 1] - xs[0])) throw new Error('시간 범위가 너무 큽니다. 단위 또는 분석 구간을 조정해 주세요.');
        columns.forEach(values => {
            let min = Infinity, max = -Infinity;
            values.forEach(v => { if (finite(v)) { min = Math.min(min, v); max = Math.max(max, v); } });
            if (min !== Infinity && (!finite(max - min) || Math.max(Math.abs(min), Math.abs(max)) > 1e150)) throw new Error('신호 범위가 너무 큽니다. 물리 단위 또는 스케일을 확인해 주세요.');
        });
        return { kind: 'file', format: 'CSV', name: name || 'CSV', domain: [xs[0], xs[xs.length - 1]],
            xLabel: time.name || 'Time', xUnit: time.unit || 'unit unspecified', events: [],
            channels: headers.map((h, j) => ({ id: 'c' + j, name: h.name || 'Signal ' + (j + 1), unit: h.unit || 'a.u.',
                kind: /^\d+-bit$/i.test(h.unit) ? 'bus' : /^(logic|bit)$/i.test(h.unit) ? 'digital' : 'analog', visible: j < 5,
                traces: [{ id: 'c' + j, role: 'file', label: '파일', color: COLORS[j % COLORS.length], x: xs, y: columns[j],
                    interpolation: /^(logic|bit|\d+-bit)$/i.test(h.unit) ? 'step' : 'linear' }] })),
            metadata: { points: xs.length, provenance: 'CSV', interpolation: 'linear / step' } };
    }
    // IEEE VCD scalar/vector/real subset; scopes and four-state values are preserved.
    // Format reference: https://pyvcd.readthedocs.io/en/latest/vcd.reader.html
    function parseVCD(text, name) {
        const tokens = text.replace(/^\uFEFF/, '').match(/\S+/g) || [];
        const scopes = [], variables = [], codes = new Map();
        let i = 0, now = 0, maxTime = 0, scale = 1, unit = 'ticks', count = 0, definitions = false;
        const throughEnd = () => { const out = []; while (i < tokens.length && tokens[i] !== '$end') out.push(tokens[i++]); if (i >= tokens.length) throw new Error('VCD의 $end가 누락되었습니다.'); i++; return out; };
        const append = (code, value, type) => {
            const group = codes.get(code);
            if (!group) throw new Error('정의되지 않은 VCD 식별자: ' + code.slice(0, 20));
            if ((type === 'real') !== (group.kind === 'analog')) throw new Error('VCD 신호 타입과 값 형식이 다릅니다: ' + group.name);
            if (type === 'vector') {
                if (!/^[01xz]+$/i.test(value) || value.length > group.width) throw new Error('VCD 벡터 폭 또는 4-state 값이 올바르지 않습니다.');
                value = value.toLowerCase().padStart(group.width, /^[xz]/i.test(value) ? value[0].toLowerCase() : '0');
                if (group.width === 1) value = /^[01]$/.test(value) ? Number(value) : value.toUpperCase();
            } else if (type === 'scalar' && group.width !== 1) throw new Error('다중 비트 VCD 신호에는 벡터 값이 필요합니다.');
            if (++count > LIMITS.events) throw new Error('VCD는 최대 600,000개 값 변경까지 지원합니다. 분석 구간을 나누어 주세요.');
            group.x.push(now); group.y.push(value);
        };
        while (i < tokens.length) {
            const token = tokens[i++];
            if (token === '$scope') { const t = throughEnd(); scopes.push(t[1] || ''); }
            else if (token === '$upscope') { throughEnd(); scopes.pop(); }
            else if (token === '$timescale') {
                const m = throughEnd().join('').match(/^(1|10|100)(s|ms|us|ns|ps|fs)$/);
                if (!m) throw new Error('VCD timescale은 1/10/100 × s/ms/us/ns/ps/fs 형식이어야 합니다.');
                scale = Number(m[1]); unit = m[2];
            } else if (token === '$var') {
                const t = throughEnd(), width = Number(t[1]), code = t[2];
                if (!Number.isInteger(width) || width < 1 || width > LIMITS.bits || !code || !t[3]) throw new Error('VCD 변수 정의 또는 비트 폭이 올바르지 않습니다 (최대 256 bit).');
                if (variables.length >= LIMITS.signals) throw new Error('VCD는 최대 64개 신호까지 지원합니다. 필요한 신호만 덤프해 주세요.');
                const kind = /^(real|realtime)$/.test(t[0]) ? 'analog' : width > 1 ? 'bus' : 'digital';
                const fullName = scopes.concat(t.slice(3).join('')).join('.');
                const group = codes.get(code) || { x: [], y: [], width, kind, name: fullName };
                if (group.width !== width || group.kind !== kind) throw new Error('VCD alias의 타입 또는 폭이 원본과 다릅니다.');
                codes.set(code, group); variables.push({ name: fullName, group, kind, width });
            } else if (token === '$enddefinitions') { throughEnd(); definitions = true; }
            else if (['$date', '$version', '$comment'].includes(token)) throughEnd();
            else if (['$dumpvars', '$dumpall', '$dumpon', '$dumpoff', '$end'].includes(token)) { /* Value-change bodies continue in this loop. */ }
            else if (token[0] === '#') {
                if (!/^#\d+$/.test(token) || !Number.isSafeInteger(Number(token.slice(1))) || !Number.isSafeInteger(Number(token.slice(1)) * scale)) throw new Error('VCD 타임스탬프가 정확하게 표현할 수 있는 범위를 벗어났습니다. 시간 단위나 덤프 구간을 조정해 주세요.');
                const next = Number(token.slice(1)) * scale;
                if (next < now) throw new Error('VCD 시간이 역행합니다.');
                now = next; maxTime = Math.max(now, maxTime);
            } else if (/^[01xz]/i.test(token)) append(token.slice(1), /^[01]/.test(token) ? Number(token[0]) : token[0].toUpperCase(), 'scalar');
            else if (/^[bB]/.test(token)) append(tokens[i++], token.slice(1), 'vector');
            else if (/^[rR]/.test(token)) {
                const v = Number(token.slice(1)); if (!finite(v)) throw new Error('VCD real 값은 유한한 숫자여야 합니다.');
                append(tokens[i++], v, 'real');
            } else throw new Error('지원하지 않거나 손상된 VCD 항목: ' + token.slice(0, 35));
        }
        if (!definitions || !variables.length || maxTime <= 0) throw new Error('VCD 정의와 두 개 이상의 시점이 필요합니다.');
        codes.forEach(group => { group.x = Float64Array.from(group.x); });
        const channels = variables.map((v, j) => ({ id: 'v' + j, name: v.name, kind: v.kind, width: v.width,
            unit: v.kind === 'analog' ? 'a.u.' : v.kind === 'bus' ? v.width + '-bit' : 'logic', visible: j < 5,
            traces: [{ id: 'v' + j, role: 'file', label: '파일', color: COLORS[j % COLORS.length], x: v.group.x,
                y: v.group.y, end: maxTime, interpolation: 'step' }] }));
        return { kind: 'file', format: 'VCD', name: name || 'VCD', domain: [0, maxTime], xLabel: 'Time', xUnit: unit, channels, events: [],
            metadata: { points: count, provenance: 'VCD', interpolation: 'step' } };
    }
    function parseFile(text, name) {
        if (text.length > LIMITS.bytes) throw new Error('파일은 20 MB 이하로 나누어 주세요.');
        return /\.vcd$/i.test(name || '') || /\$enddefinitions\b/.test(text) ? parseVCD(text, name) : parseCSV(text, name);
    }
    function csvField(value, isHeader) {
        let s = String(value);
        if (isHeader && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
        return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    function exportCSV(source, channels, a, b) {
        if (a > b) [a, b] = [b, a];
        const traces = channels.flatMap(c => c.traces.map(t => ({ c, t })));
        const times = new Map([[a, 1], [b, 1]]);
        traces.forEach(({ t }) => {
            let previous, repeats = 0;
            // Duplicate timestamps can encode an instantaneous analog jump.
            let start = Math.max(0, upperBound(t.x, a) - 1);
            while (start > 0 && t.x[start - 1] === a) start--;
            for (let i = start; i < t.x.length && t.x[i] <= b; i++) {
                const x = t.x[i]; if (x < a) continue;
                repeats = x === previous ? repeats + 1 : 1; previous = x;
                times.set(x, Math.max(times.get(x) || 1, repeats));
            }
        });
        const rows = [[csvField(source.xLabel + '[' + source.xUnit + ']', true)].concat(traces.map(({ c, t }) => csvField(c.name + (c.traces.length > 1 ? ' ' + t.label : '') + '[' + c.unit + ']', true))).join(',')];
        Array.from(times.keys()).sort((x, y) => x - y).forEach(x => {
            for (let occurrence = 0; occurrence < times.get(x); occurrence++) rows.push([String(x)].concat(traces.map(({ t }) => {
                const last = upperBound(t.x, x) - 1; let first = last;
                while (first > 0 && t.x[first - 1] === x) first--;
                const index = t.x[first] === x ? Math.min(first + occurrence, last) : -1;
                const v = index >= 0 ? t.y[index] : valueAt(t, x);
                return typeof v === 'number' && !finite(v) ? '' : csvField(v, false);
            })).join(','));
        });
        return '\uFEFF' + rows.join('\r\n') + '\r\n';
    }
    return { LIMITS, COLORS, clamp, upperBound, valueAt, pointsIn, statistics, edgeTimes, envelope, ticks, format, busFormat,
        modelSource, parseCSV, parseVCD, parseFile, exportCSV };
}));
