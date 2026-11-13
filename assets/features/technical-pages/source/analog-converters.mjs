import {adc as idealAdc} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,plot,capacitor,ground,labeledBox} from './figures.mjs';
import {bindModel,put} from './ai-common.mjs';
import {clamp,opAmp,hResistor,vResistor} from './analog-common.mjs';

export const adcConversion=v=>idealAdc({...v,bits:Number(v.bits)});
export function adcTransfer(v,{width=650,height=330,restored=false}={}) {
    const n=Number(v.bits),levels=2**n,lsb=v.vref/levels,points=[];
    for(let code=0;code<levels;code++){const y=restored?(code+.5)*lsb:code;points.push([code*lsb,y],[(code+1)*lsb,y]);}
    const d=adcConversion(v);return plot([{points,color:C.orange}],{width,height,xmax:v.vref,ymax:restored?v.vref:levels-1,xlabel:'Vin (V)',ylabel:restored?'Bin center (V)':'ADC code',points:[{x:clamp(v.vin,0,v.vref),y:restored?d.restored:d.code,color:C.blue}]});
}
export function sarArchitecture() {
    let s=rect(123,59,187,161,'#f2f8ff',C.blue)+tx(216,84,'Sample / Hold','text-anchor="middle" class="label blue"')+wire('M16 120H164M164 120l42-17M210 120H380M258 120V145',C.ink,1.7)+capacitor(258,145,44)+ground(258,189)+node(258,120)+tx(39,96,'Vin','class="label blue"')+tx(216,207,'φs · sampling switch','text-anchor="middle" class="small"')+opAmp(410,145,{w:100,h:100,label:'Cmp'})+wire('M380 120H410',C.ink,1.7)+arrow(540,145,600,145,C.blue);
    s+=labeledBox(600,90,229,105,'SAR register','MSB → LSB decision',C.purple,'#f8f3ff')+arrow(829,145,931,145,C.blue)+tx(930,122,'Code[N−1:0]','text-anchor="end" class="small label blue"');
    s+=labeledBox(485,285,262,81,'N-bit DAC','Vtrial = trial × VREF / 2ᴺ',C.green,'#effaf5')+wire('M714 195V285',C.purple,1.8)+arrow(714,253,714,285,C.purple)+tx(725,243,'Digital trial','class="small purple"')+wire('M485 325H358V170H380',C.green,1.8)+arrow(363,170,380,170,C.green)+tx(398,310,'VDAC','class="small green"')+wire('M616 366V397',C.orange,1.7)+arrow(616,397,616,369,C.orange)+tx(616,426,'VREF','text-anchor="middle" class="small"');
    return svg(954,450,'샘플된 Vin과 별도 DAC trial을 comparator 양 입력으로 비교하고 SAR logic이 DAC code를 갱신하는 feedback 구조',s);
}
export function capacitorDacFigure(code=11) {
    let s=wire('M44 68H827',C.blue,2)+node(44,68)+tx(28,48,'VDAC · shared top plate','class="label blue"');
    [8,4,2,1,1].forEach((weight,i)=>{const x=137+i*151;s+=wire(`M${x} 68V102`,C.blue,1.7)+capacitor(x,102,64)+tx(x+20,139,i===4?'C dummy':`${weight}C`,'class="small label"');
        if(i===4)s+=wire(`M${x} 166V229`,C.ink)+ground(x,229);
        else{const bit=3-i,on=(code>>bit)&1;s+=wire(`M${x} 166V190L${x+(on?-23:23)} 229`,on?C.blue:C.ink,1.8)+node(x-23,229,C.blue)+node(x+23,229,C.ink)+tx(x-23,260,'VREF','text-anchor="middle" class="small blue"')+tx(x+23,288,'GND','text-anchor="middle" class="small"')+tx(x,318,`b${bit} = ${on}`,'text-anchor="middle" class="label"');}
    });
    s+=tx(471,361,`4-bit 교육 예 · Ctotal=16C · 초기 전하 0일 때 VDAC=${code}/16 × VREF`,'text-anchor="middle" class="small"');return svg(935,386,'8C 4C 2C C의 공통 top plate와 분리된 bottom switch, 추가 1C dummy의 이상적 capacitive DAC',s);
}
export function sarTrialPlot(d,v) {
    const trial=[],accepted=[];d.sar.forEach((r,i)=>{trial.push([i+1,r[2]]);accepted.push([i+1,r[4]*d.lsb]);});
    return plot([{points:trial,color:C.orange},{points:accepted,color:C.blue},{points:[[1,v.vin],[v.bits,v.vin]],color:C.green}],{width:630,height:375,xmin:1,xmax:Math.max(2,Number(v.bits)),ymax:Math.max(v.vref,v.vin)*1.05,ymin:Math.min(0,v.vin),xlabel:'Decision step · MSB→LSB',ylabel:'Voltage (V)'});
}
export function initAnalogAdc(root) {
    put(root,'analog-sar-circuit',sarArchitecture());put(root,'analog-capacitor-dac',capacitorDacFigure());
    bindModel(root,'analog-adc',v=>{const d=adcConversion(v),bits=Number(v.bits);put(root,'analog-sar-plot',sarTrialPlot(d,{...v,bits}));put(root,'analog-sar-table',table(['Bit','Trial code','Trial VDAC (V)','판정','보존 code'],d.sar.map(r=>[`b${r[0]}`,r[1],fmt(r[2]),r[3],r[4].toString(2).padStart(bits,'0')])));put(root,'analog-adc-transfer',adcTransfer(v));put(root,'analog-adc-results',table(['변환 결과','값'],[['Resolution',`${bits} bit`],['Code',`${d.code} · ${d.code.toString(2).padStart(bits,'0')}`],['LSB',`${fmt(d.lsb*1e6)} μV`],['Bin 중앙 복원값',`${fmt(d.restored)} V`],['복원값 − Vin',`${fmt(d.error/d.lsb)} LSB`],['입력 범위',d.clipped?'OVERRANGE · code 포화':'0 ≤ Vin < VREF'],['입력한 SINAD의 ENOB',`${fmt(d.enob)} bit`],['ENOB 해석',d.enob>bits?'Nominal N-bit 모델보다 큼 · 측정 조건 확인':'정적 transfer에서 직접 측정한 값 아님']]));});
}

export function dacTransition({bits=4,code=8,previous=7,vref=1,tau=1,skew=.05,order='lsb'}={}) {
    bits=Number(bits);const levels=2**bits,limit=levels-1,targetCode=clamp(Math.trunc(code),0,limit),previousCode=clamp(Math.trunc(previous),0,limit),lsb=vref/levels,target=targetCode*lsb,start=previousCode*lsb;
    const changed=Array.from({length:bits},(_,bit)=>bit).filter(bit=>((targetCode^previousCode)>>bit)&1);if(order==='msb')changed.reverse();let current=previousCode;const events=changed.map((bit,i)=>{current=(current&~(1<<bit))|(targetCode&(1<<bit));return{t:i*skew,bit,code:current,voltage:current*lsb};});
    const at=t=>{if(t<0)return start;let out=start,command=start,last=0;for(const event of events){if(event.t>t)break;out=command+(out-command)*Math.exp(-(event.t-last)/tau);command=event.voltage;last=event.t;}return command+(out-command)*Math.exp(-(t-last)/tau);};
    const lastTime=events.at(-1)?.t??0,atLast=at(lastTime),settle=lastTime+Math.max(0,tau*Math.log(Math.max(Math.abs(atLast-target)/(lsb/2),1))),end=Math.max(tau*2,settle+tau*1.3),begin=-tau*.6,idealAt=t=>t<0?start:target+(start-target)*Math.exp(-t/tau),points=Array.from({length:601},(_,i)=>{const t=begin+(end-begin)*i/600;return{t,ideal:idealAt(t),skewed:at(t)};});let area=0;for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i];area+=(Math.abs(p.skewed-p.ideal)+Math.abs(q.skewed-q.ideal))/2*(q.t-p.t);}
    return{bits,levels,targetCode,previousCode,lsb,target,start,changed,events,lastTime,settle,points,area,at};
}
export function r2rFigure({bits=4,code=8}={}) {
    bits=Number(bits);const stride=124,left=123,last=left+(bits-1)*stride,buffer=last+316,width=Math.max(990,buffer+151);let s=wire(`M28 82H${left}M${left} 82V36H${buffer-48}V236H${buffer-30}`,C.blue,1.7)+tx(29,65,'Vladder','class="label blue"');
    for(let i=0;i<bits;i++){const x=left+i*stride,bit=bits-1-i,on=(code>>bit)&1;s+=node(x,82)+vResistor(x,82,83,'2R')+wire(`M${x} 165V190L${x+(on?-24:24)} 229`,on?C.blue:C.ink,1.7)+node(x-24,229,C.blue)+node(x+24,229,C.ink)+tx(x-24,257,'VREF','text-anchor="middle" class="small blue"')+tx(x+24,280,'GND','text-anchor="middle" class="small"')+tx(x,318,`b${bit}=${on}`,'text-anchor="middle" class="label"');if(i<bits-1)s+=hResistor(x,82,stride,'R');}
    s+=wire(`M${last} 82H${last+96}V118`,C.ink)+vResistor(last+96,118,86,'2R')+ground(last+96,204)+tx(last+96,278,'Termination','text-anchor="middle" class="small"');
    s+=opAmp(buffer,263,{w:94,h:108,label:'1×'})+wire(`M${buffer-30} 290H${buffer-57}V347H${buffer+113}V263M${buffer+124} 263H${width-10}`,C.ink,1.6)+node(buffer+113,263)+tx(width-13,243,'Vout','text-anchor="end" class="label blue"')+tx(buffer+50,380,'High-Z voltage follower','text-anchor="middle" class="small"');
    s+=tx(width/2,430,'Voltage-mode R–2R · horizontal R · switched branch / termination 2R · Vout = Code × VREF / 2ᴺ','text-anchor="middle" class="small"');return svg(width,453,'실제 R-2R 분압 topology의 양의 voltage-mode 출력과 unity-gain buffer, 각 bit의 VREF GND switch',s);
}
export function initAnalogDac(root) {
    const render=bindModel(root,'analog-dac',v=>{const d=dacTransition(v);put(root,'analog-r2r',r2rFigure({bits:d.bits,code:d.targetCode}));const points=Array.from({length:d.levels},(_,code)=>[[code,code*d.lsb],[Math.min(code+1,d.levels-1),code*d.lsb]]).flat();put(root,'analog-dac-transfer',plot([{points,color:C.blue}],{width:520,height:330,xmax:d.levels-1,ymax:v.vref,xlabel:'Digital code',ylabel:'Ideal Vout (V)',points:[{x:d.targetCode,y:d.target}]}));
        const common={width:630,height:350,xmin:d.points[0].t,xmax:d.points.at(-1).t,ymin:Math.min(d.start,d.target,...d.points.map(p=>p.skewed))-.1*v.vref,ymax:Math.max(d.start,d.target,...d.points.map(p=>p.skewed))+.1*v.vref,xlabel:'Time (μs)',ylabel:'Vout (V)'};put(root,'analog-dac-settle',plot([{points:d.points.map(p=>[p.t,p.ideal]),color:C.blue},{points:[[common.xmin,d.target+d.lsb/2],[common.xmax,d.target+d.lsb/2]],color:C.purple},{points:[[common.xmin,d.target-d.lsb/2],[common.xmax,d.target-d.lsb/2]],color:C.purple}],common));put(root,'analog-dac-glitch',plot([{points:d.points.map(p=>[p.t,p.ideal]),color:C.blue},{points:d.points.map(p=>[p.t,p.skewed]),color:C.orange}],common));
        put(root,'analog-dac-events',table(['Time (μs)','변경 bit','중간 code','명령 출력 (V)'],d.events.length?d.events.map(e=>[fmt(e.t),`b${e.bit}`,e.code.toString(2).padStart(d.bits,'0'),fmt(e.voltage)]):[['—','변경 없음',d.targetCode.toString(2).padStart(d.bits,'0'),fmt(d.target)]]));put(root,'analog-dac-results',table(['결과','값'],[['유효 이전 → 목표 code',`${d.previousCode} → ${d.targetCode}`],['목표 출력',`${fmt(d.target)} V`],['LSB',`${fmt(d.lsb*1000)} mV`],['변경 bit 수',d.changed.length],['마지막 switch 이후 ±0.5 LSB 도달 시각',`${fmt(d.settle)} μs`],['이상적 응답과의 절대 차이 면적',`${fmt(d.area)} V·μs`]]));put(root,'analog-dac-bits',Array.from({length:d.bits},(_,i)=>{const bit=d.bits-1-i,val=(d.targetCode>>bit)&1;return`<button type="button" data-dac-bit="${bit}" aria-label="DAC bit ${bit} toggle" aria-pressed="${!!val}"><small>b${bit}</small>${val}</button>`;}).join(''));});
    root.addEventListener('click',event=>{const button=event.target.closest('[data-dac-bit]');if(!button)return;const input=root.querySelector('[name="code"]'),bits=Number(root.querySelector('[name="bits"]').value);input.value=String(clamp(Number(input.value),0,2**bits-1)^(1<<Number(button.dataset.dacBit)));input.dispatchEvent(new Event('input',{bubbles:true}));});
}
