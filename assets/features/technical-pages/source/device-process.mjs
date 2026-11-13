import {rc} from '../../curriculum/source/models.mjs';
import {pvtDelay} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox,capacitor,ground,plot} from './figures.mjs';
import {bindModel,put,numberGrid} from './ai-common.mjs';
import {mosGlyph,mosCurrent} from './device-physics.mjs';

export function metalRouting() {
    const left=32,top=35,size=480;let s=rect(left,top,size,size,'#fcfdff','#d2dfef',0);
    for(let i=1;i<24;i++)s+=wire(`M${left+i*20} ${top}v${size}M${left} ${top+i*20}h${size}`,'#e6edf5',.7);
    s+=rect(79,450,88,58,'#edf0f5','#879bb3',2)+tx(123,485,'Logic A','text-anchor="middle" class="small label"')+rect(347,450,98,58,'#edf0f5','#879bb3',2)+tx(396,485,'Logic B','text-anchor="middle" class="small label"');
    s+=wire('M123 450V407M396 450V369',C.red,11)+wire('M123 407H269M396 369H449M67 303H480',C.blue,17)+wire('M269 407V147M449 369V147',C.green,17)+wire('M269 147H449M69 211H177',C.orange,17);
    [[269,407],[449,369],[269,147],[449,147]].forEach(([x,y])=>s+=rect(x-11,y-11,22,22,'#e8dcfb',C.purple,2)+node(x,y,C.purple,4));
    [[123,407],[396,369]].forEach(([x,y])=>s+=rect(x-10,y-10,20,20,'#ffe1e9',C.red,1));
    const leaders=[[449,147,'M3 · 같은 net의 상층 연결',C.orange,178],[449,205,'M2 · 수직 경로',C.green,237],[449,369,'V1 · M1 ↔ M2',C.purple,353],[269,147,'V2 · M2 ↔ M3',C.purple,116],[451,303,'M1 · 다른 net',C.blue,295],[396,425,'Contact · device ↔ M1',C.red,435]];
    leaders.forEach(([x,y,label,c,ly])=>s+=node(x,y,c,3)+wire(`M${x+4} ${y}H530V${ly}H546`,c,1)+tx(552,ly+5,label,'class="small"'));
    s+=tx(262,550,'교차점에 via가 없으면 서로 다른 metal layer는 연결되지 않음','text-anchor="middle" class="small"');return svg(785,574,'Logic A와 B를 contacts M1 V1 M2 V2 M3로 연결하고 다른 layer 교차를 구분한 평면 경로',s);
}
export function wireRcCircuit() {
    let s=`<circle cx="48" cy="104" r="26" fill="#fff" stroke="${C.ink}"/>`+tx(48,99,'+','text-anchor="middle"')+tx(48,120,'−','text-anchor="middle"')+wire('M48 78V56H127',C.ink,1.8)+wire('M127 56h10l7-7 12 14 12-14 12 14 12-14 12 14 7-7h16',C.ink,1.8)+wire('M227 56H383',C.ink,1.8)+node(316,56,C.ink)+wire('M316 56V89',C.ink,1.8)+capacitor(316,89,46)+wire('M316 135V164H48V130',C.ink,1.8)+ground(185,164);
    s+=tx(174,32,'R','text-anchor="middle" class="label"')+tx(342,118,'C','class="label"')+tx(11,213,'Vin · step','class="small"')+tx(383,39,'Vout','text-anchor="end" class="label blue"');return svg(410,239,'Series wire resistance와 shunt load capacitance의 일차 RC step 응답 회로',s);
}
export function wireRcResponse(v) {const d=rc({resistance:v.resistance,capacitancePF:v.capacitanceFF/1000,voltage:v.voltage});return{...d,tauPS:d.tauNS*1000,risePS:d.riseNS*1000,points:d.points.map(p=>[p.x*1000,p.y])};}
export function initDeviceInterconnect(root) {
    put(root,'device-metal-routing',metalRouting());put(root,'device-wire-circuit',wireRcCircuit());
    bindModel(root,'device-wire',v=>{const d=wireRcResponse(v);put(root,'device-wire-response',plot([{points:d.points,color:C.blue}],{width:640,height:320,xmin:0,xmax:5*d.tauPS,ymin:0,ymax:v.voltage*1.05,xlabel:'Time (ps)',ylabel:'Vout (V)',points:[{x:d.tauPS,y:v.voltage*(1-Math.exp(-1))}]}));put(root,'device-wire-result',`<small>R × C · 10–90% = ln(9) × τ</small>τ = ${fmt(d.tauPS)} ps<br>Rise = ${fmt(d.risePS)} ps`);});
}

export const deviceStructures={
    planar:{name:'Planar MOSFET',image:'planar-device',channel:'평면 표면 channel',control:'주로 상면에서 gate가 channel 전위를 제어',geometry:'Width와 length를 layout rule로 정의',constraints:'Body effect · short-channel effect · junction capacitance',model:'PDK의 해당 planar compact model · W/L·Vth·mobility·Rs/Rd'},
    finfet:{name:'FinFET',image:'finfet-device',channel:'돌출된 fin의 상면과 양측면',control:'Gate가 fin의 여러 면을 감싸 전위를 제어',geometry:'Fin 수·높이·폭과 gate length가 설계 제약에 연결',constraints:'Fin pitch · contact resistance · parasitic C · self-heating',model:'PDK의 FinFET compact model · fin 수·geometry·parasitic'},
    gaa:{name:'GAA nanosheet',image:'gaa-device',channel:'쌓인 nanosheet / nanowire channel',control:'Gate가 각 channel 둘레를 감싸 전위를 제어',geometry:'Sheet 수·폭·두께와 간격이 구조와 drive에 연결',constraints:'Channel release · inner spacer · contact · thermal 경로',model:'PDK의 GAA compact model · sheet geometry·parasitic·thermal 조건'}
};
export function initDeviceStructures(root) {
    const select=root.querySelector('[name="deviceStructure"]'),image=root.querySelector('[data-device-selected-image]'),render=()=>{const d=deviceStructures[select.value];image.src=`../assets/pages/page-12-device-process/images/${d.image}.png`;image.alt=`선택한 ${d.name}의 단면과 입체 구조`;put(root,'device-selected-description',table(['구조와 model 관점',d.name],[['Channel',d.channel],['Gate 제어',d.control],['Geometry',d.geometry],['검토 조건',d.constraints],['회로 해석',d.model]]));};select.addEventListener('input',render);image.addEventListener('load',()=>window.GuidebookPage?.notifyHeight?.());render();
}

export function variationDistributions() {
    const labels=['ΔLg / σLg','Δtox / σtox','ΔVth / σVth'];let s='';
    labels.forEach((label,i)=>{const x=10+i*221,left=x+29,right=x+198,top=43,bottom=170,sx=v=>left+(v+4)/8*(right-left),sy=v=>bottom-v/.42*(bottom-top),c=[C.blue,C.orange,C.green][i];s+=tx(x+110,23,label,'text-anchor="middle" class="label"')+wire(`M${left} ${top}V${bottom}H${right}`,C.ink,1.2);const points=Array.from({length:81},(_,j)=>{const z=-4+j*.1;return[z,Math.exp(-z*z/2)/Math.sqrt(2*Math.PI)];});s+=wire(points.map(([z,p],j)=>`${j?'L':'M'}${sx(z)} ${sy(p)}`).join(''),c,2.2)+wire(`M${sx(0)} ${top}V${bottom}`,c,1,'stroke-dasharray="4 4"')+tx(sx(-3),192,'−3','text-anchor="middle" class="small"')+tx(sx(0),192,'0','text-anchor="middle" class="small"')+tx(sx(3),192,'3','text-anchor="middle" class="small"');});
    s+=tx(340,227,'정규화한 Gaussian 예 · 실제 parameter의 분포와 상관관계는 model에 따름','text-anchor="middle" class="small"');return svg(680,250,'Gate length oxide thickness threshold의 정규화한 parameter 분포 개념',s);
}
export function processCornerCurves() {
    const corners=[{name:'FF 예',beta:1.2,vth:.35,color:C.red},{name:'TT 예',beta:1,vth:.4,color:C.blue},{name:'SS 예',beta:.8,vth:.45,color:C.green}];
    return plot(corners.map(c=>({color:c.color,points:Array.from({length:81},(_,i)=>{const vgs=i*.025;return[vgs,mosCurrent({...c,vgs,vds:1}).current];})})),{width:640,height:320,xmin:0,xmax:2,ymin:0,ymax:1.5,xlabel:'VGS (V) · VDS=1 V',ylabel:'ID (mA)'});
}
export function currentMirrorFigure() {
    let s=wire('M120 40H380M120 40V55M380 40V55M120 95V130M380 95V130',C.ink,1.6)+tx(250,24,'Supply / load boundary','text-anchor="middle" class="small"');
    for(const x of [120,380])s+=`<circle cx="${x}" cy="75" r="20" fill="#fff" stroke="${C.ink}"/>`+arrow(x,63,x,87,C.blue,1.5);
    s+=mosGlyph(60,130,{body:false})+mosGlyph(320,130,{body:false})+wire('M120 130V110H40V180H60M40 110H300V180H320',C.ink,1.6)+node(120,110,C.ink)+wire('M120 230V251H380V230',C.ink,1.6)+ground(250,251);
    s+=tx(65,80,'Iref','text-anchor="end" class="label blue"')+tx(409,80,'Iout','class="label blue"')+tx(75,294,'M1 · diode-connected','class="small"')+tx(328,294,'M2 · mirrored','class="small"')+tx(251,335,'Global shift는 함께 · local mismatch는 서로 다르게 변할 수 있음','text-anchor="middle" class="small"');return svg(530,358,'Diode-connected reference NMOS와 같은 gate bias의 output NMOS 및 별도 load가 있는 current mirror',s);
}
export function mismatchSamples({mean=0,sigma=1,samples=1000,seed=2026,mode='local'}={}) {
    let state=seed>>>0;const uniform=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return(state+.5)/2**32;},normal=()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform());
    const rows=Array.from({length:samples},()=>{const first=mean+sigma*normal(),second=mode==='global'?first:mean+sigma*normal();return{first,second,difference:second-first};}),values=rows.map(r=>r.difference),avg=values.reduce((a,b)=>a+b,0)/samples,std=Math.sqrt(values.reduce((a,b)=>a+(b-avg)**2,0)/(samples-1)),limit=Math.max(.1,4*Math.SQRT2*sigma),bins=Array(25).fill(0);
    let tails=0;values.forEach(value=>{if(value< -limit||value>limit)tails++;const index=Math.min(24,Math.max(0,Math.floor((value+limit)/(2*limit)*25)));bins[index]++;});
    return{rows,values,mean:avg,std,limit,bins,tails,expected:mode==='global'?0:Math.SQRT2*sigma};
}
export function mismatchHistogram(d) {
    const left=67,right=607,top=37,bottom=269,peak=Math.max(...d.bins,1),w=(right-left)/25,sx=x=>left+(x+d.limit)/(2*d.limit)*(right-left),sy=y=>bottom-y/peak*(bottom-top);let s='';
    for(let i=0;i<=4;i++){const y=peak*i/4;s+=wire(`M${left} ${sy(y)}H${right}`,'#dfe7f1',1)+tx(left-8,sy(y)+5,fmt(y),'text-anchor="end" class="small"');const x=-d.limit+2*d.limit*i/4;s+=tx(sx(x),bottom+26,fmt(x),'text-anchor="middle" class="small"');}
    d.bins.forEach((count,i)=>s+=rect(left+i*w,sy(count),w-1,bottom-sy(count),'#a9ceff',C.blue,0));s+=tx(left,20,'Sample count','class="small"')+tx(335,329,'ΔVth₂ − ΔVth₁ (mV)','text-anchor="middle" class="small"');return svg(633,352,'두 소자 threshold shift 차이의 결정적 Monte Carlo histogram',s);
}
export function initDeviceVariation(root) {
    put(root,'device-parameter-distributions',variationDistributions());put(root,'device-corner-curves',processCornerCurves());put(root,'device-current-mirror',currentMirrorFigure());
    bindModel(root,'device-variation',v=>{const d=mismatchSamples({...v,samples:Number(v.samples)});put(root,'device-offset-histogram',mismatchHistogram(d));put(root,'device-offset-stats',table(['지표','값'],[['변동 model',v.mode==='global'?'두 소자에 동일한 global shift':'서로 독립인 local shift'],['차이의 표본 평균',`${fmt(d.mean)} mV`],['차이의 표본 σ',`${fmt(d.std)} mV`],['차이의 이론 σ',`${fmt(d.expected)} mV`],['Sample 수',v.samples],['표시 범위 밖 sample',`${d.tails} · 양 끝 bin에 포함`]]));});
    bindModel(root,'device-pvt',v=>{const temperatures=[-20,25,70,100,125],voltages=[.7,.8,.9,1,1.1];put(root,'device-pvt-grid',table(['V / °C',...temperatures.map(String)],voltages.map(voltage=>[fmt(voltage),...temperatures.map(temp=>{const delay=pvtDelay(v.nominal,voltage,temp);return `${delay<=v.period?'PASS':'FAIL'} · ${fmt(delay)} ns`;})])));});
}

export function cisReadout() {
    let s=rect(8,35,198,235,'#f8fbff',C.blue)+tx(107,62,'Pixel array','text-anchor="middle" class="label"');
    s+=numberGrid(39,106,4,4,{cell:31,color:C.blue,selected:(r,c)=>(r+c)%3===0,highlight:C.green});for(let i=0;i<3;i++)s+=arrow(62+i*39,76,62+i*39,100,C.orange,1.7);
    s+=rect(267,35,208,235,'#f5f9ff',C.blue)+tx(371,62,'Column readout','text-anchor="middle" class="label"');[['CDS','Reset / signal'],['AMP','Gain / offset'],['S/H','Sample / hold']].forEach(([a,b],i)=>s+=labeledBox(283,79+i*58,176,48,a,b,C.line,'#fff'));
    s+=rect(538,35,208,235,'#f7f4ff',C.purple)+tx(642,62,'ADC','text-anchor="middle" class="label"')+wire('M566 165l36-43h111v87H602z',C.purple,1.7)+tx(657,171,'N-bit code','text-anchor="middle" class="small"');
    s+=rect(810,35,257,235,'#f1faf5',C.green)+tx(939,62,'Digital processing','text-anchor="middle" class="label"');['ISP / Demosaic','Correction / denoise','Formatting / compression'].forEach((name,i)=>s+=labeledBox(829,88+i*52,218,38,name,'',C.green,'#fff'));
    [206,475,746].forEach((x,i)=>s+=arrow(x,156,[267,538,810][i],156,C.blue));s+=tx(540,313,'빛 → 저장 전하 → analog readout → digital code → image data','text-anchor="middle" class="label blue"');return svg(1090,339,'CIS pixel의 광전하가 column CDS amplification sampling ADC digital processing으로 전달되는 경계',s);
}
export function initDeviceSpecial(root) {put(root,'device-cis-readout',cisReadout());}
