export function formatHex(value) {
  return `0x${value.toString(16).toUpperCase()}`;
}

export function createIncrAddresses(start, beats, step) {
  return Array.from({ length: beats }, (_, index) => formatHex(start + (index * step)));
}

export function createWrapAddresses(start, beats, step) {
  const windowSize = beats * step;
  const base = Math.floor(start / windowSize) * windowSize;
  return Array.from({ length: beats }, (_, index) => {
    const offset = (start - base + (index * step)) % windowSize;
    return formatHex(base + offset);
  });
}

export function createAhbTransferPairWave({ title, hsizeLabel, hburstLabel, addrA, addrB }) {
  return {
    signal: [
      { name: 'HCLK', wave: 'p.......' },
      { name: 'HADDR', wave: 'x==x....', data: [addrA, addrB] },
      { name: 'HWRITE', wave: 'x10x....' },
      { name: 'HSIZE', wave: 'x22x....', data: [hsizeLabel, hsizeLabel] },
      { name: 'HBURST', wave: 'x22x....', data: [hburstLabel, hburstLabel] },
      { name: 'HTRANS', wave: 'x==x....', data: ['NONSEQ', 'NONSEQ'] },
      { name: 'HWDATA', wave: 'xx=x....', data: [`WData ${hsizeLabel}`] },
      { name: 'HRDATA', wave: 'xxx=....', data: [`RData ${hsizeLabel}`] },
      { name: 'HREADY', wave: '1.......' }
    ],
    head: { text: title, tick: 0 },
    config: { hscale: 1.5 }
  };
}

export function createAhbSingleBurstWave({ title, hsizeLabel, hburstLabel, address }) {
  return {
    signal: [
      { name: 'HCLK', wave: 'p.....' },
      { name: 'HADDR', wave: 'x=x...' , data: [address] },
      { name: 'HWRITE', wave: 'x1x...' },
      { name: 'HSIZE', wave: 'x2x...', data: [hsizeLabel] },
      { name: 'HBURST', wave: 'x2x...', data: [hburstLabel] },
      { name: 'HTRANS', wave: 'x=x...', data: ['NONSEQ'] },
      { name: 'HWDATA', wave: 'xx=x..', data: [`D(${address})`] },
      { name: 'HREADY', wave: '1.....' }
    ],
    head: { text: title, tick: 0 },
    config: { hscale: 1.5 }
  };
}

export function createAhbBurstWave({ title, hsizeLabel, hburstLabel, addresses }) {
  const beats = addresses.length;
  const hclkWave = `p${'.'.repeat(beats + 3)}`;
  const addrWave = `x${'='.repeat(beats)}xx.`;
  const scalarWave = `x2${'.'.repeat(Math.max(beats - 1, 0))}xx.`;
  const transWave = `x${'='.repeat(beats)}xx.`;
  const dataWave = `xx${'='.repeat(beats)}x.`;
  const readyWave = `1${'.'.repeat(beats + 3)}`;
  const dataLabels = addresses.map((_, index) => `D${index}`);
  const hscale = beats >= 16 ? 2.6 : beats >= 8 ? 2.2 : 1.8;
  const diagramMinWidth = beats >= 16 ? 2600 : beats >= 8 ? 1800 : 1320;

  return {
    signal: [
      { name: 'HCLK', wave: hclkWave },
      { name: 'HADDR', wave: addrWave, data: addresses },
      { name: 'HWRITE', wave: `x1${'.'.repeat(Math.max(beats - 1, 0))}xx.` },
      { name: 'HSIZE', wave: scalarWave, data: [hsizeLabel] },
      { name: 'HBURST', wave: scalarWave, data: [hburstLabel] },
      { name: 'HTRANS', wave: transWave, data: ['NONSEQ', ...Array.from({ length: Math.max(beats - 1, 0) }, () => 'SEQ')] },
      { name: 'HWDATA', wave: dataWave, data: dataLabels },
      { name: 'HREADY', wave: readyWave }
    ],
    head: { text: title, tick: 0 },
    config: { hscale, diagramMinWidth }
  };
}

export const ahbHsizeExamples = [
  { key: 'ahb_hsize_byte', code: '000', label: 'BYTE', bits: 8, bytes: 1 },
  { key: 'ahb_hsize_halfword', code: '001', label: 'HALFWORD', bits: 16, bytes: 2 },
  { key: 'ahb_hsize_word', code: '010', label: 'WORD', bits: 32, bytes: 4 },
  { key: 'ahb_hsize_doubleword', code: '011', label: 'DOUBLEWORD', bits: 64, bytes: 8 },
  { key: 'ahb_hsize_128', code: '100', label: '128-bit', bits: 128, bytes: 16 },
  { key: 'ahb_hsize_256', code: '101', label: '256-bit', bits: 256, bytes: 32 },
  { key: 'ahb_hsize_512', code: '110', label: '512-bit', bits: 512, bytes: 64 },
  { key: 'ahb_hsize_1024', code: '111', label: '1024-bit', bits: 1024, bytes: 128 }
];

export const ahbBurstExamples = [
  { key: 'ahb_burst_single', code: '000', label: 'SINGLE', kind: 'single', beats: 1, start: 0x1000 },
  { key: 'ahb_burst_incr', code: '001', label: 'INCR', kind: 'incr', beats: 6, start: 0x40 },
  { key: 'ahb_wrap4', code: '010', label: 'WRAP4', kind: 'wrap', beats: 4, start: 0x38 },
  { key: 'ahb_incr4', code: '011', label: 'INCR4', kind: 'incr', beats: 4, start: 0x38 },
  { key: 'ahb_burst_wrap8', code: '100', label: 'WRAP8', kind: 'wrap', beats: 8, start: 0x58 },
  { key: 'ahb_burst_incr8', code: '101', label: 'INCR8', kind: 'incr', beats: 8, start: 0x40 },
  { key: 'ahb_burst_wrap16', code: '110', label: 'WRAP16', kind: 'wrap', beats: 16, start: 0x78 },
  { key: 'ahb_burst_incr16', code: '111', label: 'INCR16', kind: 'incr', beats: 16, start: 0x40 }
];
