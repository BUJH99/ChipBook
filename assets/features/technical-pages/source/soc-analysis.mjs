import {roofline,dmaTrace} from '../../curriculum/source/models.mjs';
import {overlap} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox} from './figures.mjs';
import {hex32,bindFields} from './soc-architecture.mjs';
import {dmaLedger} from './soc-control.mjs';

export function performancePath() {
    let s=rect(7,114,204,176,'#f2f7ff',C.blue)+tx(109,146,'CPU / Driver','text-anchor="middle" class="label"');
    ['작업 설정','DMA 시작','상태 / 결과 확인'].forEach((name,i)=>s+=labeledBox(29,164+i*35,160,28,name,'',C.line,'#fff'));
    s+=labeledBox(347,139,209,126,'DMA','Address / FIFO / Master',C.purple,'#f7f3ff')+arrow(211,184,347,184,C.blue)+tx(280,164,'Descriptor / MMIO','text-anchor="middle" class="small"')+arrow(347,244,211,244,C.blue)+tx(279,279,'상태 / IRQ','text-anchor="middle" class="small"');
    s+=rect(555,10,250,97,'#f2f8fd',C.line)+tx(680,37,'DRAM','text-anchor="middle" class="label"');
    for(let i=0;i<7;i++)s+=rect(570+i*32,52,25,35,i%2?'#cfe3f5':'#dcedf9','#abc2da',2);
    s+=wire('M451 139V58H555',C.green,2)+arrow(475,58,451,58,C.green)+arrow(451,118,451,139,C.green)+tx(453,25,'Input read','class="small green"')+wire('M556 218H680V107',C.red,2)+arrow(680,128,680,107,C.red)+tx(691,128,'Output write','class="small"');
    s+=rect(862,121,231,178,'#effaf6',C.green)+tx(977,151,'Accelerator','text-anchor="middle" class="label"');
    for(let r=0;r<2;r++)for(let c=0;c<4;c++)s+=labeledBox(880+c*48,169+r*44,39,35,'PE','',C.green,'#fff');
    s+=arrow(556,191,862,191,C.blue)+tx(771,169,'Input tensor','text-anchor="middle" class="small blue"')+arrow(862,258,556,258,C.green)+tx(760,283,'Output tensor','text-anchor="middle" class="small green"');
    return svg(1115,330,'CPU DMA DRAM accelerator의 제어 및 입력 출력 데이터 전송 경로',s);
}
export function systemPerformance(v) {
    const load=v.inputMB/v.bandwidthGB,store=v.outputMB/v.bandwidthGB,compute=v.operationsG/v.peakTOPS;
    const stages=[.2,load,compute,store,.3],serial=stages.reduce((a,b)=>a+b,0);
    const memoryBytes=(v.inputMB+v.outputMB)*1e6,r=roofline({operations:v.operationsG*1e9,bytes:memoryBytes,peak:v.peakTOPS*1000,bandwidthGB:v.bandwidthGB});
    return {load,store,compute,stages,serial,roofline:r,overlap:overlap({tiles:v.tiles,load,compute,store})};
}
export function performanceWaterfall(d) {
    const names=['CPU 설정','Input DMA','연산','Output DMA','결과 확인'],colors=[C.blue,C.purple,C.green,C.purple,C.blue];let s='';
    names.forEach((name,i)=>{const x=10+i*216;s+=labeledBox(x,18,187,75,name,`${fmt(d.stages[i])} ms`,colors[i],colors[i]+'15');if(i<4)s+=arrow(x+187,55,x+216,55,C.blue);});
    const left=10,width=1051;let at=0;
    d.stages.forEach((duration,i)=>{const x=left+at/d.serial*width,w=duration/d.serial*width;s+=rect(x,124,w,35,colors[i]+'65','#fff',0);if(w>75)s+=tx(x+w/2,147,`${fmt(duration)} ms`,'text-anchor="middle" class="small"');at+=duration;});
    s+=arrow(left,188,left+width,188,C.ink)+tx(540,217,`한 tile 직렬 시간 ${fmt(d.serial)} ms`,'text-anchor="middle" class="label"');return svg(1080,242,'CPU 설정 input DMA compute output DMA 결과 확인의 시간을 합산한 waterfall',s);
}
export function overlapFigure(d) {
    const data=d.overlap,left=154,width=880,end=Math.max(data.overlapped,.001),sx=t=>left+t/end*width;let s='';
    for(let i=0;i<=5;i++){const x=left+i*width/5;s+=wire(`M${x} 24V246`,'#dfE8f3',1)+tx(x,272,fmt(end*i/5),'text-anchor="middle" class="small"');}
    [['Load engine','lStart','lEnd',C.purple],['Compute','cStart','cEnd',C.green],['Store engine','sStart','sEnd',C.red]].forEach(([name,start,finish,c],r)=>{const y=44+r*68;s+=tx(5,y+28,name,'class="label"');data.rows.forEach(row=>{const w=sx(row[finish])-sx(row[start]);s+=rect(sx(row[start]),y,w,42,c+'35',c,3);if(w>32)s+=tx(sx(row[start])+w/2,y+27,`T${row.tile}`,'text-anchor="middle" class="small"');});});
    s+=tx(594,309,`단위 ms · ${data.rows.length} tiles · 직렬 ${fmt(data.serial)} → overlap ${fmt(data.overlapped)} ms`,'text-anchor="middle" class="label blue"')+tx(594,336,'Buffer A/B 교대 · 같은 buffer의 store 완료 전에는 재사용하지 않음','text-anchor="middle" class="small"');return svg(1080,358,'독립 load compute store와 double buffer 소유권 제약으로 계산한 tile overlap schedule',s);
}
export function rooflineFigure(v,d) {
    const r=d.roofline,xmin=-1,xmax=4,ymin=-3,ymax=Math.max(2,Math.ceil(Math.log10(v.peakTOPS))+1),left=68,right=600,top=28,bottom=287,sx=x=>left+(x-xmin)/(xmax-xmin)*(right-left),sy=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);let s='';
    for(let x=xmin;x<=xmax;x++)s+=wire(`M${sx(x)} ${top}V${bottom}`,'#e0e8f2',1)+tx(sx(x),bottom+24,`${10**x}`,'text-anchor="middle" class="small"');
    for(let y=ymin;y<=ymax;y++)s+=wire(`M${left} ${sy(y)}H${right}`,'#e0e8f2',1)+tx(left-8,sy(y)+5,`${10**y}`,'text-anchor="end" class="small"');
    const points=Array.from({length:101},(_,i)=>{const x=xmin+(xmax-xmin)*i/100,y=Math.log10(Math.min(v.peakTOPS,10**x*v.bandwidthGB/1000));return[sx(x),sy(Math.max(ymin,y))];});
    s+=wire(points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(''),C.blue,2.8)+node(sx(Math.max(xmin,Math.min(xmax,Math.log10(r.intensity)))),sy(Math.max(ymin,Math.log10(r.performance/1000))),C.red,5)+tx(325,346,'Arithmetic intensity (Op / byte) · log scale','text-anchor="middle" class="small"')+tx(left,16,'성능 상한 (TOp/s)','class="small"');
    return svg(630,370,'연산량과 전체 외부 byte 이동량에 따른 memory와 compute roofline 상한',s);
}
export function initSocPerformance(root) {
    root.querySelector('[data-soc-performance-path]').innerHTML=performancePath();
    bindFields(root,'[data-soc-performance-inputs]',v=>{const d=systemPerformance(v),r=d.roofline;root.querySelector('[data-soc-performance-waterfall]').innerHTML=performanceWaterfall(d);root.querySelector('[data-soc-performance-overlap]').innerHTML=overlapFigure(d);root.querySelector('[data-soc-roofline]').innerHTML=rooflineFigure(v,d);
        root.querySelector('[data-soc-performance-budgets]').innerHTML=table(['Stage','Workload','모델 상한','최소 시간'],[['Input DMA',`${fmt(v.inputMB)} MB`,`${fmt(v.bandwidthGB)} GB/s`,`${fmt(d.load)} ms`],['Compute',`${fmt(v.operationsG)} GOp`,`${fmt(v.peakTOPS)} TOp/s`,`${fmt(d.compute)} ms`],['Output DMA',`${fmt(v.outputMB)} MB`,`${fmt(v.bandwidthGB)} GB/s`,`${fmt(d.store)} ms`]]);
        root.querySelector('[data-soc-roofline-result]').innerHTML=table(['항목','결과'],[['전체 외부 이동량',`${fmt(v.inputMB+v.outputMB)} MB`],['Arithmetic intensity',`${fmt(r.intensity)} Op/byte`],['상한',`${fmt(r.performance/1000)} TOp/s`],['분류',r.bound],['Roofline 최소 시간',`${fmt(r.milliseconds)} ms`]]);
    });
}

export function verificationEnvironment() {
    let s=rect(10,10,1080,231,'#f1f7ff','#8fbbf4')+tx(550,38,'Verification environment','text-anchor="middle" class="label"')+rect(10,272,1080,230,'#f7f9fc','#8a9bb1')+tx(29,298,'SoC · DUT','class="label"');
    s+=labeledBox(33,66,204,59,'Sequence / test','Stimulus + expected',C.blue,'#fff')+labeledBox(33,160,204,58,'Host bus driver','구동',C.blue,'#fff')+arrow(135,125,135,160,C.blue)+labeledBox(443,66,202,70,'Monitor','관측만 수행',C.blue,'#fff')+labeledBox(797,66,240,100,'Scoreboard','Expected ↔ observed',C.purple,'#fff')+arrow(645,99,797,99,C.blue)+wire('M237 78H360V49H917V66',C.purple)+arrow(917,51,917,66,C.purple);
    s+=labeledBox(32,347,187,85,'Host interface','MMIO control',C.blue,'#eff6ff')+arrow(135,218,135,347,C.blue)+labeledBox(312,325,460,66,'AXI interconnect','Arbitration / routing',C.orange,'#fff8ed')+arrow(219,382,312,357,C.blue)+labeledBox(372,425,218,58,'DMA controller','',C.purple,'#f7f3ff')+wire('M480 425V391',C.purple)+arrow(480,408,480,391,C.purple)+labeledBox(827,326,219,91,'SRAM','Input / output buffers',C.green,'#effbf6')+arrow(772,357,827,357,C.green)+arrow(827,386,772,386,C.green);
    s+=wire('M543 325V136',C.blue,1.4,'stroke-dasharray="5 4"')+arrow(543,159,543,136,C.blue)+wire('M936 326V203H613V136',C.green,1.4,'stroke-dasharray="5 4"')+arrow(613,161,613,136,C.green)+tx(714,223,'관측 transaction / memory result','text-anchor="middle" class="small"');
    return svg(1110,523,'Host bus driver가 DUT를 구동하고 monitor가 관측을 scoreboard로 전달하는 검증 환경',s);
}
export function verificationTransfer(v) {
    const config={length:v.length,beat:4,stall:v.stall,timeout:100,errorAt:-1,source:0x20000000,destination:0x20001000},transfer=dmaTrace(config);
    const expected=Array.from({length:v.length},(_,i)=>(v.pattern+i)&255),actual=expected.map((value,i)=>i<transfer.sent?value:0);
    const injected=v.corruptAt>=0&&v.corruptAt<v.length;if(injected)actual[v.corruptAt]^=1;
    const mismatch=expected.findIndex((value,i)=>value!==actual[i]);return{config,transfer,expected,actual,mismatch,injected,pass:transfer.status==='DONE'&&mismatch<0};
}
export const integrationFaults={
    decode:{title:'미할당 주소 접근',target:'0x3000_0000',response:'DECERR',status:'Decode error',evidence:'Request address가 어느 target에도 매핑되지 않음',check:'오류 응답이 initiator에 반환되고 memory가 바뀌지 않는지 확인'},
    rom:{title:'Boot ROM 쓰기',target:'0x0000_0000',response:'SLVERR',status:'Read-only write',evidence:'Target은 존재하지만 write를 허용하지 않음',check:'ROM 내용 보존 및 이 예제의 SLVERR 응답 확인'},
    irq:{title:'완료 IRQ mask',target:'DMA STATUS.DONE = 1',response:'IRQ = 0',status:'Completion polling required',evidence:'DMA는 완료됐지만 IRQ 전달이 막혀 있음',check:'DONE·pending·mask를 각각 읽고 누락 원인을 구분'},
    reset:{title:'전송 중 reset',target:'DMA / FIFO',response:'ABORT',status:'부분 전송으로 중단',evidence:'완료되지 않은 destination buffer가 남을 수 있음',check:'Outstanding 응답 처리·부분 데이터·새 descriptor의 초기 상태 확인'}
};
export function integrationFaultFigure(kind) {
    const d=integrationFaults[kind];let s=labeledBox(12,62,190,130,'CPU / test',kind==='irq'?'IRQ 대기':'요청 / 상태 확인',C.blue,'#f2f7ff')+labeledBox(346,62,226,130,kind==='decode'?'Address decoder':'DMA / target',d.status,C.orange,'#fff8ed')+labeledBox(745,62,303,130,d.title,d.target,C.red,'#fff3f6')+arrow(202,113,346,113,C.blue)+arrow(572,113,745,113,C.red)+wire('M853 192V250H106V192',C.red,1.8,'stroke-dasharray="5 4"')+arrow(106,218,106,192,C.red)+tx(480,278,`관측 결과: ${d.response}`,'text-anchor="middle" class="label"');return svg(1070,305,'주입한 통합 실패의 요청 경로와 관측해야 할 오류 또는 상태 응답',s);
}
export function initSocVerification(root) {
    root.querySelector('[data-soc-verification-environment]').innerHTML=verificationEnvironment();
    bindFields(root,'[data-soc-verification-inputs]',v=>{const d=verificationTransfer(v);
        root.querySelector('[data-soc-verification-trace]').innerHTML=table(['Cycle','Source 주소','사건','수락 B','누적 B','잔여 B','IRQ'],dmaLedger(d.transfer,d.config));
        const byte=n=>'0x'+n.toString(16).toUpperCase().padStart(2,'0');
        root.querySelector('[data-soc-memory-compare]').innerHTML=table(['Destination','Expected','Actual','비교'],d.expected.map((n,i)=>[hex32(d.config.destination+i),byte(n),byte(d.actual[i]),n===d.actual[i]?'PASS':'FAIL']));
        root.querySelector('[data-soc-verification-status]').innerHTML=`<small>DMA ${d.transfer.status} · ${d.transfer.sent} byte 수락 · ${d.injected?`byte ${v.corruptAt} 손상 주입`:v.corruptAt>=v.length?'Index 범위 밖 · 손상 미주입':'손상 없음'}</small>${d.pass?'Scoreboard PASS':`Scoreboard FAIL · 첫 차이 byte ${d.mismatch}`}`;
    });
    const select=root.querySelector('[name="integrationFault"]'),update=()=>{const d=integrationFaults[select.value];root.querySelector('[data-soc-integration-fault]').innerHTML=integrationFaultFigure(select.value);root.querySelector('[data-soc-integration-evidence]').innerHTML=table(['근거','확인'],[['관측',d.evidence],['검증',d.check]]);};select.addEventListener('input',update);update();
}

export const productExamples={
    sensor:{name:'Sensor hub',blocks:['MCU','Memory','Peripherals','PMU'],area:[35,20,25,20],power:[40,20,25,15],requirement:'낮은 평균 전력과 wake latency',evidence:'Sleep 전류·wake pin → 첫 유효 sample 지연',failure:'Wake 누락·sensor FIFO overflow·reset 직후 stale sample'},
    vision:{name:'Vision SoC',blocks:['ISP / NPU','Buffer','DMA / IO','CPU'],area:[45,30,15,10],power:[50,25,15,10],requirement:'연속 frame 입력과 출력 deadline',evidence:'Frame drop·최대 queue 점유·end-to-end latency',failure:'Buffer overwrite·잘못된 pixel format·deadline miss'},
    storage:{name:'Storage controller',blocks:['Queue / DMA','ECC','NAND ctrl','SRAM'],area:[25,30,25,20],power:[30,30,25,15],requirement:'Tail latency와 전원 장애 복구',evidence:'Queue depth·p99 latency·복구 후 데이터 일관성',failure:'Power-loss 중단·uncorrectable error·mapping 손상'},
    edge:{name:'Edge AI module',blocks:['NPU','Memory / DMA','CPU','IO / PMU'],area:[55,25,10,10],power:[60,25,8,7],requirement:'모델 용량·연산과 memory 이동의 균형',evidence:'Sustained throughput·memory stall·junction 온도',failure:'SRAM 초과·thermal throttle·결과 정밀도 실패'}
};
function chipFrame(x,y,w,h,color=C.line) {
    let s=rect(x,y,w,h,'#f1f5fa',color,5)+rect(x+5,y+5,w-10,h-10,'#fff',color,3);
    for(let px=x+13;px<x+w-8;px+=13)s+=rect(px,y-5,6,5,'#b1bdcb','none',0)+rect(px,y+h,6,5,'#b1bdcb','none',0);
    for(let py=y+13;py<y+h-8;py+=13)s+=rect(x-5,py,5,6,'#b1bdcb','none',0)+rect(x+w,py,5,6,'#b1bdcb','none',0);return s;
}
export function productFigure(kind='sensor') {
    let s='';
    if(kind==='sensor'){
        s+=chipFrame(111,87,177,187,C.blue)+labeledBox(123,101,153,108,'MCU','Always-on',C.blue,'#eaf4ff')+labeledBox(123,220,71,42,'SRAM','',C.green,'#effbf6')+labeledBox(200,220,76,42,'PMU','',C.purple,'#f8f4ff');
        ['Accel','Gyro','Temp'].forEach((label,i)=>{const y=87+i*66;s+=labeledBox(4,y,74,47,label,'',C.blue,'#fff')+wire(`M78 ${y+23}H94V155H111`,C.blue,1.3);});
        s+=labeledBox(109,316,179,59,'Peripherals','I²C / SPI / UART',C.ink,'#f7f9fc')+arrow(196,274,196,316,C.blue);
    }else{
        const top=kind==='vision'?['Image sensor','CSI-2']:kind==='storage'?['Host','PCIe / SATA']:['External memory','LPDDR'];
        s+=labeledBox(53,10,209,61,top[0],top[1],C.ink,'#f8fafc')+arrow(155,71,155,109,C.blue)+chipFrame(21,109,272,191,C.blue);
        if(kind==='edge')s+=labeledBox(34,123,246,91,'AI accelerator','NPU',C.blue,'#eaf4ff')+labeledBox(34,226,117,59,'DMA','',C.purple,'#f8f3ff')+labeledBox(163,226,117,59,'CPU','Control',C.green,'#effaf6');
        else{
            const names=kind==='vision'?['ISP','NPU','DMA','Buffer']:['Queue','DMA','ECC','NAND ctrl'];
            names.forEach((name,i)=>s+=labeledBox(34+(i%2)*129,123+Math.floor(i/2)*82,117,70,name,'',[C.blue,C.purple,C.red,C.green][i],['#eaf4ff','#f8f4ff','#fff2f6','#effaf6'][i]));
        }
        s+=arrow(155,300,155,334,C.blue)+labeledBox(53,334,209,59,kind==='vision'?'Display / Codec':kind==='storage'?'NAND flash':'Sensor / IO',kind==='storage'?'Multiple channels':'',C.ink,'#f8fafc');
    }
    return svg(315,415,`${productExamples[kind].name}의 고유한 IP 구성과 외부 연결`,s);
}
export function visionDetailFigure() {
    let s=rect(8,35,159,262,'#f3f8fd',C.line)+tx(87,63,'Camera sensor','text-anchor="middle" class="label"');
    ['Pixel array','ADC','CSI-2 TX'].forEach((label,i)=>s+=labeledBox(24,87+i*58,126,42,label,'',C.line,'#fff'));
    s+=rect(261,14,829,302,'#f8fbff','#8abcf9')+tx(676,43,'Vision SoC · 데이터와 제어 경계','text-anchor="middle" class="label"');
    const names=[['Capture','CSI-2 RX'],['ISP','Pixel format'],['Frame buffer','SRAM / DRAM'],['NPU','Compute'],['Postprocess','Scale / activate'],['Display','Video out']],colors=[C.blue,C.blue,C.green,C.purple,C.red,C.ink];
    names.forEach(([name,sub],i)=>{const x=279+i*135;s+=labeledBox(x,83,117,121,name,sub,colors[i],colors[i]+'0b');if(i<5)s+=arrow(x+117,140,x+135,140,C.blue);s+=wire(`M${x+58} 204V253`,'#91a9c4',1.2,'stroke-dasharray="4 4"');});
    s+=arrow(167,156,279,156,C.blue)+tx(222,119,'CSI-2','text-anchor="middle" class="small"')+tx(222,140,'RAW10','text-anchor="middle" class="small"')+labeledBox(279,253,375,43,'Control processor / register interface','',C.blue,'#fff')+labeledBox(683,253,389,43,'DMA / bus fabric / ownership','',C.purple,'#fff');
    return svg(1115,340,'Camera sensor capture ISP frame buffer NPU postprocess display의 vision SoC 경계',s);
}
export function productBudgetsFigure(kind='sensor') {
    const d=productExamples[kind],colors=[C.blue,C.green,C.red,C.purple];let s='';
    [['면적 예산 · 가상 상대 비율',d.area],['전력 예산 · 가상 상대 비율',d.power]].forEach(([title,values],r)=>{const y=25+r*157;s+=tx(10,y,title,'class="label"');let x=10;values.forEach((value,i)=>{const w=value*5.3;s+=rect(x,y+18,w,36,colors[i]+'70','#fff',0);if(w>45)s+=tx(x+w/2,y+42,`${value}%`,'text-anchor="middle" class="small"');x+=w;});d.blocks.forEach((name,i)=>{const lx=10+(i%2)*275,ly=y+82+Math.floor(i/2)*26;s+=node(lx+5,ly-5,colors[i],4)+tx(lx+18,ly,`${name} ${values[i]}%`,'class="small"');});});
    return svg(570,321,'선택한 가상 제품의 합계 100퍼센트 면적 및 전력 상대 예산',s);
}
export function initSocProducts(root) {
    root.querySelectorAll('[data-product-mini]').forEach(host=>host.innerHTML=productFigure(host.dataset.productMini));root.querySelector('[data-soc-vision-detail]').innerHTML=visionDetailFigure();
    const budgets={sensor:{base:.064,capacity:1,work:'64 B × 1,000 events/s',constraint:'Wake 100 μs · 평균 전력 목표 10 mW'},vision:{base:248.832,capacity:300,work:'1920 × 1080 × 60 fps × 2 B',constraint:'Frame deadline 16.67 ms · 2 buffers'},storage:{base:409.6,capacity:800,work:'4 KiB × 100,000 IO/s',constraint:'Queue depth 32 · tail latency와 복구 검증'},edge:{base:4.51584,capacity:20,work:'224 × 224 × 3 B × 30 fps',constraint:'Frame deadline 33.3 ms · weights 5 MiB'}};
    bindFields(root,'[data-soc-product-inputs]',v=>{const d=productExamples[v.product],b=budgets[v.product],required=b.base*v.load;root.querySelector('[data-soc-selected-product]').innerHTML=productFigure(v.product);root.querySelector('[data-soc-product-budgets]').innerHTML=productBudgetsFigure(v.product);root.querySelector('[data-soc-product-review]').innerHTML=table(['설계 검토','근거'],[['지배 요구',d.requirement],['기준 workload',b.work],['추가 제약',b.constraint],['필요 전송률',`${fmt(required)} MB/s · ${v.load}× 부하`],['가정한 지속 용량',`${b.capacity} MB/s`],['대역폭 예산',required>b.capacity?'목표 예산 초과':'목표 예산 범위'],['관측',d.evidence],['실패 검사',d.failure]]);});
}
