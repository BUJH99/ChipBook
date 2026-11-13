export const waveData = {
  write_nowait: {
    signal: [
      { name: 'PCLK', wave: 'p....' },
      { name: 'PADDR', wave: 'x=.x.', data: ['Addr'] },
      { name: 'PWRITE', wave: '01.0.' },
      { name: 'PSELx', wave: '01.0.' },
      { name: 'PENABLE', wave: '0.10.' },
      { name: 'PWDATA', wave: 'x=.x.', data: ['WData'] },
      { name: 'PREADY', wave: '1....' },
      { name: 'PRDATA', wave: 'x....' },
      { name: 'PSLVERR', wave: '0....' }
    ],
    head: { text: 'Write Transfer (No Wait States)', tick: 0 },
    config: { hscale: 1.5 }
  },
  write_wait: {
    signal: [
      { name: 'PCLK', wave: 'p......' },
      { name: 'PADDR', wave: 'x=...x.', data: ['Addr'] },
      { name: 'PWRITE', wave: '01...0.' },
      { name: 'PSELx', wave: '01...0.' },
      { name: 'PENABLE', wave: '0.1..0.' },
      { name: 'PWDATA', wave: 'x=...x.', data: ['WData'] },
      { name: 'PREADY', wave: '1.0.1..' },
      { name: 'PRDATA', wave: 'x......' },
      { name: 'PSLVERR', wave: '0......' }
    ],
    head: { text: 'Write Transfer (With Wait States)', tick: 0 },
    config: { hscale: 1.5 }
  },
  read_nowait: {
    signal: [
      { name: 'PCLK', wave: 'p....' },
      { name: 'PADDR', wave: 'x=.x.', data: ['Addr'] },
      { name: 'PWRITE', wave: '0....' },
      { name: 'PSELx', wave: '01.0.' },
      { name: 'PENABLE', wave: '0.10.' },
      { name: 'PWDATA', wave: 'x....' },
      { name: 'PREADY', wave: '1....' },
      { name: 'PRDATA', wave: 'x.=.x', data: ['RData'] },
      { name: 'PSLVERR', wave: '0....' }
    ],
    head: { text: 'Read Transfer (No Wait States)', tick: 0 },
    config: { hscale: 1.5 }
  },
  read_wait: {
    signal: [
      { name: 'PCLK', wave: 'p......' },
      { name: 'PADDR', wave: 'x=...x.', data: ['Addr'] },
      { name: 'PWRITE', wave: '0......' },
      { name: 'PSELx', wave: '01...0.' },
      { name: 'PENABLE', wave: '0.1..0.' },
      { name: 'PWDATA', wave: 'x......' },
      { name: 'PREADY', wave: '1.0.1..' },
      { name: 'PRDATA', wave: 'x...=.x', data: ['RData'] },
      { name: 'PSLVERR', wave: '0......' }
    ],
    head: { text: 'Read Transfer (With Wait States)', tick: 0 },
    config: { hscale: 1.5 }
  },
  error_response: {
    signal: [
      { name: 'PCLK', wave: 'p....' },
      { name: 'PADDR', wave: 'x=.x.', data: ['Addr'] },
      { name: 'PWRITE', wave: '01.0.' },
      { name: 'PSELx', wave: '01.0.' },
      { name: 'PENABLE', wave: '0.10.' },
      { name: 'PWDATA', wave: 'x=.x.', data: ['WData'] },
      { name: 'PREADY', wave: '1....' },
      { name: 'PRDATA', wave: 'x....' },
      { name: 'PSLVERR', wave: '0.10.' }
    ],
    head: { text: 'Error Response (Write, No Wait)', tick: 0 },
    config: { hscale: 1.5 }
  },
  ahb_single: {
    signal: [
      { name: 'HCLK', wave: 'p.......' },
      { name: 'HADDR', wave: 'x==x....', data: ['Addr A', 'Addr B'] },
      { name: 'HWRITE', wave: 'x10x....' },
      { name: 'HSIZE', wave: 'x22x....', data: ['WORD', 'WORD'] },
      { name: 'HBURST', wave: 'x22x....', data: ['SINGLE', 'SINGLE'] },
      { name: 'HTRANS', wave: 'x==x....', data: ['NONSEQ', 'NONSEQ'] },
      { name: 'HWDATA', wave: 'xx=x....', data: ['WData(A)'] },
      { name: 'HRDATA', wave: 'xxx=....', data: ['RData(B)'] },
      { name: 'HREADY', wave: '1.......' }
    ],
    head: { text: 'AHB Basic Single Transfers (Write followed by Read)', tick: 0 },
    config: { hscale: 1.5 }
  },
  ahb_incr4: {
    signal: [
      { name: 'HCLK', wave: 'p.......' },
      { name: 'HADDR', wave: 'x====xx.', data: ['0x38', '0x3C', '0x40', '0x44'] },
      { name: 'HWRITE', wave: 'x1...xx.' },
      { name: 'HSIZE', wave: 'x2...xx.', data: ['WORD'] },
      { name: 'HBURST', wave: 'x2...xx.', data: ['INCR4'] },
      { name: 'HTRANS', wave: 'x====xx.', data: ['NONSEQ', 'SEQ', 'SEQ', 'SEQ'] },
      { name: 'HWDATA', wave: 'xx====x.', data: ['D(0x38)', 'D(0x3C)', 'D(0x40)', 'D(0x44)'] },
      { name: 'HREADY', wave: '1.......' }
    ],
    head: { text: 'AHB 4-Beat Incrementing Burst (INCR4, Word Size)', tick: 0 },
    config: { hscale: 1.5 }
  },
  ahb_wrap4: {
    signal: [
      { name: 'HCLK', wave: 'p.......' },
      { name: 'HADDR', wave: 'x====xx.', data: ['0x38', '0x3C', '0x30', '0x34'] },
      { name: 'HWRITE', wave: 'x1...xx.' },
      { name: 'HSIZE', wave: 'x2...xx.', data: ['WORD'] },
      { name: 'HBURST', wave: 'x2...xx.', data: ['WRAP4'] },
      { name: 'HTRANS', wave: 'x====xx.', data: ['NONSEQ', 'SEQ', 'SEQ', 'SEQ'] },
      { name: 'HWDATA', wave: 'xx====x.', data: ['D(0x38)', 'D(0x3C)', 'D(0x30)', 'D(0x34)'] },
      { name: 'HREADY', wave: '1.......' }
    ],
    head: { text: 'AHB 4-Beat Wrapping Burst (WRAP4, Word Size)', tick: 0 },
    config: { hscale: 1.5 }
  },
  ahb_burst_wait: {
    signal: [
      { name: 'HCLK', wave: 'p........' },
      { name: 'HADDR', wave: 'x==..=xx.', data: ['0x38', '0x3C', '0x40'] },
      { name: 'HWRITE', wave: 'x1....xx.' },
      { name: 'HSIZE', wave: 'x2....xx.', data: ['WORD'] },
      { name: 'HBURST', wave: 'x2....xx.', data: ['INCR4'] },
      { name: 'HTRANS', wave: 'x==..=xx.', data: ['NONSEQ', 'SEQ', 'SEQ'] },
      { name: 'HWDATA', wave: 'xx=..==x.', data: ['D(0x38)', 'D(0x3C)', 'D(0x40)'] },
      { name: 'HREADY', wave: '1.0.1....' }
    ],
    head: { text: 'AHB Burst with Wait States (INCR4)', tick: 0 },
    config: { hscale: 1.5 }
  },
  ahb_error_response: {
    signal: [
      { name: 'HCLK', wave: 'p.......' },
      { name: 'HADDR', wave: 'x=x.....', data: ['A'] },
      { name: 'HWRITE', wave: 'x1......' },
      { name: 'HSIZE', wave: 'x2......', data: ['WORD'] },
      { name: 'HTRANS', wave: 'x=......', data: ['NONSEQ'] },
      { name: 'HWDATA', wave: 'xx=.....', data: ['Data(A)'] },
      { name: 'HREADY', wave: '1.0.1...' },
      { name: 'HRESP[1:0]', wave: 'xx===...', data: ['OKAY', 'ERROR', 'ERROR'] }
    ],
    head: { text: 'AHB Error Response (Wait State then Two-Cycle ERROR)', tick: 0 },
    config: { hscale: 1.55 }
  },
  ahb_retry_response: {
    signal: [
      { name: 'HCLK', wave: 'p.......' },
      { name: 'HADDR', wave: 'x==x=...', data: ['A', 'A+4', 'A (retry)'] },
      { name: 'HWRITE', wave: 'x1......' },
      { name: 'HSIZE', wave: 'x2......', data: ['WORD'] },
      { name: 'HTRANS', wave: 'x====...', data: ['NONSEQ', 'SEQ', 'IDLE', 'NONSEQ'] },
      { name: 'HWDATA', wave: 'xx=x.=..', data: ['Data(A)', 'Data(A)'] },
      { name: 'HREADY', wave: '1.01....' },
      { name: 'HRESP[1:0]', wave: 'xx==x=..', data: ['RETRY', 'RETRY', 'OKAY'] }
    ],
    head: { text: 'AHB Retry Response (Cancel Next Beat and Re-Issue Transfer)', tick: 0 },
    config: { hscale: 1.55 }
  },
  ahbarb_grant_nowait: {
    signal: [
      { name: 'HCLK', wave: 'p........' },
      { name: 'HBUSREQ_M1', wave: '01.......' },
      { name: 'HGRANT_M1', wave: '0..1.....' },
      { name: 'HMASTER[3:0]', wave: 'x..=.....', data: ['#1'] },
      { name: 'HREADY', wave: '1........' },
      { name: 'HTRANS[1:0]', wave: 'x...==x..', data: ['NONSEQ', 'SEQ'] },
      { name: 'HADDR[31:0]', wave: 'x...==x..', data: ['A', 'A+4'] },
      { name: 'HWDATA[31:0]', wave: 'xxxxx==x.', data: ['Data(A)', 'Data(A+4)'] }
    ],
    head: { text: 'AHB Arbitration: Granting Access with No Wait States', tick: 0 },
    config: { hscale: 1.6 }
  },
  ahbarb_grant_wait: {
    signal: [
      { name: 'HCLK', wave: 'p..........' },
      { name: 'HBUSREQ_M1', wave: '01.........' },
      { name: 'HGRANT_M1', wave: '0..1.......' },
      { name: 'HREADY', wave: '1...00.1111' },
      { name: 'HMASTER[3:0]', wave: 'x......=...', data: ['#1'] },
      { name: 'HTRANS[1:0]', wave: 'x.......==x', data: ['NONSEQ', 'SEQ'] },
      { name: 'HADDR[31:0]', wave: 'x.......==x', data: ['A', 'A+4'] },
      { name: 'HWDATA[31:0]', wave: 'xxxxxxxx=.x', data: ['Data(A)'] }
    ],
    head: { text: 'AHB Arbitration: Granting Access with Wait States', tick: 0 },
    config: { hscale: 1.6 }
  },
  ahbarb_handover: {
    signal: [
      { name: 'HCLK', wave: 'p.........' },
      { name: 'HGRANT_M1', wave: '1....0....' },
      { name: 'HGRANT_M2', wave: '0....1....' },
      { name: 'HMASTER[3:0]', wave: 'x====.===.', data: ['#1', '#1', '#1', '#1', '#2', '#2', '#2'] },
      { name: 'HREADY', wave: '1.........' },
      { name: 'HTRANS[1:0]', wave: 'x====.==x.', data: ['NONSEQ', 'SEQ', 'SEQ', 'SEQ', 'NONSEQ', 'SEQ'] },
      { name: 'HADDR[31:0]', wave: 'x====.==x.', data: ['A', 'A+4', 'A+8', 'A+12', 'B', 'B+4'] },
      { name: 'HWDATA[31:0]', wave: 'xx====.=x.', data: ['Data(A)', 'Data(A+4)', 'Data(A+8)', 'Data(A+12)', 'Data(B)'] }
    ],
    head: { text: 'AHB Arbitration: Bus Master Handover (Ownership)', tick: 0 },
    config: { hscale: 1.55 }
  },
  axi_valid_before: {
    signal: [
      { name: 'ACLK', wave: 'p....' },
      { name: 'Information', wave: 'x=...x', data: ['Valid Data'] },
      { name: 'VALID', wave: '01...0' },
      { name: 'READY', wave: '0..10.' }
    ],
    head: { text: 'VALID before READY (Source가 먼저 데이터 준비)', tick: 0 },
    config: { hscale: 1.5 }
  },
  axi_ready_before: {
    signal: [
      { name: 'ACLK', wave: 'p....' },
      { name: 'Information', wave: 'x..=.x', data: ['Valid Data'] },
      { name: 'VALID', wave: '0..10.' },
      { name: 'READY', wave: '01...0' }
    ],
    head: { text: 'READY before VALID (Destination이 먼저 받을 준비)', tick: 0 },
    config: { hscale: 1.5 }
  },
  axi_concurrent: {
    signal: [
      { name: 'ACLK', wave: 'p....' },
      { name: 'Information', wave: 'x=.x..', data: ['Valid Data'] },
      { name: 'VALID', wave: '010...' },
      { name: 'READY', wave: '010...' }
    ],
    head: { text: 'Concurrent VALID & READY (동시에 준비됨)', tick: 0 },
    config: { hscale: 1.5 }
  },
  axi_lite_write_single: {
    signal: [
      { name: 'ACLK', wave: 'p.......' },
      { name: 'AWADDR', wave: 'x==x....', data: ['Reg A'] },
      { name: 'AWVALID', wave: '01.0....' },
      { name: 'AWREADY', wave: '0.10....' },
      { name: 'WDATA', wave: 'xx==x...', data: ['WData'] },
      { name: 'WSTRB', wave: 'xx==x...', data: ['1111'] },
      { name: 'WVALID', wave: '0.01.0..' },
      { name: 'WREADY', wave: '0..10...' },
      { name: 'BRESP', wave: 'xxxx=x..', data: ['OKAY'] },
      { name: 'BVALID', wave: '0...10..' },
      { name: 'BREADY', wave: '01......' }
    ],
    head: { text: 'AXI4-Lite Write Transaction (Single Data Item)', tick: 0 },
    config: { hscale: 1.08 }
  },
  axi_lite_read_single: {
    signal: [
      { name: 'ACLK', wave: 'p.......' },
      { name: 'ARADDR', wave: 'x==x....', data: ['Reg B'] },
      { name: 'ARVALID', wave: '01.0....' },
      { name: 'ARREADY', wave: '0.10....' },
      { name: 'RDATA', wave: 'xxxx==x.', data: ['0x1234_5678'] },
      { name: 'RRESP', wave: 'xxxx=x..', data: ['OKAY'] },
      { name: 'RVALID', wave: '0...10..' },
      { name: 'RREADY', wave: '01......' }
    ],
    head: { text: 'AXI4-Lite Read Transaction (Single Data Item)', tick: 0 },
    config: { hscale: 1.08 }
  },
  axis_basic_transfer: {
    signal: [
      { name: 'ACLK', wave: 'p.......' },
      { name: 'TDATA', wave: 'x====x..', data: ['D0', 'D1', 'D2', 'D3'] },
      { name: 'TVALID', wave: '01....0.' },
      { name: 'TREADY', wave: '01....0.' },
      { name: 'TLAST', wave: '0....10.' }
    ],
    head: { text: 'AXI4-Stream Basic Transfer', tick: 0 },
    config: { hscale: 1.2 }
  },
  axis_backpressure_stall: {
    signal: [
      { name: 'ACLK', wave: 'p.......' },
      { name: 'TDATA', wave: 'x=...x..', data: ['Beat0'] },
      { name: 'TVALID', wave: '01....0.' },
      { name: 'TREADY', wave: '0001....' }
    ],
    head: { text: 'AXI4-Stream Backpressure Stall', tick: 0 },
    config: { hscale: 1.2 }
  },
  axis_tlast_packet: {
    signal: [
      { name: 'ACLK', wave: 'p.......' },
      { name: 'TDATA', wave: 'x====x..', data: ['P0', 'P1', 'P2', 'P3'] },
      { name: 'TKEEP', wave: 'x====x..', data: ['F', 'F', 'F', '3'] },
      { name: 'TVALID', wave: '01....0.' },
      { name: 'TREADY', wave: '01....0.' },
      { name: 'TLAST', wave: '0....10.' }
    ],
    head: { text: 'AXI4-Stream Packet End with TLAST', tick: 0 },
    config: { hscale: 1.2 }
  },
  axi_full_write_dependency: {
    signal: [
      { name: 'ACLK', wave: 'p.........' },
      { name: 'AWADDR', wave: 'x==x......', data: ['A0'] },
      { name: 'AWLEN', wave: 'x==x......', data: ['2'] },
      { name: 'AWSIZE', wave: 'x==x......', data: ['4B'] },
      { name: 'AWVALID', wave: '01.0......' },
      { name: 'AWREADY', wave: '0.10......' },
      { name: 'WDATA', wave: 'xxx===x...', data: ['D0', 'D1', 'D2'] },
      { name: 'WSTRB', wave: 'xxx===x...', data: ['F', 'F', '3'] },
      { name: 'WVALID', wave: '0001..0...' },
      { name: 'WREADY', wave: '0001..0...' },
      { name: 'WLAST', wave: '0000010...' },
      { name: 'BRESP', wave: 'xxxxxxx=x.', data: ['OK'] },
      { name: 'BVALID', wave: '000000010.' },
      { name: 'BREADY', wave: '01........' }
    ],
    head: { text: 'Write Dep', tick: 0 },
    config: { hscale: 1.08 }
  },
  axi_full_read_dependency: {
    signal: [
      { name: 'ACLK', wave: 'p.........' },
      { name: 'ARADDR', wave: 'x==x......', data: ['A0'] },
      { name: 'ARLEN', wave: 'x==x......', data: ['2'] },
      { name: 'ARSIZE', wave: 'x==x......', data: ['8B'] },
      { name: 'ARVALID', wave: '01.0......' },
      { name: 'ARREADY', wave: '0.10......' },
      { name: 'RID', wave: 'xxxx===x..', data: ['0', '0', '0'] },
      { name: 'RDATA', wave: 'xxxx===x..', data: ['Q0', 'Q1', 'Q2'] },
      { name: 'RRESP', wave: 'xxxx===x..', data: ['OK', 'OK', 'OK'] },
      { name: 'RVALID', wave: '00001..0..' },
      { name: 'RREADY', wave: '01........' },
      { name: 'RLAST', wave: '00000010..' }
    ],
    head: { text: 'Read Dep', tick: 0 },
    config: { hscale: 1.08 }
  },
  axi_full_write_backpressure: {
    signal: [
      { name: 'ACLK', wave: 'p...........' },
      { name: 'AWADDR', wave: 'x==x........', data: ['A0'] },
      { name: 'AWVALID', wave: '01.0........' },
      { name: 'AWREADY', wave: '0.10........' },
      { name: 'WDATA', wave: 'xxx=....x...', data: ['D0'] },
      { name: 'WSTRB', wave: 'xxx=....x...', data: ['F'] },
      { name: 'WVALID', wave: '0001....0...' },
      { name: 'WREADY', wave: '000000010...' },
      { name: 'WLAST', wave: '0001....0...' },
      { name: 'BRESP', wave: 'xxxxxxxxx=x.', data: ['OK'] },
      { name: 'BVALID', wave: '00000000010.' },
      { name: 'BREADY', wave: '01..........' }
    ],
    head: { text: 'W Stall', tick: 0 },
    config: { hscale: 1.08 }
  },
  axi_full_read_backpressure: {
    signal: [
      { name: 'ACLK', wave: 'p...........' },
      { name: 'ARADDR', wave: 'x==x........', data: ['A0'] },
      { name: 'ARVALID', wave: '01.0........' },
      { name: 'ARREADY', wave: '0.10........' },
      { name: 'RID', wave: 'xxxx=...x...', data: ['7'] },
      { name: 'RDATA', wave: 'xxxx=...x...', data: ['Q0'] },
      { name: 'RRESP', wave: 'xxxx=...x...', data: ['OK'] },
      { name: 'RVALID', wave: '00001...0...' },
      { name: 'RREADY', wave: '000000010...' },
      { name: 'RLAST', wave: '00001...0...' }
    ],
    head: { text: 'R Stall', tick: 0 },
    config: { hscale: 1.08 }
  },
  axi_full_write_burst: {
    signal: [
      { name: 'ACLK', wave: 'p...........' },
      { name: 'AWADDR', wave: 'x==x........', data: ['A0'] },
      { name: 'AWLEN', wave: 'x==x........', data: ['3'] },
      { name: 'AWSIZE', wave: 'x==x........', data: ['4B'] },
      { name: 'AWBURST', wave: 'x==x........', data: ['INCR'] },
      { name: 'AWVALID', wave: '01.0........' },
      { name: 'AWREADY', wave: '0.10........' },
      { name: 'WDATA', wave: 'xxx====x....', data: ['D0', 'D1', 'D2', 'D3'] },
      { name: 'WSTRB', wave: 'xxx====x....', data: ['F', 'F', 'F', 'F'] },
      { name: 'WVALID', wave: '0001...0....' },
      { name: 'WREADY', wave: '0001...0....' },
      { name: 'WLAST', wave: '00000010....' },
      { name: 'BRESP', wave: 'xxxxxxxx=x..', data: ['OK'] },
      { name: 'BVALID', wave: '0000000010..' },
      { name: 'BREADY', wave: '01..........' }
    ],
    head: { text: 'Write Burst', tick: 0 },
    config: { hscale: 1.02 }
  },
  axi_full_read_burst: {
    signal: [
      { name: 'ACLK', wave: 'p...........' },
      { name: 'ARADDR', wave: 'x==x........', data: ['A0'] },
      { name: 'ARLEN', wave: 'x==x........', data: ['2'] },
      { name: 'ARSIZE', wave: 'x==x........', data: ['8B'] },
      { name: 'ARBURST', wave: 'x==x........', data: ['INCR'] },
      { name: 'ARVALID', wave: '01.0........' },
      { name: 'ARREADY', wave: '0.10........' },
      { name: 'RID', wave: 'xxxx===x....', data: ['4', '4', '4'] },
      { name: 'RDATA', wave: 'xxxx===x....', data: ['Q0', 'Q1', 'Q2'] },
      { name: 'RRESP', wave: 'xxxx===x....', data: ['OK', 'OK', 'OK'] },
      { name: 'RVALID', wave: '00001..0....' },
      { name: 'RREADY', wave: '01..........' },
      { name: 'RLAST', wave: '00000010....' }
    ],
    head: { text: 'Read Burst', tick: 0 },
    config: { hscale: 1.02 }
  },
  axi_full_write_data_first: {
    signal: [
      { name: 'ACLK', wave: 'p.........' },
      { name: 'WDATA', wave: 'x==x......', data: ['D0'] },
      { name: 'WSTRB', wave: 'x==x......', data: ['F'] },
      { name: 'WVALID', wave: '01.0......' },
      { name: 'WREADY', wave: '0.10......' },
      { name: 'WLAST', wave: '0.10......' },
      { name: 'AWADDR', wave: 'xxxx==x...', data: ['A0'] },
      { name: 'AWVALID', wave: '00001.0...' },
      { name: 'AWREADY', wave: '0000.10...' },
      { name: 'BRESP', wave: 'xxxxxxx=x.', data: ['OK'] },
      { name: 'BVALID', wave: '00000010..' },
      { name: 'BREADY', wave: '01........' }
    ],
    head: { text: 'Leading W', tick: 0 },
    config: { hscale: 1.08 }
  },
  axi_full_read_id_order: {
    signal: [
      { name: 'ACLK', wave: 'p...........' },
      { name: 'ARID', wave: 'x=x=x=x.....', data: ['0', '1', '0'] },
      { name: 'ARADDR', wave: 'x=x=x=x.....', data: ['A', 'B', 'C'] },
      { name: 'ARVALID', wave: '0101010.....' },
      { name: 'ARREADY', wave: '0101010.....' },
      { name: 'RID', wave: 'xxxx=x=x=x..', data: ['1', '0', '0'] },
      { name: 'RDATA', wave: 'xxxx=x=x=x..', data: ['B0', 'A0', 'C0'] },
      { name: 'RVALID', wave: '0000101010..' },
      { name: 'RREADY', wave: '01..........' },
      { name: 'RLAST', wave: '0000101010..' }
    ],
    head: { text: 'ID Order', tick: 0 },
    config: { hscale: 1.05 }
  },
  axi_full_reset_release: {
    signal: [
      { name: 'ACLK', wave: 'p.........' },
      { name: 'ARESETn', wave: '0.1.......' },
      { name: 'AWVALID', wave: '0..10.....' },
      { name: 'WVALID', wave: '0...10....' },
      { name: 'ARVALID', wave: '0..10.....' },
      { name: 'BVALID', wave: '0.....10..' },
      { name: 'RVALID', wave: '0.....10..' }
    ],
    head: { text: 'Reset', tick: 0 },
    config: { hscale: 1.08 }
  },
  axi_full_axi3_write_response: {
    signal: [
      { name: 'ACLK', wave: 'p.........' },
      { name: 'WDATA', wave: 'x==x......', data: ['D0'] },
      { name: 'WVALID', wave: '01.0......' },
      { name: 'WREADY', wave: '0.10......' },
      { name: 'WLAST', wave: '0.10......' },
      { name: 'AWADDR', wave: 'xxxx==x...', data: ['A0'] },
      { name: 'AWVALID', wave: '00001.0...' },
      { name: 'AWREADY', wave: '0000.10...' },
      { name: 'BRESP', wave: 'xxxxx=x...', data: ['OK'] },
      { name: 'BVALID', wave: '0000010...' },
      { name: 'BREADY', wave: '01........' }
    ],
    head: { text: 'AXI3 B', tick: 0 },
    config: { hscale: 1.08 }
  }
};
