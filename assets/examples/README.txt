ChipBook 설계 프로젝트 예제

폴더 구조를 유지해 내려받습니다.
  reference.py              Python 수치/전송 reference (외부 패키지 불필요)
  mini_soc.py               교육용 ISA CPU·SRAM·UART·DMA·IRQ의 ROM 실행
  run_examples.py           reference, lint, simulate 실행
  example.sdc               100 MHz 제약의 교육용 시작점
  src/UartTx.sv             8N1, LSB-first, 정수 clock divider
  src/SpiByte.sv            mode-0, MSB-first, byte 전송
  src/ApbRegister.sv        APB4 RW/W1C register, byte strobe
  src/ReadyValidFifo.sv     single-clock FIFO, backpressure
  src/StreamDma.sv          byte stream 전송과 accepted-byte 계산
  src/SystolicCore.sv       N=2..4, INT8 x INT8 -> INT32
  src/TOP.sv                DMA -> FIFO 통합 wrapper
  tb/GemmScoreboard.svh     scalar reference checker
  tb/TbTop.sv               GEMM stall 및 32-byte DMA/FIFO 테스트

1. Python reference
   python run_examples.py reference
   python reference.py --project npu
   기대 행렬 C = [[19,22],[43,50]]. Stall cycle은 계산을 멈추되 결과는 유지합니다.
   python mini_soc.py
   python mini_soc.py --fault
   정상 부팅에서는 UART "OK", DMA 목적 byte 0..31, IRQ 처리 완료를 확인합니다.
   --fault에서는 DMA error status를 관측한 뒤 IRQ를 지우는 경로를 실행합니다.

2. SystemVerilog 문법/타입/elaboration (pyslang은 Python 3.11 이상)
   python -m pip install pyslang==12.0.0
   python run_examples.py lint

3. RTL 실행 (Verilator와 C++ toolchain이 설치된 환경)
   python run_examples.py simulate
   기본 출력: 이 예제 폴더의 .artifacts/ 아래 실행 파일과 VCD
   저장소 안에서 실행 시: --output ../../.artifacts/qa/hdl 를 사용합니다.

26.01: UART byte를 0x00,0x55,0xA5,0xFF로 바꾸고 start/data/stop을 확인합니다.
26.02: strobe=0b0101로 0x11223344에 0xAABBCCDD를 쓰면 0x11BB33DD입니다.
26.03: ready를 반복해서 낮춰도 받은 byte 순서는 0..31이어야 합니다.
26.04: DMA done은 FIFO가 전송을 모두 수락했다는 뜻입니다. Sink 소비 완료와 구별합니다.
26.05: N=4로 확장하고 음수·최댓값·중간 stall·reset을 추가합니다.
26.06: 실제 library/board 조건으로 SDC의 입력/출력 지연과 reset 정책을 교체합니다.

범위
- StreamDma는 전송 회계의 최소 예제입니다. AXI4 memory-mapped 채널과 주소 발생기는 별도 계층입니다.
- TOP은 CPU/firmware를 갖춘 완성 SoC가 아니라 DMA/FIFO 통합 경계의 재현 예제입니다.
- mini_soc.py는 CPU instruction-level 모델의 전체 부팅 경로입니다. RISC-V ISA나 cycle-accurate CPU 구현을 주장하지 않습니다.
- SystolicCore는 행렬을 병렬 포트로 받아 논리적 skew schedule을 실행합니다. SRAM macro와 물리 PE 배선은 별도입니다.
- RTL은 교육용이며 signoff, board programming, foundry PDK 인증 결과를 포함하지 않습니다.

재현성 기록
- Python 3.13에서 reference 실행 및 scalar golden 비교를 확인했습니다.
- pyslang 12.0.0에서 포함된 RTL/TB를 문법·타입·elaboration 검사했습니다.
- 이 기록은 RTL 동적 시뮬레이션이나 실제 FPGA timing closure 결과를 뜻하지 않습니다.
