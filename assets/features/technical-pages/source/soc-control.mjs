import {dmaTrace,irqStep} from '../../curriculum/source/models.mjs';
import {registerWrite} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox} from './figures.mjs';
import {hex32,bindFields} from './soc-architecture.mjs';

export function dmaArchitecture() {
    let s=rect(8,65,158,205,'#f3f8ff',C.blue)+tx(87,95,'CPU','text-anchor="middle" class="label"')+labeledBox(25,115,124,117,'Driver','MMIO / DMA API',C.line,'#fff');
    s+=rect(290,18,205,305,'#f8f4ff',C.purple)+tx(392,49,'DMA controller','text-anchor="middle" class="label"');
    [['Descriptor fetch',72],['Address generator',120],['Bus master',246]].forEach(([name,y])=>s+=labeledBox(309,y,167,35,name,'',C.purple,'#fff'));
    s+=rect(309,168,167,61,'#fff',C.purple)+tx(392,189,'FIFO · 4 beat','text-anchor="middle" class="label"');
    [0,1,2,3].forEach(i=>s+=rect(324+i*36,202,29,16,'#e4dcfb',C.purple,2));
    s+=arrow(166,129,290,129,C.blue)+tx(227,104,'설정 / 시작','text-anchor="middle" class="small blue"')+wire('M290 250H166',C.blue,1.5,'stroke-dasharray="5 4"')+arrow(190,250,166,250,C.blue)+tx(227,277,'상태 / IRQ','text-anchor="middle" class="small blue"');
    s+=tx(513,91,'Source read','class="small green"')+arrow(612,112,495,112,C.green)+tx(513,202,'Destination write','class="small"')+arrow(495,222,612,222,C.red)+tx(317,351,'요청 → 수락 → 완료의 경계를 구분','text-anchor="middle" class="small"');
    return svg(640,375,'CPU descriptor 설정과 DMA address FIFO bus master 및 source destination 데이터 경로',s);
}
export function dmaTimeline(d) {
    const rows=d.rows.slice(0,25),left=142,step=865/rows.length;let s='';
    ['CPU / status','VALID','READY','수락 byte','IRQ'].forEach((name,i)=>s+=tx(5,48+i*56,name,'class="small label"')+wire(`M${left} ${64+i*56}H1030`,'#cbd8e8',1));
    let previous=0;
    rows.forEach((r,i)=>{const x=left+i*step,accepted=r.transferred-previous,stall=r.event.includes('READY=0'),transfer=/byte 수락/.test(r.event),valid=transfer||stall;
        if(i%Math.ceil(rows.length/18)===0)s+=tx(x+step/2,21,String(r.cycle),'text-anchor="middle" class="small"');
        s+=rect(x,193,Math.max(1,step-2),32,accepted?'#e4f8ef':stall?'#fff0f4':'#f4f7fb',accepted?C.green:stall?C.red:C.line,2)+tx(x+step/2,215,String(accepted),'text-anchor="middle" class="small"');
        previous=r.transferred;
    });
    s+=labeledBox(left,33,step-2,30,'CFG','',C.line,'#e5f1ff');
    if(rows.length>2)s+=labeledBox(left+step,33,step*(rows.length-2)-2,30,'DMA active','',C.line,'#f5f9ff');
    s+=labeledBox(left+(rows.length-1)*step,33,step-2,30,rows.at(-1).irq?d.status:'…','',C.purple,'#f1e9fc');
    const waves=[{y:120,color:C.blue,values:rows.map(r=>Number(/byte 수락|READY=0/.test(r.event)))},{y:176,color:C.green,values:rows.map(r=>Number(/byte 수락/.test(r.event)))},{y:288,color:C.purple,values:rows.map(r=>r.irq)}];
    waves.forEach(row=>s+=wire(row.values.map((value,i)=>i?`H${left+i*step}V${row.y-value*22}`:`M${left} ${row.y-value*22}`).join('')+`H${left+rows.length*step}`,row.color,2));
    s+=tx(580,334,`Cycle 0: 설정 · 수락 ${d.sent} byte · 최종 ${d.status}${d.rows.length>25?' · 처음 25개 관측 구간 표시':''}`,'text-anchor="middle" class="small"');
    return svg(1070,358,'DMA valid ready 수락 byte IRQ를 같은 cycle에 정렬한 전송 trace',s);
}
export function dmaLedger(d,v) {
    let before=0;return d.rows.map(r=>{const accepted=r.transferred-before,address=v.source+before,row=[r.cycle,hex32(address),r.event,accepted,r.transferred,r.remaining,r.irq];before=r.transferred;return row;});
}
export function initSocDma(root) {
    root.querySelector('[data-soc-dma-architecture]').innerHTML=dmaArchitecture();
    bindFields(root,'[data-soc-dma-inputs]',v=>{v.beat=Number(v.beat);const d=dmaTrace(v);
        root.querySelector('[data-soc-dma-descriptor]').innerHTML=table(['필드','값','의미'],[['SRC_ADDR',hex32(v.source),'읽기 시작 주소'],['DST_ADDR',hex32(v.destination),'쓰기 시작 주소'],['LENGTH',`${hex32(v.length)} · ${v.length} B`,'유효 byte'],['CONTROL','START | IRQ_ENABLE','완료 / 오류 IRQ 사용']]);
        root.querySelector('[data-soc-dma-status]').innerHTML=`<small>수락 ${d.sent} / ${v.length} byte · 잔여 ${v.length-d.sent} byte</small>${d.status}`;
        root.querySelector('[data-soc-dma-timeline]').innerHTML=dmaTimeline(d);
        root.querySelector('[data-soc-dma-ledger]').innerHTML=table(['Cycle','Read 주소','사건','수락 B','누적 B','잔여 B','IRQ'],dmaLedger(d,v));
    });
}

export function irqTopology(state={source:false,pending:false,masked:false,irq:false}) {
    let s=rect(240,18,510,330,'#f9fbff','#9bc4fb')+tx(495,42,'Interrupt controller','text-anchor="middle" class="label"');
    ['Timer','UART','DMA','GPIO'].forEach((name,i)=>{const y=67+i*67,pending=i===0&&state.pending,enabled=i===0?!state.masked:true,color=i===0&&state.irq?C.red:C.blue;
        s+=labeledBox(10,y,137,46,name,'',C.blue,'#eff6ff')+arrow(147,y+23,270,y+23,i===0&&state.source?C.red:C.ink)+tx(193,y+12,`IRQ${i}`,'text-anchor="middle" class="small"')+labeledBox(270,y,93,46,`P${i}: ${Number(pending)}`,'',C.purple,pending?'#eee1ff':'#fff');
        s+=arrow(363,y+23,428,y+23,C.purple)+wire(`M428 ${y+7}H446Q475 ${y+23} 446 ${y+39}H428Z`,C.blue)+tx(444,y-5,`EN${i}: ${Number(enabled)}`,'text-anchor="middle" class="small"')+arrow(461,y+23,586,y+23,color);
    });
    s+=wire('M586 59L679 91V290L586 322Z',C.blue)+tx(629,174,'Priority','text-anchor="middle" class="small label"')+tx(629,196,'Encoder','text-anchor="middle" class="small label"')+arrow(679,190,799,190,state.irq?C.red:C.blue)+tx(741,176,'IRQ','text-anchor="middle" class="label"');
    s+=rect(799,52,240,275,'#f4f8fe',C.line)+tx(919,79,'CPU','text-anchor="middle" class="label"');
    [['Exception entry',96],['ISR · 원인 확인 / 처리',175],['Return from exception',254]].forEach(([label,y],i)=>{s+=labeledBox(819,y,200,49,label,'',C.blue,'#fff');if(i<2)s+=arrow(919,y+49,919,y+78,C.blue);});
    return svg(1060,370,'pending 수집 후 enable과 우선순위를 적용해 CPU IRQ로 전달하는 interrupt controller',s);
}
export function digitalRows(rows,{width=1040,left=160,heightPerRow=55,top=30,labels=[],caption=''}={}) {
    const n=Math.max(...rows.map(r=>r.values.length)),step=(width-left-25)/n;let s='';
    for(let i=0;i<=n;i++)s+=wire(`M${left+i*step} ${top-10}V${top+rows.length*heightPerRow}`,'#e7edf5',.8);
    rows.forEach((row,r)=>{const y=top+r*heightPerRow;s+=tx(5,y+20,row.name,'class="small label"');
        if(row.numeric){row.values.forEach((v,i)=>s+=labeledBox(left+i*step,y,step-1,31,String(v),'',C.line,'#f6f9fe'));}
        else{s+=wire(row.values.map((v,i)=>`${i?'H'+(left+i*step)+'V':'M'+left+' '}${y+(v?0:26)}`).join('')+`H${left+n*step}`,row.color||C.blue,1.8);}
    });
    labels.forEach(l=>s+=tx(left+l.at*step,top+rows.length*heightPerRow+22,l.text,'text-anchor="middle" class="small"'));
    if(caption)s+=tx(width/2,top+rows.length*heightPerRow+54,caption,'text-anchor="middle" class="small"');
    return svg(width,top+rows.length*heightPerRow+(caption?75:40),'같은 시간 축에 정렬한 '+rows.map(r=>r.name).join(', '),s);
}
export function timerWave(period=10) {
    const length=Math.min(64,period*2+2),counts=Array.from({length},(_,i)=>i%period),event=counts.map((v,i)=>Number(i>0&&v===0));
    return digitalRows([{name:'Counter',values:counts,numeric:true},{name:'Wrap event',values:event,color:C.red},{name:'Pending (clear 없음)',values:event.map((_,i)=>Number(i>=period)),color:C.purple}],{left:190,caption:`0…${period-1} 이후 wrap · 사건이 발생하면 pending에 기록`});
}
export function clearOrderFigure(correct) {
    const source=correct?[0,0,1,1,1,0,0,0,0,0]:[0,0,1,1,1,1,1,1,1,1],pending=correct?[0,0,1,1,1,1,0,0,0,0]:[0,0,1,1,1,1,1,1,1,1];
    return digitalRows([{name:'Source',values:source,color:C.blue},{name:'Pending',values:pending,color:C.purple},{name:'IRQ',values:pending,color:C.red}],{width:570,left:100,heightPerRow:58,labels:[{at:5,text:'t5'},...(correct?[{at:6,text:'t6'}]:[])],caption:correct?'t5 source clear → t6 pending clear':'t5 pending clear → 활성 level이 즉시 다시 설정'});
}
export function initSocIrq(root) {
    root.querySelector('[data-soc-irq-wrong]').innerHTML=clearOrderFigure(false);root.querySelector('[data-soc-irq-correct]').innerHTML=clearOrderFigure(true);
    bindFields(root,'[data-soc-timer-inputs]',v=>{root.querySelector('[data-soc-timer-wave]').innerHTML=timerWave(v.period);root.querySelector('[data-soc-timer-period]').innerHTML=`<small>Timer event 간격</small>${fmt(v.period/v.frequency*1000)} ns`;});
    let state={source:false,pending:false,masked:false,irq:false,level:true,ticks:0,period:4,events:0};
    const render=()=>{root.querySelector('[data-soc-irq-topology]').innerHTML=irqTopology(state);root.querySelector('[data-soc-irq-state]').innerHTML=table(['상태','값'],[['Source',Number(state.source)],['Pending',Number(state.pending)],['Enable',Number(!state.masked)],['IRQ',Number(state.irq)],['Timer count',state.ticks],['Timer wrap 횟수',state.events]]);};
    root.querySelector('[name="trigger"]').addEventListener('input',event=>{state={...state,level:event.target.value==='level',source:false,pending:false,irq:false};render();});
    root.querySelectorAll('[data-irq-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.irqAction;state=action==='reset'?{source:false,pending:false,masked:false,irq:false,level:state.level,ticks:0,period:4,events:0}:irqStep(state,action);render();}));render();
}

export function clockTreeFigure() {
    let s=labeledBox(12,143,103,108,'XTAL','24 MHz',C.ink,'#fff')+labeledBox(185,133,139,129,'PLL','800 MHz',C.blue,'#eef6ff')+arrow(115,197,185,197,C.blue)+tx(149,181,'ref','text-anchor="middle" class="small"');
    const domains=[['CPU','÷1 · 800 MHz',C.blue],['BUS','÷2 · 400 MHz',C.green],['PERI','÷4 · 200 MHz',C.red]];
    domains.forEach(([name,divide,color],i)=>{const y=35+i*125;s+=wire(`M324 197H368V${y+42}H418`,C.blue)+labeledBox(418,y,187,84,'MUX / Divider',divide,color,'#fff')+arrow(605,y+42,730,y+42,color)+labeledBox(730,y,250,84,`${name} domain`,name==='CPU'?'Core / cache / debug':name==='BUS'?'NoC / DMA':'UART / SPI / GPIO',color,color+'10');});
    s+=labeledBox(12,451,170,79,'PWR_GOOD','Power condition',C.red,'#fff3f6')+labeledBox(255,451,189,79,'Reset controller','Power / lock / requests',C.purple,'#f8f4ff')+arrow(182,490,255,490,C.red)+wire('M254 262V415H318V451',C.blue)+tx(263,337,'PLL lock','class="small blue"');
    domains.forEach(([name,,color],i)=>{const y=392+i*65,domainY=35+i*125+62,right=1010+i*24;s+=wire(`M444 ${471+i*17}H${477+i*12}V${y+25}H535`,color)+labeledBox(535,y,190,50,`${name} reset sync`,'DFF → DFF',color,'#fff')+wire(`M725 ${y+25}H${right}V${domainY}H980`,color)+arrow(998,domainY,980,domainY,color)+tx(855,y+18,`rst_${name.toLowerCase()}_n`,'text-anchor="middle" class="small"');});
    return svg(1100,591,'PLL clock의 세 domain 분기와 각 domain에 독립적으로 연결한 reset synchronizer',s);
}
export function resetStartupFigure() {
    const n=24,power=Array.from({length:n},(_,i)=>Number(i>=3)),locked=power.map((_,i)=>Number(i>=8)),request=locked.map((_,i)=>Number(i>=8)),reset=locked.map((_,i)=>Number(i>=11));
    return digitalRows([{name:'PWR_GOOD',values:power,color:C.red},{name:'PLL_LOCK',values:locked,color:C.green},{name:'Domain clock',values:locked.map((v,i)=>v?(i%2):0),color:C.blue},{name:'Release condition',values:request,color:C.purple},{name:'rst_domain_n',values:reset,color:C.red}],{left:185,labels:[{at:3,text:'Power-good'},{at:8,text:'Lock / 준비'},{at:11,text:'두 edge 후 해제'}],caption:'Reset assert는 비동기 · release는 해당 domain clock에서 동기화'});
}
export function clockDomainStates(v) {
    const power=Boolean(Number(v.power)),stable=power&&(v.clockSource==='reference'||Boolean(Number(v.locked))),base=v.clockSource==='reference'?24:800;
    return ['cpu','bus','peri'].map((name,i)=>({name:name.toUpperCase(),frequency:stable?base/(2**i):0,released:stable&&!Number(v[name+'Reset'])&&v.edges>=2,reason:!power?'Power not ready':!stable?'Clock not stable':Number(v[name+'Reset'])?'Reset requested':v.edges<2?'Sync edge 대기':'실행 조건 충족'}));
}
export function domainResultFigure(v) {
    const d=clockDomainStates(v);let s=labeledBox(10,123,170,95,'Power / clock',v.clockSource==='reference'?'Reference bypass':'PLL clock',C.blue,'#f2f7ff')+labeledBox(270,123,160,95,'Reset controller',`Sync edges: ${v.edges}`,C.purple,'#f8f4ff')+arrow(180,170,270,170,C.blue);
    d.forEach((r,i)=>{const y=15+i*123,c=r.released?C.green:C.red;s+=wire(`M430 170H485V${y+42}H540`,c)+labeledBox(540,y,258,88,`${r.name} · ${fmt(r.frequency)} MHz`,`reset_n = ${Number(r.released)}`,c,c+'12')+tx(669,y+111,r.reason,'text-anchor="middle" class="small"');});
    return svg(825,395,'도메인별 clock 주파수 reset_n 및 실행 조건 상태',s);
}
export function initSocClock(root) {
    root.querySelector('[data-soc-clock-tree]').innerHTML=clockTreeFigure();root.querySelector('[data-soc-reset-startup]').innerHTML=resetStartupFigure();bindFields(root,'[data-soc-clock-inputs]',v=>root.querySelector('[data-soc-domain-result]').innerHTML=domainResultFigure(v));
}

export function bootMemoryFigure() {
    let s='';[['ROM','0x0000_0000',C.blue,['Boot code','Reset vector']],['SRAM','0x2000_0000',C.green,['Loaded image','Stack / workspace']],['External Flash','Boot medium',C.red,['Boot image','Kernel / config']]].forEach(([name,addr,c,items],i)=>{const x=10+i*211;s+=rect(x,10,177,255,c+'0e',c)+tx(x+88,40,name,'text-anchor="middle" class="label"')+tx(x+88,63,addr,'text-anchor="middle" class="small"');items.forEach((label,j)=>s+=labeledBox(x+14,87+j*68,149,51,label,'',c,'#fff'));s+=arrow(x+88,265,x+88,315,c)+arrow(x+102,315,x+102,265,c);});
    s+=labeledBox(10,315,599,53,'AHB / AXI interconnect','',C.orange,'#fff8ee')+arrow(432,241,398,241,C.red)+tx(416,290,'Flash → SRAM','text-anchor="middle" class="small"')+tx(309,404,'ROM 코드가 image를 검사·적재한 뒤 SRAM entry로 jump','text-anchor="middle" class="small"');
    return svg(630,430,'ROM에서 시작한 코드가 외부 flash image를 SRAM으로 적재하고 실행하는 부팅 경로',s);
}
export function softwareStackFigure() {
    let s='';[['Application','서비스 / library API',C.blue],['OS / Driver','MMIO / DMA API',C.purple],['HAL / BSP','플랫폼 초기화',C.ink],['Hardware','Register / DMA / interrupt',C.green]].forEach(([name,sub,c],i)=>{const y=12+i*103;s+=labeledBox(15,y,375,73,name,sub,c,c+'0d');if(i<3)s+=arrow(202,y+73,202,y+103,c)+arrow(219,y+103,219,y+73,c);});return svg(410,425,'Application OS driver HAL BSP hardware 소프트웨어 계층',s);
}
export function driverScenario(kind='success') {
    const v={length:32,beat:4,stall:kind==='timeout'?10:0,timeout:kind==='timeout'?4:100,errorAt:kind==='error'?3:-1,source:0x20000000,destination:0x20001000};
    const d=dmaTrace(v);return {...d,next:d.status==='DONE'?'상태 확인 → DMA sync for CPU → output 검증':d.status==='TIMEOUT'?'중단 요청 → idle 대기 → status / 잔여량 보존':'Error status 확인 → 전송 중단 → 실패 주소 / 잔여량 보존'};
}
export function driverPathFigure(kind='success') {
    const d=driverScenario(kind),c=d.status==='DONE'?C.green:C.red;let s=labeledBox(12,100,135,105,'CPU','Driver',C.blue,'#eff6ff')+labeledBox(244,65,176,175,'DMA','CTRL / STATUS',C.purple,'#f8f4ff')+labeledBox(501,35,169,100,'Source','0x2000_0000',C.green,'#effbf6')+labeledBox(501,220,169,100,'Destination','0x2000_1000',C.green,'#effbf6')+arrow(147,132,244,132,C.blue)+arrow(501,86,420,108,C.green)+arrow(420,216,501,270,c)+wire('M244 211H184V239H80V205',c)+arrow(80,225,80,205,c)+tx(178,274,d.status,'text-anchor="middle" class="label"');return svg(690,345,'driver 결과에 따라 성공 또는 timeout error 상태를 CPU에 반환하는 DMA 경로',s);
}
export function bootRegisterWrite(register,value) {
    const map={CTRL:[0,0],SRC:[4,0x20000000],DST:[8,0x20001000],LENGTH:[12,32],STATUS:[16,7]},[offset,previous]=map[register];
    if(register==='CTRL')return{offset,previous,next:value&2,note:`START ${value&1?'명령 발생':'없음'} · IRQ_ENABLE = ${(value>>1)&1} · START는 수락 후 0`};
    if(register==='STATUS')return{offset,previous,next:(previous&1)|registerWrite(previous&6,value&6,'W1C',15).value,note:'BUSY bit0은 RO로 유지 · DONE bit1 / ERROR bit2만 W1C'};
    return{offset,previous,next:value>>>0,note:register==='LENGTH'?'길이 0과 최대 길이의 정책은 DMA 시작 시 검사':'Address alignment와 접근 허용 범위는 시작 시 검사'};
}
export function initSocBoot(root) {
    root.querySelector('[data-soc-boot-memory]').innerHTML=bootMemoryFigure();root.querySelector('[data-soc-software-stack]').innerHTML=softwareStackFigure();
    const select=root.querySelector('[name="driverScenario"]'),update=()=>{const d=driverScenario(select.value);root.querySelector('[data-soc-driver-path]').innerHTML=driverPathFigure(select.value);root.querySelector('[data-soc-driver-outcome]').innerHTML=table(['관측','결과'],[['Status',d.status],['수락 byte',d.sent],['잔여 byte',32-d.sent],['처리',d.next]]);};select.addEventListener('input',update);update();
    bindFields(root,'[data-soc-boot-register-inputs]',v=>{const d=bootRegisterWrite(v.register,v.writeValue);root.querySelector('[data-soc-boot-register]').innerHTML=table(['항목','값'],[['Address',hex32(0x40000000+d.offset)],['이전 값',hex32(d.previous)],['Write data',hex32(v.writeValue)],['적용 후',hex32(d.next)],['동작',d.note]]);});
}
