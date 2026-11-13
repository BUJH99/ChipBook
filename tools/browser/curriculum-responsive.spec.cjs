const {test,expect}=require('@playwright/test');
const {openBook,openChapter,openSection}=require('./helpers.cjs');
const registry=require('../../src/app/page-registry.json');
const fs=require('node:fs');

test('search opens a lesson directly and new lab inputs remain usable at the viewport',async({page},info)=>{
    const errors=await openBook(page,info);
    await page.getByRole('button',{name:'검색',exact:true}).click();
    await page.getByRole('searchbox',{name:'절 제목 또는 용어'}).fill('Systolic');
    await expect(page.locator('[data-book-search-result]:visible')).toHaveCount(1);
    await page.locator('[data-book-search-result]:visible').click();
    const chapter=await openChapter(page,11);await openSection(page,'systolic-array');
    const lab=chapter.locator('[data-lesson-id="11.04"]');
    await lab.getByLabel('행렬 예제',{exact:true}).selectOption('small');
    await lab.getByLabel('Matrix A (행은 줄바꿈, 값은 쉼표)',{exact:true}).fill('1,0\n0,1');
    await lab.getByLabel('Stall 시작 cycle (-1: 없음)',{exact:true}).fill('0');
    await lab.getByLabel('Stall 길이 (cycle)',{exact:true}).fill('1');
    await lab.getByLabel('관측 physical cycle',{exact:true}).fill('0');
    await expect(lab.locator('[data-ai-array-C] td')).toHaveText(['0','0','0','0']);
    await lab.getByLabel('관측 physical cycle',{exact:true}).fill('4');
    await expect(lab.locator('[data-ai-array-C] td')).toHaveText(['5','6','7','8']);
    await lab.getByLabel('관측 physical cycle',{exact:true}).fill('-1');
    await expect(lab.locator('[data-ai-array-C] td')).toHaveText(['0','0','0','0']);
    const shots=[[9,'09.05'],[10,'10.05'],[11,'11.04'],[14,'14.06'],[17,'17.02'],[22,'22.02']];
    for(const [number,id] of shots){
        const metadata=registry.pages.find(p=>p.number===number),section=metadata.sections[Number(id.split('.')[1])-1];
        const frame=await openChapter(page,number);await openSection(page,section.key);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        await page.screenshot({path:info.outputPath(`lesson-${id}.png`)});
    }
    expect(errors).toEqual([]);
});

test('fault, parameter and reset paths update protocol and circuit results',async({page},info)=>{
    const errors=await openBook(page,info),io=await openChapter(page,9);
    await openSection(page,'i2c-i3c');
    const i2c=io.locator('[data-lesson-id="09.05"]');
    await i2c.getByLabel('Transaction',{exact:true}).selectOption('read');
    await expect(i2c).toContainText('0xA1');await expect(i2c).toContainText('Repeated START');
    await i2c.locator('summary').click();await expect(i2c.locator('[data-i2c-arbitration-result]')).toContainText('controller: A');
    await openSection(page,'ddr-lpddr');
    const ddr=io.locator('[data-lesson-id="09.06"]');
    await ddr.getByLabel('DQS delay tap',{exact:true}).fill('0');await expect(ddr).toContainText('FAIL');
    await ddr.getByLabel('DQS delay tap',{exact:true}).fill('16');await expect(ddr).toContainText('PASS');
    const analog=await openChapter(page,14),adc=analog.locator('[data-lesson-id="14.06"] .lesson-lab').first();
    await openSection(page,registry.pages.find(p=>p.number===14).sections[5].key);
    await adc.getByLabel('Vin (V)',{exact:true}).fill('6');await expect(adc).toContainText('Overrange');
    await adc.getByLabel('Vin (V)',{exact:true}).fill('1.8');await expect(adc).toContainText('유효');
    expect(errors).toEqual([]);
});

test('exam results populate topic review and saved mistakes',async({page},info)=>{
    const errors=await openBook(page,info),exam=await openChapter(page,28);
    await exam.getByRole('button',{name:'시험 시작하기',exact:true}).click();
    await expect(exam.locator('#mock-exam-container [data-bank-question-id]')).toHaveCount(20);
    page.once('dialog',dialog=>dialog.accept());
    await exam.locator('#mock-submit-btn').click();
    await expect(exam.locator('[data-exam-breakdown]')).toContainText('주제별 결과와 복습 경로');
    await expect(exam.locator('#score-display')).toHaveText('0 점');
    const bank=await openChapter(page,27);
    await expect(bank.locator('[data-practice-mistakes] details')).toHaveCount(20);
    expect(errors).toEqual([]);
});

test('complete project download retains its ZIP payload in HTTP and direct-file preview',async({page},info)=>{
    const errors=await openBook(page,info),chapter=await openChapter(page,26);
    await openSection(page,registry.pages.find(p=>p.number===26).sections[5].key);
    const pending=page.waitForEvent('download');
    await chapter.getByRole('link',{name:'ChipBook 설계 예제 ZIP',exact:true}).click();
    const download=await pending;
    expect(download.suggestedFilename()).toBe('chipbook-examples.zip');
    const destination=info.outputPath('chipbook-examples.zip');await download.saveAs(destination);
    const data=fs.readFileSync(destination);expect(data.subarray(0,2).toString()).toBe('PK');expect(data.length).toBeGreaterThan(5000);
    expect(errors).toEqual([]);
});

test('completed detail controls preserve protocol, interrupt and numeric contracts',async({page},info)=>{
    const errors=await openBook(page,info),io=await openChapter(page,9);
    await openSection(page,'spi-qspi');const spi=io.locator('[data-lesson-id="09.04"]');
    await expect(spi.locator('[data-spi-mode="0"] svg')).toBeVisible();
    await spi.getByLabel('Device 응답 byte',{exact:true}).fill('15');
    await expect(spi.locator('[data-spi-mode="0"]')).toContainText('b3: 1');
    const soc=await openChapter(page,10);await openSection(page,'interrupt-timer');const irq=soc.locator('[data-lesson-id="10.06"]');
    await irq.getByLabel('Trigger',{exact:true}).selectOption('edge');await irq.getByRole('button',{name:'이벤트 발생',exact:true}).click();
    await irq.getByRole('button',{name:'Pending clear',exact:true}).click();
    await expect(irq.locator('[data-soc-irq-state] tr').filter({hasText:/^IRQ/}).locator('td').last()).toHaveText('0');
    for(let i=0;i<4;i++)await irq.getByRole('button',{name:'Timer 1 tick',exact:true}).click();
    await expect(irq.locator('[data-soc-irq-state] tr').filter({hasText:/^IRQ/}).locator('td').last()).toHaveText('1');
    await openSection(page,'dma-path');const dma=soc.locator('[data-lesson-id="10.05"]');
    await dma.getByLabel('Source 주소 (10진)',{exact:true}).fill('4097');await expect(dma).toContainText('MISALIGNED');
    const ai=await openChapter(page,11);await openSection(page,'ai-numerics');const quant=ai.locator('[data-lesson-id="11.02"]').first();
    await quant.getByLabel('Signed bit',{exact:true}).fill('4');await quant.getByLabel('Zero-point',{exact:true}).fill('8');
    await expect(quant.getByRole('alert')).toBeVisible();await quant.getByLabel('Zero-point',{exact:true}).fill('0');await expect(quant.locator('.tech-model-error')).toBeHidden();
    await openSection(page,'tiling-mapping');const tile=ai.locator('[data-lesson-id="11.06"]').first();
    await tile.getByLabel('SRAM 용량 (byte)',{exact:true}).fill('383');await expect(tile).toContainText('FAIL: SRAM 초과');
    await tile.getByLabel('M',{exact:true}).fill('17');await expect(tile).toContainText('마지막 유효 크기');
    expect(errors).toEqual([]);
});
