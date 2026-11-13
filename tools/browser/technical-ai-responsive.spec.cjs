const {test,expect}=require('@playwright/test');
const {openBook,openChapter,openSection}=require('./helpers.cjs');
const registry=require('../../src/app/page-registry.json');

test('all fifteen native AI sections render coherent figures and respond to engineering inputs',async({page},info)=>{
    test.setTimeout(240000);
    const errors=await openBook(page,info),frame=await openChapter(page,11);
    for(const [i,section] of registry.pages.find(p=>p.number===11).sections.entries()){
        await openSection(page,section.key);const article=frame.locator(`[data-lesson-id="11.${String(i+1).padStart(2,'0')}"]`);
        await expect(article).toHaveClass(/technical-section/);await expect(article.locator('svg').first()).toBeVisible();
        expect(await article.locator('svg').evaluateAll(nodes=>nodes.every(node=>!/(?:NaN|undefined|Infinity)/.test(node.outerHTML)))).toBe(true);
        await expect(article.locator('.tech-model-error:visible')).toHaveCount(0);
        for(const image of await article.locator('img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);}
        await expect(article.locator('[data-visual-scene],[data-lab-action="play"],[data-lab-action="step"]')).toHaveCount(0);
        expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath(`section-11-${String(i+1).padStart(2,'0')}.png`),fullPage:true});
    }
    await openSection(page,'ai-workloads');await expect(frame.locator('[data-ai-workload-ops]')).toContainText('118,013,952 MAC');
    await frame.getByLabel('Batch N',{exact:true}).fill('2');await expect(frame.locator('[data-ai-workload-ops]')).toContainText('236,027,904 MAC');
    await openSection(page,'ai-numerics');await expect(frame.locator('[data-ai-quant-status]')).toContainText('q = 15');
    await frame.getByLabel('입력 실수 x',{exact:true}).fill('.625');await expect(frame.locator('[data-ai-quant-status]')).toContainText('q = 2');
    await frame.getByLabel('Signed bit',{exact:true}).fill('4');await frame.getByLabel('Zero-point',{exact:true}).fill('8');
    await expect(frame.locator('[data-lesson-id="11.02"] .tech-model-error')).toBeVisible();
    await frame.getByLabel('Zero-point',{exact:true}).fill('0');await expect(frame.locator('[data-lesson-id="11.02"] .tech-model-error')).toBeHidden();
    await openSection(page,'mac-pe');await frame.getByLabel('부분곱 A · INT8',{exact:true}).fill('-128');await frame.getByLabel('부분곱 B · INT8',{exact:true}).fill('-128');await expect(frame.locator('[data-ai-adder-tree]')).toContainText('Product = 16384');
    await openSection(page,'systolic-array');await frame.getByLabel('행렬 예제',{exact:true}).selectOption('small');
    await expect(frame.locator('[data-ai-array-C] td')).toHaveText(['19','22','43','50']);
    await frame.getByLabel('Stall 시작 cycle (-1: 없음)',{exact:true}).fill('1');await frame.getByLabel('Stall 길이 (cycle)',{exact:true}).fill('2');await frame.getByLabel('관측 physical cycle',{exact:true}).fill('2');
    await expect(frame.locator('[data-ai-array-C] td')).toHaveText(['5','0','0','0']);
    await frame.getByLabel('관측 physical cycle',{exact:true}).fill('5');await expect(frame.locator('[data-ai-array-C] td')).toHaveText(['19','22','43','50']);
    await openSection(page,'dataflow-reuse');await frame.getByLabel('Dataflow 선택',{exact:true}).selectOption('RS');await expect(frame.locator('[data-ai-dataflow-result]')).toContainText('−6');
    await openSection(page,'tiling-mapping');await frame.getByLabel('SRAM 용량 (byte)',{exact:true}).fill('383');await expect(frame.locator('[data-ai-tile-status]')).toContainText('FAIL: SRAM 초과');
    await frame.getByLabel('M',{exact:true}).fill('17');await expect(frame.locator('[data-ai-tile-tail]')).toContainText('Tail mask 필요');
    await openSection(page,'accelerator-memory');await expect(frame.locator('[data-ai-memory-rate]')).toContainText('8 GB/s');await frame.getByLabel('Clock (MHz)',{exact:true}).fill('1000');await expect(frame.locator('[data-ai-memory-rate]')).toContainText('16 GB/s');
    await openSection(page,'compute-overlap');await frame.getByLabel('Compute 시간 (cycle)',{exact:true}).fill('2');
    const independent=await frame.locator('[data-ai-overlap-result]').textContent();await frame.getByLabel('Load / Store 자원',{exact:true}).selectOption('shared');expect(await frame.locator('[data-ai-overlap-result]').textContent()).not.toBe(independent);
    await openSection(page,'activation-postprocess');await frame.getByLabel('Activation 함수',{exact:true}).selectOption('gelu');await expect(frame.locator('[data-ai-activation-result]')).toContainText('GELU tanh');
    await openSection(page,'sparsity-compression');await expect(frame.locator('[data-ai-sparse-result]')).toContainText('Sparsity 75%');await frame.getByLabel('Sparse input 0행 0열',{exact:true}).fill('4');await expect(frame.locator('[data-ai-sparse-result]')).toContainText('Sparsity 71.875%');
    await frame.getByLabel('희소 행렬 예제',{exact:true}).selectOption('zero');await expect(frame.locator('[data-ai-sparse-result]')).toContainText('Sparsity 100%');
    await openSection(page,'attention-kv');await expect(frame.locator('[data-ai-kv-result]')).toContainText('192 MiB');await frame.getByLabel('KV head 수',{exact:true}).fill('4');await expect(frame.locator('[data-ai-kv-result]')).toContainText('48 MiB');
    await frame.getByLabel('Attention mask',{exact:true}).selectOption('causal');await expect(frame.locator('[data-ai-attention-output] tbody tr').first().locator('td')).toHaveText(['1','2']);
    await openSection(page,'accelerator-software');await expect(frame.locator('[data-ai-compiler-budget]')).toContainText('8,192 B');await frame.getByLabel('추가 operator 지원',{exact:true}).selectOption('on');await expect(frame.locator('[data-ai-runtime-commands]')).toContainText('CPU operator');
    await openSection(page,'accelerator-performance');await expect(frame.locator('[data-ai-roofline-result]')).toContainText('1,000 GOp/s');await frame.getByLabel('Memory bandwidth (GB/s)',{exact:true}).fill('200');await expect(frame.locator('[data-ai-roofline-result]')).toContainText('Compute-bound');
    await openSection(page,'accelerator-verification');await expect(frame.locator('[data-ai-verify-status]')).toContainText('비교 FAIL');await expect(frame.locator('[data-ai-verify-first]')).toContainText('C[2,1]');await frame.getByLabel('오류 주입',{exact:true}).selectOption('off');await expect(frame.locator('[data-ai-verify-status]')).toContainText('비교 PASS');
    await openSection(page,'mini-npu-project');await expect(frame.locator('[data-ai-project-C] td')).toHaveText(['19','22','43','50']);await frame.getByLabel('두 번째 MAC 전 stall cycle',{exact:true}).fill('2');await expect(frame.locator('[data-ai-project-status]')).toContainText('Done edge 6');
    await expect(frame.getByRole('link',{name:'작은 NPU core',exact:true})).toHaveAttribute('href',/SystolicCore\.sv$/);
    expect(errors).toEqual([]);
});
