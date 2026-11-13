const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { expect } = require('@playwright/test');
const root = path.resolve(__dirname, '../..');
const registry = require('../../src/app/page-registry.json');
async function openBook(page, testInfo) {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const url = testInfo.project.name === 'file'
        ? pathToFileURL(path.join(root, '.artifacts/site/index.html')).href
        : 'http://127.0.0.1:8766/';
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#toc-nav [data-go-page]')).toHaveCount(registry.pages.length);
    // The first chapter also waits for its existing blocking CDN head scripts.
    await expect(page.locator('[data-page-toc-nav] button').first()).toBeAttached({ timeout: 45000 });
    return errors;
}
async function openChapter(page, number) {
    const metadata = registry.pages.find(chapter => chapter.number === number);
    if (!metadata) throw new Error(`Missing chapter ${number}`);
    const button = page.locator(`#toc-nav [data-go-page]`).filter({ hasText: new RegExp(`^\\s*(?:[^0-9]*)0?${number}\\s`) });
    if (await button.isVisible()) await button.click();
    else {
        await page.locator('[data-chapter-input]').fill(String(number));
        await page.locator('[data-chapter-input]').press('Enter');
    }
    await expect(page.locator('.page-section.active')).toHaveAttribute('id', metadata.id);
    const frame = await page.locator(`iframe[data-page-id="${metadata.id}"]`).elementHandle().then(handle => handle.contentFrame());
    // Existing chapters have blocking third-party head scripts. A cold CDN
    // redirect can exceed the shorter assertion timeout before body parsing.
    await expect(frame.locator('body')).toHaveAttribute('data-page-id', metadata.id, { timeout: 45000 });
    await expect.poll(() => frame.evaluate(() => window.GuidebookPage?.isPageActive())).toBe(true);
    return frame;
}
async function openSection(page, key) {
    const id = await page.locator('.page-section.active').getAttribute('id');
    const metadata = registry.pages.find(chapter => chapter.id === id);
    const canonical = metadata.sectionAliases?.[key] || key;
    const toggle = page.locator('[data-page-toc-toggle]');
    if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
    await page.locator(`[data-toc-key="${canonical}"]`).click();
    await expect(page.locator(`[data-toc-key="${canonical}"]`)).toHaveClass(/is-active/);
    const frame = await page.locator(`iframe[data-page-id="${id}"]`).elementHandle().then(handle => handle.contentFrame());
    const legacy = frame.locator(`[data-legacy-key="${key}"]`);
    if (await legacy.count()) {
        if (id === 'page-7') {
            for (const other of await frame.locator(`.curriculum-legacy[open]:visible:not([data-legacy-key="${key}"])`).all()) await other.locator(':scope > summary').click();
        }
        if (await legacy.getAttribute('open') === null) await legacy.locator(':scope > summary').click();
    }
}
async function heightMessageCount(page, pageId, duration = 1200) {
    return page.evaluate(({ pageId, duration }) => new Promise(resolve => {
        let count = 0;
        const receive = event => { if (event.data?.type === 'adt:page-height' && event.data.pageId === pageId) count++; };
        addEventListener('message', receive);
        setTimeout(() => { removeEventListener('message', receive); resolve(count); }, duration);
    }), { pageId, duration });
}
module.exports = { openBook, openChapter, openSection, heightMessageCount, root };
