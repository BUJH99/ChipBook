import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {layoutGradient} from '../../curriculum/source/detail-models.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,plot,ground} from './figures.mjs';
import {bindModel,put} from './ai-common.mjs';
import {feedbackCircuit,frequencyPlot,stepValue,mirrorLayout,analogMos,vResistor} from './analog-common.mjs';
import {mismatchSamples,mismatchHistogram} from './device-process.mjs';
import {mirrorCircuit} from './analog-foundations.mjs';

export function feedbackLoop({a0dB=80,dominantHz=1000,rf=90,rg=10,routK=10,loadPF=10}={}) {
    const a0=10**(a0dB/20),beta=rg/(rg+rf),l0=a0*beta,w1=2*Math.PI*dominantHz,w2=1/(routK*1000*loadPF*1e-12),secondHz=w2/(2*Math.PI),wn=Math.sqrt(w1*w2*(1+l0)),damping=(w1+w2)/(2*wn);
    const aa=1/(w1*w1*w2*w2),bb=1/(w1*w1)+1/(w2*w2),cc=1-l0*l0,omegaCross=l0>1?Math.sqrt(-2*cc/(bb+Math.sqrt(bb*bb-4*aa*cc))):null,fc=omegaCross===null?null:omegaCross/(2*Math.PI),phaseMargin=fc===null?null:180-(Math.atan(omegaCross/w1)+Math.atan(omegaCross/w2))*180/Math.PI;
    const point=f=>{const a=f/dominantHz,b=f/secondHz;return{f,magnitude:20*Math.log10(l0/Math.sqrt((1+a*a)*(1+b*b))),phase:-(Math.atan(a)+Math.atan(b))*180/Math.PI};};
    const poles=damping>1?[wn*(damping-Math.sqrt(damping*damping-1)),wn*(damping+Math.sqrt(damping*damping-1))]:[damping*wn],duration=8/Math.max(Math.min(...poles),1),step=Array.from({length:301},(_,i)=>{const t=duration*i/300;return[t*1e6,stepValue(t,damping,wn)];}),overshoot=damping<1?100*Math.exp(-Math.PI*damping/Math.sqrt(1-damping*damping)):0;
    return{a0,beta,l0,w1,w2,secondHz,wn,damping,fc,phaseMargin,point,duration,step,overshoot,dcGain:a0/(1+l0)};
}
export function loopBode(d) {
    const width=650,height=443,left=65,right=581,top=47,bottom=355,sx=f=>left+(Math.log10(f)-1)/7*(right-left),sy=v=>bottom-(v+60)/140*(bottom-top),sp=p=>top-p/180*(bottom-top);let s='';
    for(let e=1;e<=8;e++)s+=wire(`M${sx(10**e)} ${top}V${bottom}`,'#e0e8f2',.8)+tx(sx(10**e),bottom+25,`10^${e}`,'text-anchor="middle" class="small"');
    for(let db=-60;db<=80;db+=20)s+=wire(`M${left} ${sy(db)}H${right}`,'#e0e8f2',.8)+tx(left-10,sy(db)+5,String(db),'text-anchor="end" class="small"');
    for(const phase of [0,-45,-90,-135,-180])s+=tx(right+10,sp(phase)+5,String(phase),'class="small" style="fill:#eb5874"');
    const points=Array.from({length:241},(_,i)=>d.point(10**(1+7*i/240)));s+=wire(points.map((p,i)=>`${i?'L':'M'}${sx(p.f)} ${sy(Math.max(-60,Math.min(80,p.magnitude)))}`).join(''),C.blue,2.5)+wire(points.map((p,i)=>`${i?'L':'M'}${sx(p.f)} ${sp(p.phase)}`).join(''),C.red,2.2)+wire(`M${left} ${sy(0)}H${right}`,C.purple,1,'stroke-dasharray="5 4"');
    s+=tx(left,22,'Loop |Aβ| (dB)','class="small blue"')+tx(right,22,'Phase (deg)','text-anchor="end" class="small" style="fill:#eb5874"')+tx(326,418,'Frequency (Hz) · logarithmic','text-anchor="middle" class="small"');
    if(d.fc&&d.fc>=10&&d.fc<=1e8){const x=sx(d.fc),y=sp(d.point(d.fc).phase);s+=wire(`M${x} ${top}V${bottom}`,C.purple,1,'stroke-dasharray="4 4"')+arrow(x+12,bottom,x+12,y,C.ink)+tx(x-8,y-15,`PM ${fmt(d.phaseMargin)}°`,'text-anchor="end" class="small label"')+tx(x,bottom+47,`${fmt(d.fc/1000)} kHz`,'text-anchor="middle" class="small"');}
    return svg(width,height,'두 pole open-loop A와 feedback beta의 loop gain 크기 및 위상, unity loop gain의 phase margin',s);
}
export function initAnalogFeedback(root) {
    bindModel(root,'analog-loop',v=>{const d=feedbackLoop(v),loaded=feedbackLoop({...v,loadPF:v.loadPF*5}),duration=Math.max(d.duration,loaded.duration);put(root,'analog-loop-circuit',feedbackCircuit(v));put(root,'analog-loop-bode',loopBode(d));put(root,'analog-loop-step',plot([{points:Array.from({length:301},(_,i)=>{const t=duration*i/300;return[t*1e6,stepValue(t,d.damping,d.wn)];}),color:C.blue},{points:Array.from({length:301},(_,i)=>{const t=duration*i/300;return[t*1e6,stepValue(t,loaded.damping,loaded.wn)];}),color:C.red}],{width:760,height:370,xmax:duration*1e6,ymax:1+Math.max(d.overshoot,loaded.overshoot)/100+.15,xlabel:'Time (μs)',ylabel:'Normalized closed-loop output'}));put(root,'analog-loop-results',table(['동일한 two-pole 모델','선택한 CL','CL × 5'],[['Load pole f₂',`${fmt(d.secondHz/1000)} kHz`,`${fmt(loaded.secondHz/1000)} kHz`],['Unity-loop crossover',d.fc?`${fmt(d.fc/1000)} kHz`:'없음',loaded.fc?`${fmt(loaded.fc/1000)} kHz`:'없음'],['Phase margin',d.phaseMargin===null?'—':`${fmt(d.phaseMargin)}°`,loaded.phaseMargin===null?'—':`${fmt(loaded.phaseMargin)}°`],['Damping ζ',fmt(d.damping),fmt(loaded.damping)],['Overshoot',`${fmt(d.overshoot)}%`,`${fmt(loaded.overshoot)}%`],['DC closed-loop gain',`${fmt(d.dcGain)} V/V`,`${fmt(loaded.dcGain)} V/V`]]));});
}

export function noiseBudget({thermal=4,resistor=3,other=1,flicker=20,lowHz=10,highHz=1e6}={}) {
    if(!(highHz>lowHz&&lowHz>0))throw new Error('적분 상한은 양수인 하한보다 커야 합니다.');
    const bandwidth=highHz-lowHz,parts=[['MOS white',thermal*thermal*bandwidth],['Resistor white',resistor*resistor*bandwidth],['Other white',other*other*bandwidth],['Flicker · e100²×100/f',flicker*flicker*100*Math.log(highHz/lowHz)]],variance=parts.reduce((sum,p)=>sum+p[1],0),white=thermal*thermal+resistor*resistor+other*other;
    const points=Array.from({length:181},(_,i)=>{const f=10**(Math.log10(lowHz)+Math.log10(highHz/lowHz)*i/180);return{f,white:Math.sqrt(white),flicker:flicker*Math.sqrt(100/f),total:Math.sqrt(white+flicker*flicker*100/f)};});
    return{parts:parts.map(([name,v])=>({name,varianceNV2:v,rmsUV:Math.sqrt(v)/1000})),rmsUV:Math.sqrt(variance)/1000,varianceNV2:variance,points,lowHz,highHz};
}
export function noisePairCircuit() {
    let s=wire('M168 35H383M168 35V60M383 35V60M168 132V188M383 132V188M168 264V298H383V264M275 298V326M275 366V395',C.ink,1.6)+vResistor(168,60,72,'RD')+vResistor(383,60,72,'RD')+analogMos(168,226)+analogMos(383,226,'n','right')+wire('M116 226H80M435 226H471M168 158H105M383 158H447',C.ink)+node(168,158)+node(383,158);
    for(const x of [59,492])s+=`<circle cx="${x}" cy="226" r="21" fill="#fff" stroke="${C.blue}"/>`+wire(`M${x-13} 226q6-15 13 0t13 0`,C.blue,1.5);
    s+=wire('M10 226H38M513 226H541',C.ink)+`<circle cx="275" cy="346" r="20" fill="#fff" stroke="${C.ink}"/>`+arrow(275,332,275,359,C.ink)+ground(275,395)+tx(275,20,'VDD','text-anchor="middle" class="label"')+tx(32,196,'en₁','class="small blue"')+tx(478,196,'en₂','class="small blue"')+tx(97,145,'Vout−','text-anchor="end" class="small"')+tx(450,145,'Vout+','class="small"')+tx(275,450,'입력 환산 전압 잡음의 등가 표현 · offset과 별도','text-anchor="middle" class="small"');return svg(563,477,'두 입력의 equivalent noise source와 resistive-load differential pair의 잡음 모델 경계',s);
}
export function offsetDistribution({avt=3,width=10,length=.18,samples=1000,seed=2026}={}) {const sigma=avt/Math.sqrt(width*length);return{sigma,...mismatchSamples({sigma:sigma/Math.SQRT2,samples:Number(samples),seed,mean:0,mode:'local'})};}
export function initAnalogNoise(root) {
    put(root,'analog-noise-layout',mirrorLayout());put(root,'analog-noise-circuit',noisePairCircuit());
    bindModel(root,'analog-noise',v=>{const d=noiseBudget(v),min=Math.max(.01,Math.min(...d.points.map(p=>p.white),...d.points.map(p=>p.flicker))*.6),max=Math.max(...d.points.map(p=>p.total))*1.3;put(root,'analog-noise-spectrum',frequencyPlot([{points:d.points.map(p=>[p.f,p.white]),color:C.orange},{points:d.points.map(p=>[p.f,p.flicker]),color:C.blue},{points:d.points.map(p=>[p.f,p.total]),color:C.purple,dash:true}],{width:650,height:400,xmin:v.lowHz,xmax:v.highHz,ymin:min,ymax:max,logY:true,ylabel:'Input ASD (nV/√Hz)'}));put(root,'analog-noise-budget',table(['독립 잡음원','적분 variance (nV²)','입력 환산 RMS (μV)'],[...d.parts.map(p=>[p.name,fmt(p.varianceNV2),fmt(p.rmsUV)]),['RSS total',fmt(d.varianceNV2),fmt(d.rmsUV)]]));});
    bindModel(root,'analog-offset',v=>{const d=offsetDistribution(v);put(root,'analog-offset-histogram',mismatchHistogram(d));put(root,'analog-offset-results',table(['Pair mismatch model','값'],[['σpair = Avt / √(WL)',`${fmt(d.sigma)} mV`],['표본 mean',`${fmt(d.mean)} mV`],['표본 σ',`${fmt(d.std)} mV`],['표본 수',Number(v.samples)]]));});
}
export function gradientFigure({pattern='ABBA',gradient=1}={}) {
    const d=layoutGradient({pattern,gradient}),width=640,x0=80,step=122;let s=rect(42,28,552,211,'#f7faff','#d6e1ef');
    [...pattern].forEach((name,i)=>{const x=x0+i*step,c=name==='A'?C.blue:C.orange;s+=rect(x,77,72,91,c+'2b',c,2)+tx(x+36,129,name,'text-anchor="middle" class="label"')+tx(x+36,200,`x=${fmt(d.positions[i])}`,'text-anchor="middle" class="small"')+tx(x+36,224,`${fmt(d.positions[i]*gradient)}%`,'text-anchor="middle" class="small"');});
    s+=arrow(83,279,527,279,C.purple)+tx(305,304,`Linear gradient · ${fmt(gradient)} % / unit`,'text-anchor="middle" class="small"')+tx(305,344,`A 평균 ${fmt(d.a)}% · B 평균 ${fmt(d.b)}% · A−B ${fmt(d.mismatch)}%`,'text-anchor="middle" class="label blue"');return svg(width,369,'선택한 네 unit의 x 위치와 선형 gradient에 의한 각 변화 및 평균 mismatch',s);
}
export function initAnalogLayout(root) {
    put(root,'analog-centroid-layout',mirrorLayout('ABBABAAB',{large:true}));put(root,'analog-layout-mirror',mirrorCircuit());
    bindModel(root,'analog-layout',v=>{put(root,'analog-layout-selected',gradientFigure(v));for(const pattern of ['AABB','ABAB','ABBA'])put(root,`analog-pattern-${pattern.toLowerCase()}`,gradientFigure({...v,pattern}));put(root,'analog-layout-results',table(['배치','A centroid','B centroid','A−B mismatch (%)'],['AABB','ABAB','ABBA'].map(pattern=>{const d=layoutGradient({...v,pattern}),xs=[...pattern].map((p,i)=>({p,x:d.positions[i]})),mean=p=>xs.filter(a=>a.p===p).reduce((sum,a)=>sum+a.x,0)/2;return[pattern,fmt(mean('A')),fmt(mean('B')),fmt(d.mismatch)];})));});
}
