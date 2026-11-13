import { syncPageHeight } from './shared.mjs';
const axiFullSignalButtonBaseClass = 'axi-full-signal-btn rounded-xl border px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap';
const axiFullSignalButtonActiveClass = `${axiFullSignalButtonBaseClass} bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200/70`;
const axiFullSignalButtonInactiveClass = `${axiFullSignalButtonBaseClass} border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:text-blue-600`;
const axiFullSignalShortDescriptions = {
  ACLK: 'AXI FULL 동작 기준 클럭입니다.',
  ARESETn: '인터페이스 reset 신호입니다.',
  AWID: 'write transaction ID입니다.',
  AWADDR: '쓰기 burst 시작 주소입니다.',
  AWLEN: 'burst 길이 - 1 값입니다.',
  AWSIZE: 'beat당 바이트 수입니다.',
  AWBURST: '주소 증가 방식을 지정합니다.',
  AWLOCK: 'exclusive access 여부입니다.',
  AWCACHE: 'memory attribute bits입니다.',
  AWPROT: '보호 속성 정보입니다.',
  AWQOS: 'QoS 우선순위 힌트입니다.',
  AWREGION: '논리 region 구분용 신호입니다.',
  AWUSER: '사용자 정의 sideband입니다.',
  AWVALID: 'AW 채널 유효 신호입니다.',
  AWREADY: 'slave의 AW 수락 준비 신호입니다.',
  WDATA: '실제 write 데이터입니다.',
  WSTRB: '유효한 byte lane 표시입니다.',
  WLAST: '마지막 write beat 표시입니다.',
  WUSER: '사용자 정의 write data sideband입니다.',
  WVALID: 'W 채널 유효 신호입니다.',
  WREADY: 'slave의 W 수락 준비 신호입니다.',
  BID: 'write response ID입니다.',
  BRESP: 'write 결과 상태 코드입니다.',
  BUSER: '사용자 정의 write response sideband입니다.',
  BVALID: 'B 채널 응답 유효 신호입니다.',
  BREADY: 'master의 B 수락 준비 신호입니다.',
  ARID: 'read transaction ID입니다.',
  ARADDR: '읽기 burst 시작 주소입니다.',
  ARLEN: 'burst 길이 - 1 값입니다.',
  ARSIZE: 'beat당 바이트 수입니다.',
  ARBURST: '주소 증가 방식을 지정합니다.',
  ARLOCK: 'exclusive access 여부입니다.',
  ARCACHE: 'memory attribute bits입니다.',
  ARPROT: '보호 속성 정보입니다.',
  ARQOS: 'QoS 우선순위 힌트입니다.',
  ARREGION: '논리 region 구분용 신호입니다.',
  ARUSER: '사용자 정의 read address sideband입니다.',
  ARVALID: 'AR 채널 유효 신호입니다.',
  ARREADY: 'slave의 AR 수락 준비 신호입니다.',
  RID: 'read response ID입니다.',
  RDATA: '반환되는 read 데이터입니다.',
  RRESP: 'read 결과 상태 코드입니다.',
  RLAST: '마지막 read beat 표시입니다.',
  RUSER: '사용자 정의 read data sideband입니다.',
  RVALID: 'R 채널 데이터 유효 신호입니다.',
  RREADY: 'master의 R 수락 준비 신호입니다.',
};

const axiFullSignalGroups = {
  global: {
    label: 'Global Signals',
    summary: '모든 AXI FULL 채널이 공유하는 시스템 타이밍/리셋 신호',
    footnote: '',
    rows: [
      {
        signal: 'ACLK',
        width: '1 bit',
        source: 'System',
        usage: 'Core',
        description: '모든 AXI FULL 채널의 동작 기준 클럭입니다. 주소, 데이터, 응답, handshake 신호 모두 ACLK 상승 에지에서 유효하게 샘플링됩니다.',
      },
      {
        signal: 'ARESETn',
        width: '1 bit (active-low)',
        source: 'System',
        usage: 'Core',
        description: 'AXI 인터페이스 reset 신호입니다. 일반적으로 assert 시 VALID를 0으로 초기화하고, deassert 이후부터 정상 transaction을 시작합니다.',
      },
    ],
  },
  aw: {
    label: 'Write Address Channel (AW)',
    summary: '쓰기 burst의 시작 주소와 속성, ID, 순서 정보를 전달하는 채널',
    footnote: '',
    rows: [
      {
        signal: 'AWID',
        width: '<code>[ID_W-1:0]</code>',
        source: 'Master',
        usage: 'Conditional',
        description: 'write transaction ID입니다. multi outstanding write나 interconnect reordering이 있을 때 어떤 write request인지 추적하는 기준이 됩니다.',
      },
      {
        signal: 'AWADDR',
        width: '<code>[ADDR_W-1:0]</code>',
        source: 'Master',
        usage: 'Core',
        description: '쓰기 burst의 시작 주소입니다. slave는 이 주소와 burst 정보를 바탕으로 이후 beat의 target location을 계산합니다.',
      },
      {
        signal: 'AWLEN',
        width: '8 bits',
        source: 'Master',
        usage: 'Core',
        description: 'burst length minus one 값입니다. 예를 들어 <code>AWLEN=0</code>이면 1-beat, <code>AWLEN=15</code>이면 16-beat burst를 의미합니다.',
      },
      {
        signal: 'AWSIZE',
        width: '3 bits',
        source: 'Master',
        usage: 'Core',
        description: '한 beat당 전송 바이트 수를 나타냅니다. 예를 들어 <code>010</code>은 4 bytes, <code>011</code>은 8 bytes를 의미합니다.',
      },
      {
        signal: 'AWBURST',
        width: '2 bits',
        source: 'Master',
        usage: 'Core',
        description: 'burst 주소 진행 방식입니다. 보통 <code>FIXED</code>, <code>INCR</code>, <code>WRAP</code> 중 하나를 지정합니다.',
      },
      {
        signal: 'AWLOCK',
        width: '1 bit',
        source: 'Master',
        usage: 'Conditional',
        description: 'exclusive access 여부를 나타냅니다. 일반 write에서는 0으로 두고, atomic-like exclusive sequence가 필요할 때 사용합니다.',
      },
      {
        signal: 'AWCACHE',
        width: '4 bits',
        source: 'Master',
        usage: 'Conditional',
        description: 'bufferable, modifiable, allocate 관련 메모리 속성을 전달합니다. cache coherency를 직접 보장하는 신호는 아니며 interconnect와 memory subsystem의 처리 정책에 영향을 줍니다.',
      },
      {
        signal: 'AWPROT',
        width: '3 bits',
        source: 'Master',
        usage: 'Conditional',
        description: 'privileged / secure / instruction-data protection 속성을 나타냅니다. 접근 권한과 보안 정책 판단에 사용됩니다.',
      },
      {
        signal: 'AWQOS',
        width: '4 bits',
        source: 'Master',
        usage: 'Optional',
        description: 'QoS priority hint입니다. interconnect가 혼잡 상황에서 arbitration priority를 조정할 때 참고할 수 있습니다.',
      },
      {
        signal: 'AWREGION',
        width: '4 bits',
        source: 'Master',
        usage: 'Optional',
        description: '같은 physical address space 안에서 logical region을 구분하는 sideband 신호입니다. 일부 interconnect 구현에서만 사용합니다.',
      },
      {
        signal: 'AWUSER',
        width: '<code>[AWUSER_W-1:0]</code>',
        source: 'Master',
        usage: 'Optional',
        description: '설계별 custom sideband 정보입니다. trace tag, security context, debug hint 같은 추가 메타데이터를 실을 수 있습니다.',
      },
      {
        signal: 'AWVALID',
        width: '1 bit',
        source: 'Master',
        usage: 'Core',
        description: 'AW 채널의 payload가 유효함을 나타냅니다. <code>AWREADY</code>와 동시에 HIGH가 되는 클럭 에지에서 address transfer가 성립합니다.',
      },
      {
        signal: 'AWREADY',
        width: '1 bit',
        source: 'Slave',
        usage: 'Core',
        description: 'slave가 write address를 수락할 준비가 되었음을 나타냅니다. backpressure가 걸리면 LOW로 유지될 수 있습니다.',
      },
    ],
  },
  w: {
    label: 'Write Data Channel (W)',
    summary: 'write burst의 실제 payload 데이터와 byte enable을 전달하는 채널',
    footnote: '',
    rows: [
      {
        signal: 'WDATA',
        width: '<code>[DATA_W-1:0]</code>',
        source: 'Master',
        usage: 'Core',
        description: 'slave에 기록될 실제 write 데이터입니다. 시스템에 따라 32/64/128/256-bit 등으로 확장됩니다.',
      },
      {
        signal: 'WSTRB',
        width: '<code>[DATA_W/8-1:0]</code>',
        source: 'Master',
        usage: 'Core',
        description: '각 byte lane의 유효 여부를 지정하는 write strobe입니다. register update나 partial write에서 특정 바이트만 선택적으로 갱신할 수 있습니다.',
      },
      {
        signal: 'WLAST',
        width: '1 bit',
        source: 'Master',
        usage: 'Core',
        description: '현재 beat가 write burst의 마지막 데이터임을 나타냅니다. burst completion과 response 발생 타이밍의 기준이 됩니다.',
      },
      {
        signal: 'WUSER',
        width: '<code>[WUSER_W-1:0]</code>',
        source: 'Master',
        usage: 'Optional',
        description: 'write data beat에 동반되는 custom sideband 정보입니다. error injection, trace marker, stream class 같은 구현별 확장이 가능합니다.',
      },
      {
        signal: 'WVALID',
        width: '1 bit',
        source: 'Master',
        usage: 'Core',
        description: 'W 채널 데이터가 유효함을 나타냅니다. <code>WREADY</code>와 동시에 HIGH일 때 데이터 beat가 전송됩니다.',
      },
      {
        signal: 'WREADY',
        width: '1 bit',
        source: 'Slave',
        usage: 'Core',
        description: 'slave가 write data beat를 받을 준비가 되었음을 의미합니다. 메모리 포트 혼잡이나 내부 FIFO 포화 시 LOW로 backpressure를 줄 수 있습니다.',
      },
    ],
  },
  b: {
    label: 'Write Response Channel (B)',
    summary: 'write burst 완료 후 결과 상태와 transaction ID를 반환하는 채널',
    footnote: '',
    rows: [
      {
        signal: 'BID',
        width: '<code>[ID_W-1:0]</code>',
        source: 'Slave',
        usage: 'Conditional',
        description: '응답 대상 write transaction의 ID입니다. master는 이를 통해 multi outstanding write 응답을 원래 request와 매칭합니다.',
      },
      {
        signal: 'BRESP',
        width: '2 bits',
        source: 'Slave',
        usage: 'Core',
        description: 'write 결과 상태 코드입니다. <code>OKAY</code>, <code>EXOKAY</code>, <code>SLVERR</code>, <code>DECERR</code>를 통해 성공/실패를 표현합니다.',
      },
      {
        signal: 'BUSER',
        width: '<code>[BUSER_W-1:0]</code>',
        source: 'Slave',
        usage: 'Optional',
        description: 'write response와 함께 전달되는 custom sideband 정보입니다. status class, debug context, implementation-specific metadata를 담을 수 있습니다.',
      },
      {
        signal: 'BVALID',
        width: '1 bit',
        source: 'Slave',
        usage: 'Core',
        description: 'write response가 유효함을 나타냅니다. master가 <code>BREADY</code>를 올릴 때 response transfer가 완료됩니다.',
      },
      {
        signal: 'BREADY',
        width: '1 bit',
        source: 'Master',
        usage: 'Core',
        description: 'master가 write response를 수락할 준비가 되었음을 나타냅니다. 여러 response를 순차 처리할 때 backpressure를 줄 수 있습니다.',
      },
    ],
  },
  ar: {
    label: 'Read Address Channel (AR)',
    summary: '읽기 burst의 시작 주소와 속성, ID를 전달하는 채널',
    footnote: '',
    rows: [
      {
        signal: 'ARID',
        width: '<code>[ID_W-1:0]</code>',
        source: 'Master',
        usage: 'Conditional',
        description: 'read transaction ID입니다. 여러 read가 동시에 진행될 때 response matching과 out-of-order completion 처리를 위한 키가 됩니다.',
      },
      {
        signal: 'ARADDR',
        width: '<code>[ADDR_W-1:0]</code>',
        source: 'Master',
        usage: 'Core',
        description: '읽기 burst의 시작 주소입니다. slave는 이 주소와 burst 속성을 사용해 각 beat의 데이터를 준비합니다.',
      },
      {
        signal: 'ARLEN',
        width: '8 bits',
        source: 'Master',
        usage: 'Core',
        description: 'read burst length minus one 값입니다. 예를 들어 <code>ARLEN=3</code>이면 4-beat read burst를 의미합니다.',
      },
      {
        signal: 'ARSIZE',
        width: '3 bits',
        source: 'Master',
        usage: 'Core',
        description: '한 read beat당 전송 바이트 수를 지정합니다. slave는 이를 기준으로 bus lane alignment를 계산합니다.',
      },
      {
        signal: 'ARBURST',
        width: '2 bits',
        source: 'Master',
        usage: 'Core',
        description: 'read burst 주소 진행 방식입니다. 일반적으로 <code>INCR</code>가 가장 많이 사용됩니다.',
      },
      {
        signal: 'ARLOCK',
        width: '1 bit',
        source: 'Master',
        usage: 'Conditional',
        description: 'exclusive read access 여부를 나타냅니다. lock/exclusive sequence를 구성할 때 사용되며, 일반 read에서는 0으로 둡니다.',
      },
      {
        signal: 'ARCACHE',
        width: '4 bits',
        source: 'Master',
        usage: 'Conditional',
        description: 'read access의 bufferable, modifiable, allocate 속성을 제공합니다. memory hierarchy의 처리 정책에 영향을 주지만, cache coherency 자체는 ACE/CHI나 coherent fabric 정책이 담당합니다.',
      },
      {
        signal: 'ARPROT',
        width: '3 bits',
        source: 'Master',
        usage: 'Conditional',
        description: '보호 속성 정보입니다. privilege, security, instruction/data 구분에 사용됩니다.',
      },
      {
        signal: 'ARQOS',
        width: '4 bits',
        source: 'Master',
        usage: 'Optional',
        description: 'read request의 QoS hint입니다. 고우선순위 latency-sensitive traffic과 bulk traffic을 구분할 때 활용됩니다.',
      },
      {
        signal: 'ARREGION',
        width: '4 bits',
        source: 'Master',
        usage: 'Optional',
        description: '동일 address decode 범위 안에서 logical region 구분이 필요할 때 사용하는 sideband입니다.',
      },
      {
        signal: 'ARUSER',
        width: '<code>[ARUSER_W-1:0]</code>',
        source: 'Master',
        usage: 'Optional',
        description: 'custom read address sideband 정보입니다. trace, security label, routing hint 등 구현별 확장이 가능합니다.',
      },
      {
        signal: 'ARVALID',
        width: '1 bit',
        source: 'Master',
        usage: 'Core',
        description: 'read address payload가 유효함을 나타냅니다. <code>ARREADY</code>와 동시에 HIGH가 되는 클럭 에지에서 read request가 accepted됩니다.',
      },
      {
        signal: 'ARREADY',
        width: '1 bit',
        source: 'Slave',
        usage: 'Core',
        description: 'slave가 read address를 수락할 준비가 되었음을 나타냅니다. 내부 queue depth나 arbitration 상태에 따라 backpressure를 줄 수 있습니다.',
      },
    ],
  },
  r: {
    label: 'Read Data Channel (R)',
    summary: 'read burst의 실제 데이터, 상태, 마지막 beat, ID를 반환하는 채널',
    footnote: '',
    rows: [
      {
        signal: 'RID',
        width: '<code>[ID_W-1:0]</code>',
        source: 'Slave',
        usage: 'Conditional',
        description: '현재 read data beat가 어떤 read request에 대한 응답인지 식별하는 ID입니다. multiple outstanding read에서 필수적인 매칭 키입니다.',
      },
      {
        signal: 'RDATA',
        width: '<code>[DATA_W-1:0]</code>',
        source: 'Slave',
        usage: 'Core',
        description: 'master로 반환되는 실제 read 데이터입니다. burst read에서는 여러 beat에 걸쳐 연속 전달됩니다.',
      },
      {
        signal: 'RRESP',
        width: '2 bits',
        source: 'Slave',
        usage: 'Core',
        description: 'read data beat의 상태 코드입니다. 정상 데이터인지, slave error인지, decode error인지 나타냅니다.',
      },
      {
        signal: 'RLAST',
        width: '1 bit',
        source: 'Slave',
        usage: 'Core',
        description: '현재 beat가 read burst의 마지막 데이터임을 의미합니다. master는 이를 기준으로 burst completion을 판단합니다.',
      },
      {
        signal: 'RUSER',
        width: '<code>[RUSER_W-1:0]</code>',
        source: 'Slave',
        usage: 'Optional',
        description: 'read data와 함께 오는 custom sideband 정보입니다. ECC class, trace tag, source metadata 등 설계 확장이 가능합니다.',
      },
      {
        signal: 'RVALID',
        width: '1 bit',
        source: 'Slave',
        usage: 'Core',
        description: 'read data beat가 유효함을 나타냅니다. <code>RREADY</code>와 동시에 HIGH일 때 해당 beat transfer가 완료됩니다.',
      },
      {
        signal: 'RREADY',
        width: '1 bit',
        source: 'Master',
        usage: 'Core',
        description: 'master가 read data beat를 받을 준비가 되었음을 나타냅니다. consumer pipeline이 막히면 LOW로 backpressure를 줄 수 있습니다.',
      },
    ],
  },
};

const axiFullSignalRefs = {
  buttons: Array.from(document.querySelectorAll('.axi-full-signal-btn')),
  label: document.getElementById('axi-full-signal-group-label'),
  summary: document.getElementById('axi-full-signal-group-summary'),
  stats: document.getElementById('axi-full-signal-stats'),
  tableBody: document.getElementById('axi-full-signal-table-body'),
  footnote: document.getElementById('axi-full-signal-footnote'),
};
let activeAxiFullSignalGroup = 'global';

function createAxiFullUsageBadge(usage = 'Core') {
  const usageClasses = {
    Core: 'bg-slate-900 text-white',
    Conditional: 'bg-amber-100 text-amber-900',
    Optional: 'bg-blue-100 text-blue-700',
  };

  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${usageClasses[usage] || 'bg-gray-100 text-gray-700'}">${usage}</span>`;
}

function getAxiFullShortDescription(row) {
  return row.shortDescription || axiFullSignalShortDescriptions[row.signal] || row.description;
}

function renderAxiFullSignalGroup(groupKey = 'global') {
  if (!axiFullSignalRefs.tableBody) return;

  const group = axiFullSignalGroups[groupKey] || axiFullSignalGroups.global;
  activeAxiFullSignalGroup = groupKey in axiFullSignalGroups ? groupKey : 'global';
  const counts = group.rows.reduce((acc, row) => {
    acc.total += 1;
    acc[row.usage] = (acc[row.usage] || 0) + 1;
    return acc;
  }, { total: 0, Core: 0, Conditional: 0, Optional: 0 });

  if (axiFullSignalRefs.label) axiFullSignalRefs.label.textContent = group.label;
  if (axiFullSignalRefs.summary) axiFullSignalRefs.summary.textContent = group.summary;
  if (axiFullSignalRefs.footnote) {
    const hasFootnote = Boolean((group.footnote || '').trim());
    axiFullSignalRefs.footnote.innerHTML = group.footnote;
    axiFullSignalRefs.footnote.classList.toggle('hidden', !hasFootnote);
  }
  if (axiFullSignalRefs.stats) {
    axiFullSignalRefs.stats.innerHTML = [
      `<span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">${counts.total} signals</span>`,
      counts.Core ? `<span class="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">${counts.Core} Core</span>` : '',
      counts.Conditional ? `<span class="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">${counts.Conditional} Conditional</span>` : '',
      counts.Optional ? `<span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">${counts.Optional} Optional</span>` : '',
    ].filter(Boolean).join('');
  }

  axiFullSignalRefs.tableBody.innerHTML = group.rows.map((row) => `
    <tr class="hover:bg-blue-50/30 transition-colors">
      <td class="py-3 px-4 align-top">
        <div class="flex flex-wrap items-center gap-2">
          <div class="font-bold text-gray-900 break-words"><code class="whitespace-normal break-all">${row.signal}</code></div>
          ${createAxiFullUsageBadge(row.usage)}
        </div>
      </td>
      <td class="py-3 px-4 align-top text-sm text-gray-500 break-all">${row.width}</td>
      <td class="py-3 px-4 align-top text-sm text-gray-500 break-words">${row.source}</td>
      <td class="py-3 px-4 align-top text-sm text-gray-600 leading-relaxed break-words">${getAxiFullShortDescription(row)}</td>
    </tr>
  `).join('');

  axiFullSignalRefs.buttons.forEach((button) => {
    const isActive = button.dataset.axiFullGroup === activeAxiFullSignalGroup;
    button.className = isActive ? axiFullSignalButtonActiveClass : axiFullSignalButtonInactiveClass;
    button.setAttribute('aria-pressed', String(isActive));
  });

  window.setTimeout(syncPageHeight, 40);
}
axiFullSignalRefs.buttons.forEach((button) => {
  button.addEventListener('click', () => {
    renderAxiFullSignalGroup(button.dataset.axiFullGroup || 'global');
  });
});

export function renderSignals() { renderAxiFullSignalGroup(activeAxiFullSignalGroup); }
