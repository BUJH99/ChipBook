const {test}=require('node:test');
const assert=require('node:assert/strict');
const modules=Promise.all(['ai-numerics','ai-data','ai-operators','ai-system'].map(n=>import(`../assets/features/technical-pages/source/${n}.mjs`)));

test('CNN workload shapes, byte counts and all signed INT8 partial products agree with arithmetic',async()=>{
    const [n]=await modules,v={height:224,width:224,inputChannels:3,outputChannels:64,kernel:7,stride:2,padding:3,batch:1,elementBytes:2},d=n.workload(v);
    assert.deepEqual([d.outH,d.outW,d.k,d.macs,d.input*2,d.weights*2,d.output*2],[112,112,147,118013952,301056,18816,1605632]);
    assert.throws(()=>n.workload({...v,height:1,width:1,padding:0}));
    for(let a=-128;a<=127;a++)for(let b=-128;b<=127;b++)assert.equal(n.signedPartialProducts(a,b).reduce((s,p)=>s+p.value,0),a*b||0);
    assert.deepEqual(n.macAcceptanceTrace().map(r=>r[6]),[5,19,19,19,13]);
});

test('native systolic state preserves non-default matrices, initial state and physical stalls',async()=>{
    const [n]=await modules,{A,B}=n.arrayPresets.small;
    assert.deepEqual(n.arrayState(A,B,{cycle:3}).sums,[[19,22],[43,50]]);
    assert.deepEqual(n.arrayState(A,B,{cycle:-1}).sums,[[0,0],[0,0]]);
    const before=n.arrayState(A,B,{cycle:0}),held=n.arrayState(A,B,{cycle:1,stallAt:1,stallLength:2});
    assert.deepEqual(held.sums,before.sums);assert.equal(held.logical,0);assert.equal(held.stalled,true);
    assert.deepEqual(n.arrayState(A,B,{cycle:5,stallAt:1,stallLength:2}).sums,[[19,22],[43,50]]);
    const four=n.arrayState(n.arrayPresets.identity.A,n.arrayPresets.identity.B,{cycle:9});assert.equal(four.cycles,10);assert.deepEqual(four.sums,n.arrayPresets.identity.A);
});

test('double buffering never overlaps incompatible ownership and shared DMA transfers',async()=>{
    const [,d]=await modules;
    for(const resource of ['independent','shared'])for(const load of [1,6,13])for(const compute of [1,2,10])for(const store of [1,4,11]){
        const s=d.doubleBufferSchedule({tiles:8,load,compute,store,resource});
        s.rows.forEach((r,i)=>{assert.ok(r.lEnd<=r.cStart&&r.cEnd<=r.sStart);if(i>=2)assert.ok(r.lStart>=s.rows[i-2].sEnd);if(i>0)assert.ok(r.cStart>=s.rows[i-1].cEnd);});
        if(resource==='shared'){
            const intervals=s.rows.flatMap(r=>[[r.lStart,r.lEnd],[r.sStart,r.sEnd]]).sort((a,b)=>a[0]-b[0]);
            for(let i=1;i<intervals.length;i++)assert.ok(intervals[i][0]>=intervals[i-1][1]);
        }
        assert.equal(s.overlapped,s.rows.at(-1).sEnd);assert.ok(s.overlapped<=s.serial);
    }
    assert.equal(d.doubleBufferSchedule({tiles:4,load:6,compute:10,store:4,resource:'independent'}).overlapped,50);
});

test('CSR and bitmap decode all-zero, dense and mixed signed matrices without losing coordinates',async()=>{
    const [,,o]=await modules;
    for(const matrix of [o.sparseExample,Array.from({length:4},()=>Array(8).fill(0)),Array.from({length:4},(_,i)=>Array.from({length:8},(_,j)=>i*8+j+1))]){
        const d=o.sparseEncoding(matrix),decoded=Array.from({length:4},()=>Array(8).fill(0));
        for(let r=0;r<4;r++)for(let k=d.rowPtr[r];k<d.rowPtr[r+1];k++)decoded[r][d.colIdx[k]]=d.values[k];
        assert.deepEqual(decoded,matrix);assert.equal(d.rowPtr.at(-1),d.nnz);assert.equal(d.bitmap.reduce((a,b)=>a+b,0),d.nnz);
        let pos=0;assert.deepEqual(d.bitmap.map(bit=>bit?d.values[pos++]:0),matrix.flat());
    }
    const d=o.sparseEncoding(o.sparseExample);assert.equal(d.sparsity,75);assert.equal(d.csrBytes,21);assert.equal(d.bitmapBytes,12);assert.deepEqual(d.rowPtr,[0,2,4,6,8]);
});

test('attention normalizes rows, applies causal mask, and computes the same weighted V',async()=>{
    const [,,o]=await modules;
    for(const causal of [false,true])for(const scale of [0,1,8]){
        const d=o.attentionMatrices({causal,scale});d.weights.forEach((r,i)=>{assert.ok(Math.abs(r.reduce((a,b)=>a+b,0)-1)<1e-12);if(causal)r.forEach((w,j)=>{if(j>i)assert.equal(w,0);});});
        d.output.forEach((r,i)=>r.forEach((v,j)=>assert.ok(Math.abs(v-d.weights[i].reduce((s,w,k)=>s+w*d.V[k][j],0))<1e-12)));
    }
    const d=o.attentionMatrices({causal:true});assert.deepEqual(d.output[0],[1,2]);
    const g=o.activationAnalysis({mode:'gelu',minimum:-8,maximum:8,segments:16,scale:.25,width:8});assert.ok(Math.abs(g.rows[0].reference)<1e-6);assert.ok(g.rows.some(r=>r.reference<0));assert.ok(Number.isFinite(g.maxError));
    assert.equal(o.compilerBudget({rows:64,cols:64,bytes:1,fusion:'on',fallback:'off'}).avoided,8192);
});

test('accelerator scoreboard traces the injected delta to the same output coordinate and cycle',async()=>{
    const [,,,s]=await modules,d=s.acceleratorVerification();
    assert.equal(d.reference[2][1],5);assert.equal(d.actual[2][1],4);assert.deepEqual(d.first,{i:2,j:1,difference:-1});assert.equal(d.pass,false);
    assert.deepEqual(d.trace.map(r=>r.reference),[-6,-11,-7,5]);assert.deepEqual(d.trace.map(r=>r.actual),[-6,-11,-8,4]);assert.equal(d.trace[2].cycle,5);
    assert.equal(s.acceleratorVerification({fault:'off'}).pass,true);
    const tolerated=s.acceleratorVerification({comparison:'absolute',tolerance:1});assert.equal(tolerated.pass,true);assert.equal(tolerated.different.length,1);
    const run=s.coreRun({preset:'small',stall:2});assert.equal(run.doneClock,6);assert.deepEqual(run.output,[[19,22],[43,50]]);assert.equal(run.rows.filter(r=>r.done).length,1);assert.equal(run.rows.at(-1).done,0);
});

test('accelerator roofline and assumed power components preserve units and totals',async()=>{
    const [,,,s]=await modules,d=s.acceleratorPerformance({operationsG:2,trafficMB:200,peak:2000,bandwidth:100,fill:.1,drain:.1});
    assert.equal(d.intensity,10);assert.equal(d.performance,1000);assert.equal(d.milliseconds,2);assert.ok(Math.abs(d.serial-3.2)<1e-12);
    const p=s.powerBreakdown({activity:.2,capacitancePF:100,voltage:.8,frequencyMHz:500,leakageMA:2});assert.ok(Math.abs(p.totalMW-8)<1e-12);assert.ok(Math.abs(p.parts.reduce((a,b)=>a+b.value,0)-p.totalMW)<1e-12);
});

test('all AI diagrams expose labeled finite native geometry',async()=>{
    const [n,d,o,s]=await modules,v={height:224,width:224,inputChannels:3,outputChannels:64,kernel:7,stride:2,padding:3,batch:1,elementBytes:2},w=n.workload(v),a=n.arrayPresets.small,state=n.arrayState(a.A,a.B,{cycle:3}),pv={operationsG:2,trafficMB:200,peak:2000,bandwidth:100,fill:.1,drain:.1},p=s.acceleratorPerformance(pv);
    const scenes=[n.convolutionWindow(v,w),n.im2colFigure(v,w),...[8,16,32].map(n.formatBits),n.quantRange({width:8,zero:0,scale:.25},{}),n.macOverview(),n.partialProductFigure(-128,-128),n.adderTreeFigure(-128,-128),n.arrayNetwork(a.A,a.B,state),n.arrayOccupancy(state),...['OS','WS','IS'].map(d.dataflowNetwork),d.rowStationaryFigure(),d.tileMatrixFigure({m:17,n:16,k:16,tm:8,tn:8,tk:8}),d.tileBankMap({banks:8,rowStride:8,pattern:'column'}),d.bankMappingFigure({banks:4,stride:4,requests:16,start:3}),d.bufferArchitecture(),d.doubleBufferFigure(d.doubleBufferSchedule({tiles:8,load:1,compute:3,store:1,resource:'shared'})),o.postprocessPath(),o.sparseSchedule(o.sparseExample),o.attentionOverview(),o.kvGrowthFigure(true),o.compilerFlow(),o.fusionFigure(true,true),o.tensorLifetime(true),s.acceleratorRoofline(pv,p),s.workloadTiming(p),s.powerDonut(s.powerBreakdown({activity:0,capacitancePF:0,voltage:.8,frequencyMHz:500,leakageMA:0})),s.divergenceMap(s.acceleratorVerification()),s.miniNpuArchitecture(),s.coreTiming(s.coreRun({preset:'identity',stall:6}))];
    for(const scene of scenes){assert.match(scene,/role="img"/);assert.doesNotMatch(scene,/NaN|undefined|Infinity/);}
});
