import { formatHex, ahbHsizeExamples, ahbBurstExamples } from './ahb-model.mjs';
export const axiLiteSingleWaveMeta = {
  axi_lite_write_single: {
    kicker: 'Single Write',
    title: 'Write transaction: single data item',
    description: '<code>AW</code>와 <code>W</code> 채널은 독립적으로 handshake될 수 있고, 두 채널이 모두 수락된 뒤 <code>BVALID</code> 응답이 반환됩니다.',
  },
  axi_lite_read_single: {
    kicker: 'Single Read',
    title: 'Read transaction: single data item',
    description: '<code>AR</code> 주소가 먼저 수락된 뒤 slave가 <code>RDATA</code>/<code>RRESP</code>를 내보내며, <code>RVALID</code>와 <code>RREADY</code>가 동시에 HIGH일 때 read가 완료됩니다.',
  },
};

export const axiStreamTimingWaveMeta = {
  axis_basic_transfer: {
    kicker: 'Transfer',
    title: 'Basic TVALID / TREADY transfer',
    description: 'source와 sink가 모두 준비되면 매 cycle마다 1 beat씩 수락되며, 주소 채널 없이 payload가 바로 진행됩니다.',
  },
  axis_backpressure_stall: {
    kicker: 'Backpressure',
    title: 'Stall while TREADY is LOW',
    description: '<code>TREADY</code>가 LOW인 동안 source는 <code>TVALID</code>와 현재 <code>TDATA</code>를 유지한 채 기다리며, ready가 복귀한 에지에서 transfer가 재개됩니다.',
  },
  axis_tlast_packet: {
    kicker: 'Packet End',
    title: 'TLAST packet boundary',
    description: '마지막 beat에서 <code>TLAST</code>가 packet 종료를 표시하고, <code>TKEEP</code>는 마지막 beat의 유효 byte 범위를 함께 설명할 수 있습니다.',
  },
};

export const axiFullTimingWaveMeta = {
  axi_full_write_dependency: {
    kicker: 'Write Dependency',
    title: 'AXI4 BRESP after AW + final W',
    description: '<code>BVALID</code>는 AXI4에서 write address와 마지막 write data beat가 모두 수락된 뒤에만 올라올 수 있습니다.',
    points: [
      '<code>AWVALID</code>와 <code>WVALID</code>는 각각 READY를 기다리지 않고 독립적으로 나와야 합니다.',
      'AXI4/AXI5 write response는 address acceptance까지 끝난 뒤에만 가능합니다.',
      '하나의 <code>BRESP</code>는 burst 전체 결과를 대표합니다.'
    ]
  },
  axi_full_read_dependency: {
    kicker: 'Read Dependency',
    title: 'AXI4 RVALID after AR',
    description: '<code>RVALID</code>는 read address가 수락된 뒤에만 생성될 수 있고, read data channel의 payload는 <code>RVALID</code>와 함께 유효해야 합니다.',
    points: [
      '<code>ARVALID</code>는 master가 먼저 구동합니다.',
      '<code>RVALID</code>가 올라오면 <code>RDATA</code>, <code>RRESP</code>, <code>RID</code>가 함께 유효해야 합니다.',
      '마지막 beat에서는 <code>RLAST</code>가 반드시 함께 올라와야 합니다.'
    ]
  },
  axi_full_write_backpressure: {
    kicker: 'Write Backpressure',
    title: 'W channel holds during stall',
    description: '<code>WVALID</code>가 HIGH인데 <code>WREADY</code>가 LOW이면 master는 <code>WDATA</code>, <code>WSTRB</code>, <code>WLAST</code>를 안정적으로 유지해야 합니다.',
    points: [
      '<code>WVALID</code>는 <code>WREADY</code>를 기다린 뒤에야 올라오는 구조가 되면 안 됩니다.',
      'stall 동안 write data/control 정보는 같은 beat를 가리켜야 합니다.',
      'single-beat write라도 <code>WLAST</code>는 해당 beat와 함께 유지됩니다.'
    ]
  },
  axi_full_read_backpressure: {
    kicker: 'Read Backpressure',
    title: 'R channel holds during stall',
    description: '<code>RVALID</code>가 HIGH인데 <code>RREADY</code>가 LOW이면 slave는 read data beat를 유지하고, handshake가 된 뒤 다음 상태로 넘어갑니다.',
    points: [
      '<code>RVALID</code>는 master의 <code>RREADY</code> 선행 여부와 독립적으로 assert될 수 있어야 합니다.',
      '<code>RDATA</code>, <code>RRESP</code>, <code>RID</code>, <code>RLAST</code>는 stall 동안 한 beat로 고정됩니다.',
      'master는 준비가 되면 <code>RREADY</code>를 올려 해당 beat를 수락합니다.'
    ]
  },
  axi_full_write_burst: {
    kicker: 'Write Burst',
    title: 'One AW, many W beats',
    description: 'AXI4 write burst는 주소를 한 번만 보내고, <code>WDATA</code>를 여러 beat로 전송한 뒤 burst 전체에 대해 <code>BRESP</code>를 한 번 받습니다.',
    points: [
      '<code>AWLEN=3</code>은 총 4 beats 전송을 뜻합니다.',
      '<code>WLAST</code>는 마지막 beat에서만 HIGH가 됩니다.',
      '어느 beat에서 에러가 나더라도 slave는 burst를 끝까지 받은 뒤 최종 <code>BRESP</code>를 반환합니다.'
    ]
  },
  axi_full_read_burst: {
    kicker: 'Read Burst',
    title: 'One AR, many R beats',
    description: 'read burst에서는 <code>AR</code>가 한 번 수락된 뒤, slave가 각 beat마다 <code>RDATA</code>와 <code>RRESP</code>를 함께 반환하고 마지막에서 <code>RLAST</code>를 표시합니다.',
    points: [
      '<code>ARLEN=2</code>는 총 3 beats 반환을 의미합니다.',
      'read는 <code>RRESP</code>가 beat마다 붙고, write처럼 별도 B 채널 응답을 쓰지 않습니다.',
      '도중에 error가 보고돼도 burst 길이 자체는 끝까지 유지됩니다.'
    ]
  },
  axi_full_write_data_first: {
    kicker: 'Leading Write Data',
    title: 'W channel can lead AW',
    description: 'AXI는 채널 간 고정 타이밍 관계를 정의하지 않기 때문에, interface 상에서는 <code>W</code> 채널이 <code>AW</code>보다 먼저 보일 수 있습니다.',
    points: [
      '이 동작은 AXI 프로토콜상 허용되며, interconnect가 필요하면 AW/W를 내부에서 realign해야 합니다.',
      '선행 write data가 있어도 최종 write response는 address acceptance까지 끝난 뒤에만 가능합니다.',
      '실제 RTL에서는 destination decode가 address에 의존한다면 write data buffering이 필요합니다.'
    ]
  },
  axi_full_read_id_order: {
    kicker: 'ID Ordering',
    title: 'Same RID stays ordered',
    description: '예시에서는 ID 1의 응답이 ID 0보다 먼저 돌아오지만, 같은 ID 0으로 발행된 A와 C는 요청된 순서를 유지해 A 뒤에 C가 반환됩니다.',
    points: [
      '서로 다른 ID 사이에는 read return order 제한이 없습니다.',
      '같은 ID는 요청 순서대로 complete되어야 하므로 C가 A를 추월하면 안 됩니다.',
      'master는 <code>RID</code>를 보고 response matching과 reorder handling을 수행합니다.'
    ]
  },
  axi_full_reset_release: {
    kicker: 'Reset',
    title: 'VALID low until reset release',
    description: '<code>ARESETn</code>이 assert된 동안 master VALID 신호는 LOW여야 하며, reset 해제는 <code>ACLK</code> 상승 에지에 동기화해서 정상 transaction을 시작합니다.',
    points: [
      'reset 중 <code>ARVALID</code>, <code>AWVALID</code>, <code>WVALID</code>는 LOW로 유지합니다.',
      'reset 해제 뒤 첫 valid transfer는 clock edge 기준으로 정렬합니다.',
      'slave response VALID도 reset 이후 정상 request 흐름에 맞춰 생성됩니다.'
    ]
  },
  axi_full_axi3_write_response: {
    kicker: 'AXI3 Contrast',
    title: 'AXI3 BRESP dependency differs',
    description: 'AXI3에서는 legacy write response dependency를 비교용으로 보여줍니다. AXI4/AXI5에서는 같은 RTL로 구현하면 안 되고, address acceptance까지 기다려야 합니다.',
    points: [
      'AXI3 diagram은 마지막 W beat 이후 response가 가능했던 과거 규칙을 설명하기 위한 비교 예시입니다.',
      'AXI4/AXI5 설계에서는 <code>AW</code>와 마지막 <code>W</code> 모두 수락된 뒤 <code>BVALID</code>를 올립니다.',
      '프로젝트가 AXI4 기반이면 이 버튼은 legacy 차이를 이해하는 용도로만 보면 됩니다.'
    ]
  }
};
export const timingAnalysisData = {
  apb: {
    write_nowait: [
      '<code>PSELx</code> 선행 활성화 뒤 <code>PENABLE</code> 1-cycle 지연 구조',
      '<code>PADDR</code>·<code>PWRITE</code>·<code>PWDATA</code>의 SETUP 구간 유지 조건',
      '<code>PREADY</code> HIGH 고정 상태의 2-cycle write 완료 패턴',
      'ACCESS 종료 상승 에지의 write 데이터 샘플링 기준'
    ],
    write_wait: [
      '<code>PENABLE</code> 유지 상태의 ACCESS 연장 구조',
      '<code>PREADY</code> LOW 구간의 wait state 삽입 위치',
      'wait 구간 전체의 address·control·data 유지 조건',
      '<code>PREADY</code> HIGH 복귀 cycle의 전송 완료 판단'
    ],
    read_nowait: [
      '<code>PWRITE=0</code> 기반 read transfer 식별 조건',
      '<code>PRDATA</code> 유효 시점과 ACCESS 완료 에지 정렬',
      '<code>PREADY</code> HIGH 고정 상태의 무지연 read 응답 구조',
      'SETUP→ACCESS 2-cycle 기반의 read 반환 구조'
    ],
    read_wait: [
      'slave read latency 반영용 ACCESS 확장 구조',
      '<code>PRDATA</code> invalid 유지 구간과 valid 전환 cycle',
      '<code>PREADY</code> HIGH 복귀 시점의 read data sampling 기준',
      'wait 구간 전체의 control signal 유지 조건'
    ],
    error_response: [
      '정상 transfer와 동일한 SETUP→ACCESS 기본 골격',
      '<code>PREADY</code>·<code>PSLVERR</code> 동시 유효 기반 error completion',
      'ACCESS 완료 cycle의 error 판정 시점',
      '정상 완료와 오류 완료의 판별 기준'
    ]
  },
  ahb: {
    ahb_single: [
      '<code>Address Phase</code> 선행, <code>Data Phase</code> 후행의 2단 파이프라인 구조',
      '<code>HTRANS=NONSEQ</code> 기반 단일 전송 시작 조건',
      '<code>HADDR</code>와 다음 cycle <code>HWDATA</code>/<code>HRDATA</code>의 대응 관계',
      '<code>HREADY</code> HIGH 고정 상태의 무지연 완료 조건'
    ],
    ahb_incr4: [
      '<code>HBURST=INCR4</code> 기반 선형 증가 주소 패턴',
      '첫 beat <code>NONSEQ</code> 뒤 연속 <code>SEQ</code> 전개 구조',
      'burst 주소와 write data beat의 1-cycle 오프셋 정렬',
      '4-beat burst 경계와 다음 전송 연결 포인트'
    ],
    ahb_wrap4: [
      '<code>HBURST=WRAP4</code> 기반 wrapping 주소 패턴',
      'wrap boundary 도달 뒤 시작 경계 복귀 구조',
      'cache line aligned burst 판독용 주소 순환 관계',
      '<code>SEQ</code> 유지 상태의 연속 beat 진행 구조'
    ],
    ahb_burst_wait: [
      '<code>HREADY</code> LOW 구간의 data phase stall 삽입',
      '현재 data phase와 다음 address phase의 동시 정지 구조',
      'stall 구간 전체의 address·control·data 유지 조건',
      '<code>HREADY</code> HIGH 복귀 cycle의 burst 재개 기준'
    ],
    ahb_error_response: [
      'ARM IHI 0011A Figure 3-14 기준: slave가 먼저 1-cycle <code>OKAY</code> wait를 넣은 뒤 two-cycle <code>ERROR</code>로 transfer를 종료',
      '<code>HREADY</code> LOW 동안 write data phase가 유지되고, 마지막 <code>ERROR</code> cycle에서 <code>HREADY</code>가 HIGH로 올라오며 종료됨',
      '<code>ERROR</code>는 현재 transfer 실패를 의미하므로 이후 burst continuation은 master가 선택적으로 중단 또는 지속 가능',
      '파이프라인 구조상 error 판정은 이미 시작된 data phase에서 돌아오므로 응답 타이밍은 address phase보다 한 박자 늦게 보임'
    ],
    ahb_retry_response: [
      'ARM IHI 0011A Figure 3-13 기준의 two-cycle <code>RETRY</code> 응답 예시',
      'slave가 <code>RETRY</code>를 내면 이미 broadcast된 다음 주소 <code>A+4</code>는 취소되고, master는 <code>HTRANS=IDLE</code>로 되돌려 파이프라인을 비움',
      '그 다음 동일 전송을 다시 <code>NONSEQ</code>로 재구동해 <code>A</code>를 재시도하며, 완료될 때까지 반복 가능',
      '이 예시는 classic multi-master AHB response 동작을 보여주며, bus back-off와 재시도 관계를 이해할 때 핵심이 됨'
    ]
  },
  ahbArb: {
    ahbarb_grant_nowait: [
      'ARM IHI 0011A Figure 3-15 기준의 zero wait-state arbitration 예시',
      '<code>HBUSREQ</code> 요청 뒤 arbiter가 <code>HGRANT</code>를 올리고, <code>HREADY</code>가 HIGH인 상태에서 즉시 소유권 전환',
      '<code>HMASTER</code>가 새 마스터 번호로 갱신된 직후 <code>HTRANS=NONSEQ</code> address phase 시작',
      'wait state가 없으므로 address phase와 write data phase가 연속적으로 이어짐'
    ],
    ahbarb_grant_wait: [
      'ARM IHI 0011A Figure 3-16 기준의 wait-state arbitration 예시',
      '<code>HGRANT</code>가 먼저 유효해도 <code>HREADY</code>가 LOW이면 실제 handover가 지연됨',
      '<code>HMASTER</code> 갱신과 address sampling은 <code>HREADY</code>가 HIGH로 복귀한 뒤에 진행',
      '따라서 wait state는 grant latency보다 실제 bus ownership latency를 더 크게 만듦'
    ],
    ahbarb_handover: [
      'ARM IHI 0011A Figure 3-17의 data bus ownership 개념을 기준으로 재구성',
      'address/control bus ownership은 새 master로 먼저 넘어가도 data bus ownership은 직전 transfer 완료까지 유지됨',
      '그래서 <code>HADDR=B</code>가 보이더라도 같은 구간에서 <code>HWDATA(A+12)</code>가 아직 master 1 데이터일 수 있음',
      'AHB 파이프라인 특성상 address/control handover와 data handover는 1 phase 늦게 분리되어 보인다'
    ]
  },
  axi: {
    axi_valid_before: [
      'source 선행 구동형 <code>VALID</code> 준비 구조',
      '<code>READY</code> 대기 구간의 information 유지 조건',
      'backpressure 흡수용 <code>VALID</code> 유지 구간',
      '<code>VALID</code>·<code>READY</code> 동시 성립 에지의 전송 완료 기준'
    ],
    axi_ready_before: [
      'destination 선행 구동형 <code>READY</code> 준비 구조',
      '<code>VALID</code> 도착 직후의 zero-wait handshake 가능 상태',
      'idle 구간의 ready pre-assertion 패턴',
      '첫 simultaneous HIGH 에지의 전송 수용 기준'
    ],
    axi_concurrent: [
      'same-cycle assertion 기반의 최소 지연 handshake',
      'information valid와 acceptance의 동시 성립 구조',
      'channel utilization 극대화 기준 파형',
      '최소 latency 기준 패턴'
    ]
  }
};

Object.assign(
  timingAnalysisData.ahb,
  {
    ahb_incr4: [
      '<code>HBURST=011</code> 기반 4-beat incrementing burst 구조',
      '<code>NONSEQ→SEQ→SEQ→SEQ</code> 전개의 고정 길이 burst 패턴',
      '4Byte stride 기준의 선형 주소 증가 관계',
      '4번째 beat 종료 시점의 burst completion 기준'
    ],
    ahb_wrap4: [
      '<code>HBURST=010</code> 기반 4-beat wrapping burst 구조',
      '16Byte wrap boundary 기준의 주소 순환 패턴',
      'wrap boundary 도달 뒤 시작 경계 복귀 관계',
      'cache line aligned transfer 판독 기준'
    ]
  },
  Object.fromEntries(
    ahbHsizeExamples.map((example) => [
      example.key,
      [
        `<code>HSIZE=${example.code}</code> 기반 ${example.label} 전송 크기 정의`,
        `${example.bytes}Byte 단위 주소 증가 기준`,
        `${example.bytes}Byte 경계 기준의 주소 정렬 포인트`,
        '<code>HBURST=SINGLE</code> 조건의 단일 전송 타이밍 기준'
      ]
    ])
  ),
  Object.fromEntries(
    ahbBurstExamples.map((example) => {
      if (example.key === 'ahb_burst_single') {
        return [
          example.key,
          [
            '<code>HBURST=000</code> 기반 1-beat 단일 전송 구조',
            '<code>HTRANS=NONSEQ</code> 단독 발생 조건',
            '추가 <code>SEQ</code> beat 부재 상태의 burst 종료 관계',
            '단일 beat 완료 뒤 다음 전송 재개 기준'
          ]
        ];
      }

      if (example.key === 'ahb_burst_incr') {
        return [
          example.key,
          [
            '<code>HBURST=001</code> 기반 incrementing burst 예시',
            '표시 구간 6-beat 기준의 선형 주소 증가 패턴',
            '<code>NONSEQ</code> 뒤 연속 <code>SEQ</code> 전개 구조',
            '고정 경계 복귀 없는 가변 길이 burst 기준'
          ]
        ];
      }

      const wrapBoundary = example.beats * 4;
      const isWrap = example.kind === 'wrap';
      return [
        example.key,
        [
          `<code>HBURST=${example.code}</code> 기반 ${example.label} burst 구조`,
          `${example.beats}-beat 고정 길이 burst 전개`,
          isWrap
            ? `${wrapBoundary}Byte wrap boundary 기준의 주소 순환 패턴`
            : '4Byte stride 기준의 선형 주소 증가 패턴',
          isWrap
            ? 'wrap boundary 도달 뒤 시작 경계 복귀 관계'
            : `제${example.beats} beat 종료 시점의 burst completion 기준`
        ]
      ];
    })
  )
);
