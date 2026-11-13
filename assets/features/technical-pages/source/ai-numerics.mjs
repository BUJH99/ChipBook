import {systolic,quantize} from '../../curriculum/source/models.mjs';
import {convolution} from '../../curriculum/source/detail-models.mjs';
import {escape,fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox,plot} from './figures.mjs';
import {bindModel,put,matrixTable,parseMatrix,numberGrid,peUnit} from './ai-common.mjs';

export function workload(v) {
    const d=convolution(v);if(!d.valid)throw new Error('Kernel이 padding을 포함한 입력보다 큽니다. 출력 높이와 폭이 양수가 되도록 조정하세요.');
    const batch=v.batch??1,bytes=v.elementBytes??2;
    return {...d,batch,bytes,macs:d.macs*batch,input:batch*v.height*v.width*v.inputChannels,weights:v.outputChannels*d.k,output:batch*d.m*v.outputChannels,poolH:Math.floor(d.outH/2),poolW:Math.floor(d.outW/2)};
}
function tensorCard(title,sub,kind,shape) {
    const art=kind==='flat'||kind==='vector'?`<div class="tech-vector ${kind}">${Array.from({length:kind==='flat'?9:7},()=>'<i></i>').join('')}</div>`:`<div class="tech-tensor-crop ${kind}" role="img" aria-label="${escape(title)}의 텐서 부피 개념"><img src="../assets/pages/page-11-ai-accelerator/images/cnn-tensor-volumes.png" alt="" loading="lazy"></div>`;
    return `<section><h4>${title}</h4><p>${sub}</p>${art}<strong>${shape}</strong></section>`;
}
export function workloadGraph(v,d) {
    const pool=d.poolH>0&&d.poolW>0,flat=pool?v.outputChannels*d.poolH*d.poolW:0;
    return '<div class="tech-tensor-flow">'+[
        tensorCard('Input',`NCHW · ${d.bytes} B / element`,'input',`(${d.batch}, ${v.inputChannels}, ${v.height}, ${v.width})`),
        tensorCard('Conv',`${v.kernel}×${v.kernel} · s=${v.stride} · p=${v.padding}`,'conv',`(${d.batch}, ${v.outputChannels}, ${d.outH}, ${d.outW})`),
        tensorCard('ReLU','Shape 유지','relu',`(${d.batch}, ${v.outputChannels}, ${d.outH}, ${d.outW})`),
        tensorCard('Max pool','2×2 · stride 2','pool',pool?`(${d.batch}, ${v.outputChannels}, ${d.poolH}, ${d.poolW})`:'출력이 2×2 미만'),
        tensorCard('Flatten','논리 축 결합','flat',pool?`(${d.batch}, ${fmt(flat)})`:'Pool 불가'),
        tensorCard('GEMM','Class 수 1,000 예시','vector',pool?`(${d.batch}, 1,000)`:'—'),
        tensorCard('Softmax','각 row의 합 = 1','vector',pool?`(${d.batch}, 1,000)`:'—')
    ].join('')+'</div>';
}
export function convolutionWindow(v,d) {
    const k=Math.min(v.kernel,7),size=k+2,cell=19,w=size*cell,x=10,y=49;let s=tx(10,24,'입력 X의 한 channel · 공간 window','class="small label"');
    s+=numberGrid(x,y,size,size,{cell,selected:(r,c)=>r>=1&&r<=k&&c>=1&&c<=k,highlight:C.orange});
    s+=wire(`M${x+cell} ${y+cell}h${k*cell}v${k*cell}h-${k*cell}z`,C.orange,2.4)+tx(x+w/2,y+w+24,`${v.kernel} × ${v.kernel} window`,'text-anchor="middle" class="small"');
    const fx=253,fy=64;s+=numberGrid(fx,fy,k,k,{cell:17,color:C.red})+tx(fx+k*17/2,fy+k*17+25,'Kernel W','text-anchor="middle" class="small"')+tx(223,135,'×','text-anchor="middle" class="label"')+arrow(fx+k*17+14,130,446,130,C.blue);
    s+=numberGrid(456,83,4,4,{cell:24,color:C.blue,selected:(r,c)=>r===1&&c===1})+tx(504,211,'출력의 한 원소','text-anchor="middle" class="small"');
    s+=tx(10,291,`Cᵢₙ × K² = ${fmt(d.k)}개 곱을 합산 → 출력 1개`,'class="label blue"')+tx(10,319,`출력 shape: (${d.batch}, ${v.outputChannels}, ${d.outH}, ${d.outW})`,'class="small"');
    return svg(575,345,'Convolution 입력 window와 kernel의 곱을 합산해 출력 원소를 만드는 대응',s);
}
export function im2colFigure(v,d) {
    let s=tx(13,24,'1. Window를 열로 펼치기 · im2col','class="label blue"');
    s+=numberGrid(16,48,6,6,{cell:19,color:C.blue,selected:(r,c)=>r<3&&c<3,highlight:C.orange})+arrow(143,106,216,106,C.ink)+tx(180,86,'Unfold','text-anchor="middle" class="small"');
    for(let c=0;c<8;c++)s+=numberGrid(229+c*26,49,6,1,{cell:24,color:[C.blue,C.orange,C.red,C.green][c%4]});
    s+=tx(325,220,`Xcol: (${fmt(d.k)}, ${fmt(d.m)}) / batch`,'text-anchor="middle" class="small"')+tx(13,264,'2. Wcol × Xcol = Ycol','class="label blue"');
    s+=numberGrid(18,290,4,6,{cell:20,color:C.purple})+tx(159,335,'×','text-anchor="middle" class="label"')+numberGrid(184,290,6,7,{cell:20,color:C.blue})+arrow(338,335,391,335,C.blue)+numberGrid(409,290,4,7,{cell:20,color:C.green});
    s+=tx(75,442,`(${v.outputChannels}, ${fmt(d.k)})`,'text-anchor="middle" class="small"')+tx(253,442,`(${fmt(d.k)}, ${fmt(d.m)})`,'text-anchor="middle" class="small"')+tx(479,442,`(${v.outputChannels}, ${fmt(d.m)})`,'text-anchor="middle" class="small"');
    return svg(570,465,'입력 window의 im2col과 weight matrix 곱의 shape를 일치시킨 GEMM 매핑',s);
}
export function initAiWorkload(root) {
    bindModel(root,'ai-workload',v=>{const d=workload(v);
        put(root,'ai-workload-graph',workloadGraph(v,d));put(root,'ai-convolution',convolutionWindow(v,d));put(root,'ai-im2col',im2colFigure(v,d));
        put(root,'ai-workload-ops',`<div class="tech-equation">MAC = N × H<sub>out</sub> × W<sub>out</sub> × C<sub>out</sub> × C<sub>in</sub> × K²</div><div class="tech-output"><small>선택한 convolution · 1 MAC = 2 Op</small>${fmt(d.macs)} MAC<br>${fmt(2*d.macs)} Op</div>`);
        put(root,'ai-workload-bytes',table(['데이터','Tensor shape','요소 수','저장 byte'],[['입력 X',`${d.batch} × ${v.inputChannels} × ${v.height} × ${v.width}`,d.input,fmt(d.input*d.bytes)],['가중치 W',`${v.outputChannels} × ${v.inputChannels} × ${v.kernel} × ${v.kernel}`,d.weights,fmt(d.weights*d.bytes)],['출력 Y',`${d.batch} × ${v.outputChannels} × ${d.outH} × ${d.outW}`,d.output,fmt(d.output*d.bytes)]]));
        put(root,'ai-workload-result',table(['매핑 항목','결과'],[['출력 높이 × 폭',`${d.outH} × ${d.outW}`],['Xcol / batch',`${fmt(d.k)} × ${fmt(d.m)}`],['Wcol',`${v.outputChannels} × ${fmt(d.k)}`],['Ycol / batch',`${v.outputChannels} × ${fmt(d.m)}`],['명시적 Xcol 저장 시',`${fmt(d.batch*d.k*d.m*d.bytes)} B`]]));
    });
}

export function formatBits(width=32) {
    const parts=width===32?[[1,'S',C.blue],[8,'Exponent (8)',C.green],[23,'Fraction (23)',C.red]]:width===16?[[1,'S',C.blue],[5,'Exponent (5)',C.green],[10,'Fraction (10)',C.red]]:Array.from({length:8},(_,i)=>[1,`b${7-i}`,C.blue]);
    const widths=width===8?parts.map(()=>43):width===32?[36,105,203]:[36,105,203];let x=5,s='';
    parts.forEach(([n,label,color],i)=>{const w=widths[i];s+=rect(x,39,w,46,color+'25',color,0)+tx(x+w/2,68,label,'text-anchor="middle" class="small"')+tx(x+w/2,26,`${n} bit`,'text-anchor="middle" class="small"');x+=w;});
    s+=tx(177,117,width===8?'x = −128b₇ + Σᵢ₌₀⁶ bᵢ2ⁱ':`(−1)ˢ × (1.F) × 2ᴱ⁻${width===32?'¹²⁷':'¹⁵'}`,'text-anchor="middle" class="label"');
    return svg(355,139,width===8?"Signed INT8의 2의 보수 가중치":"IEEE 754 정규화 수의 sign exponent fraction bit 구성",s);
}
export function quantRange(v,d) {
    const min=-(2**(v.width-1)),max=2**(v.width-1)-1,left=55,right=537,y=74,sx=q=>left+(q-min)/(max-min)*(right-left);let s=wire(`M${left} ${y}H${right}`,C.blue,2.5);
    [min,0,max].forEach(q=>s+=node(sx(q),y,C.blue,4)+tx(sx(q),y-18,q,'text-anchor="middle" class="small"'));
    s+=node(sx(v.zero),y,C.purple,5)+wire(`M${sx(v.zero)} ${y-7}v-27`,C.purple,1.4)+tx(sx(v.zero),y+28,`z=${v.zero} ↔ x=0`,'text-anchor="middle" class="small purple"');
    s+=rect(5,145,118,56,'#fff1f5','#f2b9c7')+rect(123,145,345,56,'#edf6ff','#aecffa')+rect(468,145,118,56,'#fff1f5','#f2b9c7');
    s+=tx(64,168,'Saturate','text-anchor="middle" class="small"')+tx(64,189,`→ ${min}`,'text-anchor="middle" class="small"')+tx(296,168,'복원 가능한 실수 범위','text-anchor="middle" class="small blue"')+tx(296,189,`[${fmt((min-v.zero)*v.scale)}, ${fmt((max-v.zero)*v.scale)}]`,'text-anchor="middle" class="small"')+tx(527,168,'Saturate','text-anchor="middle" class="small"')+tx(527,189,`→ ${max}`,'text-anchor="middle" class="small"');
    const values=Array.from({length:9},(_,i)=>(i-4)*v.scale),dx=62;
    s+=tx(7,241,`양자화 간격 = ${fmt(v.scale)} · zero-point ${v.zero}`,'class="label blue"')+wire('M36 285H550',C.line);
    values.forEach((x,i)=>s+=node(45+i*dx,285,C.blue,3)+tx(45+i*dx,311,fmt(x),'text-anchor="middle" class="small"'));
    return svg(600,332,'Signed 정수의 zero point와 saturation 범위 및 quantization spacing',s);
}
export function quantizationCurves(v) {
    const input=Array.from({length:513},(_,i)=>-4+i/64),restored=input.map(x=>[x,quantize(x,v.scale,v.width,v.zero).restored]),error=input.map((x,i)=>[x,restored[i][1]-x]);
    return {transfer:plot([{points:[[-4,-4],[4,4]],color:'#bacadd'},{points:restored,color:C.blue}],{width:580,height:285,xmin:-4,xmax:4,ymin:Math.min(-4,...restored.map(p=>p[1])),ymax:Math.max(4,...restored.map(p=>p[1])),xlabel:'입력 x',ylabel:'복원값 x̂'}),error:plot([{points:error,color:C.purple}],{width:580,height:285,xmin:-4,xmax:4,ymin:Math.min(-v.scale/2,...error.map(p=>p[1])),ymax:Math.max(v.scale/2,...error.map(p=>p[1])),xlabel:'입력 x',ylabel:'오차 x̂ − x'})};
}
export function initAiNumerics(root) {
    [32,16,8].forEach(w=>put(root,`ai-format-${w}`,formatBits(w)));
    bindModel(root,'ai-quantize',v=>{const d=quantize(v.value,v.scale,v.width,v.zero),curves=quantizationCurves(v);
        put(root,'ai-quant-range',quantRange(v,d));put(root,'ai-quant-transfer',curves.transfer);put(root,'ai-quant-error',curves.error);
        put(root,'ai-quant-steps',table(['단계','계산','값'],[['Scale',`${fmt(v.value)} / ${fmt(v.scale)}`,v.value/v.scale],['Round','Nearest · ties-to-even',d.raw-v.zero],['Zero-point',`Round + ${v.zero}`,d.raw],['Clamp',`[${-(2**(v.width-1))}, ${2**(v.width-1)-1}]`,d.integer],['Dequantize',`${fmt(v.scale)} × (${d.integer} − ${v.zero})`,d.restored],['Error','복원값 − 입력',d.error]]));
        put(root,'ai-quant-status',`<small>Signed ${v.width}-bit · ${d.saturated?'Saturation 발생':'범위 내'}</small>q = ${d.integer} · x̂ = ${fmt(d.restored)}`);
    });
}

export function signedPartialProducts(a,b) {
    if(![a,b].every(n=>Number.isInteger(n)&&n>=-128&&n<=127))throw new Error('두 operand는 signed INT8 범위의 정수여야 합니다.');
    return Array.from({length:8},(_,i)=>({bit:i,on:(b>>i)&1,value:a*((b>>i)&1)*2**i*(i===7?-1:1)}));
}
export function macOverview() {
    let s=rect(65,35,505,354,'#fbfdff','#b7cfe9',8)+tx(84,61,'Signed INT8 × INT8 · local PE','class="label blue"');
    s+=labeledBox(88,99,121,105,'Multiplier','8 × 8',C.blue,'#eef6ff')+labeledBox(386,104,151,99,'Adder tree','Product INT16',C.purple,'#f7f3ff')+labeledBox(363,275,174,80,'Accumulator','INT32',C.green,'#effbf5');
    s+=tx(5,116,'A','class="label blue"')+tx(5,135,'INT8','class="small"')+arrow(32,121,88,121,C.blue)+tx(5,180,'B','class="label purple"')+tx(5,200,'INT8','class="small"')+arrow(32,184,88,184,C.purple);
    for(let i=0;i<8;i++){const y=84+i*21;s+=tx(249,y+12,`pp[${i}]`,'class="small"')+wire(`M209 ${124+i*8}H229V${y+6}H239`,C.blue,1)+arrow(302,y+6,374,y+6,C.blue,1);}
    s+=arrow(461,203,461,275,C.purple)+tx(480,245,'sign extend','class="small"')+arrow(537,315,624,315,C.green)+tx(621,296,'Psum','text-anchor="end" class="small"')+wire('M574 315V373H330V316H363',C.green,1.9)+arrow(343,316,363,316,C.green);
    ['valid ∧ ready','clear','reset'].forEach((label,i)=>s+=tx(92,280+i*27,label,'class="small"')+arrow(210,275+i*27,363,275+i*27,C.ink,1.1));
    s+=tx(317,419,'수락한 입력만 누산 · stall은 operand와 accumulator를 함께 유지','text-anchor="middle" class="small"');return svg(642,441,'Signed partial product와 adder tree 및 INT32 accumulator feedback의 MAC 구조',s);
}
export function partialProductFigure(a=7,b=-5) {
    const rows=signedPartialProducts(a,b);let s=tx(5,24,`A = ${a} · B = ${b} · 16-bit 부호 확장`,'class="label"');
    const x=85,y=62,cell=21;
    for(let c=0;c<16;c++)s+=tx(x+c*cell+cell/2,48,15-c,'text-anchor="middle" class="small"');
    rows.forEach((r,i)=>{s+=tx(5,y+i*31+19,`pp[${r.bit}]`,'class="small"');const binary=(r.value&65535).toString(2).padStart(16,'0');
        [...binary].forEach((bit,j)=>s+=rect(x+j*cell,y+i*31,cell,25,bit==='1'?(i===7?'#e4daf8':'#cfe5ff'):'#f8fafc','#ccd9e8',1)+tx(x+j*cell+cell/2,y+i*31+18,bit,'text-anchor="middle" class="small"'));
        s+=tx(432,y+i*31+19,r.value,'class="small"');});
    s+=tx(5,342,'pp[i<7] = A · bᵢ · 2ⁱ','class="small"')+tx(5,365,'pp[7] = −A · b₇ · 2⁷','class="small purple"')+tx(5,394,`Σ pp = ${a*b} · 실제 multiplier 구현 방식은 달라질 수 있음`,'class="small label"');return svg(498,414,'Signed INT8 multiplier의 sign-weighted partial product 8개와 각 16bit 표현',s);
}
export function adderTreeFigure(a=7,b=-5) {
    let nodes=signedPartialProducts(a,b).map((r,i)=>({x:34+i*63,y:38,value:r.value})),s='';
    nodes.forEach((n,i)=>s+=labeledBox(n.x-26,n.y-20,52,44,`pp${i}`,`${n.value}`,i===7?C.purple:C.blue,'#fff'));
    let level=0;while(nodes.length>1){const next=[];for(let i=0;i<nodes.length;i+=2){const left=nodes[i],right=nodes[i+1],n={x:(left.x+right.x)/2,y:131+level*97,value:left.value+right.value};
        s+=wire(`M${left.x} ${left.y+24}V${n.y-38}H${n.x}V${n.y-19}M${right.x} ${right.y+24}V${n.y-38}H${n.x}`,C.purple,1.5)+`<circle cx="${n.x}" cy="${n.y}" r="19" fill="#faf7ff" stroke="${C.purple}"/>`+tx(n.x,n.y+6,'+','text-anchor="middle" class="label"')+tx(n.x,n.y+43,n.value,'text-anchor="middle" class="small"');next.push(n);}nodes=next;level++;}
    s+=arrow(nodes[0].x,nodes[0].y+46,nodes[0].x,396,C.purple)+tx(nodes[0].x,422,`Product = ${a*b} · signed INT16`,'text-anchor="middle" class="label"');return svg(520,442,'실제 signed partial product 값을 쌍으로 합산하는 세 단계 adder tree',s);
}
export function macAcceptanceTrace() {
    let acc=0;return [[1,1,1,5],[1,1,2,7],[0,1,0,0],[1,0,3,4],[1,1,-1,6]].map(([valid,ready,a,b],cycle)=>{const accept=valid&&ready;if(accept)acc+=a*b;return[cycle,valid,ready,a,b,a*b,acc,accept?'수락 · 누산':valid?'Stall · 유지':'Bubble · 유지'];});
}
export function initAiMac(root) {
    put(root,'ai-mac-overview',macOverview());put(root,'ai-mac-ledger',table(['Cycle','Valid','Ready','A','B','A × B','Accumulator','관측'],macAcceptanceTrace()));
    bindModel(root,'ai-mac',v=>{const qA=quantize(v.realA,v.scale,v.width,0),qB=quantize(v.realB,v.scale,v.width,0),product=qA.integer*qB.integer;
        put(root,'ai-partial-products',partialProductFigure(v.a,v.b));put(root,'ai-adder-tree',adderTreeFigure(v.a,v.b));
        put(root,'ai-mac-precision',table(['항목','값'],[['입력 A / B',`${fmt(v.realA)} / ${fmt(v.realB)}`],['양자화 A / B',`${qA.integer} / ${qB.integer}`],['정수 곱',product],['복원한 곱 (s²)',product*v.scale*v.scale],['실수 참조 곱',v.realA*v.realB],['곱셈 정밀도',`${2*v.width}-bit signed 보관`],['Saturation',qA.saturated||qB.saturated?'발생':'없음']]));
    });
    bindModel(root,'ai-dot',v=>{const A=parseMatrix(v.matrixA),B=parseMatrix(v.matrixB);if(A.length!==B.length)throw new Error('A와 B의 차원이 같아야 합니다.');
        if(v.row>=A.length||v.col>=B.length)throw new Error('선택한 row / column이 행렬 차원 밖입니다.');let sum=0;
        put(root,'ai-dot-result',table(['k','A[i,k]','B[k,j]','곱','누적합'],A[v.row].map((a,k)=>{sum+=a*B[k][v.col];return[k,a,B[k][v.col],a*B[k][v.col],sum];})));
        put(root,'ai-dot-matrices',matrixTable(A,{name:'A'})+matrixTable(B,{name:'B',tone:'purple'}));
    });
}

export const arrayPresets={
    identity:{A:[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]],B:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]},
    small:{A:[[1,2],[3,4]],B:[[5,6],[7,8]]},
    signed:{A:[[1,-2],[3,-4]],B:[[-5,6],[7,-8]]}
};
export function arrayState(A,B,{cycle=9,stallAt=-1,stallLength=0,row=0,col=0}={}) {
    if(A.length!==B.length)throw new Error('A와 B의 차원이 같아야 합니다.');
    const size=A.length,held=stallAt>=0?Math.max(0,Math.min(stallLength,cycle-stallAt+1)):0,logical=Math.min(3*size-3,cycle-held),d=systolic(A,B,logical);
    const selected={i:Math.min(row,size-1),j:Math.min(col,size-1)},k=logical-selected.i-selected.j;
    return {...d,size,logical,held,physical:cycle,selected,k,active:d.trace.find(t=>t.cycle===logical)?.active??[],stalled:stallAt>=0&&cycle>=stallAt&&cycle<stallAt+stallLength};
}
export function arrayNetwork(A,B,d) {
    const n=d.size,cell=90,box=58,left=88,top=66,width=left+n*cell+40;let s='';
    for(let r=0;r<n;r++){
        const y=top+r*cell;s+=tx(5,y+34,`A row ${r}`,'class="small blue"')+arrow(62,y+29,left,y+29,C.blue);
        for(let c=0;c<n;c++){
            const x=left+c*cell,active=d.active.find(p=>p.i===r&&p.j===c),chosen=d.selected.i===r&&d.selected.j===c;
            s+=rect(x,y,box,box,active?'#e2f7ef':'#f7fbff',chosen?C.orange:C.blue,6)+tx(x+box/2,y+23,`PE ${r},${c}`,'text-anchor="middle" class="small label"')+tx(x+box/2,y+45,d.sums[r][c],'text-anchor="middle" class="label"');
            if(c<n-1)s+=arrow(x+box,y+29,x+cell,y+29,C.blue);if(r<n-1)s+=arrow(x+box/2,y+box,x+box/2,y+cell,C.purple);
        }
    }
    for(let c=0;c<n;c++){const x=left+c*cell+box/2;s+=tx(x,19,`B col ${c}`,'text-anchor="middle" class="small purple"')+arrow(x,28,x,top,C.purple);}
    s+=tx(width/2,top+n*cell+12,`Logical cycle ${d.logical} · ${d.stalled?'STALLED · 이전 state 유지':d.active.length+'개 PE 유효'}`,'text-anchor="middle" class="small label"');
    return svg(width,top+n*cell+40,'A row와 B column을 전달하면서 해당 출력의 partial sum을 보관하는 systolic network',s);
}
export function arrayOccupancy(d) {
    const n=d.size,left=86,top=38,cell=39,rowH=24,w=left+d.cycles*cell+7,h=top+n*n*rowH+32;let s='';
    for(let t=0;t<d.cycles;t++)s+=tx(left+(t+.5)*cell,22,t,'text-anchor="middle" class="small"');
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){
        const y=top+(i*n+j)*rowH;s+=tx(3,y+17,`PE(${i},${j})`,'class="small"');
        for(let t=0;t<d.cycles;t++){const k=t-i-j,valid=k>=0&&k<n;s+=rect(left+t*cell,y,cell,rowH,valid?(t===d.logical?'#b5efd9':'#dfedff'):'#fff','#cfdbeb',0)+(valid?tx(left+(t+.5)*cell,y+17,`k=${k}`,'text-anchor="middle" class="small"'):'');}
    }s+=tx(w/2,h-7,`N=${n} · fill / compute / drain 전체 ${d.cycles} logical cycles`,'text-anchor="middle" class="small"');return svg(w,h,'각 PE의 모든 k 연산을 생략 없이 표시한 space-time occupancy 표',s);
}
export function initAiArray(root) {
    const form=root.querySelector('[data-ai-array-inputs]'),preset=root.querySelector('[name="arrayPreset"]');
    const loadPreset=()=>{const p=arrayPresets[preset.value];if(!p)return;form.elements.matrixA.value=p.A.map(r=>r.join(',')).join('\n');form.elements.matrixB.value=p.B.map(r=>r.join(',')).join('\n');form.elements.cycle.value=3*p.A.length-3;form.elements.row.value=0;form.elements.col.value=0;form.elements.stallAt.value=-1;form.elements.stallLength.value=0;};
    loadPreset();
    const update=bindModel(root,'ai-array',v=>{const A=parseMatrix(v.matrixA),B=parseMatrix(v.matrixB),d=arrayState(A,B,v),i=d.selected.i,j=d.selected.j,k=d.k;
        form.elements.row.max=d.size-1;form.elements.col.max=d.size-1;
        put(root,'ai-array-network',arrayNetwork(A,B,d));put(root,'ai-array-pe',peUnit({a:k>=0&&k<d.size?`A=${A[i][k]}`:'A · 대기',b:k>=0&&k<d.size?`B=${B[k][j]}`:'B · 대기',sum:d.sums[i][j],label:`PE(${i}, ${j}) · k = ${k}`}));
        put(root,'ai-array-A',matrixTable(A,{name:'A'}));put(root,'ai-array-B',matrixTable(B,{name:'B',tone:'purple'}));put(root,'ai-array-C',matrixTable(d.sums,{name:'C = A × B',tone:'green',mark:(r,c)=>r===i&&c===j?'is-selected':''}));
        put(root,'ai-array-occupancy',arrayOccupancy(d));put(root,'ai-array-status',`<small>Physical cycle ${v.cycle} · 삽입된 stall ${d.held} cycle · 완료 조건 logical ${d.cycles-1}</small>Logical cycle ${d.logical} · ${d.logical>=d.cycles-1?'결과 완료':d.stalled?'STALLED':'부분합 관측'}`);
        put(root,'ai-array-trace',table(['Cycle','유효 MAC','완료된 출력'],d.trace.map(t=>[t.cycle,t.active.map(p=>`(${p.i},${p.j}) k${p.k}`).join(' · '),t.active.filter(p=>p.k===d.size-1).map(p=>`C${p.i}${p.j}`).join(' · ')||'—'])));
    });
    preset.addEventListener('input',()=>{loadPreset();update();});
}
