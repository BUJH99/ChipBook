import * as M from './models.mjs';

import {escape,fmt,table,metrics,wave,chart,flow,i2cCircuit,peDatapath,timingCircuit,timingWindows} from './presentation.mjs';
import {detailFields,detailSelects,renderDetail} from './detail-labs.mjs';
import * as D from './detail-models.mjs';

function arrayView(result, cycle) {
    const active = result.trace[Math.min(cycle, result.trace.length - 1)]?.active || [];
    return `<div class="pe-array" style="--pe-cols:${result.sums[0].length}">${result.sums.flatMap((row, i) => row.map((sum, j) => {
        const operation = active.find(x => x.i === i && x.j === j);
        return `<div class="pe-cell ${operation ? 'is-computing' : ''}"><span>PE(${i},${j})</span><strong>${sum}</strong><small>${operation ? `${operation.a} × ${operation.b}` : '유효 입력 없음'}</small>${j<result.sums[0].length-1?'<svg class="pe-right" viewBox="0 0 24 16" aria-hidden="true"><path d="M0 8H21m-6-6 6 6-6 6"/></svg>':''}${i<result.sums.length-1?'<svg class="pe-down" viewBox="0 0 16 24" aria-hidden="true"><path d="M8 0V21m-6-6 6 6 6-6"/></svg>':''}</div>`;
    })).join('')}</div>`;
}

const fields = {
    ...detailFields,
    uart: [['rxBaud','수신 Baud',115200,300,3000000,300],['value','송신 byte',165,0,255,1],['baud','Baud',115200,300,3000000,300]],
    spi: [['value','송신 byte',166,0,255,1],['received','Target 응답 byte',60,0,255,1],['mode','SPI mode',0,0,3,1]],
    i2c: [['address','7-bit 주소',80,0,127,1],['value','송신 byte',165,0,255,1],['stretch','Stretch 구간',0,0,4,1]],
    dma: [['length','길이 (byte)',32,1,512,1],['beat','Beat (byte)',4,1,16,1],['source','Source 주소 (10진)',4096,0,65535,1],['destination','Destination 주소 (10진)',8192,0,65535,1],['stall','Stall 횟수',0,0,20,1],['timeout','제한 cycle',100,1,200,1]],
    array: [['size','Array 크기',2,2,4,1]],
    quantize: [['value','입력값',3.7,-100,100,0.1],['scale','Scale',0.25,0.01,10,0.01],['width','Signed bit',8,2,16,1],['zero','Zero-point',0,-32768,32767,1]],
    timing: [['period','Clock period (ns)',10,0.5,30,0.1],['delay','Max data delay (ns)',6,0,30,0.1],['minDelay','Min data delay (ns)',0.3,0,5,0.05],['skew','Capture skew (ns)',0.2,-2,2,0.1]],
    bandwidth: [['rate','Lane rate (Gb/s)',8,0.1,128,0.1],['lanes','Lane 수',4,1,32,1],['efficiency','Payload 비율',0.8,0.01,1,0.01],['bytes','Payload (byte)',4096,1,1000000,1]],
    roofline: [['operations','연산 수 (Mop)',1000,1,100000,1],['bytes','전송량 (MB)',100,1,100000,1],['peak','Peak (Gop/s)',1000,1,100000,1],['bandwidthGB','대역폭 (GB/s)',100,1,10000,1]],
    power: [['activity','활성도 α',0.2,0,1,0.01],['capacitancePF','등가 C (pF)',100,1,10000,1],['voltage','전압 (V)',0.8,0.1,5,0.05],['frequencyMHz','주파수 (MHz)',500,1,5000,1]],
    rc: [['resistance','저항 (Ω)',2200,1,20000,1],['capacitancePF','부하 (pF)',100,1,1000,1],['voltage','전압 (V)',3.3,0.1,5,0.1]],
    tiling: [['m','M',16,1,128,1],['n','N',16,1,128,1],['k','K',16,1,128,1],['tm','Tile M',8,1,64,1],['tn','Tile N',8,1,64,1],['tk','Tile K',8,1,64,1],['capacity','SRAM 용량 (byte)',4096,1,1048576,1]],
    kv: [['length','Token 수',2048,1,131072,1],['heads','KV Head 수',16,1,128,1],['dim','Head dimension',64,8,256,8],['layers','Layer 수',24,1,128,1],['bytes','원소 byte',2,1,4,1]],
    cache: [['lines','Cache line 수',4,1,16,1],['lineBytes','Line byte',16,4,128,4]],
    fifo: [['depth','FIFO 깊이',4,2,8,1],['value','쓰기 값',1,0,255,1]],
    irq: [['period','Timer 주기 (tick)',4,1,64,1]], sequence: [],
};

function initLab(root) {
    let config;
    try { config = JSON.parse(root.dataset.lessonLab); } catch { return; }
    const type = config.type || 'sequence';
    const selects=[...(detailSelects[type]||[])];
    if(type==='i2c') selects.push(['scenario','Transaction',[['write','Write'],['read','Repeated START + Read'],['arbitration','두 controller 중재']]]);
    if(type==='spi') selects.push(['targetMode','Target mode',[['match','송신 mode와 동일'],['mismatch','CPHA 반전']]]);
    if(type==='irq') selects.push(['trigger','Trigger',[['level','Level'],['edge','Rising edge']]]);
    let cycle = type==='array'?-1:0, timer = 0, running = false, active = false, fault = false, stalled = false;
    let fifo = { depth: 4, values: [], read: 0, write: 0, output: '—' };
    let irq = { source: false, pending: false, masked: false, level: true, irq: false };
    root.innerHTML = `<div class="lesson-lab-title"><h3>${escape(config.title || '동작 확인')}</h3><p>${escape(config.scope || '')}</p></div><div class="lesson-lab-visual"></div><form class="lesson-lab-inputs" aria-label="실습 입력">${(fields[type] || []).map(([key,label,value,min,max,step]) => `<label>${escape(label)}<input name="${key}" aria-label="${escape(label)}" type="number" value="${config[key] ?? value}" min="${min}" max="${max}" step="${step}" required></label>`).join('')}${selects.map(([key,label,options])=>`<label>${escape(label)}<select name="${key}" aria-label="${escape(label)}">${options.map(([value,text])=>`<option value="${value}">${escape(text)}</option>`).join('')}</select></label>`).join('')}${type === 'uart' ? '<label>Parity<select name="parity" aria-label="Parity"><option value="none">없음</option><option value="even">Even</option><option value="odd">Odd</option></select></label>' : ''}</form><div class="lesson-lab-toolbar"><button type="button" data-lab-action="step">한 단계 진행</button><button type="button" data-lab-action="play" class="secondary">자동 재생</button><button type="button" data-lab-action="reset" class="secondary">초기화</button>${['uart','i2c','dma','sequence','pcie','domain','verify','npu','formal'].includes(type) ? '<button type="button" data-lab-action="fault" class="secondary" aria-pressed="false">오류 조건</button>' : ''}${type === 'fifo' ? '<button type="button" data-lab-action="write">쓰기</button><button type="button" data-lab-action="read">읽기</button>' : ''}${type === 'irq' ? '<button type="button" data-lab-action="event">이벤트</button><button type="button" data-lab-action="mask">Mask 전환</button><button type="button" data-lab-action="source-clear">Source clear</button><button type="button" data-lab-action="pending-clear">Pending clear</button>' : ''}<output class="lesson-cycle" aria-live="polite"></output></div><div class="lesson-lab-error" role="alert" hidden></div><div class="lesson-lab-result"></div>`;
    const form = root.querySelector('form'), result = root.querySelector('.lesson-lab-result'), status = root.querySelector('output'), error = root.querySelector('[role="alert"]');
    if(type==='irq')root.querySelector('.lesson-lab-toolbar').insertAdjacentHTML('beforeend','<button type="button" data-lab-action="tick" class="secondary">Timer 1 tick</button>');
    if(type==='array'){
        form.insertAdjacentHTML('beforeend','<label class="matrix-editor">Matrix A (행은 줄바꿈, 값은 쉼표)<textarea name="matrixA" aria-label="Matrix A (행은 줄바꿈, 값은 쉼표)" rows="3">1,2\n3,4</textarea></label><label class="matrix-editor">Matrix B<textarea name="matrixB" aria-label="Matrix B" rows="3">5,6\n7,8</textarea></label>');
        root.querySelector('.lesson-lab-toolbar').insertAdjacentHTML('beforeend','<button type="button" data-lab-action="stall" class="secondary" aria-pressed="false">Stall 전환</button>');
    }
    const read = () => Object.fromEntries([...new FormData(form)].map(([k,v]) => [k, form.elements.namedItem(k).type === 'number' ? Number(v) : v]));
    const stop = () => { clearInterval(timer); timer = 0; running = false; root.querySelector('[data-lab-action="play"]').textContent = '자동 재생'; };
    let maxCycle = 0;
    function render(source='') {
        if(type==='array')for(const key of ['matrixA','matrixB']){
            const input=form.elements.namedItem(key),n=Number(form.elements.namedItem('size').value);
            const rows=input.value.trim().split(/\n|;/).map(row=>row.trim().split(/[,\s]+/).map(Number));
            input.setCustomValidity(rows.length===n&&rows.every(row=>row.length===n&&row.every(value=>Number.isInteger(value)&&value>=-128&&value<=127))?'':`${n}×${n} INT8 행렬을 입력하세요.`);
        }
        if(type==='fifo'){const depth=form.elements.namedItem('depth');const value=Number(depth.value);depth.setCustomValidity(value>0&&!(value&(value-1))?'':'깊이는 2, 4, 8 중 하나를 사용하세요.');}
        if(type==='quantize'){const zero=form.elements.namedItem('zero'),width=Number(form.elements.namedItem('width').value),value=Number(zero.value);zero.setCustomValidity(Number.isInteger(value)&&value>=-(2**(width-1))&&value<2**(width-1)?'':'Zero-point는 선택한 signed bit 범위의 정수여야 합니다.');}
        if (!form.checkValidity()) { error.hidden = false; error.textContent = form.querySelector(':invalid')?.validationMessage || '입력 범위와 단위를 확인하세요.'; stop(); return; }
        error.hidden = true;
        const v = read(); let html = ''; maxCycle = 0;
        const detail=renderDetail(type,v,cycle,fault,config);
        if(detail){html=detail.html;maxCycle=detail.maxCycle;}
        else if (type === 'uart') {
            const data = M.uartFrame(v.value, v.parity, fault); const rx=D.uartReceive(v.value,v.baud,v.rxBaud,v.parity,fault&&v.parity==='none'); maxCycle = data.levels.length - 1;
            html = wave(['TX'], [data.levels], cycle) + metrics({ '현재 구간': data.labels[Math.min(cycle,maxCycle)], '복원 byte': `0x${rx.decoded.toString(16).toUpperCase()}`, '프레임 시간 (µs)': data.durationBits / v.baud * 1e6, '검사': rx.framingError?'Framing error':rx.parityError?'Parity error':data.error,'Baud 오차 (%)':rx.mismatch }) + table(['구간','TX'], data.labels.map((label,i)=>[label,data.levels[i]]));
        } else if (type === 'spi') {
            const d = M.spiFrame(v.value,v.mode,v.received); maxCycle = d.clock.length - 1;
            html = flow(['Controller','CS / SCLK','Target'],cycle%3)+wave(['CS_n','SCLK','MOSI','MISO'],[d.cs,d.clock,d.mosi,d.miso],cycle) + metrics({ CPOL:d.cpol, CPHA:d.cpha, 'Sampling edge':d.cpha ? '두 번째 edge' : '첫 번째 edge', 'Target mode':v.targetMode==='match'?v.mode:(v.mode^1),'Target RX':v.targetMode==='match'?d.decoded:'edge 불일치: 유효값 미보장','Controller RX':v.targetMode==='match'?d.received:'edge 불일치: 유효값 미보장' }) + table(['Bit','Sample 위치','MOSI','MISO'],M.bits(v.value).map((b,i)=>[7-i,d.samples[i],b,M.bits(v.received)[i]]))+'<p>CS_n이 낮은 동안 양방향으로 8 bit를 교환합니다. 선택되지 않은 target의 MISO는 실제 회로에서 high-impedance이며, 이 0/1 파형은 선택 구간의 논리값만 모델링합니다.</p>';
        } else if (type === 'i2c') {
            const d=v.scenario==='read'&&!fault?D.i2cRead(v.address,v.value,60,v.stretch):M.i2cWrite(v.address,v.value,fault,v.stretch); maxCycle=d.samples.length-1;
            const annotations=[];for(let i=0;i<d.samples.length;i++){const label=d.samples[i].label;if(/^(ADDR|DATA).*b7$/.test(label)&&label!==d.samples[i-1]?.label)annotations.push({at:i+7.5,label:label.replace(/ b7$/,'')});else if(['START','REPEATED START','STOP'].includes(label))annotations.push({at:i,label:label==='REPEATED START'?'Sr':label,align:label==='START'?'start':label==='STOP'?'end':'middle'});else if(['ACK','NACK','MASTER NACK'].includes(label)&&d.samples[i].scl)annotations.push({at:i-.5,label:label==='MASTER NACK'?'NACK':label});}
            html=wave(['SCL','SDA'],[d.samples.map(x=>x.scl),d.samples.map(x=>x.sda)],cycle,annotations)+metrics({ '현재 구간':d.samples[Math.min(cycle,maxCycle)].label,'주소 byte':`0x${d.addressByte.toString(16).toUpperCase()}`,'Data':d.payload ?? 'NACK 후 전송 중단','수락':d.accepted?'ACK':'NACK' })+table(['시간 구간','SCL','SDA'],d.samples.map((x,i)=>[`${i}: ${x.label}`,x.scl,x.sda]));
            if(v.scenario==='arbitration'){const arb=D.arbitration(v.address,(v.address+1)&127,7);maxCycle=6;html=wave(['A','B','SDA'],[arb.rows.map(x=>x.a),arb.rows.map(x=>x.b),arb.rows.map(x=>x.bus)],cycle)+metrics({'승자':arb.winner,'탈락 bit':arb.lostAt})+table(['주소 bit','A','B','SDA','탈락'],arb.rows.map(x=>[x.bit,x.a,x.b,x.bus,x.loser||'—']))+'<p>두 controller가 동시에 주소를 전송합니다. 1을 내보내려 놓았지만 SDA=0이면 중재에서 탈락합니다.</p>';}
            html+='<h3>Open-drain과 pull-up 연결</h3>'+i2cCircuit();
        } else if(type==='dma') {
            const d=M.dmaTrace({...v,errorAt:fault?3:-1});maxCycle=d.rows.length-1; const current=d.rows[Math.min(cycle,maxCycle)];
            html=flow(['CPU descriptor','Read master','FIFO','Write master','IRQ'],Math.min(4,Math.floor(cycle/Math.max(1,maxCycle)*4)))+metrics({'현재 동작':current.event,'수락 byte':current.transferred,'남은 byte':current.remaining,IRQ:current.irq})+table(['Cycle','동작','수락 byte','남은 byte','IRQ'],d.rows.map(x=>[x.cycle,x.event,x.transferred,x.remaining,x.irq]));
            html+=flow(['D0 · SW 준비','D1 · HW 소유','D2 · 완료','D3 · 회수'],cycle%4,['next → D1','next → D2','next → D3','next → D0'])+'<p class="lesson-model-note">이 모델은 source·destination을 beat 크기에 정렬하도록 요구하며 위반 시 전송 전 거부합니다. Partial 마지막 beat는 허용합니다. 실제 IP의 unaligned 지원·4 KiB burst 분할은 별도 계약입니다. Descriptor ring은 소유권의 순환을 설명하며 이 단일 전송 trace가 네 요청을 동시에 실행하는 것은 아닙니다.</p>';
        } else if(type==='array') {
            const parse=text=>text.trim().split(/\n|;/).map(row=>row.trim().split(/[,\s]+/).map(Number));
            const A=parse(v.matrixA),B=parse(v.matrixB);
            const d=M.systolic(A,B,cycle);maxCycle=d.cycles-1;
            html=`<div class="matrix-inputs">${table(['A',...A[0].map((_,i)=>`col ${i}`)],A.map((r,i)=>[`row ${i}`,...r]))}${table(['B',...B[0].map((_,i)=>`col ${i}`)],B.map((r,i)=>[`row ${i}`,...r]))}</div>`+arrayView(d,cycle)+table(['Cycle','유효한 곱셈과 누산'],d.trace.map(x=>[x.cycle,x.active.map(a=>`PE(${a.i},${a.j}): ${a.a}×${a.b}`).join(' · ')]));
            html+='<h3>PE 내부의 곱셈과 누산 경로</h3>'+peDatapath();
        } else if(type==='quantize') {
            const d=M.quantize(v.value,v.scale,v.width,v.zero),left=v.value-4*v.scale,right=v.value+4*v.scale;
            const points=[];let previous=M.quantize(left,v.scale,v.width,v.zero).restored;points.push([left,previous]);
            for(let q=Math.ceil(left/v.scale-.5);(q+.5)*v.scale<right;q++){const x=(q+.5)*v.scale;if(x<=left)continue;const next=M.quantize(x+v.scale*1e-7,v.scale,v.width,v.zero).restored;points.push([x,previous],[x,next]);previous=next;}points.push([right,previous]);
            html=chart([{name:'이상값',points:[[left,left],[right,right]]},{name:'복원값',points}],{xLabel:'입력 x',yLabel:'복원 x′',caption:'현재 입력 주변의 양자화 계단입니다. 경계의 정확히 절반 값에는 ties-to-even을 적용합니다.'})+metrics({'정수값':d.integer,'복원값':d.restored,'오차':d.error,'포화':d.saturated?'예':'아니오'})+`<p class="lesson-equation">q = clamp(roundToEven(x / scale) + zero); x′ = (q − zero) × scale</p>`;
        } else if(type==='timing') {const d=M.timing(v);html=timingCircuit()+timingWindows(d,v)+metrics({'Arrival (ns)':d.arrival,'Required (ns)':d.required,'Setup slack (ns)':d.setupSlack,'Hold slack (ns)':d.holdSlack})+'<p class="lesson-equation">Setup slack = T + skew − uncertainty − setup − (tCQ + max data delay)<br>Hold slack = min tCQ + min data delay − skew − hold</p><p>이 예제는 max tCQ=0.5 ns, min tCQ=0.2 ns, setup=0.4 ns, uncertainty=0.1 ns, hold=0.2 ns를 사용합니다.</p>';
        } else if(type==='bandwidth') {const d=M.bandwidth(v);html=metrics({'Payload (Gb/s)':d.gbps,'Payload (GB/s)':d.gbytes,'전송 시간 (µs)':d.microseconds})+'<p class="lesson-equation">실효 대역폭 = lane rate × lane 수 × payload 비율</p><p>Payload 비율은 인코딩·패킷·유휴 구간을 포함한 이 예제의 가정입니다. 특정 규격의 고정 효율을 뜻하지 않습니다.</p>';
        } else if(type==='roofline') {const d=M.roofline({...v,operations:v.operations*1e6,bytes:v.bytes*1e6});html=chart([{name:'Roofline 상한',points:Array.from({length:51},(_,i)=>{const intensity=10**(-2+i/10);return [Math.log10(intensity),Math.log10(Math.min(v.peak,intensity*v.bandwidthGB))];})},{name:'현재 workload',points:[[Math.log10(d.intensity),Math.log10(d.performance)],[Math.log10(d.intensity)+.001,Math.log10(d.performance)]]}],{xLabel:'log₁₀ intensity (op/byte)',yLabel:'log₁₀ Gop/s'})+metrics({'Intensity (op/byte)':d.intensity,'상한 (Gop/s)':d.performance,'분류':d.bound,'이상적 시간 (ms)':d.milliseconds})+'<p class="lesson-equation">P ≤ min(Peak, Bandwidth × Intensity)</p><p>여기서는 1 MAC=2 op입니다. 예측 상한이며 제어·동기화·추가 지연은 포함하지 않습니다.</p>';
        } else if(type==='power') {const d=M.power(v);html=metrics({'Dynamic (mW)':d.dynamicMW,'Leakage (mW)':d.leakageMW,'Total (mW)':d.totalMW})+'<p class="lesson-equation">Pdynamic = α C V² f</p><p>Leakage=2 mA를 고정한 집중 소자 모델입니다. Short-circuit 전력과 실제 PVT 의존성은 별도 분석합니다.</p>';
        } else if(type==='rc') {const d=M.rc(v);html=metrics({'τ (ns)':d.tauNS,'10–90% rise (ns)':d.riseNS})+`<svg class="lesson-chart" viewBox="0 0 640 220" role="img" aria-label="RC 충전 곡선"><path d="M50 15V180H620" class="chart-axis"/><path d="${d.points.map((p,i)=>`${i?'L':'M'}${50+i*14} ${180-p.y/v.voltage*150}`).join(' ')}" class="wave-signal"/><text x="50" y="210">0</text><text x="540" y="210">5τ (${fmt(d.tauNS*5)} ns)</text><text x="10" y="25">V</text></svg><p class="lesson-equation">V(t) = VDD(1 − exp(−t/RC))</p>`;
        } else if(type==='tiling') {
            const d=M.tileBudget(v),nx=Math.ceil(v.n/v.tn),ny=Math.ceil(v.m/v.tm),shownX=Math.min(nx,16),shownY=Math.min(ny,16);
            const cellW=560/shownX,cellH=240/shownY;
            html=`<div class="lesson-diagram-scroll"><svg viewBox="0 0 740 320" role="img" aria-label="출력 행렬의 tile 격자"><text x="65" y="25">C: M=${v.m}, N=${v.n} · K 분할 ${d.axes[2].count}회</text>${Array.from({length:shownY},(_,i)=>Array.from({length:shownX},(_,j)=>{const row=i===shownY-1?ny-1:i,col=j===shownX-1?nx-1:j,tail=(row===ny-1&&v.m%v.tm)||(col===nx-1&&v.n%v.tn);return `<rect x="${65+j*cellW}" y="${40+i*cellH}" width="${cellW-2}" height="${cellH-2}" fill="${tail?'#bad8ff':'#eef5ff'}" stroke="#3182f6"/>`;}).join('')).join('')}<text x="65" y="307">${nx>16||ny>16?'각 축의 앞 15개와 마지막 tile을 표시합니다.':'진한 영역: 마지막 불완전 tile · 범위 밖 lane은 mask'}</text></svg></div>`+metrics({'Tile 작업 수':d.tiles,'Tile SRAM (byte)':d.storage,'용량 검사':d.fits?'PASS':'FAIL: SRAM 초과','MAC 수':d.macs,'Tail tile':d.tail?'필요':'없음'})+table(['축','전체 크기','Tile 크기','분할 수','마지막 유효 크기'],d.axes.map((a,i)=>[['M','N','K'][i],a.size,a.tile,a.count,a.last]))+'<p>입력·가중치는 INT8, partial sum은 INT32, 한 tile의 A/B/C 저장을 가정합니다. Double buffering과 metadata는 별도입니다. Tail의 범위 밖 load·store는 막고, K padding을 사용한다면 0으로 채웁니다.</p>';
        } else if(type==='kv') {html=metrics({'KV 용량 (MiB)':M.kvBytes(v)/(1024**2)})+'<p class="lesson-equation">KV bytes = 2 × batch × layers × tokens × KV heads × head dimension × bytes</p><p>batch=1인 단순 저장 모델입니다. KV head 수를 사용하며 allocator, padding, quantization metadata는 제외합니다.</p>';
        } else if(type==='cache') {const d=M.cacheTrace([0,4,16,0,64,0,20,80],v);maxCycle=d.rows.length-1;html=metrics({Hit:d.hits,Miss:d.misses})+table(['주소','Index','Tag','Offset','결과'],d.rows.map(x=>[x.address,x.index,x.tag,x.offset,x.hit?'HIT':'MISS']));
        } else if(type==='fifo') {fifo.depth=v.depth;html=metrics({'점유량':`${fifo.values.length}/${fifo.depth}`,'Write pointer':fifo.write,'Read pointer':fifo.read,'출력':fifo.output,'검사':fifo.error || '정상'})+`<div class="fifo-slots">${Array.from({length:fifo.depth},(_,i)=>`<span>${fifo.values[i]??'—'}</span>`).join('')}</div><p>Gray pointer W=${fifo.grayWrite??0}, R=${fifo.grayRead??0}. 이 화면은 논리적 queue 모델이며 metastability의 아날로그 동작을 시뮬레이션하지 않습니다.</p>`;
        } else if(type==='irq') {html=flow(['Timer / peripheral','Pending','Mask gate','CPU ISR'],irq.irq?3:irq.pending?1:0)+metrics({Source:Number(irq.source),Pending:Number(irq.pending),Mask:Number(irq.masked),IRQ:Number(irq.irq),'Timer count':irq.ticks||0,'Timer event':irq.events||0})+`<p>${v.trigger==='level'?'Level interrupt는 source가 남아 있으면 pending clear 뒤 다시 요청합니다.':'Rising edge는 source의 0→1만 latch합니다. Source clear 없이 이벤트를 다시 누르면 새로운 edge가 없습니다.'} Timer는 ${v.period} tick마다 이벤트를 만들며, edge 모드에서는 한 pulse로 처리합니다. Mask는 CPU 요청을 가리지만 pending을 지우지 않습니다.</p>`;
        } else {
            const steps=config.steps || [];maxCycle=Math.max(0,steps.length-1);
            html=flow(steps.map(s=>s[0]),Math.min(cycle,maxCycle))+`<ol class="lesson-sequence">${steps.map((s,i)=>`<li class="${i===Math.min(cycle,maxCycle)?'is-current':''}"><span>${i+1}</span><div><strong>${escape(s[0])}</strong><p>${escape(s[1])}</p></div></li>`).join('')}</ol>${fault?`<div class="lesson-fault"><strong>확인할 실패 조건</strong><p>${escape(config.fault || '입력과 완료 조건이 서로 맞는지 확인하고, 관측한 결과를 단계별로 기록합니다.')}</p></div>`:''}`;
        }
        root.querySelector('[data-lab-action="fault"]')?.setAttribute('aria-pressed',String(fault));
        result.innerHTML=html; const visual=root.querySelector('.lesson-lab-visual'); visual.replaceChildren(); const primary=result.querySelector('.lesson-wave-scroll')||result.querySelector('.pe-array')||result.querySelector('.lesson-diagram-scroll,.lesson-figure'); if(primary)visual.append(primary); status.textContent=maxCycle>0?`단계 ${Math.min(cycle,maxCycle)+1} / ${maxCycle+1}`:'입력 변경 시 재계산';
        for(const action of ['step','play']) root.querySelector(`[data-lab-action="${action}"]`).hidden=maxCycle<1;
        root.dispatchEvent(new CustomEvent('chipbook:lab-update',{bubbles:true,detail:{type,values:v,cycle,maxCycle,fault,fifo,irq,stalled,source}}));
        window.GuidebookPage.notifyHeight?.();
    }
    root.closest('[data-lesson-panel]')?.addEventListener('chipbook:visual-seek',event=>{
        const detail=event.detail;if(detail?.type!==type||maxCycle<1||stalled)return;
        const next=detail.reset?(type==='array'?-1:0):Math.min(maxCycle,Math.max(type==='array'?-1:0,Math.floor(detail.phase*(maxCycle+(type==='array'?1:0)))-(type==='array'?1:0)));
        if(next===cycle)return;
        stop();cycle=next;render('visual');
    });
    form.addEventListener('submit',e=>e.preventDefault());
    form.addEventListener('input',event=>{cycle=type==='array'?-1:0;stop();if(type==='fifo')fifo={depth:Number(read().depth),values:[],read:0,write:0,output:'—'};
        if(type==='irq')irq={source:false,pending:false,masked:false,level:read().trigger==='level',irq:false,ticks:0,events:0};
        if(type==='array'&&event.target.name==='size'){
            const n=Number(event.target.value);if(n>=2&&n<=4&&Number.isInteger(n))for(const [key,offset] of [['matrixA',0],['matrixB',n*n]])form.elements.namedItem(key).value=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>offset+i*n+j+1).join(',')).join('\n');
        }
        render();});
    root.addEventListener('click',event=>{
        const action=event.target.closest('[data-lab-action]')?.dataset.labAction;if(!action)return;
        if(action==='reset')form.reset();
        if(action==='step'&&!stalled)cycle=Math.min(cycle+1,maxCycle);
        if(action==='stall'){stalled=!stalled;event.target.setAttribute('aria-pressed',String(stalled));event.target.textContent=stalled?'Stall 해제':'Stall 전환';}
        if(action==='reset'){stop();cycle=type==='array'?-1:0;fault=false;stalled=false;root.querySelector('[data-lab-action="stall"]')?.setAttribute('aria-pressed','false');if(type==='array')root.querySelector('[data-lab-action="stall"]').textContent='Stall 전환';fifo={depth:read().depth||4,values:[],read:0,write:0,output:'—'};irq={source:false,pending:false,masked:false,level:true,irq:false};}
        if(action==='fault'){fault=!fault;root.querySelector('[data-lab-action="fault"]').setAttribute('aria-pressed',String(fault));cycle=0;}
        if(action==='play') {if(running)stop();else if(active){running=true;root.querySelector('[data-lab-action="play"]').textContent='정지';timer=setInterval(()=>{if(stalled)return;if(cycle>=maxCycle){stop();return;}cycle++;render();},650);}}
        if(type==='fifo'&&['read','write'].includes(action))fifo=M.fifoStep(fifo,action,read().value);
        if(type==='irq')irq=M.irqStep({...irq,level:read().trigger==='level',period:read().period},action);
        render();
    });
    window.GuidebookPage.registerLifecycle({root,start:()=>{active=true;},stop:()=>{active=false;stop();},destroy:stop});
    render();
}

window.GuidebookPage.registerInitializer(() => {
    document.querySelectorAll('[data-lesson-lab]').forEach(initLab);
    document.querySelectorAll('[data-lesson-answer]').forEach(button=>button.addEventListener('click',()=>{
        const answer=document.getElementById(button.dataset.lessonAnswer);answer.hidden=!answer.hidden;button.setAttribute('aria-expanded',String(!answer.hidden));window.GuidebookPage.notifyHeight?.();
    }));
    document.querySelectorAll('[data-lesson-complete]').forEach(button=>{
        const key=`chipbook.lesson.${button.dataset.lessonComplete}`;
        const sync=()=>{let done=false;try{done=localStorage.getItem(key)==='1';}catch{}button.setAttribute('aria-pressed',String(done));button.textContent=done?'학습 완료 취소':'이 절 학습 완료';};
        button.addEventListener('click',()=>{try{localStorage.setItem(key,button.getAttribute('aria-pressed')==='true'?'0':'1');}catch{}sync();});sync();
    });
    const reviewList=document.querySelector('[data-review-list]');
    if(reviewList){
        let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem('chipbook.review.bookmarks')||'[]'));}catch{}
        const rows=[...reviewList.querySelectorAll('[data-review-id]')];
        const search=document.querySelector('[data-review-search]'), chapter=document.querySelector('[data-review-chapter]'), queue=document.querySelector('[data-review-saved]');
        const filter=()=>{let visible=0;const query=(search.value||'').toLocaleLowerCase();rows.forEach(row=>{row.hidden=!(row.textContent.toLocaleLowerCase().includes(query)&&(!chapter.value||row.dataset.reviewChapterNumber===chapter.value));visible+=Number(!row.hidden);});document.querySelector('[data-review-count]').textContent=`${visible} / ${rows.length}개 질문`;};
        const sync=()=>{
            document.querySelectorAll('[data-review-bookmark]').forEach(button=>{const selected=saved.has(button.dataset.reviewBookmark);button.setAttribute('aria-pressed',String(selected));button.textContent=selected?'북마크 해제':'북마크';});
            if(queue){queue.replaceChildren(...rows.filter(row=>saved.has(row.dataset.reviewId)).map(row=>{const clone=row.cloneNode(true);clone.hidden=false;return clone;}));if(!queue.children.length)queue.textContent='복습할 질문의 북마크를 선택하면 여기에 모입니다.';}
        };
        document.addEventListener('click',event=>{const button=event.target.closest('[data-review-bookmark]');if(!button)return;const id=button.dataset.reviewBookmark;if(saved.has(id))saved.delete(id);else saved.add(id);try{localStorage.setItem('chipbook.review.bookmarks',JSON.stringify([...saved]));}catch{}sync();});
        search.addEventListener('input',filter);chapter.addEventListener('change',filter);filter();sync();
    }
    document.querySelectorAll('[data-review-note]').forEach(input=>{const key=`chipbook.review.note.${input.dataset.reviewNote}`;try{input.value=localStorage.getItem(key)||'';}catch{}input.addEventListener('input',()=>{try{localStorage.setItem(key,input.value);}catch{}});});
    document.querySelectorAll('[data-lesson-anchor]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const target=document.getElementById(link.dataset.lessonAnchor);if(!target)return;if(target.tagName==='DETAILS')target.open=true;window.GuidebookPage.scrollToElement(target);}));
    document.querySelectorAll('[data-glossary-search]').forEach(input=>input.addEventListener('input',()=>{const query=input.value.toLowerCase();document.querySelectorAll('[data-glossary-row]').forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(query));}));
    const requestedLegacy=new URLSearchParams(location.search).get('detail') || new URLSearchParams(location.search).get('section');
    if(requestedLegacy){const detail=[...document.querySelectorAll('[data-legacy-key]')].find(e=>e.dataset.legacyKey===requestedLegacy);if(detail)detail.open=true;}
});
if(document.body.dataset.curriculumEngine==='true') window.GuidebookPage.initActionSectionPage({defaultKey:document.body.dataset.defaultSection,panelSelector:'[data-lesson-panel]',panelKeyDataset:'lessonPanel',partNumber:Number(document.body.dataset.chapterNumber)});
if(document.body.dataset.curriculumMode==='scroll')window.GuidebookPageCustomToc=()=>({mode:'scroll',title:document.querySelector('.curriculum-chapter-head h1').textContent,items:[...document.querySelectorAll('[data-lesson-panel]')].map(node=>({key:node.dataset.lessonPanel,label:node.querySelector('h2').textContent,top:node.getBoundingClientRect().top+window.scrollY}))});
