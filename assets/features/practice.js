(() => {
    // Practice buttons and exam labels share one visual state contract.
    function setQuizChoiceState(element, state = '') {
        if (!element) return;
        ['selected', 'correct', 'wrong', 'muted'].forEach((name) => {
            element.classList.toggle(name, name === state);
        });
    }
    // --- Data Definitions (Compact to save space) ---
    const practiceTopicChipClassMap = {
        flow: 'practice-chip-topic-flow',
        digital: 'practice-chip-topic-digital',
        physical: 'practice-chip-topic-physical',
        memory: 'practice-chip-topic-memory'
    };

    const practiceQuestionCatalog = window.ChipBookPracticeCatalog;

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
            setQuizChoiceState(button);
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
            setQuizChoiceState(btn, idx === item.answerIndex ? 'correct' : idx === selectedIdx ? 'wrong' : 'muted');
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
    let mockDeadline = 0;
    let mockSubmitted = true;
    let mockActive = true;
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

    function stopMockClock() { clearInterval(mockTimer); mockTimer = 0; }
    function tickMockClock() {
        if (mockSubmitted || !mockDeadline) return;
        mockTimeLeft = Math.max(0, Math.ceil((mockDeadline - Date.now()) / 1000));
        updateMockTimerDisplay();
        if (!mockTimeLeft) window.submitMockExam(true);
    }
    function resumeMockClock() {
        stopMockClock();
        if (mockSubmitted || !mockActive) return;
        tickMockClock();
        if (!mockSubmitted) mockTimer = setInterval(tickMockClock, 1000);
    }

    function renderSavedMistakes() {
        const root = document.querySelector('[data-practice-mistakes]');
        if (!root) return;
        let ids = [];
        try { ids = JSON.parse(localStorage.getItem('chipbook.practice.wrong') || '[]'); } catch {}
        const wrong = practiceQuestionBank.filter(question => ids.includes(question.id));
        root.innerHTML = wrong.length ? wrong.map(question => `<details class="review-question"><summary>${question.id} · ${question.stem}</summary><p><strong>정답:</strong> ${question.choices[question.answerIndex]}</p><p>${question.explanation}</p></details>`).join('') : '<p>시험에서 틀린 문제를 제출하면 이곳에서 해설과 함께 복습할 수 있습니다.</p>';
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
                                <input type="radio" name="mock-${index}" value="${choiceIndex}" onchange="selectMockAns(${index}, ${choiceIndex})" class="sr-only">
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
        mockDeadline = Date.now() + MOCK_EXAM_DURATION_SECONDS * 1000;
        mockSubmitted = false;
        stopMockClock();
        updateMockTimerDisplay();

        document.getElementById('mock-start-screen').classList.add('hidden');
        document.getElementById('mock-exam-container').classList.remove('hidden');
        document.getElementById('mock-submit-btn').classList.remove('hidden');
        document.getElementById('mock-result-screen').classList.add('hidden');
        document.getElementById('score-display').innerText = '';

        renderMockExamQuestions();

        resumeMockClock();
        window.GuidebookPage.notifyHeight?.();
        window.GuidebookPage.scrollToElement?.(document.getElementById('mock-exam-container'));
    };

    window.selectMockAns = function(qIdx, selectedIdx) {
        mockUserAnswers[qIdx] = selectedIdx;
        currentMockQuestions[qIdx].choices.forEach((_, idx) => {
            const lbl = document.getElementById(`mock-lbl-${qIdx}-${idx}`);
            setQuizChoiceState(lbl, idx === selectedIdx ? 'selected' : '');
        });
    };

    window.submitMockExam = function(forceSubmit = false) {
        if (!currentMockQuestions.length || mockSubmitted) return;
        if (!forceSubmit && mockUserAnswers.includes(null)) {
            if (!confirm('아직 풀지 않은 문제가 있습니다. 그래도 제출하시겠습니까?')) return;
        }

        mockSubmitted = true;
        stopMockClock();
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
                    setQuizChoiceState(document.getElementById(`mock-lbl-${index}-${userAns}`), 'wrong');
                }
            }

            const correctLbl = document.getElementById(`mock-lbl-${index}-${question.answerIndex}`);
            setQuizChoiceState(correctLbl, 'correct');

            qBox.querySelectorAll('input').forEach((input) => input.disabled = true);
            qBox.querySelectorAll('label').forEach((label) => label.setAttribute('aria-disabled', 'true'));
        });

        document.getElementById('score-display').innerText = `${score} 점`;
        const wrongIds = currentMockQuestions.filter((question,index) => mockUserAnswers[index] !== question.answerIndex).map(question => question.id);
        const byTopic = Object.entries(practiceTopicMeta).map(([topic,meta]) => {
            const indices = currentMockQuestions.map((question,index) => question.topic === topic ? index : -1).filter(index => index >= 0);
            const correct = indices.filter(index => mockUserAnswers[index] === currentMockQuestions[index].answerIndex).length;
            return { topic, label: meta.label, correct, total: indices.length };
        });
        try {
            localStorage.setItem('chipbook.practice.wrong', JSON.stringify(wrongIds));
            const history = JSON.parse(localStorage.getItem('chipbook.exam.history') || '[]');
            history.push({ at: new Date().toISOString(), score, wrongIds, byTopic });
            localStorage.setItem('chipbook.exam.history', JSON.stringify(history.slice(-20)));
        } catch {}
        const result = document.getElementById('mock-result-screen');
        result.querySelector('[data-exam-breakdown]')?.remove();
        const breakdown = document.createElement('div');
        breakdown.dataset.examBreakdown = '';
        const topicChapters = {flow:2,digital:3,physical:4,memory:5};
        breakdown.innerHTML = `<h3>주제별 결과와 복습 경로</h3><div class="guidebook-scroll-region"><table class="modern-table"><thead><tr><th>주제</th><th>정답 / 출제</th><th>관련 학습</th></tr></thead><tbody>${byTopic.map(row => `<tr><td>${row.label}</td><td>${row.correct} / ${row.total}</td><td><a target="_top" href="../index.html?chapter=${topicChapters[row.topic]}">${topicChapters[row.topic]}장으로 이동</a></td></tr>`).join('')}</tbody></table></div><p>이 시험은 기존 객관식 ${practiceQuestionBank.length}문제에서 출제합니다. 확장된 전체 과정은 27장의 절별 복습 질문으로 함께 확인하세요.</p><a target="_top" href="../index.html?chapter=27&section=section-04">오답 해설 복습</a>`;
        result.append(breakdown);
        window.GuidebookPage.notifyHeight?.();
        window.GuidebookPage.scrollToElement?.(document.getElementById('mock-result-screen'));
    };

    window.GuidebookPage.registerInitializer(() => {
        if (document.getElementById('practice-topic-filter')) initPracticeQuestionBank();
        renderSavedMistakes();
        if (document.getElementById('mock-exam-container')) window.GuidebookPage.registerLifecycle({
            root: document.body,
            start: () => { mockActive = true; resumeMockClock(); },
            stop: () => { mockActive = false; stopMockClock(); },
            destroy: stopMockClock,
        });
        if (document.querySelector('[data-practice-mistakes]')) window.GuidebookPage.registerLifecycle({
            root: document.body, start: renderSavedMistakes,
        });
        updateMockTimerDisplay();
    });
})();
