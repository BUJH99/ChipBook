import { waveData } from './waveforms.mjs';
import { formatHex, createIncrAddresses, createWrapAddresses, createAhbTransferPairWave, createAhbSingleBurstWave, createAhbBurstWave, ahbHsizeExamples, ahbBurstExamples } from './ahb-model.mjs';
Object.assign(
  waveData,
  Object.fromEntries(
    ahbHsizeExamples.map((example) => [
      example.key,
      createAhbTransferPairWave({
        title: `AHB HSIZE ${example.label} Example (${example.bits}-bit)`,
        hsizeLabel: example.label,
        hburstLabel: 'SINGLE',
        addrA: formatHex(0x1000),
        addrB: formatHex(0x1000 + example.bytes)
      })
    ])
  ),
  Object.fromEntries(
    ahbBurstExamples.map((example) => {
      if (example.kind === 'single') {
        return [
          example.key,
          createAhbSingleBurstWave({
            title: `AHB HBURST ${example.label} Example`,
            hsizeLabel: 'WORD',
            hburstLabel: example.label,
            address: formatHex(example.start)
          })
        ];
      }

      const addresses = example.kind === 'wrap'
        ? createWrapAddresses(example.start, example.beats, 4)
        : createIncrAddresses(example.start, example.beats, 4);

      const suffix = example.label === 'INCR'
        ? ' (6 Beats Shown)'
        : '';

      return [
        example.key,
        createAhbBurstWave({
          title: `AHB HBURST ${example.label} Example${suffix}`,
          hsizeLabel: 'WORD',
          hburstLabel: example.label,
          addresses
        })
      ];
    })
  )
);

export { waveData };
