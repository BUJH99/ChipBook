const {test,expect}=require('@playwright/test');
const {openBook,openChapter,openSection}=require('./helpers.cjs');
const registry=require('../../src/app/page-registry.json');

test('device and process sections retain physical assets, numeric models and structure navigation',async({page},info)=>{
    test.setTimeout(180000);
    const errors=await openBook(page,info),frame=await openChapter(page,12);
    for(const [i,section] of registry.pages.find(p=>p.number===12).sections.entries()){
        await openSection(page,section.key);const article=frame.locator(`[data-lesson-id="12.${String(i+1).padStart(2,'0')}"]`);
        await expect(article).toHaveClass(/technical-section/);await expect(article.locator('svg,img').first()).toBeVisible();
        expect(await article.locator('svg').evaluateAll(nodes=>nodes.every(node=>!/(?:NaN|undefined|Infinity)/.test(node.outerHTML)))).toBe(true);
        await expect(article.locator('.tech-model-error:visible')).toHaveCount(0);
        for(const image of await article.locator('img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);}
        await expect(article.locator('[data-visual-scene],[data-lab-action="play"],[data-lab-action="step"]')).toHaveCount(0);
        await expect(page.locator('[data-page-toc-title]')).toContainText(section.title);
        expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath(`section-12-${String(i+1).padStart(2,'0')}.png`),fullPage:true});
    }
    await openSection(page,'section-01');await expect(frame.locator('[data-device-pn-result]')).toContainText('0.43 μm');
    await frame.getByLabel('log₁₀ Nₐ (cm⁻³)',{exact:true}).fill('17');await expect(frame.locator('[data-device-pn-result]')).toContainText('0.774 V');
    await openSection(page,'section-02');await expect(frame.locator('[data-device-mos-result]')).toContainText('Triode');
    await frame.getByLabel('VGS (V)',{exact:true}).fill('.3');await expect(frame.locator('[data-device-mos-result]')).toContainText('Cutoff');
    await frame.getByLabel('VGS (V)',{exact:true}).fill('1.2');await frame.getByLabel('VDS (V)',{exact:true}).fill('1');await expect(frame.locator('[data-device-mos-result]')).toContainText('Saturation');
    await openSection(page,'section-04');await expect(frame.locator('[data-device-wire-result]')).toContainText('τ = 100 ps');
    await frame.getByLabel('배선 R (Ω)',{exact:true}).fill('2000');await expect(frame.locator('[data-device-wire-result]')).toContainText('τ = 200 ps');
    await openSection(page,'section-05');for(const kind of ['finfet','gaa','planar']){await frame.getByLabel('소자 구조 선택',{exact:true}).selectOption(kind);await expect(frame.locator('[data-device-selected-image]')).toHaveAttribute('src',new RegExp(`${kind}-device\\.png$`));await expect.poll(()=>frame.locator('[data-device-selected-image]').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);}
    await expect(frame.getByRole('link',{name:'Planar·FinFET 3D 구조를 회전하며 비교하기',exact:true})).toHaveAttribute('href',/chapter=5/);
    await openSection(page,'section-06');await frame.getByLabel('변동 성분',{exact:true}).selectOption('global');
    const sigma=frame.locator('[data-device-offset-stats] tr').filter({hasText:'차이의 표본 σ'});await expect(sigma).toContainText('0 mV');
    await frame.getByLabel('변동 성분',{exact:true}).selectOption('local');await expect(sigma).not.toContainText('0 mV');
    await frame.getByLabel('Clock period (ns)',{exact:true}).fill('5');await expect(frame.locator('[data-device-pvt-grid] tbody tr').nth(2).locator('td').nth(2)).toHaveText('FAIL · 7 ns');
    await openChapter(page,11);await openSection(page,'systolic-array');await expect(page.locator('[data-page-toc-title]')).toContainText('Systolic Array');
    await openChapter(page,12);await openSection(page,'section-05');await expect(frame.getByLabel('소자 구조 선택',{exact:true})).toHaveValue('planar');
    expect(errors).toEqual([]);
});
