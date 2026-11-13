import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,plot,capacitor,ground} from './figures.mjs';
import {bindModel,put} from './ai-common.mjs';
import {inverterCircuit,inverterLayout,cmosCrossSection,cellRow,inverterSymbol} from './cmos-primitives.mjs';
import {inverterVtc,vtcFigure} from './cmos-analysis.mjs';

export function initCmosLayout(root) {put(root,'cmos-cell-schematic',inverterCircuit({load:false}));put(root,'cmos-cell-layout',inverterLayout());put(root,'cmos-cell-section',cmosCrossSection());put(root,'cmos-cell-row',cellRow());}

export function customInverter({wp=1.2,wn=.6,length=.18,loadFF=5,parasiticFF=1.2,wireOhm=100,vdd=1}={}) {
    // Explicit teaching model: reference Rp=Rn=10 kΩ at Wp=1.2, Wn=.6, L=.18 μm.
    const rp=10000*(length/.18)*(1.2/wp),rn=10000*(length/.18)*(.6/wn),cinFF=3*(wp+wn)*length;
    const before={tauRisePS:rp*loadFF/1000,tauFallPS:rn*loadFF/1000},after={tauRisePS:(rp+wireOhm)*(loadFF+parasiticFF)/1000,tauFallPS:(rn+wireOhm)*(loadFF+parasiticFF)/1000};
    const measure=d=>({...d,tplhPS:Math.LN2*d.tauRisePS,tphlPS:Math.LN2*d.tauFallPS,slewRisePS:Math.log(9)*d.tauRisePS,slewFallPS:Math.log(9)*d.tauFallPS});
    const betaRatio=(wp/wn)/2,center=(.3+Math.sqrt(betaRatio)*.7)/(1+Math.sqrt(betaRatio)),vtc=inverterVtc({vdd,center,vin:.5});
    const periodPS=Math.max(before.tauRisePS,before.tauFallPS,after.tauRisePS,after.tauFallPS)*14,dt=periodPS/600,samples=[];let a=vdd,b=vdd;
    for(let i=0;i<=1500;i++){const t=i*dt,vin=Math.floor(t/(periodPS/2))%2?vdd:0,target=vin?0:vdd;if(i){a=target+(a-target)*Math.exp(-dt/(target?before.tauRisePS:before.tauFallPS));b=target+(b-target)*Math.exp(-dt/(target?after.tauRisePS:after.tauFallPS));}samples.push({t,vin,before:a,after:b});}
    return{wp,wn,length,loadFF,parasiticFF,wireOhm,vdd,rp,rn,cinFF,before:measure(before),after:measure(after),vtc,samples,periodPS,loadEnergyBeforeFJ:loadFF*vdd*vdd,loadEnergyAfterFJ:(loadFF+parasiticFF)*vdd*vdd};
}
export function extractedRcFigure() {
    let s=inverterSymbol(25,105)+wire('M121 105H158l7-7 12 14 12-14 12 14 12-14 12 14 7-7H326',C.ink,1.5)+node(326,105)+wire('M326 105H373M326 105V138M270 105V138',C.ink,1.5)+capacitor(326,138,48)+capacitor(270,138,48)+wire('M270 186V215H326V186',C.ink)+ground(298,215)+tx(16,66,'Vin','class="small blue"')+tx(207,65,'Rwire','text-anchor="middle" class="small"')+tx(373,82,'Vout','text-anchor="end" class="small blue"')+tx(250,170,'Cpara','text-anchor="end" class="small"')+tx(345,170,'CL','class="small"')+tx(200,269,'같은 driver + 추가 배선 R / shunt C','text-anchor="middle" class="small"');return svg(415,295,'같은 inverter driver 출력에 추가 배선 저항과 shunt 기생 capacitance를 넣은 추출 RC 축약 모델',s);
}
export function customTransient(d) {
    const left=84,right=728,top=29,sx=t=>left+t/d.samples.at(-1).t*(right-left);let s='';
    for(let i=0;i<2;i++){const y=top+i*166,base=y+107;s+=wire(`M${left} ${y}V${base}H${right}`,C.ink,1.2)+tx(4,y+57,i?'Vout (V)':'Vin (V)','class="small label"');for(let k=0;k<=5;k++){const t=d.samples.at(-1).t*k/5;s+=wire(`M${sx(t)} ${y}V${base}`,'#dce5ef',.8)+tx(sx(t),base+22,fmt(t),'text-anchor="middle" class="small"');}for(const ser of (i?[{key:'after',c:C.blue,dash:''},{key:'before',c:C.red,dash:'stroke-dasharray="5 4"'}]:[{key:'vin',c:C.green,dash:''}]))s+=wire(d.samples.map((p,j)=>`${j?'L':'M'}${sx(p.t)} ${base-p[ser.key]/d.vdd*100}`).join(''),ser.c,2,ser.dash);}
    s+=tx(411,374,'Time (ps) · RC 모델 응답','text-anchor="middle" class="small"');return svg(756,398,'동일한 square-wave 입력에 대한 schematic RC와 추가 기생 RC model transient 응답 비교',s);
}
export function initCmosCustom(root) {
    put(root,'cmos-custom-schematic',inverterCircuit({load:false,sizing:true}));put(root,'cmos-custom-layout',inverterLayout({legend:false}));put(root,'cmos-custom-extracted',extractedRcFigure());
    bindModel(root,'cmos-custom',v=>{const d=customInverter(v);put(root,'cmos-custom-dc',vtcFigure(d.vtc,{width:590,height:355}));put(root,'cmos-custom-transient',customTransient(d));const delta=(a,b)=>a?`${fmt((b/a-1)*100)}%`:'—';
        put(root,'cmos-custom-results',table(['지표','추가 RC 없음','추가 RC 포함','변화'],[['tpLH · ps',fmt(d.before.tplhPS),fmt(d.after.tplhPS),delta(d.before.tplhPS,d.after.tplhPS)],['tpHL · ps',fmt(d.before.tphlPS),fmt(d.after.tphlPS),delta(d.before.tphlPS,d.after.tphlPS)],['Rise 10–90% · ps',fmt(d.before.slewRisePS),fmt(d.after.slewRisePS),delta(d.before.slewRisePS,d.after.slewRisePS)],['Fall 90–10% · ps',fmt(d.before.slewFallPS),fmt(d.after.slewFallPS),delta(d.before.slewFallPS,d.after.slewFallPS)],['Input C · fF',fmt(d.cinFF),fmt(d.cinFF),'0% · 입력 기생 제외'],['Output C · fF',fmt(d.loadFF),fmt(d.loadFF+d.parasiticFF),delta(d.loadFF,d.loadFF+d.parasiticFF)],['Supply energy / 0→1 · fJ',fmt(d.loadEnergyBeforeFJ),fmt(d.loadEnergyAfterFJ),delta(d.loadEnergyBeforeFJ,d.loadEnergyAfterFJ)]]));
        put(root,'cmos-custom-conditions',table(['모델 조건','값'],[['Rp / Rn',`${fmt(d.rp/1000)} / ${fmt(d.rn/1000)} kΩ`],['VDD',`${fmt(d.vdd)} V`],['추가 Rwire',`${fmt(d.wireOhm)} Ω`],['입력 pulse period',`${fmt(d.periodPS)} ps`],['공정 / 온도','Characterized corner 없음 · 가상 수치 model']]));
    });
}
