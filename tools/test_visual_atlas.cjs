const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const registry=require('../src/app/page-registry.json');
const root=path.resolve(__dirname,'..');
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const authored=registry.pages.filter(p=>p.number>=9&&p.number<=26).flatMap(p=>p.sections.map(section=>{
    const source=fs.readFileSync(path.join(root,section.source),'utf8');
    return {source,scene:source.match(/data-visual-scene="([^"]+)"/)};
}));
const scenes=authored.filter(x=>x.scene).map(x=>JSON.parse(decode(x.scene[1])));
const api=import(pathToFileURL(path.join(root,'assets/features/visual-atlas/source/schematics.mjs')));

test('all authored sections have one renderer and remaining atlas scenes render finite geometry',async()=>{
    const {drawScene}=await api;assert.equal(authored.length,148);
    assert.equal(scenes.length+authored.filter(x=>x.source.includes('data-technical-section=')).length,148);
    assert.equal(new Set(scenes.map(x=>x.id)).size,scenes.length);
    for(const scene of scenes)for(let step=0;step<scene.steps.length;step++){
        const svg=drawScene(scene,{step,phase:step/(scene.steps.length-1)});
        assert.ok(svg.startsWith('<svg'),scene.id);assert.ok(svg.includes('role="img"'),scene.id);
        assert.doesNotMatch(svg,/NaN|undefined|Infinity/,scene.id+' step '+step);
        assert.ok((svg.match(/<(?:path|rect|circle)/g)||[]).length>2,scene.id);
    }
});
test('I2C diagram follows the transaction address and receiver ACK state',async()=>{
    const {transactionWave}=await import(pathToFileURL(path.join(root,'assets/features/technical-pages/source/i2c.mjs')));
    const read=transactionWave({address:42,register:165,value:60,scenario:'read'});
    assert.match(read,/0x54/);assert.match(read,/0x55/);assert.match(read,/0x3C/);
    assert.doesNotMatch(read,/NaN|undefined|Infinity/);
    const rejected=transactionWave({address:42,register:165,scenario:'nack'});
    assert.match(rejected,/0x54/);assert.doesNotMatch(rejected,/Register \(0xA5\)/);
});
test('array diagram uses computed accumulated values, including reset and non-default matrices',async()=>{
    const {arrayState,arrayNetwork}=await import('../assets/features/technical-pages/source/ai-numerics.mjs');
    let A=[[1,2],[3,4]],B=[[5,6],[7,8]],svg=arrayNetwork(A,B,arrayState(A,B,{cycle:3}));for(const n of [19,22,43,50])assert.match(svg,new RegExp('>'+n+'</text>'));
    svg=arrayNetwork(A,B,arrayState(A,B,{cycle:-1}));assert.equal((svg.match(/>0<\/text>/g)||[]).length,4);
    A=[[2,0],[0,2]];B=[[1,0],[0,1]];svg=arrayNetwork(A,B,arrayState(A,B,{cycle:3}));assert.equal((svg.match(/>2<\/text>/g)||[]).length,2);
});
test('ADC diagram uses the same conversion rule as the lab',async()=>{
    const {adcConversion,adcTransfer}=await import('../assets/features/technical-pages/source/analog-converters.mjs');
    const values={bits:4,vref:3.2,vin:1.6,sinad:23};assert.equal(adcConversion(values).code,8);const figure=adcTransfer(values);assert.match(figure,/ADC code/);assert.doesNotMatch(figure,/NaN|undefined|Infinity/);
});
