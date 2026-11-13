const {test,expect}=require('@playwright/test');
const {openBook,openChapter,openSection}=require('./helpers.cjs');
const registry=require('../../src/app/page-registry.json');

test('all fourteen bespoke SoC sections render and respond to engineering inputs',async({page},info)=>{
    test.setTimeout(180000);
    const errors=await openBook(page,info),frame=await openChapter(page,10);
    for(const [i,section] of registry.pages.find(p=>p.number===10).sections.entries()){
        await openSection(page,section.key);const article=frame.locator(`[data-lesson-id="10.${String(i+1).padStart(2,'0')}"]`);
        await expect(article).toHaveClass(/technical-section/);
        await expect(article.locator('svg').first()).toBeVisible();
        expect(await article.locator('svg').evaluateAll(nodes=>nodes.every(node=>!/(?:NaN|undefined|Infinity)/.test(node.outerHTML)))).toBe(true);
        for(const image of await article.locator('img').all()){
            await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
        }
        await expect(article.locator('[data-visual-scene],[data-lab-action="play"],[data-lab-action="step"]')).toHaveCount(0);
        expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({path:info.outputPath(`section-10-${String(i+1).padStart(2,'0')}.png`),fullPage:true});
    }
    await openSection(page,'system-requirements');
    await expect(frame.locator('[data-system-rate]')).toHaveText('≥ 155.52 MB/s');
    await frame.getByLabel('Frame rate (fps)',{exact:true}).fill('120');
    await expect(frame.locator('[data-system-rate]')).toHaveText('≥ 311.04 MB/s');
    await openSection(page,'soc-map');await frame.getByLabel('연결 계층',{exact:true}).selectOption('power');
    await expect(frame.locator('[data-soc-selected-path]')).toContainText('Always-on PMU');
    await openSection(page,'address-register');
    await frame.getByLabel('이전 값 (10진)',{exact:true}).fill('255');await frame.getByLabel('쓰기 값 (10진)',{exact:true}).fill('5');
    await frame.getByLabel('Write strobe (0–15)',{exact:true}).fill('1');await frame.getByLabel('Access 속성',{exact:true}).selectOption('W1C');
    await expect(frame.locator('[data-soc-register-result]')).toContainText('0x0000_00FA');
    await openSection(page,'memory-consistency');await expect(frame.locator('[data-coherence-outcome]')).toContainText('이전 값 0x11');
    await frame.getByLabel('Cache 동기화',{exact:true}).selectOption('1');await expect(frame.locator('[data-coherence-outcome]')).toContainText('최신 값 0xA5');
    await openSection(page,'dma-path');await frame.getByLabel('전송 길이 (byte)',{exact:true}).fill('10');
    await expect(frame.locator('[data-soc-dma-status]')).toContainText('수락 10 / 10 byte');
    await frame.getByLabel('Source 주소 (10진)',{exact:true}).fill('4097');await expect(frame.locator('[data-soc-dma-status]')).toContainText('MISALIGNED');
    await openSection(page,'interrupt-timer');await frame.getByRole('button',{name:'이벤트 발생',exact:true}).click();
    await frame.getByRole('button',{name:'Pending clear',exact:true}).click();
    const irq=frame.locator('[data-soc-irq-state] tr').filter({hasText:/^IRQ/}).locator('td').last();await expect(irq).toHaveText('1');
    await frame.getByRole('button',{name:'Source clear',exact:true}).click();await frame.getByRole('button',{name:'Pending clear',exact:true}).click();await expect(irq).toHaveText('0');
    await openSection(page,'clock-reset-integration');await frame.getByLabel('PLL lock',{exact:true}).selectOption('0');
    await expect(frame.locator('[data-soc-domain-result]')).toContainText('Clock not stable');
    await frame.getByLabel('Clock source',{exact:true}).selectOption('reference');await expect(frame.locator('[data-soc-domain-result]')).toContainText('CPU · 24 MHz');
    await openSection(page,'boot-driver');await frame.getByLabel('Driver 결과 시나리오',{exact:true}).selectOption('timeout');
    await expect(frame.locator('[data-soc-driver-outcome]')).toContainText('TIMEOUT');
    await frame.getByLabel('Register 선택',{exact:true}).selectOption('STATUS');await frame.getByLabel('Register 쓰기 값 (10진)',{exact:true}).fill('2');
    await expect(frame.locator('[data-soc-boot-register]')).toContainText('0x0000_0005');
    await openSection(page,'noc-qos');await frame.getByLabel('중재 정책',{exact:true}).selectOption('weighted');
    await expect(frame.locator('[data-soc-qos-service] svg')).toBeVisible();
    await frame.getByLabel('Camera 요청 (beat)',{exact:true}).fill('0');await frame.getByLabel('CPU 요청 (beat)',{exact:true}).fill('0');await frame.getByLabel('DMA 요청 (beat)',{exact:true}).fill('0');
    await expect(frame.locator('[data-soc-qos-service]')).toContainText('요청이 없습니다.');
    await openSection(page,'soc-low-power');await frame.getByLabel('Switched 전원',{exact:true}).selectOption('0');
    await expect(frame.locator('[data-soc-power-status]')).toContainText('VIOLATION');await frame.getByLabel('Isolation clamp',{exact:true}).selectOption('1');await expect(frame.locator('[data-soc-power-status]')).toContainText('POWER OFF');
    await openSection(page,'soc-security-safety');await expect(frame.locator('[data-soc-access-result]')).toContainText('SLVERR');
    await frame.getByLabel('보안 속성',{exact:true}).selectOption('1');await expect(frame.locator('[data-soc-access-result]')).toContainText('OKAY');
    await frame.getByLabel('접근 주소 (10진)',{exact:true}).fill('805306368');await expect(frame.locator('[data-soc-access-result]')).toContainText('DECERR');
    await openSection(page,'system-performance');await expect(frame.locator('[data-soc-roofline-result]')).toContainText('12.8 ms');
    await frame.getByLabel('Memory 대역폭 (GB/s)',{exact:true}).fill('50');await expect(frame.locator('[data-soc-roofline-result]')).toContainText('6.4 ms');
    await openSection(page,'soc-integration-verification');await expect(frame.locator('[data-soc-verification-status]')).toContainText('Scoreboard PASS');
    await frame.getByLabel('손상 byte index (-1: 없음)',{exact:true}).fill('0');await expect(frame.locator('[data-soc-verification-status]')).toContainText('Scoreboard FAIL · 첫 차이 byte 0');
    await openSection(page,'soc-case-study');await frame.getByLabel('제품 선택',{exact:true}).selectOption('storage');
    await expect(frame.locator('[data-soc-product-review]')).toContainText('Tail latency');
    await frame.getByLabel('기준 입력의 부하 배수',{exact:true}).fill('3');await expect(frame.locator('[data-soc-product-review]')).toContainText('목표 예산 초과');
    expect(errors).toEqual([]);
});
