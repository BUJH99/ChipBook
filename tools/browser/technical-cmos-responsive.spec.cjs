const {test,expect}=require('@playwright/test');
const {openBook,openChapter,openSection}=require('./helpers.cjs');
const registry=require('../../src/app/page-registry.json');
test('CMOS sections keep circuit truth, timing, power and layout comparisons coherent',async({page},info)=>{
    test.setTimeout(180000);const errors=await openBook(page,info),frame=await openChapter(page,13);
    for(const [i,section] of registry.pages.find(p=>p.number===13).sections.entries()){
        await openSection(page,section.key);const article=frame.locator(`[data-lesson-id="13.${String(i+1).padStart(2,'0')}"]`);
        await expect(article).toHaveClass(/technical-section/);await expect(article.locator('svg').first()).toBeVisible();
        expect(await article.locator('svg').evaluateAll(nodes=>nodes.every(n=>!/(?:NaN|undefined|Infinity)/.test(n.outerHTML)))).toBe(true);
        await expect(article.locator('.tech-model-error:visible')).toHaveCount(0);await expect(article.locator('[data-visual-scene],[data-lab-action="play"],[data-lab-action="step"]')).toHaveCount(0);
        await expect(page.locator('[data-page-toc-title]')).toContainText(section.title);expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath(`section-13-${String(i+1).padStart(2,'0')}.png`),fullPage:true});
    }
    await openSection(page,'section-01');await expect(frame.locator('[data-cmos-vtc-values]')).toContainText('0.5 V');await frame.getByLabel('VTC 중심 / VDD',{exact:true}).fill('.6');await expect(frame.locator('[data-cmos-vtc-values]')).toContainText('0.583 V');
    await openSection(page,'section-02');await expect(frame.locator('[data-cmos-gate-result]')).toContainText('NAND = 1 · NOR = 1');await frame.getByLabel('입력 A',{exact:true}).selectOption('1');await expect(frame.locator('[data-cmos-gate-result]')).toContainText('NAND = 1 · NOR = 0');await frame.getByLabel('입력 B',{exact:true}).selectOption('1');await expect(frame.locator('[data-cmos-gate-result]')).toContainText('NAND = 0 · NOR = 0');
    await openSection(page,'section-03');await expect(frame.locator('[data-cmos-buffer-chain]')).toContainText('D = 16');await frame.getByLabel('단계 수 N',{exact:true}).fill('1');await expect(frame.locator('[data-cmos-buffer-chain]')).toContainText('D = 82');
    await openSection(page,'section-04');await expect(frame.locator('[data-cmos-power-values]')).toContainText('8.2 mW');await frame.getByLabel('스위칭 활동도 α (0→1 / cycle)',{exact:true}).fill('0');await frame.getByLabel('Short-circuit event rate (MHz)',{exact:true}).fill('0');await expect(frame.locator('[data-cmos-power-values] tr').last()).toContainText('1.6 mW');
    await openSection(page,'section-05');await frame.getByLabel('Latch CLK level',{exact:true}).selectOption('0');await expect(frame.locator('[data-cmos-latch-state]')).toContainText('이전 값 유지');await expect(frame.locator('[data-cmos-gating-result]')).toContainText('clock high 중');await frame.getByLabel('Enable 변경 시각',{exact:true}).fill('1');await expect(frame.locator('[data-cmos-gating-result]')).toContainText('완전한 pulse');
    await openSection(page,'section-07');await frame.getByLabel('추가 output Cpara (fF)',{exact:true}).fill('0');await frame.getByLabel('추가 Rwire (Ω)',{exact:true}).fill('0');const delay=frame.locator('[data-cmos-custom-results] tr').filter({hasText:'tpLH'});await expect(delay).toContainText('0%');await frame.getByLabel('추가 output Cpara (fF)',{exact:true}).fill('5');await expect(delay).toContainText('100%');
    await openChapter(page,12);await openChapter(page,13);await openSection(page,'section-02');await expect(frame.locator('[data-cmos-gate-result]')).toContainText('NAND = 0 · NOR = 0');await frame.getByLabel('입력 A',{exact:true}).selectOption('0');await frame.getByLabel('입력 B',{exact:true}).selectOption('0');await expect(frame.locator('[data-cmos-gate-result]')).toContainText('NAND = 1 · NOR = 1');expect(errors).toEqual([]);
});
