const { test, expect } = require('@playwright/test');
const { openBook, openChapter, openSection, heightMessageCount } = require('./helpers.cjs');

test('UVM documents settle and stop reporting after leaving the chapter', async ({ page }, info) => {
    const errors = await openBook(page, info);
    const chapter = await openChapter(page, 7);
    await openSection(page, 'sequence-diagram');
    const child = chapter.locator('[data-page7-panel="sequence-diagram"] iframe');
    await expect.poll(() => child.evaluate(frame => parseFloat(frame.style.height))).toBeGreaterThan(1000);
    await expect(chapter.locator('[data-page7-panel="sequence-diagram"] .page7-source-shell')).toHaveClass(/is-ready/);
    await expect.poll(() => heightMessageCount(page, 'page-7')).toBeLessThanOrEqual(2);
    const documentFrame = await child.elementHandle().then(handle => handle.contentFrame());
    await documentFrame.getByRole('button', { name: 'Full UVM sequence diagram enlarged view', exact: true }).click();
    await expect(documentFrame.getByRole('dialog')).toBeVisible();
    const zoom = await documentFrame.locator('iframe').elementHandle().then(handle => handle.contentFrame());
    await expect(zoom.locator('svg')).toBeVisible();
    await expect(zoom.locator('html')).not.toHaveClass(/is-embedded-document/);
    await documentFrame.getByRole('button', { name: 'Close enlarged diagram', exact: true }).click();
    await expect(documentFrame.getByRole('dialog')).toHaveCount(0);
    await openSection(page, 'uvm-library');
    await expect.poll(() => chapter.locator('[data-page7-panel="uvm-library"] iframe').evaluate(frame => parseFloat(frame.style.height))).toBeGreaterThan(2000);
    await openChapter(page, 1);
    await expect.poll(() => heightMessageCount(page, 'page-7')).toBe(0);
    expect(errors).toEqual([]);
});

test('AXI Stream runs only in its active section and resumes after chapter navigation', async ({ page }, info) => {
    const errors = await openBook(page, info);
    const chapter = await openChapter(page, 8);
    const counter = chapter.locator('#axis-stream-lab-clk-cycle');
    const initial = await counter.textContent();
    await page.waitForTimeout(1400);
    await expect(counter).toHaveText(initial);
    await openSection(page, 'axi-stream');
    await expect.poll(async () => parseFloat(await counter.textContent())).toBeGreaterThan(parseFloat(initial));
    await openSection(page, 'amba');
    const stopped = await counter.textContent();
    await page.waitForTimeout(1400);
    await expect(counter).toHaveText(stopped);
    await openSection(page, 'axi-stream');
    await expect.poll(async () => parseFloat(await counter.textContent())).toBeGreaterThan(parseFloat(stopped));
    await openChapter(page, 1);
    const outside = await counter.textContent();
    await page.waitForTimeout(1400);
    await expect(counter).toHaveText(outside);
    await openChapter(page, 8);
    await expect.poll(async () => parseFloat(await counter.textContent())).toBeGreaterThan(parseFloat(outside));
    expect(errors).toEqual([]);
});

test('memory action cancellation leaves controls ready when returning', async ({ page }, info) => {
    const errors = await openBook(page, info);
    const chapter = await openChapter(page, 5);
    await openSection(page, 'memory-basics');
    const lab = chapter.locator('[data-memory-lab][data-memory-kind="sram"]').first();
    await lab.locator('[data-memory-action="write"]').first().click();
    await expect(lab).toHaveAttribute('data-running', 'true');
    await openChapter(page, 1);
    await expect(lab).toHaveAttribute('data-running', 'false');
    await openChapter(page, 5);
    await lab.locator('[data-memory-action="write"]').first().click();
    await expect(lab).toHaveAttribute('data-running', 'false', { timeout: 10000 });
    await expect(lab.locator('[data-memory-action="read"]')).toBeEnabled();
    expect(errors).toEqual([]);
});
