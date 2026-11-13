import {tileBudget} from '../../curriculum/source/models.mjs';
import {dataflow,bankAccess,overlap} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox} from './figures.mjs';
import {bindModel,put,numberGrid,matrixTable,horizontalBars} from './ai-common.mjs';

export function dataflowNetwork(mode='OS') {
    const left=58,top=61,step=67,box=44,n=4,stationary=mode==='OS'?'C':mode==='WS'?'W':'A',color=mode==='OS'?C.green:mode==='WS'?C.purple:C.blue;let s='';
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
        const x=left+c*step,y=top+r*step;
        s+=rect(x,y,box,box,'#fff','#b4c9e1',5)+tx(x+box/2,y+16,'PE','text-anchor="middle" class="small"')+rect(x+6,y+22,box-12,17,color+'22',color,3)+tx(x+box/2,y+35,`${stationary}${r}${c}`,'text-anchor="middle" class="small"');
        if(c<n-1)s+=arrow(x+box,y+22,x+step,y+22,mode==='IS'?C.green:C.blue,1.6);
        if(r<n-1)s+=arrow(x+box/2,y+box,x+box/2,y+step,mode==='WS'?C.green:C.purple,1.6);
    }
    for(let r=0;r<n;r++){
        const y=top+r*step+22;
        if(mode!=='IS')s+=tx(5,y+5,`A${r},k`,'class="small blue"')+arrow(38,y,left,y,C.blue);
        if(mode==='IS')s+=arrow(left+3*step+box,y,329,y,C.green)+tx(338,y+5,`C${r}`,'class="small green"');
    }
    for(let c=0;c<n;c++){
        const x=left+c*step+22;
        if(mode!=='WS')s+=tx(x,22,`B${c}`,'text-anchor="middle" class="small purple"')+arrow(x,31,x,top,C.purple);
        if(mode==='WS')s+=arrow(x,top+3*step+box,x,328,C.green)+tx(x,349,`C${c}`,'text-anchor="middle" class="small green"');
    }
    const labels=mode==='OS'?['A → · B ↓','C[i,j]를 PE 내부에 유지']:mode==='WS'?['A → · Partial sum ↓','W[k,j]를 PE 내부에 유지']:['B ↓ · Partial sum →','A[i,k]를 PE 내부에 유지'];
    s+=tx(183,382,labels[0],'text-anchor="middle" class="small"')+tx(183,408,labels[1],'text-anchor="middle" class="label"');return svg(379,430,`${mode}에서 stationary 값을 PE 내부에 보관하고 나머지 값을 이동시키는 대표 mapping`,s);
}
export function rowStationaryFigure() {
    let s=tx(12,24,'Input 5×5 · 선택 window 3×3','class="label blue"');
    const values=Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>r*5+c+1));s+=numberGrid(12,50,5,5,{cell:34,values,selected:(r,c)=>r<3&&c<3,highlight:C.orange});
    s+=tx(250,24,'Filter row를 local PE에 유지','class="label purple"');
    [0,1,2].forEach(r=>{const y=50+r*74,sample=values[r].slice(0,3);s+=labeledBox(252,y,204,57,`PE row ${r}`,`[${sample.join(', ')}] · [1, 0, −1]`,C.purple,'#f8f5ff')+arrow(456,y+28,528,y+28,C.green)+tx(557,y+34,'−2','text-anchor="middle" class="label green"');});
    s+=wire('M585 78H600V295H454M585 152H600M585 226H600',C.green)+labeledBox(252,267,202,56,'Σ row contributions','−2 − 2 − 2 = −6',C.green,'#effaf5')+arrow(474,295,454,295,C.green)+arrow(184,101,252,79,C.blue)+arrow(184,135,252,153,C.blue)+arrow(184,169,252,227,C.blue);
    s+=tx(299,364,'단일 output의 row contribution 예 · 채널과 window 이동은 생략','text-anchor="middle" class="small"');return svg(625,389,'3x3 convolution의 filter row와 input row를 PE에 배치한 row stationary 예',s);
}
export function initAiDataflow(root) {
    ['OS','WS','IS'].forEach(mode=>put(root,`ai-dataflow-${mode.toLowerCase()}`,dataflowNetwork(mode)));
    bindModel(root,'ai-dataflow',v=>{
        if(v.mode==='RS'){put(root,'ai-dataflow-selected',rowStationaryFigure());put(root,'ai-dataflow-selected-note','<small>고정된 3×3 convolution window</small>Row-stationary 예 · 9 MAC');put(root,'ai-dataflow-result',table(['항목','Row-stationary 예'],[['Input window','[[1,2,3],[6,7,8],[11,12,13]]'],['Filter','각 row [1,0,−1]'],['Row dot products','−2, −2, −2'],['Output','−6'],['범위','한 output의 row contribution · 전체 energy model 아님']]));return;}
        put(root,'ai-dataflow-selected',dataflowNetwork(v.mode));
        const all=['OS','WS','IS'].map(mode=>({mode,...dataflow({...v,mode})}));
        put(root,'ai-dataflow-result',table(['방식','A 접근','B 접근','C 접근','합계 byte'],all.map(d=>[d.mode,d.traffic.A,d.traffic.B,d.traffic.C,d.traffic.A+d.traffic.B+4*d.traffic.C])));
        put(root,'ai-dataflow-selected-note',`<small>동일 GEMM · ${v.m} × ${v.n} × ${v.k}</small>${fmt(v.m*v.n*v.k)} MAC · 선택한 방식 ${v.mode}`);
    });
}

export function tileMatrixFigure(v) {
    const axes=[['A','M','K',v.m,v.k,v.tm,v.tk,C.blue],['B','K','N',v.k,v.n,v.tk,v.tn,C.green],['C','M','N',v.m,v.n,v.tm,v.tn,C.purple]];let s='';
    axes.forEach(([name,row,col,nr,nc,tr,tc,color],i)=>{
        const x=30+i*179,y=60,size=135,gridR=Math.ceil(nr/tr),gridC=Math.ceil(nc/tc),tileH=size*tr/nr,tileW=size*tc/nc;
        s+=tx(x+size/2,24,`${name} (${row} × ${col})`,'text-anchor="middle" class="label"')+rect(x,y,size,size,color+'12',color,0);
        const displayR=Math.min(gridR,16),displayC=Math.min(gridC,16);for(let r=1;r<displayR;r++)s+=wire(`M${x} ${y+Math.min(size,r*tileH)}h${size}`,color,.7);for(let c=1;c<displayC;c++)s+=wire(`M${x+Math.min(size,c*tileW)} ${y}v${size}`,color,.7);
        const selH=Math.min(size,tileH),selW=Math.min(size,tileW);s+=rect(x,y,selW,selH,color+'68',color,0)+tx(x+size/2,y+size/2+5,`${tr} × ${tc}`,'text-anchor="middle" class="label"');
        s+=arrow(x-12,y+size,x-12,y,color,1)+tx(x-19,y+size/2,row,'text-anchor="end" class="small"')+arrow(x,y+size+17,x+size,y+size+17,color,1)+tx(x+size/2,y+size+40,col,'text-anchor="middle" class="small"');
        if(i<2)s+=tx(x+size+22,y+size/2+5,i?'=':'×','text-anchor="middle" class="label"');
    });
    s+=tx(285,288,`A tile ${v.tm}×${v.tk} · B tile ${v.tk}×${v.tn} · C tile ${v.tm}×${v.tn}`,'text-anchor="middle" class="small"');return svg(574,312,'GEMM의 A B C 행렬에서 각 tile의 M N K 축과 크기 대응',s);
}
export function tileBankMap({banks=4,rowStride=8,pattern='row'}) {
    const colors=[C.blue,C.green,C.orange,C.purple,C.red,'#238ca8','#6274d3','#7d9950'],n=8,cell=31,left=32,top=38;let s='';
    for(let c=0;c<n;c++)s+=tx(left+(c+.5)*cell,22,c,'text-anchor="middle" class="small"');
    for(let r=0;r<n;r++){s+=tx(14,top+(r+.5)*cell+5,r,'text-anchor="middle" class="small"');for(let c=0;c<n;c++){const bank=(r*rowStride+c)%banks,active=pattern==='row'?r===0:c===0;s+=rect(left+c*cell,top+r*cell,cell,cell,colors[bank]+'30',active?C.ink:'#d3dfec',0)+tx(left+(c+.5)*cell,top+(r+.5)*cell+5,bank,'text-anchor="middle" class="small"');}}
    colors.slice(0,banks).forEach((color,b)=>{const x=319+(b%2)*95,y=56+Math.floor(b/2)*41;s+=rect(x,y,14,17,color+'40',color,2)+tx(x+21,y+14,`Bank ${b}`,'class="small"');});
    s+=tx(259,316,`Bank = (row × ${rowStride} + column) mod ${banks}`,'text-anchor="middle" class="small"');return svg(530,340,'Row-major word address의 modulo bank mapping과 선택한 첫 row 또는 column 접근',s);
}
export function initAiTiling(root) {
    bindModel(root,'ai-tiling',v=>{const d=tileBudget(v),a=v.tm*v.tk*v.bytes,b=v.tk*v.tn*v.bytes,c=v.tm*v.tn*4,required=d.storage*Number(v.buffers);
        put(root,'ai-tile-matrices',tileMatrixFigure(v));put(root,'ai-tile-budget',table(['보관 항목','요소 수','Byte'],[['A tile',v.tm*v.tk,a],['B tile',v.tk*v.tn,b],['C / partial sum',v.tm*v.tn,c],['Single set',`${v.tm}×${v.tk} + ${v.tk}×${v.tn} + C`,d.storage],[`${v.buffers} complete set(s)`,'A/B/C 전체를 복제',required],['SRAM capacity','Alignment / metadata 제외',v.capacity]]));
        put(root,'ai-tile-status',`<small>필요 ${fmt(required)} byte · 용량 ${fmt(v.capacity)} byte</small>${required<=v.capacity?'PASS: SRAM 범위':'FAIL: SRAM 초과'}`);
        put(root,'ai-tile-tail',table(['축','전체 / tile','Tile 개수','마지막 유효 크기'],d.axes.map((a,i)=>[['M','N','K'][i],`${a.size} / ${a.tile}`,a.count,a.last]))+`<p class="tech-caption">총 ${fmt(d.tiles)} tile 호출 · ${fmt(d.macs)} MAC · ${d.tail?'Tail mask 필요':'모든 tile이 축 크기의 배수'}. K tile 사이에서는 C partial sum을 보존합니다.</p>`);
    });
    bindModel(root,'ai-tile-bank',v=>{const d=bankAccess({banks:Number(v.banks),stride:v.pattern==='row'?1:v.rowStride,requests:8});put(root,'ai-tile-bank-map',tileBankMap({...v,banks:Number(v.banks)}));put(root,'ai-tile-bank-result',table(['항목','결과'],[['접근','첫 '+(v.pattern==='row'?'row':'column')+'의 8 word'],['Bank별 요청',d.counts.join(', ')],['필요 cycle',d.cycles],['이상적인 하한',d.ideal],['가정','Bank당 1 word / cycle · 한 batch의 동시 요청']]));});
}

export const hierarchyExamples=[{name:'PE register',capacity:32*1024,bandwidth:8},{name:'Local SRAM',capacity:256*1024,bandwidth:32},{name:'Shared SRAM',capacity:4*2**20,bandwidth:128},{name:'Off-chip',capacity:8*2**30,bandwidth:512}];
export function bankMappingFigure(v) {
    const banks=Number(v.banks),d=bankAccess({banks,stride:v.stride,requests:v.requests}),left=58,cell=32,top=42,colors=[C.blue,C.green,C.orange,C.purple,C.red,'#238ca8','#6274d3','#7d9950'];let s=tx(4,28,'Word index → bank','class="label"');
    d.rows.forEach((r,i)=>{const address=v.start+r.address,bank=address%banks,x=left+i*cell;s+=rect(x,top,cell,31,'#fff','#c6d5e7',0)+tx(x+cell/2,top+21,address,'text-anchor="middle" class="small"')+arrow(x+cell/2,top+34,x+cell/2,top+68,'#6382a4',1)+rect(x,top+73,cell,31,colors[bank]+'35',colors[bank],2)+tx(x+cell/2,top+95,bank,'text-anchor="middle" class="small"');});
    s+=tx(4,top+95,'Bank','class="small"')+tx((left+v.requests*cell)/2,top+145,`Bank = word index mod ${banks}`,'text-anchor="middle" class="label blue"');return svg(Math.max(360,left+v.requests*cell+8),top+170,'연속 또는 strided word index가 SRAM bank에 배정되는 대응',s);
}
export function reuseFigure(reuse=4) {
    let s=labeledBox(8,71,116,123,'DRAM','외부 읽기',C.ink,'#f7f9fc')+labeledBox(238,50,157,167,'Local tile','한 번 적재',C.blue,'#eef7ff')+arrow(124,128,238,128,C.blue)+tx(181,108,'1× load','text-anchor="middle" class="small blue"');
    [0,1,2,3].forEach(i=>s+=arrow(395,66+i*45,486,66+i*45,C.green)+tx(499,71+i*45,`MAC use ${i+1}`,'class="small green"'));s+=tx(317,254,`Reuse ${reuse}× · 외부 byte당 수행 연산 증가`,'text-anchor="middle" class="label"');return svg(610,283,'같은 local tile을 여러 연산에 재사용하여 외부 memory 이동을 줄이는 구조',s);
}
export function initAiMemory(root) {
    put(root,'ai-memory-capacity',horizontalBars(hierarchyExamples.map((d,i)=>({label:d.name,value:d.capacity/1024,color:[C.blue,C.green,C.purple,C.ink][i]})),{unit:'KiB',log:true,width:590}));
    put(root,'ai-memory-bandwidth',horizontalBars(hierarchyExamples.map((d,i)=>({label:d.name,value:d.bandwidth,color:[C.blue,C.green,C.purple,C.ink][i]})),{unit:'GB/s',width:590}));put(root,'ai-memory-reuse',reuseFigure());
    bindModel(root,'ai-memory-rate',v=>{const perCycle=v.operands*Number(v.bytes),gb=perCycle*v.frequency/1000;put(root,'ai-memory-rate',`<small>한 operand 경로 · weight / partial sum은 별도</small>${v.operands} × ${v.bytes} B × ${v.frequency} MHz = ${fmt(gb)} GB/s`);});
    bindModel(root,'ai-memory-bank',v=>{const banks=Number(v.banks),rows=bankAccess({banks,stride:v.stride,requests:v.requests}).rows,counts=Array.from({length:banks},(_,b)=>rows.filter(r=>(v.start+r.address)%banks===b).length),cycles=Math.max(...counts);put(root,'ai-memory-bank',bankMappingFigure(v));put(root,'ai-memory-bank-result',table(['조건 / 결과','값'],[['Bank별 요청',counts.join(', ')],['필요 cycle',cycles],['균등 분산의 하한',Math.ceil(v.requests/banks)],['가정','Bank당 1 word / cycle, 같은 batch 동시 요청']]));});
}

export function doubleBufferSchedule({tiles=4,load=6,compute=10,store=4,resource='independent'}) {
    if(resource==='independent')return {...overlap({tiles,load,compute,store}),resource};
    // Greedy shared-DMA schedule: issue tiles in order, prefer a ready store,
    // otherwise load the next tile only when its complete buffer is free.
    const rows=Array.from({length:tiles},(_,tile)=>({tile,buffer:tile%2})),free=[0,0];let dmaAt=0,computeAt=0,nextLoad=0,nextStore=0;
    while(nextStore<tiles){
        const pending=rows[nextStore];
        if(pending.cEnd!==undefined&&pending.cEnd<=dmaAt){pending.sStart=dmaAt;pending.sEnd=dmaAt+store;dmaAt=pending.sEnd;free[pending.buffer]=dmaAt;nextStore++;continue;}
        const candidate=rows[nextLoad],canLoad=candidate&&nextLoad-nextStore<2;
        if(canLoad){const start=Math.max(dmaAt,free[candidate.buffer]);if(pending.cEnd!==undefined&&pending.cEnd<start){dmaAt=pending.cEnd;continue;}candidate.lStart=start;candidate.lEnd=start+load;dmaAt=candidate.lEnd;candidate.cStart=Math.max(computeAt,candidate.lEnd);candidate.cEnd=candidate.cStart+compute;computeAt=candidate.cEnd;nextLoad++;continue;}
        dmaAt=Math.max(dmaAt,pending.cEnd);
    }
    const end=rows.at(-1).sEnd;return{rows,serial:tiles*(load+compute+store),overlapped:end,speedup:tiles*(load+compute+store)/end,resource};
}
export function doubleBufferFigure(d) {
    const names=['Load · A','Load · B','Compute','Store · A','Store · B'],left=124,top=43,width=925,h=397,sx=t=>left+t/d.overlapped*width;let s='';
    for(let i=0;i<=8;i++){const t=d.overlapped*i/8,x=sx(t);s+=wire(`M${x} ${top-10}V${h-63}`,'#dae5f2',1)+tx(x,top-19,fmt(t),'text-anchor="middle" class="small"');}
    names.forEach((name,r)=>s+=tx(5,top+r*58+22,name,'class="label"')+wire(`M${left} ${top+r*58+42}h${width}`,'#e8eef6',1));
    d.rows.forEach(row=>[['lStart','lEnd',row.buffer,C.blue],['cStart','cEnd',2,C.green],['sStart','sEnd',3+row.buffer,C.purple]].forEach(([start,end,r,c])=>{
        const x=sx(row[start]),y=top+r*58,w=sx(row[end])-x;s+=rect(x,y,w,35,c+'35',c,2);if(w>27)s+=tx(x+w/2,y+23,`T${row.tile}`,'text-anchor="middle" class="small"');
    }));
    const first=d.rows[0];s+=arrow(left,h-37,sx(first.cStart),h-37,C.ink,1.2)+tx((left+sx(first.cStart))/2,h-13,'Fill','text-anchor="middle" class="small"');
    const drain=d.rows.at(-1);s+=arrow(sx(drain.cEnd),h-37,sx(drain.sEnd),h-37,C.ink,1.2)+tx((sx(drain.cEnd)+sx(drain.sEnd))/2,h-13,'Drain','text-anchor="middle" class="small"')+tx(593,h-13,'시간 단위: cycle','text-anchor="middle" class="small"');return svg(1080,h+4,'두 buffer의 load compute store와 fill 및 마지막 drain을 포함한 실제 계산 일정',s);
}
export function bufferArchitecture() {
    let s=labeledBox(10,70,132,184,'Off-chip','Memory',C.ink,'#f5f7fb')+labeledBox(229,40,153,88,'Load engine','외부 → SRAM',C.blue,'#eff6ff')+labeledBox(229,190,153,88,'Store engine','SRAM → 외부',C.purple,'#f8f4ff');
    s+=labeledBox(478,32,240,105,'Buffer A','Empty / load / compute / store',C.blue,'#edf6ff')+labeledBox(478,188,240,105,'Buffer B','Empty / load / compute / store',C.purple,'#f8f4ff')+labeledBox(869,101,198,132,'PE array','단일 compute engine',C.green,'#effbf6');
    s+=wire('M142 107H181V84H229',C.blue)+arrow(209,84,229,84,C.blue)+wire('M229 232H181V216H142',C.purple)+arrow(162,216,142,216,C.purple);
    s+=wire('M382 84H428V85H478M428 84V218H478',C.blue)+arrow(458,85,478,85,C.blue)+arrow(458,218,478,218,C.blue);
    s+=wire('M478 122H445V257H382M478 267H445V257',C.purple)+arrow(402,257,382,257,C.purple);
    s+=wire('M718 83H794V133H869M718 225H794V160H869',C.green)+arrow(849,133,869,133,C.green)+arrow(849,160,869,160,C.green);
    s+=wire('M869 202H820V286H718M820 202V123H718',C.green,1.5,'stroke-dasharray="5 4"')+arrow(738,123,718,123,C.green)+arrow(738,286,718,286,C.green)+tx(797,327,'결과를 같은 buffer에 보관','text-anchor="middle" class="small"');return svg(1090,352,'Load store 경로와 두 complete buffer 및 compute의 ownership 연결',s);
}
export function initAiOverlap(root) {
    put(root,'ai-buffer-architecture',bufferArchitecture());
    bindModel(root,'ai-overlap',v=>{const d=doubleBufferSchedule(v);put(root,'ai-overlap-schedule',doubleBufferFigure(d));
        put(root,'ai-overlap-result',table(['항목','결과'],[['자원',v.resource==='independent'?'독립 Load / Store engine':'하나의 DMA · ready store 우선'],['직렬 처리',`${d.serial} cycle`],['선택한 schedule',`${d.overlapped} cycle`],['Speedup',`${fmt(d.speedup)}×`],['첫 compute 시작',`${d.rows[0].cStart} cycle`],['첫 결과 store 완료',`${d.rows[0].sEnd} cycle`],['독립 자원의 간격 하한',`${Math.max(v.load,v.compute,v.store)} cycle · buffer 제약에 따라 증가`]]));
        put(root,'ai-overlap-ledger',table(['Tile','Buffer','Load','Compute','Store','재사용 가능'],d.rows.map(r=>[`T${r.tile}`,r.buffer?'B':'A',`${r.lStart}–${r.lEnd}`,`${r.cStart}–${r.cEnd}`,`${r.sStart}–${r.sEnd}`,r.sEnd])));
    });
}
