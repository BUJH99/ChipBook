const { test, expect } = require('@playwright/test');
const { openBook, openChapter, openSection } = require('./helpers.cjs');
const registry = require('../../src/app/page-registry.json');

test('registered chapters expose their labels and stay within the viewport', async ({ page }, info) => {
    test.setTimeout(180000);
    const errors = await openBook(page, info);
    for (const definition of registry.pages) {
        const chapter = await openChapter(page, definition.number);
        await expect(chapter.locator('.section-title, .curriculum-chapter-head h1').first()).toBeVisible();
        if (definition.tocMode === 'action') {
            const first = definition.sections[0];
            await expect(page.locator(`[data-toc-key="${first.key}"]`)).toContainText(first.tocTitle || first.title);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        expect(await chapter.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.screenshot({ path: info.outputPath('chapters-checked.png') });
    expect(errors).toEqual([]);
});

test('bus waveform controls and AXI actions remain functional after modularization', async ({ page }, info) => {
    const errors = await openBook(page, info);
    const chapter = await openChapter(page, 8);
    await openSection(page, 'apb');
    await expect(chapter.locator('#WaveDrom_Display_0 svg')).toBeVisible();
    await openSection(page, 'ahb');
    await expect(chapter.locator('#WaveDrom_Display_1 svg')).toBeVisible();
    await openSection(page, 'axi-full');
    await expect(chapter.locator('#WaveDrom_Display_7 svg')).toBeVisible();
    await chapter.locator('[data-bus-action="runOutstanding"]').click();
    await openSection(page, 'amba');
    await page.screenshot({ path: info.outputPath('bus-checked.png') });
    expect(errors).toEqual([]);
});

test('all live UVM documents report enough height for their visible content', async ({ page }, info) => {
    test.setTimeout(180000);
    const errors = await openBook(page, info);
    const chapter = await openChapter(page, 7);
    const legacyKeys = await chapter.locator('[data-page7-panel]').evaluateAll(nodes => nodes.map(node => node.dataset.page7Panel));
    expect(legacyKeys).toHaveLength(15);
    for (const key of legacyKeys) {
        await openSection(page, key);
        const iframe = chapter.locator(`[data-page7-panel="${key}"] iframe`);
        await expect.poll(() => iframe.evaluate(element => parseFloat(element.style.height) || 0)).toBeGreaterThan(600);
        const child = await iframe.elementHandle().then(handle => handle.contentFrame());
        await expect.poll(async () => {
            const bottom = await child.evaluate(() => Math.max(document.body.offsetHeight,
                ...Array.from(document.body.querySelectorAll('*')).filter(node => node.getClientRects().length)
                    .map(node => node.getBoundingClientRect().bottom + scrollY)));
            const frameHeight = await iframe.evaluate(element => parseFloat(element.style.height));
            return bottom <= frameHeight + 2;
        }).toBe(true);
    }
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath('uvm-documents-checked.png') });
});
