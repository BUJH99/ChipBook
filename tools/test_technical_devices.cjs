const {test}=require('node:test');
const assert=require('node:assert/strict');
const modules=Promise.all(['device-physics','device-process'].map(n=>import(`../assets/features/technical-pages/source/${n}.mjs`)));

test('PN depletion profiles conserve fixed charge and align field, potential and equilibrium carriers',async()=>{
    const [p]=await modules;
    for(const acceptors of [1e14,1e16,1e18])for(const donors of [1e14,1e16,1e18]){
        const d=p.pnJunction({acceptors,donors});assert.ok(Math.abs(d.acceptors*d.xp-d.donors*d.xn)/Math.max(d.acceptors*d.xp,1)<1e-12);
        assert.ok(Math.abs(d.xp+d.xn-d.width)<1e-12);assert.equal(d.points[0].potential,0);assert.equal(d.points.at(-1).potential,d.builtIn);
        assert.ok(d.points.every((v,i)=>v.field<=1e-10&&(!i||v.potential>=d.points[i-1].potential-1e-12)));
        assert.ok(d.points.every(v=>Math.abs(v.electron*v.hole-d.ni*d.ni)/(d.ni*d.ni)<1e-12));
        assert.ok(Math.abs(d.points.at(-1).electron-donors)/donors<1e-12);
    }
    const symmetrical=p.pnJunction();assert.ok(Math.abs(symmetrical.xp-symmetrical.xn)<1e-12);assert.ok(symmetrical.builtIn>.71&&symmetrical.builtIn<.72);
});

test('MOS regions and RC units match the same numerical contract',async()=>{
    const [p,d]=await modules;
    assert.equal(p.mosCurrent({vgs:.3,vth:.4,vds:1,beta:1}).current,0);
    const triode=p.mosCurrent({vgs:1.2,vth:.4,vds:.5,beta:1});assert.equal(triode.region,'Triode');assert.ok(Math.abs(triode.current-.275)<1e-12);
    assert.ok(Math.abs(p.mosCurrent({vgs:1.2,vth:.4,vds:1,beta:1}).current-.32)<1e-12);
    const edge=p.mosCurrent({vgs:1,vth:.4,vds:.6,beta:1});assert.equal(edge.region,'Saturation');assert.ok(Math.abs(edge.current-.18)<1e-12);
    const wire=d.wireRcResponse({resistance:1000,capacitanceFF:100,voltage:1});assert.equal(wire.tauPS,100);assert.ok(Math.abs(wire.risePS-Math.log(9)*100)<1e-10);assert.equal(wire.points[0][1],0);
});

test('global variation cancels in a matched pair while independent local variation has sqrt(2) sigma',async()=>{
    const [,p]=await modules;
    const common=p.mismatchSamples({mean:3,sigma:2,samples:1000,seed:2026,mode:'global'});assert.equal(common.std,0);assert.ok(common.values.every(v=>v===0));assert.equal(common.bins.reduce((a,b)=>a+b,0),1000);
    const local=p.mismatchSamples({mean:3,sigma:2,samples:5000,seed:2026,mode:'local'});assert.ok(Math.abs(local.std-Math.SQRT2*2)<.1);assert.ok(Math.abs(local.mean)<.1);assert.deepEqual(local,p.mismatchSamples({mean:3,sigma:2,samples:5000,seed:2026,mode:'local'}));assert.equal(local.bins.reduce((a,b)=>a+b,0),5000);
});

test('device figures are finite and expose accessible geometry',async()=>{
    const [p,d]=await modules;
    const figures=[p.pnChargeFigure(),p.pnProfiles(p.pnJunction({acceptors:1e18,donors:1e14})),p.mosSymbols(),d.metalRouting(),d.wireRcCircuit(),d.variationDistributions(),d.processCornerCurves(),d.currentMirrorFigure(),d.mismatchHistogram(d.mismatchSamples({mode:'global'})),d.cisReadout()];
    for(const figure of figures){assert.match(figure,/role="img"/);assert.doesNotMatch(figure,/NaN|undefined|Infinity/);}
});
