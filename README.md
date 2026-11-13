# ChipBook

> 소자·회로·시스템 설계부터 검증과 제품화까지 연결하는 웹 가이드북입니다.

## 🚀 바로 보기

👉 **[ChipBook 열기](https://bujh99.github.io/ChipBook/)**

## 📚 구성

28장, 208개 학습 절로 구성합니다. 01–08의 원래 53개 절과 기존 실습을 유지하고,
09–26의 148개 절에는 SVG 도식과 계산 실습, 필요한 주제의 3D 구조를 제공합니다.

| 장 | 범위 |
| --- | --- |
| 01–08 | 산업·설계 흐름·RTL·물리 구현·메모리·직무·UVM·On-Chip Bus |
| 09–11 | Off-Chip Interface 15절, SoC 통합 14절, AI 가속기 15절 |
| 12–15 | 소자·공정, CMOS/Custom Layout, Analog/Mixed-Signal/RF, CPU/GPU/DSP |
| 16–21 | 합성·제약, STA, CDC/RDC, 저전력/UPF, DFT, Formal |
| 22–26 | 패키지·Chiplet, 실리콘 검증·수율·신뢰성, 보안·안전, EDA/FPGA, 설계 프로젝트 |
| 27–28 | 기존 143개 객관식과 148개 절별 복습 질문, 20문항 모의시험과 결과 리뷰 |

상단 **검색**에서 절 제목을 찾아 바로 이동합니다. 새 절은 도식과 실습을 기본으로
표시합니다. 2D 확대·이동·단계 재생과 3D 회전·단면·층 분리를 사용할 수 있습니다.
27.04의 공통 참고 자료에는 회로 수학, 언어와 코드, 한영 용어, 파일/리포트,
원문 자료를 정리했습니다. 26.06에서 실행 예제 전체를 ZIP으로
내려받을 수 있으며 HTTP와 `file://`에서 같은 파일을 제공합니다.

학습 완료, 복습 북마크, 설계 판단 기록, 최근 시험 오답은 브라우저 localStorage에 저장합니다.
모의시험의 남은 시간은 종료 시각 기준이며 다른 장이나 숨겨진 탭에서 갱신 timer는 중지합니다.
다시 돌아오면 실제 경과 시간을 반영합니다.

## 🛠️ 로컬에서 보기

생성된 `index.html`을 브라우저에서 직접 열 수 있습니다. 코드를 수정하려면
Python 3.10 이상과 Node.js 22 이상을 준비한 뒤 다음 명령을 실행합니다.

```bash
npm ci
python tools/dev.py serve
```

처음 내려받거나 lockfile이 바뀌면 `npm ci`로 고정된 빌드·테스트 도구를 설치합니다.
Python은 페이지 조립과 검증, esbuild는 필요한 JS·CSS 번들 생성,
Playwright는 브라우저 회귀 검사를 담당합니다. 생성된 HTML·JS·CSS는 Git에 포함합니다.

서버 실행 후 [로컬 ChipBook](http://127.0.0.1:8000)에 접속하세요.
`Ctrl+C`로 종료하며, 다른 포트는 `--port 8765`로 지정할 수 있습니다.

## 📁 구조

```text
ChipBook/
├─ index.html                       # 생성된 가이드북 진입점
├─ src/
│  ├─ app/page-registry.json         # 챕터 순서, 제목, 목차
│  ├─ app/asset-builds.json           # 소스 진입점과 생성 JS·CSS
│  ├─ app/runtime-assets.json        # 배포할 에셋 범위
│  ├─ templates/page-head.html       # 공통 문서 헤더
│  ├─ features/stage-detail/         # 3D 모델 편집 원본
│  └─ vendor/three/                  # 3D 번들 빌드 전용 의존성
├─ pages/
│  ├─ page-*.html                    # 빌드 결과 — 직접 수정하지 않음
│  └─ <chapter>/source/
│     ├─ page-build.json             # 조립 순서, CSS·JS, 동적 에셋, 런타임 문서
│     ├─ 00-shell-start.html         # 챕터 시작 마크업
│     ├─ sections/                   # 실제 편집하는 학습 내용
│     └─ 99-shell-end.html           # 종료 마크업과 공통 스크립트 슬롯
├─ assets/
│  ├─ guidebook-common.css           # 공통 레이아웃과 컴포넌트
│  ├─ guidebook-page-common.js       # 목차, 기능 시작·중지, iframe 연결
│  ├─ guidebook-main.js              # 전체 가이드북 탐색
│  ├─ components/                    # 재사용 시각화와 내부 문서 높이 통신
│  ├─ features/memory/               # 메모리 모델·파형·실습, source/는 번들 원본
│  ├─ features/stage-detail/         # 설계 흐름 기능, 3D 번들, images/
│  ├─ features/shared/source/        # 비동기 실습 취소 등 공통 소스 모듈
│  ├─ features/curriculum/           # 공통 학습 UI, 계산/상태 모델, 최종 이미지
│  │  └─ source/                     # models·detail-models·presentation·detail-labs·index
│  ├─ examples/                      # 다운로드하는 Python/RTL/TB/SDC 예제 원본
│  ├─ pages/                         # 챕터별 CSS와 동작
│  │  └─ page-8-on-chip-bus/          # source/와 styles/에서 기능별 편집
│  └─ fonts/                         # 로컬 글꼴과 라이선스
├─ tools/                            # 개발 명령, 빌드·검증·단위 테스트
│  └─ browser/                       # HTTP·직접 열기·모바일 브라우저 테스트
└─ .artifacts/                       # 임시 파일 전용, README 외 Git 제외
```

## 개발 명령

| 명령 | 용도 |
| --- | --- |
| `python tools/dev.py build` | 선언된 JS·CSS 번들, 챕터, 목차 생성 |
| `python tools/dev.py check` | 생성물 최신 여부, 참조·배치·제목 일치, JS·JSX 문법 검사 |
| `python tools/dev.py test` | 빌드·목차 이관·실습 모델·예제·문제은행·메모리·lifecycle 검사 |
| `python tools/dev.py setup-browser` | 최초 1회 Chromium 설치, `.artifacts/cache/` 사용 |
| `python tools/dev.py test-browser` | 배포 패키지에서 HTTP·직접 열기·모바일 회귀 검사 |
| `python tools/dev.py serve --port 8000` | 빌드 후 로컬 서버 시작 |
| `python tools/dev.py preview` | `.artifacts/previews/index.html`에 섹션별 미리보기 링크 생성 |
| `python tools/dev.py package` | `.artifacts/site/`에 배포 파일을 모으고 참조 검사 |

섹션 미리보기는 `pages/page-5-memory-device.html?section=flash-ssd`처럼
실제 챕터를 지정한 상태로 엽니다. 챕터 전체를 복사한 디버그 HTML은 만들지 않습니다.
문제은행과 모의시험의 상태는 해당 화면의 버튼으로 전환합니다.
책 전체에서 절을 열 때는 `index.html?chapter=9&section=i2c-i3c`를 사용합니다.
기존 상세 문서는 `detail=sequence-diagram`처럼 해당 상세 key를 덧붙여 열 수 있습니다.

## 수정 위치와 공통 컴포넌트

- 내용은 `pages/<chapter>/source/sections/`에서 수정한 뒤 `build`를 실행합니다.
  확장 본문은 `lesson-09-05.html`처럼 학습 번호를 가진 일반 HTML fragment입니다.
  `.artifacts/`의 이관 계획·작성 보조 데이터는 일반 빌드의 입력이 아닙니다.
- 섹션의 전체 제목은 레지스트리의 `title`, 짧은 목차 표기는 선택적인 `tocTitle`로 관리합니다.
  원본 HTML의 `{{section:키:toc}}`, `{{section:키:label}}`은 빌드 때 반영됩니다.
  `{{chapter-title}}`과 `{{chapter-number}}`도 같은 레지스트리에서 가져옵니다.
- CSS는 manifest의 `styles`, 외부 라이브러리는 `headScripts`, 본문 실행 순서는
  `scripts`에 선언합니다. `{{page-scripts}}` 슬롯이 목록을 출력합니다.
  스크립트는 URL 또는 `{ "src": "...", "defer": true }`처럼 구조화된 항목을 씁니다.
  동적으로 읽는 아이콘·번들은 `runtimeAssets`에도 선언해 누락을 검사합니다.
- 공통 문서 구조와 글꼴은 `src/templates/page-head.html`, `assets/fonts.css`에서 관리합니다.
- 섹션 제목은 `.guidebook-section-head / shell / kicker`, 제목과 상태 표시줄은
  `.guidebook-chapter-head`를 재사용합니다. 페이지마다 같은 CSS를 복사하지 않습니다.
- 공통 초기화는 `GuidebookPage.registerInitializer(fn)`에 등록합니다.
  문제은행 데이터는 표시 번호 27·28장만, 메모리 전용 실습은 5장만 읽도록 구성되어 있습니다.
  기존 문제은행/시험의 안정적인 ID `page-13`/`page-14`와 파일 경로는 보존합니다.
  표시 번호는 `number`로 관리하고 ID에서 추론하지 않습니다. `sectionAliases`는 옛 절 링크를 연결합니다.
- 반복 실행은 `registerLifecycle({ root, start, stop, destroy })`로 관리합니다.
  섹션·챕터 이탈 및 브라우저 숨김 때 `stop`, 복귀 때 `start`가 실행됩니다.
  3D처럼 화면 안에 있을 때만 필요한 기능은 `registerViewportFeature(root, create)`를 사용합니다.
  `create`는 `{ start, stop, destroy }`를 반환하며 첫 노출 때 한 번만 호출됩니다.
- 8장의 파형 자료·주소 모델·각 실습은 `assets/pages/page-8-on-chip-bus/source/`,
  스타일은 같은 챕터의 `styles/`에서 편집합니다. 메모리 동작·미리보기·상태 표시는
  `assets/features/memory/source/`에서 편집합니다. 생성된 번들 상단에는 안내 주석이 있습니다.
- UVM의 `source/sections/*.html`은 iframe으로 실행하는 실제 문서입니다.
  기존 15개 독립 문서를 유지하며,
  `page-build.json`의 `runtimeFiles`가 독립 문서만 배포에 포함합니다.
  공통 `embedded-document.js`가 자신의 높이를 전달하므로 부모의 DOM 접근 없이도
  `file://` 미리보기가 동작합니다. 비활성 문서는 관찰을 중지합니다.
- 3D 원본과 번들은 `src/app/asset-builds.json`으로 연결됩니다.
  `src/features/stage-detail/index.mjs`나 의존성을 수정하면 일반 `build`로 재생성합니다.
  `check`는 소스와 현재 번들이 다르면 실패하며 파일은 덮어쓰지 않습니다.
- 새 실습은 `assets/features/curriculum/source/`에서 계산 모델과 렌더러를 분리해 편집합니다.
  `data-lesson-lab`의 입력은 본문 fragment에 있고 optional 번들은 manifest의 `scripts`에 선언합니다.
  모델은 단위·가정·제외 범위를 표시하며 실제 규격 compliance나 전기 signoff 도구를 대체하지 않습니다.
- 09–26의 시각화는 `assets/features/visual-atlas/source/`에서 편집합니다.
  D3 기반 SVG와 별도로 지연 로드하는 Three.js 번들은 `asset-builds.json`에 선언합니다.
  `data-visual-scene`에 절별 구성·단계·입력 연동 대상을 저장하며 제목·목차는 registry 토큰을 사용합니다.
  보이지 않는 3D viewer는 GPU 자원을 해제하고 다시 노출될 때 복원합니다.
- `{{legacy:...}}`는 보존한 학습 fragment를 빌드 때 포함하고, `{{curriculum-review}}`는
  문제은행의 `source/review-questions.json`에서 복습 자료를 읽습니다. 본문에는 질문·해설 블록을 넣지 않습니다.
  `{{example-download}}`는 `assets/examples/`를
  결정적인 ZIP byte로 만들어 다운로드 링크에 포함하므로 `file://`에서 fetch가 필요하지 않습니다.

## 설계 예제 확인

```bash
python assets/examples/reference.py --project all
python assets/examples/mini_soc.py
python assets/examples/mini_soc.py --fault
```

RTL의 문법·타입·elaboration 검사는 Python 3.11 이상 환경의 선택적인 `pyslang==12.0.0`으로 실행합니다.
`python assets/examples/run_examples.py lint`를 사용하며, 실제 RTL 실행은 Verilator와
C++ toolchain이 있는 환경에서 `simulate --output .artifacts/qa/hdl`로 실행합니다.
Reference 실행, elaboration 검사, RTL simulation, FPGA 동작, 물리 signoff는 서로 다른 검증입니다.
예제에 포함한 SDC와 회로 조건은 실제 library/board 조건으로 바꿔야 합니다.

## 임시 산출물과 배포

목업·생성 프롬프트는 `.artifacts/mockups/`, 스크린샷과 검사 결과는
`.artifacts/qa/`, 일회성 스크립트는 `.artifacts/scratch/`에 둡니다.
현재 화면에서 실제 참조하는 최종 이미지만 `assets/`로 옮겨 Git에 포함합니다.
자세한 하위 폴더 규칙은 [.artifacts/README.md](.artifacts/README.md)를 참고하세요.

빌드는 루트에 흩어진 목업과 예전 디버그 폴더가 다시 생기면 오류로 알립니다.
배포 패키지는 생성된 챕터, 명시된 UVM 문서, `runtime-assets.json`에 선언된 에셋과
`runtimeAssets`에 지정한 동적 파일을 포함합니다. 편집용 모듈·스타일 원본과
빌드 전용 vendor는 배포에서 제외되며, 필요한 라이선스는 함께 포함합니다.

GitHub Actions는 PR에서도 생성물 일치·단위 테스트·브라우저 테스트·패키지를 검증합니다.
Git에 포함한 생성물이 원본과 다르면 첫 `check`에서 실패합니다.
실제 Pages 배포는 `main` push 또는 `main`의 수동 실행에만 진행됩니다.

Tailwind, 일부 도표 라이브러리와 IBM Plex 글꼴은 외부 CDN을 사용하므로
최초 로딩에는 네트워크 연결이 필요합니다. Pretendard는 로컬 파일로 제공합니다.
