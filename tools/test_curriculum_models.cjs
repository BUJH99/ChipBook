const test = require('node:test');
const assert = require('node:assert/strict');
const model = import('../assets/features/curriculum/source/models.mjs');

test('UART preserves every byte in LSB order and reports parity/framing faults', async () => {
    const M=await model;
    for(let byte=0;byte<256;byte++){
        const frame=M.uartFrame(byte);
        assert.equal(frame.levels.slice(2,10).reduce((sum,bit,i)=>sum+(bit<<i),0),byte);
        assert.equal(frame.durationBits,10);
        assert.equal(M.uartFrame(byte,'even',true).error,'Parity error');
    }
    assert.equal(M.uartFrame(165,'none',true).error,'Framing error');
});

test('SPI modes sample stable data on their specified leading/trailing edges', async () => {
    const M=await model;
    for(let mode=0;mode<4;mode++)for(const value of[0,1,166,255]){
        const f=M.spiFrame(value,mode);
        assert.deepEqual(f.samples.map(i=>f.mosi[i]),M.bits(value));
        assert.deepEqual(f.samples.map(i=>f.miso[i]),M.bits(0x3C));
        assert.equal(f.cs[0],1);assert.equal(f.cs.at(-1),1);assert(f.samples.every(i=>f.cs[i]===0));
        for(const i of f.samples)assert.equal(f.mosi[i],f.mosi[i-1]);
        assert.equal(f.clock[0],mode>>1);
    }
});

test('I2C address byte, ACK, NACK abort and stretching obey the wire contract', async () => {
    const M=await model, good=M.i2cWrite(0x50,0xA5), bad=M.i2cWrite(0x50,0xA5,true), stretch=M.i2cWrite(0x50,0xA5,false,2);
    assert.equal(good.addressByte,0xA0);assert.equal(good.payload,0xA5);
    assert.equal(bad.payload,null);assert(!bad.samples.some(x=>x.label.startsWith('DATA')));
    assert.equal(stretch.samples.length-good.samples.length,4);
    for(let i=1;i<good.samples.length;i++){
        const a=good.samples[i-1],b=good.samples[i];
        if(a.scl&&b.scl&&a.sda!==b.sda)assert(['START','STOP'].includes(b.label));
    }
});

test('systolic skew produces scalar matrix multiplication with each MAC exactly once', async () => {
    const M=await model;
    for(const n of[2,3,4]){
        const A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i*n+j-3));
        const B=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>2*i-j));
        const expected=A.map(row=>B[0].map((_,j)=>row.reduce((sum,a,k)=>sum+a*B[k][j],0)));
        const result=M.systolic(A,B);
        assert.deepEqual(result.sums,expected);assert.equal(result.trace.flatMap(x=>x.active).length,n**3);
        assert.equal(result.cycles,3*n-2);
    }
    assert.deepEqual(M.systolic([[1,2],[3,4]],[[5,6],[7,8]]).sums,[[19,22],[43,50]]);
});

test('DMA counts accepted bytes, preserves partial last beats and distinguishes failure', async () => {
    const M=await model;
    for(let length=1;length<=35;length++){
        const d=M.dmaTrace({length,beat:4,stall:3});
        assert.equal(d.status,'DONE');assert.equal(d.sent,length);
        for(const row of d.rows)assert.equal(row.transferred+row.remaining,length);
    }
    assert.equal(M.dmaTrace({length:32,timeout:2}).status,'TIMEOUT');
    assert.equal(M.dmaTrace({length:32,errorAt:3}).status,'ERROR');
    const misaligned=M.dmaTrace({length:32,source:4097});assert.equal(misaligned.status,'MISALIGNED');assert.equal(misaligned.sent,0);
});

test('FIFO rejects over/underflow, retains order and wraps Gray pointers safely', async () => {
    const M=await model;let state={depth:4,values:[],read:0,write:0};
    for(let i=0;i<4;i++)state=M.fifoStep(state,'write',i);
    const full=M.fifoStep(state,'write',99);assert.deepEqual(full.values,[0,1,2,3]);assert(!full.accepted);
    for(let i=0;i<4;i++){state=M.fifoStep(state,'read');assert.equal(state.output,i);}
    assert(!M.fifoStep(state,'read').accepted);
    for(let i=0;i<16;i++){
        const old=state.write^(state.write>>1);state=M.fifoStep(state,'write',i);
        const delta=old^state.grayWrite;assert(delta && !(delta&(delta-1)));state=M.fifoStep(state,'read');
    }
    assert.throws(()=>M.fifoStep({...state,depth:3},'write',1));
});

test('numeric and budget models retain units, ties-to-even and limiting cases', async () => {
    const M=await model;
    assert.equal(M.quantize(2.5,1,8).integer,2);assert.equal(M.quantize(3.5,1,8).integer,4);assert.equal(M.quantize(-2.5,1,8).integer,-2);
    assert.equal(M.quantize(.3,.2,8).integer,2);assert.equal(M.quantize(-.3,.2,8).integer,-2);
    assert.equal(M.quantize(.299999,.2,8).integer,1);assert.equal(M.quantize(.300001,.2,8).integer,2);
    assert(M.quantize(100,0.25,8).saturated);
    assert.equal(M.quantize(0,0.25,8,-7).integer,-7);assert.equal(M.quantize(0,0.25,8,-7).restored,0);
    assert.throws(()=>M.quantize(1,0.25,4,8));
    assert.equal(M.bandwidth({}).gbytes,3.2);assert.equal(M.bandwidth({}).microseconds,1.28);
    assert.equal(M.kvBytes({})/(1024**2),192);
    assert.equal(M.tileBudget({}).storage,384);
    assert.equal(M.tileBudget({m:17,capacity:383}).fits,false);assert.equal(M.tileBudget({m:17}).axes[0].last,1);
    assert(Math.abs(M.power({}).dynamicMW-6.4)<1e-10);
    assert.equal(M.roofline({}).intensity,10);assert.equal(M.roofline({}).milliseconds,1);
});

test('positive capture skew helps setup but hurts hold; level source reasserts pending', async () => {
    const M=await model,a=M.timing({skew:0}),b=M.timing({skew:1});
    assert.equal(b.setupSlack-a.setupSlack,1);assert.equal(b.holdSlack-a.holdSlack,-1);
    let irq=M.irqStep({level:true,masked:false,pending:false,source:false},'event');
    irq=M.irqStep(irq,'pending-clear');assert(irq.irq);
    irq=M.irqStep(irq,'source-clear');irq=M.irqStep(irq,'pending-clear');assert(!irq.irq);
    irq=M.irqStep({level:false,masked:false,pending:false,source:false},'event');
    irq=M.irqStep(irq,'pending-clear');assert(!irq.irq);
    irq=M.irqStep(irq,'event');assert(!irq.irq);
    irq=M.irqStep(irq,'source-clear');irq=M.irqStep(irq,'event');assert(irq.irq);
    irq={level:false,masked:true,pending:false,source:false,period:4};
    for(let i=0;i<3;i++)irq=M.irqStep(irq,'tick');assert(!irq.pending);
    irq=M.irqStep(irq,'tick');assert(irq.pending);assert(!irq.irq);assert.equal(irq.events,1);
    assert(M.irqStep(irq,'mask').irq);
});
