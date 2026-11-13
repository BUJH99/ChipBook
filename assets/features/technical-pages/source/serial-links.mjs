import {bits,uartFrame,spiFrame} from '../../curriculum/source/models.mjs';
import {uartReceive} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox} from './figures.mjs';
import {outputCircuit} from './interface-basics.mjs';

const hex=n=>`0x${n.toString(16).toUpperCase().padStart(2,'0')}`;
export function uartFigure({value=165,parity='none',baud=115200,rxBaud=baud,badStop=false,compact=false}={}) {
    const data=uartFrame(value,parity),receiver=uartReceive(value,baud,rxBaud,parity,badStop);
    if(badStop)data.levels[data.levels.length-2]=0;
    const step=620/data.levels.length,x0=104,top=compact?40:73,bottom=top+32,sampleY=top+86;
    let s=tx(6,top+18,'TXD','class="label blue"')+tx(6,sampleY+4,'RX sample','class="small"');
    data.labels.forEach((label,i)=>{
        const x=x0+i*step,color=label==='START'?'#fff0f5':label==='STOP'?'#eafaf4':'#f3f8ff';
        s+=rect(x,compact?8:25,step-1,compact?20:35,color,'none',4);
        s+=tx(x+step/2,compact?23:46,label.startsWith('D')?`${label}: ${data.levels[i]}`:label,'text-anchor="middle" class="small"');
        s+=wire(`M${x} ${top-4}V${sampleY+12}`,'#d9e4ef',.7,'stroke-dasharray="4 4"');
    });
    s+=wire(data.levels.map((level,i)=>i?`H${x0+i*step}V${level?top:bottom}`:`M${x0} ${level?top:bottom}`).join('')+`H${x0+data.levels.length*step}`,C.blue,2);
    receiver.samples.forEach(sample=>{
        const x=x0+(1+sample.time)*step;if(x>x0+620)return;
        s+=arrow(x,sampleY+8,x,top+45,badStop||receiver.framingError?C.red:C.green,1.5);
    });
    if(!compact){s+=wire(`M${x0+step} ${sampleY+32}H${x0+(data.durationBits+1)*step}`,'#385a80',1.2)+tx(x0+step*(data.durationBits/2+1),sampleY+55,`${data.durationBits} bit × ${fmt(1e6/baud)} µs = ${fmt(data.durationBits/baud*1e6)} µs`,'text-anchor="middle" class="small"');}
    return svg(750,compact?172:260,`UART ${hex(value)} 송신과 ${fmt(rxBaud)} baud 수신 샘플`,s);
}

function shiftRegister(x,y,value,label,color) {
    return tx(x+128,y-10,label,'text-anchor="middle" class="small label"')+bits(value).map((b,i)=>rect(x+i*32,y,31,33,'#fff','#adbed3',0)+tx(x+i*32+15.5,y+22,String(b),'text-anchor="middle"')).join('');
}
export function spiStructure(value=166,received=60) {
    let s=labeledBox(16,20,287,290,'','','#86baff','#f2f7ff')+labeledBox(737,20,287,290,'','','#81d1b7','#effaf6');
    s+=tx(159,48,'SPI Controller','text-anchor="middle" class="label blue"')+tx(881,48,'SPI Device','text-anchor="middle" class="label green"');
    s+=shiftRegister(31,96,value,'Transmit shift register',C.blue)+shiftRegister(31,228,received,'Receive shift register',C.green)+shiftRegister(753,96,value,'Receive shift register',C.blue)+shiftRegister(753,228,received,'Transmit shift register',C.green);
    s+=arrow(303,112,737,112,C.blue)+tx(394,103,'MOSI · Controller → Device','class="small blue"');
    s+=arrow(737,244,303,244,C.green)+tx(393,235,'MISO · Device → Controller','class="small green"');
    s+=arrow(303,156,737,156,C.orange)+tx(394,147,'SCLK · Controller → Device','class="small" style="fill:#b8791f"');
    s+=arrow(303,198,737,198,C.purple)+tx(394,189,'CS_n · Controller → Device','class="small purple"');
    return svg(1040,330,'서로 연결되지 않은 MOSI MISO SCLK CS와 양방향 8비트 shift register',s);
}

export function spiTiming(mode=0,value=166,received=60) {
    const d=spiFrame(value,mode,received),step=24.5,x0=77;
    let s='';
    [['SCLK',d.clock,45,C.blue],['MOSI',d.mosi,115,C.green],['MISO',d.miso,185,C.purple]].forEach(([name,levels,y,color])=>{
        s+=tx(0,y+18,name,'class="label small"');
        s+=wire(levels.map((b,i)=>i?`H${x0+i*step}V${y+(b?0:25)}`:`M${x0} ${y+(b?0:25)}`).join(''),color,1.8);
        if(name!=='SCLK')d.samples.forEach((at,i)=>s+=tx(x0+at*step,y-10,`b${7-i}: ${levels[at]}`,'text-anchor="middle" class="small"'));
    });
    d.samples.forEach(at=>{const x=x0+at*step;s+=wire(`M${x} 31V222`,'#83b6fa',.9,'stroke-dasharray="3 4"')+arrow(x,87,x,70,C.blue,1.3);});
    s+=tx(80,252,`CPOL=${d.cpol} · CPHA=${d.cpha} · ${d.cpha?'두 번째':'첫 번째'} ${d.cpol===d.cpha?'rising':'falling'} edge에서 sample`,'class="small blue"');
    return svg(550,272,`SPI mode ${mode}의 clock, MOSI, MISO와 8개 sampling edge`,s);
}

export function initUart(root) {
    const form=root.querySelector('[data-uart-inputs]');
    const update=()=>{
        if(!form.checkValidity())return;
        const f=Object.fromEntries(new FormData(form)),v={value:Number(f.value),parity:f.parity,baud:Number(f.baud),rxBaud:Number(f.rxBaud)};
        const d=uartFrame(v.value,v.parity),rx=uartReceive(v.value,v.baud,v.rxBaud,v.parity);
        root.querySelector('[data-uart-main]').innerHTML=uartFigure({...v,rxBaud:v.baud});
        root.querySelector('[data-uart-summary]').innerHTML=table(['항목','현재 조건'],[['데이터',hex(v.value)],['전송 순서',bits(v.value,8,true).join(', ')],['프레임 구성',`Start(1) + Data(8)${v.parity==='none'?'':' + Parity(1)'} + Stop(1)`],['총 bit 수',d.durationBits],['전송 시간',`${fmt(d.durationBits/v.baud*1e6)} µs`],['Payload 비율',`${fmt(800/d.durationBits)}%`]]);
        root.querySelector('[data-uart-normal]').innerHTML=uartFigure({...v,rxBaud:v.baud,compact:true});
        root.querySelector('[data-uart-mismatch]').innerHTML=uartFigure({...v,compact:true});
        root.querySelector('[data-uart-framing]').innerHTML=uartFigure({...v,rxBaud:v.baud,badStop:true,compact:true});
        root.querySelector('[data-uart-mismatch-result]').innerHTML=`<strong>Baud 오차 ${fmt(rx.mismatch)}%</strong><p>복원 byte: ${hex(rx.decoded)}<br>${rx.framingError?'Framing error':rx.parityError?'Parity error':'이 예제에서는 정상 복원'}</p>`;
        window.GuidebookPage.notifyHeight?.();
    };
    form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',update);update();
    root.querySelector('[data-uart-push-pull]').innerHTML=outputCircuit('push-pull',{small:true});
    root.querySelector('[data-uart-open-drain]').innerHTML=outputCircuit('open-drain',{small:true});
}

export function initSpi(root) {
    const form=root.querySelector('[data-spi-inputs]');
    const update=()=>{
        if(!form.checkValidity())return;const v=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,Number(v)]));
        root.querySelector('[data-spi-structure]').innerHTML=spiStructure(v.value,v.received);
        root.querySelectorAll('[data-spi-mode]').forEach(host=>host.innerHTML=spiTiming(Number(host.dataset.spiMode),v.value,v.received));
        const clocks=8+Math.ceil(24/v.addressLanes)+v.dummy+Math.ceil(v.bytes*8/v.dataLanes),ns=clocks/v.frequency*1000;
        root.querySelector('[data-qspi-ledger]').innerHTML=table(['구간','전송 bit','IO 폭','소요 clock'],[['Command',8,1,8],['Address',24,v.addressLanes,Math.ceil(24/v.addressLanes)],['Dummy','—','—',v.dummy],['Data',v.bytes*8,v.dataLanes,Math.ceil(v.bytes*8/v.dataLanes)],['합계',`Payload ${v.bytes*8}`,'—',clocks]]);
        root.querySelector('[data-qspi-result]').innerHTML=`<small>전체 전송 시간 · ${fmt(v.frequency)} MHz</small>${fmt(ns)} ns<small>유효 payload 대역폭</small>${fmt(v.bytes/ns*1000)} MB/s`;
        window.GuidebookPage.notifyHeight?.();
    };
    form.addEventListener('submit',e=>e.preventDefault());root.addEventListener('input',e=>{if(e.target.form===form)update();});update();
}
