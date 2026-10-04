/* Qualitative reading paths for the memory lessons.
 * Every illustrated cell state comes from memory-fail-model.sample().
 * The flow copy explains the mechanism; it does not define another simulation.
 */
(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.ChipBookFailureConcepts = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const stories = {
        'dram-retention': {
            headline: '다음 리프레시 전에 전하가 부족해지면 보존에 실패합니다.',
            flow: [['누설 전류', 'WL이 꺼져 있어도 발생', 'database'], ['저장 전하 감소', '취약 셀에서 더 빠르게 소모', 'chart-bar'], ['판독 여유 소진', '원래 값을 보장할 수 없음', 'target']],
            takeaway: '리프레시는 저장값을 잃기 전에 전하를 보충해야 합니다.'
        },
        'dram-restore': {
            headline: '읽기로 줄어든 전하를 충분히 복원한 뒤 행을 닫아야 합니다.',
            flow: [['전하 공유', '읽기 중 셀 전하 감소', 'database'], ['너무 이른 PRE', '복원이 끝나기 전에 차단', 'route'], ['부분 복원', '다음 접근까지의 여유 감소', 'chart-bar']],
            takeaway: '부분 복원은 즉시 비트 반전을 뜻하지 않습니다. 남은 보존 여유가 줄어드는 현상입니다.'
        },
        'dram-sense': {
            headline: '같은 저장값도 센스 앰프가 반대 방향으로 증폭하면 다르게 읽힙니다.',
            flow: [['작은 입력 ΔV', 'BL과 BLB의 미세한 차이', 'chart-bar'], ['오프셋·노이즈 우세', '판정 방향이 바뀜', 'route'], ['잘못된 판독', '저장 1을 출력 0으로 해석', 'target']],
            takeaway: '셀에 저장된 값과 센스 앰프의 판독 출력을 구분해서 보세요.'
        },
        'dram-rowhammer': {
            headline: '선택하지 않은 Victim 셀도 인접 행의 반복 접근으로 영향을 받습니다.',
            flow: [['인접 행 반복 ACT', 'Aggressor 행을 열고 닫음', 'hierarchy'], ['교란 누적', 'Victim의 전하 손실 가속', 'route'], ['Victim 비트 오류', '직접 쓰지 않은 데이터 변화', 'target']],
            takeaway: 'Victim WL은 기본적으로 OFF입니다. 개선 비교에서만 피해 가능 행을 선제 리프레시합니다.'
        },
        'dram-refresh': {
            headline: 'REF 일정이 밀리면 약한 셀부터 전하 여유를 잃습니다.',
            flow: [['REF 지연·누락', '제때 보충하지 못한 전하', 'rotate-clockwise'], ['방전 지속', '보존 경계 아래로 감소', 'chart-bar'], ['보존 오류', '늦은 REF만으로 원래 값 복구 불가', 'target']],
            takeaway: 'tREFI는 일정 간격, tRFC는 리프레시 동작에 필요한 시간입니다.'
        },
        'dram-write-recovery': {
            headline: '쓰기 뒤 셀 전하가 자리 잡기 전에 PRE를 실행하면 저장이 불완전합니다.',
            flow: [['새 데이터 쓰기', 'Write Driver가 셀을 충전', 'database'], ['tWR 부족', '충전 중 접근 경로 차단', 'route'], ['새 값의 전하 부족', '쓰기 완료 시점의 상태 문제', 'target']],
            takeaway: '마지막 쓰기 데이터 이후에도 셀 전하가 안정화될 시간이 필요합니다.'
        },
        'dram-vrt': {
            headline: '같은 셀도 트랩 상태에 따라 보존 시간이 달라집니다.',
            flow: [['트랩 상태 변화', '전자 포획·방출', 'cpu'], ['누설 수준 변화', '고누설 상태에서 더 빠른 방전', 'chart-bar'], ['간헐적 보존 오류', '검사 시점에 따라 다른 결과', 'target']],
            takeaway: '한 번의 보존 시간 검사만으로 모든 VRT 상태를 검출한다고 가정하지 않습니다.'
        },
        'dram-hard-soft': {
            headline: 'Hard 결함은 데이터를 다시 써도 물리적 경로에 남습니다.',
            flow: [['물리적 결함', '단선·단락 등 지속되는 손상', 'cpu'], ['재기록 시험', '올바른 값으로 다시 쓰기', 'rotate-clockwise'], ['오류 반복', '원래 결함은 그대로 남음', 'target']],
            takeaway: '예비 셀 치환은 손상된 셀을 우회합니다. 원래 결함 자체가 없어지는 것은 아닙니다.'
        },
        'sram-read-upset': {
            headline: '읽기 교란이 트립 포인트를 넘으면 저장 상태 자체가 반전됩니다.',
            flow: [['읽기 WL 활성', '프리차지된 BL과 셀 연결', 'route'], ['0 노드 상승', '셀 복원력이 충분하지 않음', 'chart-bar'], ['래치 반전', 'Q/QB가 0/1에서 1/0으로 변화', 'target']],
            takeaway: '판독값만 틀린 경우와 달리, WL이 꺼진 뒤에도 잘못된 저장 상태가 남습니다.'
        },
        'sram-write-fail': {
            headline: '쓰기 구동이 부족하면 새 데이터가 남지 않습니다.',
            flow: [['쓰기 구동 부족', '기존 래치 피드백을 이기지 못함', 'cpu'], ['트립 포인트 미도달', '전환에 필요한 여유·시간 부족', 'chart-bar'], ['기존 값으로 복귀', 'WL OFF 뒤에도 이전 0 유지', 'rotate-clockwise']],
            takeaway: '쓰기 명령의 실행과 새 데이터의 저장은 다릅니다. 읽기 안정성과 쓰기 용이성을 함께 검증해야 합니다.'
        },
        'sram-half-select': {
            headline: '한 행의 쓰기가 같은 WL을 공유하는 옆 열의 셀까지 교란할 수 있습니다.',
            flow: [['공통 WL 활성', '쓰기 비선택 열도 접근 경로 열림', 'hierarchy'], ['읽기와 유사한 교란', 'Victim의 BL/BLB는 프리차지 상태', 'route'], ['비선택 셀 반전', '쓰지 않은 주소의 데이터 변화', 'target']],
            takeaway: '비교 대상은 쓰기 대상 셀이 아니라 같은 행의 Half-selected 셀입니다.'
        },
        'sram-hold': {
            headline: '대기 전압이 너무 낮으면 읽기·쓰기 없이도 저장 상태를 잃습니다.',
            flow: [['대기 VDD 감소', 'WL은 계속 OFF', 'chart-bar'], ['래치 복원력 부족', '누설·불균형을 이기지 못함', 'cpu'], ['Q/QB 구분 소실', '저장 상태를 보장할 수 없음', 'target']],
            takeaway: '?는 보장할 수 없는 상태입니다. 특정 0 또는 1로 바뀐다고 단정하지 않습니다.'
        },
        'sram-slow': {
            headline: '저장값이 정상이더라도 신호가 늦게 도착하면 판독을 보장할 수 없습니다.',
            flow: [['약한 구동·큰 RC', '비트라인 신호 전개가 느림', 'cpu'], ['센싱 시점 도달', '샘플링 순간 신호 차이 부족', 'chart-bar'], ['판독 유효성 상실', '래치의 저장값은 유지', 'target']],
            takeaway: '나중에 신호가 충분히 커져도 이미 끝난 판독 결과가 소급해서 바뀌지는 않습니다.'
        },
        'sram-rtn': {
            headline: '고정된 미스매치 위에 트랩 변화가 겹치면 안정성 여유가 흔들립니다.',
            flow: [['전자 포획·방출', '불규칙한 트랩 상태 변화', 'cpu'], ['문턱전압 변화', '기존 셀 불균형에 추가 영향', 'route'], ['간헐적 여유 부족', '특정 상태에서 오류 위험 증가', 'chart-bar']],
            takeaway: '이 예에서는 저장값 0을 유지합니다. RTN이 항상 비트 반전을 뜻하지는 않습니다.'
        },
        'sram-aging': {
            headline: '초기에 통과한 셀도 누적 스트레스 뒤에는 요구 여유가 부족할 수 있습니다.',
            flow: [['스트레스 누적', '전압·온도·활동 조건', 'cpu'], ['소자 특성 이동', 'BTI·HCI 등에 따른 변화', 'route'], ['동작 여유 감소', '수명 조건에서 다시 검증', 'chart-bar']],
            takeaway: '가로축은 누적 스트레스입니다. 재생 시간이나 실제 제품 수명 예측값이 아닙니다.'
        },
        'sram-ser': {
            headline: '짧은 입자 사건이 끝난 뒤에도 반전된 저장 상태는 남을 수 있습니다.',
            flow: [['입자 사건', '저장 노드에 전하 수집', 'cpu'], ['일시적 전류 교란', '래치의 상태 전환 경계 초과', 'route'], ['저장 비트 반전', '회로 단선 없이 데이터 변화', 'target']],
            takeaway: 'ECC는 판독값을 보정하고 Scrub은 셀에 다시 씁니다. SEU는 사건, SER는 발생률입니다.'
        }
    };
    const softStory = {
        headline: 'Soft 오류는 회로 연결을 유지한 채 데이터가 바뀌며, 올바른 재기록으로 회복합니다.',
        flow: [['일시적 교란', '물리적 연결은 유지', 'cpu'], ['데이터 변화', '셀 값과 판독값을 구분', 'route'], ['올바른 재기록', '저장 셀의 데이터 복구', 'rotate-clockwise']],
        takeaway: 'ECC 판독 보정과 실제 셀 재기록은 서로 다른 단계입니다.'
    };
    const escape = function (text) {
        return String(text).replace(/[&<>"']/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
    };
    const sourceNames = { dram: 'DRAM 신뢰성', trr: 'RowHammer · TRR', sram: 'SRAM 동작 마진', ecc: 'ECC · Scrubbing', aging: 'BTI · 셀 열화', seu: 'SEU · SER' };
    const sourceKinds = { dram: '연구 자료', trr: '연구 논문', sram: '연구 논문', ecc: '기술 문서', aging: '연구 논문', seu: '기술 문서' };

    function visualKind(id) {
        if (id === 'dram-sense') return 'sense';
        if (id.indexOf('dram-') === 0) return 'charge';
        if (id === 'sram-slow') return 'signal';
        if (id === 'sram-rtn' || id === 'sram-aging') return 'margin';
        return 'latch';
    }
    function graphic(kind) {
        if (kind === 'latch') {
            return '<div class="mf-mini-latch"><div class="mf-mini-bit"><span>Q</span><b data-concept-q>0</b></div>' +
                '<svg class="mf-mini-feedback" viewBox="0 0 100 64" aria-hidden="true"><path d="M30 8 L58 20 L30 32 Z M70 32 L42 44 L70 56 Z" class="mf-mini-gate"/>' +
                '<circle cx="62" cy="20" r="4"/><circle cx="38" cy="44" r="4"/>' +
                '<path d="M66 20 H82 V44 H70 M34 44 H18 V20 H30"/><circle cx="18" cy="20" r="2" class="mf-mini-dot"/><circle cx="82" cy="44" r="2" class="mf-mini-dot"/></svg>' +
                '<div class="mf-mini-bit"><span>QB</span><b data-concept-qb>1</b></div></div><span class="mf-mini-caption" data-concept-caption></span>';
        }
        if (kind === 'charge') {
            return '<div class="mf-mini-charge"><span class="mf-charge-label">전하</span><span class="mf-charge-tank"><i class="mf-charge-fill"></i><i class="mf-charge-limit"></i></span>' +
                '<span class="mf-charge-reading"><span>저장</span><b data-concept-bit>1</b></span></div><span class="mf-mini-caption" data-concept-caption></span>';
        }
        if (kind === 'sense') {
            return '<div class="mf-mini-sense"><span class="mf-sense-input">BL<br>BLB</span><svg viewBox="0 0 70 58" aria-hidden="true"><path d="M2 16 H15 M2 42 H15 M15 3 L58 29 L15 55 Z M58 29 H68"/>' +
                '<path d="M22 18 H30 M26 14 V22 M22 40 H30"/></svg><span class="mf-sense-output"><span>판독</span><b data-concept-output>—</b></span></div><span class="mf-mini-caption" data-concept-caption></span>';
        }
        return '<div class="mf-mini-meter"><span class="mf-mini-metric" data-concept-metric></span><span class="mf-meter-track"><i class="mf-meter-fill"></i><i class="mf-meter-limit"></i></span>' +
            '<span class="mf-meter-endpoints"><span>낮음</span><span>높음</span></span></div><span class="mf-mini-caption" data-concept-caption></span>';
    }

    function create(container, model, icon) {
        let lesson, mode, mitigation, signature = '', handles, needsUpdate = true, lastPhase = -1;
        const panel = container.closest('details');
        const textCache = new WeakMap();
        function text(node, value) {
            if (!node || textCache.get(node) === value) return;
            textCache.set(node, value); node.textContent = value;
        }
        function snapshot(side, when) {
            const kind = visualKind(lesson.id);
            return '<figure class="mf-concept-snapshot' + (when === 'now' ? ' is-current' : '') + '" data-concept-snapshot="' + side + '-' + when + '" data-kind="' + kind + '">' +
                '<span class="mf-snapshot-time">' + ({ start: '시작', now: '현재', end: '완료' }[when]) + '</span>' +
                '<div class="mf-snapshot-graphic" role="img">' + graphic(kind) + '</div><figcaption data-concept-status></figcaption></figure>';
        }
        function lane(side) {
            const normal = side === 'normal';
            const label = normal ? '정상 셀' : mitigation ? '개선 적용 셀' : lesson.id === 'sram-aging' ? '열화 셀' : '취약 셀';
            return '<div class="mf-concept-lane ' + (normal ? 'is-normal' : mitigation ? 'is-improved' : 'is-vulnerable') + '" data-concept-lane="' + side + '">' +
                '<div class="mf-concept-lane-label">' + icon(normal || mitigation ? 'circle-check' : 'target') + '<strong>' + label + '</strong>' +
                '<span>' + (normal ? lesson.id === 'sram-aging' ? 'Fresh 기준' : '정상 조건' : mitigation ? escape(lesson.id === 'dram-hard-soft' && mode === 'soft' ? 'ECC·Scrub' : lesson.mitigation) : '취약 조건') + '</span></div>' +
                '<div class="mf-concept-snapshots">' + snapshot(side, 'start') + snapshot(side, 'now') + snapshot(side, 'end') + '</div></div>';
        }
        function setLesson(nextLesson, nextMitigation, nextMode) {
            const nextSignature = [nextLesson.id, nextMitigation, nextMode].join(':');
            if (signature === nextSignature) return;
            signature = nextSignature; lesson = nextLesson; mitigation = nextMitigation; mode = nextMode;
            const story = lesson.id === 'dram-hard-soft' && mode === 'soft' ? softStory : stories[lesson.id];
            if (!story) throw new RangeError('Missing memory concept: ' + lesson.id);
            container.dataset.conceptId = lesson.id;
            container.dataset.conceptMode = mode;
            container.dataset.conceptMitigation = String(mitigation);
            const stages = ['원인', '셀 내부 변화', '결과'];
            const scaleKey = ['charge', 'margin', 'signal'].includes(visualKind(lesson.id)) ? '<div class="mf-concept-scale-key"><span>막대: ' + escape(lesson.metric) + '의 상대 크기</span><span><i aria-hidden="true"></i>' + escape(lesson.thresholdLabel) + '</span></div>' : '';
            container.innerHTML = '<div class="mf-concept-intro"><span class="mf-concept-eyebrow">불량 발생 경로 <span>개선 전</span></span><h5 class="mf-concept-headline">' + escape(story.headline) + '</h5></div>' +
                '<ol class="mf-concept-flow" aria-label="불량 발생 경로">' + story.flow.map(function (step, index) {
                    return '<li><span class="mf-concept-flow-icon">' + icon(step[2]) + '</span><div><span class="mf-concept-flow-label">' + stages[index] + '</span><strong>' + escape(step[0]) + '</strong><span class="mf-concept-flow-note">' + escape(step[1]) + '</span></div></li>';
                }).join('') + '</ol>' +
                '<div class="mf-concept-section-head"><h6>단계별 상태 비교</h6><span>단계를 누르면 회로·파형도 함께 이동합니다</span></div>' +
                '<div class="mf-concept-steps" role="group" aria-label="개념도 단계 선택">' + lesson.phases.map(function (phase, index) {
                    return '<button type="button" data-mf-phase="' + index + '" data-concept-phase="' + index + '" aria-label="개념도 ' + (index + 1) + '단계 ' + escape(phase) + '"><span>' + (index + 1) + '</span><b>' + escape(phase) + '</b></button>';
                }).join('') + '</div>' +
                '<div class="mf-concept-observation"><span class="mf-concept-step-number" data-concept-step-number></span><strong data-concept-phase-name></strong><p data-concept-note></p></div>' +
                '<div class="mf-concept-compare">' + scaleKey + '<div class="mf-concept-columns" aria-hidden="true"><span></span><div><span>시작</span><span>현재 단계</span><span>완료 시점</span></div></div>' + lane('normal') + lane('vulnerable') + '</div>' +
                '<div class="mf-concept-takeaway">' + icon('target') + '<p>' + escape(story.takeaway) + '</p></div>' +
                (lesson.caveat && lesson.caveat !== story.takeaway ? '<aside class="mf-concept-caveat"><strong>해석 범위</strong><span>' + escape(lesson.caveat) + '</span></aside>' : '') +
                '<div class="mf-concept-resources"><div class="mf-concept-consider"><h6>' + icon('list-check') + '함께 고려할 항목</h6><ul>' + lesson.other.split(' · ').map(function (item) { return '<li>' + escape(item) + '</li>'; }).join('') + '</ul></div>' +
                '<div class="mf-concept-sources"><h6>' + icon('book') + '참고 자료</h6><div>' + lesson.refs.map(function (key) {
                    const source = model.sources[key];
                    return '<a href="' + escape(source.url) + '" target="_blank" rel="noopener noreferrer" title="' + escape(source.title) + '"><span><small>' + sourceKinds[key] + '</small><strong>' + sourceNames[key] + '</strong></span>' + icon('external-link') + '</a>';
                }).join('') + '</div></div></div>';
            handles = { number: container.querySelector('[data-concept-step-number]'), phase: container.querySelector('[data-concept-phase-name]'), note: container.querySelector('[data-concept-note]'),
                phases: Array.from(container.querySelectorAll('[data-concept-phase]')), snapshots: {} };
            container.querySelectorAll('[data-concept-snapshot]').forEach(function (node) {
                const get = function (name) { return node.querySelector('[data-concept-' + name + ']'); };
                handles.snapshots[node.dataset.conceptSnapshot] = { node: node, visual: node.querySelector('.mf-snapshot-graphic'), q: get('q'), qb: get('qb'), bit: get('bit'), output: get('output'), caption: get('caption'), metric: get('metric'), status: get('status') };
                node.style.setProperty('--mf-concept-threshold', (lesson.threshold * 100).toFixed(2) + '%');
            });
            ['start', 'end'].forEach(function (when) {
                const state = model.sample(lesson.id, when === 'start' ? 0 : 1, mitigation, mode);
                ['normal', 'vulnerable'].forEach(function (side) { updateSnapshot(handles.snapshots[side + '-' + when], state[side]); });
            });
            needsUpdate = true; lastPhase = -1;
        }
        function updateSnapshot(handle, state) {
            const kind = visualKind(lesson.id);
            const bit = state.bit === null ? '?' : String(state.bit);
            const output = state.output === null ? state.sense && !state.valid ? '?' : '—' : String(state.output);
            let caption = '';
            if (kind === 'latch') {
                text(handle.q, bit); text(handle.qb, state.bit === null ? '?' : String(1 - state.bit));
                caption = state.corrected ? '셀 ' + bit + ' · ECC 판독 ' + output : state.scrub ? 'Scrub · 셀 재기록' : lesson.id === 'sram-hold' ? state.risk ? 'Q/QB 구분 불가' : 'WL OFF · 보존' : state.bit === null ? '래치 전환 중' : '저장 Q=' + bit;
                if (lesson.id === 'sram-write-fail' && state.risk && state.wl) caption = 'Q 상승 · 전환 미달';
                handle.node.style.setProperty('--mf-q-level', (state.q * 100).toFixed(2) + '%');
                handle.node.style.setProperty('--mf-qb-level', (state.qb * 100).toFixed(2) + '%');
            } else if (kind === 'charge') {
                text(handle.bit, bit);
                caption = state.spare ? '예비 셀로 치환' : state.defect ? '저장 경로 결함' : state.corrected ? '셀 ' + bit + ' · ECC 판독 ' + output : state.scrub ? '재기록 · 데이터 복구' : '셀 전하 · 상대 크기';
            } else if (kind === 'sense') {
                text(handle.output, output); caption = '저장 ' + bit + ' / 판독 ' + output;
            } else {
                text(handle.metric, lesson.metric);
                caption = kind === 'signal' ? '저장 ' + bit + ' / 판독 ' + output : '저장 ' + bit + ' 유지';
            }
            handle.node.style.setProperty('--mf-concept-level', (state.metric * 100).toFixed(2) + '%');
            handle.node.dataset.risk = String(state.risk);
            handle.node.dataset.bit = bit;
            handle.node.dataset.output = output;
            text(handle.caption, caption); text(handle.status, state.status);
            const description = state.status + '. ' + caption;
            if (handle.visual.getAttribute('aria-label') !== description) handle.visual.setAttribute('aria-label', description);
        }
        function update(state) {
            if (!handles || !needsUpdate && panel && !panel.open) return;
            needsUpdate = false;
            if (lastPhase !== state.phase) {
                container.dataset.conceptPhase = String(state.phase);
                text(handles.number, String(state.phase + 1).padStart(2, '0'));
                text(handles.phase, lesson.phases[state.phase]);
                handles.phases.forEach(function (button, index) {
                    if (index === state.phase) button.setAttribute('aria-current', 'step');
                    else button.removeAttribute('aria-current');
                });
                lastPhase = state.phase;
            }
            text(handles.note, mitigation ? state.vulnerable.detail : lesson.notes[state.phase]);
            updateSnapshot(handles.snapshots['normal-now'], state.normal);
            updateSnapshot(handles.snapshots['vulnerable-now'], state.vulnerable);
        }
        return { setLesson: setLesson, update: update };
    }
    return { stories: stories, create: create, visualKind: visualKind };
}));
