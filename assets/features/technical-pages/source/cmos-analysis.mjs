import {power} from '../../curriculum/source/models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,plot,capacitor,ground} from './figures.mjs';
import {bindModel,put,horizontalBars} from './ai-common.mjs';
import {digitalMos,inverterCircuit,inverterLayout,inverterSymbol} from './cmos-primitives.mjs';

export function inverterVtc({vdd=1,center=.5,vin=.5}={}) {
    const k=20,f=x=>vdd/(1+Math.exp(k*(x/vdd-center))),yHigh=(1+Math.sqrt(1-4/k))/2,yLow=1-yHigh;
    const vil=vdd*(center+Math.log(1/yHigh-1)/k),vih=vdd*(center+Math.log(1/yLow-1)/k),voh=f(vil),vol=f(vih);
    let lo=0,hi=vdd;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(f(mid)>mid)lo=mid;else hi=mid;}
    return{vdd,center,vin:vin*vdd,vout:f(vin*vdd),vm:(lo+hi)/2,vil,vih,voh,vol,nml:vil-vol,nmh:voh-vih,points:Array.from({length:201},(_,i)=>[vdd*i/200,f(vdd*i/200)])};
}
export function vtcFigure(d,{width=590,height=420}={}) {
    const left=57,right=width-32,top=73,bottom=height-75,sx=x=>left+x/d.vdd*(right-left),sy=y=>bottom-y/d.vdd*(bottom-top);let s='';
    [[0,d.vil,'#edf6ff'],[d.vil,d.vih,'#fff0f5'],[d.vih,d.vdd,'#edf6ff']].forEach(([a,b,c])=>s+=rect(sx(a),top,sx(b)-sx(a),bottom-top,c,'none',0));
    for(let i=0;i<=5;i++){const a=d.vdd*i/5;s+=wire(`M${sx(a)} ${top}V${bottom}M${left} ${sy(a)}H${right}`,'#d7e3f0',.8)+tx(sx(a),bottom+23,fmt(a),'text-anchor="middle" class="small"')+tx(left-9,sy(a)+5,fmt(a),'text-anchor="end" class="small"');}
    s+=wire(`M${left} ${top}V${bottom}H${right}`,C.ink,1.2)+wire(d.points.map(([x,y],i)=>`${i?'L':'M'}${sx(x)} ${sy(y)}`).join(''),C.blue,2.7);
    [[d.vil,'VIL',C.blue],[d.vm,'VM',C.red],[d.vih,'VIH',C.purple]].forEach(([x,label,c])=>s+=wire(`M${sx(x)} ${top}V${bottom+32}`,c,1.2,'stroke-dasharray="4 4"')+tx(sx(x),bottom+48,label,`text-anchor="middle" class="small" style="fill:${c}"`));
    s+=tx(sx(d.vil/2),34,'입력 Low','text-anchor="middle" class="small blue"')+tx(sx((d.vil+d.vih)/2),34,'Transition','text-anchor="middle" class="small" style="fill:#eb5874"')+tx(sx((d.vih+d.vdd)/2),34,'입력 High','text-anchor="middle" class="small blue"')+tx(left,59,'Vout (V)','class="small"')+tx((left+right)/2,height-6,'Vin (V)','text-anchor="middle" class="small"')+node(sx(d.vin),sy(d.vout),C.orange,5);
    return svg(width,height,'Inverter VTC와 unity-slope 입력 경계 VIL VIH 및 Vout=Vin인 VM',s);
}
export function initCmosInverter(root) {
    put(root,'cmos-inverter-layout',inverterLayout());bindModel(root,'cmos-vtc',v=>{const d=inverterVtc(v);put(root,'cmos-inverter-circuit',inverterCircuit({vdd:v.vdd,state:v.vin<.3?'low':v.vin>.7?'high':'transition'}));put(root,'cmos-vtc-plot',vtcFigure(d));put(root,'cmos-vtc-values',table(['측정 정의','이 모델의 값'],[['Vin → Vout',`${fmt(d.vin)} → ${fmt(d.vout)} V`],['VM · Vout=Vin',`${fmt(d.vm)} V`],['VIL / VIH · |slope|=1',`${fmt(d.vil)} / ${fmt(d.vih)} V`],['VOL / VOH · 경계 출력',`${fmt(d.vol)} / ${fmt(d.voh)} V`],['NML / NMH',`${fmt(d.nml)} / ${fmt(d.nmh)} V`]]));});
}

export function cmosLogic({a=0,b=0}={}) {a=Number(a);b=Number(b);return{a,b,nand:Number(!(a&&b)),nor:Number(!(a||b)),nandPullUp:!a||!b,nandPullDown:!!a&&!!b,norPullUp:!a&&!b,norPullDown:!!a||!!b};}
export function gateCircuit(kind,d) {
    let s=tx(221,21,'VDD','text-anchor="middle" class="label"');const p=(x,y,k)=>digitalMos(x,y,{type:'p',label:`P${k.toUpperCase()}`,on:!d[k]}),n=(x,y,k)=>digitalMos(x,y,{type:'n',label:`N${k.toUpperCase()}`,on:!!d[k]});
    if(kind==='nand'){
        s+=wire('M221 31V48H135V67M221 48H316V67M135 143V164H316V143M221 164V192M221 268V282M221 358V379M221 178H389',C.ink,1.7)+p(135,105,'a')+p(316,105,'b')+n(221,230,'a')+n(221,320,'b')+node(221,164)+node(221,178);
        s+=tx(52,111,`A=${d.a}`,'class="small blue"')+tx(234,111,`B=${d.b}`,'class="small purple"')+tx(117,236,`A=${d.a}`,'class="small blue"')+tx(117,326,`B=${d.b}`,'class="small purple"');
    }else{
        s+=wire('M221 31V40M221 116V130M221 206V231H135V260M221 231H316V260M135 336V362H316V336M221 362V379M221 219H389',C.ink,1.7)+p(221,78,'a')+p(221,168,'b')+n(135,298,'a')+n(316,298,'b')+node(221,219)+node(221,231);
        s+=tx(117,84,`A=${d.a}`,'class="small blue"')+tx(117,174,`B=${d.b}`,'class="small purple"')+tx(52,304,`A=${d.a}`,'class="small blue"')+tx(234,304,`B=${d.b}`,'class="small purple"');
    }
    s+=ground(221,379)+tx(389,kind==='nand'?165:206,`Y = ${d[kind]}`,'text-anchor="end" class="label"')+tx(221,423,'Body: PMOS→VDD · NMOS→GND','text-anchor="middle" class="small"');
    return svg(431,445,`${kind.toUpperCase()}의 상보적 pull-up 및 pull-down transistor network`,s,'tech-circuit');
}
export function gateSymbol(kind) {
    const inputX=kind==='nand'?70:84.1;
    let s=wire(`M24 92H${inputX}M24 130H${inputX}M196 111H234`,C.ink,2)+tx(15,86,'A','class="small"')+tx(15,147,'B','class="small"')+tx(239,116,'Y','class="small"');
    s+=kind==='nand'?wire('M70 66H112A45 45 0 0 1 112 156H70Z',C.ink,2):wire('M70 65Q120 64 182 111Q120 157 70 157Q104 111 70 65Z',C.ink,2);
    const cx=kind==='nand'?163:188;s+=`<circle cx="${cx}" cy="111" r="6" fill="#fff" stroke="${C.ink}" stroke-width="2"/>`+wire(`M${cx+6} 111H234`,C.ink,2)+tx(130,219,kind==='nand'?'Y = NOT (A · B)':'Y = NOT (A + B)','text-anchor="middle" class="small label"');return svg(270,259,`${kind.toUpperCase()} logic symbol와 출력 반전 식`,s);
}
export function initCmosGates(root) {
    for(const kind of ['nand','nor'])put(root,`cmos-${kind}-symbol`,gateSymbol(kind));
    bindModel(root,'cmos-gates',v=>{const d=cmosLogic(v);for(const kind of ['nand','nor']){
        put(root,`cmos-${kind}-circuit`,gateCircuit(kind,d));
        put(root,`cmos-${kind}-truth`,`<div class="guidebook-scroll-region"><table class="tech-matrix"><thead><tr><th>A</th><th>B</th><th>Y</th></tr></thead><tbody>${[0,1,2,3].map(i=>{const a=i>>1,b=i&1,r=cmosLogic({a,b});return `<tr${a===d.a&&b===d.b?' class="cmos-selected-row"':''}><td>${a}</td><td>${b}</td><td>${r[kind]}</td></tr>`;}).join('')}</tbody></table></div>`);
    }put(root,'cmos-gate-result',`<small>A=${v.a} · B=${v.b} · 안정된 rail 입력</small>NAND = ${d.nand} · NOR = ${d.nor}`);});
}

export function bufferChain({load=81,stages=4,r0=1,rwire=.5,unitFF=1,size=1}={}) {
    if(load<1||stages<1||stages>8||!Number.isInteger(stages))throw new Error('부하비는 1 이상, 단계 수는 1–8 정수입니다.');
    const effort=load**(1/stages),sizes=Array.from({length:stages},(_,i)=>effort**i),stageRows=sizes.map((s,i)=>({size:s,load:i===stages-1?load:sizes[i+1],effort,delay:effort+1})),delay=stages*(effort+1),tauPS=(r0/size+rwire)*load*unitFF;
    return{load,stages,effort,sizes,stageRows,delay,inputSum:sizes.reduce((a,b)=>a+b,0),singleDelay:load+1,rOhm:(r0/size+rwire)*1000,tauPS,tpPS:Math.LN2*tauPS,risePS:Math.log(9)*tauPS};
}
export function driverRcFigure() {
    let s=inverterSymbol(25,112)+tx(19,88,'Vin','class="small blue"')+tx(70,169,'Driver · R₀ / size','text-anchor="middle" class="small"')+wire('M121 112H150l8-7 12 14 12-14 12 14 12-14 12 14 8-7H302',C.ink,1.6)+tx(193,79,'Rwire','text-anchor="middle" class="small"')+node(302,112,C.blue)+wire('M302 112H352M302 112V139',C.ink)+capacitor(302,139,50)+ground(302,189)+tx(327,168,'CL','class="small"')+tx(351,91,'Vout','text-anchor="end" class="small blue"');return svg(385,239,'Inverter drive 저항과 직렬 wire 저항 및 shunt 부하 capacitance',s);
}
export function bufferChainFigure(d) {
    const step=106,w=Math.max(580,d.stages*step+143);let s=tx(16,108,'Vin','class="small blue"');
    for(let i=0;i<d.stages;i++){const x=49+i*step;s+=inverterSymbol(x,140,{scale:.8})+tx(x+36,78,`${fmt(d.sizes[i])}×`,'text-anchor="middle" class="label"')+tx(x+36,208,`Stage ${i+1}`,'text-anchor="middle" class="small"');if(i<d.stages-1)s+=wire(`M${x+76.8} 140H${x+step}`,C.ink,1.5);}
    const end=49+(d.stages-1)*step+76.8;s+=wire(`M${end} 140H${end+45}V164`,C.ink)+capacitor(end+45,164,44)+ground(end+45,208)+tx(end+45,118,`CL=${fmt(d.load)} Cin₁`,'text-anchor="middle" class="small"')+tx(w/2,251,`h = F^(1/N) = ${fmt(d.effort)} · dᵢ = h+1 · D = ${fmt(d.delay)} τLE`,'text-anchor="middle" class="small label blue"');
    return svg(w,276,'같은 stage effort로 크기가 증가하는 inverter chain과 계산된 각 크기 및 총 logical effort delay',s);
}
export function initCmosDelay(root) {
    put(root,'cmos-driver-rc',driverRcFigure());
    bindModel(root,'cmos-delay',v=>{const d=bufferChain(v);put(root,'cmos-rc-response',plot([{points:Array.from({length:101},(_,i)=>[i*d.tauPS/20,1-Math.exp(-i/20)]),color:C.blue}],{width:550,height:310,xmax:5*d.tauPS,ymax:1.05,xlabel:'Time (ps)',ylabel:'Vout / VDD',points:[{x:d.tauPS,y:1-Math.exp(-1)}]}));put(root,'cmos-delay-result',`<small>선택한 단일 driver + Rwire + CL</small>τ = ${fmt(d.tauPS)} ps<br>t50 = ${fmt(d.tpPS)} ps`);put(root,'cmos-buffer-chain',bufferChainFigure(d));put(root,'cmos-buffer-stages',table(['단계','상대 크기','다음 부하 / Cin₁','h','dᵢ / τLE'],d.stageRows.map((r,i)=>[i+1,fmt(r.size),fmt(r.load),fmt(r.effort),fmt(r.delay)])));put(root,'cmos-buffer-comparison',table(['이상적 inverter chain','총 delay / τLE','내부 입력 C 합 / Cin₁'],[1,2,3,4,5,6].map(n=>{const c=bufferChain({...v,stages:n});return[`${n} stages`,fmt(c.delay),fmt(c.inputSum)];})));put(root,'cmos-buffer-plot',plot([{color:C.red,points:Array.from({length:100},(_,i)=>[i+1,i+2])},{color:C.blue,points:Array.from({length:100},(_,i)=>[i+1,v.stages*((i+1)**(1/v.stages)+1)])}],{width:520,height:310,xmin:1,xmax:100,ymax:105,xlabel:'F = CL / Cin₁',ylabel:'Delay / τLE'}));});
}

export function cmosPower(v={}) {const p=power({activity:v.activity??.2,capacitancePF:v.capacitancePF??100,voltage:v.voltage??.8,frequencyMHz:v.frequencyMHz??500,leakageMA:v.leakageMA??2}),shortCircuitMW=(v.shortEnergyPJ??2)*(v.shortRateMHz??100)/1000;return{...p,shortCircuitMW,totalMW:p.dynamicMW+p.leakageMW+shortCircuitMW};}
export function powerWaveforms() {
    const left=144,right=1023,sx=t=>left+t/10*(right-left);let s='';
    const vin=t=>t<2?0:t<6?1:0,vout=t=>t<2?1:t<6?Math.exp(-(t-2)/.23):1-Math.exp(-(t-6)/.23),idd=t=>(t<6?0:Math.exp(-(t-6)/.23))+.22*Math.exp(-(((t-2)/.08)**2))+.22*Math.exp(-(((t-6)/.08)**2))+.015;
    [{name:'Vin / VDD',f:vin,c:C.blue},{name:'Vout / VDD',f:vout,c:C.red},{name:'IDD / Iref',f:idd,c:C.green}].forEach((r,i)=>{const top=45+i*123,bottom=top+86;for(let t=0;t<=10;t+=2)s+=wire(`M${sx(t)} ${top}V${bottom}`,'#dce5f0',.8);s+=wire(`M${left} ${top}V${bottom}H${right}`,C.ink,1)+tx(5,top+47,r.name,'class="small label"')+tx(left-10,top+5,'1','text-anchor="end" class="small"')+tx(left-10,bottom+4,'0','text-anchor="end" class="small"')+wire(Array.from({length:501},(_,j)=>{const t=j/50;return`${j?'L':'M'}${sx(t)} ${bottom-r.f(t)/1.25*80}`;}).join(''),r.c,2.3);});
    s+=tx(sx(2),23,'Vin↑ · CL 방전','text-anchor="middle" class="small blue"')+tx(sx(6),23,'Vin↓ · VDD가 CL 충전','text-anchor="middle" class="small green"');for(let t=0;t<=10;t+=2)s+=tx(sx(t),414,String(t),'text-anchor="middle" class="small"');
    s+=tx(584,442,'Time (정규화 예) · IDD: charging + 양 edge의 short-circuit + leakage','text-anchor="middle" class="small"');return svg(1060,463,'Vin 상승에는 CL가 NMOS로 방전되고 하강에는 VDD charging current가 나타나는 교육용 전압 전류 파형',s);
}
export function initCmosPower(root) {
    for(const state of ['charge','discharge','short','leak'])put(root,`cmos-power-${state}`,powerPathFigure(state));put(root,'cmos-power-wave',powerWaveforms());
    bindModel(root,'cmos-power',v=>{const d=cmosPower(v);put(root,'cmos-power-values',table(['성분','계산 결과'],[['Pdynamic',`${fmt(d.dynamicMW)} mW`],['Pshort-circuit',`${fmt(d.shortCircuitMW)} mW`],['Pleakage',`${fmt(d.leakageMW)} mW`],['Ptotal',`${fmt(d.totalMW)} mW`]]));put(root,'cmos-power-bars',horizontalBars([{label:'Dynamic',value:d.dynamicMW,color:C.green},{label:'Short circuit',value:d.shortCircuitMW,color:C.red},{label:'Leakage',value:d.leakageMW,color:C.blue}],{width:550,unit:'mW'}));});
}

export function powerPathFigure(state) {
    const p=state==='charge'?true:state==='discharge'?false:null,n=p===null?null:!p;
    let s=wire('M132 28V47M132 123V172M132 248V273M80 85H46V210H80M46 149H14M132 149H247',C.ink,1.6)+digitalMos(132,85,{type:'p',label:'PMOS',on:p})+digitalMos(132,210,{type:'n',label:'NMOS',on:n})+ground(132,273)+node(46,149,C.ink)+node(132,149,C.ink);
    s+=wire('M224 149V186',C.ink)+capacitor(224,186,44)+ground(224,230)+tx(132,17,'VDD','text-anchor="middle" class="label"')+tx(13,136,'Vin','class="small blue"')+tx(247,136,'Vout','text-anchor="end" class="small blue"')+tx(245,212,'CL','class="small"')+tx(132,312,'GND','text-anchor="middle" class="small"');
    if(p===true)s+=arrow(143,33,143,132,C.red,1.8)+arrow(145,158,209,158,C.red,1.8);
    if(n===true)s+=arrow(119,163,119,260,C.blue,1.8);
    if(state==='short')s+=arrow(119,33,119,260,C.red,1.8);
    if(state==='leak')s+=wire('M119 33V260',C.purple,1.6,'stroke-dasharray="4 4"');
    return svg(278,332,`${state} 상태에서 분리해 보는 inverter와 load 전류 경로`,s,'tech-circuit');
}
