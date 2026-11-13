import {roofline,power,systolic} from '../../curriculum/source/models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox} from './figures.mjs';
import {bindModel,put,matrixTable,peUnit,horizontalBars} from './ai-common.mjs';
import {arrayPresets} from './ai-numerics.mjs';

export function acceleratorPerformance(v) {
    const r=roofline({operations:v.operationsG*1e9,bytes:v.trafficMB*1e6,peak:v.peak,bandwidthGB:v.bandwidth});
    const durations=[v.fill,v.trafficMB*.8/v.bandwidth,v.operationsG/v.peak*1000,v.trafficMB*.2/v.bandwidth,v.drain],serial=durations.reduce((a,b)=>a+b,0);
    return{...r,durations,serial,modeledPerformance:v.operationsG*1000/serial};
}
export function acceleratorRoofline(v,d) {
    const xMin=-1,xMax=Math.max(2,Math.ceil(Math.log10(Math.max(d.intensity,d.ridge)))+1),yMin=Math.floor(Math.log10(Math.min(v.bandwidth*.1,v.peak)))-1,yMax=Math.ceil(Math.log10(v.peak))+1,left=76,right=701,top=32,bottom=356,sx=x=>left+(Math.log10(x)-xMin)/(xMax-xMin)*(right-left),sy=y=>bottom-(Math.log10(Math.max(10**yMin,y))-yMin)/(yMax-yMin)*(bottom-top);let s='';
    for(let x=xMin;x<=xMax;x++)s+=wire(`M${sx(10**x)} ${top}V${bottom}`,'#e0e8f2',1)+tx(sx(10**x),bottom+24,fmt(10**x),'text-anchor="middle" class="small"');
    for(let y=yMin;y<=yMax;y++)s+=wire(`M${left} ${sy(10**y)}H${right}`,'#e0e8f2',1)+tx(left-10,sy(10**y)+5,fmt(10**y),'text-anchor="end" class="small"');
    const points=Array.from({length:151},(_,i)=>10**(xMin+(xMax-xMin)*i/150));
    s+=wire(points.map((x,i)=>`${i?'L':'M'}${sx(x)} ${sy(Math.min(v.peak,x*v.bandwidth))}`).join(''),C.blue,2.8)+wire(`M${left} ${sy(v.peak)}H${right}`,C.green,1.8,'stroke-dasharray="6 4"');
    const px=sx(d.intensity),py=sy(d.performance);s+=wire(`M${px} ${py}V${bottom}`,C.red,1,'stroke-dasharray="4 4"')+node(px,py,C.red,5)+tx(left+6,sy(v.peak)-10,`Compute ceiling ${fmt(v.peak)} GOp/s`,'class="small green"')+tx(left+7,top+15,`Workload I=${fmt(d.intensity)} · P≤${fmt(d.performance)}`,'class="small"');
    s+=tx(390,420,'Arithmetic intensity (Op / byte) · log scale','text-anchor="middle" class="small"')+tx(left,18,'Performance (GOp/s) · log scale','class="small"');return svg(732,443,'같은 Op byte 정의에 따라 계산한 memory ceiling compute ceiling과 workload roofline 상한',s);
}
export function workloadTiming(d) {
    const names=['Fill / 제어','Input load','Compute','Output store','Drain / 완료'],colors=['#8d9fb6',C.blue,C.green,C.purple,'#8d9fb6'];let s='',at=0,left=10,width=1060;
    d.durations.forEach((duration,i)=>{const x=left+at/d.serial*width,w=duration/d.serial*width;s+=rect(x,39,w,64,colors[i]+'35',colors[i],3);if(w>70)s+=tx(x+w/2,68,names[i],'text-anchor="middle" class="small label"')+tx(x+w/2,91,`${fmt(duration)} ms`,'text-anchor="middle" class="small"');at+=duration;});
    s+=arrow(left,132,left+width,132,C.ink)+tx(left,157,'0 ms','class="small"')+tx(left+width,157,`${fmt(d.serial)} ms`,'text-anchor="end" class="small"');
    return svg(1090,178,'80퍼센트 input 20퍼센트 output traffic과 compute 및 fill drain을 직렬 실행한 모델 일정',s);
}
export function powerBreakdown(v) {
    const d=power(v),fractions=[.45,.35,.12,.08],leakage=[.4,.3,.2,.1],names=['Compute array','On-chip SRAM','NoC','Control'];
    return{...d,parts:names.map((name,i)=>({name,dynamic:d.dynamicMW*fractions[i],leakage:d.leakageMW*leakage[i],value:d.dynamicMW*fractions[i]+d.leakageMW*leakage[i],cap:v.capacitancePF*fractions[i]}))};
}
export function powerDonut(d) {
    const cx=160,cy=153,r=99,colors=[C.blue,C.green,C.orange,C.purple],total=d.totalMW;let s=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e8eff7" stroke-width="43"/>`,at=-Math.PI/2;
    d.parts.forEach((p,i)=>{const angle=total?p.value/total*2*Math.PI:0,end=at+angle,x1=cx+r*Math.cos(at),y1=cy+r*Math.sin(at),x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);if(angle>0&&angle<2*Math.PI)s+=wire(`M${x1} ${y1}A${r} ${r} 0 ${angle>Math.PI?1:0} 1 ${x2} ${y2}`,colors[i],43,'stroke-linecap="butt"');s+=node(315,71+i*63,colors[i],6)+tx(331,75+i*63,p.name,'class="label"')+tx(331,99+i*63,`${fmt(p.value)} mW · ${fmt(total?p.value/total*100:0)}%`,'class="small"');at=end;});
    s+=tx(cx,142,'Model total','text-anchor="middle" class="small"')+tx(cx,173,`${fmt(total)} mW`,'text-anchor="middle" class="label"');return svg(580,304,'명시한 capacitance와 leakage 분배 가정에서 계산한 블록별 전력 비중',s);
}
export function initAiPerformance(root) {
    bindModel(root,'ai-performance',v=>{const d=acceleratorPerformance(v);put(root,'ai-roofline',acceleratorRoofline(v,d));put(root,'ai-workload-timing',workloadTiming(d));put(root,'ai-roofline-result',table(['항목','결과'],[['연산',`${fmt(v.operationsG)} GOp · 1 MAC = 2 Op`],['선택 memory 경계의 traffic',`${fmt(v.trafficMB)} MB`],['Arithmetic intensity',`${fmt(d.intensity)} Op/B`],['Memory ceiling',`${fmt(d.intensity*v.bandwidth)} GOp/s`],['Compute ceiling',`${fmt(v.peak)} GOp/s`],['상한',`${fmt(d.performance)} GOp/s · ${d.bound}`],['최소 시간 하한',`${fmt(d.milliseconds)} ms`],['직렬 모델 시간',`${fmt(d.serial)} ms`],['직렬 모델 처리율',`${fmt(d.modeledPerformance)} GOp/s`]]));});
    bindModel(root,'ai-power',v=>{const d=powerBreakdown(v);put(root,'ai-power-donut',powerDonut(d));put(root,'ai-power-parts',table(['Block','C 가정 (pF)','Dynamic mW','Leakage mW','합계 mW'],d.parts.map(p=>[p.name,p.cap,p.dynamic,p.leakage,p.value])));put(root,'ai-power-total',`<small>Pdynamic = αCV²f · Pleak = VIleak</small>${fmt(d.dynamicMW)} + ${fmt(d.leakageMW)} = ${fmt(d.totalMW)} mW`);});
}

export const verificationMatrices={A:[[1,-2,3,0],[2,1,-1,2],[-2,5,1,3],[0,-1,2,4]],B:[[1,3,-1,2],[2,-1,0,1],[-1,4,2,-2],[3,4,-1,1]]};
export function acceleratorVerification({fault='on',row=2,col=1,k=2,delta=-1,comparison='exact',tolerance=0}={}) {
    const {A,B}=verificationMatrices,reference=systolic(A,B).sums,actual=reference.map(r=>[...r]);if(fault==='on')actual[row][col]+=delta;
    const difference=reference.map((r,i)=>r.map((n,j)=>actual[i][j]-n)),different=[],failed=[];
    difference.forEach((r,i)=>r.forEach((n,j)=>{if(n!==0)different.push({i,j,difference:n});if(Math.abs(n)>(comparison==='exact'?0:tolerance))failed.push({i,j,difference:n});}));
    let ref=0,dut=0;const trace=A[row].map((a,index)=>{const b=B[index][col],product=a*b;ref+=product;dut+=product+(fault==='on'&&index===k?delta:0);return{index,a,b,product,reference:ref,actual:dut,cycle:row+col+index};});
    return{A,B,reference,actual,difference,first:different[0]??null,firstFail:failed[0]??null,failed,different,trace,pass:failed.length===0,row,col,k};
}
export function divergenceMap(d) {
    const r0=Math.floor(d.row/2)*2,c0=Math.floor(d.col/2)*2;let s=tx(12,24,'선택한 2×2 tile의 PE 배치','class="label blue"');
    for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x=87+c*136,y=70+r*130,selected=r0+r===d.row&&c0+c===d.col;s+=labeledBox(x,y,82,82,`PE ${r0+r},${c0+c}`,`${d.actual[r0+r][c0+c]}`,selected?C.red:C.blue,selected?'#fff1f5':'#f4f8ff');if(c===0)s+=arrow(x+82,y+41,x+136,y+41,C.blue);if(r===0)s+=arrow(x+41,y+82,x+41,y+130,C.purple);}
    for(let r=0;r<2;r++)s+=tx(5,117+r*130,`A row ${r0+r}`,'class="small blue"')+arrow(58,111+r*130,87,111+r*130,C.blue);
    for(let c=0;c<2;c++)s+=tx(128+c*136,51,`B col ${c0+c}`,'text-anchor="middle" class="small purple"')+arrow(128+c*136,55,128+c*136,70,C.purple);
    s+=tx(191,327,`Tensor C[${d.row},${d.col}] → tile rows ${r0}–${r0+1}, cols ${c0}–${c0+1}`,'text-anchor="middle" class="small"');return svg(390,353,'첫 불일치 tensor 좌표를 2x2 tile과 선택 PE에 연결한 mapping',s);
}
export function initAiVerification(root) {
    bindModel(root,'ai-verification',v=>{const d=acceleratorVerification(v),mark=(i,j)=>d.difference[i][j]!==0?'is-error':'';
        put(root,'ai-verify-reference',matrixTable(d.reference,{name:'C reference'}));put(root,'ai-verify-actual',matrixTable(d.actual,{name:'C DUT',mark}));put(root,'ai-verify-difference',matrixTable(d.difference,{name:'DUT − REF',mark}));
        put(root,'ai-verify-status',`<small>${v.comparison==='exact'?'Bit-exact':'Absolute tolerance '+v.tolerance} · ${d.different.length}개 원소 차이</small>${d.pass?'비교 PASS':'비교 FAIL'}${d.first?` · 첫 차이 C[${d.first.i},${d.first.j}]`:' · 모든 출력 일치'}`);
        const first=d.first;put(root,'ai-verify-first',table(['첫 차이 정보','값'],[['Tensor index',first?`C[${first.i},${first.j}]`:'없음'],['Reference',first?d.reference[first.i][first.j]:'—'],['Actual',first?d.actual[first.i][first.j]:'—'],['Difference',first?.difference??0],['허용 범위 밖 원소',d.failed.length],['Fault 주입 위치',v.fault==='on'?`PE(${v.row},${v.col}), k=${v.k}, logical cycle ${v.row+v.col+v.k}`:'주입 없음']]));
        put(root,'ai-verify-trace',table(['k','Logical cycle','A[i,k]','B[k,j]','Product','ACC ref','ACC DUT'],d.trace.map(t=>[t.index,t.cycle,t.a,t.b,t.product,t.reference,t.actual])));
        put(root,'ai-verify-inputA',matrixTable(d.A,{name:'A'}));put(root,'ai-verify-inputB',matrixTable(d.B,{name:'B',tone:'purple'}));put(root,'ai-verify-map',divergenceMap(d));
        const t=d.trace[v.k];put(root,'ai-verify-pe',peUnit({a:`A=${t.a}`,b:`B=${t.b}`,sum:t.actual,label:`PE(${v.row},${v.col}) · k=${v.k}`}));
    });
}

export function miniNpuArchitecture() {
    let s=rect(51,44,988,431,'#f6f9fd','#899fb9',5);
    s+=labeledBox(87,72,916,52,'Host register interface · APB / AXI-Lite','',C.blue,'#e9f4ff')+labeledBox(312,161,427,54,'Controller / Scheduler','',C.purple,'#f4effb')+labeledBox(87,271,135,136,'DMA','Load / store',C.green,'#effaf4');
    s+=rect(285,251,336,184,'#effaf4',C.green)+tx(453,276,'Scratchpad SRAM','text-anchor="middle" class="label"')+labeledBox(304,296,142,114,'A / input','Bank A',C.blue,'#eef7ff')+labeledBox(459,296,142,114,'B / output','Bank B',C.purple,'#f6f1fc');
    s+=rect(660,251,223,184,'#fff8ee',C.orange)+tx(771,276,'PE array · INT8 MAC','text-anchor="middle" class="label"');for(let r=0;r<3;r++)for(let c=0;c<4;c++)s+=labeledBox(677+c*49,293+r*42,39,32,'PE','',C.blue,'#f2f8ff');
    s+=labeledBox(925,272,84,134,'Output','Writeback',C.blue,'#eef7ff');
    s+=wire('M545 124V161',C.blue)+arrow(545,143,545,161,C.blue)+wire('M154 124V271M968 124V272',C.blue,1.2)+wire('M453 215V251M771 251V188H739',C.purple,1.6)+arrow(453,233,453,251,C.purple)+arrow(771,231,771,251,C.purple)+arrow(222,339,285,339,C.green)+arrow(285,369,222,369,C.green)+arrow(621,322,660,322,C.blue)+arrow(621,360,660,360,C.purple)+arrow(883,339,925,339,C.blue);
    s+=arrow(10,330,87,330,C.blue)+arrow(87,363,10,363,C.blue)+tx(12,307,'Memory','class="small"')+arrow(1009,339,1080,339,C.blue)+tx(1027,317,'Memory','class="small"')+arrow(434,5,434,72,C.blue)+arrow(670,72,670,5,C.blue)+tx(429,21,'Host','text-anchor="end" class="small"')+tx(681,21,'IRQ','class="small"');
    s+=tx(545,509,'확장 목표 · Memory-mapped NPU subsystem','text-anchor="middle" class="label"');return svg(1100,532,'NPU 확장 목표의 host register controller DMA scratchpad PE output writeback 연결',s);
}
export function coreRun({preset='small',stall=0}={}) {
    const {A,B}=arrayPresets[preset],d=systolic(A,B),rows=[{clock:0,phase:'Start 수락 · 입력 latch',logical:'—',busy:1,done:0}],output=d.sums;
    let physical=1;
    for(let t=0;t<d.cycles;t++){
        if(t===1)for(let i=0;i<stall;i++)rows.push({clock:physical++,phase:'iStepEn=0 · RUN state 유지',logical:t,busy:1,done:0});
        rows.push({clock:physical++,phase:`${d.trace[t].active.length}개 유효 MAC`,logical:t,busy:t===d.cycles-1?0:1,done:Number(t===d.cycles-1)});
    }
    rows.push({clock:physical,phase:'Idle · oDone pulse 종료',logical:'—',busy:0,done:0});return{A,B,output,rows,cycles:d.cycles,doneClock:physical-1};
}
export function coreTiming(d) {
    const cols=d.rows.length,left=124,width=Math.max(1100,left+cols*45),cell=(width-left-18)/cols,top=46,rows=['iStart','iStepEn','oBusy','oDone'];let s='';
    rows.forEach((name,r)=>{const y=top+r*58;s+=tx(5,y+22,name,'class="label"');let path='';d.rows.forEach((entry,i)=>{const bit=r===0?Number(i===0):r===1?Number(!entry.phase.includes('iStepEn=0')):r===2?entry.busy:entry.done,x=left+i*cell,level=y+(bit?0:25);path+=i?`H${x}V${level}H${x+cell}`:`M${x} ${level}H${x+cell}`;});s+=wire(path,r===3?C.green:C.blue,1.8);});
    d.rows.forEach((row,i)=>{s+=tx(left+(i+.5)*cell,top-18,row.clock,'text-anchor="middle" class="small"')+wire(`M${left+i*cell} ${top-7}V${top+206}`,'#dbe5f2',.7,'stroke-dasharray="3 4"');});
    s+=tx((left+cols*cell)/2,top+257,'상승 edge 수락 후의 상태 · Start edge와 첫 MAC edge를 구분','text-anchor="middle" class="small"');return svg(left+cols*cell+12,top+280,'SystolicCore의 start 수락 step enable busy one-cycle done pulse를 source 계약에 맞춘 timing',s);
}
export function initAiProject(root) {
    put(root,'ai-mini-architecture',miniNpuArchitecture());
    bindModel(root,'ai-project',v=>{const d=coreRun(v);put(root,'ai-project-A',matrixTable(d.A,{name:'A'}));put(root,'ai-project-B',matrixTable(d.B,{name:'B',tone:'purple'}));put(root,'ai-project-C',matrixTable(d.output,{name:'C',tone:'green'}));put(root,'ai-project-timing',coreTiming(d));put(root,'ai-project-ledger',table(['Clock edge','사건','Logical cycle','Busy','Done'],d.rows.map(r=>[r.clock,r.phase,r.logical,r.busy,r.done])));put(root,'ai-project-status',`<small>Source contract에 따른 functional schedule · RTL simulator 실행 결과가 아님</small>${d.cycles} 유효 cycle · Done edge ${d.doneClock}`);});
}
