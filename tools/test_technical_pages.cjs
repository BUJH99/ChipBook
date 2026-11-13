const {test}=require('node:test');
const assert=require('node:assert/strict');

test('technical figures remain finite across normal and failing teaching cases',async()=>{
    const basics=await import('../assets/features/technical-pages/source/interface-basics.mjs');
    const serial=await import('../assets/features/technical-pages/source/serial-links.mjs');
    const channels=await import('../assets/features/technical-pages/source/channel-links.mjs');
    const buses=await import('../assets/features/technical-pages/source/bus-quality.mjs');
    const renderings=[basics.boundarySignalFigure(0),basics.boundarySignalFigure(255),basics.boundaryRoute('serial'),basics.outputCircuit('push-pull'),basics.outputCircuit('open-drain',{small:true}),channels.ddrInterface(),channels.dqsTiming(),channels.ddrCommands(),channels.trainingFigure({tap:0,jitter:9,offset:-5}),channels.pcieLayers(),channels.tlpFigure(),channels.ltssmFigure(),channels.usbPinMap('CC2'),channels.pdSequence(),channels.ethernetPath(),channels.ethernetFrame(),channels.ethernetEfficiency(),buses.dphyFigure(),buses.cphyFigure(),buses.canTopology(),buses.canVoltages(),buses.canArbitration(0x120,0x130),buses.canArbitration(2047,0),buses.linFigure(),buses.serdesEye({jitter:.4,noise:.4,equalize:0}),buses.dfeFigure(),buses.tdrExamples(),buses.budgetWaterfall({rate:8,lanes:4,efficiency:.8})];
    for(const mode of [0,1,2,3])for(const byte of [0,1,128,255])renderings.push(serial.spiTiming(mode,byte,255-byte));
    for(const parity of ['none','even','odd'])renderings.push(serial.uartFigure({value:150,parity,baud:115200,rxBaud:9600,badStop:true}));
    for(const kind of ['nack','stuck','read','uart','ddr','pcie'])renderings.push(buses.debugScenario(kind).html);
    for(const result of renderings){assert.doesNotMatch(result,/NaN|undefined|Infinity/);assert.ok(result.includes('role="img"')||result.includes('<table'));}
});

test('SoC budget, visibility, clock and access models preserve their boundary contracts',async()=>{
    const a=await import('../assets/features/technical-pages/source/soc-architecture.mjs');
    const c=await import('../assets/features/technical-pages/source/soc-control.mjs');
    const s=await import('../assets/features/technical-pages/source/soc-system.mjs');
    const p=await import('../assets/features/technical-pages/source/soc-analysis.mjs');
    const budget=a.frameBudget({width:1920,height:1080,bytesPerPixel:1.25,fps:60,bandwidth:1000,compute:6});
    assert.equal(budget.frameBytes,2592000);assert.equal(budget.rate,155.52);assert.equal(budget.interval,6);
    assert.ok(Math.abs(budget.latency-13.592)<1e-10);
    for(const direction of ['read','write']){
        assert.equal(a.coherenceResult({direction,coherent:0,maintenance:0}).observed,0x11);
        assert.equal(a.coherenceResult({direction,coherent:1,maintenance:0}).observed,0xa5);
        assert.equal(a.coherenceResult({direction,coherent:0,maintenance:1}).observed,0xa5);
    }
    const clock={power:1,locked:1,clockSource:'pll',edges:2,cpuReset:0,busReset:0,periReset:0};
    assert.deepEqual(c.clockDomainStates(clock).map(d=>d.frequency),[800,400,200]);
    assert.ok(c.clockDomainStates({...clock,edges:1}).every(d=>!d.released));
    assert.ok(c.clockDomainStates({...clock,locked:0}).every(d=>!d.released));
    assert.ok(c.clockDomainStates({...clock,locked:0,clockSource:'reference'}).every(d=>d.released));
    assert.ok(c.clockDomainStates({...clock,power:0,clockSource:'reference'}).every(d=>!d.released));
    assert.equal(c.bootRegisterWrite('STATUS',2).next,5); // BUSY remains; only DONE clears.
    assert.equal(c.bootRegisterWrite('CTRL',3).next,2); // START command self-clears.
    assert.equal(s.systemAccess({address:0x30000000,secure:1,write:0,locked:1}).response,'DECERR');
    assert.equal(s.systemAccess({address:0,secure:1,write:1,locked:1}).response,'SLVERR');
    assert.equal(s.systemAccess({address:0x2000ffff,secure:0,write:0,locked:1}).allowed,false);
    assert.equal(s.systemAccess({address:0x20010000,secure:0,write:1,locked:1}).allowed,true);
    const perf=p.systemPerformance({inputMB:256,outputMB:64,operationsG:20,peakTOPS:10,bandwidthGB:25,tiles:3});
    assert.equal(perf.load,10.24);assert.equal(perf.store,2.56);assert.equal(perf.compute,2);
    assert.equal(perf.roofline.intensity,62.5);assert.equal(perf.roofline.performance,1562.5);assert.equal(perf.roofline.milliseconds,12.8);
});

test('SoC arbiter conserves requests and integration scoreboard detects corruption after DMA DONE',async()=>{
    const {qosSchedule}=await import('../assets/features/technical-pages/source/soc-system.mjs');
    const {verificationTransfer}=await import('../assets/features/technical-pages/source/soc-analysis.mjs');
    for(const policy of ['priority','round-robin','weighted','deadline'])for(const counts of [[6,4,8],[0,0,0],[0,7,0],[24,1,5]]){
        const d=qosSchedule({camera:counts[0],cpu:counts[1],dma:counts[2],policy});
        assert.equal(d.rows.length,counts.reduce((a,b)=>a+b,0));
        counts.forEach((n,i)=>assert.equal(d.rows.filter(r=>r.source===i).length,n));
        assert.ok(d.rows.every(r=>r.pending.every(n=>n>=0)));
    }
    assert.deepEqual(qosSchedule({camera:6,cpu:4,dma:8,policy:'priority'}).stats.map(r=>r.first),[1,7,11]);
    assert.deepEqual(qosSchedule({camera:6,cpu:4,dma:8,policy:'round-robin'}).stats.map(r=>r.first),[1,2,3]);
    const good=verificationTransfer({length:16,pattern:250,stall:2,corruptAt:-1});
    assert.ok(good.pass);assert.equal(good.expected[6],0);assert.equal(good.transfer.sent,16);
    const bad=verificationTransfer({length:16,pattern:250,stall:2,corruptAt:7});
    assert.equal(bad.transfer.status,'DONE');assert.equal(bad.pass,false);assert.equal(bad.mismatch,7);
});

test('all native SoC illustrations produce finite labeled geometry',async()=>{
    const a=await import('../assets/features/technical-pages/source/soc-architecture.mjs');
    const c=await import('../assets/features/technical-pages/source/soc-control.mjs');
    const s=await import('../assets/features/technical-pages/source/soc-system.mjs');
    const p=await import('../assets/features/technical-pages/source/soc-analysis.mjs');
    const models=await import('../assets/features/curriculum/source/models.mjs');
    const v={inputMB:256,outputMB:64,operationsG:20,peakTOPS:10,bandwidthGB:25,tiles:3},perf=p.systemPerformance(v);
    const scenes=[a.framePipeline(a.frameBudget({width:1920,height:1080,bytesPerPixel:1.25,fps:60,bandwidth:1000,compute:6})),a.socExamplePath(),a.addressMapFigure(),a.ctrlBitsFigure(),a.decoderFigure(),a.byteLanesFigure(),a.memoryHierarchyFigure(),a.ownershipTimeline(),c.dmaArchitecture(),c.dmaTimeline(models.dmaTrace({length:32,beat:4,stall:2})),c.irqTopology(),c.timerWave(10),c.clearOrderFigure(true),c.clearOrderFigure(false),c.clockTreeFigure(),c.resetStartupFigure(),c.bootMemoryFigure(),c.softwareStackFigure(),s.nocMeshFigure(),s.powerSequenceFigure(),s.securityTopology(),p.performancePath(),p.performanceWaterfall(perf),p.overlapFigure(perf),p.rooflineFigure(v,perf),p.verificationEnvironment(),p.visionDetailFigure()];
    for(const mode of ['control','data','clock','power'])scenes.push(a.socPathFigure(mode));
    for(const mode of ['write','read','invalidate'])scenes.push(a.twoCoreFigure(mode));
    for(const kind of ['success','timeout','error'])scenes.push(c.driverPathFigure(kind));
    for(const kind of ['decode','rom','irq','reset'])scenes.push(p.integrationFaultFigure(kind));
    for(const kind of ['sensor','vision','storage','edge'])scenes.push(p.productFigure(kind),p.productBudgetsFigure(kind));
    scenes.push(s.qosServiceFigure(s.qosSchedule({camera:0,cpu:0,dma:0,policy:'weighted'})),s.accessPathFigure({address:0x20000000,master:'DMA',secure:0,write:1,locked:1}));
    for(const scene of scenes){assert.match(scene,/role="img"/);assert.doesNotMatch(scene,/NaN|undefined|Infinity/);}
});
