import {quantize,kvBytes} from '../../curriculum/source/models.mjs';
import {activation,activationApproximation,sparse,attention} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox,plot} from './figures.mjs';
import {bindModel,put,matrixTable,numberGrid,horizontalBars} from './ai-common.mjs';

export const activationValue=(x,mode)=>mode==='sigmoid'?1/(1+Math.exp(-x)):activation(x,mode);
export function activationPwl(x,mode,segments=16) {
    if(mode!=='sigmoid')return activationApproximation(x,mode,segments);
    const at=Math.max(-8,Math.min(8,x)),step=16/segments,index=Math.min(segments-1,Math.floor((at+8)/step)),a=-8+index*step,b=a+step;
    return activationValue(a,mode)+(activationValue(b,mode)-activationValue(a,mode))*(at-a)/step;
}
export function activationAnalysis(v) {
    if(v.maximum<=v.minimum)throw new Error('입력 구간의 최댓값은 최솟값보다 커야 합니다.');
    const rows=Array.from({length:321},(_,i)=>{const x=v.minimum+(v.maximum-v.minimum)*i/320,reference=activationValue(x,v.mode),approximation=activationPwl(x,v.mode,v.segments),q=quantize(approximation,v.scale,v.width,0);return{x,reference,approximation,restored:q.restored,error:q.restored-reference,approximationError:approximation-reference,saturated:q.saturated};});
    return{rows,maxError:Math.max(...rows.map(r=>Math.abs(r.error))),meanError:rows.reduce((s,r)=>s+Math.abs(r.error),0)/rows.length,pwlError:Math.max(...rows.map(r=>Math.abs(r.approximationError))),clipped:rows.filter(r=>r.saturated).length};
}
export function activationFigure(v,d,{compact=false}={}) {
    return plot([{points:d.rows.map(r=>[r.x,r.reference]),color:C.blue},{points:d.rows.map(r=>[r.x,r.restored]),color:C.orange}],{width:compact?340:610,height:compact?400:340,xmin:v.minimum,xmax:v.maximum,ymin:Math.min(-.3,...d.rows.flatMap(r=>[r.reference,r.restored])),ymax:Math.max(1,...d.rows.flatMap(r=>[r.reference,r.restored])),xlabel:'입력 x',ylabel:'활성화 출력'});
}
export function postprocessPath() {
    const names=[['ACC','INT32'],['Scaling','x = ACC × 2⁻ˢ'],['Rounding','Ties-to-even'],['Clipping','Signed INT8'],['ReLU','max(0, q)'],['Output','INT8']];let s='';
    names.forEach(([name,sub],i)=>{const x=7+i*185;s+=labeledBox(x,38,151,76,name,sub,i===4?C.green:C.blue,i===4?'#effbf6':'#f4f8ff');if(i<5)s+=arrow(x+151,76,x+184,76,C.blue);});
    s+=tx(562,155,'이 순서는 정수 ReLU 예시 · 다른 비선형 함수는 scale / LUT / requantization 계약을 별도 정의','text-anchor="middle" class="small"');return svg(1120,179,'INT32 accumulator scaling rounding saturation integer ReLU output의 단계별 처리',s);
}
export function initAiActivation(root) {
    put(root,'ai-postprocess-path',postprocessPath());
    ['relu','gelu'].forEach(mode=>{const v={mode,minimum:-8,maximum:8,segments:16,scale:.25,width:8};put(root,`ai-activation-${mode}`,activationFigure(v,activationAnalysis(v),{compact:true}));});
    bindModel(root,'ai-activation',v=>{const d=activationAnalysis(v);put(root,'ai-activation-plot',activationFigure(v,d));put(root,'ai-activation-result',table(['지표','결과'],[['PWL 최대 절대 오차',d.pwlError],['양자화 포함 최대 절대 오차',d.maxError],['양자화 포함 평균 절대 오차',d.meanError],['Saturation sample',`${d.clipped} / ${d.rows.length}`]])+`<p class="tech-caption">Reference: ${v.mode==='gelu'?'GELU tanh 근사식':v.mode} · ${v.segments} PWL segments / [−8,8]. 선택 구간의 균등 321점에서 평가하며 연속 구간 최악값의 증명은 아닙니다.</p>`);});
    bindModel(root,'ai-postprocess',v=>{const values=[-2048,-300,-10,0,10,300,2048];put(root,'ai-postprocess-values',table(['ACC','Scaling','Round','Clip','ReLU'],values.map(acc=>{const x=acc/2**v.shift,q=quantize(x,1,8,0);return[acc,x,q.raw,q.integer,Math.max(0,q.integer)];})));});
}

export const sparseExample=[[0,0,3,0,0,-1,0,0],[2,0,0,0,4,0,0,0],[0,5,0,0,0,0,6,0],[0,0,0,7,0,0,0,8]];
export function sparseEncoding(matrix,{valueBytes=1,indexBytes=1}={}) {
    const rows=matrix.length,cols=matrix[0].length,rowPtr=[0],colIdx=[],values=[],bitmap=[],loads=[];
    matrix.forEach(row=>{let load=0;row.forEach((v,c)=>{bitmap.push(Number(v!==0));if(v!==0){colIdx.push(c);values.push(v);load++;}});loads.push(load);rowPtr.push(values.length);});
    const denseBytes=rows*cols*valueBytes,csrBytes=values.length*(valueBytes+indexBytes)+(rows+1)*indexBytes,bitmapBytes=Math.ceil(rows*cols/8)+values.length*valueBytes;
    return{rows,cols,rowPtr,colIdx,values,bitmap,loads,nnz:values.length,sparsity:100*(1-values.length/(rows*cols)),denseBytes,csrBytes,bitmapBytes,cooBytes:values.length*(valueBytes+2*indexBytes),cycles:Math.max(...loads),denseCycles:cols};
}
export function sparseArrays(d) {
    return `<h4>CSR · Compressed Sparse Row</h4>`+table(['배열','실제 값'],[['row_ptr',d.rowPtr.join(' · ')],['col_idx',d.colIdx.join(' · ')||'비어 있음'],['values',d.values.join(' · ')||'비어 있음']])+`<h4 class="tech-subtitle">Bitmap + values</h4>`+table(['Row','Bitmap (column 0 → 7)','Values'],Array.from({length:d.rows},(_,r)=>[r,d.bitmap.slice(r*d.cols,(r+1)*d.cols).join(' '),d.values.slice(d.rowPtr[r],d.rowPtr[r+1]).join(', ')||'없음']));
}
export function sparseSchedule(matrix,dense=false) {
    let s='';const left=54,top=39,cell=35;
    for(let c=0;c<8;c++)s+=tx(left+(c+.5)*cell,23,`C${c}`,'text-anchor="middle" class="small"');
    matrix.forEach((row,r)=>{s+=tx(4,top+r*cell+23,`PE${r}`,'class="small"');row.forEach((v,c)=>s+=rect(left+c*cell,top+r*cell,cell-3,cell-3,dense||v!==0?'#cee4ff':'#fff',dense||v!==0?'#8cbbef':'#d2deed',1));});
    s+=tx(192,221,dense?'모든 원소에 MAC 슬롯':'0을 skip · 유효 위치만 표시','text-anchor="middle" class="small"');return svg(353,241,'Dense 모든 원소 또는 sparse nonzero 위치의 MAC schedule',s);
}
export function initAiSparse(root) {
    const form=root.querySelector('[data-ai-sparse-inputs]'),host=form.querySelector('[data-ai-sparse-editor]');
    host.innerHTML=matrixTable(sparseExample,{name:'Sparse input',editable:true,prefix:'sparse'});
    const update=bindModel(root,'ai-sparse',v=>{
        const matrix=Array.from({length:4},(_,r)=>Array.from({length:8},(_,c)=>v[`sparse-${r}-${c}`])),d=sparseEncoding(matrix,{valueBytes:1,indexBytes:Number(v.metadata)});
        put(root,'ai-sparse-matrix',matrixTable(matrix,{name:'4 × 8 · INT8',mark:(r,c,n)=>n===0?'is-zero':'is-active'}));put(root,'ai-sparse-encoding',sparseArrays(d));
        put(root,'ai-sparse-dense',sparseSchedule(matrix,true));put(root,'ai-sparse-skip',sparseSchedule(matrix));
        put(root,'ai-sparse-storage',table(['항목','Dense','CSR','Bitmap + value'],[['Values',32,d.nnz,d.nnz],['Index / bitmap',0,d.nnz*Number(v.metadata),4],['Row pointer',0,5*Number(v.metadata),0],['총 byte',d.denseBytes,d.csrBytes,d.bitmapBytes],['실행할 MAC',32,d.nnz,d.nnz]]));
        put(root,'ai-sparse-decode',table(['Row','row_ptr 구간','col_idx','복원 (row,column,value)'],Array.from({length:4},(_,r)=>[r,`[${d.rowPtr[r]}, ${d.rowPtr[r+1]})`,d.colIdx.slice(d.rowPtr[r],d.rowPtr[r+1]).join(', ')||'없음',d.values.slice(d.rowPtr[r],d.rowPtr[r+1]).map((v,i)=>`(${r},${d.colIdx[d.rowPtr[r]+i]},${v})`).join(' · ')||'모두 0'])));
        put(root,'ai-sparse-loads',horizontalBars(d.loads.map((value,i)=>({label:`PE row ${i}`,value,color:C.blue})),{max:8,unit:'MAC',width:450}));
        put(root,'ai-sparse-result',`<small>전체 32 · NNZ ${d.nnz} · row별 1 PE 가정</small>Sparsity ${fmt(d.sparsity)}%<br>${d.cycles} cycle + decode / 이동 비용`);
    });
    root.querySelector('[name="sparsePreset"]').addEventListener('input',e=>{const value=e.target.value,matrix=value==='example'?sparseExample:value==='dense'?Array.from({length:4},(_,r)=>Array.from({length:8},(_,c)=>r+c+1)):value==='zero'?Array.from({length:4},()=>Array(8).fill(0)):(()=>{const d=sparse({zeros:75,metadata:1});return Array.from({length:4},(_,r)=>d.values.slice(r*8,r*8+8));})();matrix.forEach((row,r)=>row.forEach((n,c)=>form.elements[`sparse-${r}-${c}`].value=n));update();});
}

export function attentionMatrices({scale=1,causal=false}={}) {
    const Q=[[1,0],[0,1]],K=[[1,0],[0,1],[1,1]],V=[[1,2],[3,0],[0,1]],scores=Q.map(q=>K.map(k=>q.reduce((s,n,i)=>s+n*k[i],0)/Math.sqrt(2)*scale));
    const weights=scores.map((row,r)=>{const values=row.map((n,c)=>causal&&c>r?-Infinity:n),max=Math.max(...values),e=values.map(n=>Math.exp(n-max)),sum=e.reduce((a,b)=>a+b,0);return e.map(x=>x/sum);});
    const output=weights.map(row=>V[0].map((_,c)=>row.reduce((sum,w,k)=>sum+w*V[k][c],0)));return{Q,K,V,scores,weights,output};
}
export function attentionOverview() {
    let s='';[['Query Q',C.blue,'Sᵩ × d'],['Key K',C.purple,'Sₖ × d'],['Value V',C.green,'Sₖ × d']].forEach(([name,color,shape],i)=>{const x=70+i*356;s+=tx(x+105,24,name,'text-anchor="middle" class="label"')+numberGrid(x,43,4,7,{cell:26,color})+tx(x+92,174,shape,'text-anchor="middle" class="small"');});
    s+=wire('M161 180V209H78V258M517 180V225H169V258',C.blue,1.5)+arrow(78,237,78,258,C.blue)+arrow(169,237,169,258,C.blue);
    s+=labeledBox(14,258,225,70,'Score','QKᵀ / √d',C.blue,'#f1f7ff')+labeledBox(297,258,205,70,'Mask','요청의 인과 관계',C.ink,'#f8fafc')+labeledBox(557,258,224,70,'Softmax','각 query row 정규화',C.blue,'#f1f7ff')+labeledBox(837,258,244,70,'Weighted value','P × V',C.green,'#effaf5');
    s+=arrow(239,292,297,292,C.blue)+arrow(502,292,557,292,C.blue)+arrow(781,292,837,292,C.blue)+wire('M874 180V214H958V258',C.green)+arrow(958,238,958,258,C.green);
    s+=numberGrid(41,359,3,6,{cell:26,color:C.blue})+numberGrid(319,359,3,6,{cell:26,color:C.ink,selected:(r,c)=>c<=r,highlight:C.blue})+numberGrid(589,359,3,6,{cell:26,color:C.blue})+numberGrid(873,359,3,6,{cell:26,color:C.green});
    s+=tx(126,470,'Sᵩ × Sₖ','text-anchor="middle" class="small"')+tx(400,470,'미래 위치 제외','text-anchor="middle" class="small"')+tx(666,470,'각 row의 합 = 1','text-anchor="middle" class="small"')+tx(959,470,'Sᵩ × dᵥ','text-anchor="middle" class="small"');return svg(1100,495,'Q K score mask softmax와 V의 weighted sum으로 이어지는 attention shape 경로',s);
}
export function kvGrowthFigure(decode=false) {
    const cols=decode?7:6;let s=tx(20,26,decode?'Decode · 기존 KV 재사용 + 새 token 추가':'Prefill · 여러 token의 KV를 준비','class="label blue"');
    for(let i=0;i<cols;i++){const x=52+i*63;s+=tx(x+23,70,decode&&i===cols-1?'new':`t${i}`,'text-anchor="middle" class="small"')+rect(x,90,45,36,'#e7dafa',C.purple,3)+rect(x,135,45,36,'#d6f3e7',C.green,3);}
    s+=tx(14,113,'K','class="label purple"')+tx(14,158,'V','class="label green"')+wire(`M51 190v8h${cols*63-16}v-8`,C.line,1.5)+tx(260,223,decode?'Cache 길이 +1 · 이전 K/V를 attention에서 참조':'입력 token 수에 비례한 K/V 저장','text-anchor="middle" class="small"');
    if(decode)s+=wire('M52 52Q240 -8 423 52',C.blue,1.5)+arrow(413,43,423,52,C.blue)+rect(424,80,57,100,'none',C.red,3)+tx(454,259,'새 K/V','text-anchor="middle" class="small"');return svg(510,279,'Prefill과 decode에서 K V cache를 쓰고 참조하며 길이를 늘리는 차이',s);
}
export function initAiAttention(root) {
    put(root,'ai-attention-overview',attentionOverview());put(root,'ai-kv-prefill',kvGrowthFigure());put(root,'ai-kv-decode',kvGrowthFigure(true));
    bindModel(root,'ai-kv',v=>{const bytes=kvBytes(v),perToken=bytes/v.length;put(root,'ai-kv-result',`<small>2 × ${v.batch} × ${v.layers} × ${v.length} × ${v.heads} × ${v.dim} × ${v.bytes}</small>${fmt(bytes/2**20)} MiB`);put(root,'ai-kv-details',table(['항목','계산'],[['단순 저장 byte',fmt(bytes)],['Token당 증가',`${fmt(perToken)} B`],['Decode에서 이전 KV를 1회 전부 읽는 가정',`${fmt(bytes/2**20)} MiB / generated token`],['제외','Allocator · alignment · padding · 양자화 metadata']]));});
    bindModel(root,'ai-attention',v=>{const d=attentionMatrices({scale:v.attentionScale,causal:v.mask==='causal'});
        [['Q','blue'],['K','purple'],['V','green'],['scores','blue'],['weights','blue'],['output','green']].forEach(([name,tone])=>put(root,`ai-attention-${name}`,matrixTable(d[name],{name,tone})));
        const scalar=attention({q:v.q,scale:v.scalarScale});put(root,'ai-attention-scalar',table(['Key','Value','Score','Softmax weight'],scalar.rows)+`<div class="tech-output"><small>기존 d=1 scalar 예 · Σ weight × value</small>Output ${fmt(scalar.output)}</div>`);
    });
}

export function compilerFlow() {
    const steps=[['Model source','Graph / parameters'],['Frontend','Shape · dtype 검사'],['Lowering / fusion','지원 kernel 생성'],['Scheduling','Tile · buffer 수명'],['Runtime','Buffer · command'],['Device','실행 · 완료 · 오류']];let s='';
    steps.forEach(([title,sub],i)=>{const x=7+i*184;s+=labeledBox(x,36,152,93,title,sub,[C.blue,C.blue,C.green,C.purple,C.blue,C.green][i],'#f5f9ff');if(i<5)s+=arrow(x+152,81,x+184,81,C.blue);});
    s+=wire('M1003 129V175H451V129',C.orange,1.3,'stroke-dasharray="5 4"')+arrow(451,150,451,129,C.orange)+tx(729,199,'Profiling counter / timeline → 다음 compiler 선택의 근거','text-anchor="middle" class="small"');return svg(1113,224,'Model frontend lowering schedule runtime device와 profiling feedback의 compiler pipeline',s);
}
export function fusionFigure(fused=true,fallback=false) {
    let s=tx(125,25,'원래 operator graph','text-anchor="middle" class="label"')+tx(431,25,'선택한 실행 계획','text-anchor="middle" class="label"');
    const ops=['Conv','Bias','ReLU','Add'];ops.forEach((op,i)=>{const y=65+i*65;s+=labeledBox(37,y,176,42,op,'',C.blue,'#edf6ff');if(i<3)s+=arrow(125,y+42,125,y+65,C.blue);});
    if(fused)s+=rect(336,51,194,185,'#effaf6',C.green,6)+tx(433,46,'Fused kernel','text-anchor="middle" class="small green"');
    ops.forEach((op,i)=>{const y=65+i*65;s+=labeledBox(350,y,164,42,op,'',fused&&i<3?C.green:C.blue,'#fff');if(i<3)s+=arrow(432,y+42,432,y+65,C.blue);});
    s+=arrow(231,169,328,169,C.blue)+tx(279,149,fused?'Fusion':'개별 실행','text-anchor="middle" class="small"');
    if(fallback)s+=labeledBox(34,347,480,58,'추가 operator → CPU fallback','Device ↔ host 전송 · 형식 변환 · 동기화',C.orange,'#fff7eb')+wire('M432 302V347',C.orange)+arrow(432,329,432,347,C.orange);
    return svg(553,fallback?429:334,'Conv bias ReLU의 fusion 여부와 추가 unsupported operator의 fallback 예',s);
}
export function tensorLifetime(fused=true) {
    const rows=[['Input',0,1.8,C.blue],['Weights',0,5,C.purple],['Conv output',1,2,C.blue],['Bias output',2,3,C.blue],['ReLU output',3,4,C.green],['Add output',4,5,C.green]],left=139,step=74;let s='';
    for(let t=0;t<=6;t++)s+=wire(`M${left+t*step} 25V296`,'#dee7f2',1)+tx(left+t*step,324,t,'text-anchor="middle" class="small"');
    rows.forEach(([name,a,b,c],i)=>{const y=35+i*42;s+=tx(5,y+21,name,'class="small"');const omitted=fused&&(i===2||i===3);s+=rect(left+a*step,y,(b-a)*step,27,omitted?'#fafcfe':c+'3f',omitted?'#b1c4d9':c,2)+(omitted?tx(left+(a+b)/2*step,y+19,'local','text-anchor="middle" class="small"'):'');});
    s+=tx(360,355,'예시 상대 시각 · fusion 시 중간 tensor의 외부 materialization 생략','text-anchor="middle" class="small"');return svg(610,378,'실행 중 tensor lifetime과 fusion으로 외부 중간 저장을 생략하는 예',s);
}
export function compilerBudget({rows=64,cols=64,bytes=1,fusion='on',fallback='off'}) {
    const tensorBytes=rows*cols*bytes,avoided=fusion==='on'?2*tensorBytes:0,transfer=fallback==='on'?2*tensorBytes:0;
    return{tensorBytes,baseline:2*tensorBytes,intermediate:2*tensorBytes-avoided,avoided,fallbackBytes:transfer};
}
export function initAiCompiler(root) {
    put(root,'ai-compiler-flow',compilerFlow());
    bindModel(root,'ai-compiler',v=>{const d=compilerBudget(v),fused=v.fusion==='on',fallback=v.fallback==='on';put(root,'ai-fusion',fusionFigure(fused,fallback));put(root,'ai-lifetime',tensorLifetime(fused));
        put(root,'ai-compiler-budget',table(['항목','조건 / 결과'],[['Intermediate shape',`${v.rows} × ${v.cols} × ${v.bytes} B`],['중간 tensor 크기',`${fmt(d.tensorBytes)} B`],['Unfused 한 경계 write + read',`${fmt(d.baseline)} B`],['선택한 경계 traffic',`${fmt(d.intermediate)} B`],['Fusion으로 생략한 byte',`${fmt(d.avoided)} B`],['Fallback 추가 왕복 가정',`${fmt(d.fallbackBytes)} B`],['가정','같은 layout / dtype · SRAM 수용 · 추가 consumer 없음']]));
        const commands=[['1','Allocate','Input / weight / output buffer'],['2','Upload','Weights 및 입력 준비'],['3','Launch',fused?'Conv + Bias + ReLU fused kernel':'Conv → Bias → ReLU 개별 kernel'],['4','Launch','Add kernel']];
        if(fallback)commands.push(['5','Wait + copy to host','해당 예제 backend의 미지원 operator 입력'],['6','CPU operator','실행 및 결과 형식 확인'],['7','Copy to device','다음 device consumer에 publish']);
        commands.push([`${commands.length+1}`,'Synchronize','완료와 오류 상태 확인'],[`${commands.length+2}`,'Release','마지막 사용 종료 후 buffer 반환']);put(root,'ai-runtime-commands',table(['순서','명령','계약'],commands));
    });
}
