import {bits,i2cWrite,uartFrame} from '../../curriculum/source/models.mjs';
import {pixelBudget,arbitration,reflection,interfaceBudget,i2cRead,uartReceive,training} from '../../curriculum/source/detail-models.mjs';
import {fmt,table,escape} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox,plot,resistor} from './figures.mjs';
import {eyeFigure,trainingFigure} from './channel-links.mjs';
const hex=v=>`0x${v.toString(16).toUpperCase()}`;
const read=form=>Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,form.elements.namedItem(k).type==='number'?Number(v):v]));

export function dphyFigure() {
    let s='';const seq=[[0,1,0,1,0,1,0,1],[0,0,1,1,0,1,1,0],[1,0,1,1,0,0,1,1],[0,1,1,0,1,0,0,1],[1,1,0,1,0,1,1,0]];
    seq.forEach((row,r)=>{const top=28+r*65,c=r?C.green:C.blue;for(let p=0;p<2;p++){s+=tx(3,top+12+p*22,r?`D${r-1}${p?'−':'+'}`:`CLK${p?'−':'+'}`,'class="small label"');s+=wire(row.map((v,i)=>i?`H${80+i*53}V${top+p*22+((v^p)?0:13)}`:`M80 ${top+p*22+((v^p)?0:13)}`).join('')+'H520',c,1.7);}});
    s+=tx(280,375,'전달 clock mode · 1 clock pair + 4 data pair 예','text-anchor="middle" class="small"');
    return svg(560,395,'별도 clock 차동 쌍과 네 data 차동 쌍을 사용하는 D-PHY 예',s);
}
export function cphyFigure() {
    const states=[[2,0,1],[2,1,0],[1,2,0],[0,2,1],[0,1,2],[1,0,2]];let s='';
    ['A','B','C'].forEach((name,r)=>{const y=40+r*73,c=[C.blue,C.green,C.orange][r];s+=tx(3,y+23,name,`class="label" style="fill:${c}"`);[0,1,2].forEach(level=>s+=wire(`M45 ${y+(2-level)*17}H520`,'#dce5ef',.8));s+=wire(states.map((state,i)=>i?`H${45+i*76}V${y+(2-state[r])*17}`:`M45 ${y+(2-state[r])*17}`).join('')+'H501',c,2);s+=tx(526,y+4,'H','class="small"')+tx(526,y+21,'M','class="small"')+tx(526,y+38,'L','class="small"');});
    states.forEach((_,i)=>s+=tx(83+i*76,270,`S${i}`,'text-anchor="middle" class="small"'));
    s+=tx(280,306,'3-wire trio · 6-wirestate mode 예 · 전이에서 clock 복원','text-anchor="middle" class="small"');
    return svg(570,330,'C-PHY trio의 A B C가 High Mid Low를 나누어 갖는 여섯 wire state',s);
}
export function initMipi(root) {
    root.querySelector('[data-dphy]').innerHTML=dphyFigure();root.querySelector('[data-cphy]').innerHTML=cphyFigure();
    const form=root.querySelector('[data-mipi-inputs]'),update=()=>{if(!form.checkValidity())return;const v=read(form),d=pixelBudget(v);root.querySelector('[data-mipi-result]').innerHTML=table(['항목','계산 결과'],[['Pixel payload',`${fmt(d.payload)} Gb/s`],['추가 traffic 포함',`${fmt(d.required)} Gb/s`],['Lane당 요구',`${fmt(d.perLane)} Gb/s/lane`],['Link capacity',`${fmt(d.capacity)} Gb/s`],['여유',`${fmt(d.margin)} Gb/s`],['예산 판정',d.margin>=0?'충족':'부족']]);};form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
}

export function canTopology() {
    let s=wire('M35 159H1040',C.blue,2)+wire('M35 207H1040',C.green,2)+resistor(35,159,48,'#536b87')+resistor(1040,159,48,'#536b87');
    s+=tx(10,238,'120 Ω','class="small"')+tx(1009,238,'120 Ω','class="small"')+tx(530,151,'CANH','text-anchor="middle" class="label blue"')+tx(530,231,'CANL','text-anchor="middle" class="label green"');
    ['A','B','C','D'].forEach((n,i)=>{const x=94+i*241;s+=labeledBox(x,15,165,112,`Node ${n}`,'CAN Transceiver',C.blue,'#f3f8ff')+wire(`M${x+52} 127V159`,C.blue)+wire(`M${x+112} 127V207`,C.green)+node(x+52,159,C.blue)+node(x+112,207,C.green);});
    return svg(1090,260,'네 node와 버스 양 끝의 두 120옴 종단으로 이루어진 고속 CAN 선형 버스',s);
}
export function canVoltages() {
    let s='';const rows=[['CANH',2.5,3.5,2.5,C.blue],['CANL',2.5,1.5,2.5,C.green],['CANH−CANL',0,2,0,C.ink]];
    ['Recessive (1)','Dominant (0)','Recessive (1)'].forEach((name,i)=>{s+=rect(132+i*155,26,153,235,i===1?'#fff2f6':'#f8fbff','none',0)+tx(208+i*155,18,name,'text-anchor="middle" class="small"');});
    rows.forEach(([name,a,b,c,color],r)=>{const y=65+r*83,sx=132,sy=v=>y+35-(v-(r===2?0:1.5))*21;s+=tx(4,y+25,name,'class="small label"')+wire(`M${sx} ${sy(a)}H${sx+146}L${sx+155} ${sy(b)}H${sx+301}L${sx+310} ${sy(c)}H${sx+465}`,color,2)+tx(sx+75,y+58,`${a} V`,'text-anchor="middle" class="small"')+tx(sx+230,y+58,`${b} V`,'text-anchor="middle" class="small"');});
    return svg(640,310,'5V 고속 CAN transceiver의 recessive와 dominant 전압 예',s);
}
export function canArbitration(a,b) {
    const d=arbitration(a,b),left=164,w=58;let s='';
    d.rows.forEach((r,i)=>s+=tx(left+i*w+25,23,String(r.bit),'text-anchor="middle" class="small"'));
    [['A',a,'a',C.blue],['B',b,'b',C.green],['Bus',null,'bus',C.ink]].forEach(([name,id,key,color],row)=>{const y=44+row*77;s+=tx(6,y+24,name==='Bus'?'버스 값':`Node ${name} · ${hex(id)}`,`class="small label" style="fill:${color}"`);d.rows.forEach((r,i)=>{const lost=r.bit===d.lostAt&&d.winner!=='동일 ID';s+=rect(left+i*w,y,w-5,44,lost?'#fff0f4':row===2?'#f6f9fd':'#fff',lost?'#ef8fa9':'#bfcee1',4)+tx(left+i*w+(w-5)/2,y+29,String(r[key]),'text-anchor="middle"');});});
    s+=tx(476,309,d.winner==='동일 ID'?'두 ID가 같으므로 이 비교만으로 승자를 구분할 수 없음':`첫 차이 bit ${d.lostAt} · Node ${d.winner} (${hex(d.value)})가 전송 지속`,'text-anchor="middle" class="label blue"');
    s+=tx(476,334,'패배한 node는 이후 recessive 1을 내보내며 버스를 방해하지 않음','text-anchor="middle" class="small"');
    return svg(850,355,'CAN standard 11-bit identifier의 wired-AND 중재 결과',s);
}
export function linFigure() {
    let s=wire('M36 151H486','#344b68',2);['Commander','Responder 1','Responder 2','Responder 3'].forEach((n,i)=>{const x=5+i*124;s+=labeledBox(x,47,115,65,n,'',i?C.line:C.blue,i?'#f9fbfe':'#f1f7ff')+wire(`M${x+57} 112V151`)+node(x+57,151,C.ink);});
    const parts=[['Break',68],['Sync 0x55',105],['PID',62],['Data 0–8 B',145],['Checksum',105]];let x=538;parts.forEach(([name,w],i)=>{s+=labeledBox(x,84,w-2,51,name,'',i<3?C.blue:C.green,i<3?'#f2f7ff':'#effaf5');x+=w;});
    s+=tx(651,59,'Header · Commander','text-anchor="middle" class="small blue"')+tx(900,59,'Response · Publisher','text-anchor="middle" class="small green"')+tx(780,169,'한 개의 schedule slot','text-anchor="middle" class="small"')+tx(251,190,'단일 LIN wire · Commander schedule','text-anchor="middle" class="small"');
    return svg(1040,220,'하나의 LIN wire와 schedule에 따른 header response frame',s);
}
export function initCan(root) {
    root.querySelector('[data-can-topology]').innerHTML=canTopology();root.querySelector('[data-can-voltages]').innerHTML=canVoltages();root.querySelector('[data-lin]').innerHTML=linFigure();const form=root.querySelector('[data-can-inputs]'),update=()=>{if(!form.checkValidity())return;const v=read(form);root.querySelector('[data-can-arbitration]').innerHTML=canArbitration(v.a,v.b);};form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
}

export function serdesCircuit(side) {
    if(side==='tx')return svg(420,230,'병렬 data serializer와 differential driver',
        tx(5,89,'Parallel','class="small"')+tx(5,109,'data','class="small"')+labeledBox(75,32,125,158,'Serializer','bn … b0',C.blue,'#fff')+arrow(35,132,75,132,C.blue)+arrow(200,110,241,110,C.blue)+wire('M241 70L241 150L293 110Z',C.blue,2)+arrow(293,99,399,99,C.blue)+arrow(293,124,399,124,C.green)+tx(335,86,'TX+','class="small blue"')+tx(335,145,'TX−','class="small green"')+tx(265,184,'Driver / TX EQ','text-anchor="middle" class="small"'));
    return svg(515,230,'수신 equalizer sampler CDR와 sampling clock feedback',
        labeledBox(10,40,125,106,'Equalizer','CTLE / DFE',C.purple,'#fff')+labeledBox(184,40,120,106,'Sampler','Decision',C.purple,'#fff')+labeledBox(353,40,150,106,'CDR','위상 추적',C.purple,'#fff')+arrow(135,92,184,92,C.ink)+arrow(304,92,353,92,C.ink)+wire('M428 146V190H244V146',C.ink,1.5)+arrow(244,170,244,146,C.ink)+tx(339,214,'Sampling clock / phase','text-anchor="middle" class="small"'));
}
export function serdesTrace(v) {
    const oversample=32,count=84,tau=.42,alpha=1-Math.exp(-1/(oversample*tau));let lfsr=0x5d,state=0;
    const data=Array.from({length:count},()=>{const bit=(lfsr>>6)&1;lfsr=((lfsr<<1)|(((lfsr>>6)^(lfsr>>5))&1))&127;return bit?1:-1;});
    const samples=Array.from({length:count*oversample},(_,i)=>{
        const phase=i/oversample,jitter=v.jitter*oversample*Math.sin(phase*.73),bit=Math.max(0,Math.min(count-1,Math.floor((i-jitter)/oversample))),previous=state;
        state+=alpha*(data[bit]-state);
        const noise=v.noise*(1+.5*v.equalize)*(.55*Math.sin(i*.81)+.45*Math.sin(i*1.93));
        return state+v.equalize*tau*oversample*(state-previous)+noise;
    });
    const high=[],low=[],crossings=[];
    for(let bit=10;bit<count-2;bit++){
        (data[bit]>0?high:low).push(samples[bit*oversample+oversample/2]);
        if(data[bit]===data[bit-1])continue;
        for(let i=bit*oversample-oversample/2;i<(bit+1)*oversample;i++){
            const a=samples[i-1],b=samples[i],cross=data[bit]>0?a<0&&b>=0:a>0&&b<=0;
            if(cross){crossings.push((i-1+Math.abs(a)/(Math.abs(a)+Math.abs(b)))/oversample-bit);break;}
        }
    }
    const traces=Array.from({length:32},(_,n)=>Array.from({length:65},(_,j)=>[j/oversample,samples[(10+n*2)*oversample+j]]));
    return {traces,centerOpening:Math.min(...high)-Math.max(...low),transitionSpread:Math.max(...crossings)-Math.min(...crossings)};
}
export function serdesEye(v,color=C.blue) {
    const data=serdesTrace(v),left=52,top=25,bottom=238,width=545,sx=x=>left+x/2*width,sy=y=>(top+bottom)/2-y*(bottom-top)/3.4;let s='';
    for(let i=0;i<=4;i++)s+=wire(`M${left+i*width/4} ${top}V${bottom}M${left} ${top+i*(bottom-top)/4}H${left+width}`,'#dce5f0',.8);
    for(const trace of data.traces)s+=wire(trace.map(([x,y],i)=>`${i?'L':'M'}${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`).join(''),color,1.1,'opacity=".28"');
    s+=wire(`M${sx(.5)} ${top}V${bottom}`,'#7289a4',1,'stroke-dasharray="4 4"')+tx(325,286,'시간 / UI · 정규화 전압','text-anchor="middle" class="small"');
    [0,.5,1,1.5,2].forEach(x=>s+=tx(sx(x),260,String(x),'text-anchor="middle" class="small"'));
    [-1,0,1].forEach(y=>s+=tx(43,sy(y)+4,String(y),'text-anchor="end" class="small"'));
    return svg(630,300,'정규화된 여러 symbol trace를 겹친 교육용 eye plot',s);
}
export function dfeFigure() {
    let s=tx(5,76,'RX input','class="small"')+arrow(70,70,118,70,C.ink)+`<circle cx="141" cy="70" r="23" fill="#fff" stroke="${C.ink}"/>`+tx(141,76,'Σ','text-anchor="middle"')+arrow(164,70,262,70,C.ink)+labeledBox(262,43,132,55,'Decision','',C.ink,'#fff')+arrow(394,70,558,70,C.ink)+tx(502,52,'â[n]','class="small"');
    s+=wire('M473 70V183H377',C.ink)+node(473,70,C.ink)+labeledBox(223,153,154,63,'Feedback filter','Σ hₖ â[n−k]',C.ink,'#fff')+wire('M223 183H141V93',C.ink)+arrow(141,112,141,93,C.ink)+tx(151,114,'−','class="label"')+tx(200,50,'y[n]','class="small"');
    return svg(590,242,'이전 decision을 사용해 현재 symbol의 ISI를 빼는 DFE feedback loop',s);
}
export function initSerdes(root) {
    root.querySelector('[data-serdes-tx]').innerHTML=serdesCircuit('tx');root.querySelector('[data-serdes-rx]').innerHTML=serdesCircuit('rx');root.querySelector('[data-dfe]').innerHTML=dfeFigure();
    const points=Array.from({length:61},(_,i)=>{const x=-1+i*.05,f=10**x,channel=-10*Math.log10(1+(f/.8)**2),eq=10*Math.log10((1+f*f)/((1+(f/8)**2)*(1+(f/40)**2)));return{x,channel,eq};});
    root.querySelector('[data-ctle]').innerHTML=plot([{points:points.map(p=>[p.x,p.channel]),color:'#8191a6'},{points:points.map(p=>[p.x,p.eq]),color:C.blue},{points:points.map(p=>[p.x,p.channel+p.eq]),color:C.green}],{xmin:-1,xmax:2,ymin:-45,ymax:20,xlabel:'log₁₀(f/fz)',ylabel:'Gain (dB)'});
    const form=root.querySelector('[data-serdes-inputs]'),update=()=>{if(!form.checkValidity())return;const v=read(form),before=serdesTrace({...v,equalize:0}),after=serdesTrace(v);root.querySelector('[data-eye-before]').innerHTML=serdesEye({...v,equalize:0},C.blue);root.querySelector('[data-eye-after]').innerHTML=serdesEye(v,C.green);root.querySelector('[data-eye-metrics]').innerHTML=table(['모델 지표','보정 전','선택한 보정'],[['중앙 sample 수직 간격 (정규화)',fmt(before.centerOpening),fmt(after.centerOpening)],['Zero-crossing 분포 폭 (UI)',fmt(before.transitionSpread),fmt(after.transitionSpread)],['BER','계산하지 않음','계산하지 않음']]);};form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
}

export function tdrExamples() {
    let s='';[['ZL > Z₀',1],['ZL < Z₀',-1],['ZL = Z₀',0]].forEach(([name,g],i)=>{const y=39+i*82;s+=tx(4,y+9,name,'class="small label"')+wire(`M104 ${y-20}V${y+44}H312`,'#8da3be',1.1)+wire(`M104 ${y+20}H195L204 ${y+20-g*27}H308`,C.blue,2)+wire(`M200 ${y-24}V${y+42}`,'#95a8c2',1,'stroke-dasharray="4 4"');});return svg(330,290,'부하가 높거나 낮거나 정합일 때의 정규화 TDR step 예',s);
}
export function initSignalIntegrity(root) {
    root.querySelector('[data-tdr-examples]').innerHTML=tdrExamples();root.querySelector('[data-si-eye]').innerHTML=eyeFigure(.2,.14);
    const droop=Array.from({length:121},(_,i)=>{const t=i/12,x=Math.max(0,t-3);return[t,1-.1*(1-Math.exp(-x*4))+.02*Math.exp(-x*1.3)*Math.sin(10*x)];});root.querySelector('[data-pi-droop]').innerHTML=plot([{points:droop,color:C.red}],{xmin:0,xmax:10,ymin:.8,ymax:1.05,xlabel:'정규화 시간',ylabel:'정규화 공급 전압'});
    const form=root.querySelector('[data-reflection-inputs]'),update=()=>{if(!form.checkValidity())return;const v=read(form),d=reflection(v);let points=[[0,0]];for(const row of d.rows){points.push([row[0],points.at(-1)[1]],[row[0],row[3]]);}points.push([10,points.at(-1)[1]]);root.querySelector('[data-reflection-value]').innerHTML=`<small>ΓL = (ZL − Z₀) / (ZL + Z₀)</small>${fmt(d.gamma)}<small>첫 입사파: ${fmt(d.launched)} V · ΓS: ${fmt(d.sourceGamma)}</small>`;root.querySelector('[data-reflection-plot]').innerHTML=plot([{points}],{xmax:10,ymin:Math.min(0,...d.rows.map(r=>r[3])),ymax:Math.max(v.voltage,...d.rows.map(r=>r[3]))*1.1,xlabel:'시간 / 편도 지연 τ',ylabel:'부하 전압 (V)'});root.querySelector('[data-reflection-ledger]').innerHTML=table(['도착 (τ)','입사 V','반사 V','부하 V'],d.rows);};form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
}

export function budgetWaterfall(v) {
    const raw=v.rate*v.lanes,payload=raw*v.efficiency,values=[['Lane raw rate',v.rate,'Gb/s'],['총 raw bit rate',raw,'Gb/s'],['Payload rate',payload,'Gb/s'],['Byte rate',payload/8,'GB/s']],colors=['#a8d2ff','#79b7ff','#3d96ff','#0879ff'];let s='';
    values.forEach(([name,value,unit],i)=>{const x=15+i*259,h=57+53*(unit==='GB/s'?value*8:value)/Math.max(raw,1);s+=tx(x+111,29,name,'text-anchor="middle" class="small label"')+rect(x,167-h,222,h,colors[i],'none',0)+tx(x+111,139,`${fmt(value)} ${unit}`,'text-anchor="middle" class="label" style="fill:#fff"');if(i<3)s+=arrow(x+226,117,x+253,117,C.blue);});
    s+=tx(130,199,`× ${v.lanes} lane`,'text-anchor="middle" class="small"')+tx(518,199,`× ${fmt(v.efficiency)}`,'text-anchor="middle" class="small"')+tx(907,199,'÷ 8 bit/byte','text-anchor="middle" class="small"');return svg(1040,220,'Lane 수와 전체 payload 비율을 적용한 일관된 대역폭 계산',s);
}
export function initBudget(root) {
    const form=root.querySelector('[data-budget-inputs]'),update=()=>{if(!form.checkValidity())return;const v=read(form),required=v.bytes*v.frequency*8/1e6,rows=interfaceBudget({required,latency:v.latency,kind:v.kind,payloadBytes:v.bytes});root.querySelector('[data-interface-budget-table]').innerHTML=table(['교육 예제 후보','Payload rate (Mb/s)','동일 payload','직렬화 시간 (µs)','예산 조건'],rows.map(r=>[r.name,fmt(r.rate),`${r.bytes} B`,fmt(r.microseconds),r.pass?'충족':'부족']));root.querySelector('[data-budget-demand]').innerHTML=`<small>Workload가 요구하는 평균 payload rate</small>${fmt(required)} Mb/s`;root.querySelector('[data-budget-waterfall]').innerHTML=budgetWaterfall(v);root.querySelector('[data-budget-serialization]').innerHTML=`<small>Serialization · ${v.bytes} byte</small>${fmt(v.bytes*8/(v.rate*v.lanes*v.efficiency*1000))} µs`;};form.addEventListener('submit',e=>e.preventDefault());root.addEventListener('input',event=>{if(event.target.form===form)update();});update();
}

export function logicScope(rows,names,decode='') {
    const width=850,x0=70,step=750/(Math.max(...rows.map(x=>x.length))-1);let s=rect(0,0,width,225,'#0b1721','none',7);
    for(let i=0;i<22;i++)s+=wire(`M${x0+i*34} 18V186`,'#21313e',.7);
    for(let i=0;i<8;i++)s+=wire(`M65 ${22+i*23}H828`,'#21313e',.7);
    names.forEach((name,r)=>{const y=42+r*68,color=r?'#35afff':'#ffd24f';s+=tx(10,y+20,name,`class="small" style="fill:${color}"`)+wire(rows[r].map((b,i)=>i?`H${x0+i*step}V${y+(b?0:28)}`:`M${x0} ${y+(b?0:28)}`).join(''),color,1.8);});
    s+=tx(78,202,decode||'논리 레벨 0/1 · 교육용 예제 trace','class="small" style="fill:#d1e5f6"');return svg(width,225,'입력 조건에 맞는 로직 분석기 교육용 trace',s);
}
export function debugScenario(kind='nack') {
    const samples=kind==='read'?i2cRead(80,165,255).samples:i2cWrite(80,165,kind==='nack').samples;
    if(kind==='stuck')samples.forEach(s=>s.sda=0);
    if(['nack','stuck','read'].includes(kind))return{html:logicScope([samples.map(s=>s.scl),samples.map(s=>s.sda)],['SCL','SDA'],kind==='nack'?'S → 주소 0x50 + W (0xA0) → NACK → P':kind==='stuck'?'SDA stuck LOW · 정상적인 START/STOP 및 byte decode가 불가능':'S → 0xA0 → ACK → 0xA5 → ACK → Sr → 0xA1 → ACK → 0xFF → NACK → P'),evidence:kind==='nack'?['Address 뒤 9번째 SCL HIGH에서 SDA가 HIGH','Target 준비 시간·주소·전원·pin 설정을 확인','첫 접근 시점을 늦추고 ID register 읽기로 재검증']:kind==='stuck'?['SCL이 움직여도 SDA가 LOW로 유지','어떤 장치가 당기는지, 전원·pin mux·pull-up과 마지막 transaction 확인','장치가 지원하는 bus recovery 절차를 확인']:['주소와 데이터 구간은 ACK하지만 읽은 값이 기대 0x3C와 다름','Register 주소, byte order, repeated START 조건을 확인','마지막 controller NACK는 정상적인 읽기 종료일 수 있음']};
    if(kind==='uart'){const frame=uartFrame(0x55),rx=uartReceive(0x55,115200,9600),tx=Array.from({length:121},(_,i)=>frame.levels[i]??1),sampling=tx.map(()=>0);rx.samples.forEach(s=>sampling[Math.round(s.time+1)]=1);return{html:logicScope([tx,sampling],['UART TX','Sample'],`TX 115200 / RX 9600 · 복원 ${hex(rx.decoded)} · TX bit-time 기준`),evidence:['TX bit time은 약 8.68 µs; 수신 설정은 9600 baud','이 예제의 RX sampling은 frame 종료 뒤 idle에서 일어남','Baud·parity·stop 조건을 맞춘 뒤 0x55 반복과 전체 byte sweep으로 재검증']};}
    if(kind==='ddr')return{html:trainingFigure({tap:16,jitter:9,offset:0}),evidence:['교육용 training map에서 공통 pass 창이 닫힘','배선·mapping·termination·전압·reference clock 점검','속도와 PVT별 margin을 다시 측정']};
    return{html:table(['관측 항목','결과'],[['LTSSM','L0'],['속도','Gen3'],['협상 width','x1'],['목표 width','x4'],['다음 관측','Lane1–3 receiver detect / error counter']]),evidence:['Link는 L0지만 협상 폭이 목표보다 작음','실장·lane mapping·power와 detect 결과 검사','x4 복구 후 replay/error counter를 관측']};
}
export function initDebug(root) {
    const d=i2cWrite(80,165,true).samples;root.querySelector('[data-debug-overview]').innerHTML=logicScope([d.map(s=>s.scl),d.map(s=>s.sda)],['SCL','SDA'],'I2C address NACK · 전압/시간 축이 없는 논리 trace 예');
    const select=root.querySelector('[name="debugScenario"]'),update=()=>{const d=debugScenario(select.value);root.querySelector('[data-debug-evidence]').innerHTML=d.html;root.querySelector('[data-debug-notes]').innerHTML='<ul>'+d.evidence.map(t=>`<li>${escape(t)}</li>`).join('')+'</ul>';};select.addEventListener('input',update);update();
}
