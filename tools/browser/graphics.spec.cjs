const { test, expect } = require('@playwright/test');
const { openBook, openChapter, openSection } = require('./helpers.cjs');

test('3D assets load on demand and transistor drawing stops outside its section', async ({ page }, info) => {
    await page.addInitScript(() => {
        window.__chipbookDrawCalls = 0;
        for (const name of ['WebGLRenderingContext', 'WebGL2RenderingContext']) {
            const type = window[name];
            if (!type) continue;
            for (const method of ['drawElements', 'drawArrays']) {
                const draw = type.prototype[method];
                type.prototype[method] = function (...args) {
                    window.__chipbookDrawCalls++;
                    return draw.apply(this, args);
                };
            }
        }
    });
    const errors = await openBook(page, info);
    const memory = await openChapter(page, 5);
    await expect(memory.locator('[data-transistor-viewer] canvas')).toHaveCount(0);
    expect(await memory.evaluate(() => window.__chipbookDrawCalls)).toBe(0);
    await openSection(page, 'finfet-planar');
    const viewer = memory.locator('[data-transistor-viewer]').first();
    await viewer.scrollIntoViewIfNeeded();
    await expect(viewer.locator('canvas')).toBeVisible();
    await expect.poll(() => memory.evaluate(() => window.__chipbookDrawCalls)).toBeGreaterThan(0);
    await openSection(page, 'memory-basics');
    const stopped = await memory.evaluate(() => window.__chipbookDrawCalls);
    await page.waitForTimeout(400);
    expect(await memory.evaluate(() => window.__chipbookDrawCalls)).toBe(stopped);
    await openSection(page, 'finfet-planar');
    await viewer.scrollIntoViewIfNeeded();
    await expect.poll(() => memory.evaluate(() => window.__chipbookDrawCalls)).toBeGreaterThan(stopped);

    const flow = await openChapter(page, 2);
    await openSection(page, 'stage-detail');
    await flow.locator('[data-sd-stage="physical"]').click();
    const panel = flow.locator('[data-sd-panel="physical"]');
    await panel.locator('[data-sd-view="3d"]').click();
    await panel.locator('[data-sd-3d]').scrollIntoViewIfNeeded();
    await expect(panel.locator('canvas')).toBeVisible();
    await expect.poll(() => flow.evaluate(() => window.__chipbookDrawCalls)).toBeGreaterThan(0);

    const physical = await openChapter(page, 4);
    await expect(physical.locator('[data-pdk44-three] canvas')).toHaveCount(0);
    await openSection(page, 'design-kit');
    const pdk = physical.locator('[data-pdk44-three]').first();
    await pdk.scrollIntoViewIfNeeded();
    await expect(pdk.locator('canvas')).toBeVisible();
    await expect.poll(() => physical.evaluate(() => window.__chipbookDrawCalls)).toBeGreaterThan(0);
    await openSection(page, 'floorplan');
    const pdkStopped = await physical.evaluate(() => window.__chipbookDrawCalls);
    await page.waitForTimeout(400);
    expect(await physical.evaluate(() => window.__chipbookDrawCalls)).toBe(pdkStopped);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath('3d-runtime.png') });
});
