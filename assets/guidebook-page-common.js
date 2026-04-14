function escapeHtml(value) {
            return value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function highlightRtlSnippet(source) {
            const placeholders = [];
            const makeToken = () => `RTLTOKEN${'X'.repeat(placeholders.length + 1)}END`;
            const stashEscaped = (htmlSnippet) => {
                const token = makeToken();
                placeholders.push({ token, html: htmlSnippet });
                return token;
            };
            const stashRaw = (text, className) => stashEscaped(`<span class="${className}">${escapeHtml(text)}</span>`);

            let text = source.replace(/\r\n/g, '\n');
            text = text.replace(/\/\*[\s\S]*?\*\//g, (match) => stashRaw(match, 'tok-comment'));
            text = text.replace(/\/\/.*$/gm, (match) => stashRaw(match, 'tok-comment'));
            text = text.replace(/^#.*$/gm, (match) => stashRaw(match, 'tok-comment'));
            text = text.replace(/\(\*[\s\S]*?\*\)/g, (match) => stashRaw(match, 'tok-attr'));
            text = text.replace(/"[^"\n]*"/g, (match) => stashRaw(match, 'tok-string'));

            let html = escapeHtml(text);

            html = html.replace(/\b(always|assign|if|else|wire|reg|logic|begin|end|case|endcase|posedge|negedge|set_false_path|create_pblock|add_cells_to_pblock|get_cells|get_pblocks|set_property)\b/g, (match) => stashEscaped(`<span class="tok-keyword">${match}</span>`));
            html = html.replace(/\b(Tool|hint)\b/g, (match) => stashEscaped(`<span class="tok-comment">${match}</span>`));
            html = html.replace(/\b(\d+)\b/g, (match) => stashEscaped(`<span class="tok-number">${match}</span>`));
            html = html.replace(/(&lt;=|&gt;&gt;|&amp;|\\|\||\+|\*|\?|:|=|@)/g, (match) => stashEscaped(`<span class="tok-operator">${match}</span>`));
            html = html.replace(/\b(clk|addr|din|dout|we|sum|gray|q|p|reg_out|data_out|global_en|sync1|sync2|fast_path_a|fast_path_b|late_sig|pipe_reg|shift_reg|ram|a|b|c)\b/g, (match) => stashEscaped(`<span class="tok-signal">${match}</span>`));

            placeholders.forEach(({ token, html: replacement }) => {
                html = html.replace(token, replacement);
            });

            return html;
        }

        function applyRtlCodeHighlighting() {
            document.querySelectorAll('.rtl-tech-code code').forEach((block) => {
                if (block.dataset.highlighted === 'true') return;
                block.innerHTML = highlightRtlSnippet(block.textContent || '');
                block.dataset.highlighted = 'true';
            });
        }

        applyRtlCodeHighlighting();


        // --- Data Definitions (Compact to save space) ---
        const practiceTopicChipClassMap = {
            flow: 'practice-chip-topic-flow',
            digital: 'practice-chip-topic-digital',
            physical: 'practice-chip-topic-physical',
            memory: 'practice-chip-topic-memory',
            adt: 'practice-chip-topic-adt'
        };

        const practiceQuestionCatalog = {
          "flow": {
                    "label": "플로우/순서",
                    "questions": [
                              {
                                        "id": "Q01",
                                        "difficulty": "기초",
                                        "stem": "Spec-to-GDSII 설계 흐름에서 고객 요구사항(Specification)이 확정된 직후, 가장 먼저 논의해야 할 항목은 무엇인가?",
                                        "choices": [
                                                  "목표 공정에 맞는 PDK와 라이브러리 선정",
                                                  "시스템 아키텍처 및 플랫폼 사양",
                                                  "양산 테스트 전략과 DFT 구조 정의",
                                                  "초기 패키지 인터페이스와 핀맵 초안"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Spec-to-GDSII 흐름은 고객의 요구사항 분석 이후 시스템 아키텍처를 먼저 정의하고, 그 다음 RTL 설계 및 범용 IP 통합 등의 후속 과정으로 진행됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "스펙-투-GDSII",
                                                  "시스템온칩"
                                        ]
                              },
                              {
                                        "id": "Q02",
                                        "difficulty": "기초",
                                        "stem": "RTL-to-GDSII 설계 서비스 진행 시, 고객사로부터 전달받아야 하는 가장 필수적인 입력 데이터는 무엇인가?",
                                        "choices": [
                                                  "상위 요구사항과 아키텍처 정의 문서",
                                                  "초기 합성용 타이밍 제약과 테스트 제약 파일",
                                                  "검증이 완료된 RTL 수준의 소스 코드",
                                                  "합성이 완료된 게이트 수준 넷리스트"
                                        ],
                                        "answerIndex": 2,
                                        "explanation": "해당 서비스는 RTL(하드웨어 기술 언어로 작성된 논리 설계)을 시작점으로 하여, 논리합성, DFT 삽입, 물리적 구현(Physical Design)으로 이어집니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "RTL-투-GDSII",
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q03",
                                        "difficulty": "기초",
                                        "stem": "Netlist-to-GDSII 설계 서비스 모델에서 고객사가 자체적으로 도출하여 제공하는 주요 산출물은 무엇인가?",
                                        "choices": [
                                                  "논리합성이 완료된 게이트 수준의 넷리스트 (Gate-level Netlist)",
                                                  "기능 검증이 완료된 RTL 소스와 제약 파일",
                                                  "사인오프에 필요한 STA/DRC/LVS 검증 리포트",
                                                  "초기 물리 구현을 위한 floorplan 데이터"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Netlist-to-GDSII 서비스는 논리합성이 끝난 게이트 수준의 넷리스트를 제공받아, 물리적 배치배선(Place & Route) 및 타이밍 최적화 위주의 작업을 수행합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "넷리스트-투-GDSII",
                                                  "논리합성"
                                        ]
                              },
                              {
                                        "id": "Q04",
                                        "difficulty": "기초",
                                        "stem": "기능 검증이 완료된 RTL 소스 코드를 하드웨어 게이트 수준의 논리 회로로 변환하는 단계의 명칭으로 올바른 것은?",
                                        "choices": [
                                                  "플로어플랜 (Floorplan)",
                                                  "자동 테스트 패턴 생성 (ATPG)",
                                                  "논리합성 (Logic Synthesis)",
                                                  "테이프아웃 (Tapeout)"
                                        ],
                                        "answerIndex": 2,
                                        "explanation": "RTL 코드를 실제 물리적 설계에 사용 가능한 게이트 수준의 넷리스트로 변환 및 매핑하는 핵심 단계를 논리합성(Logic Synthesis)이라 부릅니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "논리합성",
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q05",
                                        "difficulty": "기초",
                                        "stem": "일반적인 주문형 반도체(ASIC) 설계 플로우에서 Signoff 검증 완료 이후 진행되는 후속 단계로 가장 적절한 것은?",
                                        "choices": [
                                                  "최종 ECO 수정 및 타이밍 재확인",
                                                  "테이프아웃 (Tapeout)",
                                                  "최종 DRC/LVS 재검증",
                                                  "패키지 사양과 bump map 확정"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "칩 설계에 대한 모든 기준을 만족하고 승인(Signoff)되는 즉시, 파운드리에 실제 마스크 제작을 위한 제조용 데이터를 전달하는 테이프아웃(Tapeout)을 진행하게 됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "사인오프",
                                                  "테이프아웃"
                                        ]
                              },
                              {
                                        "id": "Q06",
                                        "difficulty": "기초",
                                        "stem": "반도체 칩 설계를 완료한 뒤 파운드리 제조 단계로 직접 전달되는 핵심 산출물은 무엇인가?",
                                        "choices": [
                                                  "최종 STA·IR/EM·LVS 사인오프 리포트",
                                                  "게이트 수준 넷리스트와 타이밍 제약 파일",
                                                  "GDSII 레이아웃 데이터 형식",
                                                  "패키지 본딩 다이어그램과 핀맵"
                                        ],
                                        "answerIndex": 2,
                                        "explanation": "GDSII는 칩의 금속 배선, 트랜지스터 배치 등 계층적 패턴 정보를 담고 있는 국제 표준 레이아웃 데이터 형식으로, 제조 공정에 직접 사용됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "GDSII",
                                                  "테이프아웃"
                                        ]
                              },
                              {
                                        "id": "Q07",
                                        "difficulty": "기초",
                                        "stem": "반도체 설계의 개념부터 양산용 완제품 제작에 이르는 전체 흐름 중, 가장 후반에 위치하는 단계는?",
                                        "choices": [
                                                  "사인오프 검증 및 테이프아웃 승인",
                                                  "제조용 마스크 데이터 준비",
                                                  "파운드리 조립, 패키징 및 양산 테스트",
                                                  "DFT 삽입과 ATPG 준비"
                                        ],
                                        "answerIndex": 2,
                                        "explanation": "주문형 반도체의 개발 흐름은 아키텍처, RTL, 물리적 배치설계를 거쳐 최종 제조(Fab), 패키징(Packaging) 및 완성품 검사 과정으로 종료됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "주문형 반도체",
                                                  "테이프아웃"
                                        ]
                              },
                              {
                                        "id": "Q08",
                                        "difficulty": "기초",
                                        "stem": "고객 요구사항명세가 아닌, 이미 논리합성이 끝난 넷리스트를 기준으로 설계를 이어받아 수행하는 서비스의 명칭은?",
                                        "choices": [
                                                  "Spec-to-GDSII 턴키 서비스",
                                                  "RTL-to-GDSII 설계 서비스",
                                                  "Netlist-to-GDSII 설계 서비스",
                                                  "Package-to-Board 통합 설계 지원 서비스"
                                        ],
                                        "answerIndex": 2,
                                        "explanation": "입력되는 산출물의 추상화 단계(Level)를 기준으로 서비스 범위를 규정하며, 넷리스트부터 양산 전달을 책임지는 형태가 Netlist-to-GDSII입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "넷리스트-투-GDSII"
                                        ]
                              },
                              {
                                        "id": "Q09",
                                        "difficulty": "기초",
                                        "stem": "논리합성(Logic Synthesis) 단계의 수행 결과를 나타내는 가장 대표적인 출력물은 무엇인가?",
                                        "choices": [
                                                  "게이트 수준 넷리스트 (Gate-level Netlist)",
                                                  "합성 결과를 요약한 타이밍·면적 리포트",
                                                  "목표 공정용 표준 셀 라이브러리와 제약 파일",
                                                  "등가성 검증을 위한 기준 RTL 모델"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "논리합성은 HDL를 분석하여 동작 클록과 면적 등을 만족하는 실제 게이트 소자 형식(Gate-level Netlist)으로 재구성해 내보냅니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "논리합성",
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q10",
                                        "difficulty": "기초",
                                        "stem": "반도체 칩의 본격적인 설계 흐름 내에서, FPGA Prototyping을 수행하는 주된 목적으로 가장 적절한 것은?",
                                        "choices": [
                                                  "패키지 인터페이스와 보드 연결 규격을 조기 확정하기 위해",
                                                  "칩 제조 이전에 하드웨어 및 소프트웨어 통합 시스템 기능을 빠르게 검증하기 위해",
                                                  "표준 셀 라이브러리의 전기적 특성을 추출하기 위해",
                                                  "양산 공정의 수율과 결함률을 직접 측정하기 위해"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "FPGA 프로토타이핑은 ASIC의 기능 중 대부분을 실시간 또는 빠른 클럭 체제에서 확인하여, 칩 양산 및 개발 단계의 치명적 결함을 사전에 탐지합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "FPGA",
                                                  "프로토타이핑"
                                        ]
                              },
                              {
                                        "id": "Q11",
                                        "difficulty": "기초",
                                        "stem": "초대형 반도체 내부 설계를 효율적으로 분석하기 위해 계층적 설계(Hierarchical Design) 방식을 채택하는 주된 목적은 무엇인가?",
                                        "choices": [
                                                  "배치배선 단계만 단순화하기 위해 설계를 미리 평탄화하기 위해",
                                                  "설계의 논리적 복잡도 관리 및 분업 개발, 재사용성의 향상을 위해",
                                                  "혼합 신호 블록을 모두 동일한 모델로 단순화하기 위해",
                                                  "전체 칩의 물리 검증을 단일 단계로 대체하기 위해"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "칩을 여러 주요 블록과 하위 모듈로 쪼개는 계층적 설계는 동시다발적 작업, 복합 재사용 및 문제 국소화를 가능하게 합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "계층적 설계",
                                                  "시스템온칩"
                                        ]
                              },
                              {
                                        "id": "Q12",
                                        "difficulty": "기초",
                                        "stem": "Tapeout 직전에 최종적으로 수행되며, 설계 무결성을 점검하는 종합 절차는 무엇인가?",
                                        "choices": [
                                                  "사인오프(Signoff) 검증 및 최종 승인",
                                                  "합성 결과와 LEC만 1차로 확인하는 절차",
                                                  "패키지 substrate와 bump map을 확정하는 절차",
                                                  "보드 구동용 BSP와 드라이버 포팅을 마무리하는 절차"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "타이밍, 전력 강하, 물리적 디자인 위반 등을 종합적으로 점검해 칩의 작동을 보증하고 테이프아웃으로 넘기는 최종 관문을 Signoff(사인오프)라고 칭합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "사인오프",
                                                  "테이프아웃"
                                        ]
                              },
                              {
                                        "id": "Q13",
                                        "difficulty": "기초",
                                        "stem": "개별 기능 시나리오를 시뮬레이션하는 방식이 아니라, 최악 경로를 정적으로 수학 분석하는 기법은 무엇인가?",
                                        "choices": [
                                                  "테스트벤치 기반 기능 검증",
                                                  "정적 타이밍 분석 (Static Timing Analysis)",
                                                  "클럭 도메인 간 동기화 구조를 검토하는 CDC 분석",
                                                  "포스트레이아웃 게이트 시뮬레이션"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "기능적 패턴을 인가하지 않고, 데이터 이동 경로상의 최소/최대 지연값들의 상관성을 통해 Timing 제약 달성을 파악하는 기법이 STA입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "정적 타이밍 분석",
                                                  "최악 경로"
                                        ]
                              },
                              {
                                        "id": "Q14",
                                        "difficulty": "기초",
                                        "stem": "물리적 구현 시 초기 단계인 칩 플로어플랜(Floorplan)의 산출물로 가장 알맞은 것은?",
                                        "choices": [
                                                  "초대형 매크로의 배치 영역과 I/O 핀의 대략적 골격 구조",
                                                  "클럭 트리 버퍼와 배선이 최종 반영된 CTS 결과물",
                                                  "라우팅 완료 후 metal fill까지 반영된 레이아웃 데이터",
                                                  "DFT용 스캔 체인 연결 정보와 ATPG 제약 파일"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "플로어플랜은 전체 칩의 크기, 외부 통신 핀의 위치, 전력 분배 구조망 등 큼직한 배치를 초기에 정립해 후반부 배선의 병목을 방지하는 작업입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "플로어플랜",
                                                  "배치배선"
                                        ]
                              },
                              {
                                        "id": "Q15",
                                        "difficulty": "중간",
                                        "stem": "물리 구현에서 표준 셀 배치(Placement) 이후 이어지는 PnR 후속 흐름으로 가장 적절한 것은?",
                                        "choices": [
                                                  "클럭 트리 합성(CTS) 구성 및 상호 논리 연결선 배선(Routing)",
                                                  "포스트라우트 STA와 사인오프 검증",
                                                  "저전력 도메인 정의와 UPF 작성",
                                                  "ATPG 패턴 생성과 wafer sort 준비"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "셀 간의 논리적 위치가 정해진 뒤, 클럭 스큐를 맞추고자 CTS를 진행하며 그다음 데이터 및 제어 신호 배선(Routing) 작업을 수행하게 됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "배치",
                                                  "클럭 트리 합성",
                                                  "배선",
                                                  "배치배선"
                                        ]
                              },
                              {
                                        "id": "Q16",
                                        "difficulty": "중간",
                                        "stem": "사인오프(Signoff)에서 주로 확인하는 항목 조합으로 가장 적절한 것은?",
                                        "choices": [
                                                  "STA (타이밍 검증), DRC/LVS (물리적 검사), IR-Drop/EM (전원 및 신뢰성 평가)",
                                                  "기능 커버리지 분석, assertion 검증, UVM 시나리오 확장",
                                                  "플로어플랜 품질, 혼잡도 추정, 초기 배치 적합성 평가",
                                                  "부트 ROM 이미지 검증, BSP bring-up, 드라이버 포팅 결과 확인"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Signoff에서는 타이밍, 물리 검증, 전원 무결성, 배선 신뢰성 등 칩 제조 직전의 핵심 검증 항목을 종합적으로 확인합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "사인오프",
                                                  "정적 타이밍 분석",
                                                  "설계 규칙 검사",
                                                  "레이아웃 대 회로도 검사",
                                                  "IR 드롭",
                                                  "전자이동"
                                        ]
                              },
                              {
                                        "id": "Q17",
                                        "difficulty": "중간",
                                        "stem": "일반적인 반도체 설계 플로우를 올바른 순서로 나열한 것은?",
                                        "choices": [
                                                  "아키텍처 구조 논의 → RTL 로직 설계 → 물리 구현 → 논리합성 → 사인오프 검증",
                                                  "아키텍처 구조 논의 → RTL 로직 설계 → 시스템 논리합성 → 물리적 배치 구현(Physical) → 사인오프 검증",
                                                  "아키텍처 구조 논의 → 기능 검증 계획 → RTL 로직 설계 → 테이프아웃",
                                                  "고객 요구사항 확인 → 논리합성 → 패키지 설계 → RTL 로직 설계"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "반도체 설계는 아키텍처 정의에서 시작해 RTL 구현, 논리합성, 물리 구현을 거친 뒤 최종 검증인 Signoff로 마무리됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "레지스터 전송 수준",
                                                  "논리합성",
                                                  "사인오프",
                                                  "테이프아웃"
                                        ]
                              },
                              {
                                        "id": "Q18",
                                        "difficulty": "중간",
                                        "stem": "대규모 하위 시스템을 포함한 설계에서 IP Integration을 초반 플랫폼 단계부터 체계적으로 진행해야 하는 이유는 무엇인가?",
                                        "choices": [
                                                  "물리 구현이 끝난 뒤에도 버스 구조를 자유롭게 바꿀 수 있기 때문에",
                                                  "전체 SoC 구조의 방향성과 주요 버스, 인터페이스 연결 제약을 초기에 확정해야 하기 때문에",
                                                  "패키지 비용이 시스템 아키텍처보다 먼저 결정되어야 하기 때문에",
                                                  "사인오프가 끝난 뒤에야 인터페이스 종류를 정할 수 있기 때문에"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "IP 간 연결 구조, 대역폭, 클럭 분배 방식은 시스템 전체 구조에 직접 영향을 주므로, 플랫폼 단계에서 먼저 정리해야 이후 통합 과정의 병목을 줄일 수 있습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "인터페이스 IP",
                                                  "시스템온칩",
                                                  "디자인 플랫폼"
                                        ]
                              },
                              {
                                        "id": "Q85",
                                        "difficulty": "중간",
                                        "stem": "고객이 검증된 RTL을 이미 보유하고 있고 ADT가 합성, DFT, PnR, Signoff까지 이어받는다면 가장 가까운 서비스는?",
                                        "choices": [
                                                  "Spec-to-GDSII",
                                                  "RTL-to-GDSII",
                                                  "Netlist-to-GDSII",
                                                  "Package-to-Wafer"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "입력이 RTL이면 RTL-to-GDSII 범주로 보는 것이 가장 자연스럽습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "RTL-투-GDSII",
                                                  "설계 서비스",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q86",
                                        "difficulty": "중간",
                                        "stem": "아키텍처는 맞는데 합성 후 타이밍이 계속 빡빡하다면 가장 먼저 다시 확인할 항목으로 적절한 것은?",
                                        "choices": [
                                                  "합성 대상 라이브러리와 operating corner 설정",
                                                  "SDC와 클럭/입출력 제약",
                                                  "Floorplan의 macro 배치와 전원망 구조",
                                                  "DFT 삽입 이후 scan chain 구성 방식"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "초기 타이밍 문제는 제약 조건이나 클럭 정의가 잘못된 경우가 많아 SDC를 먼저 다시 봐야 합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "타이밍 제약",
                                                  "SDC",
                                                  "논리합성"
                                        ]
                              },
                              {
                                        "id": "Q87",
                                        "difficulty": "중간",
                                        "stem": "소프트웨어 스택이 커서 RTL 시뮬레이션만으로는 부팅 시나리오를 보기 너무 느릴 때 가장 적절한 다음 수단은?",
                                        "choices": [
                                                  "Emulation 또는 FPGA Prototyping",
                                                  "Gate-level simulation에 SDF를 적용해 실제 지연까지 검증하는 방식",
                                                  "정적 signoff만 먼저 수행해 부팅 가능성을 간접 확인하는 방식",
                                                  "실리콘 제작 후 평가보드에서 직접 부팅을 확인하는 방식"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "대규모 소프트웨어 구동이나 장시간 시나리오는 Emulation/FPGA 쪽이 현실적인 다음 단계입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "에뮬레이션",
                                                  "FPGA",
                                                  "검증 플랫폼"
                                        ]
                              },
                              {
                                        "id": "Q88",
                                        "difficulty": "중간",
                                        "stem": "여러 IP를 묶는 과정에서 인터럽트, 버스 주소, 클럭/리셋 정책이 계속 충돌한다면 가장 직접적으로 다시 정리해야 할 단계는?",
                                        "choices": [
                                                  "각 IP의 내부 로직만 개별적으로 최적화하는 단계",
                                                  "IP Integration / Platform 정의",
                                                  "Wafer sort와 생산 테스트를 준비하는 단계",
                                                  "DFT용 ATPG 패턴 압축 비율을 조정하는 단계"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "IP 간 연결 규칙과 시스템 정책은 통합 단계에서 먼저 정리되어야 뒤 공정이 안정됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "IP 통합",
                                                  "디자인 플랫폼",
                                                  "시스템온칩"
                                        ]
                              },
                              {
                                        "id": "Q89",
                                        "difficulty": "중간",
                                        "stem": "Scan 구조를 넣고 ATPG 준비를 한다는 흐름을 가장 잘 설명하는 순서는?",
                                        "choices": [
                                                  "RTL freeze 직후 테스트 전략과 scan architecture를 계획하는 단계",
                                                  "Synthesis 이후 DFT 삽입과 테스트 구조 준비",
                                                  "배치배선이 끝난 뒤 signoff 직전에 scan을 처음 삽입하는 단계",
                                                  "양산 불량 분석 이후 RTL에 test point를 추가하는 단계"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "일반적으로 합성된 넷리스트를 바탕으로 DFT를 삽입하고 ATPG 준비를 진행합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "테스트 설계",
                                                  "스캔",
                                                  "ATPG"
                                        ]
                              },
                              {
                                        "id": "Q90",
                                        "difficulty": "응용",
                                        "stem": "고객이 합성된 gate-level netlist와 기본 SDC를 넘기고 ADT에게 Floorplan부터 GDSII까지 맡기려 한다. 가장 가까운 서비스 범위는?",
                                        "choices": [
                                                  "Spec-to-GDSII",
                                                  "RTL-to-GDSII",
                                                  "Netlist-to-GDSII",
                                                  "Firmware-to-Board"
                                        ],
                                        "answerIndex": 2,
                                        "explanation": "입력물이 RTL이 아니라 gate-level netlist이므로 Netlist-to-GDSII가 맞습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "넷리스트-투-GDSII",
                                                  "게이트 넷리스트",
                                                  "플로어플랜"
                                        ]
                              },
                              {
                                        "id": "Q91",
                                        "difficulty": "응용",
                                        "stem": "DDR, SRAM macro, 여러 인터페이스 PHY가 많은 SoC에서 물리 단계 초반 가장 먼저 크게 흔들릴 수 있는 것은?",
                                        "choices": [
                                                  "Floorplan과 macro 배치 전략",
                                                  "power grid와 IR drop 대응 전략",
                                                  "clock/reset architecture와 timing constraint",
                                                  "package bump assignment와 substrate planning"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "매크로가 많은 설계는 초기 Floorplan 품질이 혼잡도와 타이밍에 큰 영향을 줍니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "플로어플랜",
                                                  "매크로",
                                                  "혼잡도"
                                        ]
                              },
                              {
                                        "id": "Q92",
                                        "difficulty": "응용",
                                        "stem": "Route 이후 setup violation이 남았는데 곧바로 Tapeout으로 가자는 제안이 나왔다. 가장 적절한 대응은?",
                                        "choices": [
                                                  "위반 경로의 원인을 보지 않고 timing exception만 추가한다",
                                                  "최적화/ECO 후 다시 STA와 Signoff를 수행한다",
                                                  "테스트 구조만 다시 생성해 timing 문제를 우회한다",
                                                  "메모리 종류를 바꿔 간접적으로 해결을 기대한다"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Post-route setup 위반은 그대로 제조로 넘길 수 없고, 수정 후 Signoff를 다시 확인해야 합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "정적 타이밍 분석",
                                                  "사인오프",
                                                  "ECO"
                                        ]
                              },
                              {
                                        "id": "Q93",
                                        "difficulty": "응용",
                                        "stem": "합성 후 ECO를 반영했는데 LEC mismatch가 발생했다면 가장 위험한 해석은?",
                                        "choices": [
                                                  "논리 기능이 바뀌었을 수 있다",
                                                  "배선 RC만 조금 달라져 STA 수치가 변한 상황일 수 있다",
                                                  "라이브러리 코너가 달라져 timing report만 바뀐 상황일 수 있다",
                                                  "scan chain 재정렬로 테스트 구조만 달라진 상황일 수 있다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "LEC mismatch는 변환 전후 논리 동등성이 깨졌을 가능성을 뜻하므로 기능 변화를 의심해야 합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "논리 등가성 검증",
                                                  "ECO",
                                                  "논리합성"
                                        ]
                              },
                              {
                                        "id": "Q94",
                                        "difficulty": "응용",
                                        "stem": "저전력 전원 도메인 요구가 프로젝트 후반에 추가되었다면 가장 적절한 조치는?",
                                        "choices": [
                                                  "UPF 반영 후 합성/STA/물리 구현 영향을 다시 확인한다",
                                                  "전원 도메인 요구와 무관하게 메모리 종류만 교체한다",
                                                  "기능 검증은 유지하되 저전력 검증만 생략한다",
                                                  "전력 의도 변경과 관계없이 패키지 계획만 다시 잡는다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "전력 의도는 합성, STA, isolation/retention 배치까지 연쇄적으로 영향이 가므로 재검토가 필요합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "전력 의도 파일",
                                                  "저전력 설계",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q95",
                                        "difficulty": "응용",
                                        "stem": "CDC 이슈가 남은 상태에서 “어차피 Backend가 정리해 주겠지”라고 보는 판단이 위험한 이유는?",
                                        "choices": [
                                                  "CDC는 주로 논리/동기화 구조 문제라 물리 최적화만으로 해결되지 않기 때문",
                                                  "클럭 스큐만 조정하면 대부분의 CDC 문제가 자연스럽게 해소되기 때문",
                                                  "패키지와 보드 지연이 CDC 오류의 주원인이기 때문",
                                                  "EM/IR signoff를 통과하면 CDC 검증을 대체할 수 있기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "CDC는 구조적 동기화 문제라서 물리 단계만으로 근본 해결되지 않습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "클럭 도메인 크로싱",
                                                  "동기화",
                                                  "설계 검증"
                                        ]
                              },
                              {
                                        "id": "Q96",
                                        "difficulty": "응용",
                                        "stem": "FPGA prototyping이 잘 돌아간다고 해서 바로 Signoff를 생략할 수 없는 이유로 가장 적절한 것은?",
                                        "choices": [
                                                  "FPGA는 STA/DRC/LVS 같은 ASIC 제조 관점 검증을 대체하지 못하기 때문",
                                                  "FPGA에서 통과한 주파수는 ASIC 공정 타이밍과 거의 동일하게 해석할 수 있기 때문",
                                                  "FPGA 프로토타입은 메모리와 인터페이스를 cycle-accurate로 대체하므로 제조 signoff까지 대신할 수 있기 때문",
                                                  "FPGA 검증은 Secure Boot 같은 보안 시나리오에만 쓰이고 일반 기능 검증과는 무관하기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "FPGA는 기능 확인에는 좋지만 ASIC 제조용 Signoff 세트를 대체하지는 못합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "FPGA",
                                                  "사인오프",
                                                  "설계 규칙 검사"
                                        ]
                              },
                              {
                                        "id": "Q97",
                                        "difficulty": "응용",
                                        "stem": "Spec-to-GDSII 서비스의 강점으로 가장 적절한 것은?",
                                        "choices": [
                                                  "고객 요구부터 시스템 정의, 구현, Signoff까지 책임 범위가 넓다",
                                                  "시스템 아키텍처 정의까지만 지원한다",
                                                  "RTL 입력 이후 합성부터 Signoff까지만 담당한다",
                                                  "패키지 설계와 board integration만 지원한다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Spec-to-GDSII의 핵심은 입력 추상도가 가장 높고 책임 범위가 가장 넓다는 점입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "스펙-투-GDSII",
                                                  "설계 서비스",
                                                  "시스템 아키텍처"
                                        ]
                              },
                              {
                                        "id": "Q161",
                                        "difficulty": "기초",
                                        "stem": "다음 중 반도체 설계 플로우의 큰 순서로 가장 적절한 것은?",
                                        "choices": [
                                                  "Spec/Architecture -> RTL -> DV -> Synthesis/DFT -> PD -> Signoff/Tapeout",
                                                  "Spec/Architecture -> RTL -> Synthesis/DFT -> DV -> PD -> Signoff/Tapeout",
                                                  "Spec/Architecture -> RTL -> DV -> PD -> Synthesis/DFT -> Signoff/Tapeout",
                                                  "Spec/Architecture -> RTL -> DV -> Synthesis/DFT -> Signoff/Tapeout -> PD"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "상위 요구사항과 아키텍처 정의 뒤 RTL 설계와 검증을 거쳐 합성/DFT, Physical Design, Signoff, Tapeout 순으로 이어지는 흐름이 일반적입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "설계 플로우",
                                                  "스펙",
                                                  "테이프아웃"
                                        ]
                              },
                              {
                                        "id": "Q170",
                                        "difficulty": "기초",
                                        "stem": "Signoff와 Tapeout의 관계로 가장 적절한 것은?",
                                        "choices": [
                                                  "Tapeout이 끝난 뒤 Signoff를 한다.",
                                                  "둘은 완전히 같은 말이다.",
                                                  "Signoff를 통과해야 Tapeout이 가능하다.",
                                                  "Signoff는 AP 직무만 수행한다."
                                        ],
                                        "answerIndex": 2,
                                        "explanation": "Tapeout은 최종 검증과 품질 기준을 통과한 뒤에야 진행할 수 있으므로, 실무에서는 Signoff 완료가 Tapeout의 선행 조건입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "사인오프",
                                                  "테이프아웃",
                                                  "최종 검증"
                                        ]
                              }
                    ]
          },
          "digital": {
                    "label": "디지털 핵심개념",
                    "questions": [
                              {
                                        "id": "Q19",
                                        "difficulty": "기초",
                                        "stem": "조합로직(Combinational Logic)의 출력값을 결정하는 핵심 요소는 무엇인가?",
                                        "choices": [
                                                  "직전 클럭 에지에서 저장된 상태 정보",
                                                  "현재 시점의 입력 신호들에 대한 논리 연산 결과",
                                                  "클럭 신호의 주기와 위상 정보",
                                                  "전원 도메인의 on/off 상태 정보"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "조합로직은 과거 상태를 저장하지 않으며, 현재 입력값의 논리 연산 결과만으로 출력이 결정되는 회로입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q20",
                                        "difficulty": "기초",
                                        "stem": "조합로직과 구별되는 순차로직(Sequential Logic)의 핵심 특징은 무엇인가?",
                                        "choices": [
                                                  "입력 신호에 따라 클럭과 무관하게 즉시 출력이 결정된다.",
                                                  "과거 상태나 특정 데이터를 내부 레지스터에 저장할 수 있다.",
                                                  "조합 지연만으로 출력이 결정되고 상태 저장 소자는 없다.",
                                                  "과거 입력 이력 대신 현재 입력만으로 동작이 결정된다."
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "순차로직은 플립플롭 같은 저장 소자를 포함하므로, 이전 상태가 회로 내부에 남아 다음 동작에 영향을 줄 수 있습니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "셋업 타임",
                                                  "홀드 타임"
                                        ]
                              },
                              {
                                        "id": "Q21",
                                        "difficulty": "기초",
                                        "stem": "고집적 반도체 설계에서 하드웨어 기술 언어(HDL)를 사용하는 주된 이유는 무엇인가?",
                                        "choices": [
                                                  "디지털 회로의 구조와 동작을 텍스트로 기술하고, 이를 검증과 합성에 활용해 설계 효율을 높이기 위해",
                                                  "제조용 레이아웃 도형을 직접 그려 마스크 데이터를 만들기 위해",
                                                  "파운드리 공정 조건을 회로 없이 수치 모델로만 관리하기 위해",
                                                  "패키지 열해석과 보드 신호무결성만 전담 계산하기 위해"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "HDL은 복잡한 회로 구조를 사람이 다룰 수 있는 수준으로 추상화해 표현하고, 시뮬레이션과 논리합성까지 연결할 수 있게 해 줍니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "하드웨어 기술 언어",
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q22",
                                        "difficulty": "기초",
                                        "stem": "레지스터 전송 수준(RTL)에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "트랜지스터 수준 소자 모델의 전기적 특성을 정리한 기준",
                                                  "클럭 주기에 따라 레지스터와 조합로직 사이의 데이터 이동과 동작을 기술하는 설계 추상화 수준",
                                                  "파운드리 레이아웃에서 적용하는 물리 설계 규칙의 집합",
                                                  "패키지 I/O 프로토콜과 보드 연결 방식을 정의한 문서"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "RTL은 클럭 기준으로 레지스터 사이에서 데이터가 어떻게 이동하고 처리되는지를 기술하는 디지털 설계 관점입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "레지스터 전송 수준",
                                                  "하드웨어 기술 언어"
                                        ]
                              },
                              {
                                        "id": "Q23",
                                        "difficulty": "기초",
                                        "stem": "상용 반도체 설계·검증 환경에서 사용하는 HDL/HVL 계열과 가장 거리가 먼 것은?",
                                        "choices": [
                                                  "SystemVerilog 언어 기반 테스트 체계",
                                                  "Python 및 C++ 객체 스크립팅 언어",
                                                  "Verilog 설계 기술 언어",
                                                  "VHDL 하드웨어 설명 언어"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Python과 C++는 범용 프로그래밍 언어이며, Verilog·VHDL·SystemVerilog처럼 RTL 설계나 하드웨어 검증을 직접 표현하는 언어와는 성격이 다릅니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "시스템베릴로그",
                                                  "하드웨어 기술 언어"
                                        ]
                              },
                              {
                                        "id": "Q24",
                                        "difficulty": "기초",
                                        "stem": "논리합성(Logic Synthesis)의 근본적인 목표로 가장 적절한 것은?",
                                        "choices": [
                                                  "HDL로 작성한 설계를 목표 공정에서 구현 가능한 게이트 수준 회로로 변환하는 것",
                                                  "합성된 넷리스트를 배치배선 가능한 물리 레이아웃으로 바꾸는 것",
                                                  "RTL과 합성 결과가 논리적으로 같은지 등가성을 증명하는 것",
                                                  "최종 GDSII를 파운드리에 넘겨 제조를 시작하는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "논리합성은 HDL 설계를 바탕으로, 목표 공정과 제약 조건에 맞는 게이트 수준 넷리스트를 생성하는 과정입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "논리합성",
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q25",
                                        "difficulty": "기초",
                                        "stem": "계층적 설계(Hierarchical Design)를 적용할 때 얻을 수 있는 실질적인 장점은 무엇인가?",
                                        "choices": [
                                                  "모든 하위 블록을 평탄화해 하나의 거대한 모듈로 관리하기 쉽게 하는 것",
                                                  "대규모 시스템을 블록 단위로 나누어 분업과 재사용을 쉽게 하는 것",
                                                  "블록 단위 분할만으로 전체 인터페이스 타이밍 문제가 자동으로 해결되게 하는 것",
                                                  "초기 통합 전까지 블록 간 인터페이스 정의를 미뤄도 되게 하는 것"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "계층적 설계는 큰 시스템을 모듈 단위로 나누어 관리하게 해 주므로, 병렬 개발과 재사용, 디버깅 측면에서 유리합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "계층적 설계"
                                        ]
                              },
                              {
                                        "id": "Q26",
                                        "difficulty": "기초",
                                        "stem": "시스템온칩(SoC)에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "하나의 연산 기능만 수행하도록 만든 단일 목적 프로세서 패키지",
                                                  "하나의 칩에 CPU, I/O, 메모리 등 여러 시스템 기능 블록을 통합한 반도체",
                                                  "연산 기능 없이 저장만 담당하는 외부 캐시 모듈",
                                                  "완성된 칩을 보호하기 위한 외부 패키지 하우징"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "SoC는 CPU, 메모리 인터페이스, I/O, 각종 가속기 등 시스템 구성 요소를 하나의 칩에 통합한 형태를 말합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "시스템온칩",
                                                  "IP"
                                        ]
                              },
                              {
                                        "id": "Q27",
                                        "difficulty": "기초",
                                        "stem": "정적 타이밍 분석(STA)이 주로 확인하는 대상은 무엇인가?",
                                        "choices": [
                                                  "테스트 시나리오에 따라 논리 기능이 스펙대로 동작하는지 여부",
                                                  "회로의 신호 지연이 타이밍 제약 조건을 만족하는지 여부",
                                                  "레이아웃이 파운드리의 설계 규칙을 만족하는지 여부",
                                                  "RTL과 넷리스트가 논리적으로 동일한지 여부"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "STA는 입력 벡터를 직접 시뮬레이션하지 않고, 회로 경로의 지연을 계산해 setup/hold 같은 타이밍 조건을 만족하는지 확인합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "정적 타이밍 분석",
                                                  "타이밍 제약"
                                        ]
                              },
                              {
                                        "id": "Q28",
                                        "difficulty": "중간",
                                        "stem": "STA에서 최악 경로(Worst Path)의 슬랙을 중점적으로 확인하는 이유는 무엇인가?",
                                        "choices": [
                                                  "가장 느린 경로가 타이밍을 만족하지 못하면 전체 회로의 동작 오류로 이어질 수 있기 때문에",
                                                  "가장 짧은 경로가 동적 전력을 가장 크게 좌우하기 때문에",
                                                  "평균 지연만 맞으면 최악 경로는 자동으로 보정되기 때문에",
                                                  "EM과 IR drop을 직접 계산하기 위해"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "클럭 주기 안에 데이터가 목적지 플립플롭에 도달해야 하므로, 가장 지연이 큰 경로가 조건을 만족하는지가 타이밍 안정성의 핵심입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "최악 경로",
                                                  "정적 타이밍 분석"
                                        ]
                              },
                              {
                                        "id": "Q29",
                                        "difficulty": "기초",
                                        "stem": "기능 검증과 정적 타이밍 분석(STA)의 차이로 가장 적절한 것은?",
                                        "choices": [
                                                  "기능 검증과 STA는 모두 입력 벡터 기반 시뮬레이션이므로 본질적으로 차이가 거의 없다.",
                                                  "기능 검증은 동작 시나리오를 확인하고, STA는 회로 경로의 지연과 타이밍 충족 여부를 분석한다.",
                                                  "기능 검증은 타이밍 슬랙을 계산하고, STA는 프로토콜 기능 시나리오를 검증한다.",
                                                  "기능 검증은 제조 후에 수행하고, STA는 아키텍처 정의 이전 단계에서만 수행한다."
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "기능 검증은 회로가 의도한 기능을 수행하는지 확인하는 과정이고, STA는 타이밍 제약을 만족하는지 수학적으로 분석하는 과정입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "정적 타이밍 분석",
                                                  "설계 검증"
                                        ]
                              },
                              {
                                        "id": "Q30",
                                        "difficulty": "중간",
                                        "stem": "동기식 디지털 회로에서 셋업 타임(Setup Time)에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "데이터가 클럭 에지에 의해 캡처되기 전에 미리 안정되어 있어야 하는 최소 시간",
                                                  "데이터가 클럭 에지 이후에도 계속 유지되어야 하는 최소 시간",
                                                  "클럭 지터와 스큐를 포함한 전체 클럭 불확실성의 크기",
                                                  "두 레지스터 사이 경로에 필요한 최소 조합 지연 시간"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "셋업 타임은 클럭 에지가 도착하기 전에 데이터가 충분히 안정되어 있어야 하는 시간을 뜻합니다. 반대로 클럭 에지 이후에 유지되어야 하는 시간은 홀드 타임입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "셋업 타임",
                                                  "정적 타이밍 분석"
                                        ]
                              },
                              {
                                        "id": "Q31",
                                        "difficulty": "중간",
                                        "stem": "홀드 타임(Hold Time)에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "클럭 에지 전에 데이터가 미리 안정되어 있어야 하는 최소 시간",
                                                  "클럭 에지 이후에도 데이터가 일정 시간 안정적으로 유지되어야 하는 최소 시간",
                                                  "클럭 불확실성과 스큐를 포함한 전체 타이밍 마진",
                                                  "소자 노화까지 고려한 수명 보증 시간"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "홀드 타임은 클럭 에지 직후에도 데이터가 바로 바뀌지 않고 일정 시간 유지되어야 하는 조건을 뜻합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "홀드 타임",
                                                  "정적 타이밍 분석"
                                        ]
                              },
                              {
                                        "id": "Q32",
                                        "difficulty": "중간",
                                        "stem": "CDC(Clock Domain Crossing) 검토가 필요한 대표적인 상황은 언제인가?",
                                        "choices": [
                                                  "모든 블록이 동일한 클럭 도메인에서 동작하고 도메인 간 신호 교환이 없을 때",
                                                  "서로 다른 주파수나 위상을 가진 클럭 도메인 사이에 데이터가 오갈 때",
                                                  "동일 도메인 내 dual-port SRAM 접근 우선순위를 조정할 때",
                                                  "공정 미세화에 따라 소자 구조를 Planar에서 GAA로 바꿀 때"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "CDC 분석은 서로 다른 클럭 도메인 사이에서 발생할 수 있는 메타안정성, 데이터 손실, 타이밍 위반 가능성을 점검하는 과정입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "클럭 도메인 크로싱"
                                        ]
                              },
                              {
                                        "id": "Q33",
                                        "difficulty": "기초",
                                        "stem": "린트(Lint) 도구의 역할로 가장 적절한 것은?",
                                        "choices": [
                                                  "HDL 코드에서 문법 오류, 코딩 스타일 위반, 잠재적인 논리 문제를 시뮬레이션 없이 정적으로 점검하는 것",
                                                  "배치된 셀 사이의 금속 배선 경로를 자동 탐색하고 최적화하는 것",
                                                  "양산 테스터에서 사용할 패턴을 생성하고 검사 장비 인터페이스를 준비하는 것",
                                                  "DRAM 타이밍 모델을 기반으로 메모리 성능을 예측하는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "린트는 시뮬레이션 전에 HDL 코드의 기본 품질을 점검해 문법 오류, 스타일 문제, 잠재적인 합성/동작 위험을 미리 찾아내는 1차 검사 도구입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "린트"
                                        ]
                              },
                              {
                                        "id": "Q34",
                                        "difficulty": "중간",
                                        "stem": "형식 검증(Formal Verification)의 특징으로 가장 적절한 것은?",
                                        "choices": [
                                                  "주어진 테스트 패턴을 길게 반복 실행해 corner case를 찾는 시뮬레이션 중심 방식이다.",
                                                  "입력 벡터를 일일이 만들지 않아도 논리 속성이나 등가성을 수학적으로 증명할 수 있다.",
                                                  "운영체제와 드라이버를 실제로 구동해 소프트웨어 호환성을 확인하는 방식이다.",
                                                  "배치배선 이후 기생 성분을 추출해 아날로그 파형을 정밀 해석하는 방식이다."
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "형식 검증은 시뮬레이션처럼 일부 패턴만 넣어 보는 방식이 아니라, 논리 속성이나 회로 등가성을 수학적으로 검증하는 방법입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "형식 검증",
                                                  "논리 등가성 검증"
                                        ]
                              },
                              {
                                        "id": "Q35",
                                        "difficulty": "기초",
                                        "stem": "UVM(Universal Verification Methodology)과 가장 밀접하게 연결되는 조직 또는 직무 영역은 무엇인가?",
                                        "choices": [
                                                  "기능 검증 환경을 구축하고 시뮬레이션을 수행하는 설계 검증 부서(DV, Design Verification)",
                                                  "배치배선과 클럭 트리 최적화를 수행하는 Physical Design 부서(PD)",
                                                  "Scan/MBIST 구조를 넣고 ATPG를 준비하는 DFT 부서",
                                                  "Boot, Driver, BSP를 통합해 시스템 bring-up을 담당하는 Application Platform 부서"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "UVM은 SystemVerilog 기반의 대표적인 검증 프레임워크로, 주로 DV 조직에서 재사용 가능한 테스트 환경을 구축할 때 사용합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "UVM",
                                                  "설계 검증"
                                        ]
                              },
                              {
                                        "id": "Q36",
                                        "difficulty": "중간",
                                        "stem": "'Coverage Closure'라는 표현이 가장 자주 쓰이는 단계는 무엇인가?",
                                        "choices": [
                                                  "Design Verification 단계의 시뮬레이션 기반 논리 검증 부문",
                                                  "사인오프 타이밍과 물리 검증을 마무리하는 단계",
                                                  "DFT 삽입 후 scan coverage를 점검하는 양산 테스트 준비 단계",
                                                  "Floorplan과 congestion을 조정하는 physical planning 단계"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Coverage Closure는 DV 단계에서 기능, 코드, 상태 전이 등의 커버리지가 목표 수준에 도달했는지 확인하고 검증 완료를 선언하는 맥락에서 주로 사용됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "설계 검증",
                                                  "UVM"
                                        ]
                              },
                              {
                                        "id": "Q37",
                                        "difficulty": "기초",
                                        "stem": "RTL 설계 엔지니어의 대표적인 업무로 가장 적절한 것은?",
                                        "choices": [
                                                  "SystemVerilog나 Verilog로 디지털 회로의 기능과 상태 전이를 코드로 구현하는 것",
                                                  "합성된 넷리스트를 기반으로 배치배선과 타이밍 최적화를 수행하는 것",
                                                  "테스트 가능성을 높이기 위해 scan/MBIST 구조를 삽입하는 것",
                                                  "Boot/Driver/BSP를 통합해 플랫폼 bring-up을 수행하는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "RTL 설계 엔지니어는 아키텍처와 스펙을 바탕으로 디지털 회로의 동작을 HDL 코드로 구체화하는 역할을 맡습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "레지스터 전송 수준",
                                                  "베릴로그",
                                                  "VHDL"
                                        ]
                              },
                              {
                                        "id": "Q38",
                                        "difficulty": "기초",
                                        "stem": "반도체 설계에서 IP(Intellectual Property)에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "여러 칩이나 시스템에서 반복 사용할 수 있도록 검증된 재사용 가능 설계 블록",
                                                  "파운드리 공정에 맞춘 PDK와 설계 룰 세트",
                                                  "OS 부팅을 위한 펌웨어와 드라이버 패키지",
                                                  "칩 외곽 I/O pad 배치와 패키지 연결 데이터"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "IP는 이미 설계와 검증이 끝나 다른 프로젝트에서도 재사용할 수 있는 회로 자산을 뜻하며, 개발 기간 단축과 설계 효율 향상에 큰 도움이 됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "IP",
                                                  "시스템온칩"
                                        ]
                              },
                              {
                                        "id": "Q39",
                                        "difficulty": "중간",
                                        "stem": "SystemVerilog가 설계뿐 아니라 기능 검증에서도 널리 사용되는 가장 큰 이유는 무엇인가?",
                                        "choices": [
                                                  "합성 가능한 RTL 문법만 강화한 언어라 검증용 추상화 기능은 거의 제공하지 않기 때문에",
                                                  "RTL 설계 기능과 함께 객체 지향, 랜덤화, 커버리지 등 강력한 검증 기능을 함께 제공하기 때문에",
                                                  "메모리 모델링과 테스트 패턴 기술에만 특화된 전용 언어이기 때문에",
                                                  "파운드리 룰과 레이아웃 도형을 직접 기술하기 위한 물리 설계 언어이기 때문에"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "SystemVerilog는 설계 언어이면서 동시에 검증 기능도 풍부하게 제공하므로, RTL 작성과 UVM 기반 검증 환경 구축에 모두 널리 쓰입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "시스템베릴로그",
                                                  "UVM",
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q40",
                                        "difficulty": "중간",
                                        "stem": "소프트웨어 프로그래밍과 비교할 때 HDL의 병렬성에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "HDL은 여러 하드웨어 블록이 동시에 반응하고 동작하는 회로의 특성을 기술한다.",
                                                  "HDL은 소프트웨어처럼 순차 실행되지만 문법만 회로처럼 보이게 만든 것이다.",
                                                  "하나의 always 블록이 끝나야 다른 블록이 실행된다고 보는 방식이다.",
                                                  "병렬성은 UVM testbench에만 적용되고 RTL에는 적용되지 않는다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "하드웨어는 여러 회로 블록이 동시에 신호에 반응하므로, HDL은 이런 병렬 동작을 표현하는 데 적합합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "하드웨어 기술 언어",
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q98",
                                        "difficulty": "중간",
                                        "stem": "긴 조합 경로 한가운데 레지스터를 하나 더 넣는 파이프라이닝의 직접 효과로 가장 적절한 것은?",
                                        "choices": [
                                                  "Latency는 늘 수 있지만 stage별 지연은 줄어든다",
                                                  "추가된 레지스터 덕분에 setup과 hold 문제가 동시에 자동으로 해결된다",
                                                  "중간 레지스터 삽입만으로 CDC 검증이 필요 없어질 수 있다",
                                                  "조합 경로를 나누면 메모리 구조도 비휘발성으로 바뀐다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "파이프라이닝은 단계 수를 늘리는 대신 한 단계의 조합 지연을 줄여 주파수 목표를 맞추기 쉽게 합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "파이프라이닝",
                                                  "정적 타이밍 분석",
                                                  "최악 경로"
                                        ]
                              },
                              {
                                        "id": "Q99",
                                        "difficulty": "중간",
                                        "stem": "외부 비동기 버튼 입력을 시스템 클럭 도메인으로 가져올 때 가장 기본적인 안정화 구조는?",
                                        "choices": [
                                                  "2-FF Synchronizer",
                                                  "Clock gating",
                                                  "BISR",
                                                  "LVS"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "비동기 입력은 2단 플립플롭 동기화가 가장 기본적인 대응입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "클럭 도메인 크로싱",
                                                  "동기화",
                                                  "플립플롭"
                                        ]
                              },
                              {
                                        "id": "Q100",
                                        "difficulty": "중간",
                                        "stem": "기능 시뮬레이션은 모두 통과했는데 STA에서 setup violation이 보인다면 가장 적절한 해석은?",
                                        "choices": [
                                                  "기능 논리와 별개로 타이밍 여유가 부족하다",
                                                  "RTL 기능 로직에 반드시 버그가 남아 있다는 뜻이다",
                                                  "RTL과 넷리스트의 논리 등가성이 자동으로 깨졌다는 뜻이다",
                                                  "DRC/LVS 같은 물리 검증도 동시에 실패했다는 뜻이다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "기능이 맞아도 클럭 주기 내에 데이터가 도착하지 못하면 타이밍 실패가 날 수 있습니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "정적 타이밍 분석",
                                                  "셋업 타임",
                                                  "설계 검증"
                                        ]
                              },
                              {
                                        "id": "Q101",
                                        "difficulty": "중간",
                                        "stem": "always_ff 기반 순차 로직에서 레지스터 갱신에 nonblocking assignment를 주로 쓰는 이유는?",
                                        "choices": [
                                                  "동일 클럭 에지의 동시 업데이트 의미를 더 잘 표현하기 위해",
                                                  "DRC를 대신하기 위해",
                                                  "배선을 자동 생성하기 위해",
                                                  "메모리 refresh를 막기 위해"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "순차 로직에서는 nonblocking이 레지스터 동시 갱신 의미와 더 잘 맞습니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "시스템베릴로그",
                                                  "always_ff",
                                                  "레지스터 전송 수준"
                                        ]
                              },
                              {
                                        "id": "Q102",
                                        "difficulty": "중간",
                                        "stem": "큰 SoC를 하위 블록으로 나누는 계층 설계가 특히 유리한 이유는?",
                                        "choices": [
                                                  "병렬 개발, 재사용, 디버깅 경계 설정이 쉬워지기 때문",
                                                  "모든 타이밍 문제가 자동으로 사라지기 때문",
                                                  "모든 모듈 이름을 지울 수 있기 때문",
                                                  "DFT가 필요 없어지기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "계층 구조는 대형 설계의 관리성과 병렬 개발 생산성을 높입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "계층적 설계",
                                                  "시스템온칩",
                                                  "모듈화"
                                        ]
                              },
                              {
                                        "id": "Q103",
                                        "difficulty": "응용",
                                        "stem": "Hold violation이 발생한 경로에 대해 “클럭 주기만 늘리자”는 대응이 본질적 해결이 아닌 이유는?",
                                        "choices": [
                                                  "Hold는 최소 지연 문제라 데이터 경로에 지연을 추가하는 쪽이 직접적이기 때문",
                                                  "Hold는 setup 여유만 넓히면 함께 해결되는 문제이기 때문",
                                                  "Hold는 패키지 지연과 보드 길이가 대부분을 결정하기 때문",
                                                  "클럭 주기를 늘리면 같은 에지 기준의 최소 지연 조건도 자동으로 완화되기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Hold는 같은 에지 주변의 최소 지연 조건이라 주기 확대보다 delay insertion이 직접적입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "홀드 타임",
                                                  "버퍼 삽입",
                                                  "정적 타이밍 분석"
                                        ]
                              },
                              {
                                        "id": "Q104",
                                        "difficulty": "응용",
                                        "stem": "비동기 FIFO 포인터를 클럭 도메인 사이에 넘길 때 Gray code가 자주 쓰이는 이유는?",
                                        "choices": [
                                                  "인접 값 전이에서 한 비트만 바뀌어 동기화 위험을 줄이기 쉬워서",
                                                  "인코딩 비트 수를 줄여 면적을 절감하기 위해",
                                                  "setup violation을 자동으로 없애기 위해",
                                                  "scan compression 효율을 높이기 위해"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Gray code는 여러 비트가 동시에 뒤집히는 상황을 줄여 CDC에 유리합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "클럭 도메인 크로싱",
                                                  "그레이 코드",
                                                  "FIFO"
                                        ]
                              },
                              {
                                        "id": "Q105",
                                        "difficulty": "응용",
                                        "stem": "커버리지가 높아 보여도 reset, low-power entry/exit, error recovery 시나리오가 비어 있다면 왜 안심하면 안 되는가?",
                                        "choices": [
                                                  "실제 양산 버그는 예외/상태 전이 경계에서 자주 나오기 때문",
                                                  "coverage 퍼센트만 높으면 corner scenario 누락은 큰 문제가 아니기 때문",
                                                  "STA가 reset과 power state 시나리오를 대신 검증해 주기 때문",
                                                  "error recovery는 양산 후 firmware가 해결하면 되기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DV는 단순 퍼센트보다 어떤 시나리오를 채웠는지가 중요합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "설계 검증",
                                                  "커버리지",
                                                  "리셋"
                                        ]
                              },
                              {
                                        "id": "Q106",
                                        "difficulty": "응용",
                                        "stem": "ECO 이후 LEC를 다시 돌리는 가장 직접적인 목적은?",
                                        "choices": [
                                                  "수정 전후 논리 기능이 의도치 않게 달라지지 않았는지 확인하기 위해",
                                                  "전원망 폭을 자동 계산하기 위해",
                                                  "패키지 재질을 선택하기 위해",
                                                  "Flash block erase를 검증하기 위해"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ECO는 작은 수정이라도 기능이 바뀔 수 있으므로 LEC로 동등성을 다시 확인합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "논리 등가성 검증",
                                                  "ECO",
                                                  "설계 검증"
                                        ]
                              },
                              {
                                        "id": "Q107",
                                        "difficulty": "응용",
                                        "stem": "RTL 자체는 그대로인데 목표 클럭이 800MHz에서 1GHz로 올라갔다면 가장 먼저 재점검할 묶음은?",
                                        "choices": [
                                                  "Timing constraint와 STA 결과",
                                                  "전력 예산과 전원 도메인 구성",
                                                  "DFT 삽입 전략과 test compression 설정",
                                                  "부팅 소프트웨어 구성과 BSP 버전"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "요구 주파수가 바뀌면 타이밍 제약과 분석 결과를 먼저 다시 봐야 합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "타이밍 제약",
                                                  "정적 타이밍 분석",
                                                  "클럭"
                                        ]
                              },
                              {
                                        "id": "Q108",
                                        "difficulty": "응용",
                                        "stem": "크리티컬 패스 마지막에 큰 연산이 몰려 있다면 “중간 계산을 미리 해두고 마지막엔 선택만 한다”는 아이디어가 유효할 수 있는 이유는?",
                                        "choices": [
                                                  "직렬 조합 깊이를 줄여 worst stage를 낮출 수 있어서",
                                                  "미리 계산한 값은 signoff 없이도 바로 사용할 수 있어서",
                                                  "정적 물리 검증 절차를 대체할 수 있어서",
                                                  "클럭 도메인 경계를 없애 timing 분석이 불필요해져서"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "사전 계산 후 MUX 선택 구조는 직렬 논리 깊이를 줄이는 대표적 타이밍 개선 아이디어입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "최악 경로",
                                                  "조합로직",
                                                  "파이프라이닝"
                                        ]
                              },
                              {
                                        "id": "Q109",
                                        "difficulty": "응용",
                                        "stem": "메타안정성에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "완전히 0으로 없애기보다 확률을 충분히 낮추는 방향으로 관리한다",
                                                  "2단 동기화기를 넣으면 메타안정성이 원리적으로 완전히 제거된다",
                                                  "주로 DRAM 셀의 전하 누설에서만 나타나는 메모리 고유 현상이다",
                                                  "패키지 종류와 보드 배선 길이가 메타안정성의 주된 원인이다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "메타안정성은 확률적 현상이므로 동기화 구조로 위험을 충분히 낮추는 접근이 일반적입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "메타안정성",
                                                  "동기화",
                                                  "클럭 도메인 크로싱"
                                        ]
                              },
                              {
                                        "id": "Q110",
                                        "difficulty": "응용",
                                        "stem": "조합 always 블록에서 특정 분기를 빠뜨려 latch가 추론되면 왜 위험한가?",
                                        "choices": [
                                                  "의도하지 않은 상태 저장이 생겨 타이밍/기능 해석이 꼬일 수 있어서",
                                                  "latch가 추론돼도 sequential logic과 완전히 같아서",
                                                  "면적만 조금 늘 뿐 타이밍에는 영향이 없어서",
                                                  "routing 단계에서 tool이 자동 제거해 주기 때문에"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "의도치 않은 latch는 기능 해석과 타이밍 분석 모두를 어렵게 만듭니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "린트",
                                                  "래치",
                                                  "조합로직"
                                        ]
                              },
                              {
                                        "id": "Q151",
                                        "difficulty": "기초",
                                        "stem": "특정 목적에 맞게 설계된 주문형 반도체는?",
                                        "choices": [
                                                  "FPGA",
                                                  "ASIC",
                                                  "SoC",
                                                  "ASSP"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "ASIC은 Application Specific Integrated Circuit의 약자입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "ASIC",
                                                  "주문형 반도체"
                                        ]
                              },
                              {
                                        "id": "Q163",
                                        "difficulty": "기초",
                                        "stem": "DV 직무의 핵심 역할로 가장 적절한 것은?",
                                        "choices": [
                                                  "합성된 넷리스트를 배치배선과 timing closure로 구현하는 일",
                                                  "RTL 기능이 스펙대로 동작하는지 검증하는 일",
                                                  "Scan/MBIST 구조를 넣고 ATPG를 준비하는 일",
                                                  "공정 수율과 장비 조건을 관리하는 제조 공정 제어"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Design Verification은 RTL이 스펙과 시나리오를 만족하는지 확인하는 영역으로, 기능 검증과 버그 재현/분석이 핵심입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "DV",
                                                  "기능 검증",
                                                  "RTL"
                                        ]
                              },
                              {
                                        "id": "Q164",
                                        "difficulty": "기초",
                                        "stem": "DFT 직무 설명으로 옳은 것은?",
                                        "choices": [
                                                  "UVM 기반 기능 검증을 주로 한다.",
                                                  "Scan, MBIST, ATPG 등으로 테스트 가능성을 높인다.",
                                                  "Floorplan, CTS, Routing으로 GDSII를 완성한다.",
                                                  "Boot/Driver/BSP를 통합해 bring-up을 수행한다."
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "DFT는 제조 후 칩을 검사하기 쉽도록 Scan, MBIST, ATPG 같은 구조와 패턴을 준비해 테스트 가능성을 높이는 역할입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "DFT",
                                                  "MBIST",
                                                  "ATPG"
                                        ]
                              },
                              {
                                        "id": "Q168",
                                        "difficulty": "기초",
                                        "stem": "Setup Time과 Hold Time의 관계 설명으로 옳은 것은?",
                                        "choices": [
                                                  "둘 다 클럭 에지 이후에만 지켜야 하는 안정 시간을 뜻한다.",
                                                  "Setup은 이전, Hold는 이후 안정 시간을 뜻한다.",
                                                  "둘 다 메모리 용량과 접근 지연을 함께 나타내는 용어다.",
                                                  "둘 다 DRC/LVS 같은 물리 검증에서만 쓰는 시간 개념이다."
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Setup time은 클럭 에지 이전에 데이터가 미리 안정되어 있어야 하는 시간이고, hold time은 에지 이후에도 유지되어야 하는 시간입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "셋업 타임",
                                                  "홀드 타임",
                                                  "타이밍"
                                        ]
                              },
                              {
                                        "id": "Q174",
                                        "difficulty": "기초",
                                        "stem": "SoC에 대한 설명으로 맞는 것은?",
                                        "choices": [
                                                  "CPU 코어만 단독으로 넣은 단순 프로세서 칩을 뜻한다",
                                                  "시스템 기능 블록을 하나의 칩에 통합한 구조",
                                                  "웨이퍼 전기적 특성을 검사하는 생산 테스트 장비를 뜻한다",
                                                  "PCB에 실장되는 외부 기판 규격의 한 종류를 뜻한다"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "SoC는 CPU뿐 아니라 메모리 인터페이스, 주변장치, 가속기 등 여러 시스템 기능 블록을 하나의 칩에 통합한 구조를 뜻합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "SoC",
                                                  "시스템온칩",
                                                  "통합 설계"
                                        ]
                              },
                              {
                                        "id": "Q175",
                                        "difficulty": "기초",
                                        "stem": "Hierarchical Design의 장점으로 가장 적절한 것은?",
                                        "choices": [
                                                  "블록별 타이밍과 인터페이스를 분리해 병렬 개발과 재사용을 쉽게 한다.",
                                                  "병렬 개발과 재사용, 디버깅이 쉬워진다.",
                                                  "전체 설계를 자동으로 평탄화해 물리 검증이 필요 없어진다.",
                                                  "보안 기능 없이도 시스템 통합이 가능해진다."
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "계층형 설계는 블록 단위 분할 덕분에 병렬 개발과 재사용이 쉬워지고, 문제를 모듈별로 추적할 수 있어 디버깅 효율도 높아집니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "계층형 설계",
                                                  "재사용",
                                                  "병렬 개발"
                                        ]
                              }
                    ]
          },
          "physical": {
                    "label": "Physical/Backend",
                    "questions": [
                              {
                                        "id": "Q41",
                                        "difficulty": "기초",
                                        "stem": "Physical Design에서 Floorplan 단계의 주요 설계 항목으로 가장 적절한 것은?",
                                        "choices": [
                                                  "표준 셀 사이의 세부 배선 경로와 via 위치를 최종 확정하는 작업",
                                                  "칩 크기, I/O 패드 위치, 블록 배치, 전원망, 대형 매크로의 위치를 정하는 작업",
                                                  "Scan chain과 ATPG 패턴을 생성하는 작업",
                                                  "부팅용 BSP와 주변장치 드라이버를 통합하는 작업"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Floorplan은 칩의 전체 뼈대를 정하는 초기 단계로, 이때 정한 블록 배치와 전원망 구조가 이후 배치배선 난이도에 큰 영향을 줍니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "플로어플랜"
                                        ]
                              },
                              {
                                        "id": "Q42",
                                        "difficulty": "기초",
                                        "stem": "Placement 단계의 주된 목적으로 가장 적절한 것은?",
                                        "choices": [
                                                  "표준 셀과 논리 소자를 타이밍과 혼잡도를 고려해 적절한 위치에 배치하는 것",
                                                  "인터럽트와 MMIO 주소를 소프트웨어 주소 공간에 매핑하는 작업",
                                                  "공정 수율과 원가를 분석해 제품 단가를 산정하는 작업",
                                                  "보안 ROM 이미지를 비휘발성 메모리에 기록하는 작업"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Placement는 합성된 셀들을 Floorplan 영역 안에 배치하면서 타이밍과 배선 혼잡도를 함께 고려하는 단계입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "배치"
                                        ]
                              },
                              {
                                        "id": "Q43",
                                        "difficulty": "기초",
                                        "stem": "배치(Placement) 이후 진행되는 라우팅(Routing) 단계의 주된 목적은?",
                                        "choices": [
                                                  "게이트 수준 넷리스트를 표준 셀에 매핑하는 작업",
                                                  "배치된 셀 간의 논리적 연결을 실제 금속 배선 레이어를 통해 물리적으로 결선하는 작업",
                                                  "I/O 인터페이스 규격과 메모리 대역폭을 정의하는 작업",
                                                  "RTL과 넷리스트의 논리 등가성을 확인하는 작업"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "라우팅(Routing) 단계는 배치된 셀 간의 논리적 연결(Net)을 설계 규칙에 맞춰 다층 금속 배선으로 물리적으로 연결하는 공정입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "배선"
                                        ]
                              },
                              {
                                        "id": "Q44",
                                        "difficulty": "기초",
                                        "stem": "논리 합성 이후의 PnR(Place and Route) 프로세스에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "게이트 수준 넷리스트를 공정 설계 규칙과 타이밍 제약에 맞춰 물리적으로 배치하고 금속 배선을 연결하는 핵심 단계",
                                                  "합성 후 테스트 구조를 삽입하고 ATPG 패턴을 준비하는 단계",
                                                  "파운드리에서 실제 마스크를 제작하고 웨이퍼를 가공하는 단계",
                                                  "시스템 요구사항을 바탕으로 CPU와 IP 구성을 정의하는 단계"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "PnR(물리적 배치배선)은 논리적으로 구성된 네트리스트를 파운드리의 물리 공정이 가능한 실제 공간 데이터(레이아웃)로 형상화하는 물리설계의 중추 과정입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "배치배선"
                                        ]
                              },
                              {
                                        "id": "Q45",
                                        "difficulty": "기초",
                                        "stem": "반도체 설계 흐름에서 테이프아웃(Tapeout) 이전에 수행되는 사인오프(Signoff)에 대한 설명으로 가장 적합한 것은?",
                                        "choices": [
                                                  "타이밍, 전력, 물리적 설계 규칙 등 모든 공정 검증을 최종적으로 완료하고 양산 이관을 확정 승인하는 단계",
                                                  "패키지 핀맵과 bump 구성을 양산 관점에서 최종 동결하는 패키지 공학 단계",
                                                  "고객 요구와 성능 목표를 바탕으로 시스템 아키텍처와 블록 구성을 정하는 초기 단계",
                                                  "부팅 펌웨어와 드라이버를 통합해 bring-up 환경을 준비하는 플랫폼 단계"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "사인오프(Signoff)는 PPA(면적, 전력, 성능) 목표 및 모든 물리적 제약을 충족했음을 보증하고, 더 이상의 설계 변경 없이 파운드리에 설계를 인도할 수 있음을 확정 짓는 최종 검증 절차입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q46",
                                        "difficulty": "기초",
                                        "stem": "테이프아웃(Tapeout)의 의미로 가장 적절한 것은?",
                                        "choices": [
                                                  "최종 승인을 마친 GDSII 물리 레이아웃 데이터를 파운드리에 인도하여 본격적인 웨이퍼 양산 제작을 의뢰하는 시점",
                                                  "FPGA 보드에 RTL을 올려 기능 검증을 시작하는 단계",
                                                  "양산 테스트 패턴으로 제조 결함을 검사하는 단계",
                                                  "PDK와 공정 룰을 설계 환경에 등록하는 단계"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "테이프아웃은 설계가 끝난 뒤 최종 GDSII 데이터를 파운드리에 전달해 실제 제조를 시작하는 중요한 단계입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "테이프아웃",
                                                  "GDSII"
                                        ]
                              },
                              {
                                        "id": "Q47",
                                        "difficulty": "중간",
                                        "stem": "반도체 설계에서 파운드리가 제공하는 디자인 킷(PDK)을 반드시 사용하는 이유는 무엇인가?",
                                        "choices": [
                                                  "시뮬레이션 및 PnR 설계 툴이 타겟 파운드리의 물리적 공정 파라미터와 제조 규칙을 엄밀히 반영하여 연산하도록 기준점을 제공하기 위해",
                                                  "RTL 기능 검증용 테스트벤치 구조를 표준화하기 위해",
                                                  "패키지 substrate와 보드 인터페이스 규격을 정의하기 위해",
                                                  "양산 후 불량 칩의 수리 정책을 문서화하기 위해"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "PDK는 소자 모델, 배선 저항, 설계 규칙 등 공정 관련 정보를 담고 있어, 설계 툴이 실제 파운드리 기준에 맞춰 동작하도록 해 줍니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "설계 규칙 검사",
                                                  "레이아웃 대 회로도 검사",
                                                  "스탠더드 셀"
                                        ]
                              },
                              {
                                        "id": "Q48",
                                        "difficulty": "중간",
                                        "stem": "물리적 검증(Signoff) 중 점검해야 하는 IR Drop 현상의 주된 원인과 그 결과로 적절한 것은?",
                                        "choices": [
                                                  "칩 내부 금속 전원 배선의 저항 및 동적 스위칭 전류로 인해 국부적 전압이 강하되어 로직 오동작을 유발하는 현상",
                                                  "high-fanout 제어 신호 때문에 slew가 나빠져 setup margin이 줄어드는 현상",
                                                  "배선 전류 밀도가 높아져 금속 신뢰성이 떨어지는 현상",
                                                  "클럭 트리 불균형으로 skew가 커져 hold violation이 발생하는 현상"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "IR-Drop은 전원 분배망의 금속 저항(R) 요소와 소자들의 동시 스위칭에 따른 소비 전류(I)의 상호작용으로 칩 내 특정 영역의 인가 전압이 크게 저하되어, 타이밍 위반이나 오작동을 야기하는 신뢰성 불량 요인입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "IR 드롭",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q49",
                                        "difficulty": "중간",
                                        "stem": "배선 신뢰성에 직접적인 영향을 주는 일렉트로마이그레이션(EM) 현상의 의미로 가장 올바른 것은?",
                                        "choices": [
                                                  "특정 금속 배선에 지속적으로 높은 전류가 흘러 금속 원자가 이동하고, 그 결과 단선(Open) 등의 신뢰성 문제가 생기는 현상",
                                                  "칩 내부 전원망 저항 때문에 국부 전압이 떨어지는 현상",
                                                  "인접 배선 간 기생 결합으로 신호 노이즈가 커지는 현상",
                                                  "via 접촉 저항 증가로 특정 배선 구간의 손실이 커지는 현상"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "EM은 높은 전류 밀도로 인해 금속 원자가 이동하면서 배선 신뢰성이 저하되는 현상으로, 심해지면 단선(Open) 같은 고장으로 이어질 수 있습니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "전자이동",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q50",
                                        "difficulty": "중간",
                                        "stem": "Placement 과정에서 혼잡도(Congestion)가 과도하게 높아질 때 가장 심각한 문제는 무엇인가?",
                                        "choices": [
                                                  "우회 배선이 늘어나 RC 지연이 커지고, 결과적으로 타이밍 클로저와 라우팅 완료가 어려워진다.",
                                                  "특정 구역의 전원망 밀도가 부족해 IR drop만 국부적으로 증가한다.",
                                                  "scan chain 길이가 길어져 ATPG 시간이 늘어난다.",
                                                  "셀 간 거리가 짧아져 hold margin이 자동으로 확보된다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "혼잡도가 높으면 배선이 길어지고 우회가 많아져 RC 지연이 증가하므로, 타이밍 위반과 라우팅 실패 가능성이 커집니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "혼잡도",
                                                  "배치",
                                                  "배치배선"
                                        ]
                              },
                              {
                                        "id": "Q51",
                                        "difficulty": "중간",
                                        "stem": "논리 등가성 검사(LEC)가 대표적으로 필요한 상황은 언제인가?",
                                        "choices": [
                                                  "논리 합성(Logic Synthesis) 직후이거나, 후반부 ECO 수정 등으로 스탠더드 셀 네트리스트가 변경되어 원본 RTL과의 기능 동일성 여부 파악이 요구될 때",
                                                  "포스트라우트 STA에서 slack 개선 여부를 확인할 때",
                                                  "UVM regression 이후 coverage closure를 판단할 때",
                                                  "wafer sort 결과를 바탕으로 test time을 최적화할 때"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "LEC는 RTL과 합성 후 넷리스트, 또는 ECO 이후 넷리스트가 기능적으로 동일한지 확인하는 데 주로 사용됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "논리 등가성 검증",
                                                  "논리합성"
                                        ]
                              },
                              {
                                        "id": "Q52",
                                        "difficulty": "중간",
                                        "stem": "저전력 표준 파일 형식인 UPF(Unified Power Format)에 기술되는 주요 사항은 무엇인가?",
                                        "choices": [
                                                  "다중 전력 도메인의 정의, 전원 차단 제어 및 레벨 시프터 삽입 등 칩의 전력 의도(Power Intent)를 구체화한 아키텍처 제어 문법",
                                                  "표준 셀 라이브러리의 timing/power characterization data",
                                                  "테스트벤치용 UVM class library와 coverage 계획",
                                                  "패키지 기판의 bump/ball assignment rule"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "UPF는 다중 전력 도메인의 상태 변화 및 파워 차단 조건 등 전력 제어 매커니즘을 툴 간에 호환되도록 기술하는 표준 포맷입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "전력 의도 파일",
                                                  "저전력 설계"
                                        ]
                              },
                              {
                                        "id": "Q53",
                                        "difficulty": "중간",
                                        "stem": "저전력 설계 기법인 파워 게이팅(Power Gating)의 도입 원리와 그 주된 효과는 무엇인가?",
                                        "choices": [
                                                  "대기 상태인 시스템 블록의 전원을 스위치 셀로 강제 차단하여, 미세 공정에서 막대하게 발생하는 누설 전력(Leakage Power) 소모를 근원적으로 제거한다.",
                                                  "동작이 느린 경로에 더 높은 전압을 줘 setup margin을 확보하는 것",
                                                  "미사용 블록의 클럭만 막아 동적 전력을 줄이는 것",
                                                  "배선 길이를 줄여 기생용량을 낮추는 배치 최적화"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "파워 게이팅은 트랜지스터 누설 전류의 폐해가 심각해지는 초미세 공정에서 미사용 블록의 전원을 물리적으로 차단해 전력 낭비를 방지하는 강력한 저전력 솔루션입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "파워 게이팅",
                                                  "저전력 설계"
                                        ]
                              },
                              {
                                        "id": "Q54",
                                        "difficulty": "중간",
                                        "stem": "타이밍 클로저(Timing Closure)를 달성했다는 의미로 가장 적절한 것은?",
                                        "choices": [
                                                  "STA 분석에서 확인된 타이밍 위반(Slack) 현상을 최적화와 재배치를 통해 완벽하게 제약(Constraint) 내로 수렴시킨 상태",
                                                  "DRC와 LVS가 모두 clean인 상태",
                                                  "Secure Boot 인증이 제한 시간 안에 끝난 상태",
                                                  "FPGA prototyping에서 기능 시나리오가 모두 통과한 상태"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "타이밍 클로저는 설계의 모든 주요 경로가 목표 주파수와 setup/hold 제약을 만족하도록 수렴된 상태를 의미합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "정적 타이밍 분석",
                                                  "타이밍 제약",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q55",
                                        "difficulty": "중간",
                                        "stem": "사인오프 물리 검증의 주요 지표인 DRC와 LVS 조항의 목적 차이를 가장 명확히 구분한 것은?",
                                        "choices": [
                                                  "DRC는 배선 폭, 간격 등 파운드리 기하학적 제조 규칙의 위반 여부를 검사하며, LVS는 그려진 배치배선 결과물이 원래의 논리 스키매틱 회로도와 전기적으로 일치하는지 비교 검증한다.",
                                                  "DRC는 혼잡도 문제를 보고, LVS는 setup/hold violation을 점검한다.",
                                                  "DRC는 물리 규칙을 보고, LVS는 RTL과 넷리스트의 논리 등가성만 확인한다.",
                                                  "LVS는 timing signoff를 담당하고, DRC는 metal fill 삽입 여부만 본다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DRC(Design Rule Check)는 파운드리의 물리 공정 실현이 가능한 기하학적 제약을 위반했는지 확인하며, LVS(Layout Versus Schematic)는 완성된 실리콘 도면과 원본 논리 회로도 간의 소자 연결망 동치성을 대조 평가합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "설계 규칙 검사",
                                                  "레이아웃 대 회로도 검사"
                                        ]
                              },
                              {
                                        "id": "Q56",
                                        "difficulty": "응용",
                                        "stem": "디자인하우스 업무 영역 중 PD(Physical Design) 직무의 핵심 역할로 가장 올바른 설명은?",
                                        "choices": [
                                                  "합성된 네트리스트를 기반으로 플로어플랜, 배치배선(PnR), 타이밍/클럭망 최적화를 수행하여 파운드리 인도 직전의 최종 GDSII 물리 도면을 구현하는 역할",
                                                  "RTL과 넷리스트의 논리 등가성을 증명하는 formal 검증 환경을 개발하는 역할",
                                                  "시스템 아키텍처와 IP 통합 방향을 기획하는 Design Platform 역할",
                                                  "Scan/ATPG 기반 제조 테스트 패턴을 준비하는 DFT 역할"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "PD는 합성된 넷리스트를 실제 레이아웃으로 구현하는 백엔드 핵심 영역으로, 배치배선과 타이밍 최적화, 최종 물리 구현을 담당합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "물리구현",
                                                  "물리설계",
                                                  "배치배선",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q111",
                                        "difficulty": "중간",
                                        "stem": "핀 수가 많은 macro 둘을 너무 바짝 붙여 놓았을 때 물리 구현에서 가장 먼저 걱정할 문제는?",
                                        "choices": [
                                                  "Routing congestion",
                                                  "Linux boot 시간",
                                                  "Secure Boot key provisioning 절차",
                                                  "scan compression ratio"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "핀 밀도가 높은 macro는 주변 배선 혼잡을 급격히 높일 수 있습니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "혼잡도",
                                                  "매크로",
                                                  "배치배선"
                                        ]
                              },
                              {
                                        "id": "Q112",
                                        "difficulty": "중간",
                                        "stem": "CTS의 가장 직접적인 목적은?",
                                        "choices": [
                                                  "클럭을 각 sequential element에 균형 있게 분배해 skew를 관리하는 것",
                                                  "data path RC 지연을 직접 최적화하는 것",
                                                  "scan chain 길이를 줄여 ATPG 효율을 높이는 것",
                                                  "power gating domain을 정의하는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "CTS는 clock tree를 구성해 클럭 지연과 skew를 제어하는 단계입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "클럭 트리 합성",
                                                  "스큐",
                                                  "배치배선"
                                        ]
                              },
                              {
                                        "id": "Q113",
                                        "difficulty": "중간",
                                        "stem": "IR drop이 심한 블록을 보고 전원망을 강화한다고 할 때 가장 적절한 조치는?",
                                        "choices": [
                                                  "전원 strap/mesh 보강과 경로 저항 감소",
                                                  "클럭 주기를 늘려 타이밍 위반만 완화하는 것",
                                                  "clock tree buffer를 추가해 skew를 조정하는 것",
                                                  "macro 배치만 일부 조정해 배선 길이를 줄이는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "IR drop은 전원망 저항과 전류 분배 문제이므로 전원망 보강이 기본 대응입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "IR 드롭",
                                                  "전원망",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q114",
                                        "difficulty": "중간",
                                        "stem": "Hold violation 수정에 가장 직접적인 방법으로 적절한 것은?",
                                        "choices": [
                                                  "데이터 경로에 delay cell 또는 buffer 추가",
                                                  "캡처 클럭 지연을 전 경로에 일괄로 추가하는 것",
                                                  "setup 최적화용 셀 업사이징만 반복하는 것",
                                                  "전원 전압만 낮춰 전체 지연을 늘리는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Hold는 최소 지연 조건이라 경로 지연을 늘리는 방식이 기본입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "홀드 타임",
                                                  "버퍼 삽입",
                                                  "정적 타이밍 분석"
                                        ]
                              },
                              {
                                        "id": "Q115",
                                        "difficulty": "중간",
                                        "stem": "DRC와 LVS를 함께 보는 이유를 가장 잘 설명한 것은?",
                                        "choices": [
                                                  "하나는 제조 룰, 다른 하나는 연결 일치 여부를 보기 때문",
                                                  "DRC는 타이밍 위반을 보고, LVS는 전원 강하를 분석하기 때문",
                                                  "DRC는 isolation 삽입 여부를 보고, LVS는 retention cell 수를 세기 때문",
                                                  "DRC는 boot chain을 보고, LVS는 DFT coverage를 확인하기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DRC와 LVS는 물리 검증의 서로 다른 축입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "설계 규칙 검사",
                                                  "레이아웃 대 회로도 검사",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q116",
                                        "difficulty": "응용",
                                        "stem": "SRAM macro 주변에서 congestion hotspot이 심하게 터졌다면 가장 우선적으로 검토할 수 있는 방법은?",
                                        "choices": [
                                                  "Macro 간격 조정, halo 확보, utilization 완화",
                                                  "block 내부 clock gating만 더 공격적으로 적용하는 것",
                                                  "SRAM macro를 DRAM으로 교체하는 것",
                                                  "package pin 수를 늘리는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "혼잡도는 배치 밀도와 macro 주변 여유를 조정하는 것이 우선입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "혼잡도",
                                                  "매크로",
                                                  "플로어플랜"
                                        ]
                              },
                              {
                                        "id": "Q117",
                                        "difficulty": "응용",
                                        "stem": "Route 이후 긴 데이터 경로에서 setup violation이 남았을 때 본질에 가까운 대응은?",
                                        "choices": [
                                                  "경로 최적화, cell upsizing, buffering, 필요 시 pipeline 재구성",
                                                  "hold 보정용 버퍼를 추가해 minimum delay만 늘리는 것",
                                                  "LVS/DRC를 다시 수행해 경로 구조는 그대로 두는 것",
                                                  "전압만 낮춰 전체 경로를 느리게 만드는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Setup은 늦은 경로를 빠르게 만들어야 하므로 drive/logic depth 측면 최적화가 핵심입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "셋업 타임",
                                                  "업사이징",
                                                  "정적 타이밍 분석"
                                        ]
                              },
                              {
                                        "id": "Q118",
                                        "difficulty": "응용",
                                        "stem": "전원이 꺼질 수 있는 domain의 출력이 always-on domain으로 넘어갈 때 저전력 설계에서 필요한 대표 구조는?",
                                        "choices": [
                                                  "Isolation cell",
                                                  "Retention register",
                                                  "Level shifter",
                                                  "Clock gating cell"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "power-off domain 신호는 isolation 없이 넘기면 X 전파나 오동작을 만들 수 있습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "저전력 설계",
                                                  "아이솔레이션 셀",
                                                  "전력 의도 파일"
                                        ]
                              },
                              {
                                        "id": "Q119",
                                        "difficulty": "응용",
                                        "stem": "EM signoff에서 특정 trunk metal에 한계 초과 전류가 관찰되었다면 가장 적절한 수정 방향은?",
                                        "choices": [
                                                  "배선 폭 확대, 병렬 경로 추가, via 강화",
                                                  "동작 주파수만 낮춰 전류 밀도를 회피하는 것",
                                                  "data path buffer만 추가해 skew를 조정하는 것",
                                                  "CTS만 다시 수행해 문제를 해결하는 것"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "EM은 전류 밀도 문제이므로 금속 자원을 더 확보하는 방향이 일반적입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "전자이동",
                                                  "사인오프",
                                                  "배선"
                                        ]
                              },
                              {
                                        "id": "Q120",
                                        "difficulty": "응용",
                                        "stem": "multi-Vt 셀 전략에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "빠른 경로에는 low-Vt를, 누설 전력이 중요한 경로에는 high-Vt를 섞어 PPA를 맞춘다",
                                                  "모든 경로에 동일한 Vt 셀만 사용해 corner 해석을 단순화하는 전략이다",
                                                  "critical path에는 high-Vt를, 비중요 경로에는 low-Vt를 우선 배치하는 전략이다",
                                                  "메모리 매크로에만 적용되고 표준 셀에는 적용되지 않는 전략이다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "multi-Vt 전략은 속도가 중요한 경로와 누설 전력이 중요한 경로를 구분해 서로 다른 Vt 셀을 배치함으로써 성능과 전력의 균형을 맞추는 방법입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "PPA",
                                                  "다중 문턱전압",
                                                  "저전력 설계"
                                        ]
                              },
                              {
                                        "id": "Q121",
                                        "difficulty": "응용",
                                        "stem": "Signoff 직전 ECO로 게이트를 일부 변경했다면 다시 확인해야 할 최소 검증 조합은?",
                                        "choices": [
                                                  "LEC와 관련 STA",
                                                  "post-route congestion 개선 여부를 확인할 때",
                                                  "DRC/LVS clean 여부만 확인할 때",
                                                  "boot firmware regression만 다시 확인할 때"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "논리 변경이 들어간 ECO는 기능 동등성과 타이밍 영향을 다시 확인해야 안전합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "논리 등가성 검증",
                                                  "정적 타이밍 분석",
                                                  "ECO"
                                        ]
                              },
                              {
                                        "id": "Q122",
                                        "difficulty": "응용",
                                        "stem": "Reset이나 enable 같은 high-fanout 신호가 slew/transition 문제를 일으킬 때 흔히 고려하는 해법은?",
                                        "choices": [
                                                  "buffer tree 또는 신호 복제",
                                                  "DRAM refresh 간격 감소",
                                                  "패키지 본딩 축소",
                                                  "메모리 종류 변경"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "high-fanout 제어 신호는 분기 구조를 재구성해 구동 부담을 분산합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "하이 팬아웃",
                                                  "버퍼 트리",
                                                  "전이 시간"
                                        ]
                              },
                              {
                                        "id": "Q123",
                                        "difficulty": "응용",
                                        "stem": "구현 친화적 넷리스트와 constraint를 다듬는 역할, 그리고 Floorplan부터 Signoff까지 실제 레이아웃을 완성하는 역할을 각각 고르면?",
                                        "choices": [
                                                  "PI와 PD",
                                                  "DV와 AP",
                                                  "DFT와 MC",
                                                  "SC와 DT"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "앞단 구현 준비가 PI, 뒤단 물리 완성이 PD에 더 가깝습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "물리구현",
                                                  "물리설계",
                                                  "타이밍 제약"
                                        ]
                              },
                              {
                                        "id": "Q154",
                                        "difficulty": "중간",
                                        "stem": "Standard Cell이 같은 row에서 전원선을 공유하려면 동일해야 하는 규격은?",
                                        "choices": [
                                                  "Cell Height",
                                                  "Cell Width",
                                                  "Drive Strength",
                                                  "Threshold Voltage"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "보통 Standard Cell은 높이가 같아 row 배치가 가능합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "스탠더드 셀",
                                                  "셀 높이",
                                                  "배치배선"
                                        ]
                              },
                              {
                                        "id": "Q156",
                                        "difficulty": "기초",
                                        "stem": "PPA의 의미로 옳은 것은?",
                                        "choices": [
                                                  "Power, Performance, Area",
                                                  "Process, Voltage, Temperature",
                                                  "Placement, Power, Timing",
                                                  "Product, Package, Area"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "PPA는 전력, 성능, 면적을 뜻합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "PPA",
                                                  "전력",
                                                  "성능",
                                                  "면적"
                                        ]
                              },
                              {
                                        "id": "Q162",
                                        "difficulty": "기초",
                                        "stem": "Foundation IP에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "DDR/PCIe PHY 같은 인터페이스 블록을 통합하는 영역",
                                                  "Standard Cell Library와 SRAM Compiler 같은 기반 자산을 준비하는 영역",
                                                  "Scan, MBIST, ATPG 구조를 준비하는 영역",
                                                  "패키지 substrate와 bump map을 설계하는 영역"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Foundation IP는 표준셀 라이브러리, 메모리 컴파일러처럼 여러 칩 설계에서 반복 활용되는 기반 자산을 준비하는 영역입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "Foundation IP",
                                                  "표준셀 라이브러리",
                                                  "SRAM 컴파일러"
                                        ]
                              },
                              {
                                        "id": "Q165",
                                        "difficulty": "기초",
                                        "stem": "PI(Physical Implementation)의 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "패키지 substrate와 보드 인터페이스를 설계한다.",
                                                  "합성, constraint, low power를 정리해 구현 기반을 준비한다.",
                                                  "배치배선과 signoff closure를 직접 수행한다.",
                                                  "scan chain과 MBIST 구조를 넣고 ATPG를 준비한다."
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Physical Implementation 준비 단계에서는 합성 조건, 타이밍 제약, 저전력 설정 등을 정리해 실제 구현이 가능한 입력 상태를 맞추는 일이 중요합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "PI",
                                                  "구현 준비",
                                                  "constraint"
                                        ]
                              },
                              {
                                        "id": "Q166",
                                        "difficulty": "기초",
                                        "stem": "PD(Physical Design)의 역할로 맞는 것은?",
                                        "choices": [
                                                  "Floorplan, Placement, CTS, Routing, Signoff closure",
                                                  "Boot/Driver/BSP를 통합해 소프트웨어를 구동한다.",
                                                  "Scan/MBIST 구조를 넣고 ATPG를 준비한다.",
                                                  "옵션형 SRAM macro를 생성하고 특성을 설계한다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Physical Design은 Floorplan부터 Placement, CTS, Routing, Signoff closure까지 실제 칩 레이아웃을 완성하는 흐름을 담당합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "Physical Design",
                                                  "CTS",
                                                  "Routing"
                                        ]
                              },
                              {
                                        "id": "Q167",
                                        "difficulty": "기초",
                                        "stem": "STA의 핵심 정의로 가장 적절한 것은?",
                                        "choices": [
                                                  "논리 기능 시나리오를 입력 벡터로 모두 검증하는 것",
                                                  "최악 경로 지연을 계산해 타이밍 만족 여부를 보는 것",
                                                  "물리 룰 위반을 찾는 것",
                                                  "테스트 패턴을 압축하는 것"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "STA는 대표 경로의 지연을 계산해 setup/hold 조건을 만족하는지 확인하는 정적 타이밍 분석 기법입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "STA",
                                                  "정적 타이밍 분석",
                                                  "최악 경로"
                                        ]
                              },
                              {
                                        "id": "Q169",
                                        "difficulty": "기초",
                                        "stem": "Floorplan의 의미로 가장 적절한 것은?",
                                        "choices": [
                                                  "모든 버그를 잡는 단계",
                                                  "칩 면적, 매크로, I/O, 전원망 뼈대를 먼저 잡는 단계",
                                                  "패키징 후 양산 테스트 단계",
                                                  "운영체제 커널 튜닝 단계"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Floorplan 단계에서는 칩 크기, 주요 매크로 위치, I/O 배치, 전원망 구조 같은 큰 뼈대를 먼저 정합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "플로어플랜",
                                                  "I/O",
                                                  "전원망"
                                        ]
                              },
                              {
                                        "id": "Q173",
                                        "difficulty": "중간",
                                        "stem": "FinFET이 등장한 배경으로 가장 적절한 것은?",
                                        "choices": [
                                                  "캐시 용량을 늘리기 위해",
                                                  "미세화에 따른 누설 전류와 제어력 한계를 개선하기 위해",
                                                  "패키지 크기를 키우기 위해",
                                                  "DDR 대역폭을 줄이기 위해"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "FinFET은 평면 구조에서 커지던 누설 전류와 게이트 제어력 저하 문제를 완화하기 위해 도입된 3차원 트랜지스터 구조입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "FinFET",
                                                  "미세화",
                                                  "누설 전류"
                                        ]
                              },
                              {
                                        "id": "Q180",
                                        "difficulty": "기초",
                                        "stem": "Design Kit(PDK)의 역할 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "설계 데이터와 공정 규칙을 연결하는 기준 세트",
                                                  "표준 셀 라이브러리와 SRAM macro를 담은 IP 세트",
                                                  "전력 의도와 power domain을 기술하는 저전력 포맷",
                                                  "패키지 substrate와 bump 배치를 정의하는 도면 세트"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "PDK는 공정 규칙, 소자 모델, 레이어 정의처럼 설계 데이터와 실제 제조 공정을 연결해 주는 기준 세트입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "PDK",
                                                  "공정 규칙",
                                                  "설계 키트"
                                        ]
                              }
                    ]
          },
          "memory": {
                    "label": "메모리·소자",
                    "questions": [
                              {
                                        "id": "Q57",
                                        "difficulty": "기초",
                                        "stem": "SRAM의 핵심 구조적 특징으로 옳은 것은?",
                                        "choices": [
                                                  "6개의 트랜지스터로 래치를 구성하여 빠르고 Refresh가 불필요하지만, 셀 면적이 커서 대용량 집적에는 불리하다.",
                                                  "1T1C 구조로 동일 면적 대비 초고집적이 가능하다.",
                                                  "전원이 꺼져도 데이터를 유지하는 비휘발성 메모리이다.",
                                                  "구동 중에도 주기적인 Refresh가 필수적으로 요구된다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "SRAM은 6개의 트랜지스터로 1비트 래치를 구성하여 고속 접근이 가능하고 Refresh가 불필요하지만, 셀 면적이 크기 때문에 대용량 구현에는 비효율적입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "SRAM",
                                                  "DRAM"
                                        ]
                              },
                              {
                                        "id": "Q58",
                                        "difficulty": "기초",
                                        "stem": "DRAM이 SRAM 대비 가지는 대표적인 구조적 강점은?",
                                        "choices": [
                                                  "1T1C 구조로 동일 면적당 높은 집적도를 달성할 수 있어 대용량 메인 메모리에 적합하다.",
                                                  "CPU 코어와의 접근 지연(Latency)이 SRAM보다 훨씬 짧다.",
                                                  "셀 구조가 안정적이라 별도 refresh 없이도 장시간 데이터를 유지한다.",
                                                  "전원이 꺼져도 데이터가 유지되는 비휘발성 특성을 갖는다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DRAM은 1T1C(트랜지스터 1개 + 캐패시터 1개) 구조로 셀이 매우 단순하여, SRAM 대비 동일 면적에 훨씬 많은 비트를 집적할 수 있으므로 대용량 메인 메모리로 널리 사용됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "DRAM",
                                                  "SRAM"
                                        ]
                              },
                              {
                                        "id": "Q59",
                                        "difficulty": "중간",
                                        "stem": "DRAM이 주기적인 Refresh를 수행해야 하는 물리적 원인은?",
                                        "choices": [
                                                  "캐패시터의 구조상 시간이 지나면 전하가 누설되어 방전되기 때문",
                                                  "메모리 컨트롤러의 클럭 스큐 오차를 재정렬하기 위해",
                                                  "초미세 공정에서 트랜지스터 채널 폭이 커져 전류가 차단되기 때문",
                                                  "외장 컨트롤러에 펌웨어가 없어 소프트웨어로 주소를 갱신해야 하기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DRAM은 캐패시터에 전하를 저장하는데, 미세한 누설 전류로 인해 시간이 지나면 전하가 소진되므로 주기적으로 읽고 다시 쓰는 Refresh 과정이 필수적입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "DRAM"
                                        ]
                              },
                              {
                                        "id": "Q60",
                                        "difficulty": "기초",
                                        "stem": "CPU 캐시 메모리를 구성할 때 가장 적합한 메모리 소자는?",
                                        "choices": [
                                                  "빠른 접근 속도의 SRAM",
                                                  "고집적 1T1C 구조의 DRAM",
                                                  "데이터 보존에 초점을 둔 NAND Flash",
                                                  "SoC 컨트롤러 통합형 SSD"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "캐시 메모리(L1/L2/L3)는 CPU의 고속 클럭에 맞춰야 하므로, 면적 효율을 감수하더라도 접근 지연이 가장 짧은 SRAM을 사용합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "SRAM"
                                        ]
                              },
                              {
                                        "id": "Q61",
                                        "difficulty": "기초",
                                        "stem": "NAND Flash와 SSD의 관계를 올바르게 설명한 것은?",
                                        "choices": [
                                                  "NAND Flash는 데이터를 기록하는 반도체 메모리 소자이며, SSD는 다수의 Flash 칩과 컨트롤러를 결합한 완성형 저장장치이다.",
                                                  "둘 다 전원이 꺼지면 데이터가 휘발되는 동적 메모리(RAM)의 일종이다.",
                                                  "NAND Flash는 외부 커넥터 인터페이스이며, SSD는 단일 Flash 칩 소자이다.",
                                                  "둘 다 웨어 레벨링 알고리즘의 소프트웨어 버전명일 뿐, 물리적 형태와는 무관하다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "NAND Flash는 비휘발성 저장을 수행하는 메모리 소자이고, SSD는 이 Flash 칩들을 컨트롤러(FTL, ECC, 웨어 레벨링 등)와 통합하여 만든 완성형 저장장치입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "플래시 메모리",
                                                  "SSD"
                                        ]
                              },
                              {
                                        "id": "Q62",
                                        "difficulty": "기초",
                                        "stem": "MOSFET의 스위칭 동작 원리로 옳은 것은?",
                                        "choices": [
                                                  "게이트 전압이 형성하는 전계(Electric Field)로 소스-드레인 간 채널의 전류 도통을 제어한다.",
                                                  "기계적 다이오드 구조로 단방향 전류만 흐른다.",
                                                  "소프트웨어 명령어를 아날로그 주파수로 변환하여 전류를 제어한다.",
                                                  "자기장과 스프링 관성으로 물리적 채널을 여닫는다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "MOSFET은 게이트 전극에 인가된 전압이 절연막 아래 반도체 채널에 전계를 형성하여 전자 또는 정공의 흐름을 켜고 끄는 현대 디지털 회로의 핵심 소자입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "MOS"
                                        ]
                              },
                              {
                                        "id": "Q63",
                                        "difficulty": "기초",
                                        "stem": "CMOS 회로의 구성 원리로 옳은 것은?",
                                        "choices": [
                                                  "NMOS(풀다운)와 PMOS(풀업)를 상보적으로 결합하여 스위칭 대기 시 정적 전류 경로를 차단하는 구조",
                                                  "PMOS만으로 전체 논리 회로를 구성한 단일 극성 구조",
                                                  "NMOS만을 수직 적층하여 래칭 회로를 구현한 구조",
                                                  "시스템 클럭을 외부로 출력하기 위한 I/O 통신 모듈"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "CMOS는 NMOS와 PMOS를 상보적으로 결합하여, 논리 천이 순간을 제외하면 VDD-GND 간 직류 경로가 항상 차단되므로 정적 소비 전력이 거의 0에 가까운 저전력 구조입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "CMOS",
                                                  "NMOS",
                                                  "PMOS"
                                        ]
                              },
                              {
                                        "id": "Q64",
                                        "difficulty": "중간",
                                        "stem": "Planar 구조에서 FinFET으로 전환하게 된 주된 배경은?",
                                        "choices": [
                                                  "초미세 공정에서 게이트-채널 거리가 짧아져 누설 전류 제어력이 떨어지므로, 채널을 3면에서 감싸 전계 제어력을 강화하기 위해",
                                                  "패키지 부피를 키워 방열 능력을 강화하기 위해",
                                                  "하드웨어 전용 ROM 모듈 전환을 위한 공정 단순화 조치",
                                                  "SRAM의 Refresh 사이클을 DRAM에도 적용하기 위한 구조 변경"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "미세화가 진행되며 Planar 구조로는 줄어든 채널 길이에 따른 누설 전류를 제어할 수 없게 되자, 채널을 Fin 형태로 돌출시켜 게이트가 3면에서 감싸는 FinFET 구조로 누설 전류 한계를 극복했습니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "평면형 트랜지스터",
                                                  "핀펫"
                                        ]
                              },
                              {
                                        "id": "Q65",
                                        "difficulty": "기초",
                                        "stem": "FinFET 소자의 대표적인 성능 이점은?",
                                        "choices": [
                                                  "채널 3면 포위에 따른 게이트 제어력 극대화와 누설 전류의 대폭 감소",
                                                  "1차원 평면 구조로 패터닝 난이도가 낮아지는 이점",
                                                  "배선 저항이 0Ω으로 수렴하는 초전도 현상",
                                                  "대용량 메모리의 Refresh 필요성이 근본적으로 제거되는 이점"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "FinFET은 채널을 3면에서 감싸므로 게이트 제어력이 좋아지고 누설 전류가 줄어들어, 저전압에서도 더 안정적이고 빠른 스위칭이 가능합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "핀펫",
                                                  "평면형 트랜지스터"
                                        ]
                              },
                              {
                                        "id": "Q66",
                                        "difficulty": "기초",
                                        "stem": "전원이 차단되어도 저장된 데이터를 잃지 않고 유지하는 비휘발성(Non-volatile) 특성을 갖는 메모리 소자는?",
                                        "choices": [
                                                  "플로팅 게이트나 전하 포획막에 전자를 터널링시켜 데이터를 유지하는 플래시 메모리 (NAND Flash 등)",
                                                  "주기적인 재충전(Refresh)이 필수적인 동적 메모리인 DRAM",
                                                  "빠른 접근을 제공하지만 전원이 차단되면 데이터가 소멸하는 정적 메모리인 SRAM",
                                                  "연산 중 일시적으로만 데이터를 보관하는 CPU 내 레지스터"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "플래시 메모리는 터널 산화막을 통해 플로팅 게이트에 저장된 전자가 전원이 차단되어도 빠져나가지 않아 데이터를 반영구적으로 유지하는 대표적인 비휘발성 메모리입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "플래시 메모리"
                                        ]
                              },
                              {
                                        "id": "Q67",
                                        "difficulty": "기초",
                                        "stem": "SRAM과 DRAM의 성능 및 구조 특성을 비교한 설명 중 잘못된 것은?",
                                        "choices": [
                                                  "SRAM은 트랜지스터 구조의 한계로 인해 구동 중 지속적인 재충전(Refresh) 동작이 필수적인 단점이 있다.",
                                                  "SRAM은 트랜지스터 래치 구성을 통해 DRAM보다 월등히 빠르고 일관된 무작위 접근 속도를 제공한다.",
                                                  "DRAM은 1T1C(트랜지스터 1개, 커패시터 1개) 구조를 채택하여 동일 면적 대비 훨씬 높은 대용량 집적도를 달성할 수 있다.",
                                                  "DRAM은 밀도 대비 구조가 단순하고 비용이 저렴해 PC나 모바일 기기의 메인 메모리(RAM)로 가장 널리 사용된다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "주기적인 재충전(Refresh)이 필요한 것은 메모리 커패시터의 전하 누설이 발생하는 DRAM의 특성입니다. 반면 SRAM은 전원만 유지되면 플립플롭 구조를 통해 상태를 계속 유지하므로 별도의 Refresh가 필요하지 않습니다. 따라서 1번 설명은 반대로 기술되어 잘못된 항목입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "SRAM",
                                                  "DRAM"
                                        ]
                              },
                              {
                                        "id": "Q68",
                                        "difficulty": "기초",
                                        "stem": "현대 디지털 로직 회로 설계에서 NMOS와 PMOS를 상보적으로 결합한 CMOS(Complementary MOS) 구조가 주로 사용되는 가장 큰 이유는 무엇인가?",
                                        "choices": [
                                                  "스위칭 전환 시점을 제외하면 0과 1 상태 유지 시 VDD와 GND 간의 직류 경로가 차단되어 정적 전력 소모(Static Power)를 거의 0에 가깝게 최소화할 수 있기 때문이다.",
                                                  "두 소자의 결합으로 물리적 강도가 높아져 칩 패키징의 안정성을 보장하기 때문이다.",
                                                  "소자 구조상 커널 레벨의 악성 코드를 물리적으로 원천 차단하는 보안 내성을 가졌기 때문이다.",
                                                  "파운드리 양산 시 클럭 분배망과 타이밍 툴 라이선스를 단독으로 관장하는 필수 구조이기 때문이다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "NMOS는 0(저전위)을, PMOS는 1(고전위)을 전달하는데 최적화되어 있습니다. 이 둘을 상호 상보적인 스위치로 결합하면, 정지 상태에서는 VDD에서 GND로 흐르는 전류 경로가 끊어지므로 누설 전류에 의한 정적 전력 소모를 획기적으로 줄일 수 있는 것이 CMOS 회로의 핵심 이점입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "NMOS",
                                                  "PMOS",
                                                  "CMOS"
                                        ]
                              },
                              {
                                        "id": "Q69",
                                        "difficulty": "중간",
                                        "stem": "SSD(Solid State Drive)의 주요 시스템 내부 구성 요소로 올바르게 짝지어진 것은?",
                                        "choices": [
                                                  "데이터를 저장하는 낸드 플래시 메모리와, 오류 정정(ECC) 및 웨어 레벨링(Wear Leveling) 등을 총괄하는 SoC 컨트롤러",
                                                  "플로팅 게이트 내부의 산화막 데이터 및 외부 캐패시터의 용량 제어 파라미터 집합",
                                                  "칩 내 타이밍 제어를 위한 클럭 트리 병합망과 버퍼 스큐 지연 분석기",
                                                  "초기 논리 검증용으로 구현된 UVM 테스트 시퀀스 및 함수 객체 라이브러리"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "SSD는 단순한 NAND 플래시 칩의 나열이 아니라, 이러한 메모리 소자들을 효율적으로 제어하고 수명을 연장(웨어 레벨링)하며 에러를 정정(ECC)하는 지능형 컨트롤러가 결합된 통합 스토리지 시스템입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "SSD",
                                                  "플래시 메모리"
                                        ]
                              },
                              {
                                        "id": "Q70",
                                        "difficulty": "중간",
                                        "stem": "ADT의 주요 자산 카테고리 중 Foundation IP에 해당하는 구성 요소로 가장 적절한 것은?",
                                        "choices": [
                                                  "표준 셀 라이브러리(Standard Cell Library)와 SRAM 컴파일러(SRAM Compiler)",
                                                  "패키지 핀 아웃 단선 여부만 정밀 타겟하는 물리 점검용 외곽 바운더리 스캔 장비",
                                                  "물리망 구현 후 타이밍과 클럭 지연 수치를 테스트하기 위한 사인오프 분석 검증 툴",
                                                  "부팅 보안망과 외부 공격 방어 제어를 구동하는 상위 보안 펌웨어(Trusted Firmware) 스택"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Foundation IP는 여러 설계에서 공통으로 사용하는 기반 자산으로, 대표적으로 표준 셀 라이브러리와 SRAM 컴파일러가 여기에 포함됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "SRAM 컴파일러",
                                                  "SRAM"
                                        ]
                              },
                              {
                                        "id": "Q124",
                                        "difficulty": "중간",
                                        "stem": "DRAM read를 destructive read라고 부르는 이유로 가장 적절한 것은?",
                                        "choices": [
                                                  "읽는 과정에서 저장 전하가 sense amp 쪽으로 흘러 원래 상태를 restore해야 하기 때문",
                                                  "읽을 때 wordline 전압이 셀 산화막을 손상시켜 내용이 사라지기 때문",
                                                  "Flash처럼 읽기 전에 block erase를 선행해야 하기 때문",
                                                  "읽기 지연이 길어 데이터를 반복 확인해야 한다는 의미로 붙은 표현이기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DRAM은 read 후 restore가 필요한 구조라는 점이 핵심입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "DRAM",
                                                  "센스 앰프",
                                                  "리프레시"
                                        ]
                              },
                              {
                                        "id": "Q125",
                                        "difficulty": "중간",
                                        "stem": "Register file이나 L1 cache에 SRAM이 더 적합한 이유로 가장 적절한 것은?",
                                        "choices": [
                                                  "낮은 지연과 빠른 random access가 중요하기 때문",
                                                  "비휘발성이어서 전원 차단 후에도 내용을 그대로 유지하기 때문",
                                                  "동일 면적 대비 저장 밀도가 가장 높기 때문",
                                                  "block erase 기반이라 대용량 일괄 갱신에 유리하기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "속도와 지연이 핵심인 on-chip 가까운 저장소에는 SRAM이 적합합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "SRAM",
                                                  "캐시",
                                                  "레지스터 파일"
                                        ]
                              },
                              {
                                        "id": "Q126",
                                        "difficulty": "중간",
                                        "stem": "HBM을 설명할 때 함께 언급되는 패키징 키워드로 가장 적절한 것은?",
                                        "choices": [
                                                  "2.5D/Interposer",
                                                  "Package-on-Package",
                                                  "Wire Bonding",
                                                  "Lead Frame"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "HBM은 고대역폭 메모리이며 2.5D/interposer 문맥과 자주 함께 설명됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "HBM",
                                                  "실리콘 인터포저",
                                                  "칩렛"
                                        ]
                              },
                              {
                                        "id": "Q127",
                                        "difficulty": "중간",
                                        "stem": "Flash의 동작 특성으로 가장 적절한 것은?",
                                        "choices": [
                                                  "page program / block erase",
                                                  "bit program / die erase",
                                                  "cell read / wafer erase",
                                                  "package write / board erase"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Flash는 page 단위 쓰기와 block 단위 소거가 핵심 비교 포인트입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "플래시 메모리",
                                                  "페이지 프로그램",
                                                  "블록 이레이즈"
                                        ]
                              },
                              {
                                        "id": "Q128",
                                        "difficulty": "중간",
                                        "stem": "Planar보다 FinFET이 미세화에서 유리한 핵심 이유는?",
                                        "choices": [
                                                  "게이트가 채널을 더 많이 감싸 electrostatic control이 강해지기 때문",
                                                  "source/drain 저항이 거의 사라져 지연 성분이 없어지기 때문",
                                                  "배선 층 수가 자동으로 줄어 시스템 RC가 감소하기 때문",
                                                  "패키지 열저항이 낮아져 소자 제어력이 개선되기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "FinFET의 핵심은 3면 제어에 가까운 강한 채널 제어력입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "핀펫",
                                                  "평면형 트랜지스터",
                                                  "채널 제어"
                                        ]
                              },
                              {
                                        "id": "Q129",
                                        "difficulty": "응용",
                                        "stem": "DRAM cell의 refresh를 너무 늦게 해서 charge가 임계치 아래로 떨어졌다면 read 결과가 왜 0 쪽으로 기울 수 있는가?",
                                        "choices": [
                                                  "sense amp가 남은 작은 delta를 1로 인식하지 못하고 방전 상태로 판정할 수 있기 때문",
                                                  "refresh가 늦어도 bitline precharge 전압이 읽기 값을 대신 결정하기 때문",
                                                  "셀 전하와 무관하게 패키지 전압이 두 배로 상승하기 때문",
                                                  "SSD 컨트롤러의 ECC가 DRAM 읽기 값을 자동 보정하기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DRAM은 charge-based storage라 retention이 무너지면 정보 자체가 약해집니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "DRAM",
                                                  "리텐션",
                                                  "리프레시"
                                        ]
                              },
                              {
                                        "id": "Q130",
                                        "difficulty": "응용",
                                        "stem": "SRAM compiler를 “옵션에 따라 macro를 만들어 주는 솔루션”이라고 보는 이유는?",
                                        "choices": [
                                                  "depth/width/port/power option에 맞춰 파생 macro를 구성할 수 있기 때문",
                                                  "제공되는 메모리 구조와 타이밍이 완전히 고정돼 용량 옵션을 바꿀 수 없기 때문",
                                                  "주변 회로 없이 DDR PHY 같은 인터페이스 블록만 생성하기 때문",
                                                  "메모리 매크로가 아니라 패키지·보드 라우팅 템플릿을 생성하기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "compiler는 고정 hard macro 하나가 아니라 구성 옵션을 가진 생성형 솔루션이라는 점이 중요합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "SRAM 컴파일러",
                                                  "메모리 매크로",
                                                  "옵션"
                                        ]
                              },
                              {
                                        "id": "Q131",
                                        "difficulty": "응용",
                                        "stem": "“면적은 아끼고 용량은 크게 가져가야 하지만 access latency는 캐시만큼 빠를 필요는 없다”는 조건에 더 가까운 선택은?",
                                        "choices": [
                                                  "DRAM 쪽 사고방식",
                                                  "SRAM처럼 지연을 최우선으로 두고 면적 증가를 감수하는 접근",
                                                  "NAND Flash를 메인 메모리처럼 직접 사용하는 접근",
                                                  "읽기 전용 구조를 가정해 ROM으로 고정하는 접근"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "대용량·고집적 요구가 우선이면 DRAM 쪽 trade-off가 더 자연스럽습니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "DRAM",
                                                  "집적도",
                                                  "트레이드오프"
                                        ]
                              },
                              {
                                        "id": "Q132",
                                        "difficulty": "응용",
                                        "stem": "FinFET 다음 세대 문맥에서 GAA가 자주 언급되는 이유는?",
                                        "choices": [
                                                  "게이트가 채널을 더 둘러싸 제어력을 한 단계 더 강화하는 방향이기 때문",
                                                  "source/drain resistance를 완전히 없앨 수 있기 때문",
                                                  "metal layer 수를 크게 줄일 수 있기 때문",
                                                  "TSV 없이 HBM을 붙이기 쉬워서"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "GAA는 Gate-All-Around 구조로 electrostatic control을 더 높이는 방향입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "GAA",
                                                  "핀펫",
                                                  "채널 제어"
                                        ]
                              },
                              {
                                        "id": "Q133",
                                        "difficulty": "응용",
                                        "stem": "MBIST와 BISR의 관계로 가장 적절한 것은?",
                                        "choices": [
                                                  "MBIST가 검사하고, BISR은 불량을 예비 자원으로 우회/복구하는 쪽과 연결된다",
                                                  "MBIST는 로직 경로 타이밍을 분석하고, BISR은 scan compression을 높이는 역할이다",
                                                  "둘 다 메모리 주변 패키지 핀 무결성만 점검하는 기법이다",
                                                  "MBIST는 보안 부팅 체인을 만들고, BISR은 키 저장 영역을 보호하는 기법이다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "MBIST는 메모리 불량을 검사하는 역할이고, BISR은 예비 자원을 활용해 불량을 우회하거나 복구하는 역할과 연결됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "메모리 BIST",
                                                  "자가 수리",
                                                  "메모리"
                                        ]
                              },
                              {
                                        "id": "Q134",
                                        "difficulty": "응용",
                                        "stem": "Planar 구조에서 short-channel effect와 leakage가 더 문제가 된다고 설명하는 핵심 논리는?",
                                        "choices": [
                                                  "게이트가 채널 상부 한 면 중심으로만 제어해 미세화 시 electrostatic control이 약해지기 때문",
                                                  "게이트 산화막만 얇게 하면 short-channel effect가 자연스럽게 사라지기 때문",
                                                  "source/drain contact 저항이 0에 가까워져 누설이 커지기 때문",
                                                  "패키지 기생 성분이 채널 길이 효과보다 지배적으로 작용하기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "한 면 제어 구조는 미세화가 심해질수록 채널을 붙잡는 힘이 약해집니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "평면형 트랜지스터",
                                                  "누설 전류",
                                                  "핀펫"
                                        ]
                              },
                              {
                                        "id": "Q135",
                                        "difficulty": "응용",
                                        "stem": "SSD 컨트롤러가 단순 저장 셀 집합이 아니라 시스템 역할을 한다는 설명의 핵심 키워드는?",
                                        "choices": [
                                                  "FTL, ECC, Wear Leveling",
                                                  "CTS, DRC, LVS",
                                                  "UPF, Isolation, Retention",
                                                  "Scan, MBIST, IJTAG"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "SSD는 Flash 셀 자체보다도 이를 관리하는 controller logic이 시스템 품질을 좌우합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "SSD",
                                                  "FTL",
                                                  "ECC",
                                                  "웨어 레벨링"
                                        ]
                              },
                              {
                                        "id": "Q136",
                                        "difficulty": "응용",
                                        "stem": "동시에 읽기와 쓰기를 처리해야 하는 FIFO나 line buffer에 “dual-port SRAM”이 자주 언급되는 이유는?",
                                        "choices": [
                                                  "독립 접근 포트를 두어 병행 access가 쉬워지기 때문",
                                                  "Refresh가 자동으로 사라지기 때문",
                                                  "Flash erase가 빨라지기 때문",
                                                  "패키지 핀이 없어지기 때문"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "동시성 요구가 있는 저장 구조에서는 dual-port 접근이 큰 장점입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "SRAM",
                                                  "듀얼 포트",
                                                  "FIFO"
                                        ]
                              },
                              {
                                        "id": "Q158",
                                        "difficulty": "기초",
                                        "stem": "MBIST의 목적 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "메모리 내부 결함을 자체 테스트 구조로 검사한다.",
                                                  "로직 경로의 setup/hold 위반을 분석한다.",
                                                  "온칩 보안 부팅 체인을 구성한다.",
                                                  "패키지 신뢰성을 열충격 시험으로 평가한다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "MBIST는 Memory Built-In Self-Test의 약자입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "MBIST",
                                                  "메모리 BIST",
                                                  "테스트 설계"
                                        ]
                              },
                              {
                                        "id": "Q159",
                                        "difficulty": "중간",
                                        "stem": "BISR에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "불량 메모리 셀을 예비 자원으로 대체하는 자가 수리 기법",
                                                  "클럭 경로를 늦추는 버퍼 삽입 기법",
                                                  "패키지 외부 테스트 장비",
                                                  "전원망 전압 강하 분석"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "BISR은 Built-In Self-Repair로, 메모리 불량 수리 전략과 연결됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "BISR",
                                                  "자가 수리",
                                                  "메모리"
                                        ]
                              },
                              {
                                        "id": "Q171",
                                        "difficulty": "기초",
                                        "stem": "SRAM 설명으로 옳은 것은?",
                                        "choices": [
                                                  "느리지만 고집적이라 메인 메모리에 주로 쓰인다.",
                                                  "빠르지만 면적이 크고 캐시에 많이 쓰인다.",
                                                  "비휘발성이라 SSD에 직접 쓰인다.",
                                                  "1T1C 구조다."
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "SRAM은 빠르지만 셀 면적이 커서 대용량 메인 메모리보다는 캐시나 고속 버퍼에 주로 사용됩니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "SRAM",
                                                  "캐시",
                                                  "휘발성 메모리"
                                        ]
                              },
                              {
                                        "id": "Q172",
                                        "difficulty": "기초",
                                        "stem": "Flash와 SSD의 관계로 맞는 것은?",
                                        "choices": [
                                                  "Flash는 저장 매체, SSD는 이를 활용한 저장장치다.",
                                                  "SSD는 소자이고 Flash는 완제품이다.",
                                                  "둘 다 휘발성 메모리다.",
                                                  "둘 다 동일한 의미로만 쓴다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Flash는 비휘발성 저장 소자이고, SSD는 이런 Flash 메모리와 컨트롤러를 포함한 완성형 저장장치입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "Flash",
                                                  "SSD",
                                                  "비휘발성"
                                        ]
                              }
                    ]
          },
          "adt": {
                    "label": "ADT 직무·공개기술",
                    "questions": [
                              {
                                        "id": "Q71",
                                        "difficulty": "기초",
                                        "stem": "ADT 소개 자료에서 실제 설계 기술 조직에 해당하는 직무 명칭으로 가장 적절한 것은?",
                                        "choices": [
                                                  "설계 검증을 담당하는 DV(Design Verification)",
                                                  "양산 품질과 신뢰성 평가를 담당하는 패키지 품질 엔지니어링 조직",
                                                  "고객 제안과 사업 수주를 담당하는 사업 개발 조직",
                                                  "채용, 조직 운영, 인사 제도를 담당하는 경영 지원 조직"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADT 소개 자료의 기술 직무 예시에는 DV, PD, 아키텍트/DP 같은 실제 반도체 설계 조직이 포함됩니다. 보기 중 그에 해당하는 것은 DV입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "설계 검증"
                                        ]
                              },
                              {
                                        "id": "Q72",
                                        "difficulty": "기초",
                                        "stem": "ADT의 Foundation IP를 구성하는 대표적인 기반 설계 자산 조합으로 가장 적절한 것은?",
                                        "choices": [
                                                  "Standard Cell Library와 SRAM Compiler",
                                                  "LPDDR 컨트롤러와 Linux BSP",
                                                  "UVM 클래스 라이브러리와 ATPG 패턴",
                                                  "GDSII 데이터와 웨이퍼 공정 장비 모델"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Foundation IP는 여러 설계 프로젝트에서 공통으로 쓰이는 기반 자산을 뜻하며, 대표적으로 Standard Cell Library와 SRAM Compiler가 여기에 포함됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "Foundation IP",
                                                  "스탠더드 셀",
                                                  "SRAM 컴파일러"
                                        ]
                              },
                              {
                                        "id": "Q73",
                                        "difficulty": "기초",
                                        "stem": "저전력 IoT 및 Edge-AI 용도를 겨냥한 Cortex-A53 기반 ADT 플랫폼으로 가장 적절한 것은?",
                                        "choices": [
                                                  "Cortex-A53 기반의 저전력 Edge-AI 플랫폼인 ADP500",
                                                  "Neoverse 기반의 HPC 플랫폼인 ADP600",
                                                  "A53과 R52를 함께 쓰는 Automotive 플랫폼인 ADP510",
                                                  "A78AE 기반의 프리미엄 Automotive 플랫폼인 ADP520"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADP500은 Cortex-A53 기반의 저전력 플랫폼으로, IoT 단말과 Edge-AI 같은 경량 지능형 시스템 용도를 겨냥한 라인업입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "ADP500",
                                                  "Edge-AI",
                                                  "Cortex-A53"
                                        ]
                              },
                              {
                                        "id": "Q74",
                                        "difficulty": "기초",
                                        "stem": "Automotive 용도로 설계된 ADT ADP510의 핵심 구조 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "범용 애플리케이션용 Cortex-A53과 기능 안전용 Cortex-R52를 함께 통합한 하이브리드 구조",
                                                  "Neoverse 코어만으로 구성된 서버 전용 HPC 구조",
                                                  "Secure Enclave만 탑재하고 애플리케이션 코어는 제외한 구조",
                                                  "HBM 인터포저 연결만을 위한 메모리 전용 구조"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADP510은 Automotive 환경을 겨냥해 Cortex-A53 기반 애플리케이션 처리와 Cortex-R52 기반 기능 안전 처리를 함께 가져가는 구조로 이해하면 됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "ADP510",
                                                  "Automotive",
                                                  "Cortex-R52"
                                        ]
                              },
                              {
                                        "id": "Q75",
                                        "difficulty": "기초",
                                        "stem": "Cortex-A78AE 기반의 프리미엄 Automotive 타깃 ADT 플랫폼으로 가장 적절한 것은?",
                                        "choices": [
                                                  "ADP520",
                                                  "ADP500",
                                                  "ADP510",
                                                  "ADP600"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADT 플랫폼 계열에서 Cortex-A78AE 기반의 프리미엄 Automotive 포지션은 ADP520으로 정리됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "ADP520",
                                                  "Cortex-A78AE",
                                                  "Automotive"
                                        ]
                              },
                              {
                                        "id": "Q76",
                                        "difficulty": "기초",
                                        "stem": "Neoverse 기반 ADT ADP600이 주로 겨냥하는 산업 카테고리로 가장 적절한 것은?",
                                        "choices": [
                                                  "대규모 서버와 AI 연산을 겨냥한 HPC(High Performance Computing)",
                                                  "Boundary Scan 기반 생산 테스트 장비",
                                                  "저전력 모바일 메모리 컨트롤러",
                                                  "PnR용 GUI 시각화 플러그인"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADP600은 Neoverse 기반 고성능 컴퓨팅 플랫폼으로, 대규모 서버와 AI 연산 같은 HPC 영역을 주요 타깃으로 합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "ADP600",
                                                  "Neoverse",
                                                  "HPC"
                                        ]
                              },
                              {
                                        "id": "Q77",
                                        "difficulty": "기초",
                                        "stem": "칩 부팅 시 신뢰된 펌웨어만 먼저 실행되도록 보장하는 ADT 보안 자산으로 가장 적절한 것은?",
                                        "choices": [
                                                  "Secure Boot based on ARM Trusted Firmware",
                                                  "ATPG 패턴 생성",
                                                  "DRC 룰 체크",
                                                  "SRAM Repair 전용 블록"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Secure Boot based on ARM Trusted Firmware는 부팅 초기 단계에서 신뢰된 펌웨어만 실행되도록 하여 시스템 보안의 출발점을 보장하는 구조입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "시큐어 부트",
                                                  "트러스티드 펌웨어"
                                        ]
                              },
                              {
                                        "id": "Q78",
                                        "difficulty": "기초",
                                        "stem": "Root of Trust 구현을 위해 메인 코어와 분리된 보안 격리 영역으로 가장 적절한 것은?",
                                        "choices": [
                                                  "Secure Enclave",
                                                  "Boundary Scan",
                                                  "CTS",
                                                  "DRAM capacitor array"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Secure Enclave는 메인 프로세싱 영역과 분리된 보안 격리 구역으로, 키 저장과 민감한 보안 연산을 보호하는 Root of Trust 구성 요소로 이해할 수 있습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "신뢰의 근원",
                                                  "시큐어 엔클레이브"
                                        ]
                              },
                              {
                                        "id": "Q79",
                                        "difficulty": "기초",
                                        "stem": "Tapeout 이전에 시스템 구동성과 소프트웨어 bring-up을 빠르게 검증하기 위한 ADT Verification Platform의 핵심 조합은?",
                                        "choices": [
                                                  "FPGA Prototyping과 Emulation",
                                                  "DRC와 LVS",
                                                  "DRAM과 SRAM",
                                                  "NMOS와 PMOS"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Verification Platform은 FPGA prototyping과 emulation을 통해 실리콘 이전 단계에서 소프트웨어 bring-up과 대규모 검증을 앞당기는 환경을 의미합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "FPGA",
                                                  "에뮬레이션"
                                        ]
                              },
                              {
                                        "id": "Q80",
                                        "difficulty": "기초",
                                        "stem": "Chiplet Solution에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "큰 단일 다이를 여러 기능별 칩렛으로 나누고, 이를 인터포저나 고급 패키징으로 연결해 수율과 확장성을 높이는 방식",
                                                  "전원 차단 후 데이터를 복구하기 위한 부팅 복구 소프트웨어 방식",
                                                  "HDL 문법 오류만 검사하는 정적 코드 분석 방식",
                                                  "PMOS 하나만으로 디지털 시스템을 구성하는 소자 방식"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Chiplet Solution은 기능별 다이를 분리해 제조한 뒤 인터포저나 고급 패키징으로 연결하는 방식으로, 대형 단일 다이의 수율 문제를 완화하고 설계 유연성을 높이는 데 유리합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "칩렛",
                                                  "실리콘 인터포저",
                                                  "HBM"
                                        ]
                              },
                              {
                                        "id": "Q81",
                                        "difficulty": "중간",
                                        "stem": "DP(Design Platform) 파트의 주된 역할로 가장 적절한 것은?",
                                        "choices": [
                                                  "SoC의 주요 IP, NoC, I/O 구조를 통합해 전체 아키텍처와 성능 방향을 설계하는 역할",
                                                  "합성된 넷리스트에 scan/MBIST를 넣고 ATPG를 준비하는 DFT 역할",
                                                  "RTL 이후 배치배선과 타이밍 클로저를 맡는 Physical Design 역할",
                                                  "Boot, Driver, BSP를 통합해 bring-up을 담당하는 Application Platform 역할"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DP는 개별 셀이나 배치배선보다 상위 수준에서 SoC 전체 구조와 주요 IP 구성, 시스템 아키텍처 방향을 잡는 역할에 가깝습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "디자인 플랫폼",
                                                  "시스템온칩",
                                                  "인터페이스 IP"
                                        ]
                              },
                              {
                                        "id": "Q82",
                                        "difficulty": "중간",
                                        "stem": "DFT(Design for Test)의 3대 핵심 기술 요소는?",
                                        "choices": [
                                                  "MBIST(메모리 자가 테스트), Scan Chain(로직 구조 테스트), IJTAG/JTAG(테스트 접근 프로토콜)",
                                                  "STA, DRC/LVS, IR/EM 같은 사인오프 검증 항목",
                                                  "UPF, isolation cell, level shifter 같은 저전력 설계 요소",
                                                  "Boot firmware, BSP, PCIe driver 같은 플랫폼 소프트웨어 요소"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DFT의 핵심은 메모리 불량을 자가 검출하는 MBIST, 로직을 직렬 연결하여 구조 불량을 검사하는 Scan Chain, 칩 내부 테스트 자원을 표준 프로토콜로 접근하는 IJTAG/JTAG입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "테스트 설계",
                                                  "메모리 BIST",
                                                  "스캔",
                                                  "IJTAG"
                                        ]
                              },
                              {
                                        "id": "Q83",
                                        "difficulty": "중간",
                                        "stem": "PI(Physical Implementation) 파트가 주도하는 핵심 과업 3가지는?",
                                        "choices": [
                                                  "논리 합성(Synthesis), 저전력 설계(Low Power), 타이밍 제약 설정(Timing Constraints)",
                                                  "Floorplan, CTS, Routing 같은 Physical Design 작업",
                                                  "Boot/Driver/BSP를 통합하는 Application Platform 작업",
                                                  "Scan insertion, MBIST, ATPG를 준비하는 DFT 작업"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "PI는 RTL을 타겟 공정용 게이트 넷리스트로 합성하고, UPF 기반 저전력 구조를 설정하며, PnR 공정을 위한 타이밍 제약을 세팅하여 백엔드 물리 구현의 입력을 준비하는 직무입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "물리구현",
                                                  "논리합성",
                                                  "전력 의도 파일",
                                                  "타이밍 제약"
                                        ]
                              },
                              {
                                        "id": "Q84",
                                        "difficulty": "중간",
                                        "stem": "Application Platform 직무의 핵심 기술 임무는?",
                                        "choices": [
                                                  "Boot 루틴 제어, OS/펌웨어 통합, 외부 인터페이스(PCIe, USB 등) 드라이버 및 BSP 구축",
                                                  "Floorplan, CTS, Routing을 통해 GDSII를 완성하는 업무",
                                                  "Scan/MBIST 구조를 넣고 ATPG 패턴을 준비하는 업무",
                                                  "STA, DRC/LVS, IR/EM 같은 signoff를 수행하는 업무"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Application Platform은 부팅 체계와 OS/펌웨어, 각종 드라이버와 BSP를 통합해 하드웨어 위에서 소프트웨어가 실제로 동작하도록 만드는 역할입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "애플리케이션 플랫폼",
                                                  "시큐어 부트",
                                                  "인터페이스 IP"
                                        ]
                              },
                              {
                                        "id": "Q137",
                                        "difficulty": "중간",
                                        "stem": "DP(Design Platform) 직무를 가장 가깝게 요약한 것은?",
                                        "choices": [
                                                  "플랫폼 아키텍처를 잡고 CPU/NoC/IP를 통합하는 역할",
                                                  "공정 rule deck을 관리하고 DRC signoff만 수행하는 역할",
                                                  "후공정 조립과 패키지 수율 개선을 전담하는 역할",
                                                  "고객 제안서와 사업 수주 협상을 주도하는 사업 개발 역할"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DP는 플랫폼 구조와 블록 통합을 보는 상위 설계 축에 가깝습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "디자인 플랫폼",
                                                  "시스템온칩",
                                                  "IP 통합"
                                        ]
                              },
                              {
                                        "id": "Q138",
                                        "difficulty": "중간",
                                        "stem": "DV와 DFT의 역할을 가장 적절하게 구분한 것은?",
                                        "choices": [
                                                  "DV는 기능이 사양대로 동작하는지 검증하고, DFT는 테스트 가능하도록 구조와 패턴을 설계한다",
                                                  "DV는 RTL 기능을 구현하는 쪽이고, DFT는 배치배선을 마무리하는 쪽이다",
                                                  "DV는 메모리/라이브러리 자산을 만들고, DFT는 부팅 소프트웨어를 준비한다",
                                                  "DV와 DFT는 모두 signoff 직전 물리 검증만 담당한다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "DV는 RTL 기능이 사양대로 동작하는지 확인하는 검증 영역이고, DFT는 제조 테스트가 가능하도록 Scan, MBIST, ATPG 같은 구조와 패턴을 준비하는 영역입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "설계 검증",
                                                  "테스트 설계",
                                                  "ATPG"
                                        ]
                              },
                              {
                                        "id": "Q139",
                                        "difficulty": "중간",
                                        "stem": "PI와 PD를 구분할 때 더 적절한 설명은?",
                                        "choices": [
                                                  "PI는 구현 친화 준비, PD는 실제 물리 레이아웃 완성",
                                                  "PI는 시스템 아키텍처와 IP 구성을 정하고, PD는 검증 시나리오를 작성한다",
                                                  "PI는 패키지/보드 인터페이스를 설계하고, PD는 펌웨어 bring-up을 담당한다",
                                                  "둘 다 같은 역할을 가리키는 다른 이름일 뿐이다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "PI는 합성, 저전력, constraint 설정처럼 구현 준비에 가깝고, PD는 실제 배치배선과 물리 구현 완성 단계에 더 가깝습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "물리구현",
                                                  "물리설계",
                                                  "배치배선"
                                        ]
                              },
                              {
                                        "id": "Q140",
                                        "difficulty": "중간",
                                        "stem": "Application Platform 직무와 가장 직접적으로 연결되는 산출물 조합은?",
                                        "choices": [
                                                  "BSP, Driver, Boot/Bring-up",
                                                  "DRC deck, LVS deck",
                                                  "SRAM compiler rule file",
                                                  "Photo mask artwork"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "AP는 플랫폼을 실제로 부팅하고 장치를 제어하게 만드는 소프트웨어/펌웨어 축입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "애플리케이션 플랫폼",
                                                  "BSP",
                                                  "드라이버"
                                        ]
                              },
                              {
                                        "id": "Q141",
                                        "difficulty": "중간",
                                        "stem": "Interface IP Solution에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "DDR/PCIe/USB 같은 인터페이스 블록의 선택·통합·서브시스템 관점",
                                                  "DDR/PCIe/USB PHY와 protocol stack만 개별적으로 개발하는 관점",
                                                  "clock tree와 metal width만 계산하는 물리 구현 관점",
                                                  "secure key 저장과 boot chain만 다루는 보안 관점"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADT 공개 자료에서 Interface IP Solution은 개별 인터페이스 블록 자체뿐 아니라, 이를 시스템에 통합하는 관점까지 함께 다룹니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "인터페이스 IP",
                                                  "DDR",
                                                  "PCIe",
                                                  "USB"
                                        ]
                              },
                              {
                                        "id": "Q142",
                                        "difficulty": "응용",
                                        "stem": "고객이 HBM을 포함한 multi-die 구조와 interposer 패키지까지 함께 검토하고자 할 때 가장 직접적으로 연결되는 공개 키워드는?",
                                        "choices": [
                                                  "Chiplet Solution",
                                                  "Verification Platform",
                                                  "Secure Platform",
                                                  "Foundation IP"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "chiplet/interposer/HBM은 ADT 공개 솔루션 문맥에서 함께 묶여 나옵니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "칩렛",
                                                  "HBM",
                                                  "실리콘 인터포저"
                                        ]
                              },
                              {
                                        "id": "Q143",
                                        "difficulty": "응용",
                                        "stem": "Foundation IP 팀 업무로 가장 적절한 것은?",
                                        "choices": [
                                                  "Standard cell library와 SRAM compiler 같은 기반 자산 준비",
                                                  "Interface IP와 DDR/PCIe PHY를 통합하는 업무",
                                                  "Scan/MBIST 구조와 ATPG를 준비하는 업무",
                                                  "Boot/Driver/BSP를 통합하는 업무"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Foundation IP는 상위 설계팀이 공통으로 사용하는 기반 설계 자산을 담당합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "파운데이션 IP",
                                                  "스탠더드 셀",
                                                  "SRAM 컴파일러"
                                        ]
                              },
                              {
                                        "id": "Q144",
                                        "difficulty": "응용",
                                        "stem": "Verification Platform을 '실리콘 이전의 소프트웨어 bring-up과 대규모 시나리오 검증을 앞당기는 장치'로 설명할 때 가장 적절한 조합은?",
                                        "choices": [
                                                  "FPGA + Emulation",
                                                  "DRC + LVS",
                                                  "SRAM + DRAM",
                                                  "PMOS + NMOS"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADT 공개 자료에서도 Verification Platform은 FPGA/Emulation 축으로 소개됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "검증 플랫폼",
                                                  "FPGA",
                                                  "에뮬레이션"
                                        ]
                              },
                              {
                                        "id": "Q145",
                                        "difficulty": "응용",
                                        "stem": "보안 스택의 흐름을 가장 적절하게 설명한 것은?",
                                        "choices": [
                                                  "Root of Trust와 Secure Enclave를 기반으로 Secure Boot/Trusted Firmware가 신뢰 체인을 만든다",
                                                  "일반 애플리케이션 코드가 먼저 실행된 뒤 뒤늦게 인증해도 동일한 신뢰 체인이 성립한다",
                                                  "SRAM compiler가 OS 실행과 신뢰 체인 시작을 동시에 담당한다",
                                                  "CTS나 STA 같은 물리 구현 검증이 보안 신뢰 체인을 대신한다"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "보안은 신뢰의 시작점(RoT)과 격리 영역, 그리고 boot chain이 연결된 그림으로 보는 것이 좋습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "신뢰의 근원",
                                                  "시큐어 엔클레이브",
                                                  "시큐어 부트",
                                                  "트러스티드 펌웨어"
                                        ]
                              },
                              {
                                        "id": "Q146",
                                        "difficulty": "응용",
                                        "stem": "“Neoverse 기반으로 HPC 성격이 강한 플랫폼”이라는 단서를 보고 가장 잘 매칭되는 것은?",
                                        "choices": [
                                                  "ADP600",
                                                  "ADP500",
                                                  "ADP510",
                                                  "ADP520"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADP600은 Neoverse 기반 HPC 플랫폼으로 공개되어 있습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "ADP600",
                                                  "HPC",
                                                  "네오버스"
                                        ]
                              },
                              {
                                        "id": "Q147",
                                        "difficulty": "응용",
                                        "stem": "고객이 Architecture 정의부터 함께 하고 싶어 하는 프로젝트와, 이미 gate netlist를 갖고 backend만 맡기려는 프로젝트를 구분할 때 각각 가장 가까운 서비스는?",
                                        "choices": [
                                                  "Spec-to-GDSII / Netlist-to-GDSII",
                                                  "RTL-to-GDSII / RTL-to-GDSII",
                                                  "Spec-to-GDSII / RTL-to-GDSII",
                                                  "RTL-to-GDSII / Netlist-to-GDSII"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "입력 추상도와 요구 범위에 따라 서비스 레벨이 갈립니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "스펙-투-GDSII",
                                                  "넷리스트-투-GDSII",
                                                  "설계 서비스"
                                        ]
                              },
                              {
                                        "id": "Q148",
                                        "difficulty": "응용",
                                        "stem": "Memory Compiler 직무를 가장 자연스럽게 설명한 것은?",
                                        "choices": [
                                                  "옵션형 SRAM macro와 주변회로 구조를 설계/생성하는 역할",
                                                  "PCIe/USB 같은 인터페이스 컨트롤러의 펌웨어를 포팅하는 역할",
                                                  "DRC/LVS signoff 룰과 deck을 유지보수하는 역할",
                                                  "패키지 라우팅과 substrate 배선을 최적화하는 역할"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Memory compiler는 메모리 매크로 생성과 각종 옵션 설계 업무와 직접 연결됩니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "메모리 컴파일러",
                                                  "SRAM 컴파일러",
                                                  "메모리 매크로"
                                        ]
                              },
                              {
                                        "id": "Q149",
                                        "difficulty": "응용",
                                        "stem": "SoC Design Platform 직무 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "고객 요구에 맞게 CPU, NoC, subsystem, interface를 조합해 재사용 가능한 플랫폼 뼈대를 설계하는 역할",
                                                  "Scan/ATPG 구조를 넣어 테스트 가능성을 높이는 역할",
                                                  "Floorplan과 route closure를 수행하는 역할",
                                                  "Boot/Driver/BSP를 통합하는 역할"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "SoC Design Platform은 플랫폼 재사용성과 통합 구조 설계가 핵심입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "소크 디자인 플랫폼",
                                                  "시스템온칩",
                                                  "NoC",
                                                  "서브시스템"
                                        ]
                              },
                              {
                                        "id": "Q150",
                                        "difficulty": "응용",
                                        "stem": "프로젝트 초반엔 플랫폼 구조 정의와 IP 통합 이슈가 크고, 후반엔 타이밍/배치/사인오프 이슈가 커진다. 이 흐름을 가장 잘 반영한 직무 조합은?",
                                        "choices": [
                                                  "초반 DP/PI 성격, 후반 PD 성격",
                                                  "초반 DV 성격, 후반 AP 성격",
                                                  "초반 DFT 성격, 후반 Package 성격",
                                                  "초반 AP 성격, 후반 AP 성격"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "프로젝트 초반은 구조와 구현 준비, 후반은 실제 physical closure 중심으로 무게가 이동합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "디자인 플랫폼",
                                                  "물리구현",
                                                  "물리설계",
                                                  "사인오프"
                                        ]
                              },
                              {
                                        "id": "Q152",
                                        "difficulty": "기초",
                                        "stem": "SoC 내부에서 많은 IP 블록 간 병목을 줄이기 위한 온칩 네트워크 구조는?",
                                        "choices": [
                                                  "Shared Bus",
                                                  "NoC",
                                                  "Crossbar",
                                                  "Ring Interconnect"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "NoC는 복잡한 칩 내부 통신을 효율화하는 구조입니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "NoC",
                                                  "시스템온칩",
                                                  "온칩 네트워크"
                                        ]
                              },
                              {
                                        "id": "Q153",
                                        "difficulty": "중간",
                                        "stem": "팹리스 설계를 파운드리 공정에 맞게 구현하는 디자인하우스 비즈니스에 해당하는 것은?",
                                        "choices": [
                                                  "IDM",
                                                  "DSP / Design House",
                                                  "Fabless",
                                                  "OSAT"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "ADT는 디자인 솔루션 파트너(DSP) 성격의 디자인하우스입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "디자인하우스",
                                                  "DSP",
                                                  "설계 서비스"
                                        ]
                              },
                              {
                                        "id": "Q155",
                                        "difficulty": "기초",
                                        "stem": "OS 없이 하드웨어를 직접 제어하는 최하단 펌웨어는?",
                                        "choices": [
                                                  "Bootloader",
                                                  "Bare-Metal Firmware",
                                                  "RTOS Firmware",
                                                  "Kernel Driver"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "Bare-Metal Firmware는 OS 없이 직접 하드웨어를 제어합니다.",
                                        "sourceType": "fundamental",
                                        "keywords": [
                                                  "베어메탈 펌웨어",
                                                  "부트",
                                                  "펌웨어"
                                        ]
                              },
                              {
                                        "id": "Q157",
                                        "difficulty": "중간",
                                        "stem": "Standard Cell Library와 SRAM Compiler의 차이 설명으로 옳은 것은?",
                                        "choices": [
                                                  "둘 다 합성용 논리 셀을 모아 둔 같은 종류의 라이브러리다.",
                                                  "둘 다 플랫폼 소프트웨어 드라이버 자산을 뜻한다.",
                                                  "전자는 기본 논리 셀 집합, 후자는 SRAM 매크로 생성 솔루션이다.",
                                                  "전자는 패키지 인터페이스 자산, 후자는 PCB 설계 자산이다."
                                        ],
                                        "answerIndex": 2,
                                        "explanation": "Standard Cell은 논리 셀, SRAM Compiler는 메모리 매크로 생성 쪽입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "스탠더드 셀 라이브러리",
                                                  "SRAM 컴파일러",
                                                  "파운데이션 IP"
                                        ]
                              },
                              {
                                        "id": "Q160",
                                        "difficulty": "기초",
                                        "stem": "Secure Enclave에 대한 설명으로 가장 적절한 것은?",
                                        "choices": [
                                                  "민감한 키와 보안 처리를 보호하는 격리 영역",
                                                  "전원 차단 시 상태를 유지하는 retention register 영역",
                                                  "테스트 패턴 접근을 위한 IJTAG 제어 영역",
                                                  "물리 검증용 DRC/LVS 룰을 저장하는 데이터 영역"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Secure Enclave는 Root of Trust, Secure Boot와 함께 보안 스택을 구성하는 격리 영역입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "시큐어 엔클레이브",
                                                  "신뢰의 근원",
                                                  "보안 스택"
                                        ]
                              },
                              {
                                        "id": "Q176",
                                        "difficulty": "기초",
                                        "stem": "ADT 공개 Design Service에서 RTL-to-GDSII는 무엇을 의미하는가?",
                                        "choices": [
                                                  "RTL을 받아 합성, DFT, 물리구현, Signoff를 진행하는 범위",
                                                  "게이트 넷리스트를 받아 Floorplan 이후 물리 구현만 수행하는 범위",
                                                  "FPGA/Emulation 기반 검증 환경만 제공하는 범위",
                                                  "패키지 substrate와 board integration만 담당하는 범위"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADT 공개 자료의 RTL-to-GDSII는 RTL 입력 이후 합성, DFT, Physical Design, Signoff까지 이어지는 전 구간 서비스를 뜻합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "ADT",
                                                  "RTL-to-GDSII",
                                                  "Design Service"
                                        ]
                              },
                              {
                                        "id": "Q177",
                                        "difficulty": "기초",
                                        "stem": "ADP600과 가장 잘 매칭되는 설명은?",
                                        "choices": [
                                                  "A53 기반 Edge-AI",
                                                  "Neoverse 기반 HPC",
                                                  "MBIST 전용 컨트롤러",
                                                  "LVS 검사용 소프트웨어"
                                        ],
                                        "answerIndex": 1,
                                        "explanation": "공개 자료 기준으로 ADP600은 Neoverse 기반의 HPC 플랫폼 축으로 정리되는 라인업입니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "ADP600",
                                                  "Neoverse",
                                                  "HPC"
                                        ]
                              },
                              {
                                        "id": "Q178",
                                        "difficulty": "기초",
                                        "stem": "ADT 공개 Verification Platform과 가장 가까운 키워드는?",
                                        "choices": [
                                                  "FPGA / Emulation",
                                                  "Gate-level Simulation / STA",
                                                  "DRC / LVS",
                                                  "Bootloader / BSP"
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "ADT의 공개 Verification Platform 설명은 FPGA prototyping이나 emulation 같은 검증 가속 플랫폼과 가장 가깝습니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "Verification Platform",
                                                  "FPGA",
                                                  "Emulation"
                                        ]
                              },
                              {
                                        "id": "Q179",
                                        "difficulty": "중간",
                                        "stem": "AP(Application Platform)와 Security Stack을 함께 설명한 것으로 맞는 것은?",
                                        "choices": [
                                                  "Secure Boot, Trusted Firmware, BSP/Driver는 AP 문맥과 연결된다.",
                                                  "Secure Boot는 제조용 DRC 검증 절차의 일부다.",
                                                  "Trusted Firmware는 메모리 컴파일러가 생성하는 하드 매크로의 한 종류다.",
                                                  "BSP와 Driver는 floorplan과 routing이 끝난 뒤 물리 설계 조직이 작성한다."
                                        ],
                                        "answerIndex": 0,
                                        "explanation": "Application Platform 맥락에서는 Secure Boot와 Trusted Firmware, BSP/Driver 같은 소프트웨어 스택이 함께 묶여 시스템 기동과 보안 체계를 구성합니다.",
                                        "sourceType": "official",
                                        "keywords": [
                                                  "Application Platform",
                                                  "Security Stack",
                                                  "Trusted Firmware"
                                        ]
                              }
                    ]
          }
};

        const practiceTopicMeta = Object.fromEntries(
            Object.entries(practiceQuestionCatalog).map(([topic, meta]) => [
                topic,
                { label: meta.label, chipClass: practiceTopicChipClassMap[topic] }
            ])
        );

        const practiceDifficultyMeta = {
            '기초': { code: 'Level 1', chipClass: 'practice-chip-level-기초', summary: '정의, 순서, 기본 비교형으로 빠르게 점수 확보하기 좋은 레벨입니다.' },
            '중간': { code: 'Level 2', chipClass: 'practice-chip-level-중간', summary: '개념을 이어서 비교하거나 다음 단계를 추론하는 연결형 문제군입니다.' },
            '응용': { code: 'Level 3', chipClass: 'practice-chip-level-응용', summary: '직무 위치나 역할 차이를 묻는 고난도 추론형 문제군입니다.' }
        };

        const practiceSourceMeta = {
            fundamental: { label: '기본 개념', chipClass: 'practice-chip-source-fundamental' },
            official: { label: '공개 자료', chipClass: 'practice-chip-source-official' }
        };

        const practiceDifficultyOrder = ['기초', '중간', '응용'];
        const practiceFilterState = { search: '', topic: 'all', difficulty: 'all', keyword: 'all' };

        function getPracticeAnswerStreak(answerHistory, answerIndex) {
            let streak = 0;
            for (let index = answerHistory.length - 1; index >= 0; index -= 1) {
                if (answerHistory[index] !== answerIndex) break;
                streak += 1;
            }
            return streak;
        }

        function isPracticeRankBetter(candidateRank, bestRank) {
            if (!bestRank) return true;
            for (let index = 0; index < candidateRank.length; index += 1) {
                if (candidateRank[index] === bestRank[index]) continue;
                return candidateRank[index] > bestRank[index];
            }
            return false;
        }

        function movePracticeCorrectChoice(question, targetAnswerIndex) {
            if (question.answerIndex === targetAnswerIndex) return;
            const reorderedChoices = [...question.choices];
            const [correctChoice] = reorderedChoices.splice(question.answerIndex, 1);
            reorderedChoices.splice(targetAnswerIndex, 0, correctChoice);
            question.choices = reorderedChoices;
            question.answerIndex = targetAnswerIndex;
        }

        function rebalancePracticeQuestionCatalog(catalog) {
            const difficultyGroups = practiceDifficultyOrder.map((level) =>
                Object.values(catalog).flatMap((meta) => meta.questions.filter((question) => question.difficulty === level))
            );
            const optionCount = Math.max(...difficultyGroups.flatMap((group) => group.map((question) => question.choices.length)));
            const totalQuestionCount = difficultyGroups.reduce((sum, group) => sum + group.length, 0);
            const baseTargetCount = Math.floor(totalQuestionCount / optionCount);
            const targetRemainder = totalQuestionCount % optionCount;
            const remainingTargets = Array.from({ length: optionCount }, (_, answerIndex) => baseTargetCount + (answerIndex < targetRemainder ? 1 : 0));

            difficultyGroups.forEach((group, groupIndex) => {
                const baseCount = Math.floor(group.length / optionCount);
                const leftoverCount = group.length % optionCount;
                const targetCounts = new Array(optionCount).fill(baseCount);

                targetCounts.forEach((count, answerIndex) => {
                    remainingTargets[answerIndex] -= count;
                });

                for (let extraIndex = 0; extraIndex < leftoverCount; extraIndex += 1) {
                    let chosenAnswerIndex = 0;
                    let chosenRank = null;
                    for (let offset = 0; offset < optionCount; offset += 1) {
                        const answerIndex = (groupIndex + extraIndex + offset) % optionCount;
                        const candidateRank = [remainingTargets[answerIndex], -targetCounts[answerIndex], -offset, -answerIndex];
                        if (isPracticeRankBetter(candidateRank, chosenRank)) {
                            chosenAnswerIndex = answerIndex;
                            chosenRank = candidateRank;
                        }
                    }
                    targetCounts[chosenAnswerIndex] += 1;
                    remainingTargets[chosenAnswerIndex] -= 1;
                }

                const balancedAnswerSequence = [];
                const remainingCounts = [...targetCounts];

                while (balancedAnswerSequence.length < group.length) {
                    let chosenAnswerIndex = -1;
                    let chosenRank = null;
                    const lastAnswerIndex = balancedAnswerSequence.length ? balancedAnswerSequence[balancedAnswerSequence.length - 1] : null;

                    remainingCounts.forEach((remainingCount, answerIndex) => {
                        if (!remainingCount) return;
                        const streak = getPracticeAnswerStreak(balancedAnswerSequence, answerIndex);
                        if (streak >= 4) return;
                        const candidateRank = [remainingCount, lastAnswerIndex === answerIndex ? 0 : 1, -streak, -answerIndex];
                        if (isPracticeRankBetter(candidateRank, chosenRank)) {
                            chosenAnswerIndex = answerIndex;
                            chosenRank = candidateRank;
                        }
                    });

                    if (chosenAnswerIndex === -1) {
                        remainingCounts.forEach((remainingCount, answerIndex) => {
                            if (!remainingCount) return;
                            const candidateRank = [remainingCount, -answerIndex];
                            if (isPracticeRankBetter(candidateRank, chosenRank)) {
                                chosenAnswerIndex = answerIndex;
                                chosenRank = candidateRank;
                            }
                        });
                    }

                    balancedAnswerSequence.push(chosenAnswerIndex);
                    remainingCounts[chosenAnswerIndex] -= 1;
                }

                group.forEach((question, index) => {
                    movePracticeCorrectChoice(question, balancedAnswerSequence[index]);
                });
            });
        }

        function arrangePracticeQuestionsForDisplay(items, answerHistory = []) {
            const arranged = [];
            const remaining = items.map((item, originalIndex) => ({ item, originalIndex }));
            const localAnswerHistory = [...answerHistory];
            let lastTopic = null;

            while (remaining.length) {
                let chosenIndex = 0;
                let chosenRank = null;

                remaining.forEach((entry, remainingIndex) => {
                    const streak = getPracticeAnswerStreak(localAnswerHistory, entry.item.answerIndex);
                    if (streak >= 4) return;
                    const candidateRank = [-streak, lastTopic === entry.item.topic ? 0 : 1, -entry.originalIndex];
                    if (isPracticeRankBetter(candidateRank, chosenRank)) {
                        chosenIndex = remainingIndex;
                        chosenRank = candidateRank;
                    }
                });

                if (!chosenRank) {
                    remaining.forEach((entry, remainingIndex) => {
                        const candidateRank = [-entry.originalIndex];
                        if (isPracticeRankBetter(candidateRank, chosenRank)) {
                            chosenIndex = remainingIndex;
                            chosenRank = candidateRank;
                        }
                    });
                }

                const [nextEntry] = remaining.splice(chosenIndex, 1);
                arranged.push(nextEntry.item);
                localAnswerHistory.push(nextEntry.item.answerIndex);
                lastTopic = nextEntry.item.topic;
            }

            answerHistory.push(...arranged.map((item) => item.answerIndex));
            return arranged;
        }

        function buildPracticeQuestionBank(catalog) {
            const flattened = Object.entries(catalog).flatMap(([topic, meta]) =>
                meta.questions.map((question) => ({
                    ...question,
                    topic,
                    topicLabel: meta.label
                }))
            );
            const answerHistory = [];

            return practiceDifficultyOrder.flatMap((level) => {
                const difficultyQuestions = flattened.filter((question) => question.difficulty === level);
                return arrangePracticeQuestionsForDisplay(difficultyQuestions, answerHistory);
            });
        }

        rebalancePracticeQuestionCatalog(practiceQuestionCatalog);
        const practiceQuestionBank = buildPracticeQuestionBank(practiceQuestionCatalog);

        window.practiceQuestionCatalog = practiceQuestionCatalog;
        window.practiceQuestionBank = practiceQuestionBank;
        window.getPracticeQuestionById = (questionId) => practiceQuestionBank.find((question) => question.id === questionId);
        window.getPracticeQuestionsByTopic = (topic) => practiceQuestionBank.filter((question) => question.topic === topic);

        function updatePracticeQuestionBankHeadline(totalCount) {
            const totalDisplay = document.getElementById('practice-total-count-display');
            if (totalDisplay) totalDisplay.textContent = `${totalCount}문항`;
        }

        // --- Practice Question Bank Logic ---
        function getPracticeKeywords() {
            return [...new Set(practiceQuestionBank.flatMap((item) => item.keywords))].sort((a, b) => a.localeCompare(b, 'ko'));
        }

        function getPracticeBaseQuestions() {
            const query = practiceFilterState.search.trim().toLowerCase();
            return practiceQuestionBank.filter((item) => {
                const searchable = [item.id, item.topicLabel, item.difficulty, item.stem, item.explanation, ...item.choices, ...item.keywords].join(' ').toLowerCase();
                const matchesQuery = !query || searchable.includes(query);
                const matchesTopic = practiceFilterState.topic === 'all' || item.topic === practiceFilterState.topic;
                const matchesKeyword = practiceFilterState.keyword === 'all' || item.keywords.includes(practiceFilterState.keyword);
                return matchesQuery && matchesTopic && matchesKeyword;
            });
        }

        function getFilteredPracticeQuestions() {
            const base = getPracticeBaseQuestions();
            return base.filter((item) => practiceFilterState.difficulty === 'all' || item.difficulty === practiceFilterState.difficulty);
        }

        function renderPracticeSourceChip(sourceType) {
            const meta = practiceSourceMeta[sourceType] || practiceSourceMeta.fundamental;
            return `<span class="practice-chip ${meta.chipClass}">${meta.label}</span>`;
        }

        function renderPracticeQuestionCard(item) {
            const topicMeta = practiceTopicMeta[item.topic];
            const difficultyMeta = practiceDifficultyMeta[item.difficulty];
            return `
                <article class="practice-question-card" id="practice-card-${item.id}">
                    <div class="practice-meta-row">
                        <span class="practice-chip practice-chip-code">${item.id}</span>
                        <span class="practice-chip ${topicMeta.chipClass}">${topicMeta.label}</span>
                        <span class="practice-chip ${difficultyMeta.chipClass}">${item.difficulty}</span>
                        ${renderPracticeSourceChip(item.sourceType)}
                    </div>
                    <div class="practice-keyword-row">
                        ${item.keywords.map((keyword) => `<span class="practice-keyword">${keyword}</span>`).join('')}
                    </div>
                    <p class="practice-question-stem">${item.stem}</p>
                    <div class="practice-choice-stack">
                        ${item.choices.map((choice, index) => `
                            <button type="button" onclick="checkPracticeQuestion('${item.id}', ${index})" class="quiz-opt" id="practice-btn-${item.id}-${index}">
                                <span class="opt-num font-mono">${index + 1}</span>
                                <span>${choice}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="practice-answer-actions">
                        <div class="practice-answer-button-row">
                            <button type="button" class="practice-answer-reset" onclick="resetPracticeQuestion('${item.id}')">다시 풀기</button>
                            <button type="button" class="practice-answer-toggle" id="practice-toggle-${item.id}" onclick="togglePracticeAnswer('${item.id}')">정답 보기</button>
                        </div>
                        <span class="practice-answer-note">오답 선택 시 바로 핵심 해설을 확인할 수 있습니다.</span>
                    </div>
                    <div id="practice-answer-${item.id}" class="practice-answer-panel hidden">
                        <strong>정답: ${item.answerIndex + 1}번</strong>
                        <p class="mt-2">${item.explanation}</p>
                    </div>
                </article>
            `;
        }

        function renderPracticeDifficultyOverview(baseQuestions) {
            const counts = practiceDifficultyOrder.reduce((acc, level) => {
                acc[level] = baseQuestions.filter((item) => item.difficulty === level).length;
                return acc;
            }, {});
            const basic = document.getElementById('practice-summary-basic');
            const mid = document.getElementById('practice-summary-mid');
            const advanced = document.getElementById('practice-summary-advanced');
            if (basic) basic.textContent = `${counts['기초']}문항`;
            if (mid) mid.textContent = `${counts['중간']}문항`;
            if (advanced) advanced.textContent = `${counts['응용']}문항`;
        }

        function renderPracticeActiveFilters() {
            const container = document.getElementById('practice-active-filters');
            const tags = [];
            if (practiceFilterState.search) tags.push(`검색: ${practiceFilterState.search}`);
            if (practiceFilterState.topic !== 'all') tags.push(`카테고리: ${practiceTopicMeta[practiceFilterState.topic].label}`);
            if (practiceFilterState.difficulty !== 'all') tags.push(`난이도: ${practiceFilterState.difficulty}`);
            if (practiceFilterState.keyword !== 'all') tags.push(`키워드: ${practiceFilterState.keyword}`);
            container.innerHTML = tags.length ? tags.map((tag) => `<span class="practice-active-tag">${tag}</span>`).join('') : '<span class="practice-active-tag">전체 보기</span>';
        }

        function renderPracticeGroups() {
            const filtered = getFilteredPracticeQuestions();
            const base = getPracticeBaseQuestions();
            const groups = document.getElementById('practice-question-groups');
            const count = document.getElementById('practice-count');
            const status = document.getElementById('practice-bank-status');

            renderPracticeDifficultyOverview(base);
            renderPracticeActiveFilters();
            updatePracticeQuestionBankHeadline(practiceQuestionBank.length);

            count.textContent = `${filtered.length}문항 표시 중 / 전체 ${practiceQuestionBank.length}문항`;
            status.textContent = filtered.length === practiceQuestionBank.length ? `${practiceQuestionBank.length}문항 로드 완료` : `필터 결과 ${filtered.length}문항`;

            if (!filtered.length) {
                groups.innerHTML = `
                    <div class="practice-empty">
                        조건에 맞는 문제가 없습니다. 검색어를 줄이거나 키워드/난이도를 초기화해 보세요.
                    </div>
                `;
                return;
            }

            groups.innerHTML = practiceDifficultyOrder.map((level) => {
                const meta = practiceDifficultyMeta[level];
                const items = filtered.filter((item) => item.difficulty === level);
                if (!items.length) return '';
                return `
                    <section class="practice-group">
                        <div class="practice-group-head">
                            <div>
                                <span class="practice-group-kicker">${meta.code}</span>
                                <h3 class="practice-group-title">${level}</h3>
                                <p class="practice-group-copy">${meta.summary}</p>
                            </div>
                            <div class="practice-group-count">${items.length}문항</div>
                        </div>
                        <div class="practice-question-grid">
                            ${items.map(renderPracticeQuestionCard).join('')}
                        </div>
                    </section>
                `;
            }).join('');
        }

        window.togglePracticeDifficulty = function(level) {
            practiceFilterState.difficulty = practiceFilterState.difficulty === level ? 'all' : level;
            document.getElementById('practice-difficulty-filter').value = practiceFilterState.difficulty;
            renderPracticeGroups();
        };

        window.togglePracticeAnswer = function(questionId) {
            const panel = document.getElementById(`practice-answer-${questionId}`);
            const button = document.getElementById(`practice-toggle-${questionId}`);
            if (!panel || !button) return;
            const willOpen = panel.classList.contains('hidden');
            panel.classList.toggle('hidden');
            button.textContent = willOpen ? '정답 숨기기' : '정답 보기';
        };

        window.resetPracticeQuestion = function(questionId) {
            const item = practiceQuestionBank.find((question) => question.id === questionId);
            if (!item) return;

            item.choices.forEach((_, idx) => {
                const button = document.getElementById(`practice-btn-${questionId}-${idx}`);
                if (!button) return;
                button.disabled = false;
                button.classList.remove('correct', 'wrong');
                button.style.opacity = '';
                button.style.background = '';
                button.style.color = '';
                button.style.borderColor = '';
            });

            const panel = document.getElementById(`practice-answer-${questionId}`);
            const toggle = document.getElementById(`practice-toggle-${questionId}`);
            if (panel) panel.classList.add('hidden');
            if (toggle) toggle.textContent = '정답 보기';
        };

        window.checkPracticeQuestion = function(questionId, selectedIdx) {
            const item = practiceQuestionBank.find((question) => question.id === questionId);
            if (!item) return;

            item.choices.forEach((_, idx) => {
                const btn = document.getElementById(`practice-btn-${questionId}-${idx}`);
                if (!btn) return;
                btn.disabled = true;
                if (idx === item.answerIndex) {
                    btn.classList.add('correct');
                } else if (idx === selectedIdx) {
                    btn.classList.add('wrong');
                } else {
                    btn.style.opacity = '0.55';
                    btn.style.background = '#f8fafc';
                }
            });

            const panel = document.getElementById(`practice-answer-${questionId}`);
            const toggle = document.getElementById(`practice-toggle-${questionId}`);
            panel.classList.remove('hidden');
            toggle.textContent = '정답 숨기기';
        };

        function initPracticeQuestionBank() {
            const topicFilter = document.getElementById('practice-topic-filter');
            const difficultyFilter = document.getElementById('practice-difficulty-filter');
            const keywordFilter = document.getElementById('practice-keyword-filter');
            const search = document.getElementById('practice-search');
            const reset = document.getElementById('practice-reset');

            topicFilter.innerHTML = `<option value="all">전체 카테고리</option>${Object.entries(practiceTopicMeta).map(([value, meta]) => `<option value="${value}">${meta.label}</option>`).join('')}`;
            difficultyFilter.innerHTML = `<option value="all">전체 난이도</option>${practiceDifficultyOrder.map((level) => `<option value="${level}">${level}</option>`).join('')}`;
            keywordFilter.innerHTML = `<option value="all">전체 키워드</option>${getPracticeKeywords().map((keyword) => `<option value="${keyword}">${keyword}</option>`).join('')}`;

            search.addEventListener('input', (event) => {
                practiceFilterState.search = event.target.value;
                renderPracticeGroups();
            });
            topicFilter.addEventListener('change', (event) => {
                practiceFilterState.topic = event.target.value;
                renderPracticeGroups();
            });
            difficultyFilter.addEventListener('change', (event) => {
                practiceFilterState.difficulty = event.target.value;
                renderPracticeGroups();
            });
            keywordFilter.addEventListener('change', (event) => {
                practiceFilterState.keyword = event.target.value;
                renderPracticeGroups();
            });
            reset.addEventListener('click', () => {
                practiceFilterState.search = '';
                practiceFilterState.topic = 'all';
                practiceFilterState.difficulty = 'all';
                practiceFilterState.keyword = 'all';
                search.value = '';
                topicFilter.value = 'all';
                difficultyFilter.value = 'all';
                keywordFilter.value = 'all';
                renderPracticeGroups();
            });

            renderPracticeGroups();
        }

        // --- Mock Exam Logic ---
        const MOCK_EXAM_QUESTION_COUNT = 20;
        const MOCK_EXAM_DURATION_SECONDS = 1800;
        const MOCK_EXAM_SCORE_PER_QUESTION = 5;

        function shufflePracticeQuestions(items) {
            const shuffled = [...items];
            for (let index = shuffled.length - 1; index > 0; index -= 1) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
            }
            return shuffled;
        }

        function getRandomMockQuestions(questionCount = MOCK_EXAM_QUESTION_COUNT) {
            return shufflePracticeQuestions(practiceQuestionBank).slice(0, Math.min(questionCount, practiceQuestionBank.length));
        }

        window.getRandomMockQuestions = getRandomMockQuestions;

        let mockTimer;
        let mockTimeLeft = MOCK_EXAM_DURATION_SECONDS;
        let mockUserAnswers = [];
        let currentMockQuestions = [];
        window.currentMockQuestions = currentMockQuestions;

        function updateMockTimerDisplay() {
            const display = document.getElementById('timer-display');
            if (!display) return;
            const minutes = Math.floor(mockTimeLeft / 60);
            const seconds = mockTimeLeft % 60;
            display.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        function renderMockExamQuestions() {
            const container = document.getElementById('mock-exam-container');
            if (!container) return;

            container.dataset.mockQuestionIds = currentMockQuestions.map((question) => question.id).join(',');
            container.innerHTML = currentMockQuestions.map((question, index) => `
                <div class="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm" id="mock-q-${index}" data-bank-question-id="${question.id}">
                    <div class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Question ${String(index + 1).padStart(2, '0')}</div>
                    <p class="font-extrabold text-lg text-gray-900 mb-6 leading-relaxed">${question.stem}</p>
                    <div class="space-y-4">
                        ${question.choices.map((choice, choiceIndex) => `
                            <label class="quiz-opt" id="mock-lbl-${index}-${choiceIndex}">
                                <input type="radio" name="mock-${index}" value="${choiceIndex}" onchange="selectMockAns(${index}, ${choiceIndex})" class="hidden">
                                <span class="opt-num font-mono">${choiceIndex + 1}</span>
                                <span class="text-[0.95rem] font-medium">${choice}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        window.startMockExam = function() {
            currentMockQuestions = getRandomMockQuestions();
            window.currentMockQuestions = currentMockQuestions;
            mockUserAnswers = new Array(currentMockQuestions.length).fill(null);
            mockTimeLeft = MOCK_EXAM_DURATION_SECONDS;
            clearInterval(mockTimer);
            updateMockTimerDisplay();

            document.getElementById('mock-start-screen').classList.add('hidden');
            document.getElementById('mock-exam-container').classList.remove('hidden');
            document.getElementById('mock-submit-btn').classList.remove('hidden');
            document.getElementById('mock-result-screen').classList.add('hidden');
            document.getElementById('score-display').innerText = '';

            renderMockExamQuestions();

            mockTimer = setInterval(() => {
                mockTimeLeft -= 1;
                updateMockTimerDisplay();

                if (mockTimeLeft <= 0) {
                    clearInterval(mockTimer);
                    submitMockExam(true);
                    alert('시험 시간이 종료되었습니다. 자동 제출됩니다.');
                }
            }, 1000);
        };

        window.selectMockAns = function(qIdx, selectedIdx) {
            mockUserAnswers[qIdx] = selectedIdx;
            currentMockQuestions[qIdx].choices.forEach((_, idx) => {
                const lbl = document.getElementById(`mock-lbl-${qIdx}-${idx}`);
                if (!lbl) return;
                lbl.style.borderColor = 'var(--border-color)';
                lbl.style.background = '#fff';
                lbl.querySelector('.opt-num').style.background = '#f2f4f6';
                lbl.querySelector('.opt-num').style.color = 'var(--text-tertiary)';
            });
            const selectedLbl = document.getElementById(`mock-lbl-${qIdx}-${selectedIdx}`);
            if (!selectedLbl) return;
            selectedLbl.style.borderColor = 'var(--color-blue)';
            selectedLbl.style.background = 'var(--color-blue-light)';
            selectedLbl.querySelector('.opt-num').style.background = 'var(--color-blue)';
            selectedLbl.querySelector('.opt-num').style.color = '#fff';
        };

        window.submitMockExam = function(forceSubmit = false) {
            if (!currentMockQuestions.length) return;
            if (!forceSubmit && mockUserAnswers.includes(null)) {
                if (!confirm('아직 풀지 않은 문제가 있습니다. 그래도 제출하시겠습니까?')) return;
            }

            clearInterval(mockTimer);
            document.getElementById('mock-submit-btn').classList.add('hidden');
            document.getElementById('mock-result-screen').classList.remove('hidden');

            let score = 0;
            currentMockQuestions.forEach((question, index) => {
                const userAns = mockUserAnswers[index];
                if (userAns === question.answerIndex) score += MOCK_EXAM_SCORE_PER_QUESTION;

                const qBox = document.getElementById(`mock-q-${index}`);
                if (!qBox) return;

                if (userAns === question.answerIndex) {
                    qBox.innerHTML += `<div class="mt-6 text-green-700 font-bold text-base bg-green-50 border border-green-200 p-4 rounded-xl flex items-center"><span class="text-2xl mr-3">✅</span> 정답입니다. (+${MOCK_EXAM_SCORE_PER_QUESTION}점)</div>`;
                } else {
                    qBox.innerHTML += `<div class="mt-6 text-red-700 font-bold text-base bg-red-50 border border-red-200 p-4 rounded-xl flex items-center"><span class="text-2xl mr-3">❌</span> 오답입니다. (정답: ${question.answerIndex + 1}번)</div>`;
                    if (userAns !== null) {
                        document.getElementById(`mock-lbl-${index}-${userAns}`)?.classList.add('wrong');
                    }
                }

                const correctLbl = document.getElementById(`mock-lbl-${index}-${question.answerIndex}`);
                if (correctLbl) {
                    correctLbl.style = '';
                    correctLbl.classList.add('correct');
                }

                qBox.querySelectorAll('input').forEach((input) => input.disabled = true);
                qBox.querySelectorAll('label').forEach((label) => label.style.pointerEvents = 'none');
            });

            document.getElementById('score-display').innerText = `${score} 점`;
            document.getElementById('mock-result-screen').scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        function initFpgaLogicInteractive() {

            const root = document.getElementById('fpga-logic-lab');
            if (!root) return;

            const buttons = root.querySelectorAll('[data-fpga-mode]');
            const setMode = (mode) => {
                root.dataset.mode = mode;
                buttons.forEach((button) => {
                    button.classList.toggle('is-active', button.dataset.fpgaMode === mode);
                });
            };

            buttons.forEach((button) => {
                button.addEventListener('click', () => setMode(button.dataset.fpgaMode));
            });

            setMode(root.dataset.mode || 'comb');
        }

        function initJobRoleFlowInteractive() {
            const root = document.getElementById('adt-role-flow');
            if (!root) return;

            const buttons = root.querySelectorAll('[data-role-flow-filter]');
            const items = root.querySelectorAll('[data-role-flow-item], [data-role-flow-target], [data-role-flow-support]');

            const setRole = (role) => {
                root.dataset.activeRole = role;
                root.classList.toggle('is-filtered', role !== 'all');

                buttons.forEach((button) => {
                    button.classList.toggle('is-active', button.dataset.roleFlowFilter === role);
                });

                items.forEach((item) => {
                    const rawTargets = item.dataset.jobs || item.dataset.roleFlowTarget || '';
                    const jobs = rawTargets.split(/\s+/).filter(Boolean);
                    const isMatch = role === 'all' ? true : jobs.includes(role);
                    item.classList.toggle('is-match', isMatch);
                });
            };

            buttons.forEach((button) => {
                button.addEventListener('click', () => setRole(button.dataset.roleFlowFilter));
            });

            setRole(root.dataset.activeRole || 'all');
        }

        function createMosBoxMesh(THREE, width, height, depth, options = {}) {
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({
                color: options.color ?? 0xffffff,
                emissive: options.emissive ?? 0x000000,
                emissiveIntensity: options.emissiveIntensity ?? 0,
                transparent: options.transparent ?? false,
                opacity: options.opacity ?? 1,
                depthWrite: options.depthWrite ?? true,
                side: options.side ?? THREE.FrontSide,
                metalness: options.metalness ?? 0.08,
                roughness: options.roughness ?? 0.42
            });
            return new THREE.Mesh(geometry, material);
        }

        function createMosSphereMesh(THREE, radius, options = {}) {
            const geometry = new THREE.SphereGeometry(radius, 18, 18);
            const material = new THREE.MeshStandardMaterial({
                color: options.color ?? 0xffffff,
                emissive: options.emissive ?? options.color ?? 0xffffff,
                emissiveIntensity: options.emissiveIntensity ?? 0.45,
                transparent: true,
                opacity: options.opacity ?? 0.9,
                roughness: 0.28,
                metalness: 0.02
            });
            return new THREE.Mesh(geometry, material);
        }

        function createMosWireBox(THREE, width, height, depth, options = {}) {
            const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
            const material = new THREE.LineBasicMaterial({
                color: options.color ?? 0x94a3b8,
                transparent: true,
                opacity: options.opacity ?? 0.55
            });
            return new THREE.LineSegments(geometry, material);
        }

        function buildPlanarTransistorModel(THREE) {
            const root = new THREE.Group();

            const substrate = createMosBoxMesh(THREE, 8.8, 2.2, 5.0, {
                color: 0x6b7280,
                transparent: true,
                opacity: 0.18,
                depthWrite: false,
                side: THREE.DoubleSide,
                roughness: 0.86
            });
            substrate.position.set(0, -1.1, 0);
            root.add(substrate);

            const substrateFrame = createMosWireBox(THREE, 8.8, 2.2, 5.0, { color: 0x64748b, opacity: 0.42 });
            substrateFrame.position.copy(substrate.position);
            root.add(substrateFrame);

            const substrateFloor = createMosBoxMesh(THREE, 8.6, 0.16, 4.8, {
                color: 0x4b5563,
                transparent: true,
                opacity: 0.34,
                depthWrite: false,
                roughness: 0.92
            });
            substrateFloor.position.set(0, -2.14, 0);
            root.add(substrateFloor);

            const oxide = createMosBoxMesh(THREE, 8.4, 0.44, 4.1, {
                color: 0xcfe8f6,
                emissive: 0xe0f2fe,
                emissiveIntensity: 0.06,
                transparent: true,
                opacity: 0.88,
                roughness: 0.24
            });
            oxide.position.set(0, 0.22, 0);
            root.add(oxide);

            const oxideFrame = createMosWireBox(THREE, 8.4, 0.44, 4.1, { color: 0x93c5fd, opacity: 0.42 });
            oxideFrame.position.copy(oxide.position);
            root.add(oxideFrame);

            const source = createMosBoxMesh(THREE, 2.25, 0.5, 1.54, {
                color: 0x4b5563,
                emissive: 0x64748b,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.78,
                roughness: 0.52
            });
            source.position.set(-2.55, -0.28, 0);
            root.add(source);

            const drain = createMosBoxMesh(THREE, 2.25, 0.5, 1.54, {
                color: 0x4b5563,
                emissive: 0x64748b,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.78,
                roughness: 0.52
            });
            drain.position.set(2.55, -0.28, 0);
            root.add(drain);

            const sourceFrame = createMosWireBox(THREE, 2.25, 0.5, 1.54, { color: 0x94a3b8, opacity: 0.36 });
            sourceFrame.position.copy(source.position);
            root.add(sourceFrame);

            const drainFrame = createMosWireBox(THREE, 2.25, 0.5, 1.54, { color: 0x94a3b8, opacity: 0.36 });
            drainFrame.position.copy(drain.position);
            root.add(drainFrame);

            const channelGuide = createMosBoxMesh(THREE, 4.0, 0.22, 0.82, {
                color: 0x7dd3fc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.24,
                transparent: true,
                opacity: 0.24,
                depthWrite: false
            });
            channelGuide.position.set(0, -0.14, 0);
            root.add(channelGuide);

            const channel = createMosBoxMesh(THREE, 3.55, 0.12, 0.58, {
                color: 0x38bdf8,
                emissive: 0x2563eb,
                emissiveIntensity: 0.48,
                transparent: true,
                opacity: 0.94,
                depthWrite: false
            });
            channel.position.set(0, -0.16, 0);
            root.add(channel);

            const gateOxide = createMosBoxMesh(THREE, 3.18, 0.08, 1.86, {
                color: 0xfde68a,
                emissive: 0xfacc15,
                emissiveIntensity: 0.06,
                transparent: true,
                opacity: 0.74,
                roughness: 0.2
            });
            gateOxide.position.set(0, 0.48, 0);
            root.add(gateOxide);

            const gate = createMosBoxMesh(THREE, 3.35, 1.34, 2.1, {
                color: 0xfdba74,
                emissive: 0xfb923c,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.48,
                depthWrite: false,
                side: THREE.DoubleSide,
                metalness: 0.04,
                roughness: 0.48
            });
            gate.position.set(0, 1.15, 0);
            root.add(gate);

            const gateFrame = createMosWireBox(THREE, 3.35, 1.34, 2.1, { color: 0xfb923c, opacity: 0.62 });
            gateFrame.position.copy(gate.position);
            root.add(gateFrame);

            const gateContact = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 0.72, 18),
                new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.22, roughness: 0.32 })
            );
            gateContact.position.set(0, 2.04, 0);
            root.add(gateContact);

            const currentParticles = Array.from({ length: 5 }, (_, idx) => {
                const particle = createMosSphereMesh(THREE, 0.1, {
                    color: idx % 2 ? 0x38bdf8 : 0x2563eb,
                    emissive: 0x0ea5e9,
                    opacity: 0.92
                });
                root.add(particle);
                return particle;
            });

            const leakageParticles = Array.from({ length: 3 }, () => {
                const particle = createMosSphereMesh(THREE, 0.085, {
                    color: 0xfb7185,
                    emissive: 0xef4444,
                    opacity: 0.52
                });
                root.add(particle);
                return particle;
            });

            const glowPlate = createMosBoxMesh(THREE, 4.2, 0.05, 0.96, {
                color: 0x93c5fd,
                emissive: 0x2563eb,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.16,
                depthWrite: false
            });
            glowPlate.position.set(0, -0.16, 0);
            root.add(glowPlate);

            return {
                root,
                animate(time) {
                    channel.material.emissiveIntensity = 0.36 + 0.22 * (0.5 + 0.5 * Math.sin(time * 2.4));
                    channelGuide.material.opacity = 0.2 + 0.1 * (0.5 + 0.5 * Math.sin(time * 2.2));
                    gate.material.emissiveIntensity = 0.08 + 0.05 * (0.5 + 0.5 * Math.sin(time * 1.9));
                    glowPlate.material.opacity = 0.14 + 0.08 * (0.5 + 0.5 * Math.sin(time * 2.2));

                    currentParticles.forEach((particle, idx) => {
                        const progress = (time * 0.3 + idx * 0.18) % 1;
                        particle.position.set(
                            -3.0 + progress * 6.0,
                            -0.16 + Math.sin(time * 3.0 + idx) * 0.02,
                            Math.sin(progress * Math.PI * 2 + idx) * 0.08
                        );
                        particle.material.opacity = 0.3 + 0.65 * Math.sin(progress * Math.PI);
                    });

                    leakageParticles.forEach((particle, idx) => {
                        const progress = (time * 0.22 + idx * 0.31) % 1;
                        particle.position.set(
                            -1.55 + progress * 3.1,
                            -0.18 + Math.sin(progress * Math.PI) * 0.34,
                            idx === 1 ? 0 : idx === 0 ? 0.88 : -0.88
                        );
                        particle.material.opacity = 0.18 + 0.45 * Math.sin(progress * Math.PI);
                    });
                }
            };
        }

        function buildFinfetTransistorModel(THREE) {
            const root = new THREE.Group();

            const substrate = createMosBoxMesh(THREE, 8.8, 2.2, 5.0, {
                color: 0x6b7280,
                transparent: true,
                opacity: 0.18,
                depthWrite: false,
                side: THREE.DoubleSide,
                roughness: 0.86
            });
            substrate.position.set(0, -1.1, 0);
            root.add(substrate);

            const substrateFrame = createMosWireBox(THREE, 8.8, 2.2, 5.0, { color: 0x64748b, opacity: 0.42 });
            substrateFrame.position.copy(substrate.position);
            root.add(substrateFrame);

            const substrateFloor = createMosBoxMesh(THREE, 8.6, 0.16, 4.8, {
                color: 0x4b5563,
                transparent: true,
                opacity: 0.34,
                depthWrite: false,
                roughness: 0.92
            });
            substrateFloor.position.set(0, -2.14, 0);
            root.add(substrateFloor);

            const oxide = createMosBoxMesh(THREE, 8.4, 0.42, 4.1, {
                color: 0xcfe8f6,
                emissive: 0xe0f2fe,
                emissiveIntensity: 0.06,
                transparent: true,
                opacity: 0.88,
                roughness: 0.24
            });
            oxide.position.set(0, 0.21, 0);
            root.add(oxide);

            const oxideFrame = createMosWireBox(THREE, 8.4, 0.42, 4.1, { color: 0x93c5fd, opacity: 0.42 });
            oxideFrame.position.copy(oxide.position);
            root.add(oxideFrame);

            const fin = createMosBoxMesh(THREE, 5.45, 1.82, 0.78, {
                color: 0x4b5563,
                emissive: 0x64748b,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.82,
                roughness: 0.48
            });
            fin.position.set(0, 0.56, 0);
            root.add(fin);

            const finFrame = createMosWireBox(THREE, 5.45, 1.82, 0.78, { color: 0x94a3b8, opacity: 0.36 });
            finFrame.position.copy(fin.position);
            root.add(finFrame);

            const source = createMosBoxMesh(THREE, 1.6, 1.08, 0.7, {
                color: 0x374151,
                emissive: 0x475569,
                emissiveIntensity: 0.14,
                transparent: true,
                opacity: 0.88,
                roughness: 0.44
            });
            source.position.set(-1.95, 0.42, 0);
            root.add(source);

            const drain = createMosBoxMesh(THREE, 1.6, 1.08, 0.7, {
                color: 0x374151,
                emissive: 0x475569,
                emissiveIntensity: 0.14,
                transparent: true,
                opacity: 0.88,
                roughness: 0.44
            });
            drain.position.set(1.95, 0.42, 0);
            root.add(drain);

            const channelGuide = createMosBoxMesh(THREE, 1.72, 1.04, 0.54, {
                color: 0x7dd3fc,
                emissive: 0x22c55e,
                emissiveIntensity: 0.24,
                transparent: true,
                opacity: 0.2,
                depthWrite: false
            });
            channelGuide.position.set(0, 0.52, 0);
            root.add(channelGuide);

            const channel = createMosBoxMesh(THREE, 1.46, 0.98, 0.42, {
                color: 0x4ade80,
                emissive: 0x16a34a,
                emissiveIntensity: 0.38,
                transparent: true,
                opacity: 0.92,
                depthWrite: false
            });
            channel.position.set(0, 0.52, 0);
            root.add(channel);

            const oxideTop = createMosBoxMesh(THREE, 2.1, 0.08, 1.1, {
                color: 0xfde68a,
                emissive: 0xfacc15,
                emissiveIntensity: 0.06,
                transparent: true,
                opacity: 0.76,
                roughness: 0.22
            });
            oxideTop.position.set(0, 1.51, 0);
            root.add(oxideTop);

            const oxideFront = createMosBoxMesh(THREE, 2.1, 1.04, 0.08, {
                color: 0xfde68a,
                emissive: 0xfacc15,
                emissiveIntensity: 0.06,
                transparent: true,
                opacity: 0.72,
                roughness: 0.22
            });
            oxideFront.position.set(0, 0.94, 0.43);
            root.add(oxideFront);

            const oxideBack = createMosBoxMesh(THREE, 2.1, 1.04, 0.08, {
                color: 0xfde68a,
                emissive: 0xfacc15,
                emissiveIntensity: 0.06,
                transparent: true,
                opacity: 0.72,
                roughness: 0.22
            });
            oxideBack.position.set(0, 0.94, -0.43);
            root.add(oxideBack);

            const gateTop = createMosBoxMesh(THREE, 2.34, 0.42, 1.58, {
                color: 0xfdba74,
                emissive: 0xfb923c,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.48,
                depthWrite: false,
                side: THREE.DoubleSide,
                metalness: 0.04,
                roughness: 0.46
            });
            gateTop.position.set(0, 1.78, 0);
            root.add(gateTop);

            const gateFront = createMosBoxMesh(THREE, 2.34, 1.12, 0.18, {
                color: 0xfdba74,
                emissive: 0xfb923c,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.46,
                depthWrite: false,
                side: THREE.DoubleSide,
                metalness: 0.04,
                roughness: 0.46
            });
            gateFront.position.set(0, 1.12, 0.62);
            root.add(gateFront);

            const gateBack = createMosBoxMesh(THREE, 2.34, 1.12, 0.18, {
                color: 0xfdba74,
                emissive: 0xfb923c,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.46,
                depthWrite: false,
                side: THREE.DoubleSide,
                metalness: 0.04,
                roughness: 0.46
            });
            gateBack.position.set(0, 1.12, -0.62);
            root.add(gateBack);

            const gateFrameTop = createMosWireBox(THREE, 2.34, 0.42, 1.58, { color: 0xfb923c, opacity: 0.62 });
            gateFrameTop.position.copy(gateTop.position);
            root.add(gateFrameTop);

            const gateFrameFront = createMosWireBox(THREE, 2.34, 1.12, 0.18, { color: 0xfb923c, opacity: 0.5 });
            gateFrameFront.position.copy(gateFront.position);
            root.add(gateFrameFront);

            const gateFrameBack = createMosWireBox(THREE, 2.34, 1.12, 0.18, { color: 0xfb923c, opacity: 0.5 });
            gateFrameBack.position.copy(gateBack.position);
            root.add(gateFrameBack);

            const gateContact = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 0.72, 18),
                new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.24, roughness: 0.32 })
            );
            gateContact.position.set(0, 2.42, 0);
            root.add(gateContact);

            const currentParticles = Array.from({ length: 5 }, (_, idx) => {
                const particle = createMosSphereMesh(THREE, 0.1, {
                    color: idx % 2 ? 0x22c55e : 0x38bdf8,
                    emissive: 0x16a34a,
                    opacity: 0.9
                });
                root.add(particle);
                return particle;
            });

            const wrapFieldParticles = Array.from({ length: 4 }, (_, idx) => {
                const particle = createMosSphereMesh(THREE, 0.08, {
                    color: idx % 2 ? 0xfcd34d : 0xfb923c,
                    emissive: 0xf59e0b,
                    opacity: 0.78
                });
                root.add(particle);
                return particle;
            });

            return {
                root,
                animate(time) {
                    channel.material.emissiveIntensity = 0.32 + 0.28 * (0.5 + 0.5 * Math.sin(time * 2.9));
                    channelGuide.material.opacity = 0.18 + 0.08 * (0.5 + 0.5 * Math.sin(time * 2.4));
                    gateTop.material.emissiveIntensity = 0.08 + 0.06 * (0.5 + 0.5 * Math.sin(time * 2.1));
                    gateFront.material.emissiveIntensity = gateTop.material.emissiveIntensity;
                    gateBack.material.emissiveIntensity = gateTop.material.emissiveIntensity;

                    currentParticles.forEach((particle, idx) => {
                        const progress = (time * 0.36 + idx * 0.18) % 1;
                        particle.position.set(
                            -2.5 + progress * 5.0,
                            0.52 + Math.sin(time * 3.3 + idx) * 0.02,
                            Math.sin(progress * Math.PI * 2 + idx) * 0.05
                        );
                        particle.material.opacity = 0.35 + 0.55 * Math.sin(progress * Math.PI);
                    });

                    wrapFieldParticles.forEach((particle, idx) => {
                        const progress = (time * 0.26 + idx * 0.25) % 1;
                        if (progress < 0.33) {
                            const local = progress / 0.33;
                            particle.position.set(-0.88 + local * 1.76, 1.78, 0.78);
                        } else if (progress < 0.66) {
                            const local = (progress - 0.33) / 0.33;
                            particle.position.set(0.88, 1.78 - local * 1.1, 0.78 - local * 1.56);
                        } else {
                            const local = (progress - 0.66) / 0.34;
                            particle.position.set(0.88 - local * 1.76, 0.68 + local * 1.1, -0.78);
                        }
                        particle.material.opacity = 0.28 + 0.5 * Math.sin(progress * Math.PI);
                    });
                }
            };
        }

        function initTransistor3DViewers() {
            if (typeof THREE === 'undefined') return;

            const viewers = document.querySelectorAll('[data-transistor-viewer]');
            if (!viewers.length) return;

            viewers.forEach((container) => {
                if (container.dataset.viewerReady === 'true') return;
                container.dataset.viewerReady = 'true';
                container.style.touchAction = 'none';

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
                camera.position.set(0, 1.6, 9.6);
                camera.lookAt(0, 0.22, 0);

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
                    renderer.outputColorSpace = THREE.SRGBColorSpace;
                }
                renderer.domElement.setAttribute('aria-hidden', 'true');
                container.appendChild(renderer.domElement);

                const fallback = container.querySelector('.transistor-3d-fallback');
                if (fallback) fallback.style.display = 'none';

                const ambient = new THREE.AmbientLight(0xffffff, 1.55);
                scene.add(ambient);

                const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
                keyLight.position.set(5, 8, 6);
                scene.add(keyLight);

                const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.62);
                fillLight.position.set(-6, 4, -4);
                scene.add(fillLight);

                const rimLight = new THREE.DirectionalLight(0xa7f3d0, 0.42);
                rimLight.position.set(4, 3, -6);
                scene.add(rimLight);

                const orbit = new THREE.Group();
                scene.add(orbit);

                const model = container.dataset.transistorViewer === 'finfet'
                    ? buildFinfetTransistorModel(THREE)
                    : buildPlanarTransistorModel(THREE);

                orbit.add(model.root);

                let rotateX = container.dataset.transistorViewer === 'finfet' ? -0.12 : -0.16;
                let rotateY = container.dataset.transistorViewer === 'finfet' ? -0.68 : 0.62;
                let startRotateX = rotateX;
                let startRotateY = rotateY;
                let startPointerX = 0;
                let startPointerY = 0;
                let isDragging = false;
                let lastInteraction = performance.now();
                let lastWidth = 0;
                let lastHeight = 0;
                const autoSpin = container.dataset.transistorViewer === 'finfet' ? -0.0032 : 0.003;

                const renderOrbit = () => {
                    orbit.rotation.x = rotateX;
                    orbit.rotation.y = rotateY;
                };

                renderOrbit();

                const startDrag = (event) => {
                    isDragging = true;
                    if (typeof container.focus === 'function') {
                        container.focus({ preventScroll: true });
                    }
                    container.classList.add('is-dragging');
                    startPointerX = event.clientX;
                    startPointerY = event.clientY;
                    startRotateX = rotateX;
                    startRotateY = rotateY;
                    lastInteraction = performance.now();
                };

                const dragMove = (event) => {
                    if (!isDragging) return;
                    const deltaX = event.clientX - startPointerX;
                    const deltaY = event.clientY - startPointerY;
                    rotateY = startRotateY + deltaX * 0.01;
                    rotateX = THREE.MathUtils.clamp(startRotateX + deltaY * 0.008, -1.0, 0.18);
                    lastInteraction = performance.now();
                    renderOrbit();
                };

                const endDrag = () => {
                    if (!isDragging) return;
                    isDragging = false;
                    container.classList.remove('is-dragging');
                    lastInteraction = performance.now();
                };

                const keyRotate = (event) => {
                    const stepX = 0.06;
                    const stepY = 0.08;
                    const key = event.key.toLowerCase();
                    let handled = true;

                    if (key === 'a') {
                        rotateY -= stepY;
                    } else if (key === 'd') {
                        rotateY += stepY;
                    } else if (key === 'w') {
                        rotateX = THREE.MathUtils.clamp(rotateX - stepX, -0.95, 0.35);
                    } else if (key === 's') {
                        rotateX = THREE.MathUtils.clamp(rotateX + stepX, -0.95, 0.35);
                    } else {
                        handled = false;
                    }

                    if (!handled) return;
                    event.preventDefault();
                    event.stopPropagation();
                    lastInteraction = performance.now();
                    renderOrbit();
                };

                renderer.domElement.addEventListener('pointerdown', startDrag);
                container.addEventListener('pointerdown', () => {
                    if (typeof container.focus === 'function') {
                        container.focus({ preventScroll: true });
                    }
                });
                container.addEventListener('keydown', keyRotate);
                window.addEventListener('pointermove', dragMove);
                window.addEventListener('pointerup', endDrag);
                window.addEventListener('pointercancel', endDrag);

                const animate = (time) => {
                    const width = Math.max(container.clientWidth, 10);
                    const height = Math.max(container.clientHeight, 10);

                    if (width !== lastWidth || height !== lastHeight) {
                        renderer.setSize(width, height, false);
                        camera.aspect = width / height;
                        camera.updateProjectionMatrix();
                        lastWidth = width;
                        lastHeight = height;
                    }

                    if (!isDragging && time - lastInteraction > 1200) {
                        rotateY += autoSpin;
                    }

                    model.animate(time * 0.001);
                    renderOrbit();
                    renderer.render(scene, camera);
                    window.requestAnimationFrame(animate);
                };

                window.requestAnimationFrame(animate);
            });
        }

(function () {
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    window.initMemoryOperationInteractive = function initMemoryOperationInteractive() {
        document.querySelectorAll('[data-memory-lab]').forEach((root) => {
            if (root.dataset.memoryReady === 'true') return;
            root.dataset.memoryReady = 'true';

            const buttons = Array.from(root.querySelectorAll('[data-memory-action]'));
            if (!buttons.length) return;

            const kind = root.dataset.memoryKind || 'sram';
            const els = {
                helper: root.querySelector('[data-memory-helper]'),
                storeValue: root.querySelector('[data-memory-store-value]'),
                lineState: root.querySelector('[data-memory-line-state]'),
                detailState: root.querySelector('[data-memory-detail-state]'),
                cellValue: root.querySelector('[data-memory-cell-value]'),
                blValue: root.querySelector('[data-memory-bl-value]'),
                blbValue: root.querySelector('[data-memory-blb-value]'),
                wlLine: root.querySelector('[data-memory-wl-line]'),
                blLine: root.querySelector('[data-memory-bl-line]'),
                blbLine: root.querySelector('[data-memory-blb-line]'),
                accessLeft: root.querySelector('[data-memory-access-left]'),
                accessRight: root.querySelector('[data-memory-access-right]'),
                qNode: root.querySelector('[data-memory-q-node]'),
                qbNode: root.querySelector('[data-memory-qb-node]'),
                qLabel: root.querySelector('[data-memory-q-label]'),
                qbLabel: root.querySelector('[data-memory-qb-label]'),
                loopTop: root.querySelector('[data-memory-loop-top]'),
                loopBottom: root.querySelector('[data-memory-loop-bottom]'),
                logBadge: root.querySelector('[data-memory-log-badge]'),
                log: root.querySelector('[data-memory-log]'),
                refreshText: root.querySelector('[data-memory-refresh-text]'),
                chargeFill: root.querySelector('[data-memory-charge-fill]'),
                chargeValue: root.querySelector('[data-memory-charge-value]')
            };
            const stageChips = Array.from(root.querySelectorAll('[data-memory-stage-chip]'));
            const gateLines = Array.from(root.querySelectorAll('[data-memory-gate-line]'));
            const state = {
                running: false,
                sequence: 0,
                hasCompleted: false,
                storeBit: null,
                charge: kind === 'dram' ? 0 : null,
                previewStage: null
            };

            const setText = (el, value) => {
                if (el) el.textContent = value;
            };
            const setAttr = (el, name, value) => {
                if (el) el.setAttribute(name, String(value));
            };
            const setStyle = (el, property, value) => {
                if (el) el.style[property] = value;
            };
            const toggleClass = (el, className, enabled) => {
                if (el) el.classList.toggle(className, Boolean(enabled));
            };
            const setButtonsDisabled = (disabled) => {
                buttons.forEach((button) => {
                    button.disabled = disabled;
                });
                stageChips.forEach((chip) => {
                    chip.disabled = disabled;
                });
            };
            const stageLabelSets = {
                sram: {
                    idle: { idle: 'Idle', 'slot-a': 'Bitline Setup', 'slot-b': 'Wordline Enable', 'slot-c': 'State Hold', done: 'Done' },
                    read: { idle: 'Idle', 'slot-a': 'Precharge', 'slot-b': 'Differential Develop', 'slot-c': 'Sense Amplify', done: 'Read Done' },
                    write1: { idle: 'Idle', 'slot-a': 'Write 1 Drive', 'slot-b': 'Wordline Enable', 'slot-c': 'Latch Hold', done: 'Write 1 Done' },
                    write0: { idle: 'Idle', 'slot-a': 'Write 0 Drive', 'slot-b': 'Wordline Enable', 'slot-c': 'Latch Hold', done: 'Write 0 Done' }
                },
                dram: {
                    idle: { idle: 'Idle', 'slot-a': 'Precharge', 'slot-b': 'Charge Sharing', 'slot-c': 'Sense & Restore', done: 'Done' },
                    read: { idle: 'Idle', 'slot-a': 'Precharge', 'slot-b': 'Charge Sharing', 'slot-c': 'Sense & Restore', done: 'Read Done' },
                    write1: { idle: 'Idle', 'slot-a': 'Write 1 Drive', 'slot-b': 'Cell Charge', 'slot-c': 'Level Restore', done: 'Write 1 Done' },
                    write0: { idle: 'Idle', 'slot-a': 'Write 0 Drive', 'slot-b': 'Cell Discharge', 'slot-c': 'Level Restore', done: 'Write 0 Done' },
                    refresh: { idle: 'Idle', 'slot-a': 'Precharge', 'slot-b': 'Charge Detect', 'slot-c': 'Charge Restore', done: 'Refresh Done' }
                }
            };
            const getOperationKey = (action = root.dataset.action || 'idle', writeValue = root.dataset.writeValue || '1') => {
                if (action === 'write') return writeValue === '0' ? 'write0' : 'write1';
                return action;
            };
            const setStageLabels = (action = root.dataset.action || 'idle', writeValue = root.dataset.writeValue || '1') => {
                const operationKey = getOperationKey(action, writeValue);
                const labels = stageLabelSets[kind][operationKey] || stageLabelSets[kind].idle;
                stageChips.forEach((chip) => {
                    setText(chip, labels[chip.dataset.memoryStageChip] || chip.textContent);
                });
            };
            const setButtonStates = (action, writeValue = root.dataset.writeValue || '1') => {
                root.dataset.op = action;
                root.dataset.action = action;
                root.dataset.writeValue = writeValue;
                setStageLabels(action, writeValue);
                buttons.forEach((button) => {
                    const buttonAction = button.dataset.memoryAction;
                    const buttonWriteValue = button.dataset.memoryValue || writeValue;
                    const isActive = buttonAction === 'write'
                        ? action === 'write' && buttonWriteValue === writeValue
                        : buttonAction === action;
                    button.classList.toggle('is-active', isActive);
                    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
            };
            const setStage = (stage) => {
                const stageOrder = ['idle', 'slot-a', 'slot-b', 'slot-c', 'done'];
                const activeIndex = stageOrder.indexOf(stage);
                root.dataset.stage = stage;
                stageChips.forEach((chip) => {
                    const chipIndex = stageOrder.indexOf(chip.dataset.memoryStageChip);
                    chip.classList.toggle('is-active', chipIndex === activeIndex);
                    chip.classList.toggle('is-done', chipIndex > 0 && chipIndex < activeIndex);
                    chip.setAttribute('aria-pressed', chipIndex === activeIndex ? 'true' : 'false');
                });
            };
            const setBadge = (text, active = true) => {
                setText(els.logBadge, text);
                toggleClass(els.logBadge, 'is-active', active);
            };
            const setRunning = (running) => {
                state.running = running;
                root.dataset.running = running ? 'true' : 'false';
            };
            const paintLine = (el, stroke, width, opacity = 1) => {
                if (!el) return;
                setAttr(el, 'stroke', stroke);
                if (width) setAttr(el, 'stroke-width', width);
                setStyle(el, 'opacity', String(opacity));
            };
            const paintRect = (el, fill, stroke, opacity = 1) => {
                if (!el) return;
                setAttr(el, 'fill', fill);
                setAttr(el, 'stroke', stroke);
                setStyle(el, 'opacity', String(opacity));
            };
            const paintNode = (el, fill, stroke = '#94a3b8') => {
                if (!el) return;
                setAttr(el, 'fill', fill);
                setAttr(el, 'stroke', stroke);
                setAttr(el, 'stroke-width', '1.6');
            };
            const setPathStroke = (el, stroke, opacity = 1) => {
                if (!el) return;
                setAttr(el, 'stroke', stroke);
                setStyle(el, 'opacity', String(opacity));
            };
            const paintGateLines = (stroke, opacity = 1, active = false) => {
                gateLines.forEach((line) => {
                    setAttr(line, 'stroke', stroke);
                    setStyle(line, 'opacity', String(opacity));
                    toggleClass(line, 'memory-gate-live', active);
                });
            };
            const clearMotion = () => {
                [els.wlLine, els.blLine, els.blbLine, els.loopTop, els.loopBottom].forEach((el) => {
                    toggleClass(el, 'memory-flow-live', false);
                });
                gateLines.forEach((line) => {
                    toggleClass(line, 'memory-gate-live', false);
                });
                [els.qNode, els.qbNode, els.chargeFill, els.chargeValue, els.cellValue].forEach((el) => {
                    toggleClass(el, 'memory-pulse-live', false);
                });
                toggleClass(els.refreshText, 'is-visible', false);
            };
            const setChargeVisual = (charge) => {
                const normalized = clamp(Math.round(charge), 0, 100);
                const height = Math.round((normalized / 100) * 18);
                setAttr(els.chargeFill, 'height', height);
                setAttr(els.chargeFill, 'y', 158 - height);
                setText(els.chargeValue, `${normalized}%`);
                setText(els.cellValue, `Charge ${normalized}%`);
                setText(els.storeValue, `${normalized}%`);
            };
            const defaultHelper = () => {
                setText(
                    els.helper,
                    kind === 'sram'
                        ? 'See bitline precharge, wordline enable, and latch hold behavior'
                        : 'See 1T1C charge sharing and sense-and-restore behavior'
                );
            };
            const ensureCurrent = (token) => token === state.sequence && root.isConnected;
            const resolveDramBit = () => (state.charge >= 35 ? '1' : '0');
            const resolveSramPreviewBit = () => state.storeBit ?? (root.dataset.writeValue || '1');
            const resolveDramPreviewCharge = () => (
                state.hasCompleted
                    ? state.charge
                    : (root.dataset.writeValue || '1') === '1' ? 72 : 0
            );
            const paintSramNodes = (bit) => {
                if (bit === null) {
                    paintNode(els.qNode, '#cbd5e1');
                    paintNode(els.qbNode, '#cbd5e1');
                    setText(els.qLabel, 'Q');
                    setText(els.qbLabel, 'QB');
                    return;
                }

                const complement = bit === '1' ? '0' : '1';
                paintNode(els.qNode, bit === '1' ? '#2563eb' : '#cbd5e1', bit === '1' ? '#1d4ed8' : '#94a3b8');
                paintNode(els.qbNode, bit === '0' ? '#2563eb' : '#cbd5e1', bit === '0' ? '#1d4ed8' : '#94a3b8');
                setText(els.qLabel, `Q=${bit}`);
                setText(els.qbLabel, `QB=${complement}`);
            };
            const clearStagePreview = () => {
                state.previewStage = null;
                delete root.dataset.previewStage;
            };
            const renderStableState = () => {
                if (kind === 'sram') {
                    renderSramStable();
                } else {
                    renderDramStable();
                }
            };
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

            const renderSramStable = () => {
                clearMotion();
                paintLine(els.wlLine, '#c4b5fd', 3);
                paintLine(els.blLine, state.storeBit === null ? '#94a3b8' : '#60a5fa', 3.2);
                paintLine(els.blbLine, state.storeBit === null ? '#94a3b8' : '#60a5fa', 3.2);
                paintGateLines('#cbd5e1', 0.95);
                paintRect(els.accessLeft, '#e2e8f0', '#cbd5e1');
                paintRect(els.accessRight, '#e2e8f0', '#cbd5e1');
                setPathStroke(els.loopTop, '#2563eb', state.storeBit === null ? 0.55 : 0.95);
                setPathStroke(els.loopBottom, '#16a34a', state.storeBit === null ? 0.55 : 0.95);

                if (state.storeBit === null) {
                    setStage('idle');
                    setBadge('Idle', false);
                    defaultHelper();
                    setText(els.log, 'Idle. SRAM holds a written value stably through its internal feedback loop.');
                    setText(els.storeValue, 'None');
                    setText(els.lineState, 'Floating (Z)');
                    setText(els.detailState, 'Q=? / QB=?');
                    setText(els.cellValue, 'Stored: none');
                    setText(els.blValue, 'Z');
                    setText(els.blbValue, 'Z');
                    paintNode(els.qNode, '#cbd5e1');
                    paintNode(els.qbNode, '#cbd5e1');
                    setText(els.qLabel, 'Q');
                    setText(els.qbLabel, 'QB');
                    return;
                }

                const bit = state.storeBit;
                const complement = bit === '1' ? '0' : '1';
                setStage('done');
                setBadge('Hold');
                defaultHelper();
                setText(
                    els.log,
                    bit === '1'
                        ? 'The cell is currently holding Q=1 / QB=0 through its internal feedback loop.'
                        : 'The cell is currently holding Q=0 / QB=1 through its internal feedback loop.'
                );
                setText(els.storeValue, bit);
                setText(els.lineState, 'BL=1 / BLB=1');
                setText(els.detailState, `Q=${bit} / QB=${complement}`);
                setText(els.cellValue, `Stored: ${bit}`);
                setText(els.blValue, '1');
                setText(els.blbValue, '1');
                paintNode(els.qNode, bit === '1' ? '#2563eb' : '#cbd5e1', bit === '1' ? '#1d4ed8' : '#94a3b8');
                paintNode(els.qbNode, bit === '0' ? '#2563eb' : '#cbd5e1', bit === '0' ? '#1d4ed8' : '#94a3b8');
                setText(els.qLabel, `Q=${bit}`);
                setText(els.qbLabel, `QB=${complement}`);
            };

            const renderDramStable = () => {
                clearMotion();
                paintLine(els.wlLine, '#c4b5fd', 3);
                paintLine(els.blLine, '#94a3b8', 3.2);
                paintGateLines('#d8b4fe', 0.95);
                paintRect(els.accessLeft, '#f3e8ff', '#d8b4fe');
                setText(els.blValue, 'Z');
                setChargeVisual(state.charge);

                if (!state.hasCompleted && state.charge === 0) {
                    setStage('idle');
                    setBadge('Idle', false);
                    defaultHelper();
                    setText(els.log, 'Idle. DRAM gradually leaks charge over time, so the stored state weakens unless it is refreshed.');
                    setText(els.lineState, 'Floating (Z)');
                    setText(els.detailState, 'Charge decay');
                    return;
                }

                setStage('done');
                if (state.charge >= 35) {
                    setBadge('Leakage');
                    setText(els.lineState, 'Floating (Z)');
                    setText(els.detailState, `Leaked to ${state.charge}%`);
                    setText(
                        els.log,
                        state.charge >= 70
                            ? `${state.charge}% charge remains, so the cell still holds a stable '1' state.`
                            : `Only ${state.charge}% charge remains, so the next read or refresh will need the sense amp to restore it soon.`
                    );
                } else {
                    setBadge(state.charge > 0 ? 'Weak' : 'Zero');
                    setText(els.lineState, 'Floating (Z)');
                    setText(els.detailState, state.charge > 0 ? `Weak charge ${state.charge}%` : '0 state held');
                    setText(
                        els.log,
                        state.charge > 0
                            ? `Charge has fallen to ${state.charge}% and is now weak. If refreshed now, it may collapse to 0.`
                            : 'The capacitor is currently discharged and holding a 0 state.'
                    );
                }
            };

            const finishAction = () => {
                setRunning(false);
                setButtonsDisabled(false);
                if (kind === 'sram') {
                    renderSramStable();
                } else {
                    renderDramStable();
                }
            };

            const runSramAction = async (action, writeValue) => {
                const token = ++state.sequence;
                setRunning(true);
                setButtonsDisabled(true);
                setButtonStates(action, writeValue);

                if (action === 'read' && state.storeBit === null) {
                    setStage('slot-a');
                    setBadge('Read');
                    setText(els.helper, 'Write a value first, then compare how the read operation behaves.');
                    setText(els.log, 'No stored bit exists yet, so a differential read cannot be generated. Write a value first.');
                    setText(els.lineState, 'BL=1 / BLB=1');
                    setText(els.detailState, 'No valid cell state');
                    setText(els.blValue, '1');
                    setText(els.blbValue, '1');
                    paintLine(els.blLine, '#60a5fa', 3.2);
                    paintLine(els.blbLine, '#60a5fa', 3.2);
                    toggleClass(els.blLine, 'memory-flow-live', true);
                    toggleClass(els.blbLine, 'memory-flow-live', true);
                    await wait(600);
                    if (!ensureCurrent(token)) return;
                    finishAction();
                    return;
                }

                if (action === 'write') {
                    const target = writeValue;
                    const complement = target === '1' ? '0' : '1';

                    setStage('slot-a');
                    setBadge('Write');
                    setText(els.helper, `Write ${target}: first drive the bitline pair to BL=${target}, BLB=${complement}.`);
                    setText(els.log, 'The write driver first forces the bitline pair to the target and complement values to prepare the latch for flipping.');
                    setText(els.lineState, `BL=${target} / BLB=${complement}`);
                    setText(els.detailState, `Write ${target} drive`);
                    setText(els.blValue, target);
                    setText(els.blbValue, complement);
                    paintLine(els.blLine, target === '1' ? '#2563eb' : '#fb7185', 3.4);
                    paintLine(els.blbLine, complement === '1' ? '#2563eb' : '#fb7185', 3.4);
                    toggleClass(els.blLine, 'memory-flow-live', true);
                    toggleClass(els.blbLine, 'memory-flow-live', true);
                    await wait(540);
                    if (!ensureCurrent(token)) return;

                    setStage('slot-b');
                    setText(els.helper, 'When WL rises, the access transistors turn on and the internal nodes follow the new bitline values.');
                    setText(els.log, 'As WL rises and the access transistors turn on, the internal Q / QB nodes start flipping toward the new data.');
                    setText(els.detailState, 'WL high / access ON');
                    setText(els.cellValue, `Resolving to ${target}`);
                    paintLine(els.wlLine, '#8b5cf6', 4.2);
                    toggleClass(els.wlLine, 'memory-flow-live', true);
                    paintGateLines('#8b5cf6', 1, true);
                    paintRect(els.accessLeft, '#ddd6fe', '#8b5cf6');
                    paintRect(els.accessRight, '#ddd6fe', '#8b5cf6');
                    paintNode(els.qNode, target === '1' ? '#2563eb' : '#cbd5e1', target === '1' ? '#1d4ed8' : '#94a3b8');
                    paintNode(els.qbNode, target === '0' ? '#2563eb' : '#cbd5e1', target === '0' ? '#1d4ed8' : '#94a3b8');
                    setText(els.qLabel, `Q=${target}`);
                    setText(els.qbLabel, `QB=${complement}`);
                    await wait(620);
                    if (!ensureCurrent(token)) return;

                    state.storeBit = target;
                    state.hasCompleted = true;
                    setStage('slot-c');
                    setText(els.helper, 'Even after WL falls again, the cross-coupled inverter feedback keeps the new state locked in.');
                    setText(els.log, 'After the bitlines return, the internal feedback loop locks the value. That is why SRAM does not need refresh.');
                    setText(els.lineState, 'Feedback hold');
                    setText(els.detailState, `Q=${target} / QB=${complement}`);
                    setText(els.storeValue, target);
                    setText(els.cellValue, `Stored: ${target}`);
                    setText(els.blValue, '1');
                    setText(els.blbValue, '1');
                    paintLine(els.wlLine, '#c4b5fd', 3);
                    paintLine(els.blLine, '#60a5fa', 3.2);
                    paintLine(els.blbLine, '#60a5fa', 3.2);
                    paintGateLines('#cbd5e1', 0.95);
                    toggleClass(els.wlLine, 'memory-flow-live', false);
                    toggleClass(els.blLine, 'memory-flow-live', false);
                    toggleClass(els.blbLine, 'memory-flow-live', false);
                    paintRect(els.accessLeft, '#e2e8f0', '#cbd5e1');
                    paintRect(els.accessRight, '#e2e8f0', '#cbd5e1');
                    toggleClass(els.loopTop, 'memory-flow-live', true);
                    toggleClass(els.loopBottom, 'memory-flow-live', true);
                    await wait(620);
                    if (!ensureCurrent(token)) return;
                    finishAction();
                    return;
                }

                const readBit = state.storeBit;
                const readComplement = readBit === '1' ? '0' : '1';
                const droopLine = readBit === '1' ? els.blbLine : els.blLine;
                const holdLine = readBit === '1' ? els.blLine : els.blbLine;
                const droopLabel = readBit === '1' ? els.blbValue : els.blValue;
                const holdLabel = readBit === '1' ? els.blValue : els.blbValue;

                setStage('slot-a');
                setBadge('Read');
                setText(els.helper, 'Read step 1: precharge BL/BLB high, then open WL to create a tiny voltage difference.');
                setText(els.log, 'Before reading, both BL and BLB are precharged high. Then we observe which side the stored value pulls down slightly.');
                setText(els.lineState, 'BL=1 / BLB=1');
                setText(els.detailState, 'Read precharge');
                setText(els.blValue, '1');
                setText(els.blbValue, '1');
                paintLine(els.blLine, '#60a5fa', 3.2);
                paintLine(els.blbLine, '#60a5fa', 3.2);
                toggleClass(els.blLine, 'memory-flow-live', true);
                toggleClass(els.blbLine, 'memory-flow-live', true);
                await wait(520);
                if (!ensureCurrent(token)) return;

                setStage('slot-b');
                setText(els.helper, 'Read step 2: when WL rises, the stored node creates a tiny differential voltage on the bitline pair.');
                setText(els.log, `As WL rises, the stored ${readBit} makes ${readBit === '1' ? 'BLB' : 'BL'} droop slightly, so the sense amp can detect the difference.`);
                setText(els.lineState, readBit === '1' ? 'BL holds / BLB droops' : 'BL droops / BLB holds');
                setText(els.detailState, `Q=${readBit} / QB=${readComplement}`);
                paintLine(els.wlLine, '#8b5cf6', 4.2);
                toggleClass(els.wlLine, 'memory-flow-live', true);
                paintGateLines('#8b5cf6', 1, true);
                paintRect(els.accessLeft, '#ddd6fe', '#8b5cf6');
                paintRect(els.accessRight, '#ddd6fe', '#8b5cf6');
                paintLine(holdLine, '#2563eb', 3.4);
                paintLine(droopLine, '#f59e0b', 3.4);
                setText(holdLabel, '1');
                setText(droopLabel, '0.8');
                await wait(620);
                if (!ensureCurrent(token)) return;

                setStage('slot-c');
                setText(els.helper, 'Read step 3: the sense amp amplifies the tiny voltage delta, but the SRAM latch state is not disturbed.');
                setText(els.log, 'The sense amp resolves the small voltage difference into a clear value, while the cell latch keeps its original state. SRAM read is non-destructive.');
                setText(els.lineState, 'Sense complete');
                setText(els.detailState, `Read ${readBit} / state preserved`);
                setText(els.cellValue, `Stored: ${readBit}`);
                paintLine(els.wlLine, '#c4b5fd', 3);
                paintGateLines('#cbd5e1', 0.95);
                paintRect(els.accessLeft, '#e2e8f0', '#cbd5e1');
                paintRect(els.accessRight, '#e2e8f0', '#cbd5e1');
                toggleClass(els.wlLine, 'memory-flow-live', false);
                toggleClass(els.loopTop, 'memory-flow-live', true);
                toggleClass(els.loopBottom, 'memory-flow-live', true);
                state.hasCompleted = true;
                await wait(620);
                if (!ensureCurrent(token)) return;
                finishAction();
            };

            const runDramAction = async (action, writeValue) => {
                const token = ++state.sequence;
                const startingCharge = state.charge;
                const sensedBit = resolveDramBit();

                setRunning(true);
                setButtonsDisabled(true);
                setButtonStates(action, writeValue);

                if (action === 'write') {
                    const target = writeValue;
                    const targetCharge = target === '1' ? 100 : 0;

                    setStage('slot-a');
                    setBadge('Write');
                    setText(
                        els.helper,
                        target === '1'
                            ? 'Write 1: drive BL high to prepare charging the capacitor.'
                            : 'Write 0: drive BL low to prepare discharging the capacitor.'
                    );
                    setText(els.log, 'The write driver strongly drives the bitline to the target level. The capacitor does not change until WL turns on.');
                    setText(els.lineState, `BL=${target}`);
                    setText(els.detailState, `Write ${target} drive`);
                    setText(els.blValue, target);
                    paintLine(els.blLine, target === '1' ? '#2563eb' : '#fb7185', 3.4);
                    toggleClass(els.blLine, 'memory-flow-live', true);
                    await wait(520);
                    if (!ensureCurrent(token)) return;

                    setStage('slot-b');
                    setText(els.helper, 'When WL rises, the capacitor follows the bitline level through the access transistor and charge moves.');
                    setText(
                        els.log,
                        target === '1'
                            ? 'As WL rises, charge enters the capacitor and the cell charges toward a 1 state.'
                            : 'As WL rises, charge leaves the capacitor and the cell discharges toward a 0 state.'
                    );
                    setText(els.lineState, target === '1' ? 'Charge entering cell' : 'Charge leaving cell');
                    setText(els.detailState, 'WL high / capacitor follows BL');
                    paintLine(els.wlLine, '#8b5cf6', 4.2);
                    toggleClass(els.wlLine, 'memory-flow-live', true);
                    paintGateLines('#8b5cf6', 1, true);
                    paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
                    setChargeVisual(target === '1' ? 58 : 8);
                    await wait(620);
                    if (!ensureCurrent(token)) return;

                    state.charge = targetCharge;
                    state.hasCompleted = true;
                    setStage('slot-c');
                    setText(els.helper, 'In the final restore phase, the DRAM cell charge settles to its target level.');
                    setText(
                        els.log,
                        target === '1'
                            ? 'The restore phase drives the remaining charge all the way up, leaving the capacitor close to 100%.'
                            : 'The restore phase confirms the low level and finishes with the capacitor at 0.'
                    );
                    setText(els.lineState, 'Sense amp restore');
                    setText(els.detailState, `Restored to ${targetCharge}%`);
                    paintGateLines('#8b5cf6', 1, true);
                    toggleClass(els.refreshText, 'is-visible', true);
                    setChargeVisual(targetCharge);
                    await wait(620);
                    if (!ensureCurrent(token)) return;
                    finishAction();
                    return;
                }

                if (action === 'read') {
                    setStage('slot-a');
                    setBadge('Read');
                    setText(els.helper, 'Read step 1: precharge the bitline near 1/2 VDD, then sense a tiny voltage difference.');
                    setText(els.log, 'BL is first aligned near 1/2 VDD. DRAM read starts by measuring a very small voltage difference from that point.');
                    setText(els.lineState, 'BL = 1/2 VDD');
                    setText(els.detailState, 'Read precharge');
                    setText(els.blValue, '0.5');
                    paintLine(els.blLine, '#a78bfa', 3.4);
                    toggleClass(els.blLine, 'memory-flow-live', true);
                    await wait(520);
                    if (!ensureCurrent(token)) return;

                    setStage('slot-b');
                    setText(els.helper, 'Read step 2: when WL rises, the capacitor charge mixes with the bitline and nudges it slightly above or below 0.5V.');
                    setText(
                        els.log,
                        sensedBit === '1'
                            ? 'The remaining charge pulls the bitline slightly above 0.5V. The difference is tiny, but still enough for the sense amp to detect.'
                            : 'Very little charge remains, so the bitline tilts slightly below 0.5V. A weak cell can be judged as 0 at this point.'
                    );
                    setText(els.lineState, sensedBit === '1' ? 'BL = 0.5 + dV' : 'BL = 0.5 - dV');
                    setText(els.detailState, 'Charge sharing');
                    setText(els.blValue, sensedBit === '1' ? '0.5+dV' : '0.5-dV');
                    paintLine(els.wlLine, '#8b5cf6', 4.2);
                    toggleClass(els.wlLine, 'memory-flow-live', true);
                    paintGateLines('#8b5cf6', 1, true);
                    paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
                    setChargeVisual(Math.max(startingCharge - 10, 0));
                    await wait(620);
                    if (!ensureCurrent(token)) return;

                    state.charge = sensedBit === '1' ? 100 : 0;
                    state.hasCompleted = true;
                    setStage('slot-c');
                    setText(els.helper, 'Read step 3: because DRAM read is destructive, the sense amp must immediately restore the detected value.');
                    setText(
                        els.log,
                        sensedBit === '1'
                            ? 'The sense amp confirms a 1 and immediately refills the capacitor with charge.'
                            : startingCharge > 0
                                ? 'The charge was too weak, so the cell was judged as 0. After restore, it still settles at 0.'
                                : 'The cell read as 0, and after restore the 0 state is written back unchanged.'
                    );
                    setText(els.lineState, 'Sense amp restore');
                    setText(els.detailState, sensedBit === '1' ? 'Read 1 -> restore 100%' : 'Read 0 -> restore 0%');
                    paintGateLines('#8b5cf6', 1, true);
                    toggleClass(els.refreshText, 'is-visible', true);
                    setChargeVisual(state.charge);
                    await wait(620);
                    if (!ensureCurrent(token)) return;
                    finishAction();
                    return;
                }

                setStage('slot-a');
                setBadge('Refresh');
                setText(els.helper, 'Refresh step 1: start from precharge so the weakened charge can be read again.');
                setText(els.log, 'Refresh also follows the sequence precharge -> charge sharing -> restore. The key is whether enough charge still remains.');
                setText(els.lineState, 'BL = 1/2 VDD');
                setText(els.detailState, 'Refresh precharge');
                setText(els.blValue, '0.5');
                paintLine(els.blLine, '#a78bfa', 3.4);
                toggleClass(els.blLine, 'memory-flow-live', true);
                await wait(500);
                if (!ensureCurrent(token)) return;

                setStage('slot-b');
                setText(els.helper, 'Refresh step 2: sense the remaining charge. If it is too weak, a stored 1 can no longer survive.');
                setText(
                    els.log,
                    sensedBit === '1'
                        ? 'Enough charge remains to still detect a 1, so the sense amp can restore the original full level.'
                        : startingCharge > 0
                            ? 'The charge is already too weak at refresh time and has tilted toward 0. In this case, refresh cannot rescue the 1.'
                            : 'The cell is already discharged to 0, so refresh only reconfirms that 0 state.'
                );
                setText(els.lineState, sensedBit === '1' ? 'BL = 0.5 + dV' : 'BL = 0.5 - dV');
                setText(els.detailState, 'Weak charge detect');
                setText(els.blValue, sensedBit === '1' ? '0.5+dV' : '0.5-dV');
                paintLine(els.wlLine, '#8b5cf6', 4.2);
                toggleClass(els.wlLine, 'memory-flow-live', true);
                paintGateLines('#8b5cf6', 1, true);
                paintRect(els.accessLeft, '#fbcfe8', '#f43f5e');
                setChargeVisual(Math.max(startingCharge - 6, 0));
                await wait(580);
                if (!ensureCurrent(token)) return;

                state.charge = sensedBit === '1' ? 100 : 0;
                state.hasCompleted = true;
                setStage('slot-c');
                setText(els.helper, 'Refresh step 3: drive the detected value back to full level to extend retention.');
                setText(
                    els.log,
                    sensedBit === '1'
                        ? 'Refresh succeeds: the sense amp restores the weakened charge back close to 100%.'
                        : 'The refresh result is still 0. Once the data is gone, refresh only reinforces that lost state.'
                );
                setText(els.lineState, 'Refresh restore');
                setText(els.detailState, sensedBit === '1' ? 'Charge restored to 100%' : '0 state held');
                paintGateLines('#8b5cf6', 1, true);
                toggleClass(els.refreshText, 'is-visible', true);
                setChargeVisual(state.charge);
                await wait(620);
                if (!ensureCurrent(token)) return;
                finishAction();
            };

            buttons.forEach((button) => {
                button.addEventListener('click', () => {
                    if (state.running) return;
                    clearStagePreview();
                    const action = button.dataset.memoryAction || 'read';
                    const writeValue = button.dataset.memoryValue || root.dataset.writeValue || '1';
                    if (kind === 'sram') {
                        runSramAction(action, writeValue);
                    } else {
                        runDramAction(action, writeValue);
                    }
                });
            });

            stageChips.forEach((chip) => {
                chip.addEventListener('click', () => {
                    if (state.running) return;
                    const stage = chip.dataset.memoryStageChip || 'idle';
                    if (state.previewStage === stage) {
                        clearStagePreview();
                        renderStableState();
                        return;
                    }
                    runStagePreview(stage);
                });
            });

            if (kind === 'dram') {
                window.setInterval(() => {
                    if (state.running || state.previewStage || !root.isConnected || state.charge <= 0) {
                        if (!state.previewStage && state.hasCompleted && state.charge <= 0 && !state.running) {
                            state.charge = 0;
                            renderDramStable();
                        }
                        return;
                    }
                    state.charge = clamp(
                        state.charge - (state.charge > 70 ? 6 : state.charge > 35 ? 4 : 2),
                        0,
                        100
                    );
                    renderDramStable();
                }, 2400);
            }

            setButtonStates('idle', root.dataset.writeValue || '1');
            if (kind === 'sram') {
                renderSramStable();
            } else {
                renderDramStable();
            }
        });
    };
})();

(function () {
    const embedded = () => window.self !== window.top;
    const getPageId = () => document.body.dataset.pageId || document.documentElement.dataset.pageId || 'unknown';
    const lockEmbeddedScroll = () => {
        if (!embedded()) return;
        document.documentElement.style.overflowX = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
        if (document.body) {
            document.body.style.overflowX = 'hidden';
            document.body.style.overflowY = 'hidden';
        }
    };
    const isFormTarget = (target) => {
        if (!(target instanceof Element)) return false;
        return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]')) || target.isContentEditable;
    };
    const postParent = (payload) => {
        if (!embedded()) return;
        window.parent.postMessage(payload, '*');
    };
    const notifyHeight = () => {
        const pageShell = document.querySelector('.page-shell');
        const height = Math.max(
            pageShell ? Math.ceil(pageShell.getBoundingClientRect().height) : 0,
            document.body ? document.body.scrollHeight : 0,
            document.body ? document.body.offsetHeight : 0,
            document.documentElement ? document.documentElement.scrollHeight : 0,
            document.documentElement ? document.documentElement.offsetHeight : 0
        );
        postParent({ type: 'adt:page-height', pageId: getPageId(), height });
    };
    const initParentBridge = () => {
        if (!embedded()) return;

        lockEmbeddedScroll();
        const scheduleHeightSync = () => window.requestAnimationFrame(() => notifyHeight());
        postParent({ type: 'adt:ready', pageId: getPageId() });

        window.addEventListener('load', scheduleHeightSync);
        window.addEventListener('resize', scheduleHeightSync);

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(scheduleHeightSync);
            if (document.documentElement) observer.observe(document.documentElement);
            if (document.body) observer.observe(document.body);
        } else {
            window.setInterval(notifyHeight, 1000);
        }

        document.addEventListener('keydown', (event) => {
            if (isFormTarget(event.target)) return;
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                postParent({
                    type: 'adt:navigate',
                    pageId: getPageId(),
                    delta: event.key === 'ArrowRight' ? 1 : -1,
                });
                event.preventDefault();
            }
        });

        window.setTimeout(scheduleHeightSync, 0);
        window.setTimeout(scheduleHeightSync, 180);
        window.setTimeout(scheduleHeightSync, 720);
    };

    const initStandalonePage = () => {
        applyRtlCodeHighlighting();
        initJobRoleFlowInteractive();
        initTransistor3DViewers();
        initFpgaLogicInteractive();
        initMemoryOperationInteractive();
        if (document.getElementById('practice-topic-filter')) {
            initPracticeQuestionBank();
        }
        updateMockTimerDisplay();
        initParentBridge();
        notifyHeight();
    };

    window.GuidebookPage = Object.assign(window.GuidebookPage || {}, {
        initStandalonePage,
        notifyHeight,
    });
})();
