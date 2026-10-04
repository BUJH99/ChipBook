/* Small, deterministic teaching models; no device performance is inferred. */
(function () {
    'use strict';
    const ERASED = '11111111';
    const DATA = '10100101';
    const READ_ERROR = '10110101';
    function createState() {
        return { programmed: true, power: true, selectedPage: 2,
            pages: ['10100110', '01101001', ERASED, ERASED, ERASED, ERASED],
            remapped: false, corrected: false, wear: [64, 24, 40, 12],
            wearTarget: -1, ssdStep: 0, pageMessage: 'P2 선택 · 비어 있는 페이지에 데이터를 써보세요.' };
    }
    function transition(state, action, value) {
        const next = { ...state, pages: [...state.pages], wear: [...state.wear] };
        switch (action) {
        case 'cell-program': if (state.power) next.programmed = true; break;
        case 'cell-erase': if (state.power) next.programmed = false; break;
        case 'cell-power': next.power = !state.power; break;
        case 'page-select':
            if (Number.isInteger(value) && value >= 0 && value < state.pages.length) {
                next.selectedPage = value;
                next.pageMessage = state.pages[value] === ERASED
                    ? 'P' + value + ' 선택 · 비어 있는 페이지에 데이터를 써보세요.'
                    : 'P' + value + ' 선택 · 다시 쓰려면 블록을 먼저 소거하세요.';
            }
            break;
        case 'page-program':
            if (state.pages[state.selectedPage] === ERASED) {
                next.pages[state.selectedPage] = '10100110';
                next.pageMessage = 'P' + state.selectedPage + ' 기록 완료 · 다른 페이지는 유지됩니다.';
            }
            break;
        case 'block-erase':
            next.pages.fill(ERASED);
            next.pageMessage = '블록 소거 완료 · 6개 페이지의 모든 비트가 1입니다.';
            break;
        case 'ftl-update': next.remapped = !state.remapped; break;
        case 'ecc-correct': next.corrected = !state.corrected; break;
        case 'wear-next': {
            const target = state.wear.indexOf(Math.min(...state.wear));
            next.wear[target] += 1;
            next.wearTarget = target;
            break;
        }
        case 'ssd-step':
            if (Number.isInteger(value) && value >= 0 && value <= 3) next.ssdStep = value;
            break;
        case 'ssd-reset': next.ssdStep = 0; break;
        }
        return next;
    }
    const model = { createState, transition, ERASED, DATA, READ_ERROR };
    if (typeof module !== 'undefined' && module.exports) module.exports = model;
    if (typeof document === 'undefined') return;
    document.querySelectorAll('[data-nsv-lab]').forEach(init);
    function init(root) {
        let state = createState();
        let playback = null;
        const find = selector => root.querySelector(selector);
        const all = selector => [...root.querySelectorAll(selector)];
        const text = (selector, value) => { find(selector).textContent = value; };
        const pressed = (selector, active) => find(selector).setAttribute('aria-pressed', String(active));
        const actionButton = action => '[data-nsv-action="' + action + '"]';
        function render() {
            const cell = find('.nsv-cell');
            cell.dataset.cell = state.programmed ? 'programmed' : 'erased';
            cell.dataset.power = state.power ? 'on' : 'off';
            pressed(actionButton('cell-program'), state.programmed);
            pressed(actionButton('cell-erase'), !state.programmed);
            pressed(actionButton('cell-power'), !state.power);
            find(actionButton('cell-program')).disabled = !state.power;
            find(actionButton('cell-erase')).disabled = !state.power;
            text(actionButton('cell-power'), state.power ? '⏻ 전원 끄기' : '⏻ 전원 켜기');
            text('[data-nsv-cell-charge]', state.power ? (state.programmed ? '전하 저장' : '전하 적음') : '전원 OFF');
            text('[data-nsv-cell-vth]', state.power ? (state.programmed ? 'Vth 높음' : 'Vth 낮음') : '전하 유지');
            text('[data-nsv-cell-read]', state.power ? '읽기 ' + (state.programmed ? '0' : '1') : '상태 보존');
            find('.nsv-cross-section').setAttribute('aria-label', state.programmed
                ? '전자가 floating gate에 저장됨. 문턱전압이 높아 읽기 전압에서 셀이 꺼집니다.'
                : '소거 상태. 저장 전하가 적고 문턱전압이 낮아 읽기 전압에서 셀이 켜집니다.');
            all('[data-nsv-page]').forEach(row => {
                const index = Number(row.dataset.nsvPage);
                row.setAttribute('aria-pressed', String(index === state.selectedPage));
                row.setAttribute('aria-label', '페이지 ' + index + ' 선택, ' + (state.pages[index] === ERASED ? '소거 상태' : '기록된 상태'));
                [...row.querySelectorAll('.nsv-page-bits i')].forEach((bit, i) => {
                    bit.textContent = state.pages[index][i];
                    bit.classList.toggle('is-zero', state.pages[index][i] === '0');
                });
            });
            text(actionButton('page-program'), 'P' + state.selectedPage + '에 쓰기');
            find(actionButton('page-program')).disabled = state.pages[state.selectedPage] !== ERASED;
            text('[data-nsv-page-result]', state.pageMessage);
            text('[data-nsv-pba]', state.remapped ? 'B2 / P3' : 'B1 / P2');
            const oldPage = find('[data-nsv-old-page]');
            const newPage = find('[data-nsv-new-page]');
            oldPage.classList.toggle('is-invalid', state.remapped);
            oldPage.classList.toggle('is-current', !state.remapped);
            newPage.classList.toggle('is-current', state.remapped);
            oldPage.querySelector('i').textContent = state.remapped ? '무효' : '유효';
            newPage.querySelector('i').textContent = state.remapped ? '유효' : '여유';
            text(actionButton('ftl-update'), state.remapped ? '처음 예시로' : '같은 LBA 갱신');
            pressed(actionButton('ftl-update'), state.remapped);
            text('[data-nsv-ftl-result]', 'LBA 1 → ' + (state.remapped ? 'B2 / P3' : 'B1 / P2'));
            find('.nsv-ecc').classList.toggle('is-corrected', state.corrected);
            all('.nsv-bits-read [data-bit]').forEach((bit, i) => { bit.textContent = (state.corrected ? DATA : READ_ERROR)[i]; });
            text('.nsv-ecc-arrow span', state.corrected ? '1 bit 복구' : '1 bit 오류');
            text(actionButton('ecc-correct'), state.corrected ? '오류 예시로' : 'ECC로 복구');
            pressed(actionButton('ecc-correct'), state.corrected);
            text('[data-nsv-ecc-result]', state.corrected ? '원래 비트로 정정 완료' : '4번째 비트 오류');
            all('[data-nsv-wear]').forEach((column, i) => {
                column.classList.toggle('is-target', state.wearTarget === i);
                column.querySelector('strong').textContent = state.wear[i];
                column.querySelector('.nsv-wear-track i').style.height = (state.wear[i] / Math.max(80, ...state.wear) * 100) + '%';
            });
            find('.nsv-wear-chart').setAttribute('aria-label', '블록별 누적 소거 횟수 ' + state.wear.map((n,i) => 'ABCD'[i] + ' ' + n).join(', '));
            text('[data-nsv-wear-result]', state.wearTarget < 0 ? '낮은 P/E 블록 선택' : '블록 ' + 'ABCD'[state.wearTarget] + ' 선택 · P/E +1');
            const system = find('.nsv-system');
            system.dataset.ssdStep = state.ssdStep;
            system.classList.toggle('is-playing', playback !== null);
            all('[data-nsv-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.nsvStep) === state.ssdStep)));
            text('[data-nsv-ssd-result]', [
                '01 · Host가 쓰기 요청을 보냅니다.',
                '02 · 주소를 변환하고 ECC 코드를 생성합니다.',
                '03 · 채널을 나눠 NAND 페이지에 기록합니다.',
                '04 · 기록 완료 상태를 Host로 돌려보냅니다.'
            ][state.ssdStep]);
            text(actionButton('ssd-play'), playback === null ? '▶ 흐름 재생' : 'Ⅱ 일시 정지');
            pressed(actionButton('ssd-play'), playback !== null);
        }
        function stop() { if (playback !== null) clearInterval(playback); playback = null; }
        root.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button || !root.contains(button)) return;
            if (button.hasAttribute('data-nsv-page')) {
                state = transition(state, 'page-select', Number(button.dataset.nsvPage));
            } else if (button.hasAttribute('data-nsv-step')) {
                stop();
                state = transition(state, 'ssd-step', Number(button.dataset.nsvStep));
            } else {
                const action = button.dataset.nsvAction;
                if (action === 'ssd-play') {
                    if (playback !== null) {
                        stop();
                    } else {
                        if (state.ssdStep === 3) state = transition(state, 'ssd-reset');
                        playback = setInterval(() => {
                            if (document.hidden || !root.getClientRects().length) { stop(); render(); return; }
                            state = transition(state, 'ssd-step', state.ssdStep + 1);
                            if (state.ssdStep === 3) stop();
                            render();
                        }, 1000);
                    }
                } else {
                    if (action === 'ssd-reset') stop();
                    state = transition(state, action);
                }
            }
            render();
        });
        window.addEventListener('pagehide', stop);
        render();
    }
})();
