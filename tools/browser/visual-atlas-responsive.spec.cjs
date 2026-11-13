const {test,expect}=require('@playwright/test');
const {openBook,openChapter,openSection}=require('./helpers.cjs');

test('native array controls, occupancy and output remain reachable at a narrow viewport',async({page},info)=>{
    const errors=await openBook(page,info),frame=await openChapter(page,11);await openSection(page,'systolic-array');
    const lesson=frame.locator('[data-lesson-id="11.04"]');
    await lesson.getByLabel('행렬 예제',{exact:true}).selectOption('small');
    await lesson.getByLabel('관측 physical cycle',{exact:true}).fill('0');
    await expect(lesson.locator('[data-ai-array-C] td')).toHaveText(['5','0','0','0']);
    await lesson.getByLabel('관측 physical cycle',{exact:true}).fill('3');
    await expect(lesson.locator('[data-ai-array-C] td')).toHaveText(['19','22','43','50']);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const host=lesson.locator('[data-ai-array-network]');
    if(info.project.name==='mobile')expect(await host.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath('array-responsive.png')});
    await lesson.getByLabel('Stall 시작 cycle (-1: 없음)',{exact:true}).fill('1');
    await lesson.getByLabel('Stall 길이 (cycle)',{exact:true}).fill('2');
    await lesson.getByLabel('관측 physical cycle',{exact:true}).fill('2');
    await expect(lesson.locator('[data-ai-array-C] td')).toHaveText(['5','0','0','0']);
    await expect(lesson.locator('[data-ai-array-status]')).toContainText('STALLED');
    await lesson.getByLabel('관측 physical cycle',{exact:true}).fill('5');
    await expect(lesson.locator('[data-ai-array-C] td')).toHaveText(['19','22','43','50']);
    await expect(lesson.locator('[data-ai-array-network]')).toContainText('50');
    await openSection(page,'ai-numerics');await expect(frame.locator('[data-lesson-id="11.02"]')).toBeVisible();
    await openSection(page,'systolic-array');await expect(lesson.getByLabel('관측 physical cycle',{exact:true})).toHaveValue('5');
    await expect(lesson.locator('[data-visual-scene],[data-lab-action="play"],[data-lab-action="step"]')).toHaveCount(0);
    expect(errors).toEqual([]);
});
