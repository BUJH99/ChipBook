const {test,expect}=require('@playwright/test');
const {openBook,openChapter,openSection}=require('./helpers.cjs');
const registry=require('../../src/app/page-registry.json');

test('native I2C inputs and completed transaction diagrams survive chapter switches',async({page},info)=>{
    const errors=await openBook(page,info),frame=await openChapter(page,9);await openSection(page,'i2c-i3c');
    const lesson=frame.locator('[data-lesson-id="09.05"]');
    await lesson.getByLabel('7-bit 주소',{exact:true}).selectOption('104');
    await expect(lesson.locator('[data-i2c-byte]')).toHaveText('0xD0');
    await expect(lesson.locator('[data-i2c-wave]')).toContainText('0xD1');
    await openChapter(page,10);await openChapter(page,9);await openSection(page,'i2c-i3c');
    await expect(lesson.locator('[data-i2c-byte]')).toHaveText('0xD0');
    await expect(lesson.locator('.visual-atlas,canvas')).toHaveCount(0);
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:info.outputPath('i2c-native-return.png')});expect(errors).toEqual([]);
});

test('3D package, device and FPGA models load with usable controls',async({page},info)=>{
    test.setTimeout(120000);const errors=await openBook(page,info);
    for(const [number,id] of [[19,'19.03'],[22,'22.02'],[25,'25.05']]){
        const metadata=registry.pages.find(p=>p.number===number),section=metadata.sections[Number(id.split('.')[1])-1],frame=await openChapter(page,number);await openSection(page,section.key);
        const atlas=frame.locator(`[data-lesson-id="${id}"] .visual-atlas`);await atlas.scrollIntoViewIfNeeded();await expect(atlas.locator('canvas')).toHaveCount(1);await expect(atlas).toHaveAttribute('data-three-ready','true');
        await atlas.getByRole('button',{name:'상단',exact:true}).click();await atlas.getByRole('button',{name:'입체',exact:true}).click();await atlas.getByLabel('3D 층 분리',{exact:true}).fill('40');
        const label=atlas.locator('.atlas-3d-label:visible').first();await label.click();await expect(atlas.locator('.atlas-part-note')).not.toHaveText('부품을 선택하면 역할을 확인할 수 있습니다.');
        await page.screenshot({path:info.outputPath(`model-${id}.png`)});
    }
    expect(errors).toEqual([]);
});
