import {registerWrite} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox} from './figures.mjs';

export const hex32=value=>'0x'+(value>>>0).toString(16).toUpperCase().padStart(8,'0').replace(/(.{4})$/,'_$1');
export const readFields=form=>Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,form.elements.namedItem(key).type==='number'?Number(value):value]));
export function bindFields(root,selector,render) {
    const form=root.querySelector(selector),update=()=>{if(form.checkValidity())render(readFields(form));};
    root.addEventListener('input',event=>{if(event.target.form===form)update();});
    form.addEventListener('submit',event=>event.preventDefault());update();return update;
}
export function frameBudget(v) {
    const frameBytes=v.width*v.height*v.bytesPerPixel,rate=frameBytes*v.fps/1e6,period=1000/v.fps;
    const stages=[2,frameBytes/(v.bandwidth*1000),v.compute,3],latency=stages.reduce((a,b)=>a+b,0),interval=Math.max(...stages);
    return {frameBytes,rate,period,stages,latency,interval,throughput:1000/interval};
}
export function framePipeline(d) {
    const names=['Capture','Transfer','Compute','Display'],colors=[C.blue,C.purple,C.red,C.green],limit=Math.max(d.latency,d.period)*1.12,left=118,right=940,sx=t=>left+t/limit*(right-left);let s='';
    for(let i=0;i<=5;i++){const t=limit*i/5;s+=wire(`M${sx(t)} 34V299`,'#e1eaf5',1)+tx(sx(t),324,fmt(t),'text-anchor="middle" class="small"');}
    let offset=0;d.stages.forEach((time,i)=>{const y=48+i*60,w=sx(time)-left;s+=tx(4,y+25,names[i],'class="label"')+rect(sx(offset),y,w,39,colors[i]+'20',colors[i],4)+tx(sx(offset)+w/2,y+25,`${fmt(time)} ms`,'text-anchor="middle" class="small"');offset+=time;});
    s+=wire(`M${sx(d.period)} 25V295`,C.blue,1.5,'stroke-dasharray="5 4"')+tx(sx(d.period),18,`입력 주기 ${fmt(d.period)} ms`,'text-anchor="middle" class="small blue"')+arrow(left,288,sx(d.latency),288,C.ink)+tx((left+sx(d.latency))/2,279,`직렬 latency ${fmt(d.latency)} ms`,'text-anchor="middle" class="small"');
    s+=tx(520,358,`독립 stage overlap의 이론적 처리 주기: ${fmt(d.interval)} ms/frame`,'text-anchor="middle" class="label blue"');
    return svg(1000,380,'Capture 전송 연산 출력의 직렬 latency와 입력 frame 주기를 비교하는 시간 예산',s);
}
export function initSocRequirements(root) {
    bindFields(root,'[data-system-budget-inputs]',v=>{const d=frameBudget(v);
        root.querySelector('[data-system-rate]').textContent=`≥ ${fmt(d.rate)} MB/s`;
        root.querySelector('[data-system-period]').textContent=`${fmt(d.period)} ms / frame`;
        root.querySelector('[data-system-memory]').textContent=`≥ ${fmt(d.frameBytes*2/1e6)} MB`;
        root.querySelector('[data-system-values]').innerHTML=table(['계산 항목','결과'],[['Frame 크기',`${d.frameBytes.toLocaleString()} byte`],['Frame 크기 (MiB)',fmt(d.frameBytes/2**20)],['직렬 latency',`${fmt(d.latency)} ms`],['이론적 처리율',`${fmt(d.throughput)} fps`],['연속 입력 수락',d.interval<=d.period?'가능 · 공유 자원 경합 제외':'불가 · 가장 느린 stage가 입력보다 느림']]);
        root.querySelector('[data-system-pipeline]').innerHTML=framePipeline(d);
    });
}

export function socPathFigure(mode='control') {
    const colors={control:C.blue,data:C.red,clock:C.green,power:C.orange},color=colors[mode];let s='';
    const boxes=[['CPU',30,45,165,125],['DMA',325,45,170,125],['SRAM',620,45,170,125],['NPU',915,45,165,125]];
    for(const [name,x,y,w,h] of boxes){s+=rect(x,y,w,h,'#fff',color)+tx(x+w/2,y+30,name,'text-anchor="middle" class="label"');
        const sub=name==='CPU'?['MMIO','Driver']:name==='DMA'?['CTRL / STATUS','Address / FIFO']:name==='SRAM'?['Buffer A','Buffer B']:['PE array','Local SRAM'];sub.forEach((label,j)=>s+=labeledBox(x+13,y+44+j*34,w-26,27,label,'',C.line,'#f8fbff'));
    }
    if(mode==='control'){
        s+=arrow(195,95,325,95,color)+tx(260,80,'MMIO write','text-anchor="middle" class="small"')+wire('M410 170V222H113V170',color,1.7,'stroke-dasharray="5 4"')+arrow(113,202,113,170,color)+tx(260,246,'STATUS / IRQ 응답','text-anchor="middle" class="small blue"')+arrow(195,50,300,50,color)+wire('M300 50V20H1000V45',color)+tx(654,15,'NPU 설정 · shape / dtype / command','text-anchor="middle" class="small"');
    }else if(mode==='data'){
        s+=arrow(620,94,495,94,color)+tx(558,78,'Read payload','text-anchor="middle" class="small"')+wire('M410 170V220H1000V170',color,2)+arrow(1000,204,1000,170,color)+tx(701,245,'DMA가 준비한 input buffer / stream','text-anchor="middle" class="small"')+arrow(915,123,790,123,C.green)+tx(850,151,'Output write','text-anchor="middle" class="small green"');
    }else{
        s+=labeledBox(375,216,350,57,mode==='clock'?'Clock / reset controller':'Always-on PMU',mode==='clock'?'안정된 clock · domain별 reset sync':'Power switch · isolation · retention',color,'#fff');
        boxes.forEach(([,x,,w])=>{const cx=x+w/2;s+=wire(`M550 216V192H${cx}V170`,color,1.8)+arrow(cx,187,cx,170,color);});
    }
    return svg(1110,290,`${mode} 계층에서 구분하는 CPU DMA SRAM NPU 연결`,s);
}
export function socExamplePath() {
    let s='';[['CPU','MMIO master',C.blue],['DMA','Data mover',C.red],['SRAM','Shared buffer',C.purple],['NPU','Compute',C.green]].forEach(([label,sub,color],i)=>{const x=15+i*287;s+=labeledBox(x,45,165,105,label,sub,color,color+'0d');if(i<3)s+=arrow(x+165,96,x+285,96,i?C.red:C.blue)+tx(x+225,73,i?'Payload':'Control','text-anchor="middle" class="small"');});
    s+=wire('M383 150V201H97V150',C.blue,1.5,'stroke-dasharray="5 4"')+arrow(97,178,97,150,C.blue)+tx(245,226,'완료 / 오류 · interrupt controller 경유','text-anchor="middle" class="small blue"');
    return svg(1060,250,'CPU의 제어 접근과 DMA SRAM NPU의 payload 이동 및 IRQ 반환',s);
}
export function initSocMap(root) {
    root.querySelector('[data-soc-example-path]').innerHTML=socExamplePath();
    const select=root.querySelector('[name="socPath"]'),notes={control:'CPU는 주소가 지정된 register를 통해 시작 조건과 상태를 교환합니다. Register transaction의 수락은 payload 전송 완료와 다릅니다.',data:'Payload는 DMA, memory와 accelerator의 데이터 경로를 사용합니다. Format·beat 폭·순서·ownership·완료 조건을 함께 정의합니다.',clock:'Clock 분배와 reset 해제 조건을 domain마다 확인합니다. 서로 다른 clock / reset 경계에는 CDC / RDC 검토가 필요합니다.',power:'PMU는 power switch, isolation, retention의 순서를 관리합니다. 전원이 꺼진 IP에 대한 요청 차단과 wake 완료 응답도 계약에 포함합니다.'};
    const update=()=>{root.querySelector('[data-soc-selected-path]').innerHTML=socPathFigure(select.value);root.querySelector('[data-soc-path-note]').textContent=notes[select.value];};select.addEventListener('input',update);update();
}

export const socMemoryMap=[
    {name:'Boot ROM',start:0,end:0xffff,size:'64 KiB',color:C.blue},
    {name:'On-chip SRAM',start:0x20000000,end:0x2003ffff,size:'256 KiB',color:C.green},
    {name:'MMIO aperture',start:0x40000000,end:0x5fffffff,size:'512 MiB',color:C.orange},
    {name:'External DDR',start:0x80000000,end:0xbfffffff,size:'1 GiB',color:C.purple}
];
export function addressMapFigure() {
    let s=tx(18,25,'SoC address space · 32 bit','class="label"')+tx(610,25,'MMIO aperture의 주변장치 예','class="label"');
    const ranges=[['0xC000_0000–0xFFFF_FFFF','Reserved',C.line],['0x8000_0000–0xBFFF_FFFF','DDR · 1 GiB',C.purple],['0x6000_0000–0x7FFF_FFFF','Reserved',C.line],['0x4000_0000–0x5FFF_FFFF','MMIO · 512 MiB',C.orange],['0x2000_0000–0x2003_FFFF','SRAM · 256 KiB',C.green],['0x0000_0000–0x0000_FFFF','Boot ROM · 64 KiB',C.blue]];
    ranges.forEach(([range,name,color],i)=>{const y=48+i*57;s+=rect(18,y,235,54,color+'18',color,0)+tx(135,y+32,name,'text-anchor="middle" class="small label"')+tx(270,y+32,range,'class="small"');});
    s+=tx(18,415,'빈 구간은 reserved · 일부 reserved gap은 생략','class="small"');
    [['UART','0x5000_0000–0x5000_FFFF',C.purple],['SPI','0x4001_0000–0x4001_FFFF',C.blue],['DMA','0x4000_0000–0x4000_FFFF',C.green]].forEach(([name,range,color],i)=>{const y=86+i*95;s+=labeledBox(616,y,190,72,name,'64 KiB',color,color+'12')+tx(824,y+29,range,'class="small"')+tx(824,y+52,'나머지 주소는 미할당','class="small"');});
    s+=wire('M253 219H573L616 86M253 273H573L616 348',C.orange,1.2,'stroke-dasharray="5 4"')+tx(617,388,'DMA base 0x4000_0000 + offset → register','class="small blue"');
    return svg(1130,435,'겹치지 않는 ROM SRAM MMIO DDR 주소 범위와 MMIO 내부 DMA SPI UART의 64KiB 창',s);
}
export function ctrlBitsFigure() {
    let s=tx(16,25,'CTRL · 0x4000_0000','class="label"')+tx(540,25,'Reset 0','text-anchor="end" class="small"');
    [[16,320,'31:2','RESERVED',C.line],[336,114,'1','IRQ_EN',C.blue],[450,100,'0','START',C.green]].forEach(([x,w,bit,label,c])=>{s+=tx(x+w/2,63,bit,'text-anchor="middle" class="small"')+labeledBox(x,75,w,57,label,'',c,c+'12');});
    s+=tx(393,161,'RW','text-anchor="middle" class="small"')+tx(500,161,'Command','text-anchor="middle" class="small"');
    return svg(570,184,'CTRL 상위 reserved 30bit와 IRQ enable 및 START command bit',s);
}
export function decoderFigure() {
    let s=labeledBox(10,112,120,118,'CPU','MMIO master',C.blue,'#eef6ff')+labeledBox(215,112,130,118,'Decoder','Address match',C.ink,'#f6f8fc')+arrow(130,155,215,155,C.blue)+arrow(215,185,130,185,C.blue);
    [['UART','0x5000_0000',C.purple],['SPI','0x4001_0000',C.blue],['DMA','0x4000_0000',C.green]].forEach(([name,addr,c],i)=>{const y=14+i*111;s+=labeledBox(417,y,155,85,name,addr,c,c+'10')+wire(`M345 171H382V${y+42}H417`,c)+arrow(400,y+42,417,y+42,c);});
    s+=tx(288,342,'미할당 주소 → decode error','text-anchor="middle" class="small"');
    return svg(595,365,'주소 decoder가 UART SPI DMA 중 하나의 target 또는 오류 응답을 선택하는 구조',s);
}
export function byteLanesFigure(strobe=3,value=1) {
    let s='';
    [3,2,1,0].forEach((lane,i)=>{const x=105+i*109,on=Boolean(strobe&(1<<lane));s+=tx(x+51,25,`Lane ${lane}`,'text-anchor="middle" class="small"')+labeledBox(x,39,103,54,`D[${lane*8+7}:${lane*8}]`,'',C.line,'#f8fbff')+rect(x,124,103,43,on?'#eef6ff':'#fafbfc',on?C.blue:C.line)+tx(x+51,151,on?'WRITE':'KEEP','text-anchor="middle" class="small"')+tx(x+51,216,on?'0x'+((value>>>(lane*8))&255).toString(16).toUpperCase().padStart(2,'0'):'—','text-anchor="middle" class="label"');});
    s+=tx(3,70,'Byte','class="small"')+tx(3,150,'WSTRB','class="small"')+tx(3,216,'WDATA','class="small"')+wire('M100 237H543',C.line)+tx(280,276,`WSTRB = 0b${strobe.toString(2).padStart(4,'0')}`,'text-anchor="middle" class="label blue"');
    return svg(565,301,'Little-endian byte lane 별 write strobe와 쓰기 데이터',s);
}
export function initSocRegister(root) {
    root.querySelector('[data-soc-address-map]').innerHTML=addressMapFigure();root.querySelector('[data-soc-ctrl-bits]').innerHTML=ctrlBitsFigure();root.querySelector('[data-soc-decoder]').innerHTML=decoderFigure();
    bindFields(root,'[data-soc-register-inputs]',v=>{const d=registerWrite(v.previous,v.value,v.access,v.strobe);root.querySelector('[data-soc-byte-lanes]').innerHTML=byteLanesFigure(v.strobe,v.value);root.querySelector('[data-soc-register-result]').innerHTML=table(['적용 단계','32-bit 값'],[['이전 register',hex32(v.previous)],['쓰기 데이터',hex32(v.value)],['Byte mask',hex32(d.mask)],['Access',v.access],['적용 후 register',hex32(d.value)]]);});
}

export function memoryHierarchyFigure() {
    let s='';const layers=[['CPU','Core',100,C.blue],['L1 cache','Instruction / Data',160,C.blue],['L2 cache','Private 또는 shared',220,C.purple],['LLC','공유 cache · 선택적',280,C.red],['Interconnect','Snoop / routing / arbitration',340,C.orange],['DRAM','Main memory',400,C.green]];
    layers.forEach(([name,sub,w,c],i)=>{const x=285-w/2,y=10+i*63;s+=rect(x,y,w,54,c+'10',c)+tx(285,y+24,name,'text-anchor="middle" class="label"')+tx(285,y+44,sub,'text-anchor="middle" class="small"');if(i<5)s+=wire(`M${x} ${y+54}L${x-30} ${y+63}M${x+w} ${y+54}L${x+w+30} ${y+63}`,c,1);});
    s+=arrow(38,322,38,75,C.ink)+tx(9,45,'가까움','class="small"')+tx(9,372,'용량 증가','class="small"')+tx(285,410,'정확한 용량과 지연은 제품·구성·workload에 따라 다름','text-anchor="middle" class="small"');return svg(560,433,'CPU L1 L2 LLC interconnect DRAM 메모리 계층',s);
}
export function twoCoreFigure(event='write') {
    const values=event==='write'?['M','I','0xA5','—','0x11']:event==='read'?['S','S','0xA5','0xA5','0xA5']:['I','M','—','0x3C','0xA5'];let s='';
    [0,1].forEach(i=>{const x=i?620:10;s+=rect(x,25,215,195,'#f5f9ff',C.blue)+tx(x+107,53,`Core ${i}`,'text-anchor="middle" class="label"')+labeledBox(x+18,72,179,120,'L1 · Line X',`${values[i]} · ${values[i+2]}`,i?C.purple:C.blue,'#fff');});
    s+=labeledBox(317,73,175,123,'Coherent fabric','Snoop / ownership',C.orange,'#fff9ef')+arrow(225,132,317,132,C.blue)+arrow(492,132,620,132,C.purple)+labeledBox(278,286,255,80,'DRAM · Line X',values[4],C.green,'#effbf7')+arrow(405,196,405,286,C.green);
    const note=event==='write'?'Core 0 write: 다른 copy invalidate · memory는 이전 값':event==='read'?'Core 1 read: 최신 값 전달 · 이 예제에서는 writeback 후 S / S':'Core 1 write: ownership 이동 · Core 0 copy invalidate';
    s+=tx(421,254,note,'text-anchor="middle" class="small"');return svg(855,390,'MESI 사건 후 두 core의 line state와 memory 값을 함께 표시한 coherence 구조',s);
}
export function ownershipTimeline() {
    let s='';const rows=[['CPU',C.blue],['DMA',C.red],['Memory',C.green]];
    rows.forEach(([name,c],i)=>s+=tx(8,65+i*88,name,'class="label"')+wire(`M93 ${83+i*88}H579`,'#c8d8eb',1));
    const items=[[0,100,155,'Descriptor 작성'],[0,405,145,'Doorbell write'],[1,405,145,'Descriptor read'],[2,250,150,'Publish / sync'],[2,405,145,'장치가 관측']];
    items.forEach(([r,x,w,name])=>s+=labeledBox(x,42+r*88,w,42,name,'',rows[r][1],rows[r][1]+'12'));
    [250,405].forEach(x=>s+=wire(`M${x} 23V292`,'#8198b4',1,'stroke-dasharray="4 4"'));
    s+=tx(320,318,'플랫폼 DMA 동기화 + 필요한 ordering 이후 장치에 전달','text-anchor="middle" class="small"');return svg(605,342,'descriptor 작성 후 publish synchronization과 doorbell 순서를 구분한 소유권 시간도',s);
}
export function coherenceResult(v) {
    const safe=Boolean(Number(v.coherent)||Number(v.maintenance));
    return {observed:safe?0xa5:0x11,expected:0xa5,safe,cpu:v.direction==='read'?0xa5:(safe?0xa5:0x11),memory:v.direction==='read'?(safe?0xa5:0x11):0xa5,dma:v.direction==='read'?(safe?0xa5:0x11):0xa5};
}
export function bufferOwnershipFigure(v) {
    const d=coherenceResult(v),h=x=>'0x'+x.toString(16).toUpperCase();let s=labeledBox(15,44,205,150,'CPU cache',h(d.cpu),C.blue,'#f1f7ff')+labeledBox(635,44,205,150,'DMA',h(d.dma),C.purple,'#f7f4ff')+labeledBox(329,164,200,110,'Memory',h(d.memory),C.green,'#effaf6');
    s+=arrow(220,111,635,111,d.safe?C.green:C.red,2)+tx(428,81,d.safe?(Number(v.coherent)?'Coherent 전달':'DMA API 동기화'):'동기화 누락 · stale copy','text-anchor="middle" class="label"');
    s+=wire('M117 194V219H329',C.blue)+arrow(309,219,329,219,C.blue)+wire('M529 219H737V194',C.purple)+arrow(737,213,737,194,C.purple);
    if(!d.safe)s+=wire('M418 102l18 18m0-18-18 18',C.red,3);
    s+=tx(428,316,`${v.direction==='read'?'장치':'CPU'} 관측: ${h(d.observed)} · 기대값: ${h(d.expected)}`,'text-anchor="middle" class="label"');return svg(860,342,'CPU cache memory DMA의 값과 cache synchronization에 따른 관측 결과',s);
}
export function initSocCoherence(root) {
    root.querySelector('[data-soc-memory-hierarchy]').innerHTML=memoryHierarchyFigure();root.querySelector('[data-soc-ownership-timeline]').innerHTML=ownershipTimeline();
    const select=root.querySelector('[name="coherenceEvent"]'),update=()=>root.querySelector('[data-soc-two-core]').innerHTML=twoCoreFigure(select.value);select.addEventListener('input',update);update();
    bindFields(root,'[data-soc-coherence-inputs]',v=>{const d=coherenceResult(v);root.querySelector('[data-soc-buffer-ownership]').innerHTML=bufferOwnershipFigure(v);root.querySelector('[data-coherence-outcome]').innerHTML=`<small>${v.direction==='read'?'DMA read':'CPU read after DMA write'}</small>${d.safe?'최신 값 0xA5 관측':'이전 값 0x11 관측'}`;});
}
