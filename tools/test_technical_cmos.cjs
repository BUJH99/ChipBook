const {test}=require('node:test');
const assert=require('node:assert/strict');
const modules=Promise.all(['cmos-analysis','cmos-storage','cmos-layout','cmos-primitives'].map(n=>import(`../assets/features/technical-pages/source/${n}.mjs`)));
test('VTC switching and noise boundaries are derived from the same curve',async()=>{
    const [a]=await modules;
    assert.deepEqual(a.cmosLogic({a:'0',b:'0'}),a.cmosLogic({a:0,b:0}));
    for(const vdd of [.5,1,1.8])for(const center of [.35,.5,.65]){
        const d=a.inverterVtc({vdd,center}),f=x=>vdd/(1+Math.exp(20*(x/vdd-center))),derivative=x=>{const y=f(x)/vdd;return -20*y*(1-y);};
        assert.ok(d.vil<d.vm&&d.vm<d.vih);assert.ok(Math.abs(f(d.vm)-d.vm)<1e-12);
        assert.ok(Math.abs(derivative(d.vil)+1)<1e-12&&Math.abs(derivative(d.vih)+1)<1e-12);
        assert.ok(Math.abs(d.nml-(d.vil-d.vol))<1e-12&&Math.abs(d.nmh-(d.voh-d.vih))<1e-12);
    }
    assert.ok(Math.abs(a.inverterVtc().vm-.5)<1e-12);
});
test('CMOS networks are dual for every stable input and inverter effort includes parasitic delay',async()=>{
    const [a]=await modules;
    for(const x of [0,1])for(const y of [0,1]){const d=a.cmosLogic({a:x,b:y});assert.equal(d.nand,1-(x&y));assert.equal(d.nor,1-(x|y));assert.notEqual(d.nandPullUp,d.nandPullDown);assert.notEqual(d.norPullUp,d.norPullDown);}
    const d=a.bufferChain();assert.deepEqual(d.sizes,[1,3,9,27]);assert.equal(d.delay,16);assert.equal(d.singleDelay,82);assert.equal(d.inputSum,40);assert.equal(d.tauPS,121.5);
    for(let n=1;n<=8;n++){const c=a.bufferChain({load:81,stages:n});assert.ok(Math.abs(c.stageRows.reduce((sum,r)=>sum+r.delay,0)-c.delay)<1e-10);assert.ok(Math.abs(c.effort**n-81)<1e-10);}
});
test('power units and capacitance energy use explicitly defined event rates',async()=>{
    const [a]=await modules,p=a.cmosPower();assert.ok(Math.abs(p.dynamicMW-6.4)<1e-12);assert.equal(p.leakageMW,1.6);assert.equal(p.shortCircuitMW,.2);assert.ok(Math.abs(p.totalMW-8.2)<1e-12);
    const idle=a.cmosPower({activity:0,shortRateMHz:0});assert.equal(idle.totalMW,1.6);
});
test('positive-edge storage and low-level clock-gate holding produce complete gated pulses',async()=>{
    const [,s]=await modules;assert.deepEqual(s.storageTrace().q,[[0,0],[2,1],[6,0],[10,1]]);
    assert.deepEqual(s.clockGating({initial:'0'}),s.clockGating({initial:0}));
    for(const initial of [0,1])for(const change of [1,3,5,7,9,11]){
        const d=s.clockGating({initial,change});assert.equal(d.partial,change%4===3);
        for(let i=1;i<d.rows.length;i++)if(d.rows[i].gated!==d.rows[i-1].gated)assert.equal(d.rows[i].t%2,0);
        if(d.partial){const event=d.rows.find(r=>r.t===change);assert.equal(event.held,initial);assert.notEqual(event.bare,event.gated);}
    }
});
test('extra output RC increases delay but leaves DC and input capacitance unchanged',async()=>{
    const [,,l]=await modules,d=l.customInverter();assert.equal(d.rn,10000);assert.equal(d.rp,10000);assert.ok(Math.abs(d.before.tplhPS-Math.LN2*50)<1e-12);assert.ok(Math.abs(d.after.tplhPS-Math.LN2*62.62)<1e-12);
    assert.ok(d.after.slewRisePS>d.before.slewRisePS);assert.equal(d.loadEnergyBeforeFJ,5);assert.equal(d.loadEnergyAfterFJ,6.2);
    const none=l.customInverter({parasiticFF:0,wireOhm:0});assert.deepEqual(none.before,none.after);assert.ok(none.samples.every(p=>p.before===p.after));assert.deepEqual(none.vtc,d.vtc);
    for(const sample of d.samples)assert.ok([sample.vin,sample.before,sample.after].every(v=>v>=0&&v<=d.vdd));
});
test('all native CMOS circuit and plot geometry remains finite',async()=>{
    const [a,s,l,p]=await modules;const figures=[p.inverterCircuit(),p.inverterLayout(),p.cmosCrossSection(),p.cellRow(),a.vtcFigure(a.inverterVtc()),a.gateCircuit('nand',a.cmosLogic()),a.gateCircuit('nor',a.cmosLogic()),a.gateSymbol('nand'),a.gateSymbol('nor'),a.driverRcFigure(),a.bufferChainFigure(a.bufferChain()),a.powerWaveforms(),s.tgLatchFigure({clock:0}),s.masterSlaveFigure(),s.setupHoldFigure(),s.icgFigure(),l.extractedRcFigure(),l.customTransient(l.customInverter())];
    for(const figure of figures){assert.match(figure,/^<svg/);assert.doesNotMatch(figure,/NaN|undefined|Infinity/);assert.match(figure,/role="img"/);}
});
