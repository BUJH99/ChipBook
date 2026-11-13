const {test,expect}=require('@playwright/test');
const {openBook,openChapter,openSection}=require('./helpers.cjs');
const registry=require('../../src/app/page-registry.json');

test('every curriculum lesson renders without inline quiz blocks',async({page},info)=>{
    test.setTimeout(720000);
    const errors=await openBook(page,info);let count=0;
    for(const metadata of registry.pages.filter(chapter=>chapter.number>=9)){
        const chapter=await openChapter(page,metadata.number);
        const articles=chapter.locator('.chapter-lesson');
        await expect(articles).toHaveCount(metadata.sections.length);
        for(const section of metadata.sections){
            if(metadata.tocMode==='action'){
                // Exhaustive content coverage uses the real navigation event;
                // menu hit targets and transitions are exercised by responsive tests.
                const link=page.locator(`[data-toc-key="${section.key}"]`);
                await link.dispatchEvent('click');
                await expect(link).toHaveClass(/is-active/);
            }
            const article=chapter.locator(`[data-lesson-id]`).filter({has:chapter.locator(`h2`).filter({hasText:section.title})});
            await expect(article).toHaveCount(1);
            await expect(article).toBeVisible();
            const technical=await article.getAttribute('data-technical-section');
            await expect(article.locator(technical?'p':'.lesson-lead').first()).not.toBeEmpty();
            if(metadata.number<=26){
                if(technical){
                    await expect(article.locator('.tech-panel').first()).toBeVisible();
                    await expect(article.locator('svg,img').first()).toBeVisible();
                    expect(await article.locator('svg').evaluateAll(nodes=>nodes.every(node=>!/(?:NaN|undefined|Infinity)/.test(node.outerHTML)))).toBe(true);
                }else{
                    const atlas=article.locator('[data-visual-scene]');
                    await expect(atlas).toBeVisible();
                    await expect(atlas.locator('.atlas-svg-host > svg')).toHaveCount(1);
                    expect(await atlas.locator('.atlas-svg-host').innerHTML()).not.toMatch(/NaN|undefined|Infinity/);
                }
                await expect(article.locator('.guidebook-section-kicker')).toHaveCSS('color','rgb(49, 130, 246)');
            }
            if(info.project.name==='http'&&metadata.number>=9&&metadata.number<=26){
                const id=await article.getAttribute('data-lesson-id');
                await page.screenshot({path:info.outputPath(`lesson-${id}-desktop.png`)});
            }
            await expect(article.locator('.lesson-question,[data-lesson-answer],.lesson-answer')).toHaveCount(0);
            expect(await chapter.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
            count++;
        }
    }
    expect(count).toBe(155);expect(errors).toEqual([]);
});

test('off-chip inputs retain state and accelerator labs update accumulated values',async({page},info)=>{
    const errors=await openBook(page,info);
    const io=await openChapter(page,9);await openSection(page,'i2c-i3c');
    const lab=io.locator('[data-lesson-id="09.05"]');
    await lab.getByLabel('Transaction',{exact:true}).selectOption('nack');
    await expect(lab.locator('[data-i2c-ownership]')).toContainText('Target NACK');
    await openSection(page,'gpio-uart');await openSection(page,'i2c-i3c');
    await expect(lab.getByLabel('Transaction',{exact:true})).toHaveValue('nack');
    const ai=await openChapter(page,11);await openSection(page,'systolic-array');
    const array=ai.locator('[data-lesson-id="11.04"]');
    await array.getByLabel('행렬 예제',{exact:true}).selectOption('small');
    await expect(array.locator('[data-ai-array-C] td')).toHaveText(['19','22','43','50']);
    expect(errors).toEqual([]);
});

test('practice identity survives numbering and new review questions can be bookmarked',async({page},info)=>{
    const errors=await openBook(page,info),bank=await openChapter(page,27);
    await expect(bank.locator('body')).toHaveAttribute('data-page-id','page-13');
    await expect(bank.locator('[data-review-list] [data-review-id]')).toHaveCount(148);
    await bank.locator('[data-review-search]').fill('주소 0x50');
    await expect(bank.locator('[data-review-list] [data-review-id]:visible')).toHaveCount(1);
    const bookmark=bank.locator('[data-review-list] [data-review-id="09.05"] [data-review-bookmark]');
    await bookmark.click();await expect(bookmark).toHaveAttribute('aria-pressed','true');
    await expect(bank.locator('[data-review-saved] [data-review-id="09.05"]')).toHaveCount(1);
    await bookmark.click();await expect(bank.locator('[data-review-saved] [data-review-id]')).toHaveCount(0);
    const exam=await openChapter(page,28);await expect(exam.locator('body')).toHaveAttribute('data-page-id','page-14');
    await exam.getByRole('button',{name:'시험 시작하기',exact:true}).click();
    await expect(exam.locator('#mock-exam-container [data-bank-question-id]')).toHaveCount(20);
    expect(errors).toEqual([]);
});
