'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadBank() {
    const window = { GuidebookPage: { registerInitializer() {} } };
    const context = vm.createContext({ window });
    const read = name => fs.readFileSync(path.join(__dirname, '../assets/features', name), 'utf8');
    vm.runInContext(read('practice-data.js'), context);
    const originals = Object.values(window.ChipBookPracticeCatalog).flatMap(topic => topic.questions);
    const answers = new Map(originals.map(item => [item.id, item.choices[item.answerIndex]]));
    vm.runInContext(read('practice.js'), context);
    return { window, answers };
}

test('extracted practice catalog preserves 143 unique questions and correct answer text', () => {
    const { window, answers } = loadBank();
    assert.equal(window.practiceQuestionBank.length, 143);
    assert.equal(new Set(window.practiceQuestionBank.map(q => q.id)).size, 143);
    for (const q of window.practiceQuestionBank) {
        assert.equal(q.choices.length, 4);
        assert.equal(q.choices[q.answerIndex], answers.get(q.id), q.id);
    }
});

test('mock exam draws 20 unique current-bank questions', () => {
    const { window } = loadBank();
    for (let run = 0; run < 20; run++) {
        const questions = window.getRandomMockQuestions();
        assert.equal(questions.length, 20);
        assert.equal(new Set(questions.map(q => q.id)).size, 20);
        assert.ok(questions.every(q => window.getPracticeQuestionById(q.id)));
    }
});

test('answer balancing is deterministic and keeps option counts within one', () => {
    const a = loadBank().window.practiceQuestionBank;
    const b = loadBank().window.practiceQuestionBank;
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    const counts = [0, 0, 0, 0];
    a.forEach(q => counts[q.answerIndex]++);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
});
