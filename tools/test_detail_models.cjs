const {test}=require('node:test');
const assert=require('node:assert/strict');
const models=import('../assets/features/curriculum/source/detail-models.mjs');

test('interface comparisons apply the same workload payload to every candidate',async()=>{
    const D=await models,rows=D.interfaceBudget({required:32.768,latency:100,payloadBytes:4096});
    assert.equal(rows.length,6);
    for(const row of rows){assert.equal(row.bytes,4096);assert.equal(row.microseconds,4096*8/row.rate);}
    const doubled=D.interfaceBudget({required:32.768,latency:100,payloadBytes:8192});
    doubled.forEach((row,i)=>assert.equal(row.microseconds,rows[i].microseconds*2));
    assert.equal(rows.find(row=>row.name==='SPI').pass,false);
    assert.equal(rows.find(row=>row.name==='Ethernet 1G').pass,true);
});

test('UART sampling decodes every byte and baud error can change the result',async()=>{
    const D=await models;
    for(let value=0;value<256;value++)for(const parity of ['none','even','odd']){
        const r=D.uartReceive(value,115200,115200,parity);
        assert.equal(r.decoded,value);assert(!r.parityError);assert(!r.framingError);
    }
    assert(D.uartReceive(165,115200,115200,'none',true).framingError);
    assert.notEqual(D.uartReceive(165,115200,9600).decoded,165);
});
test('I2C repeated START retains bus ownership and ends read with master NACK',async()=>{
    const D=await models,r=D.i2cRead();
    assert.equal(r.addressByte,0xa1);assert.equal(r.payload,60);
    assert.equal(r.samples.filter(s=>s.label==='STOP').length,1);
    assert(r.samples.some(s=>s.label==='REPEATED START'));
    assert(r.samples.some(s=>s.label==='MASTER NACK'&&s.scl===1&&s.sda===1));
    for(let i=1;i<r.samples.length;i++)if(r.samples[i-1].scl&&r.samples[i].scl&&r.samples[i-1].sda!==r.samples[i].sda)
        assert(['START','REPEATED START','STOP'].includes(r.samples[i].label));
});
test('wired-AND arbitration keeps the lower standard identifier',async()=>{
    const D=await models;
    for(const [a,b] of [[0,2047],[0x123,0x127],[1234,1233],[9,9]]){
        const r=D.arbitration(a,b);assert.equal(r.value,Math.min(a,b));
        assert.equal(r.rows.reduce((value,row)=>(value<<1)|row.bus,0),Math.min(a,b));
    }
});
test('training windows intersect all bits and close under excessive jitter',async()=>{
    const D=await models;
    assert(D.training({tap:16,jitter:2,offset:0}).pass);
    assert(!D.training({tap:0,jitter:2,offset:0}).pass);
    assert.equal(D.training({tap:16,jitter:9,offset:0}).center,null);
});
test('wire and pixel budgets preserve bit/byte units and overhead',async()=>{
    const D=await models;
    const e=D.ethernet({payload:1500,rate:1,offered:80,service:80,depth:32});
    assert.equal(e.wireBytes,1538);assert.equal(e.frameNS,12304);assert.equal(e.drops,0);
    const p=D.pixelBudget({width:1920,height:1080,fps:60,bpp:10,lanes:2,overhead:0,laneRate:1.5});
    assert.equal(p.payload,1.24416);assert.equal(p.perLane,.62208);
    const link=D.pcie({generation:3,lanes:4,payload:256});assert(link.gbps<4);assert(link.gbps>3.5);
});
test('matching termination has no reflection and the correct steady amplitude',async()=>{
    const D=await models,r=D.reflection({z0:50,load:50,source:50,voltage:1});
    assert.equal(r.gamma,0);assert.equal(r.rows[0][3],.5);
    assert(r.rows.every(row=>row[3]===.5));
});
test('register byte strobes and W1C obey independent bit contracts',async()=>{
    const D=await models;
    assert.equal(D.registerWrite(0x11223344,0xaabbccdd,'RW',5).value,0x11bb33dd);
    assert.equal(D.registerWrite(15,5,'W1C',15).value,10);
    assert.equal(D.registerWrite(15,5,'RO',15).value,15);
    assert.equal(D.registerWrite(0xffffffff,0xffffffff,'RW',0).value,0xffffffff);
});
test('double buffering never reuses an owned buffer or overlaps a single engine',async()=>{
    const D=await models;
    for(const compute of [1,5,20]){
        const d=D.overlap({tiles:8,load:3,compute,store:2});
        assert(d.overlapped<=d.serial);
        d.rows.forEach((row,i)=>{assert(row.cStart>=row.lEnd);assert(row.sStart>=row.cEnd);if(i>=2)assert(row.lStart>=d.rows[i-2].sEnd);});
    }
});
test('bank conflict, sparsity and stable softmax preserve workload quantities',async()=>{
    const D=await models;
    assert.equal(D.bankAccess({banks:4,stride:1,requests:8}).cycles,2);
    assert.equal(D.bankAccess({banks:4,stride:4,requests:8}).cycles,8);
    assert.equal(D.sparse({zeros:100,metadata:1}).useful,0);
    assert.equal(D.sparse({zeros:0,metadata:1}).sparseBytes,64);
    const a=D.attention({q:5,scale:3});assert(Math.abs(a.rows.reduce((s,r)=>s+r[3],0)-1)<1e-12);assert(a.output>=2&&a.output<=8);
});
test('PWL activation preserves knots and finer intervals reduce GELU interpolation error',async()=>{
    const D=await models;
    for(const segments of [4,16,64])for(let i=0;i<=segments;i++){
        const x=-8+16*i/segments;assert(Math.abs(D.activationApproximation(x,'gelu',segments)-D.activation(x,'gelu'))<1e-12);
    }
    const error=segments=>Math.max(...Array.from({length:321},(_,i)=>{const x=i/20-8;return Math.abs(D.activationApproximation(x,'gelu',segments)-D.activation(x,'gelu'));}));
    assert(error(64)<error(16));assert(error(16)<error(4));
    assert.equal(D.activationApproximation(-10,'relu',16),0);assert.equal(D.activationApproximation(10,'relu6',16),6);
});
test('ADC SAR agrees with code boundaries and DAC-width ENOB is not assumed',async()=>{
    const D=await models;
    for(let bits=2;bits<=10;bits++)for(const vin of[0,.4,1.5,3.299,4]){
        const r=D.adc({bits,vref:3.3,vin,sinad:60});assert.equal(r.sar.at(-1)[4],r.code);assert(r.code>=0&&r.code<2**bits);
    }
    assert(Math.abs(D.adc({bits:8,vref:3.3,vin:1,sinad:49.92}).enob-8)<1e-10);
});
test('CDC can miss short pulses, scan faults need sensitization, and access denies writes to ROM',async()=>{
    const D=await models;
    assert(!D.cdcTrace({pulse:1,period:4,phase:0}).some(row=>row[4]));
    assert(D.cdcTrace({pulse:6,period:4,phase:0}).some(row=>row[4]));
    assert(D.scanTrace({pattern:15,fault:0}).detected);assert(!D.scanTrace({pattern:0,fault:0}).detected);
    assert(!D.safetyAccess({address:0,write:1,secure:1,locked:1}).allowed);
    assert(!D.safetyAccess({address:4096,write:0,secure:0,locked:1}).allowed);
});
test('model renderers accept every default configuration without NaN or undefined',async()=>{
    const {detailFields,detailSelects,renderDetail}=await import('../assets/features/curriculum/source/detail-labs.mjs');
    for(const [kind,fields] of Object.entries(detailFields)){
        const v=Object.fromEntries(fields.map(([key,,value])=>[key,value]));
        for(const [key,,options] of detailSelects[kind]||[])v[key]=options[0][0];
        for(const fault of[false,true]){const rendered=renderDetail(kind,v,0,fault);assert(rendered,kind);assert(!/NaN|undefined|Infinity/.test(rendered.html),kind);}
    }
});
