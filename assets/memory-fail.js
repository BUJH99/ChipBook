(function () {
    'use strict';
    const assetBase = new URL('.', document.currentScript.src);
    const model = window.ChipBookMemoryFailures;
    const diagrams = window.ChipBookFailureDiagrams;
    const concepts = window.ChipBookFailureConcepts;
    if (!model || !diagrams) return;
    const esc = diagrams.escape;
    function icon(name) {
        return '<img class="mf-icon" src="' + new URL('icons/tabler/' + name + '.svg', assetBase).href + '" alt="" width="20" height="20">';
    }
    function iconButton(action, title, name, extra) {
        return '<button type="button" class="mf-icon-btn ' + (extra || '') + '" data-mf-action="' + action + '" aria-label="' + title + '" title="' + title + '">' + icon(name) + '</button>';
    }
    function playerIcon() {
        // Tabler's local player-play/player-pause paths (MIT). Both symbols are
        // embedded so toggling playback never needs another image request.
        return '<svg class="mf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
            '<path data-mf-play-symbol d="M7 4v16l13 -8l-13 -8"/>' +
            '<g data-mf-pause-symbol><path d="M6 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12"/>' +
            '<path d="M14 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12"/></g></svg>';
    }
    function markup(instance) {
        return [
            '<div class="mf-intro">',
            '<div class="mf-heading-row"><span class="mf-family-badge" data-mf-badge>S</span><h3 class="mf-title" data-mf-title>SRAM Fail Mechanisms</h3></div>',
            '</div>',
            '<div class="mf-toolbar" role="group" aria-label="불량 메커니즘 선택">',
            '<span class="mf-toolbar-label">Memory Type</span>',
            '<div class="mf-family-tabs" role="group" aria-label="Memory Type">',
            '<button type="button" data-mf-family="DRAM" aria-pressed="false">DRAM (8)</button>',
            '<button type="button" data-mf-family="SRAM" aria-pressed="true">SRAM (8)</button></div>',
            '<span class="mf-toolbar-divider" aria-hidden="true"></span>',
            '<div class="mf-case-select-wrap"><label class="mf-toolbar-label" id="mf-case-label-' + instance + '" for="mf-case-select">Failure Mechanism</label>',
            '<div class="mf-case-picker" data-mf-picker>',
            '<button type="button" class="mf-case-select" id="mf-case-select" data-mf-select role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="mf-case-options-' + instance + '" aria-labelledby="mf-case-label-' + instance + ' mf-selected-title-' + instance + ' mf-selected-english-' + instance + '">',
            '<span class="mf-option-number" data-mf-selected-number aria-hidden="true">01</span>',
            '<span class="mf-option-copy"><span class="mf-option-title" id="mf-selected-title-' + instance + '" data-mf-selected-title></span><span class="mf-option-english" id="mf-selected-english-' + instance + '" data-mf-selected-english></span></span>',
            '<span class="mf-picker-chevron" aria-hidden="true">' + icon('chevron-right') + '</span></button>',
            '<div class="mf-case-menu" data-mf-menu hidden><div class="mf-case-menu-head"><span data-mf-menu-family>SRAM</span><span data-mf-menu-count>8 mechanisms</span></div>',
            '<div class="mf-case-options" id="mf-case-options-' + instance + '" data-mf-options role="listbox" aria-label="Failure Mechanism"></div></div>',
            '</div></div>',
            '<div class="mf-case-pager"><span class="mf-case-count" data-mf-case-count>1 / 8</span>',
            iconButton('previous-case', '이전 메커니즘', 'arrow-left'), iconButton('next-case', '다음 메커니즘', 'arrow-right'),
            '</div></div>',
            '<div class="mf-case">',
            '<div class="mf-case-heading"><span class="mf-category">' + icon('file-description') + '<span data-mf-category></span></span>',
            '<div class="mf-case-heading-copy"><h4 class="mf-case-title" data-mf-case-title><span data-mf-case-title-ko></span> <span class="mf-case-title-english" data-mf-case-title-en></span></h4><p class="mf-case-subtitle" data-mf-subtitle></p></div>',
            '<div class="mf-submodes" data-mf-submodes role="group" aria-label="오류 유형" hidden>',
            '<button type="button" data-mf-mode="hard" aria-pressed="true">Hard</button><button type="button" data-mf-mode="soft" aria-pressed="false">Soft</button></div></div>',
            '<div class="mf-comparison">',
            '<figure class="mf-cell" data-side="normal"><figcaption class="mf-cell-head"><span class="mf-cell-name">정상 셀 <span class="mf-cell-en" data-mf-normal-en>(Normal Cell)</span>' + iconButton('zoom-normal', '정상 셀 회로 확대', 'zoom-in') + '</span><span class="mf-cell-state" data-mf-normal-state></span></figcaption>',
            '<div class="mf-diagram-scroll" data-mf-circuit="normal" tabindex="0" role="group" aria-label="정상 셀 회로, 좁은 화면에서는 좌우로 스크롤"></div>',
            '<p class="mf-cell-detail" data-mf-normal-detail></p></figure>',
            '<figure class="mf-cell" data-side="vulnerable"><figcaption class="mf-cell-head"><span class="mf-cell-name"><span data-mf-vulnerable-name>취약 셀</span><span class="mf-cell-en" data-mf-vulnerable-en>(Vulnerable Cell)</span>' + iconButton('zoom-vulnerable', '취약 셀 회로 확대', 'zoom-in') + '</span><span class="mf-cell-state" data-mf-vulnerable-state></span></figcaption>',
            '<div class="mf-diagram-scroll" data-mf-circuit="vulnerable" tabindex="0" role="group" aria-label="취약 셀 회로, 좁은 화면에서는 좌우로 스크롤"></div>',
            '<p class="mf-cell-detail" data-mf-vulnerable-detail></p></figure></div>',
            '<p class="mf-mobile-hint">회로를 좌우로 움직여 보거나 확대 버튼으로 자세히 볼 수 있습니다.</p>',
            '<div class="mf-wave-panel"><div data-mf-wave></div>',
            '<div class="mf-phase-nav" data-mf-phases role="group" aria-label="애니메이션 단계"></div>',
            '<div class="mf-player">',
            '<button type="button" class="mf-play" data-mf-action="play" aria-label="동기 재생" aria-pressed="false"><span class="mf-play-disc" data-mf-play-icon>' + playerIcon() + '</span><span data-mf-play-label>동기 재생</span></button>',
            '<select class="mf-speed" data-mf-speed aria-label="재생 속도"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select>',
            '<div class="mf-timeline"><label class="mf-sr-only" for="mf-progress">애니메이션 진행</label><input class="mf-progress" id="mf-progress" data-mf-progress type="range" min="0" max="1000" step="1" value="580" aria-label="애니메이션 진행"><span class="mf-phase-label" data-mf-phase-label></span></div>',
            '<span class="mf-phase-count" data-mf-phase-count></span><div class="mf-stepper">',
            iconButton('previous-phase', '이전 단계', 'arrow-left'), iconButton('next-phase', '다음 단계', 'arrow-right'), '</div>',
            iconButton('replay', '처음부터 재생', 'rotate-clockwise', 'mf-replay'), '</div></div></div>',
            '<div class="mf-summary">',
            '<article><h5><span class="mf-summary-number">1</span>원인 <span>(Physical Cause)</span></h5><p data-mf-cause></p></article>',
            '<article><h5><span class="mf-summary-number">2</span>상태 변화 <span>(State Change)</span></h5>',
            '<div class="mf-state-line"><span class="mf-state-label">정상 셀</span><span data-mf-state-normal></span></div>',
            '<div class="mf-state-line is-fault" data-mf-state-fault-row><span class="mf-state-label" data-mf-state-fault-label>취약 셀</span><span data-mf-state-fault></span></div>',
            '</article>',
            '<article><h5><span class="mf-summary-number">3</span>결과 <span>(Result)</span></h5><p data-mf-result></p></article></div>',
            '<div class="mf-mitigation"><span class="mf-mitigation-title">개선 방법</span><p class="mf-mitigation-copy" data-mf-remedy></p>',
            '<label class="mf-switch-label"><span><span data-mf-remedy-label></span> 비교</span><input class="mf-switch" data-mf-mitigation type="checkbox" role="switch" aria-label="개선 방법 적용 비교"></label></div>',
            '<details class="mf-references" id="memory-fail-concepts' + (instance ? '-' + instance : '') + '" data-mf-concept-panel><summary>' + icon('book') + '<span>개념 설명과 참고 자료</span><span class="mf-concept-summary-hint">동작 흐름 · 상태 비교</span><span class="mf-concept-chevron">' + icon('chevron-right') + '</span></summary>',
            '<div class="mf-concepts" data-mf-concept><p data-mf-concept-fallback></p></div></details>',
            '<p class="mf-sr-only" role="status" aria-live="polite" data-mf-live></p>',
            '<dialog class="mf-dialog" data-mf-dialog aria-labelledby="mf-dialog-title"><div class="mf-dialog-head"><div><h4 id="mf-dialog-title"></h4><p class="mf-dialog-state" data-mf-dialog-state></p></div>',
            iconButton('close-zoom', '확대 회로 닫기', 'x'), '</div><div class="mf-dialog-circuit" data-mf-dialog-circuit></div><p class="mf-dialog-caption">현재 시점의 회로 상태입니다. 닫은 뒤 재생하거나 타임라인을 움직여 다음 상태를 확인할 수 있습니다.</p></dialog>'
        ].join('');
    }

    function init(root, instance) {
        if (root.dataset.mfReady === 'true') return;
        root.dataset.mfReady = 'true';
        root.innerHTML = markup(instance);
        const query = function (selector) { return root.querySelector(selector); };
        const controls = {
            select: query('[data-mf-select]'), picker: query('[data-mf-picker]'), menu: query('[data-mf-menu]'), options: query('[data-mf-options]'),
            progress: query('[data-mf-progress]'), speed: query('[data-mf-speed]'),
            mitigation: query('[data-mf-mitigation]'), play: query('[data-mf-action="play"]'),
            normalContainer: query('[data-mf-circuit="normal"]'), vulnerableContainer: query('[data-mf-circuit="vulnerable"]'),
            dialog: query('[data-mf-dialog]'), phaseNav: query('[data-mf-phases]'), wave: query('[data-mf-wave]'), conceptPanel: query('[data-mf-concept-panel]')
        };
        const conceptView = concepts ? concepts.create(query('[data-mf-concept]'), model, icon) : null;
        const remembered = { DRAM: 'dram-retention', SRAM: 'sram-read-upset' };
        const requested = new URLSearchParams(location.search).get('failure');
        let id = model.getLesson(requested) ? requested : 'sram-read-upset';
        let lesson = model.getLesson(id);
        let progress = 0.58;
        let mitigation = false;
        let mode = 'hard';
        let running = false;
        let speed = 1;
        let interactedWithTime = false;
        let raf = 0;
        let lastTime = 0;
        let normalDiagram;
        let vulnerableDiagram;
        let lastPhase = -1;
        let zoomTrigger;
        let pickerOpen = false;
        let pickerActiveIndex = 0;
        let pickerSearch = '';
        let pickerSearchAt = 0;
        const duration = 10000;
        const textCache = new Map();

        function setText(selector, value) {
            const text = String(value);
            if (textCache.get(selector) === text) return;
            textCache.set(selector, text);
            const node = query(selector);
            if (node) node.textContent = text;
        }
        function familyList() { return model.lessons.filter(function (item) { return item.family === lesson.family; }); }
        function announce(value) { setText('[data-mf-live]', value); }
        function closeCasePicker(restoreFocus) {
            pickerOpen = false;
            controls.menu.hidden = true;
            controls.select.setAttribute('aria-expanded', 'false');
            controls.select.removeAttribute('aria-activedescendant');
            pickerSearch = '';
            if (restoreFocus) controls.select.focus({ preventScroll: true });
        }
        function positionCasePicker() {
            if (!pickerOpen) return;
            const rect = controls.select.getBoundingClientRect();
            let viewTop = 12, viewBottom = window.innerHeight - 12;
            try {
                if (window.frameElement && window.parent !== window) {
                    const frame = window.frameElement.getBoundingClientRect();
                    const header = window.parent.document.querySelector('header');
                    viewTop = Math.max(12, (header ? header.getBoundingClientRect().bottom : 0) + 12 - frame.top);
                    viewBottom = Math.min(viewBottom, window.parent.innerHeight - frame.top - 12);
                }
            } catch (_) { /* Cross-origin embeds use the local viewport. */ }
            if (rect.bottom < viewTop || rect.top > viewBottom) { closeCasePicker(false); return; }
            const below = viewBottom - rect.bottom - 7;
            const above = rect.top - viewTop - 7;
            const upward = below < 280 && above > below;
            controls.menu.dataset.placement = upward ? 'top' : 'bottom';
            controls.menu.style.setProperty('--mf-menu-height', Math.max(120, Math.min(490, upward ? above : below)) + 'px');
        }
        function setPickerActive(index) {
            const options = Array.from(controls.options.children);
            pickerActiveIndex = model.clamp(index, 0, options.length - 1);
            options.forEach(function (option, i) { option.dataset.active = String(i === pickerActiveIndex); });
            const active = options[pickerActiveIndex];
            if (!active) return;
            controls.select.setAttribute('aria-activedescendant', active.id);
            // Scroll only the option list; scrolling a descendant into view can
            // otherwise recenter the book on its entire embedded chapter.
            if (active.offsetTop < controls.options.scrollTop) controls.options.scrollTop = active.offsetTop;
            else if (active.offsetTop + active.offsetHeight > controls.options.scrollTop + controls.options.clientHeight) {
                controls.options.scrollTop = active.offsetTop + active.offsetHeight - controls.options.clientHeight;
            }
        }
        function openCasePicker() {
            stop();
            pickerOpen = true;
            pickerSearch = '';
            controls.menu.hidden = false;
            controls.select.setAttribute('aria-expanded', 'true');
            positionCasePicker();
            if (pickerOpen) setPickerActive(familyList().findIndex(function (item) { return item.id === id; }));
        }
        function commitCasePicker() {
            const next = familyList()[pickerActiveIndex];
            closeCasePicker(false);
            if (next && next.id !== id) selectCase(next.id, true);
            controls.select.focus({ preventScroll: true });
        }
        function refreshCasePicker(list, selectedIndex) {
            controls.select.value = id;
            controls.select.title = lesson.title + ' · ' + lesson.english;
            setText('[data-mf-selected-number]', String(selectedIndex + 1).padStart(2, '0'));
            setText('[data-mf-selected-title]', lesson.title);
            setText('[data-mf-selected-english]', lesson.english);
            setText('[data-mf-menu-family]', lesson.family);
            setText('[data-mf-menu-count]', list.length + ' mechanisms');
            controls.options.innerHTML = list.map(function (item, index) {
                return '<div class="mf-case-option" id="mf-case-option-' + instance + '-' + index + '" role="option" aria-selected="' + String(item.id === id) + '" data-mf-option="' + item.id + '" data-mf-option-index="' + index + '">' +
                    '<span class="mf-option-number" aria-hidden="true">' + String(index + 1).padStart(2, '0') + '</span>' +
                    '<span class="mf-option-copy"><span class="mf-option-title">' + esc(item.title) + '</span><span class="mf-option-english">' + esc(item.english) + '</span></span>' +
                    '<span class="mf-option-check" aria-hidden="true">' + icon('check') + '</span></div>';
            }).join('');
        }
        function stop() {
            running = false;
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            lastTime = 0;
            updatePlayControl();
        }
        function updatePlayControl() {
            controls.play.setAttribute('aria-pressed', String(running));
            controls.play.setAttribute('aria-label', running ? '일시 정지' : progress >= 1 ? '다시 재생' : '동기 재생');
            setText('[data-mf-play-label]', running ? '일시 정지' : progress >= 1 ? '다시 재생' : '동기 재생');
            root.dataset.playing = String(running);
        }
        function start(restart) {
            if (restart || progress >= 1 || !interactedWithTime) progress = 0;
            interactedWithTime = true;
            running = true;
            lastTime = 0;
            updatePlayControl();
            render();
            if (!raf) raf = requestAnimationFrame(tick);
        }
        function tick(now) {
            raf = 0;
            if (!running) return;
            if (lastTime) progress = model.clamp(progress + Math.min(100, now - lastTime) * speed / duration, 0, 1);
            lastTime = now;
            render();
            if (progress >= 1) {
                stop();
                announce(lesson.title + ' 재생 완료. ' + model.sample(id, progress, mitigation, mode).vulnerable.status);
            } else raf = requestAnimationFrame(tick);
        }
        function seek(p, shouldAnnounce) {
            stop();
            interactedWithTime = true;
            progress = model.clamp(p, 0, 1);
            render();
            updatePlayControl();
            if (shouldAnnounce) announce(lesson.title + ' · ' + lesson.phases[model.phaseAt(progress)]);
        }
        const waveView = window.ChipBookWaveform ? window.ChipBookWaveform.create(controls.wave, {
            onSeek: function (p) { seek(p, false); },
            onInteraction: stop,
            getProgress: function () { return progress; },
            onSourceChange: function (kind) { stop(); root.dataset.waveSource = kind; }
        }) : null;
        function createWave() {
            if (waveView) waveView.setModel(window.ChipBookWaveformCore.modelSource(model, lesson, mitigation, mode), progress);
            else controls.wave.textContent = '파형 분석 도구를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
        }
        function render() {
            const state = model.sample(id, progress, mitigation, mode);
            normalDiagram.update(state.normal, progress, state);
            vulnerableDiagram.update(state.vulnerable, progress, state);
            controls.progress.value = String(Math.round(progress * 1000));
            const phase = state.phase;
            root.dataset.mechanism = id;
            root.dataset.progress = progress.toFixed(4);
            root.dataset.phase = String(phase + 1);
            root.dataset.mitigation = String(mitigation);
            root.dataset.mode = mode;
            setText('[data-mf-normal-state]', state.normal.status);
            setText('[data-mf-vulnerable-state]', state.vulnerable.status);
            setText('[data-mf-normal-detail]', state.normal.detail);
            setText('[data-mf-vulnerable-detail]', state.vulnerable.detail);
            setText('[data-mf-state-normal]', state.normal.status);
            setText('[data-mf-state-fault]', state.vulnerable.status);
            setText('[data-mf-phase-label]', lesson.phases[phase]);
            setText('[data-mf-phase-count]', String(phase + 1) + ' / 5');
            if (conceptView) conceptView.update(state);
            controls.progress.setAttribute('aria-valuetext', String(Math.round(progress * 100)) + '%, ' + lesson.phases[phase]);
            query('[data-mf-action="previous-phase"]').disabled = progress <= 0;
            query('[data-mf-action="next-phase"]').disabled = progress >= 1;
            if (lastPhase !== phase) {
                controls.phaseNav.querySelectorAll('[data-mf-phase]').forEach(function (button) {
                    if (Number(button.dataset.mfPhase) === phase) button.setAttribute('aria-current', 'step');
                    else button.removeAttribute('aria-current');
                });
                lastPhase = phase;
            }
            if (waveView) waveView.updateProgress(progress);
        }
        function refreshCopy() {
            setText('[data-mf-badge]', lesson.family[0]);
            setText('[data-mf-title]', lesson.family + ' Fail Mechanisms');
            setText('[data-mf-category]', lesson.category);
            setText('[data-mf-case-title-ko]', lesson.title);
            setText('[data-mf-case-title-en]', lesson.english);
            setText('[data-mf-subtitle]', lesson.subtitle);
            setText('[data-mf-cause]', lesson.shortCause);
            setText('[data-mf-result]', lesson.shortResult);
            setText('[data-mf-threshold-label]', lesson.thresholdLabel);
            const softMode = id === 'dram-hard-soft' && mode === 'soft';
            setText('[data-mf-remedy-label]', softMode ? 'ECC·Scrub' : lesson.mitigation);
            setText('[data-mf-remedy]', softMode ? '이 예의 교정 가능한 데이터 오류는 ECC로 판독값을 먼저 보정하고, 올바른 값의 재기록으로 저장 셀을 복구합니다.' : lesson.remedy);
            setText('[data-mf-vulnerable-name]', mitigation ? '개선 적용 셀' : id === 'sram-aging' ? '열화 셀' : '취약 셀');
            setText('[data-mf-normal-en]', id === 'sram-aging' ? '(Fresh)' : '(Normal Cell)');
            setText('[data-mf-vulnerable-en]', mitigation ? '(Improved)' : id === 'sram-aging' ? '(Stressed)' : '(Vulnerable Cell)');
            setText('[data-mf-legend-label]', mitigation ? '취약 셀 · 개선' : '취약 셀');
            setText('[data-mf-state-fault-label]', mitigation ? '개선 셀' : '취약 셀');
            query('[data-mf-state-fault-row]').className = 'mf-state-line ' + (mitigation ? 'is-protected' : 'is-fault');
            query('.mf-cell[data-side="vulnerable"]').dataset.protected = String(mitigation);
            controls.mitigation.setAttribute('aria-label', (softMode ? 'ECC·Scrub' : lesson.mitigation) + ' 적용 비교');
            query('[data-mf-submodes]').hidden = id !== 'dram-hard-soft';
            root.querySelectorAll('[data-mf-mode]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.mfMode === mode)); });
            if (conceptView) conceptView.setLesson(lesson, mitigation, mode);
            else setText('[data-mf-concept-fallback]', lesson.shortCause + ' ' + lesson.shortResult);
        }
        function selectCase(nextId, announceChange) {
            closeCasePicker(false);
            stop();
            const next = model.getLesson(nextId);
            if (!next) return;
            id = nextId;
            lesson = next;
            remembered[lesson.family] = id;
            progress = lesson.preview;
            mitigation = false;
            mode = 'hard';
            interactedWithTime = false;
            lastPhase = -1;
            controls.mitigation.checked = false;
            const list = familyList();
            const index = list.findIndex(function (item) { return item.id === id; });
            refreshCasePicker(list, index);
            setText('[data-mf-case-count]', String(index + 1) + ' / ' + list.length);
            query('[data-mf-action="previous-case"]').disabled = index === 0;
            query('[data-mf-action="next-case"]').disabled = index === list.length - 1;
            root.querySelectorAll('[data-mf-family]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.mfFamily === lesson.family)); });
            controls.phaseNav.innerHTML = lesson.phases.map(function (phase, index) {
                return '<button type="button" data-mf-phase="' + index + '" aria-label="' + (index + 1) + '단계 ' + esc(phase) + '">' + esc(phase) + '</button>';
            }).join('');
            normalDiagram = diagrams.create(lesson, controls.normalContainer, 'normal', instance + '-normal');
            vulnerableDiagram = diagrams.create(lesson, controls.vulnerableContainer, 'vulnerable', instance + '-vulnerable');
            controls.normalContainer.scrollLeft = 0;
            controls.vulnerableContainer.scrollLeft = 0;
            refreshCopy();
            createWave();
            render();
            updatePlayControl();
            if (announceChange) announce(lesson.family + ', ' + lesson.title + ' 선택됨. 동기 재생으로 전체 과정을 볼 수 있습니다.');
        }
        function positionDialog() {
            let top = 24;
            let height = window.innerHeight - 48;
            try {
                if (window.frameElement && window.parent !== window) {
                    const frame = window.frameElement.getBoundingClientRect();
                    const header = window.parent.document.querySelector('header');
                    const toc = window.parent.document.querySelector('[data-page-toc-shell]');
                    const safeTop = Math.max(20, (header ? header.getBoundingClientRect().bottom : 0) + 14, (toc ? toc.getBoundingClientRect().bottom : 0) + 12);
                    top = Math.max(16, -frame.top + safeTop);
                    height = Math.min(window.innerHeight - top - 16, window.parent.innerHeight - safeTop - 20);
                }
            } catch (_) { /* A standalone or cross-origin embed uses its local viewport. */ }
            controls.dialog.style.setProperty('--mf-dialog-top', top + 'px');
            controls.dialog.style.setProperty('--mf-dialog-height', Math.max(220, height) + 'px');
        }
        function openZoom(side, button) {
            stop();
            zoomTrigger = button;
            const state = model.sample(id, progress, mitigation, mode);
            const sideState = state[side];
            query('#mf-dialog-title').textContent = lesson.title + ' · ' + (side === 'normal' ? '정상 셀' : mitigation ? '개선 적용 셀' : '취약 셀');
            query('[data-mf-dialog-state]').textContent = lesson.phases[state.phase] + ' / ' + sideState.status;
            const drawing = diagrams.create(lesson, query('[data-mf-dialog-circuit]'), side, instance + '-zoom');
            drawing.update(sideState, progress, state);
            positionDialog();
            controls.dialog.showModal();
            query('[data-mf-action="close-zoom"]').focus({ preventScroll: true });
        }
        // Keep focusing a control inside a tall embedded chapter from recentering
        // the parent on the entire iframe. Native input/drag behavior is retained.
        root.addEventListener('pointerdown', function (event) {
            const control = event.target.closest('button, input, select, summary, [tabindex]');
            if (control && root.contains(control) && document.activeElement !== control) {
                control.focus({ preventScroll: true });
            }
        });
        root.addEventListener('click', function (event) {
            const option = event.target.closest('[data-mf-option]');
            if (option && controls.options.contains(option)) {
                pickerActiveIndex = Number(option.dataset.mfOptionIndex);
                commitCasePicker();
                return;
            }
            const button = event.target.closest('button');
            if (!button || !root.contains(button)) return;
            if (button === controls.select) {
                if (pickerOpen) closeCasePicker(false);
                else openCasePicker();
                return;
            }
            if (button.dataset.mfFamily) {
                if (button.dataset.mfFamily !== lesson.family) selectCase(remembered[button.dataset.mfFamily], true);
                return;
            }
            if (button.dataset.mfMode) {
                if (button.dataset.mfMode === mode) return;
                stop(); mode = button.dataset.mfMode; mitigation = false; progress = 0; controls.mitigation.checked = false;
                interactedWithTime = false; refreshCopy(); createWave(); render(); updatePlayControl();
                announce(mode === 'soft' ? 'Soft 오류, 데이터 재기록으로 회복되는 경우' : 'Hard 오류, 재기록해도 남는 물리적 결함');
                return;
            }
            if (button.hasAttribute('data-mf-phase')) { seek(model.phaseStops[Number(button.dataset.mfPhase)], true); return; }
            const action = button.dataset.mfAction;
            if (action === 'play') { if (running) stop(); else start(false); }
            else if (action === 'replay') { stop(); start(true); }
            else if (action === 'previous-phase' || action === 'next-phase') {
                const epsilon = 0.002;
                const stops = action === 'next-phase' ? model.phaseStops.filter(function (t) { return t > progress + epsilon; }) :
                    model.phaseStops.filter(function (t) { return t < progress - epsilon; }).reverse();
                seek(stops.length ? stops[0] : action === 'next-phase' ? 1 : 0, true);
            } else if (action === 'previous-case' || action === 'next-case') {
                const list = familyList(), current = list.findIndex(function (item) { return item.id === id; });
                const next = list[current + (action === 'next-case' ? 1 : -1)];
                if (next) selectCase(next.id, true);
            } else if (action === 'zoom-normal' || action === 'zoom-vulnerable') openZoom(action.replace('zoom-', ''), button);
            else if (action === 'close-zoom') controls.dialog.close();
        });
        controls.select.addEventListener('keydown', function (event) {
            const key = event.key;
            if (key === 'Tab') { if (pickerOpen) commitCasePicker(); return; }
            if (key === 'Escape') {
                if (pickerOpen) { event.preventDefault(); event.stopPropagation(); closeCasePicker(true); }
                return;
            }
            if (['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
                event.preventDefault();
                event.stopPropagation();
                if (key === 'Enter' || key === ' ') {
                    if (pickerOpen) commitCasePicker();
                    else openCasePicker();
                } else if (key === 'Home' || key === 'End') {
                    if (!pickerOpen) openCasePicker();
                    setPickerActive(key === 'Home' ? 0 : familyList().length - 1);
                } else if (!pickerOpen) openCasePicker();
                else setPickerActive(pickerActiveIndex + (key === 'ArrowDown' ? 1 : -1));
                return;
            }
            if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
            event.preventDefault();
            event.stopPropagation();
            if (!pickerOpen) openCasePicker();
            const now = Date.now();
            pickerSearch = now - pickerSearchAt > 700 ? key : pickerSearch + key;
            pickerSearchAt = now;
            const list = familyList();
            const repeated = pickerSearch.split('').every(function (char) { return char === pickerSearch[0]; });
            const term = (repeated ? key : pickerSearch).toLocaleLowerCase();
            for (let step = 1; step <= list.length; step += 1) {
                const index = (pickerActiveIndex + step) % list.length;
                if ([list[index].title, list[index].english].some(function (label) { return label.toLocaleLowerCase().startsWith(term); })) {
                    setPickerActive(index);
                    break;
                }
            }
        });
        controls.menu.addEventListener('pointerdown', function (event) {
            if (event.pointerType === 'mouse' && event.target.closest('[data-mf-option], .mf-case-menu-head')) event.preventDefault();
        });
        controls.options.addEventListener('pointermove', function (event) {
            const option = event.target.closest('[data-mf-option]');
            if (pickerOpen && event.pointerType === 'mouse' && option && Number(option.dataset.mfOptionIndex) !== pickerActiveIndex) {
                setPickerActive(Number(option.dataset.mfOptionIndex));
            }
        });
        document.addEventListener('pointerdown', function (event) {
            if (pickerOpen && !controls.picker.contains(event.target)) closeCasePicker(false);
        });
        document.addEventListener('focusin', function (event) {
            if (pickerOpen && !controls.picker.contains(event.target)) closeCasePicker(false);
        });
        controls.progress.addEventListener('input', function () { seek(Number(controls.progress.value) / 1000, false); });
        controls.progress.addEventListener('change', function () { announce(lesson.phases[model.phaseAt(progress)]); });
        controls.conceptPanel.addEventListener('toggle', function () { if (controls.conceptPanel.open) render(); });
        controls.speed.addEventListener('change', function () { speed = Number(controls.speed.value); });
        controls.mitigation.addEventListener('change', function () {
            stop();
            mitigation = controls.mitigation.checked;
            progress = 0;
            interactedWithTime = true;
            refreshCopy(); createWave(); render(); updatePlayControl();
            announce((mitigation ? '개선 비교 적용. ' : '개선 비교 해제. ') + '같은 초기 상태에서 재생합니다.');
        });
        root.addEventListener('keydown', function (event) {
            // Prevent the book's arrow navigation from stealing sliders, selects, and local scrollers.
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)) event.stopPropagation();
        });
        controls.dialog.addEventListener('click', function (event) {
            if (event.target !== controls.dialog) return;
            const rect = controls.dialog.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) controls.dialog.close();
        });
        controls.dialog.addEventListener('close', function () {
            query('[data-mf-dialog-circuit]').replaceChildren();
            if (zoomTrigger && zoomTrigger.isConnected) zoomTrigger.focus({ preventScroll: true });
        });
        document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); closeCasePicker(false); } });
        window.addEventListener('pagehide', function () { stop(); closeCasePicker(false); });
        function positionOpenOverlays() {
            if (controls.dialog.open) positionDialog();
            if (pickerOpen) {
                positionCasePicker();
                if (pickerOpen) setPickerActive(pickerActiveIndex);
            }
        }
        window.addEventListener('resize', positionOpenOverlays);
        window.addEventListener('scroll', positionOpenOverlays, { passive: true });
        try {
            if (window.parent !== window) {
                window.parent.addEventListener('scroll', positionOpenOverlays, { passive: true });
                window.parent.addEventListener('resize', positionOpenOverlays);
                window.parent.document.addEventListener('pointerdown', function () { if (pickerOpen) closeCasePicker(false); });
            }
        } catch (_) { /* Cross-origin embeds use local dialog placement. */ }
        if (typeof IntersectionObserver === 'function') {
            const observer = new IntersectionObserver(function (entries) {
                if (!entries[0].isIntersecting) stop();
            }, { threshold: 0 });
            observer.observe(root);
        }
        selectCase(id, false);
        if (location.hash === '#memory-fail-mechanisms') {
            requestAnimationFrame(function () { root.scrollIntoView({ block: 'start' }); });
        } else if (location.hash === '#' + controls.conceptPanel.id) {
            controls.conceptPanel.open = true;
            requestAnimationFrame(function () { controls.conceptPanel.scrollIntoView({ block: 'start' }); });
        }
    }
    function boot() { document.querySelectorAll('[data-memory-fail-lab]').forEach(init); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
}());
