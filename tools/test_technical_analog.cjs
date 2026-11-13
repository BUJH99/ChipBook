const {test}=require('node:test');const assert=require('node:assert/strict');
const modules=Promise.all(['analog-common','analog-foundations','analog-feedback-noise','analog-converters','analog-clocks-rf','analog-system'].map(n=>import(`../assets/features/technical-pages/source/${n}.mjs`)));
const close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<=e,`${a} versus ${b}`);
test('amplifier amplitude, bias, mirror ratio and compliance retain physical units',async()=>{
    const [,a]=await modules,s=a.amplifierSpecs();close(s.inputPeakV,.005);close(s.idealPeak,.5/Math.sqrt(1.0001));assert.equal(s.clipped,false);assert.equal(a.amplifierSpecs({inputMV:100}).clipped,true);assert.equal(a.amplifierSpecs({vcm:.02}).commonModeValid,false);
    close(a.currentMirror({lambda:0}).output,20);close(a.currentMirror({lambda:0,vout:.05}).output,8.75);close(a.currentMirror({vout:.6}).output,20);assert.equal(a.currentMirror({vout:.05}).compliance,false);
    const g=a.differentialGain();close(g.gm,1);close(g.rout,25);close(g.gain,25);close(g.commonSource,-50);close(g.idealClosed,10);assert.ok(g.closed<10);
});
test('feedback Bode crossover, phase margin and step response derive from one two-pole loop',async()=>{
    const [c,,a]=await modules;const d=a.feedbackLoop(),loaded=a.feedbackLoop({loadPF:50});close(d.point(d.fc).magnitude,0,1e-8);close(d.phaseMargin,180+d.point(d.fc).phase);assert.ok(d.phaseMargin>60&&d.phaseMargin<65);assert.ok(loaded.phaseMargin<d.phaseMargin&&loaded.overshoot>d.overshoot);close(d.dcGain,loaded.dcGain);assert.equal(d.step[0][1],0);assert.ok(Math.abs(d.step.at(-1)[1]-1)<.002);
    for(const z of [.1,.7,1,2,5]){assert.equal(c.stepValue(0,z,1000),0);assert.ok(Math.abs(c.stepValue(1,z,1000)-1)<1e-8);}
});
test('noise integration adds independent variances and uses logarithmic flicker integration',async()=>{
    const [,,a]=await modules,d=a.noiseBudget();const expected=26*(1e6-10)+20**2*100*Math.log(1e6/10);close(d.varianceNV2,expected);close(d.rmsUV,Math.sqrt(expected)/1000);close(d.parts.reduce((s,p)=>s+p.rmsUV**2,0),d.rmsUV**2);assert.throws(()=>a.noiseBudget({lowHz:100,highHz:10}));
    const offset=a.offsetDistribution({samples:5000});close(offset.sigma,3/Math.sqrt(1.8));assert.ok(Math.abs(offset.std-offset.sigma)<.06);assert.equal(offset.bins.reduce((a,b)=>a+b,0),5000);
});
test('SAR trials converge to floor quantization and distinguish nominal bits from ENOB',async()=>{
    const [,,,a]=await modules;const d=a.adcConversion({bits:'8',vref:1,vin:.72,sinad:46});assert.equal(d.code,184);assert.equal(d.sar.at(-1)[4],184);close(d.restored,.720703125);close(d.error/d.lsb,.18);assert.ok(d.enob<8);
    for(const bits of [2,4,8,12])for(const vin of [-.1,0,.13,.5,.999,1,1.1]){const r=a.adcConversion({bits,vref:1,vin,sinad:40});assert.equal(r.sar.at(-1)[4],r.code);assert.equal(r.sar.length,bits);assert.ok(r.code>=0&&r.code<2**bits);}
});
test('DAC skew follows individual changed bits and vanishes for simultaneous switching',async()=>{
    const [,,,a]=await modules;const d=a.dacTransition();assert.deepEqual(d.events.map(e=>e.code),[6,4,0,8]);assert.equal(d.target,.5);assert.ok(d.area>0);assert.ok(Math.abs(d.at(d.settle)-d.target)<=d.lsb/2+1e-10);
    const simultaneous=a.dacTransition({skew:0});assert.ok(simultaneous.points.every(p=>Math.abs(p.ideal-p.skewed)<1e-12));close(simultaneous.area,0);
    const unchanged=a.dacTransition({previous:8,code:8});assert.equal(unchanged.changed.length,0);assert.equal(unchanged.settle,0);close(unchanged.at(100),.5);
    // Independently solve the displayed voltage-mode ladder (R links, 2R branches/termination).
    for(let n=2;n<=7;n++)for(let code=0;code<2**n;code++){
        const matrix=Array.from({length:n},()=>Array(n+1).fill(0));
        for(let i=0;i<n;i++){matrix[i][i]+=.5;matrix[i][n]+=.5*((code>>(n-1-i))&1);if(i<n-1){matrix[i][i]++;matrix[i][i+1]--;matrix[i+1][i+1]++;matrix[i+1][i]--;}else matrix[i][i]+=.5;}
        for(let i=0;i<n;i++){const pivot=matrix[i][i];for(let j=i;j<=n;j++)matrix[i][j]/=pivot;for(let r=0;r<n;r++)if(r!==i){const scale=matrix[r][i];for(let j=i;j<=n;j++)matrix[r][j]-=scale*matrix[i][j];}}
        close(matrix[0][n],code/2**n);
    }
});
test('PLL lock target, RF mixer, Friis cascade and L-match use consistent definitions',async()=>{
    const [,,,,a]=await modules,p=a.pllModel();assert.equal(p.targetMHz,500);assert.equal(p.feedbackMHz,25);assert.ok(p.overshoot>4&&p.overshoot<5);assert.equal(p.points[0].response,0);
    const r=a.rfBudget();assert.equal(r.difference,100);assert.equal(r.sum,4700);assert.equal(r.cascade.gainDB,13);assert.equal(r.pass,true);assert.equal(a.rfBudget({bandwidth:50}).pass,false);
    const f=10**(.1)+(10**(.15)-1)/10**(-.1)+(10**(.6)-1)/(10**(-.1)*100)+(10**(.2)-1)/(10**(-.1)*100*10**(-.6));close(r.cascade.noiseFactor,f);
    const m=a.lMatch(),at=m.at(2400);close(at.zr,50,1e-10);close(at.zi,0,1e-10);assert.ok(at.gamma<1e-12);assert.ok(m.at(1800).gamma>.05);
});
test('regulator loss, RC response and ADC interface timing retain their declared contracts',async()=>{
    const [,,,,,a]=await modules,r=a.regulatorBudget();close(r.passMW,150);close(r.ldoLossMW,150.33);close(r.buckLossMW,20);assert.equal(a.regulatorBudget({vin:1.9}).ldoValid,false);
    const rc=a.sensorRc();close(rc.tauMS,1);close(rc.cutoff,1000/(2*Math.PI));close(rc.points[0].output,0);
    const m=a.mixedSignal({mode:'dc'});assert.equal(m.events.length,7);assert.ok(m.events.every(e=>e.code===5&&Math.abs(e.valid-e.sample-.1)<1e-10));assert.ok(m.points.filter(p=>p.t<.6).every(p=>p.code===null&&p.valid===0));
    assert.equal(a.mixedSignal({power:'0'}).events.length,0);const over=a.mixedSignal({mode:'dc',vref:.5});assert.equal(over.dc.code,7);assert.ok(over.events.every(e=>e.clipped));
});
test('native analog circuit and frequency/time figures contain finite accessible geometry',async()=>{
    const [c,a,n,d,r,s]=await modules;const figures=[c.feedbackCircuit({}),c.mirrorLayout(),c.mirrorLayout('ABBABAAB',{large:true}),a.amplifierStage(),a.mirrorCircuit(),a.differentialPair(),n.loopBode(n.feedbackLoop()),n.noisePairCircuit(),n.gradientFigure(),d.sarArchitecture(),d.capacitorDacFigure(),d.r2rFigure(),d.adcTransfer({bits:4,vref:1,vin:.72,sinad:23}),r.pllCircuit(r.pllModel()),r.pllClockWindows(r.pllModel()),r.dllCircuit(),r.rfChain(),r.matchingCircuit(r.lMatch()),s.sensorChain(),s.regulatorCircuits(),s.sensorRcCircuit(),s.mixedSignalBoundary(),s.mixedSignalWave(s.mixedSignal())];
    for(const figure of figures){assert.match(figure,/^<svg/);assert.match(figure,/role="img"/);assert.doesNotMatch(figure,/NaN|undefined|Infinity/);}
});
