// Small deterministic teaching models. Units and simplifications belong in the lesson.
export const clamp = (x, min, max) => Math.min(max, Math.max(min, Number(x)));
export const bits = (value, width = 8, lsb = false) => Array.from({ length: width }, (_, i) => (value >>> (lsb ? i : width - i - 1)) & 1);

export function uartFrame(value = 0xA5, parity = 'none', corrupt = false) {
    const data = bits(value, 8, true);
    const parityBit = data.reduce((a, b) => a ^ b, 0) ^ (parity === 'odd' ? 1 : 0);
    const levels = [1, 0, ...data, ...(parity === 'none' ? [] : [parityBit ^ Number(corrupt)]), 1, 1];
    if (corrupt && parity === 'none') levels[levels.length - 2] = 0;
    return { levels, labels: ['IDLE', 'START', ...data.map((_, i) => `D${i}`), ...(parity === 'none' ? [] : ['PARITY']), 'STOP', 'IDLE'], decoded: value & 255, error: corrupt ? (parity !== 'none' ? 'Parity error' : 'Framing error') : '정상 프레임', durationBits: 10 + Number(parity !== 'none') };
}

export function spiFrame(value = 0xA6, mode = 0, received = 0x3C) {
    const cpol = mode >> 1, cpha = mode & 1, data = bits(value), reply = bits(received);
    const clock = [cpol, cpol], mosi = [0, cpha ? 0 : data[0]], miso = [0, cpha ? 0 : reply[0]], samples = [];
    data.forEach((bit, i) => {
        clock.push(1 - cpol, cpol);
        mosi.push(bit, cpha ? bit : (data[i + 1] ?? bit));
        miso.push(reply[i], cpha ? reply[i] : (reply[i + 1] ?? reply[i]));
        samples.push(2 + 2 * i + cpha);
    });
    clock.push(cpol); mosi.push(mosi.at(-1)); miso.push(miso.at(-1));
    return { clock, mosi, miso, cs: [1, ...Array(clock.length - 2).fill(0), 1], samples, cpol, cpha, decoded: value & 255, received: received & 255 };
}

export function i2cWrite(address = 0x50, data = 0xA5, nack = false, stretch = 0) {
    const samples = [{ scl: 1, sda: 1, label: 'IDLE' }, { scl: 1, sda: 0, label: 'START' }];
    const pushByte = (value, name, ack) => {
        bits(value).forEach((bit, i) => {
            samples.push({ scl: 0, sda: bit, label: `${name} b${7 - i}` }, { scl: 1, sda: bit, label: `${name} b${7 - i}` });
        });
        samples.push({ scl: 0, sda: ack, label: ack ? 'NACK' : 'ACK' });
        for (let i = 0; i < stretch; i++) samples.push({ scl: 0, sda: ack, label: 'CLOCK STRETCH' });
        samples.push({ scl: 1, sda: ack, label: ack ? 'NACK' : 'ACK' });
    };
    pushByte((address & 127) << 1, 'ADDR+W', Number(nack));
    if (!nack) pushByte(data & 255, 'DATA', 0);
    samples.push({ scl: 0, sda: 0, label: 'STOP 준비' }, { scl: 1, sda: 0, label: 'STOP 준비' }, { scl: 1, sda: 1, label: 'STOP' });
    return { samples, addressByte: (address & 127) << 1, accepted: !nack, payload: nack ? null : data & 255 };
}

export function systolic(A, B, cycle = Infinity) {
    const n = A.length;
    if (!n || B.length !== A[0].length || !B[0]?.length) throw new Error('행렬 차원이 맞지 않습니다.');
    const m = B[0].length, kSize = B.length;
    const sums = Array.from({ length: n }, () => Array(m).fill(0));
    const trace = [];
    for (let t = 0; t <= n + m + kSize - 3; t++) {
        const active = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
            const k = t - i - j;
            if (k >= 0 && k < kSize) {
                if (t <= cycle) sums[i][j] += A[i][k] * B[k][j];
                active.push({ i, j, k, a: A[i][k], b: B[k][j], product: A[i][k] * B[k][j] });
            }
        }
        trace.push({ cycle: t, active });
    }
    return { sums, trace, cycles: n + m + kSize - 2 };
}

export function quantize(value, scale = 0.25, width = 8, zero = 0) {
    if (!(scale > 0) || !Number.isInteger(width) || width < 2 || width > 16 || !Number.isInteger(zero) || zero < -(2 ** (width - 1)) || zero > 2 ** (width - 1) - 1) throw new Error('Scale은 양수, bit 폭은 2~16, zero-point는 해당 signed 범위의 정수여야 합니다.');
    const scaled = value / scale, lower = Math.floor(scaled), fraction = scaled - lower;
    // Decimal form inputs such as 0.3 / 0.2 can land one binary ULP below 1.5.
    const halfTie = Math.abs(fraction - 0.5) <= Number.EPSILON * Math.max(1, Math.abs(scaled)) * 2;
    const rounded = halfTie ? (lower % 2 === 0 ? lower : lower + 1) : Math.round(scaled);
    const raw = rounded + zero;
    const integer = clamp(raw, -(2 ** (width - 1)), 2 ** (width - 1) - 1);
    return { raw, integer, restored: (integer - zero) * scale, error: (integer - zero) * scale - value, saturated: raw !== integer };
}

export function timing({ period = 10, tcq = 0.5, tcqMin = 0.2, delay = 6, setup = 0.4, skew = 0.2, uncertainty = 0.1, minDelay = 0.3, hold = 0.2 }) {
    const arrival = tcq + delay, required = period + skew - uncertainty - setup;
    return { arrival, required, holdArrival: tcqMin + minDelay, holdRequired: skew + hold, setupSlack: required - arrival, holdSlack: tcqMin + minDelay - skew - hold };
}

export function bandwidth({ rate = 8, lanes = 4, efficiency = 0.8, bytes = 4096 }) {
    const gbps = rate * lanes * efficiency, gbytes = gbps / 8;
    return { gbps, gbytes, microseconds: gbytes > 0 ? bytes / (gbytes * 1000) : Infinity };
}

export function roofline({ operations = 1e9, bytes = 1e8, peak = 1000, bandwidthGB = 100 }) {
    const intensity = operations / bytes, memoryLimit = intensity * bandwidthGB;
    const performance = Math.min(peak, memoryLimit);
    return { intensity, performance, bound: memoryLimit < peak ? 'Memory-bound' : 'Compute-bound', milliseconds: operations / (performance * 1e6), ridge: peak / bandwidthGB };
}

export function power({ activity = 0.2, capacitancePF = 100, voltage = 0.8, frequencyMHz = 500, leakageMA = 2 }) {
    const dynamicMW = activity * capacitancePF * voltage ** 2 * frequencyMHz / 1000;
    const leakageMW = voltage * leakageMA;
    return { dynamicMW, leakageMW, totalMW: dynamicMW + leakageMW };
}

export function rc({ resistance = 2200, capacitancePF = 100, voltage = 3.3 }) {
    const tauNS = resistance * capacitancePF / 1000;
    return { tauNS, riseNS: Math.log(9) * tauNS, points: Array.from({ length: 41 }, (_, i) => ({ x: i * tauNS / 8, y: voltage * (1 - Math.exp(-i / 8)) })) };
}

export function dmaTrace({ length = 32, beat = 4, stall = 0, timeout = 100, errorAt = -1, source = 0, destination = 0 }) {
    if (!Number.isInteger(length) || length < 1 || beat < 1) throw new Error('전송 크기를 확인하세요.');
    const rows = [{ cycle: 0, event: 'CPU: descriptor 설정', transferred: 0, remaining: length, irq: 0 }];
    if (source % beat || destination % beat) return {rows:[...rows,{cycle:1,event:'MISALIGNED · 요청 거부',transferred:0,remaining:length,irq:1}],sent:0,status:'MISALIGNED'};
    let sent = 0, cycle = 1;
    while (sent < length && cycle <= timeout) {
        if (cycle === errorAt) { rows.push({ cycle, event: 'BUS ERROR', transferred: sent, remaining: length - sent, irq: 1 }); return { rows, sent, status: 'ERROR' }; }
        if (stall && cycle % 3 === 0 && cycle <= stall * 3) rows.push({ cycle, event: 'READY=0 · 대기', transferred: sent, remaining: length - sent, irq: 0 });
        else {
            const count = Math.min(beat, length - sent); sent += count;
            rows.push({ cycle, event: `${count} byte 수락`, transferred: sent, remaining: length - sent, irq: 0 });
        }
        cycle++;
    }
    const status = sent === length ? 'DONE' : 'TIMEOUT';
    rows.push({ cycle, event: `${status} · IRQ`, transferred: sent, remaining: length - sent, irq: 1 });
    return { rows, sent, status };
}

export function fifoStep(state, action, value = 0) {
    if (state.depth < 2 || (state.depth & (state.depth - 1)) !== 0) throw new Error('이 Gray pointer 모델은 2의 거듭제곱 깊이를 사용합니다.');
    const next = { ...state, values: [...state.values], error: '', accepted: false };
    if (action === 'write') {
        if (next.values.length === next.depth) next.error = 'FULL: 쓰기를 수락하지 않았습니다.';
        else { next.values.push(value); next.write = (next.write + 1) % (2 * next.depth); next.accepted = true; }
    }
    if (action === 'read') {
        if (!next.values.length) next.error = 'EMPTY: 읽기를 수락하지 않았습니다.';
        else { next.output = next.values.shift(); next.read = (next.read + 1) % (2 * next.depth); next.accepted = true; }
    }
    next.grayWrite = next.write ^ (next.write >> 1); next.grayRead = next.read ^ (next.read >> 1);
    return next;
}

export function cacheTrace(addresses, { lines = 4, lineBytes = 16 } = {}) {
    const tags = Array(lines).fill(null); let hits = 0;
    const rows = addresses.map(address => {
        const block = Math.floor(address / lineBytes), index = block % lines, tag = Math.floor(block / lines);
        const hit = tags[index] === tag; hits += Number(hit); tags[index] = tag;
        return { address, index, tag, offset: address % lineBytes, hit };
    });
    return { rows, hits, misses: addresses.length - hits, tags };
}

export function tileBudget({ m = 16, n = 16, k = 16, tm = 8, tn = 8, tk = 8, bytes = 1, capacity = 4096 }) {
    const tiles = Math.ceil(m / tm) * Math.ceil(n / tn) * Math.ceil(k / tk);
    const storage = (tm * tk + tk * tn) * bytes + tm * tn * 4;
    return { tiles, storage, capacity, fits: storage <= capacity, macs: m * n * k, tail: m % tm !== 0 || n % tn !== 0 || k % tk !== 0, axes: [[m,tm],[n,tn],[k,tk]].map(([size,tile])=>({size,tile,count:Math.ceil(size/tile),last:size%tile||tile})) };
}

export function kvBytes({ length = 2048, heads = 16, dim = 64, layers = 24, bytes = 2, batch = 1 }) {
    return 2 * batch * layers * length * heads * dim * bytes;
}

export function irqStep(state, action) {
    const next = { ...state };
    if (action === 'tick') { next.ticks = ((next.ticks || 0) + 1) % (next.period || 4); if (next.ticks === 0) { next.events = (next.events || 0) + 1; next.pending = true; if (next.level) next.source = true; } }
    if (action === 'event') { if (next.level || !next.source) next.pending = true; next.source = true; }
    if (action === 'mask') next.masked = !next.masked;
    if (action === 'source-clear') next.source = false;
    if (action === 'pending-clear') next.pending = next.level && next.source;
    next.irq = next.pending && !next.masked;
    return next;
}
